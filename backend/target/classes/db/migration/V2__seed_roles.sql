-- V2__seed_roles.sql
-- Seed standard roles for SIH Problem 190

INSERT INTO roles (id, name, description) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'ADMIN', 'System administration, user provisioning, global auditing'),
    ('a0000000-0000-0000-0000-000000000002', 'SENIOR_OFFICER', 'Case creation, team assignment, supervisory reviews'),
    ('a0000000-0000-0000-0000-000000000003', 'INVESTIGATOR', 'Assigned case investigation, evidence intake, notes'),
    ('a0000000-0000-0000-0000-000000000004', 'EVIDENCE_CUSTODIAN', 'Physical and digital evidence custody, transfer workflows'),
    ('a0000000-0000-0000-0000-000000000005', 'FORENSIC_OFFICER', 'Forensic examination, artifact analysis, laboratory reports'),
    ('a0000000-0000-0000-0000-000000000006', 'PROSECUTOR', 'Legal scrutiny, charge sheet review, digital signing'),
    ('a0000000-0000-0000-0000-000000000007', 'COURT_OFFICER', 'Court filings, trial proceedings, judgment records'),
    ('a0000000-0000-0000-0000-000000000008', 'AUDITOR', 'Independent audit log inspection, chain verification, compliance')
ON CONFLICT (name) DO NOTHING;
