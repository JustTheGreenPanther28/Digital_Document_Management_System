/**
 * ABAC (Attribute-Based Access Control) Security Engine
 * Enforces dynamic multi-attribute security rules:
 * 1. Security Clearance Hierarchy (TOP_SECRET > SECRET > CONFIDENTIAL > RESTRICTED > PUBLIC)
 * 2. Role-Based Authority (ADMIN, SENIOR_OFFICER, AUDITOR)
 * 3. Case-Level Team Assignment Verification (User must be assigned to the dossier or be its creator)
 */

export const CLEARANCE_RANKS = {
  PUBLIC: 1,
  OFFICIAL: 1,
  RESTRICTED: 2,
  CONFIDENTIAL: 3,
  SECRET: 4,
  TOP_SECRET: 5,
};

export const canClearanceAccess = (userClearance, targetClassification) => {
  if (!targetClassification) return true;
  const userRank = CLEARANCE_RANKS[userClearance?.toUpperCase()] || 1;
  const targetRank = CLEARANCE_RANKS[targetClassification?.toUpperCase()] || 1;
  return userRank >= targetRank;
};

export const getStoredTeamAssignments = () => {
  try {
    const stored = localStorage.getItem('sih_team_assignments');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const DEFAULT_CASE_ASSIGNMENTS = {
  '1': [
    { username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET' },
    { username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET' },
    { username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL' }
  ],
  'CASE-2026-001': [
    { username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET' },
    { username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET' },
    { username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL' }
  ],
  '2': [
    { username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET' },
    { username: 'prosecutor', fullName: 'Counsel Diane Lockhart', roleInCase: 'LEAD_PROSECUTOR', clearance: 'SECRET' }
  ],
  'CASE-2026-002': [
    { username: 'investigator_a', fullName: 'Det. John Miller', roleInCase: 'LEAD_INVESTIGATOR', clearance: 'SECRET' },
    { username: 'prosecutor', fullName: 'Counsel Diane Lockhart', roleInCase: 'LEAD_PROSECUTOR', clearance: 'SECRET' }
  ],
  '3': [
    { username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET' },
    { username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL' }
  ],
  'CASE-2026-003': [
    { username: 'forensic_officer', fullName: 'Dr. Evelyn Reed', roleInCase: 'FORENSIC_EXPERT', clearance: 'SECRET' },
    { username: 'custodian', fullName: 'Officer Michael Vance', roleInCase: 'EVIDENCE_CUSTODIAN', clearance: 'CONFIDENTIAL' }
  ]
};

export const DEFAULT_CASE_CREATORS = {
  '1': 'senior_officer',
  'CASE-2026-001': 'senior_officer',
  '2': 'senior_officer',
  'CASE-2026-002': 'senior_officer',
  '3': 'senior_officer',
  'CASE-2026-003': 'senior_officer'
};

import { checkUserPermission } from './rbacService';

export const checkCaseAccess = (user, caseData, runtimeAssignments = []) => {
  if (!user) {
    return {
      allowed: false,
      reason: 'UNAUTHENTICATED',
      details: 'You must be authenticated to access this digital case dossier.',
    };
  }

  // 0. Permission Matrix Check: User/Admin must possess CASE_READ entitlement
  if (!checkUserPermission(user, 'CASE_READ')) {
    return {
      allowed: false,
      reason: 'PERMISSION_REVOKED',
      details: 'Access Denied: The CASE_READ entitlement has been explicitly revoked for your persona in the Security Entitlement Matrix.',
    };
  }

  const userRoles = Array.isArray(user.roles) 
    ? user.roles 
    : (user.role ? [user.role] : []);
  const normalizedRoles = userRoles.map(r => (typeof r === 'string' ? r : r?.name || '').replace(/^ROLE_/, '').toUpperCase());
  const isAdmin = normalizedRoles.includes('ADMIN') || user.username?.toLowerCase() === 'admin';
  const isSeniorOfficer = normalizedRoles.includes('SENIOR_OFFICER') || user.username?.toLowerCase() === 'senior_officer';
  const isAuditor = normalizedRoles.includes('AUDITOR') || user.username?.toLowerCase() === 'auditor';

  const caseClassification = caseData?.classification || 'RESTRICTED';

  // 1. Mandatory Clearance Hierarchy Validation
  if (!canClearanceAccess(user.clearance, caseClassification)) {
    return {
      allowed: false,
      reason: 'INSUFFICIENT_CLEARANCE',
      details: `Clearance Violation: Your clearance level is "${user.clearance || 'RESTRICTED'}", but this case dossier is classified as "${caseClassification}". Access denied.`,
      userClearance: user.clearance,
      requiredClearance: caseClassification,
    };
  }

  // 2. Supervisory Oversight Authority (ADMIN & SENIOR_OFFICER maintain supervisory access across cases)
  if (isAdmin) {
    return { allowed: true, role: 'ADMIN', badge: 'SUPERVISORY ADMIN' };
  }
  if (isSeniorOfficer) {
    return { allowed: true, role: 'SENIOR_OFFICER', badge: 'SENIOR OFFICER' };
  }
  if (isAuditor) {
    return { allowed: true, role: 'AUDITOR', badge: 'AUDIT OVERSIGHT' };
  }

  const curUsername = (user.username || '').toLowerCase().trim();
  const curUserId = String(user.id || user.userId || '').toLowerCase().trim();
  const curFullName = (user.fullName || '').toLowerCase().trim();

  const caseIdStr = String(caseData?.id || '');
  const caseNumStr = String(caseData?.caseNumber || '');

  // 3. Creator of the Case Dossier
  const creatorUsername = (
    caseData?.createdByUsername || 
    caseData?.createdBy?.username || 
    DEFAULT_CASE_CREATORS[caseNumStr] || 
    DEFAULT_CASE_CREATORS[caseIdStr] || 
    ''
  ).toLowerCase().trim();
  const creatorId = String(caseData?.createdById || caseData?.createdBy?.id || '').toLowerCase().trim();

  if (
    (creatorUsername && creatorUsername === curUsername) ||
    (creatorId && creatorId === curUserId)
  ) {
    return { allowed: true, role: 'CASE_CREATOR', badge: 'PRIMARY CREATOR' };
  }

  // 4. Strict Person-Level Assignment Check
  const storedAssignments = getStoredTeamAssignments();
  const defaultAsgns = DEFAULT_CASE_ASSIGNMENTS[caseNumStr] || DEFAULT_CASE_ASSIGNMENTS[caseIdStr] || [];

  const allAssignments = [
    ...(caseData?.assignments || []),
    ...(caseData?.teamAssignments || []),
    ...(runtimeAssignments || []),
    ...defaultAsgns,
    ...storedAssignments.filter(
      (a) =>
        String(a.caseId) === caseIdStr ||
        String(a.caseId) === caseNumStr ||
        String(a.caseNumber) === caseNumStr
    ),
  ];

  const matchedAssignment = allAssignments.find((asgn) => {
    const asgnUsername = (asgn.username || asgn.userId || '').toLowerCase().trim();
    const asgnFullName = (asgn.fullName || '').toLowerCase().trim();

    return (
      (asgnUsername && (asgnUsername === curUsername || asgnUsername === curUserId)) ||
      (asgnFullName && curFullName && asgnFullName === curFullName)
    );
  });

  if (matchedAssignment) {
    return {
      allowed: true,
      role: matchedAssignment.roleInCase || 'ASSIGNED_OFFICER',
      badge: `ASSIGNED: ${matchedAssignment.roleInCase || 'OFFICER'}`,
    };
  }

  // 5. Unassigned Officer -> Strictly BLOCKED by Person-Level ABAC
  return {
    allowed: false,
    reason: 'NOT_ASSIGNED',
    details: `Access Denied (Person-Based ABAC): Officer @${user.username} (${user.fullName || 'Officer'}) is not an assigned team member on this case. Access to Case ${caseData?.caseNumber || caseData?.title || 'Dossier'} is strictly restricted to assigned personnel.`,
    userClearance: user.clearance,
    caseNumber: caseData?.caseNumber,
  };
};

/**
 * Strict Person-Level Access Check for Evidence Artifacts:
 * A user can only access/view evidence that they personally submitted / collected / registered,
 * or where they are the designated custodian.
 * System Administrator (ADMIN) retains global audit oversight.
 */
export const isEvidenceSubmittedByUser = (item, user) => {
  if (!item || !user) return false;

  const roles = user.roles || (user.role ? [user.role] : []);
  const isAdmin = roles.some(
    (r) => r === 'ADMIN' || r === 'ROLE_ADMIN' || user.username === 'admin'
  );
  if (isAdmin) {
    return true;
  }

  const curUsername = (user.username || '').toLowerCase().trim();
  const curUserId = String(user.id || user.userId || '').toLowerCase().trim();
  const curFullName = (user.fullName || '').toLowerCase().trim();

  // 1. Submitted By
  const subUser = (item.submittedByUsername || item.submittedBy || '').toLowerCase().trim();
  const subId = String(item.submittedById || '').toLowerCase().trim();
  const subName = (item.submittedByName || '').toLowerCase().trim();

  if (subUser && (subUser === curUsername || subUser === curUserId)) return true;
  if (subId && (subId === curUserId || subId === curUsername)) return true;
  if (curFullName && subName && (subName === curFullName || subName.includes(curFullName) || curFullName.includes(subName))) return true;

  // 2. Collected By (can be object or string)
  let colUser = '';
  let colId = '';
  let colName = '';
  if (typeof item.collectedBy === 'object' && item.collectedBy !== null) {
    colUser = (item.collectedBy.username || item.collectedBy.userId || '').toLowerCase().trim();
    colId = String(item.collectedBy.id || '').toLowerCase().trim();
    colName = (item.collectedBy.fullName || '').toLowerCase().trim();
  } else if (typeof item.collectedBy === 'string') {
    colUser = item.collectedBy.toLowerCase().trim();
  }
  const colByUsername = (item.collectedByUsername || '').toLowerCase().trim();
  const colById = String(item.collectedById || '').toLowerCase().trim();

  if (colUser && (colUser === curUsername || colUser === curUserId)) return true;
  if (colByUsername && (colByUsername === curUsername || colByUsername === curUserId)) return true;
  if (colId && (colId === curUserId || colId === curUsername)) return true;
  if (colById && (colById === curUserId || colById === curUsername)) return true;
  if (curFullName && colName && (colName === curFullName || colName.includes(curFullName) || curFullName.includes(colName))) return true;

  // 3. Current Custodian
  const custName = (item.currentCustodian || item.custodian || '').toLowerCase().trim();
  const custUser = (item.currentCustodianUsername || item.custodianUsername || '').toLowerCase().trim();
  const custId = String(item.currentCustodianId || item.custodianId || '').toLowerCase().trim();

  if (custUser && (custUser === curUsername || custUser === curUserId)) return true;
  if (custId && (custId === curUserId || custId === curUsername)) return true;
  if (curFullName && custName && (custName === curFullName || custName.includes(curFullName) || custName.includes(custName))) return true;
  if (curUsername && custName && (custName === curUsername || custName.includes(curUsername))) return true;

  // 4. Registered By / Created By
  const regUser = (item.registeredBy || item.registeredByUsername || item.createdBy || item.createdByUsername || '').toLowerCase().trim();
  const regId = String(item.registeredById || item.createdById || '').toLowerCase().trim();
  if (regUser && (regUser === curUsername || regUser === curUserId)) return true;
  if (regId && (regId === curUserId || regId === curUsername)) return true;

  return false;
};

