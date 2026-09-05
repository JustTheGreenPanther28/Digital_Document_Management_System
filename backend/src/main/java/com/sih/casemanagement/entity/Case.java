package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.CasePriority;
import com.sih.casemanagement.common.enums.CaseStatus;
import com.sih.casemanagement.common.enums.DocumentClassification;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cases")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "case_number", nullable = false, unique = true, length = 50)
    private String caseNumber;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "fir_number", unique = true, length = 100)
    private String firNumber;

    @Column(name = "incident_date")
    private Instant incidentDate;

    @Column(name = "registration_date", nullable = false)
    private Instant registrationDate = Instant.now();

    @Column(name = "investigating_agency", nullable = false, length = 100)
    private String investigatingAgency = "Central Investigative Bureau";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CaseStatus status = CaseStatus.REGISTERED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CasePriority priority = CasePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentClassification classification = DocumentClassification.CONFIDENTIAL;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "mfaSecret", "roles"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "is_legal_hold", nullable = false)
    private boolean legalHold = false;

    @Column(name = "legal_hold_reason", columnDefinition = "TEXT")
    private String legalHoldReason;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "mfaSecret", "roles"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legal_hold_by")
    private User legalHoldBy;

    @Column(name = "closed_at")
    private Instant closedAt;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "mfaSecret", "roles"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "closed_by")
    private User closedBy;

    @Column(name = "retention_period_days", nullable = false)
    private int retentionPeriodDays = 3650;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Case() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFirNumber() { return firNumber; }
    public void setFirNumber(String firNumber) { this.firNumber = firNumber; }

    public Instant getIncidentDate() { return incidentDate; }
    public void setIncidentDate(Instant incidentDate) { this.incidentDate = incidentDate; }

    public Instant getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(Instant registrationDate) { this.registrationDate = registrationDate; }

    public String getInvestigatingAgency() { return investigatingAgency; }
    public void setInvestigatingAgency(String investigatingAgency) { this.investigatingAgency = investigatingAgency; }

    public CaseStatus getStatus() { return status; }
    public void setStatus(CaseStatus status) { this.status = status; }

    public CasePriority getPriority() { return priority; }
    public void setPriority(CasePriority priority) { this.priority = priority; }

    public DocumentClassification getClassification() { return classification; }
    public void setClassification(DocumentClassification classification) { this.classification = classification; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public boolean isLegalHold() { return legalHold; }
    public void setLegalHold(boolean legalHold) { this.legalHold = legalHold; }

    public String getLegalHoldReason() { return legalHoldReason; }
    public void setLegalHoldReason(String legalHoldReason) { this.legalHoldReason = legalHoldReason; }

    public User getLegalHoldBy() { return legalHoldBy; }
    public void setLegalHoldBy(User legalHoldBy) { this.legalHoldBy = legalHoldBy; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public User getClosedBy() { return closedBy; }
    public void setClosedBy(User closedBy) { this.closedBy = closedBy; }

    public int getRetentionPeriodDays() { return retentionPeriodDays; }
    public void setRetentionPeriodDays(int retentionPeriodDays) { this.retentionPeriodDays = retentionPeriodDays; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
