-- V3__enterprise_compliance_schema.sql
-- SIH Problem 190 - Enterprise Compliance, Permissions Matrix & Data Lifecycle Schema

-- 1. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 3. Document-Level Permissions Table
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_level VARCHAR(30) NOT NULL DEFAULT 'READ', -- READ, WRITE, SIGN, DELETE
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 4. Evidence Documents Relationship Junction Table
CREATE TABLE IF NOT EXISTS evidence_documents (
    id UUID PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'CHAIN_OF_CUSTODY_DOC', -- FORENSIC_EXTRACT, CHAIN_OF_CUSTODY_DOC, LAB_REPORT, COURT_EXHIBIT
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evidence_document UNIQUE (evidence_id, document_id)
);

-- 5. Retention Policies Table
CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    retention_years INT NOT NULL DEFAULT 10,
    classification VARCHAR(20) NOT NULL DEFAULT 'CONFIDENTIAL',
    action_on_expiry VARCHAR(50) NOT NULL DEFAULT 'SECURE_DISPOSAL', -- SECURE_DISPOSAL, ARCHIVE_COLD_STORAGE, LEGAL_REVIEW
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Disposal Records Table (Cryptographic Chain of Destruction)
CREATE TABLE IF NOT EXISTS disposal_records (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    evidence_id UUID REFERENCES evidence(id) ON DELETE SET NULL,
    disposal_method VARCHAR(50) NOT NULL DEFAULT 'CRYPTOGRAPHIC_ERASURE', -- CRYPTOGRAPHIC_ERASURE, PHYSICAL_DESTRUCTION, OVERWRITE_DOD_5220
    disposed_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID NOT NULL REFERENCES users(id),
    certificate_hash VARCHAR(64) NOT NULL,
    certificate_path VARCHAR(500),
    disposal_notes TEXT,
    disposed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Multi-Tier Approvals Persistence Table
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL, -- CASE_CLOSURE, EVIDENCE_DISPOSAL, CHARGE_SHEET, LEGAL_HOLD_RELEASE, RETENTION_OVERRIDE
    target_entity_type VARCHAR(50) NOT NULL, -- CASE, DOCUMENT, EVIDENCE, CHARGE_SHEET
    target_entity_id UUID NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, ESCALATED
    review_notes TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- 8. MFA Credentials Persistence Table (Separated from Users for Security Schema Compliance)
CREATE TABLE IF NOT EXISTS mfa_credentials (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    scratch_codes TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    CONSTRAINT uq_mfa_user UNIQUE (user_id)
);

-- 9. Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Seed Core Permissions
INSERT INTO permissions (id, name, category, description) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'CASE_READ', 'CASE', 'View case details and history'),
    ('b0000000-0000-0000-0000-000000000002', 'CASE_CREATE', 'CASE', 'Register a new investigative case'),
    ('b0000000-0000-0000-0000-000000000003', 'CASE_ASSIGN_TEAM', 'CASE', 'Assign and reassign officers to a case'),
    ('b0000000-0000-0000-0000-000000000004', 'CASE_UPDATE_STATUS', 'CASE', 'Advance or modify case status in workflow'),
    ('b0000000-0000-0000-0000-000000000005', 'CASE_LEGAL_HOLD', 'CASE', 'Apply or release legal hold on case and evidence'),
    ('b0000000-0000-0000-0000-000000000006', 'DOCUMENT_UPLOAD', 'DOCUMENT', 'Ingest and encrypt documents into vault'),
    ('b0000000-0000-0000-0000-000000000007', 'DOCUMENT_DOWNLOAD', 'DOCUMENT', 'Decrypt and download evidence documents'),
    ('b0000000-0000-0000-0000-000000000008', 'DOCUMENT_SIGN', 'DOCUMENT', 'Digitally sign documents using RSA-2048 PKI'),
    ('b0000000-0000-0000-0000-000000000009', 'DOCUMENT_DELETE', 'DOCUMENT', 'Securely purge documents'),
    ('b0000000-0000-0000-0000-000000000010', 'EVIDENCE_REGISTER', 'EVIDENCE', 'Log physical or digital evidence with barcode'),
    ('b0000000-0000-0000-0000-000000000011', 'EVIDENCE_TRANSFER', 'EVIDENCE', 'Initiate two-party chain-of-custody transfer'),
    ('b0000000-0000-0000-0000-000000000012', 'EVIDENCE_ACCEPT_CUSTODY', 'EVIDENCE', 'Accept custody transfer with counter-signature'),
    ('b0000000-0000-0000-0000-000000000013', 'FORENSIC_ANALYZE', 'FORENSICS', 'Perform forensic extraction and lab reporting'),
    ('b0000000-0000-0000-0000-000000000014', 'PROSECUTION_REVIEW', 'PROSECUTION', 'Scrutinize charge-sheets and build trial bundles'),
    ('b0000000-0000-0000-0000-000000000015', 'COURT_RECORD_HEARING', 'COURT', 'Record court filings and judicial hearing dispositions'),
    ('b0000000-0000-0000-0000-000000000016', 'AUDIT_VERIFY_LEDGER', 'AUDIT', 'Verify SHA-256 cryptographic audit ledger integrity'),
    ('b0000000-0000-0000-0000-000000000017', 'ADMIN_USER_PROVISION', 'ADMIN', 'Provision, lock, and manage security clearance of users'),
    ('b0000000-0000-0000-0000-000000000018', 'RETENTION_MANAGE', 'LIFECYCLE', 'Configure retention policies and authorize disposals')
