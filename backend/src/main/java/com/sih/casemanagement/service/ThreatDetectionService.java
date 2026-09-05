package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.AlertSeverity;
import com.sih.casemanagement.entity.SecurityAlert;
import com.sih.casemanagement.repository.SecurityAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ThreatDetectionService {

    private static final Logger log = LoggerFactory.getLogger(ThreatDetectionService.class);

    private final SecurityAlertRepository alertRepository;
    private final RateLimitingService rateLimitingService;

    // In-memory sliding window tracker for mass downloads: userId -> (windowStartMs, count)
    private final Map<UUID, UserDownloadTracker> downloadTrackers = new ConcurrentHashMap<>();

    private record UserDownloadTracker(AtomicInteger count, long windowStartMs) {}

    public ThreatDetectionService(SecurityAlertRepository alertRepository, RateLimitingService rateLimitingService) {
        this.alertRepository = alertRepository;
        this.rateLimitingService = rateLimitingService;
    }

    public void recordDownload(UUID userId, String username, String ipAddress, UUID documentId, UUID caseId) {
        long now = System.currentTimeMillis();
        UserDownloadTracker tracker = downloadTrackers.compute(userId, (k, existing) -> {
            if (existing == null || now - existing.windowStartMs() > 60000) {
                return new UserDownloadTracker(new AtomicInteger(1), now);
            }
            existing.count().incrementAndGet();
            return existing;
        });

        int currentCount = tracker.count().get();
        if (currentCount > 10) {
            log.warn("THREAT ALERT: Mass download threshold exceeded by user {} (count: {})", username, currentCount);
            SecurityAlert alert = new SecurityAlert(
                "MASS_DOWNLOAD_ANOMALY",
                AlertSeverity.CRITICAL,
                String.format("User %s exceeded mass download threshold (%d files in 60s)", username, currentCount),
                ipAddress,
                username,
                caseId
            );
            alertRepository.save(alert);
        }
    }

    public void recordPrivilegeViolation(UUID userId, String username, String ipAddress, String attemptedAction, String targetResource) {
        log.warn("THREAT ALERT: Privilege escalation attempt by user {} on action {}", username, attemptedAction);
        SecurityAlert alert = new SecurityAlert(
            "PRIVILEGE_ESCALATION_ATTEMPT",
            AlertSeverity.CRITICAL,
            String.format("Unauthorized attempt by %s to perform privileged action '%s' on %s", username, attemptedAction, targetResource),
            ipAddress,
            username,
            null
        );
        alertRepository.save(alert);
    }

    public void recordTopSecretAccessAnomaly(UUID userId, String username, String ipAddress, UUID documentId) {
        log.warn("THREAT ALERT: TOP_SECRET document access anomaly by user {}", username);
        SecurityAlert alert = new SecurityAlert(
            "TOP_SECRET_ABUSE_DETECTED",
            AlertSeverity.CRITICAL,
            String.format("User %s attempted unauthorized access to TOP_SECRET document %s", username, documentId),
            ipAddress,
            username,
            null
        );
        alertRepository.save(alert);
    }

    public void handleBrokenAuditChain(String tamperPoint, String reason) {
        log.error("CRITICAL SECURITY RESPONSE: Broken audit ledger chain detected at block {}! Triggering automated alert.", tamperPoint);
        SecurityAlert alert = new SecurityAlert(
            "AUDIT_CHAIN_INTEGRITY_COMPROMISED",
            AlertSeverity.CRITICAL,
            String.format("Tamper detected in sequential cryptographic audit chain at %s: %s", tamperPoint, reason),
            "INTERNAL_LEDGER_MONITOR",
            "SYSTEM",
            null
        );
        alertRepository.save(alert);
    }
}
