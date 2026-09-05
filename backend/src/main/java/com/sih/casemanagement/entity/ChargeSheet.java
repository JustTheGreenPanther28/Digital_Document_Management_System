package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.ApprovalStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "charge_sheets")
public class ChargeSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prepared_by")
    private User preparedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_officer_id")
    private User seniorOfficer;

    @Enumerated(EnumType.STRING)
    @Column(name = "senior_officer_approval_status", nullable = false, length = 20)
    private ApprovalStatus seniorOfficerApprovalStatus = ApprovalStatus.PENDING;

    @Column(name = "senior_officer_review_notes", columnDefinition = "TEXT")
    private String seniorOfficerReviewNotes;

    @Column(name = "senior_officer_reviewed_at")
    private Instant seniorOfficerReviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prosecutor_id")
    private User prosecutor;

    @Enumerated(EnumType.STRING)
    @Column(name = "prosecutor_approval_status", nullable = false, length = 20)
    private ApprovalStatus prosecutorApprovalStatus = ApprovalStatus.PENDING;

    @Column(name = "prosecutor_review_notes", columnDefinition = "TEXT")
    private String prosecutorReviewNotes;

    @Column(name = "prosecutor_approved_at")
    private Instant prosecutorApprovedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signature_id")
    private DigitalSignature signature;

    @Column(nullable = false, length = 30)
    private String status = "DRAFT"; // DRAFT, SUBMITTED_FOR_REVIEW, REVIEWED, APPROVED, SIGNED, LOCKED

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ChargeSheet() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public User getPreparedBy() { return preparedBy; }
    public void setPreparedBy(User preparedBy) { this.preparedBy = preparedBy; }

    public User getSeniorOfficer() { return seniorOfficer; }
    public void setSeniorOfficer(User seniorOfficer) { this.seniorOfficer = seniorOfficer; }

    public ApprovalStatus getSeniorOfficerApprovalStatus() { return seniorOfficerApprovalStatus; }
    public void setSeniorOfficerApprovalStatus(ApprovalStatus seniorOfficerApprovalStatus) { this.seniorOfficerApprovalStatus = seniorOfficerApprovalStatus; }

    public String getSeniorOfficerReviewNotes() { return seniorOfficerReviewNotes; }
    public void setSeniorOfficerReviewNotes(String seniorOfficerReviewNotes) { this.seniorOfficerReviewNotes = seniorOfficerReviewNotes; }

    public Instant getSeniorOfficerReviewedAt() { return seniorOfficerReviewedAt; }
    public void setSeniorOfficerReviewedAt(Instant seniorOfficerReviewedAt) { this.seniorOfficerReviewedAt = seniorOfficerReviewedAt; }

    public User getProsecutor() { return prosecutor; }
    public void setProsecutor(User prosecutor) { this.prosecutor = prosecutor; }

    public ApprovalStatus getProsecutorApprovalStatus() { return prosecutorApprovalStatus; }
    public void setProsecutorApprovalStatus(ApprovalStatus prosecutorApprovalStatus) { this.prosecutorApprovalStatus = prosecutorApprovalStatus; }

    public String getProsecutorReviewNotes() { return prosecutorReviewNotes; }
    public void setProsecutorReviewNotes(String prosecutorReviewNotes) { this.prosecutorReviewNotes = prosecutorReviewNotes; }

    public Instant getProsecutorApprovedAt() { return prosecutorApprovedAt; }
    public void setProsecutorApprovedAt(Instant prosecutorApprovedAt) { this.prosecutorApprovedAt = prosecutorApprovedAt; }

    public DigitalSignature getSignature() { return signature; }
    public void setSignature(DigitalSignature signature) { this.signature = signature; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
