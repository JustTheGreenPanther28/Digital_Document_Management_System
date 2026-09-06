package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.DocumentClassification;
import com.sih.casemanagement.common.enums.DocumentType;
import com.sih.casemanagement.common.enums.QuarantineStatus;
import jakarta.persistence.*;
import org.springframework.data.domain.Persistable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
public class Document implements Persistable<UUID> {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @Column(nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "storage_object_key", nullable = false, length = 500)
    private String storageObjectKey;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "sha256_hash", nullable = false, length = 64)
    private String sha256Hash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentClassification classification = DocumentClassification.CONFIDENTIAL;

    @Column(name = "current_version", nullable = false)
    private int currentVersion = 1;

    @Column(name = "is_locked", nullable = false)
    private boolean locked = false;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locked_by")
    private User lockedBy;

    @Column(name = "is_worm_locked", nullable = false)
    private boolean wormLocked = false;

    @Column(name = "worm_lock_until")
    private Instant wormLockUntil;

    @Column(name = "worm_retention_mode", length = 30)
    private String wormRetentionMode = "COMPLIANCE";

    @Column(name = "worm_compliance_hash", length = 64)
    private String wormComplianceHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worm_locked_by")
    private User wormLockedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "quarantine_status", nullable = false, length = 20)
    private QuarantineStatus quarantineStatus = QuarantineStatus.CLEAN;

    @Column(name = "encryption_iv", nullable = false, length = 64)
    private String encryptionIv;

    @Column(name = "encryption_algorithm", nullable = false, length = 30)
    private String encryptionAlgorithm = "AES-256-GCM";

    @Column(name = "kms_key_id", nullable = false, length = 100)
    private String kmsKeyId = "kms-key-vault-primary";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Transient
    private boolean isNewRecord = true;

    public Document() {}

    @Override
    public boolean isNew() {
        return isNewRecord;
    }

    @PostPersist
    @PostLoad
    void markNotNew() {
        this.isNewRecord = false;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getStorageObjectKey() { return storageObjectKey; }
    public void setStorageObjectKey(String storageObjectKey) { this.storageObjectKey = storageObjectKey; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public DocumentClassification getClassification() { return classification; }
    public void setClassification(DocumentClassification classification) { this.classification = classification; }

    public int getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(int currentVersion) { this.currentVersion = currentVersion; }

    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }

    public Instant getLockedAt() { return lockedAt; }
    public void setLockedAt(Instant lockedAt) { this.lockedAt = lockedAt; }

    public User getLockedBy() { return lockedBy; }
    public void setLockedBy(User lockedBy) { this.lockedBy = lockedBy; }

    public boolean isWormLocked() { return wormLocked; }
    public void setWormLocked(boolean wormLocked) { this.wormLocked = wormLocked; }

    public Instant getWormLockUntil() { return wormLockUntil; }
    public void setWormLockUntil(Instant wormLockUntil) { this.wormLockUntil = wormLockUntil; }

    public String getWormRetentionMode() { return wormRetentionMode; }
    public void setWormRetentionMode(String wormRetentionMode) { this.wormRetentionMode = wormRetentionMode; }

    public String getWormComplianceHash() { return wormComplianceHash; }
    public void setWormComplianceHash(String wormComplianceHash) { this.wormComplianceHash = wormComplianceHash; }

    public User getWormLockedBy() { return wormLockedBy; }
    public void setWormLockedBy(User wormLockedBy) { this.wormLockedBy = wormLockedBy; }

    public QuarantineStatus getQuarantineStatus() { return quarantineStatus; }
    public void setQuarantineStatus(QuarantineStatus quarantineStatus) { this.quarantineStatus = quarantineStatus; }

    public String getEncryptionIv() { return encryptionIv; }
    public void setEncryptionIv(String encryptionIv) { this.encryptionIv = encryptionIv; }

    public String getEncryptionAlgorithm() { return encryptionAlgorithm; }
    public void setEncryptionAlgorithm(String encryptionAlgorithm) { this.encryptionAlgorithm = encryptionAlgorithm; }

    public String getKmsKeyId() { return kmsKeyId; }
    public void setKmsKeyId(String kmsKeyId) { this.kmsKeyId = kmsKeyId; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
