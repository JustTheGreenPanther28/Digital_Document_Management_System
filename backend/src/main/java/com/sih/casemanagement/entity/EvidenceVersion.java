package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.EvidenceStatus;
import com.sih.casemanagement.common.enums.EvidenceType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_versions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EvidenceVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "case", "associatedDocument"})
    private Evidence evidence;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false, length = 50)
    private EvidenceType evidenceType;

    @Column(name = "seal_number", nullable = false, length = 100)
    private String sealNumber;

    @Column(name = "seal_intact", nullable = false)
    private boolean sealIntact = true;

    @Column(name = "storage_location", nullable = false, length = 255)
    private String storageLocation;

    @Column(name = "seizure_location", length = 255)
    private String seizureLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvidenceStatus status = EvidenceStatus.IN_CUSTODY;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "custodian_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "mfaSecret", "roles"})
    private User custodian;

    @Column(name = "change_reason", columnDefinition = "TEXT")
    private String changeReason;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recorded_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "mfaSecret", "roles"})
    private User recordedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public EvidenceVersion() {}

    public EvidenceVersion(
        Evidence evidence,
        int versionNumber,
        String title,
        String description,
        EvidenceType evidenceType,
        String sealNumber,
        boolean sealIntact,
        String storageLocation,
        String seizureLocation,
        EvidenceStatus status,
        User custodian,
        String changeReason,
        User recordedBy
    ) {
        this.evidence = evidence;
        this.versionNumber = versionNumber;
        this.title = title;
        this.description = description;
        this.evidenceType = evidenceType;
        this.sealNumber = sealNumber;
        this.sealIntact = sealIntact;
        this.storageLocation = storageLocation;
        this.seizureLocation = seizureLocation;
        this.status = status;
        this.custodian = custodian;
        this.changeReason = changeReason;
        this.recordedBy = recordedBy;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Evidence getEvidence() { return evidence; }
    public void setEvidence(Evidence evidence) { this.evidence = evidence; }

    public int getVersionNumber() { return versionNumber; }
    public void setVersionNumber(int versionNumber) { this.versionNumber = versionNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public EvidenceType getEvidenceType() { return evidenceType; }
    public void setEvidenceType(EvidenceType evidenceType) { this.evidenceType = evidenceType; }

    public String getSealNumber() { return sealNumber; }
    public void setSealNumber(String sealNumber) { this.sealNumber = sealNumber; }

    public boolean isSealIntact() { return sealIntact; }
    public void setSealIntact(boolean sealIntact) { this.sealIntact = sealIntact; }

    public String getStorageLocation() { return storageLocation; }
    public void setStorageLocation(String storageLocation) { this.storageLocation = storageLocation; }

    public String getSeizureLocation() { return seizureLocation; }
    public void setSeizureLocation(String seizureLocation) { this.seizureLocation = seizureLocation; }

    public EvidenceStatus getStatus() { return status; }
    public void setStatus(EvidenceStatus status) { this.status = status; }

    public User getCustodian() { return custodian; }
    public void setCustodian(User custodian) { this.custodian = custodian; }

    public String getChangeReason() { return changeReason; }
    public void setChangeReason(String changeReason) { this.changeReason = changeReason; }

    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
