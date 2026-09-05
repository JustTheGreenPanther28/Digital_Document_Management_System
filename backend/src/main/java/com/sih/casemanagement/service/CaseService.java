package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.*;
import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.common.exception.WorkflowViolationException;
import com.sih.casemanagement.entity.*;
import com.sih.casemanagement.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class CaseService {

    private final CaseRepository caseRepository;
    private final CaseUserAssignmentRepository assignmentRepository;
    private final CaseStatusHistoryRepository statusHistoryRepository;
    private final LegalHoldRepository legalHoldRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public CaseService(
        CaseRepository caseRepository,
        CaseUserAssignmentRepository assignmentRepository,
        CaseStatusHistoryRepository statusHistoryRepository,
        LegalHoldRepository legalHoldRepository,
        UserRepository userRepository,
        AuditService auditService
    ) {
        this.caseRepository = caseRepository;
        this.assignmentRepository = assignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.legalHoldRepository = legalHoldRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public Case createCase(
        String title,
        String description,
        String firNumber,
        Instant incidentDate,
        String investigatingAgency,
        CasePriority priority,
        DocumentClassification classification,
        User creator,
        String ipAddress
    ) {
        long count = caseRepository.count() + 1;
        String caseNumber = String.format("CASE-%d-%03d", Year.now().getValue(), count);

        Case aCase = new Case();
        aCase.setCaseNumber(caseNumber);
        aCase.setTitle(title);
        aCase.setDescription(description);
        aCase.setFirNumber(firNumber);
        aCase.setIncidentDate(incidentDate);
        if (investigatingAgency != null && !investigatingAgency.isBlank()) {
            aCase.setInvestigatingAgency(investigatingAgency);
        }
        aCase.setStatus(CaseStatus.REGISTERED);
        aCase.setPriority(priority != null ? priority : CasePriority.MEDIUM);
        aCase.setClassification(classification != null ? classification : DocumentClassification.CONFIDENTIAL);
        aCase.setCreatedBy(creator);
        aCase.setRegistrationDate(Instant.now());

        Case saved = caseRepository.save(aCase);

        // Record initial status in history
        CaseStatusHistory history = new CaseStatusHistory(saved, null, CaseStatus.REGISTERED, creator, "Initial Case Registration");
        statusHistoryRepository.save(history);

        // Auto-assign creator (Senior Officer)
        CaseUserAssignment assignment = new CaseUserAssignment(saved, creator, "SUPERVISORY_OFFICER", creator);
        assignmentRepository.save(assignment);

        auditService.logEvent(
            AuditEventType.CASE_CREATED,
            creator.getId(),
            creator.getUsername(),
            "SENIOR_OFFICER",
            saved.getId(),
            "CASE",
            saved.getCaseNumber(),
            ipAddress,
            null,
            "Case registered: " + saved.getTitle() + " (FIR: " + saved.getFirNumber() + ")"
        );

        return saved;
    }

    @Transactional
    public CaseUserAssignment assignTeamMember(UUID caseId, UUID userId, String roleInCase, User assigner, String ipAddress) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        User targetUser = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Check if active assignment already exists
        assignmentRepository.findByACaseIdAndUserIdAndActiveTrue(caseId, userId).ifPresent(existing -> {
            existing.setActive(false);
            existing.setRemovedAt(Instant.now());
            assignmentRepository.save(existing);
        });

        CaseUserAssignment assignment = new CaseUserAssignment(aCase, targetUser, roleInCase, assigner);
        CaseUserAssignment saved = assignmentRepository.save(assignment);

        auditService.logEvent(
            AuditEventType.CASE_ASSIGNED,
            assigner.getId(),
            assigner.getUsername(),
            "SENIOR_OFFICER",
            caseId,
            "CASE_ASSIGNMENT",
            targetUser.getUsername(),
            ipAddress,
            null,
            "Assigned " + targetUser.getUsername() + " to case " + aCase.getCaseNumber() + " as " + roleInCase
        );

        return saved;
    }

    @Transactional
    public Case updateCaseStatus(UUID caseId, CaseStatus newStatus, String reason, User actor, String ipAddress) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        if (!aCase.getStatus().canTransitionTo(newStatus)) {
            throw new WorkflowViolationException("Illegal case status transition from " + aCase.getStatus() + " to " + newStatus);
        }

        CaseStatus oldStatus = aCase.getStatus();
        aCase.setStatus(newStatus);
        Case updated = caseRepository.save(aCase);

        CaseStatusHistory history = new CaseStatusHistory(updated, oldStatus, newStatus, actor, reason);
        statusHistoryRepository.save(history);

        auditService.logEvent(
            AuditEventType.CASE_STATUS_CHANGED,
            actor.getId(),
            actor.getUsername(),
            actor.getRoles().iterator().next().getName().name(),
            caseId,
            "CASE",
            aCase.getCaseNumber(),
            ipAddress,
            null,
            "Status changed from " + oldStatus + " to " + newStatus + ". Reason: " + reason
        );

        return updated;
    }

    @Transactional
    public LegalHold placeLegalHold(UUID caseId, String reason, User actor, String ipAddress) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        aCase.setLegalHold(true);
        aCase.setLegalHoldReason(reason);
        aCase.setLegalHoldBy(actor);
        caseRepository.save(aCase);

        LegalHold hold = new LegalHold(aCase, reason, actor);
        LegalHold saved = legalHoldRepository.save(hold);

        auditService.logEvent(
            AuditEventType.LEGAL_HOLD_PLACED,
            actor.getId(),
            actor.getUsername(),
            actor.getRoles().iterator().next().getName().name(),
            caseId,
            "LEGAL_HOLD",
            hold.getId().toString(),
            ipAddress,
            null,
            "Legal hold placed on " + aCase.getCaseNumber() + ": " + reason
        );

        return saved;
    }

    @Transactional
    public void liftLegalHold(UUID caseId, User actor, String ipAddress) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        aCase.setLegalHold(false);
        caseRepository.save(aCase);

        legalHoldRepository.findByACaseIdAndActiveTrue(caseId).ifPresent(hold -> {
            hold.setActive(false);
            hold.setLiftedAt(Instant.now());
            hold.setLiftedBy(actor);
            legalHoldRepository.save(hold);
        });

        auditService.logEvent(
            AuditEventType.LEGAL_HOLD_LIFTED,
            actor.getId(),
            actor.getUsername(),
            actor.getRoles().iterator().next().getName().name(),
            caseId,
            "LEGAL_HOLD",
            aCase.getCaseNumber(),
            ipAddress,
            null,
            "Legal hold lifted from " + aCase.getCaseNumber()
        );
    }

    @Transactional
    public Case closeCase(UUID caseId, User actor, String ipAddress) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        if (aCase.isLegalHold()) {
            throw new WorkflowViolationException("Cannot close case while active legal hold is placed.");
        }

        if (aCase.getStatus() != CaseStatus.JUDGMENT_DELIVERED) {
            throw new WorkflowViolationException("Case can only be closed after judgment is delivered. Current status: " + aCase.getStatus());
        }

        aCase.setStatus(CaseStatus.CLOSED);
        aCase.setClosedAt(Instant.now());
        aCase.setClosedBy(actor);
        Case closed = caseRepository.save(aCase);

        CaseStatusHistory history = new CaseStatusHistory(closed, CaseStatus.JUDGMENT_DELIVERED, CaseStatus.CLOSED, actor, "Final Case Closure");
        statusHistoryRepository.save(history);

        auditService.logEvent(
            AuditEventType.CASE_CLOSED,
            actor.getId(),
            actor.getUsername(),
            actor.getRoles().iterator().next().getName().name(),
            caseId,
            "CASE",
            aCase.getCaseNumber(),
            ipAddress,
            null,
            "Case successfully closed and moved to read-only state."
        );

        return closed;
    }

    @Transactional(readOnly = true)
    public Case getCaseById(UUID caseId) {
        return caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
    }

    @Transactional(readOnly = true)
    public List<Case> getAllCases() {
        return caseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Case> getAssignedCasesForUser(UUID userId) {
        return caseRepository.findAssignedCasesForUser(userId);
    }

    @Transactional(readOnly = true)
    public List<CaseUserAssignment> getCaseAssignments(UUID caseId) {
        return assignmentRepository.findByACaseIdAndActiveTrue(caseId);
    }

    @Transactional(readOnly = true)
    public List<CaseStatusHistory> getStatusHistory(UUID caseId) {
        return statusHistoryRepository.findByACaseIdOrderByTimestampAsc(caseId);
    }
}
