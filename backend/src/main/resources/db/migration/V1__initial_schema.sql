-- V1__initial_schema.sql
-- SIH Problem 190 - Secure Digital Case Management, Document Management & Evidence Chain-of-Custody System
-- PostgreSQL Schema with UUID Primary Keys, Audit & Tamper Evident Columns

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    badge_number VARCHAR(50),
    department VARCHAR(100),
    security_clearance VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    enabled BOOLEAN NOT NULL DEFAULT true,
    account_locked BOOLEAN NOT NULL DEFAULT false,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lock_time TIMESTAMP,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- 3. User Roles Junction
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cases Table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    fir_number VARCHAR(100) UNIQUE,
    incident_date TIMESTAMP,
    registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    investigating_agency VARCHAR(100) NOT NULL DEFAULT 'Central Investigative Bureau',
    status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    classification VARCHAR(20) NOT NULL DEFAULT 'CONFIDENTIAL',
    created_by UUID REFERENCES users(id),
    is_legal_hold BOOLEAN NOT NULL DEFAULT false,
    legal_hold_reason TEXT,
    legal_hold_by UUID REFERENCES users(id),
    closed_at TIMESTAMP,
    closed_by UUID REFERENCES users(id),
    retention_period_days INT NOT NULL DEFAULT 3650,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Case User Assignments (ABAC Anchor)
CREATE TABLE IF NOT EXISTS case_user_assignments (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_case VARCHAR(50) NOT NULL,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT true
);

-- 7. Case Status History (State Machine Audit)
CREATE TABLE IF NOT EXISTS case_status_history (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_object_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    classification VARCHAR(20) NOT NULL DEFAULT 'CONFIDENTIAL',
    current_version INT NOT NULL DEFAULT 1,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMP,
    locked_by UUID REFERENCES users(id),
    quarantine_status VARCHAR(20) NOT NULL DEFAULT 'CLEAN',
    encryption_iv VARCHAR(64) NOT NULL,
    encryption_algorithm VARCHAR(30) NOT NULL DEFAULT 'AES-256-GCM',
    kms_key_id VARCHAR(100) NOT NULL DEFAULT 'kms-key-vault-primary',
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Document Versions Table (Immutable)
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    storage_object_key VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    change_summary TEXT,
    uploaded_by UUID REFERENCES users(id),
    encryption_iv VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Digital Signatures Table
CREATE TABLE IF NOT EXISTS digital_signatures (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    signer_id UUID NOT NULL REFERENCES users(id),
    signer_role VARCHAR(50) NOT NULL,
    signature_algorithm VARCHAR(50) NOT NULL DEFAULT 'SHA256withRSA',
    digital_signature_value TEXT NOT NULL,
    certificate_serial VARCHAR(100) NOT NULL,
    signed_hash VARCHAR(64) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT true,
    signed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY,
    evidence_number VARCHAR(50) UNIQUE NOT NULL,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(50) NOT NULL,
    collected_by UUID REFERENCES users(id),
    collected_at TIMESTAMP NOT NULL,
    seizure_location VARCHAR(255),
    seal_number VARCHAR(100) NOT NULL,
    seal_intact BOOLEAN NOT NULL DEFAULT true,
    storage_location VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
    current_custodian_id UUID REFERENCES users(id),
    associated_document_id UUID REFERENCES documents(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Custody Records Table (Chain of Custody Append-Only Log)
CREATE TABLE IF NOT EXISTS custody_records (
    id UUID PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    from_custodian_id UUID REFERENCES users(id),
    to_custodian_id UUID REFERENCES users(id),
    seal_number VARCHAR(100),
    seal_verified BOOLEAN NOT NULL DEFAULT true,
    reason TEXT NOT NULL,
    digital_signature TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Evidence Transfers Table (Two-party workflow)
CREATE TABLE IF NOT EXISTS evidence_transfers (
    id UUID PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    seal_number VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actioned_at TIMESTAMP,
    action_notes TEXT,
    acceptance_signature TEXT
);

-- 14. Forensic Reports Table
CREATE TABLE IF NOT EXISTS forensic_reports (
    id UUID PRIMARY KEY,
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    examiner_id UUID NOT NULL REFERENCES users(id),
    document_id UUID REFERENCES documents(id),
    laboratory_name VARCHAR(255) NOT NULL DEFAULT 'Central Forensic Science Laboratory',
    tools_utilized TEXT,
    examination_summary TEXT NOT NULL,
    findings TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Charge Sheets Table
CREATE TABLE IF NOT EXISTS charge_sheets (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id),
    prepared_by UUID REFERENCES users(id),
    senior_officer_id UUID REFERENCES users(id),
    senior_officer_approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    senior_officer_review_notes TEXT,
    senior_officer_reviewed_at TIMESTAMP,
    prosecutor_id UUID REFERENCES users(id),
    prosecutor_approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    prosecutor_review_notes TEXT,
    prosecutor_approved_at TIMESTAMP,
    signature_id UUID REFERENCES digital_signatures(id),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Court Filings Table
CREATE TABLE IF NOT EXISTS court_filings (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    court_name VARCHAR(255) NOT NULL,
    filing_number VARCHAR(100) UNIQUE NOT NULL,
    filed_by UUID REFERENCES users(id),
    court_officer_id UUID REFERENCES users(id),
    filing_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'FILED'
);

-- 17. Court Proceedings Table
CREATE TABLE IF NOT EXISTS court_proceedings (
    id UUID PRIMARY KEY,
    filing_id UUID NOT NULL REFERENCES court_filings(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    hearing_date TIMESTAMP NOT NULL,
    judge_name VARCHAR(100) NOT NULL,
    proceedings_summary TEXT NOT NULL,
    next_hearing_date TIMESTAMP,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. Judgments Table
CREATE TABLE IF NOT EXISTS judgments (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    filing_id UUID NOT NULL REFERENCES court_filings(id) ON DELETE CASCADE,
    verdict VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    judgment_date TIMESTAMP NOT NULL,
    judge_name VARCHAR(100) NOT NULL,
    document_id UUID REFERENCES documents(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. Tamper-Evident Hash-Chained Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    actor_id UUID,
    actor_username VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    case_id UUID,
    target_entity VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    action_details TEXT,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    timestamp_ms BIGINT NOT NULL DEFAULT 0
);

-- 20. Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    source_ip VARCHAR(50),
    actor_username VARCHAR(100),
    case_id UUID,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 21. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 22. Legal Holds Table
CREATE TABLE IF NOT EXISTS legal_holds (
    id UUID PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    placed_by UUID NOT NULL REFERENCES users(id),
    placed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lifted_at TIMESTAMP,
    lifted_by UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for performance and security lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_case_user_assignments_case_user ON case_user_assignments(case_id, user_id, active);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_custodian ON evidence(current_custodian_id);
CREATE INDEX IF NOT EXISTS idx_custody_records_evidence ON custody_records(evidence_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_case ON audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved, severity);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
