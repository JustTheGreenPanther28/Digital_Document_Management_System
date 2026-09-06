package com.sih.casemanagement.controller;

import com.sih.casemanagement.dto.*;
import com.sih.casemanagement.entity.*;
import com.sih.casemanagement.repository.UserRepository;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.ProsecutionAndCourtService;
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
public class ProsecutionAndCourtController {

    private final ProsecutionAndCourtService prosecutionService;
    private final UserRepository userRepository;

    public ProsecutionAndCourtController(ProsecutionAndCourtService prosecutionService, UserRepository userRepository) {
        this.prosecutionService = prosecutionService;
        this.userRepository = userRepository;
    }

    @PostMapping("/cases/{caseId}/forensic-reports")
    @PreAuthorize("hasAnyRole('FORENSIC_OFFICER', 'ADMIN')")
    public ResponseEntity<ForensicReport> submitForensicReport(
        @PathVariable UUID caseId,
        @Valid @RequestBody SubmitForensicReportRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User examiner = userRepository.findById(principal.getId()).orElseThrow();
        ForensicReport report = prosecutionService.submitForensicReport(
            caseId,
            request.evidenceId(),
            request.documentId(),
            request.laboratoryName(),
            request.toolsUtilized(),
            request.examinationSummary(),
            request.findings(),
            examiner,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }

    @GetMapping("/cases/{caseId}/forensic-reports")
    public ResponseEntity<List<ForensicReport>> getForensicReports(@PathVariable UUID caseId) {
        return ResponseEntity.ok(prosecutionService.getForensicReportsForCase(caseId));
    }

    @PostMapping("/cases/{caseId}/charge-sheet")
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'ADMIN')")
    public ResponseEntity<ChargeSheet> submitChargeSheet(
        @PathVariable UUID caseId,
        @RequestBody Map<String, UUID> body,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User investigator = userRepository.findById(principal.getId()).orElseThrow();
        UUID documentId = body.get("documentId");
        ChargeSheet sheet = prosecutionService.submitChargeSheet(caseId, documentId, investigator, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(sheet);
    }

    @GetMapping("/cases/{caseId}/charge-sheet")
    public ResponseEntity<ChargeSheet> getChargeSheet(@PathVariable UUID caseId) {
        return ResponseEntity.ok(prosecutionService.getChargeSheetForCase(caseId));
    }

    @PostMapping("/charge-sheets/{id}/senior-review")
    @PreAuthorize("hasAnyRole('SENIOR_OFFICER', 'ADMIN')")
    public ResponseEntity<ChargeSheet> reviewChargeSheet(
        @PathVariable UUID id,
        @Valid @RequestBody ReviewChargeSheetRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User seniorOfficer = userRepository.findById(principal.getId()).orElseThrow();
        ChargeSheet updated = prosecutionService.seniorOfficerReview(
            id,
            request.approved(),
            request.notes(),
            seniorOfficer,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/charge-sheets/{id}/prosecutor-sign")
    @PreAuthorize("hasAnyRole('PROSECUTOR', 'ADMIN')")
    public ResponseEntity<ChargeSheet> prosecutorApproveAndSign(
        @PathVariable UUID id,
        @Valid @RequestBody ProsecutorSignRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User prosecutor = userRepository.findById(principal.getId()).orElseThrow();
        ChargeSheet updated = prosecutionService.prosecutorApproveAndSign(
            id,
            request.approved(),
            request.notes(),
            prosecutor,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/cases/{caseId}/court-filing")
    @PreAuthorize("hasAnyRole('COURT_OFFICER', 'PROSECUTOR', 'ADMIN')")
    public ResponseEntity<CourtFiling> fileInCourt(
        @PathVariable UUID caseId,
        @Valid @RequestBody CourtFilingRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User courtOfficer = userRepository.findById(principal.getId()).orElseThrow();
        CourtFiling filing = prosecutionService.fileInCourt(
            caseId,
            request.courtName(),
            request.filingNumber(),
            courtOfficer,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(filing);
    }

    @GetMapping("/cases/{caseId}/court-filings")
    public ResponseEntity<List<CourtFiling>> getCourtFilings(@PathVariable UUID caseId) {
        return ResponseEntity.ok(prosecutionService.getCourtFilingsForCase(caseId));
    }

    @PostMapping("/court-filings/{filingId}/proceedings")
    @PreAuthorize("hasAnyRole('COURT_OFFICER', 'ADMIN')")
    public ResponseEntity<CourtProceeding> recordProceeding(
        @PathVariable UUID filingId,
        @Valid @RequestBody CourtProceedingRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User officer = userRepository.findById(principal.getId()).orElseThrow();
        CourtProceeding proceeding = prosecutionService.recordProceeding(
            filingId,
            request.hearingDate(),
            request.judgeName(),
            request.proceedingsSummary(),
            request.nextHearingDate(),
            officer,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(proceeding);
    }

    @GetMapping("/cases/{caseId}/proceedings")
    public ResponseEntity<List<CourtProceeding>> getProceedings(@PathVariable UUID caseId) {
        return ResponseEntity.ok(prosecutionService.getProceedingsForCase(caseId));
    }

    @PostMapping("/court-filings/{filingId}/judgment")
    @PreAuthorize("hasAnyRole('COURT_OFFICER', 'ADMIN')")
    public ResponseEntity<Judgment> recordJudgment(
        @PathVariable UUID filingId,
        @Valid @RequestBody JudgmentRequest request,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User officer = userRepository.findById(principal.getId()).orElseThrow();
        Judgment judgment = prosecutionService.recordJudgment(
            filingId,
            request.verdict(),
            request.summary(),
            request.judgmentDate(),
            request.judgeName(),
            request.judgmentDocId(),
            officer,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(judgment);
    }

    @GetMapping("/cases/{caseId}/judgment")
    public ResponseEntity<Judgment> getJudgment(@PathVariable UUID caseId) {
        return ResponseEntity.ok(prosecutionService.getJudgmentForCase(caseId));
    }

    @GetMapping("/court/cases/{caseId}/bundle")
    public ResponseEntity<Map<String, Object>> getPreTrialBundle(@PathVariable UUID caseId) {
        return ResponseEntity.ok(prosecutionService.getPreTrialBundle(caseId));
    }

    @GetMapping("/court/cases/{caseId}/hearings")
    public ResponseEntity<List<CourtProceeding>> getCourtHearings(@PathVariable UUID caseId) {
        return ResponseEntity.ok(prosecutionService.getProceedingsForCase(caseId));
    }

    @GetMapping("/approvals")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER', 'PROSECUTOR', 'AUDITOR')")
    public ResponseEntity<List<Approval>> getAllApprovals() {
        return ResponseEntity.ok(prosecutionService.getAllApprovals());
    }

    @GetMapping("/approvals/entity/{targetEntityId}")
    public ResponseEntity<List<Approval>> getApprovalsForEntity(@PathVariable UUID targetEntityId) {
        return ResponseEntity.ok(prosecutionService.getApprovalsForEntity(targetEntityId));
    }
}
