package com.sih.casemanagement.controller;

import com.sih.casemanagement.common.enums.AuditEventType;
import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.entity.SecurityAlert;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.SecurityAlertRepository;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/quarantine")
public class QuarantineController {

    private final SecurityAlertRepository alertRepository;
    private final AuditService auditService;

    public QuarantineController(
        SecurityAlertRepository alertRepository,
        AuditService auditService
    ) {
        this.alertRepository = alertRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'FORENSIC_OFFICER', 'SENIOR_OFFICER')")
    public ResponseEntity<List<SecurityAlert>> getQuarantinedItems() {
        return ResponseEntity.ok(alertRepository.findAll());
    }

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER')")
    public ResponseEntity<SecurityAlert> releaseQuarantinedItem(
        @PathVariable UUID id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest request
    ) {
        SecurityAlert alert = alertRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Quarantined alert not found: " + id));

        String notes = body.getOrDefault("notes", "Administrative override: File verified as false positive.");
        alert.setResolved(true);
        if (principal != null && principal.getUser() != null) {
            alert.setResolvedBy(principal.getUser());
        }
        alert.setResolutionNotes(notes);
        SecurityAlert saved = alertRepository.save(alert);

        auditService.logEvent(
            AuditEventType.SECURITY_ALERT,
            principal != null ? principal.getId() : null,
            principal != null ? principal.getUsername() : "SYSTEM",
            principal != null && !principal.getAuthorities().isEmpty() ? principal.getAuthorities().iterator().next().getAuthority() : "ADMIN",
            alert.getCaseId(),
            "QUARANTINE_RELEASE",
            alert.getId().toString(),
            request.getRemoteAddr(),
            null,
            "Quarantine release authorized: " + notes
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> purgeQuarantinedItem(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest request
    ) {
        SecurityAlert alert = alertRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Quarantined alert not found: " + id));

        alertRepository.delete(alert);

        auditService.logEvent(
            AuditEventType.SECURITY_ALERT,
            principal != null ? principal.getId() : null,
            principal != null ? principal.getUsername() : "ADMIN",
            "ADMIN",
            alert.getCaseId(),
            "QUARANTINE_PURGE",
            id.toString(),
            request.getRemoteAddr(),
            null,
            "Quarantined malicious artifact purged from isolation repository"
        );

        return ResponseEntity.ok(Map.of("message", "Quarantined item permanently purged."));
    }
}
