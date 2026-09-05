package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "case_user_assignments")
public class CaseUserAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "role_in_case", nullable = false, length = 50)
    private String roleInCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt = Instant.now();

    @Column(name = "removed_at")
    private Instant removedAt;

    @Column(nullable = false)
    private boolean active = true;

    public CaseUserAssignment() {}

    public CaseUserAssignment(Case aCase, User user, String roleInCase, User assignedBy) {
        this.aCase = aCase;
        this.user = user;
        this.roleInCase = roleInCase;
        this.assignedBy = assignedBy;
        this.active = true;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRoleInCase() { return roleInCase; }
    public void setRoleInCase(String roleInCase) { this.roleInCase = roleInCase; }

    public User getAssignedBy() { return assignedBy; }
    public void setAssignedBy(User assignedBy) { this.assignedBy = assignedBy; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public Instant getRemovedAt() { return removedAt; }
    public void setRemovedAt(Instant removedAt) { this.removedAt = removedAt; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
