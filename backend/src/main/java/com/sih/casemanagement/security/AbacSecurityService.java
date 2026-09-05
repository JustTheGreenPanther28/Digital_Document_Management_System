package com.sih.casemanagement.security;

import com.sih.casemanagement.common.enums.RoleType;
import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.common.exception.UnauthorizedAccessException;
import com.sih.casemanagement.common.exception.WorkflowViolationException;
import com.sih.casemanagement.entity.Case;
import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.DocumentPermission;
import com.sih.casemanagement.entity.Evidence;
import com.sih.casemanagement.repository.CaseRepository;
import com.sih.casemanagement.repository.CaseUserAssignmentRepository;
import com.sih.casemanagement.repository.DocumentPermissionRepository;
import com.sih.casemanagement.repository.DocumentRepository;
import com.sih.casemanagement.repository.EvidenceRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service("abacSecurity")
public class AbacSecurityService {

    private final CaseRepository caseRepository;
    private final CaseUserAssignmentRepository assignmentRepository;
    private final DocumentRepository documentRepository;
    private final EvidenceRepository evidenceRepository;
    private final DocumentPermissionRepository documentPermissionRepository;

    public AbacSecurityService(
        CaseRepository caseRepository,
        CaseUserAssignmentRepository assignmentRepository,
        DocumentRepository documentRepository,
        EvidenceRepository evidenceRepository,
        DocumentPermissionRepository documentPermissionRepository
    ) {
        this.caseRepository = caseRepository;
        this.assignmentRepository = assignmentRepository;
        this.documentRepository = documentRepository;
        this.evidenceRepository = evidenceRepository;
        this.documentPermissionRepository = documentPermissionRepository;
    }

    public UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) auth.getPrincipal();
        }
        return null;
    }

    @Transactional(readOnly = true)
    public boolean canAccessCase(UUID caseId, String action) {
        UserPrincipal user = getCurrentPrincipal();
        if (user == null) return false;

        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        boolean isAdmin = user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + RoleType.ADMIN.name()));
        boolean isSeniorOfficer = user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + RoleType.SENIOR_OFFICER.name()));
        boolean isAuditor = user.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + RoleType.AUDITOR.name()));

        // Clearance check: user clearance must be >= case classification
        if (!user.getClearance().canAccess(aCase.getClassification())) {
            return false;
        }

        // Enforce Read-Only if case is CLOSED or ARCHIVED (No modifications allowed even for Admin/Senior Officer)
        if (aCase.getStatus().isReadOnly() && !"READ".equalsIgnoreCase(action)) {
            // Only status transition from CLOSED -> ARCHIVED is structurally permitted
            if (aCase.getStatus() == com.sih.casemanagement.common.enums.CaseStatus.CLOSED && "UPDATE_STATUS".equalsIgnoreCase(action)) {
                // Allowed to proceed to status transition check
            } else {
                throw new WorkflowViolationException("Case " + aCase.getCaseNumber() + " is " + aCase.getStatus() + " and is locked read-only. Modification is forbidden.");
            }
        }

        if (isAdmin || isSeniorOfficer) {
            return true;
        }

        if (isAuditor) {
            // Auditor has read-only access for compliance
            return "READ".equalsIgnoreCase(action);
        }

        // ABAC Check: User must have an active assignment to this case
        return assignmentRepository.isUserAssignedToCase(caseId, user.getId());
    }

    @Transactional(readOnly = true)
    public void checkCaseAccess(UUID caseId, String action) {
        if (!canAccessCase(caseId, action)) {
            throw new UnauthorizedAccessException("Access denied: You are not authorized to perform action '" +
                action + "' on case " + caseId + " (ABAC assignment or clearance check failed).");
        }
    }

    @Transactional(readOnly = true)
    public boolean canAccessDocument(UUID documentId, String action) {
        UserPrincipal user = getCurrentPrincipal();
        if (user == null) return false;

        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        // 1. Check parent case access
        if (!canAccessCase(doc.getCase().getId(), action)) {
            return false;
        }

        // 2. Clearance check on document classification
        if (!user.getClearance().canAccess(doc.getClassification())) {
            return false;
        }

        // 3. Locked document check: cannot modify locked documents
        if (doc.isLocked() && ("MODIFY".equalsIgnoreCase(action) || "DELETE".equalsIgnoreCase(action) || "UPDATE".equalsIgnoreCase(action))) {
            throw new WorkflowViolationException("Document is cryptographically signed and locked. Modifications are forbidden.");
        }

        // 4. Fine-grained Document-Level Permission check if specific rules exist
        List<DocumentPermission> specificPermissions = documentPermissionRepository.findByDocumentId(documentId);
        if (!specificPermissions.isEmpty()) {
            boolean hasPermission = specificPermissions.stream().anyMatch(dp -> {
                boolean userMatch = dp.getUser() != null && dp.getUser().getId().equals(user.getId());
                boolean roleMatch = dp.getRole() != null && user.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_" + dp.getRole().getName().name()));
                boolean notExpired = dp.getExpiresAt() == null || dp.getExpiresAt().isAfter(LocalDateTime.now());
                boolean levelMatch = dp.getPermissionLevel().equalsIgnoreCase(action) || "ALL".equalsIgnoreCase(dp.getPermissionLevel());
                return (userMatch || roleMatch) && notExpired && levelMatch;
            });
            if (!hasPermission) {
                return false;
            }
        }

        return true;
    }

    @Transactional(readOnly = true)
    public void checkDocumentAccess(UUID documentId, String action) {
        if (!canAccessDocument(documentId, action)) {
            throw new UnauthorizedAccessException("Access denied: Document clearance, fine-grained permission, or case assignment authorization failed for document " + documentId);
        }
    }

    @Transactional(readOnly = true)
    public boolean canAccessEvidence(UUID evidenceId, String action) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
            .orElseThrow(() -> new ResourceNotFoundException("Evidence not found: " + evidenceId));

        return canAccessCase(evidence.getCase().getId(), action);
    }

    @Transactional(readOnly = true)
    public void checkEvidenceAccess(UUID evidenceId, String action) {
        if (!canAccessEvidence(evidenceId, action)) {
            throw new UnauthorizedAccessException("Access denied to evidence: ABAC check failed for evidence " + evidenceId);
        }
    }
}
