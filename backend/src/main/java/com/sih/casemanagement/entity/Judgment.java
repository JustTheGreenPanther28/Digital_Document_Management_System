package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "judgments")
public class Judgment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filing_id", nullable = false)
    private CourtFiling filing;

    @Column(nullable = false, length = 50)
    private String verdict; // CONVICTED, ACQUITTED, DISMISSED, SETTLED

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "judgment_date", nullable = false)
    private Instant judgmentDate;

    @Column(name = "judge_name", nullable = false, length = 100)
    private String judgeName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Judgment() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public CourtFiling getFiling() { return filing; }
    public void setFiling(CourtFiling filing) { this.filing = filing; }

    public String getVerdict() { return verdict; }
    public void setVerdict(String verdict) { this.verdict = verdict; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public Instant getJudgmentDate() { return judgmentDate; }
    public void setJudgmentDate(Instant judgmentDate) { this.judgmentDate = judgmentDate; }

    public String getJudgeName() { return judgeName; }
    public void setJudgeName(String judgeName) { this.judgeName = judgeName; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
