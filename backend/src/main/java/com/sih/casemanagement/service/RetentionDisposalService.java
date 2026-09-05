package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.AuditEventType;
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
