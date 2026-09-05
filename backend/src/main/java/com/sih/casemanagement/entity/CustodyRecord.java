package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "custody_records")
public class CustodyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @Column(nullable = false, length = 50)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_custodian_id")
    private User fromCustodian;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_custodian_id")
    private User toCustodian;

    @Column(name = "seal_number", length = 100)
    private String sealNumber;

    @Column(name = "seal_verified", nullable = false)
    private boolean sealVerified = true;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "digital_signature", columnDefinition = "TEXT")
    private String digitalSignature;

    @Column(nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    public CustodyRecord() {}

    public CustodyRecord(Evidence evidence, Case aCase, String action, User fromCustodian, User toCustodian,
                         String sealNumber, boolean sealVerified, String reason, String digitalSignature) {
        this.evidence = evidence;
        this.aCase = aCase;
        this.action = action;
        this.fromCustodian = fromCustodian;
        this.toCustodian = toCustodian;
        this.sealNumber = sealNumber;
        this.sealVerified = sealVerified;
        this.reason = reason;
        this.digitalSignature = digitalSignature;
        this.timestamp = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Evidence getEvidence() { return evidence; }
    public void setEvidence(Evidence evidence) { this.evidence = evidence; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public User getFromCustodian() { return fromCustodian; }
    public void setFromCustodian(User fromCustodian) { this.fromCustodian = fromCustodian; }

    public User getToCustodian() { return toCustodian; }
    public void setToCustodian(User toCustodian) { this.toCustodian = toCustodian; }

    public String getSealNumber() { return sealNumber; }
    public void setSealNumber(String sealNumber) { this.sealNumber = sealNumber; }

    public boolean isSealVerified() { return sealVerified; }
    public void setSealVerified(boolean sealVerified) { this.sealVerified = sealVerified; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDigitalSignature() { return digitalSignature; }
    public void setDigitalSignature(String digitalSignature) { this.digitalSignature = digitalSignature; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
