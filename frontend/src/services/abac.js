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

export const checkCaseAccess = (user, caseData, runtimeAssignments = []) => {
  if (!user) {
    return {
      allowed: false,
      reason: 'UNAUTHENTICATED',
      details: 'You must be authenticated to access this digital case dossier.',
    };
  }

  const roles = user.roles || [];
  const isAdmin = roles.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isSeniorOfficer = roles.some((r) => r === 'SENIOR_OFFICER' || r === 'ROLE_SENIOR_OFFICER');
  const isAuditor = roles.some((r) => r === 'AUDITOR' || r === 'ROLE_AUDITOR');

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

  // 2. Command Authority & Compliance Roles have supervisory access
  if (isAdmin) {
    return { allowed: true, role: 'ADMIN', badge: 'SUPERVISORY ADMIN' };
  }
  if (isSeniorOfficer) {
    return { allowed: true, role: 'SENIOR_OFFICER', badge: 'COMMAND OVERVIEW' };
  }
  if (isAuditor) {
    return { allowed: true, role: 'AUDITOR', badge: 'AUDIT INSPECTOR', readOnly: true };
  }

  // 3. Creator of the Case Dossier
  if (
    caseData?.createdByUsername &&
    user.username &&
    caseData.createdByUsername.toLowerCase() === user.username.toLowerCase()
  ) {
    return { allowed: true, role: 'CASE_CREATOR', badge: 'PRIMARY CREATOR' };
  }

  // 4. Case Team Assignment Check
  const storedAssignments = getStoredTeamAssignments();
  const caseIdStr = String(caseData?.id || '');
  const caseNumStr = String(caseData?.caseNumber || '');

  const allAssignments = [
    ...(caseData?.teamAssignments || []),
    ...(caseData?.assignments || []),
    ...(runtimeAssignments || []),
    ...storedAssignments.filter(
      (a) =>
        String(a.caseId) === caseIdStr ||
        String(a.caseId) === caseNumStr ||
        String(a.caseNumber) === caseNumStr
    ),
  ];

  const matchedAssignment = allAssignments.find((asgn) => {
    const asgnUsername = (asgn.username || asgn.userId || '').toLowerCase();
    const asgnFullName = (asgn.fullName || '').toLowerCase();
    const curUsername = (user.username || '').toLowerCase();
    const curUserId = (user.id || user.userId || '').toLowerCase();
    const curFullName = (user.fullName || '').toLowerCase();

    return (
      (asgnUsername && asgnUsername === curUsername) ||
      (asgnUsername && asgnUsername === curUserId) ||
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

  // 5. Unassigned Officer -> Strict ABAC Restriction
  return {
    allowed: false,
    reason: 'NOT_ASSIGNED',
    details: `ABAC Access Policy Violation: Officer @${user.username} (${user.fullName || 'Officer'}) is not an assigned member of this investigation team. Access to Case ${caseData?.caseNumber || 'Dossier'} is restricted to authorized team personnel only.`,
    userClearance: user.clearance,
    caseNumber: caseData?.caseNumber,
  };
};
