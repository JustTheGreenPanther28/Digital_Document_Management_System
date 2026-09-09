package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "backup_history")
public class BackupHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "backup_type", nullable = false, length = 50)
    private String backupType; // FULL_DB, WAL_ARCHIVE, S3_REPLICATION, PARALLEL_SYSTEM, TEST_RESTORE

    @Column(name = "target_location", nullable = false, length = 500)
    private String targetLocation;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "sha256_checksum", nullable = false, length = 64)
    private String sha256Checksum;

    @Column(nullable = false, length = 30)
    private String status = "SUCCESS"; // SUCCESS, IN_PROGRESS, FAILED, VERIFIED

    @Column(name = "wal_sequence", length = 100)
    private String walSequence;

    @Column(name = "record_count")
    private long recordCount = 0;

    @Column(name = "duration_ms")
    private long durationMs = 0;

    @Column(name = "initiated_by", nullable = false, length = 100)
    private String initiatedBy = "SYSTEM_SCHEDULER";

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "restore_status", length = 30)
    private String restoreStatus = "UNTESTED"; // UNTESTED, PASSED, FAILED

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public BackupHistory() {}

    public BackupHistory(String backupType, String targetLocation, long fileSizeBytes,
                         String sha256Checksum, String status, String walSequence,
                         long recordCount, long durationMs, String initiatedBy, String details) {
        this.backupType = backupType;
        this.targetLocation = targetLocation;
        this.fileSizeBytes = fileSizeBytes;
        this.sha256Checksum = sha256Checksum;
        this.status = status;
        this.walSequence = walSequence;
        this.recordCount = recordCount;
        this.durationMs = durationMs;
        this.initiatedBy = initiatedBy;
        this.details = details;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getBackupType() { return backupType; }
    public void setBackupType(String backupType) { this.backupType = backupType; }

    public String getTargetLocation() { return targetLocation; }
    public void setTargetLocation(String targetLocation) { this.targetLocation = targetLocation; }

    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getSha256Checksum() { return sha256Checksum; }
    public void setSha256Checksum(String sha256Checksum) { this.sha256Checksum = sha256Checksum; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getWalSequence() { return walSequence; }
    public void setWalSequence(String walSequence) { this.walSequence = walSequence; }

    public long getRecordCount() { return recordCount; }
    public void setRecordCount(long recordCount) { this.recordCount = recordCount; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getRestoreStatus() { return restoreStatus; }
    public void setRestoreStatus(String restoreStatus) { this.restoreStatus = restoreStatus; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
