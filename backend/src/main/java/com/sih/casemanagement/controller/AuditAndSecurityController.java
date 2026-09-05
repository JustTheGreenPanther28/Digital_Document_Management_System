package com.sih.casemanagement.controller;

import com.sih.casemanagement.entity.AuditLog;
import com.sih.casemanagement.entity.SecurityAlert;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.AuditLogRepository;
import com.sih.casemanagement.repository.SecurityAlertRepository;
import com.sih.casemanagement.repository.UserRepository;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AuditAndSecurityController {

    private final AuditService auditService;
    private final AuditLogRepository auditLogRepository;
    private final SecurityAlertRepository alertRepository;
    private final UserRepository userRepository;

    public AuditAndSecurityController(
        AuditService auditService,
        AuditLogRepository auditLogRepository,
        SecurityAlertRepository alertRepository,
        UserRepository userRepository
    ) {
        this.auditService = auditService;
        this.auditLogRepository = auditLogRepository;
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/audit/logs")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN', 'SENIOR_OFFICER')")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@RequestParam(value = "caseId", required = false) UUID caseId) {
        if (caseId != null) {
            return ResponseEntity.ok(auditLogRepository.findByCaseIdOrderByTimestampDesc(caseId));
        }
        return ResponseEntity.ok(auditLogRepository.findTop50ByOrderByTimestampDesc());
    }

    @GetMapping("/audit/verify")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN', 'SENIOR_OFFICER')")
    public ResponseEntity<Map<String, Object>> verifyAuditChain() {
        Map<String, Object> report = auditService.verifyAuditChain();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/security/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'SENIOR_OFFICER')")
    public ResponseEntity<List<SecurityAlert>> getSecurityAlerts() {
        return ResponseEntity.ok(alertRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/security/alerts/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SecurityAlert> resolveAlert(
        @PathVariable UUID id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        SecurityAlert alert = alertRepository.findById(id).orElseThrow();
        User admin = userRepository.findById(principal.getId()).orElseThrow();
        alert.setResolved(true);
        alert.setResolvedBy(admin);
        alert.setResolutionNotes(body.getOrDefault("notes", "Resolved by administrator."));
        return ResponseEntity.ok(alertRepository.save(alert));
    }
}
