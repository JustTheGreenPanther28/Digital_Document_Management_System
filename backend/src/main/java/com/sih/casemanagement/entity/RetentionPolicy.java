package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.SecurityClearance;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "retention_policies")
public class RetentionPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "retention_years", nullable = false)
    private int retentionYears = 10;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SecurityClearance classification = SecurityClearance.CONFIDENTIAL;

    @Column(name = "action_on_expiry", nullable = false, length = 50)
    private String actionOnExpiry = "SECURE_DISPOSAL";

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public RetentionPolicy() {}

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getRetentionYears() { return retentionYears; }
    public void setRetentionYears(int retentionYears) { this.retentionYears = retentionYears; }

    public SecurityClearance getClassification() { return classification; }
    public void setClassification(SecurityClearance classification) { this.classification = classification; }

    public String getActionOnExpiry() { return actionOnExpiry; }
    public void setActionOnExpiry(String actionOnExpiry) { this.actionOnExpiry = actionOnExpiry; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
