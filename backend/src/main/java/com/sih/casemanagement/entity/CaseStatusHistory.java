package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.CaseStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "case_status_history")
public class CaseStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 50)
    private CaseStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 50)
    private CaseStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    public CaseStatusHistory() {}

    public CaseStatusHistory(Case aCase, CaseStatus fromStatus, CaseStatus toStatus, User changedBy, String reason) {
        this.aCase = aCase;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
        this.reason = reason;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public CaseStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(CaseStatus fromStatus) { this.fromStatus = fromStatus; }

    public CaseStatus getToStatus() { return toStatus; }
    public void setToStatus(CaseStatus toStatus) { this.toStatus = toStatus; }

    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
