package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "evidence_documents", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"evidence_id", "document_id"})
})
public class EvidenceDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "relationship_type", nullable = false, length = 50)
    private String relationshipType = "CHAIN_OF_CUSTODY_DOC";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public EvidenceDocument() {}

    public EvidenceDocument(Evidence evidence, Document document, String relationshipType) {
        this.evidence = evidence;
        this.document = document;
        this.relationshipType = relationshipType;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Evidence getEvidence() { return evidence; }
    public void setEvidence(Evidence evidence) { this.evidence = evidence; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public String getRelationshipType() { return relationshipType; }
    public void setRelationshipType(String relationshipType) { this.relationshipType = relationshipType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
