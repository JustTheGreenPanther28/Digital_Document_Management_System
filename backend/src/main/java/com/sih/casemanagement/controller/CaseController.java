package com.sih.casemanagement.controller;

import com.sih.casemanagement.common.enums.RoleType;
import com.sih.casemanagement.dto.AssignTeamRequest;
import com.sih.casemanagement.dto.CaseDetailsResponse;
import com.sih.casemanagement.dto.CreateCaseRequest;
import com.sih.casemanagement.dto.StatusChangeRequest;
import com.sih.casemanagement.entity.Case;
import com.sih.casemanagement.entity.CaseStatusHistory;
import com.sih.casemanagement.entity.CaseUserAssignment;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.UserRepository;
import com.sih.casemanagement.security.AbacSecurityService;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.CaseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/cases")
public class CaseController {

    private final CaseService caseService;
    private final UserRepository userRepository;
    private final AbacSecurityService abacSecurity;
    private final com.sih.casemanagement.service.RetentionDisposalService retentionDisposalService;

    public CaseController(
        CaseService caseService, 
        UserRepository userRepository, 
        AbacSecurityService abacSecurity,
        com.sih.casemanagement.service.RetentionDisposalService retentionDisposalService
    ) {
        this.caseService = caseService;
        this.userRepository = userRepository;
        this.abacSecurity = abacSecurity;
        this.retentionDisposalService = retentionDisposalService;
    }

    @GetMapping
    public ResponseEntity<List<Case>> getAccessibleCases(@AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + RoleType.ADMIN.name()));
        boolean isAuditor = principal.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + RoleType.AUDITOR.name()));

        List<Case> allCases = caseService.getAllCases();

        if (isAdmin || isAuditor) {
            return ResponseEntity.ok(allCases);
        }

        // Enforce ABAC & Clearance
        List<Case> filtered = allCases.stream()
            .filter(c -> principal.getClearance().canAccess(c.getClassification()))
            .filter(c -> abacSecurity.canAccessCase(c.getId(), "READ"))
            .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'INVESTIGATOR', 'ADMIN')")
    public ResponseEntity<Case> createCase(
        @Valid @RequestBody CreateCaseRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User creator = userRepository.findById(principal.getId()).orElseThrow();
        Case created = caseService.createCase(
            request.title(),
            request.description(),
            request.firNumber(),
            request.incidentDate(),
            request.investigatingAgency(),
            request.priority(),
            request.classification(),
            creator,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Transactional(readOnly = true)
    @GetMapping("/{caseId}")
    public ResponseEntity<CaseDetailsResponse> getCaseDetails(
        @PathVariable UUID caseId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        abacSecurity.checkCaseAccess(caseId, "READ");

        Case aCase = caseService.getCaseById(caseId);
        List<CaseUserAssignment> assignments = caseService.getCaseAssignments(caseId);
        List<CaseStatusHistory> statusHistory = caseService.getStatusHistory(caseId);

        return ResponseEntity.ok(CaseDetailsResponse.from(aCase, assignments, statusHistory));
    }

    @PostMapping("/{caseId}/assign")
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<CaseUserAssignment> assignTeam(
        @PathVariable UUID caseId,
        @Valid @RequestBody AssignTeamRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User assigner = userRepository.findById(principal.getId()).orElseThrow();
        CaseUserAssignment assignment = caseService.assignTeamMember(
            caseId,
            request.userId(),
            request.roleInCase(),
            assigner,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(assignment);
    }

    @PostMapping("/{caseId}/status")
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<Case> updateStatus(
        @PathVariable UUID caseId,
        @Valid @RequestBody StatusChangeRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        abacSecurity.checkCaseAccess(caseId, "UPDATE_STATUS");
        User actor = userRepository.findById(principal.getId()).orElseThrow();
        Case updated = caseService.updateCaseStatus(caseId, request.status(), request.reason(), actor, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{caseId}/legal-hold")
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'PROSECUTOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> placeLegalHold(
        @PathVariable UUID caseId,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User actor = userRepository.findById(principal.getId()).orElseThrow();
        String reason = body.getOrDefault("reason", "Statutory litigation hold");
        caseService.placeLegalHold(caseId, reason, actor, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "Legal hold successfully placed on case."));
    }

    @PostMapping("/{caseId}/lift-legal-hold")
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'PROSECUTOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> liftLegalHold(
        @PathVariable UUID caseId,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User actor = userRepository.findById(principal.getId()).orElseThrow();
        caseService.liftLegalHold(caseId, actor, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "Legal hold successfully lifted."));
    }

    @PostMapping("/{caseId}/close")
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<Case> closeCase(
        @PathVariable UUID caseId,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User actor = userRepository.findById(principal.getId()).orElseThrow();
        Case closed = caseService.closeCase(caseId, actor, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(closed);
    }

    @PostMapping("/{caseId}/archive")
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<Case> archiveCase(
        @PathVariable UUID caseId,
        @RequestBody(required = false) Map<String, Object> body,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        User actor = userRepository.findById(principal.getId()).orElseThrow();
        String reason = body != null && body.containsKey("reason") ? (String) body.get("reason") : "Statutory archival and Section 65B WORM preservation";
        int retentionYears = body != null && body.containsKey("retentionYears") ? Integer.parseInt(body.get("retentionYears").toString()) : 10;
        String wormMode = body != null && body.containsKey("wormMode") ? (String) body.get("wormMode") : "COMPLIANCE";
        Case archived = retentionDisposalService.archiveCase(caseId, actor, reason, retentionYears, wormMode);
        return ResponseEntity.ok(archived);
    }
}
