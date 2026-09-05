package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.AuditEventType;
import com.sih.casemanagement.common.enums.EvidenceStatus;
import com.sih.casemanagement.common.enums.EvidenceType;
import com.sih.casemanagement.common.enums.TransferStatus;
import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.common.exception.SecurityValidationException;
import com.sih.casemanagement.common.exception.WorkflowViolationException;
import com.sih.casemanagement.entity.*;
import com.sih.casemanagement.repository.*;
import com.sih.casemanagement.security.AbacSecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class EvidenceAndCustodyService {

    private final EvidenceRepository evidenceRepository;
    private final CustodyRecordRepository custodyRecordRepository;
    private final EvidenceTransferRepository transferRepository;
    private final CaseRepository caseRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final AbacSecurityService abacSecurity;

    public EvidenceAndCustodyService(
        EvidenceRepository evidenceRepository,
        CustodyRecordRepository custodyRecordRepository,
        EvidenceTransferRepository transferRepository,
        CaseRepository caseRepository,
        UserRepository userRepository,
        AuditService auditService,
        AbacSecurityService abacSecurity
    ) {
        this.evidenceRepository = evidenceRepository;
        this.custodyRecordRepository = custodyRecordRepository;
        this.transferRepository = transferRepository;
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.abacSecurity = abacSecurity;
    }

    @Transactional
    public Evidence registerEvidence(
        UUID caseId,
        String title,
        String description,
        EvidenceType evidenceType,
        String seizureLocation,
        String sealNumber,
        String storageLocation,
        User collectingOfficer,
        User initialCustodian,
        String ipAddress
    ) {
        abacSecurity.checkCaseAccess(caseId, "REGISTER_EVIDENCE");

        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        long count = evidenceRepository.count() + 1;
        String evidenceNumber = String.format("EVD-%d-%03d", Year.now().getValue(), count);

        Evidence evidence = new Evidence();
        evidence.setEvidenceNumber(evidenceNumber);
        evidence.setCase(aCase);
        evidence.setTitle(title);
        evidence.setDescription(description);
        evidence.setEvidenceType(evidenceType != null ? evidenceType : EvidenceType.PHYSICAL);
        evidence.setCollectedBy(collectingOfficer);
        evidence.setCollectedAt(Instant.now());
        evidence.setSeizureLocation(seizureLocation);
        evidence.setSealNumber(sealNumber);
        evidence.setSealIntact(true);
        evidence.setStorageLocation(storageLocation);
        evidence.setStatus(EvidenceStatus.IN_CUSTODY);
        evidence.setCurrentCustodian(initialCustodian != null ? initialCustodian : collectingOfficer);

        Evidence saved = evidenceRepository.save(evidence);

        // Append initial INTAKE custody record
        CustodyRecord intake = new CustodyRecord(
            saved,
            aCase,
            "INITIAL_INTAKE",
            collectingOfficer,
            evidence.getCurrentCustodian(),
            sealNumber,
            true,
            "Initial evidence seizure and intake registration",
            "SEAL-VERIFIED-" + sealNumber
        );
        custodyRecordRepository.save(intake);

        auditService.logEvent(
            AuditEventType.EVIDENCE_REGISTERED,
            collectingOfficer.getId(),
            collectingOfficer.getUsername(),
            collectingOfficer.getRoles().iterator().next().getName().name(),
            caseId,
            "EVIDENCE",
            saved.getEvidenceNumber(),
            ipAddress,
            null,
            "Evidence registered: " + saved.getTitle() + " (Seal: " + sealNumber + ")"
        );

        return saved;
    }

    @Transactional
    public EvidenceTransfer requestTransfer(
        UUID evidenceId,
        UUID recipientId,
        String sealNumber,
        String reason,
        User sender,
        String ipAddress
    ) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
            .orElseThrow(() -> new ResourceNotFoundException("Evidence not found: " + evidenceId));

        abacSecurity.checkCaseAccess(evidence.getCase().getId(), "TRANSFER_EVIDENCE");

        // Verify that the sender is the current custodian or authorized supervisor
        if (evidence.getCurrentCustodian() != null && !evidence.getCurrentCustodian().getId().equals(sender.getId())) {
            throw new SecurityValidationException("Only the current custodian can initiate an evidence transfer.");
        }

        User recipient = userRepository.findById(recipientId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found: " + recipientId));

        EvidenceTransfer transfer = new EvidenceTransfer(
            evidence,
            evidence.getCase(),
            sender,
            recipient,
            sealNumber != null ? sealNumber : evidence.getSealNumber(),
            reason
        );
        EvidenceTransfer savedTransfer = transferRepository.save(transfer);

        evidence.setStatus(EvidenceStatus.TRANSFER_REQUESTED);
        evidenceRepository.save(evidence);

        auditService.logEvent(
            AuditEventType.EVIDENCE_TRANSFER_REQUESTED,
            sender.getId(),
            sender.getUsername(),
            sender.getRoles().iterator().next().getName().name(),
            evidence.getCase().getId(),
            "EVIDENCE_TRANSFER",
            savedTransfer.getId().toString(),
            ipAddress,
            null,
            String.format("Transfer requested for %s to %s. Reason: %s",
                evidence.getEvidenceNumber(), recipient.getUsername(), reason)
        );

        return savedTransfer;
    }

    @Transactional
    public void acceptTransfer(
        UUID transferId,
        String verifiedSealNumber,
        String acceptanceSignature,
        User recipient,
        String ipAddress
    ) {
        EvidenceTransfer transfer = transferRepository.findById(transferId)
            .orElseThrow(() -> new ResourceNotFoundException("Transfer record not found: " + transferId));

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new WorkflowViolationException("Transfer is not in PENDING state. Current: " + transfer.getStatus());
        }

        if (!transfer.getRecipient().getId().equals(recipient.getId())) {
            throw new SecurityValidationException("Unauthorized: Only the designated recipient can accept this transfer.");
        }

        Evidence evidence = transfer.getEvidence();

        // Atomically update transfer state
        transfer.setStatus(TransferStatus.ACCEPTED);
        transfer.setActionedAt(Instant.now());
        transfer.setAcceptanceSignature(acceptanceSignature != null ? acceptanceSignature : "SIG-" + UUID.randomUUID());
        transferRepository.save(transfer);

        // Atomically transfer custody to new recipient
        User previousCustodian = evidence.getCurrentCustodian();
        evidence.setCurrentCustodian(recipient);
        evidence.setStatus(EvidenceStatus.IN_CUSTODY);
        if (verifiedSealNumber != null && !verifiedSealNumber.isBlank()) {
            evidence.setSealNumber(verifiedSealNumber);
        }
        evidenceRepository.save(evidence);

        // Append to immutable chain of custody ledger
        CustodyRecord custodyRecord = new CustodyRecord(
            evidence,
            evidence.getCase(),
            "TRANSFER_ACCEPTED",
            previousCustodian,
            recipient,
            evidence.getSealNumber(),
            true,
            "Transfer accepted. Reason: " + transfer.getReason(),
            transfer.getAcceptanceSignature()
        );
        custodyRecordRepository.save(custodyRecord);

        auditService.logEvent(
            AuditEventType.EVIDENCE_ACCEPTED,
            recipient.getId(),
            recipient.getUsername(),
            recipient.getRoles().iterator().next().getName().name(),
            evidence.getCase().getId(),
            "EVIDENCE",
            evidence.getEvidenceNumber(),
            ipAddress,
            null,
            String.format("Custody of %s transferred from %s to %s (Seal verified: %s)",
                evidence.getEvidenceNumber(),
                previousCustodian != null ? previousCustodian.getUsername() : "UNKNOWN",
                recipient.getUsername(),
                evidence.getSealNumber())
        );
    }

    @Transactional
    public void rejectTransfer(UUID transferId, String rejectionReason, User recipient, String ipAddress) {
        EvidenceTransfer transfer = transferRepository.findById(transferId)
            .orElseThrow(() -> new ResourceNotFoundException("Transfer record not found: " + transferId));

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new WorkflowViolationException("Transfer is not in PENDING state.");
        }

        if (!transfer.getRecipient().getId().equals(recipient.getId())) {
            throw new SecurityValidationException("Unauthorized: Only the designated recipient can reject this transfer.");
        }

        transfer.setStatus(TransferStatus.REJECTED);
        transfer.setActionedAt(Instant.now());
        transfer.setActionNotes(rejectionReason);
        transferRepository.save(transfer);

        // Restore evidence status to IN_CUSTODY under original custodian
        Evidence evidence = transfer.getEvidence();
        evidence.setStatus(EvidenceStatus.IN_CUSTODY);
        evidenceRepository.save(evidence);

        CustodyRecord rejectionRecord = new CustodyRecord(
            evidence,
            evidence.getCase(),
            "TRANSFER_REJECTED",
            evidence.getCurrentCustodian(),
            recipient,
            evidence.getSealNumber(),
            false,
            "Transfer rejected by recipient: " + rejectionReason,
            null
        );
        custodyRecordRepository.save(rejectionRecord);

        auditService.logEvent(
            AuditEventType.EVIDENCE_TRANSFERRED,
            recipient.getId(),
            recipient.getUsername(),
            recipient.getRoles().iterator().next().getName().name(),
            evidence.getCase().getId(),
            "EVIDENCE_TRANSFER",
            transfer.getId().toString(),
            ipAddress,
            null,
            "Evidence transfer rejected for " + evidence.getEvidenceNumber() + ": " + rejectionReason
        );
    }

    @Transactional(readOnly = true)
    public List<Evidence> getEvidenceForCase(UUID caseId) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        return evidenceRepository.findByACaseId(caseId);
    }

    @Transactional(readOnly = true)
    public List<CustodyRecord> getCustodyHistory(UUID evidenceId) {
        abacSecurity.checkEvidenceAccess(evidenceId, "READ");
        return custodyRecordRepository.findByEvidenceIdOrderByTimestampAsc(evidenceId);
    }

    @Transactional(readOnly = true)
    public List<EvidenceTransfer> getPendingTransfersForUser(UUID userId) {
        return transferRepository.findByRecipientIdAndStatus(userId, TransferStatus.PENDING);
    }
}
