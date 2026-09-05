package com.sih.casemanagement.entity;

import com.sih.casemanagement.common.enums.TransferStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_transfers")
public class EvidenceTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "seal_number", nullable = false, length = 100)
    private String sealNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransferStatus status = TransferStatus.PENDING;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "actioned_at")
    private Instant actionedAt;

    @Column(name = "action_notes", columnDefinition = "TEXT")
    private String actionNotes;

    @Column(name = "acceptance_signature", columnDefinition = "TEXT")
    private String acceptanceSignature;

    public EvidenceTransfer() {}

    public EvidenceTransfer(Evidence evidence, Case aCase, User sender, User recipient, String sealNumber, String reason) {
        this.evidence = evidence;
        this.aCase = aCase;
        this.sender = sender;
        this.recipient = recipient;
        this.sealNumber = sealNumber;
        this.reason = reason;
        this.status = TransferStatus.PENDING;
        this.requestedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Evidence getEvidence() { return evidence; }
    public void setEvidence(Evidence evidence) { this.evidence = evidence; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }

    public User getRecipient() { return recipient; }
    public void setRecipient(User recipient) { this.recipient = recipient; }

    public String getSealNumber() { return sealNumber; }
    public void setSealNumber(String sealNumber) { this.sealNumber = sealNumber; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public TransferStatus getStatus() { return status; }
    public void setStatus(TransferStatus status) { this.status = status; }

    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }

    public Instant getActionedAt() { return actionedAt; }
    public void setActionedAt(Instant actionedAt) { this.actionedAt = actionedAt; }

    public String getActionNotes() { return actionNotes; }
    public void setActionNotes(String actionNotes) { this.actionNotes = actionNotes; }

    public String getAcceptanceSignature() { return acceptanceSignature; }
    public void setAcceptanceSignature(String acceptanceSignature) { this.acceptanceSignature = acceptanceSignature; }
}
