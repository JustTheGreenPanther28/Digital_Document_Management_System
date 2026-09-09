package com.sih.casemanagement.service;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class BackupHealthIndicator implements HealthIndicator {

    private final BackupOrchestrationService backupOrchestrationService;

    public BackupHealthIndicator(BackupOrchestrationService backupOrchestrationService) {
        this.backupOrchestrationService = backupOrchestrationService;
    }

    @Override
    public Health health() {
        try {
            BackupOrchestrationService.BackupSystemStatus status = backupOrchestrationService.getSystemStatus();
            boolean isDbHealthy = "SUCCESS".equalsIgnoreCase(status.databaseBackupStatus());
            boolean isS3Healthy = "SUCCESS".equalsIgnoreCase(status.documentReplicationStatus());
            boolean isWalHealthy = "HEALTHY".equalsIgnoreCase(status.walArchiveHealth());

            Health.Builder builder = (isDbHealthy && isS3Healthy && isWalHealthy) ? Health.up() : Health.down();
            return builder
                .withDetail("databaseBackupStatus", status.databaseBackupStatus())
                .withDetail("documentReplicationStatus", status.documentReplicationStatus())
                .withDetail("walArchiveHealth", status.walArchiveHealth())
                .withDetail("currentWalLsn", status.currentWalLsn())
                .withDetail("restoreTestStatus", status.restoreTestStatus())
                .withDetail("backupStorageBucket", status.backupStorageBucket())
                .withDetail("totalBackupsCount", status.totalBackupsCount())
                .build();
        } catch (Exception e) {
            return Health.down().withException(e).build();
        }
    }
}
