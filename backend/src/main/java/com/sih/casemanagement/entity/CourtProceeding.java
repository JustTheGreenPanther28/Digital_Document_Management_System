package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "court_proceedings")
public class CourtProceeding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filing_id", nullable = false)
    private CourtFiling filing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @Column(name = "hearing_date", nullable = false)
    private Instant hearingDate;

    @Column(name = "judge_name", nullable = false, length = 100)
    private String judgeName;

    @Column(name = "proceedings_summary", nullable = false, columnDefinition = "TEXT")
    private String proceedingsSummary;

    @Column(name = "next_hearing_date")
    private Instant nextHearingDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public CourtProceeding() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public CourtFiling getFiling() { return filing; }
    public void setFiling(CourtFiling filing) { this.filing = filing; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public Instant getHearingDate() { return hearingDate; }
    public void setHearingDate(Instant hearingDate) { this.hearingDate = hearingDate; }

    public String getJudgeName() { return judgeName; }
    public void setJudgeName(String judgeName) { this.judgeName = judgeName; }

    public String getProceedingsSummary() { return proceedingsSummary; }
    public void setProceedingsSummary(String proceedingsSummary) { this.proceedingsSummary = proceedingsSummary; }

    public Instant getNextHearingDate() { return nextHearingDate; }
    public void setNextHearingDate(Instant nextHearingDate) { this.nextHearingDate = nextHearingDate; }

    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
