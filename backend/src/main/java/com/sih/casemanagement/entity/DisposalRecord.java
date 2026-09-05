package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "disposal_records")
public class DisposalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private Case relatedCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document relatedDocument;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private Evidence relatedEvidence;

    @Column(name = "disposal_method", nullable = false, length = 50)
    private String disposalMethod = "CRYPTOGRAPHIC_ERASURE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disposed_by", nullable = false)
    private User disposedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by", nullable = false)
    private User approvedBy;

    @Column(name = "certificate_hash", nullable = false, length = 64)
    private String certificateHash;

    @Column(name = "certificate_path", length = 500)
    private String certificatePath;

    @Column(name = "disposal_notes", columnDefinition = "TEXT")
    private String disposalNotes;

    @Column(name = "disposed_at", nullable = false, updatable = false)
    private LocalDateTime disposedAt = LocalDateTime.now();

    public DisposalRecord() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getRelatedCase() { return relatedCase; }
    public void setRelatedCase(Case relatedCase) { this.relatedCase = relatedCase; }

    public Document getRelatedDocument() { return relatedDocument; }
    public void setRelatedDocument(Document relatedDocument) { this.relatedDocument = relatedDocument; }

    public Evidence getRelatedEvidence() { return relatedEvidence; }
    public void setRelatedEvidence(Evidence relatedEvidence) { this.relatedEvidence = relatedEvidence; }

    public String getDisposalMethod() { return disposalMethod; }
    public void setDisposalMethod(String disposalMethod) { this.disposalMethod = disposalMethod; }

    public User getDisposedBy() { return disposedBy; }
    public void setDisposedBy(User disposedBy) { this.disposedBy = disposedBy; }

    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }

    public String getCertificateHash() { return certificateHash; }
    public void setCertificateHash(String certificateHash) { this.certificateHash = certificateHash; }

    public String getCertificatePath() { return certificatePath; }
    public void setCertificatePath(String certificatePath) { this.certificatePath = certificatePath; }

    public String getDisposalNotes() { return disposalNotes; }
    public void setDisposalNotes(String disposalNotes) { this.disposalNotes = disposalNotes; }

    public LocalDateTime getDisposedAt() { return disposedAt; }
    public void setDisposedAt(LocalDateTime disposedAt) { this.disposedAt = disposedAt; }
}
