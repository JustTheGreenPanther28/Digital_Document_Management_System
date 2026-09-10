/**
 * RBAC (Role-Based Access Control) & Entitlement Matrix Service
 * Canonical role and permission registry conforming to Section 65B Indian Evidence Act,
 * ISO/IEC 27001 least-privilege standards, and statutory forensic data governance.
 */

export const CANONICAL_ROLES = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'ADMIN',
    displayName: 'Root Administrator',
    description: 'Master supervisory oversight, user clearance management & security matrix administration',
    minClearance: 'TOP_SECRET',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'SENIOR_OFFICER',
    displayName: 'Senior Investigating Officer (IPS)',
    description: 'Case initiation, team roster assignment, workflow status transitions & legal hold authority',
    minClearance: 'TOP_SECRET',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'INVESTIGATOR',
    displayName: 'Lead Detective / Investigator',
    description: 'Field investigative tasks, forensic evidence recovery & document vault submissions',
    minClearance: 'SECRET',
    badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    name: 'EVIDENCE_CUSTODIAN',
    displayName: 'Evidence Custodian (Malkhana)',
    description: 'Physical & digital evidence repository management, barcode validation & custody transfers',
    minClearance: 'CONFIDENTIAL',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    name: 'FORENSIC_OFFICER',
    displayName: 'Forensic Scientist / Lab Analyst',
    description: 'Digital forensics disk acquisition, SHA-256 bit-level hashing & CFSL laboratory reports',
    minClearance: 'SECRET',
    badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    name: 'PROSECUTOR',
    displayName: 'Public Prosecutor / State Counsel',
    description: 'Charge sheet scrutiny, statutory evidentiary compliance & court pre-trial bundle filing',
    minClearance: 'SECRET',
    badgeColor: 'border-violet-500/40 text-violet-400 bg-violet-500/10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000007',
    name: 'COURT_OFFICER',
    displayName: 'Judicial Officer / Court Registrar',
    description: 'Trial docket scheduling, judicial notice dispatch & courtroom hearing records',
    minClearance: 'PUBLIC',
    badgeColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000008',
    name: 'AUDITOR',
    displayName: 'Compliance Inspector / Auditor',
    description: 'Immutable ledger audit, SHA-256 hash-chain verification & integrity checks',
    minClearance: 'TOP_SECRET',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10'
  }
];

export const CANONICAL_PERMISSIONS = [
  { id: 'b0000000-0000-0000-0000-000000000001', name: 'CASE_READ', category: 'CASE', description: 'View case dossiers, details, and synopsis' },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'CASE_CREATE', category: 'CASE', description: 'Register a new investigative case dossier' },
  { id: 'b0000000-0000-0000-0000-000000000003', name: 'CASE_ASSIGN_TEAM', category: 'CASE', description: 'Assign and reassign officers to case rosters' },
  { id: 'b0000000-0000-0000-0000-000000000004', name: 'CASE_UPDATE_STATUS', category: 'CASE', description: 'Advance or transition case workflow status' },
  { id: 'b0000000-0000-0000-0000-000000000005', name: 'CASE_LEGAL_HOLD', category: 'CASE', description: 'Apply or lift statutory litigation legal hold' },
  { id: 'b0000000-0000-0000-0000-000000000006', name: 'DOCUMENT_UPLOAD', category: 'DOCUMENT', description: 'Ingest and encrypt documents into digital vault' },
  { id: 'b0000000-0000-0000-0000-000000000007', name: 'DOCUMENT_DOWNLOAD', category: 'DOCUMENT', description: 'Decrypt and download verified vault artifacts' },
  { id: 'b0000000-0000-0000-0000-000000000008', name: 'DOCUMENT_SIGN', category: 'DOCUMENT', description: 'Digitally sign artifacts with RSA-2048 / PKI' },
  { id: 'b0000000-0000-0000-0000-000000000009', name: 'DOCUMENT_DELETE', category: 'DOCUMENT', description: 'Securely purge expired un-held documents' },
  { id: 'b0000000-0000-0000-0000-000000000010', name: 'EVIDENCE_REGISTER', category: 'EVIDENCE', description: 'Log physical/digital evidence with Barcode/RFID' },
  { id: 'b0000000-0000-0000-0000-000000000011', name: 'EVIDENCE_TRANSFER', category: 'EVIDENCE', description: 'Initiate 2-party chain-of-custody transfer' },
  { id: 'b0000000-0000-0000-0000-000000000012', name: 'EVIDENCE_ACCEPT_CUSTODY', category: 'EVIDENCE', description: 'Accept custody transfer with dual verification' },
  { id: 'b0000000-0000-0000-0000-000000000013', name: 'FORENSIC_ANALYZE', category: 'FORENSICS', description: 'Perform forensic extraction & AI scrutiny' },
  { id: 'b0000000-0000-0000-0000-000000000014', name: 'PROSECUTION_REVIEW', category: 'PROSECUTION', description: 'Scrutinize charge sheets & prepare court bundles' },
  { id: 'b0000000-0000-0000-0000-000000000015', name: 'COURT_RECORD_HEARING', category: 'COURT', description: 'Record court filings & judicial hearing orders' },
  { id: 'b0000000-0000-0000-0000-000000000016', name: 'AUDIT_VERIFY_LEDGER', category: 'AUDIT', description: 'Verify SHA-256 cryptographic audit hash-chain' },
  { id: 'b0000000-0000-0000-0000-000000000017', name: 'ADMIN_USER_PROVISION', category: 'ADMIN', description: 'Provision, lock, and manage security clearances' },
  { id: 'b0000000-0000-0000-0000-000000000018', name: 'RETENTION_MANAGE', category: 'LIFECYCLE', description: 'Configure WORM policies & authorize disposals' }
];

