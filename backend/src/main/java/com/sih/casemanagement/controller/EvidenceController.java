package com.sih.casemanagement.controller;

import com.sih.casemanagement.dto.AcceptTransferRequest;
import com.sih.casemanagement.dto.RegisterEvidenceRequest;
import com.sih.casemanagement.dto.TransferRequestDto;
import com.sih.casemanagement.entity.CustodyRecord;
import com.sih.casemanagement.entity.Evidence;
import com.sih.casemanagement.entity.EvidenceTransfer;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.UserRepository;
import com.sih.casemanagement.security.AbacSecurityService;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.EvidenceAndCustodyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class EvidenceController {

    private final EvidenceAndCustodyService evidenceService;
    private final UserRepository userRepository;
    private final AbacSecurityService abacSecurity;

    public EvidenceController(EvidenceAndCustodyService evidenceService, UserRepository userRepository, AbacSecurityService abacSecurity) {
        this.evidenceService = evidenceService;
        this.userRepository = userRepository;
        this.abacSecurity = abacSecurity;
    }

    @PostMapping("/cases/{caseId}/evidence")
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'EVIDENCE_CUSTODIAN', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<Evidence> registerEvidence(
        @PathVariable UUID caseId,
        @Valid @RequestBody RegisterEvidenceRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User collectingOfficer = userRepository.findById(principal.getId()).orElseThrow();
        User custodian = request.custodianUserId() != null ?
            userRepository.findById(request.custodianUserId()).orElse(collectingOfficer) : collectingOfficer;

        Evidence evidence = evidenceService.registerEvidence(
            caseId,
            request.title(),
            request.description(),
            request.evidenceType(),
            request.seizureLocation(),
            request.sealNumber(),
            request.storageLocation(),
            collectingOfficer,
            custodian,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(evidence);
    }

    @GetMapping("/cases/{caseId}/evidence")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Evidence>> getEvidenceForCase(
        @PathVariable UUID caseId
    ) {
        return ResponseEntity.ok(evidenceService.getEvidenceForCase(caseId));
    }

    @PostMapping("/evidence/{evidenceId}/transfer-request")
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'EVIDENCE_CUSTODIAN', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<EvidenceTransfer> requestTransfer(
        @PathVariable UUID evidenceId,
        @Valid @RequestBody TransferRequestDto request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User sender = userRepository.findById(principal.getId()).orElseThrow();
        EvidenceTransfer transfer = evidenceService.requestTransfer(
            evidenceId,
            request.recipientId(),
            request.sealNumber(),
            request.reason(),
            sender,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(transfer);
    }

    @PostMapping("/evidence/transfers/{transferId}/accept")
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'EVIDENCE_CUSTODIAN', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> acceptTransfer(
        @PathVariable UUID transferId,
        @RequestBody AcceptTransferRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User recipient = userRepository.findById(principal.getId()).orElseThrow();
        evidenceService.acceptTransfer(
            transferId,
            request.verifiedSealNumber(),
            request.acceptanceSignature(),
            recipient,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(Map.of("message", "Evidence transfer accepted and custody updated."));
    }

    @PostMapping("/evidence/transfers/{transferId}/reject")
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'EVIDENCE_CUSTODIAN', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> rejectTransfer(
        @PathVariable UUID transferId,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User recipient = userRepository.findById(principal.getId()).orElseThrow();
        String reason = body.getOrDefault("reason", "Seal integrity damaged / rejected by recipient");
        evidenceService.rejectTransfer(transferId, reason, recipient, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "Evidence transfer rejected."));
    }

    @GetMapping("/evidence/{evidenceId}/custody")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CustodyRecord>> getCustodyHistory(
        @PathVariable UUID evidenceId
    ) {
        return ResponseEntity.ok(evidenceService.getCustodyHistory(evidenceId));
    }

    @GetMapping("/evidence/transfers/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EvidenceTransfer>> getPendingTransfers(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(evidenceService.getPendingTransfersForUser(principal.getId()));
    }
}
