package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.EvidenceStatus;
import com.sih.casemanagement.common.enums.EvidenceType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "evidence_number", nullable = false, unique = true, length = 50)
    private String evidenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false, length = 50)
    private EvidenceType evidenceType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "collected_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "mfaSecret", "roles"})
    private User collectedBy;

    @Column(name = "collected_at", nullable = false)
    private Instant collectedAt;

    @Column(name = "seizure_location", length = 255)
    private String seizureLocation;

    @Column(name = "seal_number", nullable = false, length = 100)
    private String sealNumber;

    @Column(name = "seal_intact", nullable = false)
    private boolean sealIntact = true;

    @Column(name = "storage_location", nullable = false, length = 255)
    private String storageLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvidenceStatus status = EvidenceStatus.REGISTERED;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_custodian_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "mfaSecret", "roles"})
    private User currentCustodian;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "associated_document_id")
    private Document associatedDocument;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Evidence() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEvidenceNumber() { return evidenceNumber; }
    public void setEvidenceNumber(String evidenceNumber) { this.evidenceNumber = evidenceNumber; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public EvidenceType getEvidenceType() { return evidenceType; }
    public void setEvidenceType(EvidenceType evidenceType) { this.evidenceType = evidenceType; }

    public User getCollectedBy() { return collectedBy; }
    public void setCollectedBy(User collectedBy) { this.collectedBy = collectedBy; }

    public Instant getCollectedAt() { return collectedAt; }
    public void setCollectedAt(Instant collectedAt) { this.collectedAt = collectedAt; }

    public String getSeizureLocation() { return seizureLocation; }
    public void setSeizureLocation(String seizureLocation) { this.seizureLocation = seizureLocation; }

    public String getSealNumber() { return sealNumber; }
    public void setSealNumber(String sealNumber) { this.sealNumber = sealNumber; }

    public boolean isSealIntact() { return sealIntact; }
    public void setSealIntact(boolean sealIntact) { this.sealIntact = sealIntact; }

    public String getStorageLocation() { return storageLocation; }
    public void setStorageLocation(String storageLocation) { this.storageLocation = storageLocation; }

    public EvidenceStatus getStatus() { return status; }
    public void setStatus(EvidenceStatus status) { this.status = status; }

    public User getCurrentCustodian() { return currentCustodian; }
    public void setCurrentCustodian(User currentCustodian) { this.currentCustodian = currentCustodian; }

    public Document getAssociatedDocument() { return associatedDocument; }
    public void setAssociatedDocument(Document associatedDocument) { this.associatedDocument = associatedDocument; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