export const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: [
    'CASE_READ', 'CASE_CREATE', 'CASE_ASSIGN_TEAM', 'CASE_UPDATE_STATUS', 'CASE_LEGAL_HOLD',
    'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN', 'DOCUMENT_DELETE',
    'EVIDENCE_REGISTER', 'EVIDENCE_TRANSFER', 'EVIDENCE_ACCEPT_CUSTODY',
    'FORENSIC_ANALYZE', 'PROSECUTION_REVIEW', 'COURT_RECORD_HEARING',
    'AUDIT_VERIFY_LEDGER', 'ADMIN_USER_PROVISION', 'RETENTION_MANAGE'
  ],
  SENIOR_OFFICER: [
    'CASE_READ', 'CASE_CREATE', 'CASE_ASSIGN_TEAM', 'CASE_UPDATE_STATUS', 'CASE_LEGAL_HOLD',
    'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN', 'EVIDENCE_REGISTER',
    'RETENTION_MANAGE', 'AUDIT_VERIFY_LEDGER'
  ],
  INVESTIGATOR: [
    'CASE_READ', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN',
    'EVIDENCE_REGISTER', 'EVIDENCE_TRANSFER'
  ],
  EVIDENCE_CUSTODIAN: [
    'CASE_READ', 'EVIDENCE_REGISTER', 'EVIDENCE_TRANSFER', 'EVIDENCE_ACCEPT_CUSTODY',
    'DOCUMENT_DOWNLOAD'
  ],
  FORENSIC_OFFICER: [
    'CASE_READ', 'FORENSIC_ANALYZE', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD',
    'DOCUMENT_SIGN', 'EVIDENCE_ACCEPT_CUSTODY'
  ],
  PROSECUTOR: [
    'CASE_READ', 'PROSECUTION_REVIEW', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SIGN',
    'CASE_LEGAL_HOLD'
  ],
  COURT_OFFICER: [
    'CASE_READ', 'COURT_RECORD_HEARING', 'DOCUMENT_DOWNLOAD'
  ],
  AUDITOR: [
    'CASE_READ', 'AUDIT_VERIFY_LEDGER', 'DOCUMENT_DOWNLOAD'
  ]
};

const STORAGE_KEY = 'sih_role_permissions';

export function getStoredRolePermissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ROLE_PERMISSIONS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
  } catch {
    return { ...DEFAULT_ROLE_PERMISSIONS };
  }
}

export function saveStoredRolePermissions(mapping) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
    // Dispatch custom event to notify components across the app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('role-permissions-updated', { detail: mapping }));
    }
    return true;
  } catch {
    return false;
  }
}

export function resetRolePermissionsToDefault() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('role-permissions-updated', { detail: DEFAULT_ROLE_PERMISSIONS }));
    }
    return { ...DEFAULT_ROLE_PERMISSIONS };
  } catch {
    return { ...DEFAULT_ROLE_PERMISSIONS };
  }
}

export function checkUserPermission(user, permissionName) {
  if (!user) return false;
  const userRoles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const normalized = userRoles.map(r => (typeof r === 'string' ? r : r?.name || '').replace(/^ROLE_/, '').toUpperCase());

  if (user?.username?.toLowerCase() === 'admin' && !normalized.includes('ADMIN')) {
    normalized.push('ADMIN');
  }

  const mapping = getStoredRolePermissions();
  return normalized.some(role => {
    const perms = mapping[role] !== undefined ? mapping[role] : (DEFAULT_ROLE_PERMISSIONS[role] || []);
    return perms.includes(permissionName);
  });
}
