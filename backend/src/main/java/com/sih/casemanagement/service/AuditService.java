package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.AlertSeverity;
import com.sih.casemanagement.common.enums.AuditEventType;
import com.sih.casemanagement.entity.AuditLog;
import com.sih.casemanagement.entity.SecurityAlert;
import com.sih.casemanagement.repository.AuditLogRepository;
import com.sih.casemanagement.repository.SecurityAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final AuditLogRepository auditLogRepository;
    private final SecurityAlertRepository securityAlertRepository;

    public AuditService(AuditLogRepository auditLogRepository, SecurityAlertRepository securityAlertRepository) {
        this.auditLogRepository = auditLogRepository;
        this.securityAlertRepository = securityAlertRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized AuditLog logEvent(
        AuditEventType eventType,
        UUID actorId,
        String actorUsername,
        String actorRole,
        UUID caseId,
        String targetEntity,
        String targetId,
        String ipAddress,
        String userAgent,
        String actionDetails
    ) {
        Optional<AuditLog> latestLog = auditLogRepository.findLatestLog();
        String previousHash = latestLog.map(AuditLog::getCurrentHash).orElse(GENESIS_HASH);

        UUID logId = UUID.randomUUID();
        long nowMs = System.currentTimeMillis();

        String role = actorRole != null ? actorRole : "UNKNOWN";
        String tgtId = targetId != null ? targetId : "";
        String cId = caseId != null ? caseId.toString() : "";
        String details = actionDetails != null ? actionDetails : "";

        String payloadToHash = String.format("%s|%d|%s|%s|%s|%s|%s|%s|%s|%s",
            logId,
            nowMs,
            eventType.name(),
            actorUsername,
            role,
            targetEntity,
            tgtId,
            cId,
            details,
            previousHash
        );

        String currentHash = sha256Hex(payloadToHash);

        AuditLog entry = new AuditLog();
        entry.setId(logId);
        entry.setEventType(eventType);
        entry.setActorId(actorId);
        entry.setActorUsername(actorUsername);
        entry.setActorRole(role);
        entry.setCaseId(caseId);
        entry.setTargetEntity(targetEntity);
        entry.setTargetId(tgtId);
        entry.setIpAddress(ipAddress);
        entry.setUserAgent(userAgent);
        entry.setActionDetails(details);
        entry.setPreviousHash(previousHash);
        entry.setCurrentHash(currentHash);
        entry.setTimestamp(Instant.ofEpochMilli(nowMs));
        entry.setTimestampMs(nowMs);

        return auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> verifyAuditChain() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampAsc();
        Map<String, Object> result = new LinkedHashMap<>();

        if (logs.isEmpty()) {
            result.put("valid", true);
            result.put("totalVerified", 0);
            result.put("message", "Audit log is empty; chain is intact.");
            return result;
        }

        String expectedPreviousHash = GENESIS_HASH;

        for (int i = 0; i < logs.size(); i++) {
            AuditLog current = logs.get(i);

            // Check previous hash linkage
            if (!current.getPreviousHash().equals(expectedPreviousHash)) {
                recordTamperAlert(current, "Hash chain link broken at index " + i);
                result.put("valid", false);
                result.put("brokenAtIndex", i);
                result.put("logId", current.getId());
                result.put("expectedPreviousHash", expectedPreviousHash);
                result.put("actualPreviousHash", current.getPreviousHash());
                result.put("message", "CRITICAL: Chain break detected! Previous hash does not match previous entry's hash.");
                return result;
            }

            // Recalculate hash of current entry using stored long timestampMs
            long tsMs = current.getTimestampMs() > 0 ? current.getTimestampMs() : current.getTimestamp().toEpochMilli();
            String role = current.getActorRole() != null ? current.getActorRole() : "UNKNOWN";
            String tgtId = current.getTargetId() != null ? current.getTargetId() : "";
            String cId = current.getCaseId() != null ? current.getCaseId().toString() : "";
            String details = current.getActionDetails() != null ? current.getActionDetails() : "";

            String payloadToHash = String.format("%s|%d|%s|%s|%s|%s|%s|%s|%s|%s",
                current.getId(),
                tsMs,
                current.getEventType().name(),
                current.getActorUsername(),
                role,
                current.getTargetEntity(),
                tgtId,
                cId,
                details,
                current.getPreviousHash()
            );

            String expectedHash = sha256Hex(payloadToHash);

            if (!current.getCurrentHash().equals(expectedHash)) {
                recordTamperAlert(current, "Cryptographic hash mismatch for log entry at index " + i);
                result.put("valid", false);
                result.put("brokenAtIndex", i);
                result.put("logId", current.getId());
                result.put("expectedHash", expectedHash);
                result.put("actualHash", current.getCurrentHash());
                result.put("message", "CRITICAL: Entry tampering detected! Log content does not match its hash.");
                return result;
            }

            expectedPreviousHash = current.getCurrentHash();
        }

        result.put("valid", true);
        result.put("totalVerified", logs.size());
        result.put("latestHash", expectedPreviousHash);
        result.put("message", "Audit log integrity successfully verified. All records are valid and cryptographically linked.");
        return result;
    }

    private void recordTamperAlert(AuditLog logEntry, String reason) {
        log.error("AUDIT TAMPER ALERT: {}", reason);
        SecurityAlert alert = new SecurityAlert(
            "AUDIT_CHAIN_BROKEN",
            AlertSeverity.CRITICAL,
            "Tamper detected in audit ledger: " + reason + " (Log ID: " + logEntry.getId() + ")",
            logEntry.getIpAddress(),
            logEntry.getActorUsername(),
            logEntry.getCaseId()
        );
        securityAlertRepository.save(alert);
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }
}
