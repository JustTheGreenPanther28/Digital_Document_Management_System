package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.AuditEventType;
import com.sih.casemanagement.common.enums.CaseStatus;
import com.sih.casemanagement.common.exception.SecurityValidationException;
import com.sih.casemanagement.common.exception.WorkflowViolationException;
import com.sih.casemanagement.entity.*;
import com.sih.casemanagement.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class RetentionDisposalService {

    private static final Logger log = LoggerFactory.getLogger(RetentionDisposalService.class);

    private final RetentionPolicyRepository policyRepository;
    private final DisposalRecordRepository disposalRecordRepository;
    private final CaseRepository caseRepository;
    private final DocumentRepository documentRepository;
    private final AuditService auditService;

    public RetentionDisposalService(
        RetentionPolicyRepository policyRepository,
        DisposalRecordRepository disposalRecordRepository,
        CaseRepository caseRepository,
        DocumentRepository documentRepository,
        AuditService auditService
    ) {
        this.policyRepository = policyRepository;
        this.disposalRecordRepository = disposalRecordRepository;
        this.caseRepository = caseRepository;
        this.documentRepository = documentRepository;
        this.auditService = auditService;
    }

    public List<RetentionPolicy> getAllPolicies() {
        return policyRepository.findAll();
    }

    public RetentionPolicy createPolicy(RetentionPolicy policy) {
        return policyRepository.save(policy);
    }

    public List<DisposalRecord> getAllDisposalRecords() {
        return disposalRecordRepository.findAll();
    }

    @Transactional
    public Case archiveCase(UUID caseId, User archiver, String archiveReason, int retentionYears, String wormMode) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new SecurityValidationException("Case not found for archival: " + caseId));

        // 1. Strict status eligibility check: Case must be CLOSED or can transition to ARCHIVED
        if (!aCase.getStatus().canTransitionTo(CaseStatus.ARCHIVED) && aCase.getStatus() != CaseStatus.CLOSED) {
            throw new WorkflowViolationException("Invalid lifecycle transition: Case must be CLOSED before it can be ARCHIVED. Current status: " + aCase.getStatus());
        }

        // 2. Strict Legal Hold Veto check
        if (aCase.isLegalHold()) {
            log.error("LEGAL HOLD VETO: Cannot archive case {} under active judicial hold: {}", aCase.getCaseNumber(), aCase.getLegalHoldReason());
            auditService.logEvent(
                AuditEventType.SECURITY_ALERT,
                archiver.getId(),
                archiver.getUsername(),
                archiver.getRoles().iterator().next().getName().name(),
                caseId,
                "LEGAL_HOLD_VETO",
                caseId.toString(),
                "0.0.0.0",
                null,
                "Attempted archival on active Legal Hold was blocked."
            );
            throw new WorkflowViolationException("Action Blocked by Legal Hold: Case is subject to judicial hold and cannot be archived.");
        }

        // 3. Compute WORM preservation horizon and compliance token
        int effectiveYears = retentionYears > 0 ? retentionYears : (aCase.getRetentionPeriodDays() / 365);
        if (effectiveYears <= 0) effectiveYears = 10;
        Instant wormLockUntil = Instant.now().plus(effectiveYears * 365L, ChronoUnit.DAYS);
        String wormModeEffective = (wormMode != null && !wormMode.isBlank()) ? wormMode : "COMPLIANCE";
        String wormToken = "WORM-" + sha256(aCase.getCaseNumber() + "|" + wormLockUntil + "|" + archiver.getUsername()).substring(0, 24).toUpperCase();

        // 4. Update Case Entity to ARCHIVED with WORM preservation
        aCase.setStatus(CaseStatus.ARCHIVED);
        aCase.setArchivedAt(Instant.now());
        aCase.setArchivedBy(archiver);
        aCase.setArchiveReason(archiveReason != null ? archiveReason : "Statutory archival and Section 65B WORM preservation");
        aCase.setWormPreserved(true);
        aCase.setWormPreservedUntil(wormLockUntil);
        aCase.setWormComplianceToken(wormToken);

        Case savedCase = caseRepository.save(aCase);

        // 5. Apply WORM Object-Lock across all case documents
        List<Document> documents = documentRepository.findByACaseId(caseId);
        for (Document doc : documents) {
            doc.setWormLocked(true);
            doc.setWormLockUntil(wormLockUntil);
            doc.setWormRetentionMode(wormModeEffective);
            doc.setWormLockedBy(archiver);
            doc.setWormComplianceHash(sha256(doc.getSha256Hash() + "|" + wormLockUntil + "|" + archiver.getUsername()));
            doc.setLocked(true);
            if (doc.getLockedAt() == null) {
                doc.setLockedAt(Instant.now());
                doc.setLockedBy(archiver);
            }
            documentRepository.save(doc);
        }

        // 6. Log immutable audit trail
        auditService.logEvent(
            AuditEventType.STATUS_CHANGE,
            archiver.getId(),
            archiver.getUsername(),
            archiver.getRoles().iterator().next().getName().name(),
            caseId,
            "CASE_ARCHIVED_WORM_LOCK",
            caseId.toString(),
            "0.0.0.0",
            null,
            String.format("Case %s transitioned to ARCHIVED with %s WORM Object-Lock until %s. Token: %s. Documents locked: %d",
                aCase.getCaseNumber(), wormModeEffective, wormLockUntil, wormToken, documents.size())
        );

        log.info("Case {} successfully ARCHIVED with WORM preservation token {} (Locked until {})", 
            aCase.getCaseNumber(), wormToken, wormLockUntil);
        return savedCase;
    }

    @Transactional
    public DisposalRecord executeDisposal(UUID caseId, User approver, String method, String notes) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new SecurityValidationException("Case not found for disposal: " + caseId));

        // Strict Legal Hold Veto check (Item 66)
        if (aCase.isLegalHold()) {
            log.error("LEGAL HOLD VETO: Cannot dispose evidence for case {} under active legal hold: {}", aCase.getCaseNumber(), aCase.getLegalHoldReason());
            auditService.logEvent(
                AuditEventType.SECURITY_ALERT,
                approver.getId(),
                approver.getUsername(),
                approver.getRoles().iterator().next().getName().name(),
                caseId,
                "LEGAL_HOLD_VETO",
                caseId.toString(),
                "0.0.0.0",
                null,
                "Attempted deletion/disposal on active Legal Hold was blocked."
            );
            throw new WorkflowViolationException("Action Blocked by Legal Hold: Case is subject to judicial hold and cannot be disposed.");
        }

        // Strict WORM Object-Lock Active Retention Veto check
        if (aCase.isWormPreserved() && aCase.getWormPreservedUntil() != null && aCase.getWormPreservedUntil().isAfter(Instant.now())) {
            log.error("WORM OBJECT LOCK VETO: Case {} is under active WORM retention until {}", aCase.getCaseNumber(), aCase.getWormPreservedUntil());
            auditService.logEvent(
                AuditEventType.SECURITY_ALERT,
                approver.getId(),
                approver.getUsername(),
                approver.getRoles().iterator().next().getName().name(),
                caseId,
                "WORM_OBJECT_LOCK_VETO",
                caseId.toString(),
                "0.0.0.0",
                null,
                "Attempted deletion/disposal on active WORM-preserved case was blocked. Lock active until: " + aCase.getWormPreservedUntil()
            );
            throw new WorkflowViolationException(String.format(
                "Action Blocked by WORM Preservation: Case is under statutory WORM Object-Lock (Token: %s) until %s. Early destruction is strictly prohibited.",
                aCase.getWormComplianceToken(), aCase.getWormPreservedUntil()
            ));
        }

        // Generate cryptographic Section 65B disposal certificate hash
        String certPayload = String.format("DISPOSAL-CERT|CASE:%s|TIME:%s|APPROVER:%s|METHOD:%s",
            aCase.getCaseNumber(), LocalDateTime.now(), approver.getUsername(), method);
        String certHash = sha256(certPayload);

        DisposalRecord record = new DisposalRecord();
        record.setRelatedCase(aCase);
        record.setDisposalMethod(method != null ? method : "CRYPTOGRAPHIC_ERASURE");
        record.setDisposedBy(approver);
        record.setApprovedBy(approver);
        record.setCertificateHash(certHash);
        record.setCertificatePath("/certificates/disposal_" + aCase.getCaseNumber() + ".cert");
        record.setDisposalNotes(notes != null ? notes : "Authorized statutory disposal under retention policy");

        DisposalRecord saved = disposalRecordRepository.save(record);

        auditService.logEvent(
            AuditEventType.STATUS_CHANGE,
            approver.getId(),
            approver.getUsername(),
            approver.getRoles().iterator().next().getName().name(),
            caseId,
            "DISPOSAL",
            saved.getId().toString(),
            "0.0.0.0",
            null,
            "Case evidence disposed with cert hash: " + certHash
        );

        return saved;
    }

    @Scheduled(cron = "0 0 2 * * *") // Daily 2:00 AM
    public void runScheduledRetentionEvaluation() {
        log.info("Running daily scheduled evidentiary retention evaluation...");
        List<Case> cases = caseRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Case c : cases) {
            if (c.isLegalHold()) continue;

         LocalDateTime regDate = LocalDateTime.ofInstant(c.getRegistrationDate(), java.time.ZoneId.systemDefault());
            if (regDate != null) {
                long daysOld = ChronoUnit.DAYS.between(regDate, now);
                if (daysOld > c.getRetentionPeriodDays()) {
                    log.warn("Case {} exceeds statutory retention period (Age: {} days, Limit: {} days). Flagged for disposal.",
                        c.getCaseNumber(), daysOld, c.getRetentionPeriodDays());
                }
            }
        }
    }

    private String sha256(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        }
    }
}
