package com.sih.casemanagement.controller;

import com.sih.casemanagement.entity.Case;
import com.sih.casemanagement.entity.DisposalRecord;
import com.sih.casemanagement.entity.RetentionPolicy;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.RetentionDisposalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/retention")
public class RetentionController {

    private final RetentionDisposalService retentionDisposalService;

    public RetentionController(RetentionDisposalService retentionDisposalService) {
        this.retentionDisposalService = retentionDisposalService;
    }

    @GetMapping("/policies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RetentionPolicy>> getPolicies() {
        return ResponseEntity.ok(retentionDisposalService.getAllPolicies());
    }

    @PostMapping("/policies")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER')")
    public ResponseEntity<RetentionPolicy> createPolicy(@RequestBody RetentionPolicy policy) {
        return ResponseEntity.ok(retentionDisposalService.createPolicy(policy));
    }

    @GetMapping("/disposals")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER', 'AUDITOR', 'EVIDENCE_CUSTODIAN')")
    public ResponseEntity<List<DisposalRecord>> getDisposalRecords() {
        return ResponseEntity.ok(retentionDisposalService.getAllDisposalRecords());
    }

    @PostMapping("/cases/{caseId}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER', 'AUDITOR')")
    public ResponseEntity<Case> archiveCase(
        @PathVariable UUID caseId,
        @RequestBody(required = false) Map<String, Object> body,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        String reason = body != null && body.containsKey("reason") ? (String) body.get("reason") : "Statutory evidentiary archival";
        int retentionYears = body != null && body.containsKey("retentionYears") ? Integer.parseInt(body.get("retentionYears").toString()) : 10;
        String wormMode = body != null && body.containsKey("wormMode") ? (String) body.get("wormMode") : "COMPLIANCE";
        return ResponseEntity.ok(retentionDisposalService.archiveCase(caseId, principal.getUser(), reason, retentionYears, wormMode));
    }

    @PostMapping("/disposals/{caseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER')")
    public ResponseEntity<DisposalRecord> executeDisposal(
        @PathVariable UUID caseId,
        @RequestBody(required = false) Map<String, String> body,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        String method = body != null ? body.get("method") : "CRYPTOGRAPHIC_ERASURE";
        String notes = body != null ? body.get("notes") : "Statutory disposal authorized";
        return ResponseEntity.ok(retentionDisposalService.executeDisposal(caseId, principal.getUser(), method, notes));
    }
}
