package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "legal_holds")
public class LegalHold {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "placed_by", nullable = false)
    private User placedBy;

    @Column(name = "placed_at", nullable = false, updatable = false)
    private Instant placedAt = Instant.now();

    @Column(name = "lifted_at")
    private Instant liftedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lifted_by")
    private User liftedBy;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public LegalHold() {}

    public LegalHold(Case aCase, String reason, User placedBy) {
        this.aCase = aCase;
        this.reason = reason;
        this.placedBy = placedBy;
        this.placedAt = Instant.now();
        this.active = true;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public User getPlacedBy() { return placedBy; }
    public void setPlacedBy(User placedBy) { this.placedBy = placedBy; }

    public Instant getPlacedAt() { return placedAt; }
    public void setPlacedAt(Instant placedAt) { this.placedAt = placedAt; }

    public Instant getLiftedAt() { return liftedAt; }
    public void setLiftedAt(Instant liftedAt) { this.liftedAt = liftedAt; }

    public User getLiftedBy() { return liftedBy; }
    public void setLiftedBy(User liftedBy) { this.liftedBy = liftedBy; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
