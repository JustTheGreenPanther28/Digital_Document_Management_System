package com.sih.casemanagement.controller;

import com.sih.casemanagement.entity.BlockchainTxReceipt;
import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.Evidence;
import com.sih.casemanagement.repository.DocumentRepository;
import com.sih.casemanagement.repository.EvidenceRepository;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.BlockchainEvidenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/blockchain")
public class BlockchainController {

    private final BlockchainEvidenceService blockchainService;
    private final EvidenceRepository evidenceRepository;
    private final DocumentRepository documentRepository;

    public BlockchainController(
        BlockchainEvidenceService blockchainService,
        EvidenceRepository evidenceRepository,
        DocumentRepository documentRepository
    ) {
        this.blockchainService = blockchainService;
        this.evidenceRepository = evidenceRepository;
        this.documentRepository = documentRepository;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getBlockchainStatus() {
        return ResponseEntity.ok(blockchainService.getBlockchainStatus());
    }

    @GetMapping("/receipts")
    public ResponseEntity<Map<String, Object>> getRecentReceipts() {
        return ResponseEntity.ok(blockchainService.getBlockchainStatus());
    }

    @GetMapping("/receipts/case/{caseId}")
    public ResponseEntity<List<BlockchainTxReceipt>> getReceiptsForCase(@PathVariable UUID caseId) {
        return ResponseEntity.ok(blockchainService.getReceiptsForCase(caseId));
    }

    @GetMapping("/receipts/{entityType}/{entityId}")
    public ResponseEntity<BlockchainTxReceipt> getReceiptForEntity(
        @PathVariable String entityType,
        @PathVariable String entityId
    ) {
        return blockchainService.getReceiptForEntity(entityType, entityId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Verifies an Evidence item on-chain against its current recorded SHA-256 hash.
     */
    @GetMapping("/evidence/{evidenceIdentifier}/verify")
    public ResponseEntity<Map<String, Object>> verifyEvidence(
        @PathVariable String evidenceIdentifier,
        @RequestParam(required = false) String currentHash
    ) {
        String hashToVerify = currentHash;
        String evidenceNumber = evidenceIdentifier;

        // If UUID is passed, resolve evidenceNumber
        try {
            UUID id = UUID.fromString(evidenceIdentifier);
            Evidence ev = evidenceRepository.findById(id).orElse(null);
            if (ev != null) {
                evidenceNumber = ev.getEvidenceNumber();
                if (hashToVerify == null || hashToVerify.isBlank()) {
                    // Compute expected hash or use seal hash
                    hashToVerify = computeEvidenceSha256(ev);
                }
            }
        } catch (IllegalArgumentException notUuid) {
            Evidence ev = evidenceRepository.findByEvidenceNumber(evidenceIdentifier).orElse(null);
            if (ev != null && (hashToVerify == null || hashToVerify.isBlank())) {
                hashToVerify = computeEvidenceSha256(ev);
            }
        }

        if (hashToVerify == null || hashToVerify.isBlank()) {
            hashToVerify = "0000000000000000000000000000000000000000000000000000000000000000";
        }

        Map<String, Object> verification = blockchainService.verifyEvidenceOnChain(evidenceNumber, hashToVerify);
        return ResponseEntity.ok(verification);
    }

    /**
     * Anchors an Evidence item onto the Blockchain if not yet anchored.
     */
    @PostMapping("/evidence/{evidenceIdentifier}/anchor")
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'EVIDENCE_CUSTODIAN', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<BlockchainTxReceipt> anchorEvidence(
        @PathVariable String evidenceIdentifier,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Evidence ev = null;
        try {
            UUID id = UUID.fromString(evidenceIdentifier);
            ev = evidenceRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException ignored) {}

        if (ev == null) {
            ev = evidenceRepository.findByEvidenceNumber(evidenceIdentifier).orElse(null);
        }

        if (ev == null) {
            return ResponseEntity.notFound().build();
        }

        String sha256 = computeEvidenceSha256(ev);
        String custodian = ev.getCurrentCustodian() != null ? ev.getCurrentCustodian().getUsername() : principal.getUsername();
        UUID caseId = ev.getCase() != null ? ev.getCase().getId() : null;

        BlockchainTxReceipt receipt = blockchainService.recordEvidenceOnChain(
            ev.getEvidenceNumber(),
            sha256,
            ev.getStorageLocation(),
            custodian,
            caseId
        );

        return ResponseEntity.ok(receipt);
    }

    /**
     * Verifies a Document on-chain against its current SHA-256 hash.
     */
    @GetMapping("/document/{documentId}/verify")
    public ResponseEntity<Map<String, Object>> verifyDocument(
        @PathVariable UUID documentId,
        @RequestParam(defaultValue = "1") int version
    ) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        String currentHash = doc != null ? doc.getSha256Hash() : "0000000000000000000000000000000000000000000000000000000000000000";

        Map<String, Object> verification = blockchainService.verifyDocumentOnChain(
            documentId.toString(),
            doc != null ? doc.getCurrentVersion() : version,
            currentHash
        );
        return ResponseEntity.ok(verification);
    }

    /**
     * Anchors a Document onto the Blockchain.
     */
    @PostMapping("/document/{documentId}/anchor")
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'EVIDENCE_CUSTODIAN', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<BlockchainTxReceipt> anchorDocument(
        @PathVariable UUID documentId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        String uploader = doc.getUploadedBy() != null ? doc.getUploadedBy().getUsername() : principal.getUsername();
        UUID caseId = doc.getCase() != null ? doc.getCase().getId() : null;

        BlockchainTxReceipt receipt = blockchainService.recordDocumentOnChain(
            doc.getId(),
            doc.getSha256Hash(),
            doc.getCurrentVersion(),
            uploader,
            caseId,
            doc.getTitle()
        );

        return ResponseEntity.ok(receipt);
    }

    private String computeEvidenceSha256(Evidence ev) {
        if (ev.getAssociatedDocument() != null && ev.getAssociatedDocument().getSha256Hash() != null) {
            return ev.getAssociatedDocument().getSha256Hash();
        }
        // Deterministic evidence hash from identity fields:
        // SHA256(evidenceNumber + sealNumber + title + storageLocation + collectedAt)
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String identity = ev.getEvidenceNumber() + ":" + ev.getSealNumber() + ":" + ev.getTitle() + ":" + ev.getStorageLocation();
            byte[] digest = md.digest(identity.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        }
    }
}