ON CONFLICT (name) DO NOTHING;

-- 11. Map Permissions to Standard Roles
-- ADMIN: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT DO NOTHING;

-- SENIOR_OFFICER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000002', id FROM permissions 
WHERE name IN ('CASE_READ', 'CASE_CREATE', 'CASE_ASSIGN_TEAM', 'CASE_UPDATE_STATUS', 'CASE_LEGAL_HOLD', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN', 'EVIDENCE_REGISTER', 'RETENTION_MANAGE', 'AUDIT_VERIFY_LEDGER')
ON CONFLICT DO NOTHING;

-- INVESTIGATOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000003', id FROM permissions 
WHERE name IN ('CASE_READ', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN', 'EVIDENCE_REGISTER', 'EVIDENCE_TRANSFER')
ON CONFLICT DO NOTHING;

-- EVIDENCE_CUSTODIAN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000004', id FROM permissions 
WHERE name IN ('CASE_READ', 'EVIDENCE_REGISTER', 'EVIDENCE_TRANSFER', 'EVIDENCE_ACCEPT_CUSTODY', 'DOCUMENT_DOWNLOAD')
ON CONFLICT DO NOTHING;

-- FORENSIC_OFFICER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000005', id FROM permissions 
WHERE name IN ('CASE_READ', 'FORENSIC_ANALYZE', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN', 'EVIDENCE_ACCEPT_CUSTODY')
ON CONFLICT DO NOTHING;

-- PROSECUTOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000006', id FROM permissions 
WHERE name IN ('CASE_READ', 'PROSECUTION_REVIEW', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN', 'CASE_LEGAL_HOLD')
ON CONFLICT DO NOTHING;

-- COURT_OFFICER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000007', id FROM permissions 
WHERE name IN ('CASE_READ', 'COURT_RECORD_HEARING', 'DOCUMENT_DOWNLOAD')
ON CONFLICT DO NOTHING;

-- AUDITOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000008', id FROM permissions 
WHERE name IN ('CASE_READ', 'AUDIT_VERIFY_LEDGER', 'DOCUMENT_DOWNLOAD')
ON CONFLICT DO NOTHING;

-- 12. Seed Standard Retention Policies
INSERT INTO retention_policies (id, name, description, retention_years, classification, action_on_expiry, active) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'CRIMINAL_HOMISIDE_PERMANENT', 'Permanent retention for major felony and homicide investigations', 50, 'TOP_SECRET', 'ARCHIVE_COLD_STORAGE', true),
    ('c0000000-0000-0000-0000-000000000002', 'STANDARD_FELONY_10YR', 'Standard 10-year statutory retention for felony evidence', 10, 'SECRET', 'SECURE_DISPOSAL', true),
    ('c0000000-0000-0000-0000-000000000003', 'MISDEMEANOR_5YR', '5-year retention for minor offences and infractions', 5, 'CONFIDENTIAL', 'SECURE_DISPOSAL', true)
ON CONFLICT (name) DO NOTHING;
