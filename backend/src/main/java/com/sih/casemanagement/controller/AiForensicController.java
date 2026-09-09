package com.sih.casemanagement.controller;

import com.sih.casemanagement.entity.AiAnalysisResult;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.AiForensicAnalysisService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for AI-Based Forensic & Charge Sheet Analysis.
 * All endpoints require authenticated users; specific roles are enforced per endpoint.
 */
@RestController
@RequestMapping("/api/v1/ai")
public class AiForensicController {

    private final AiForensicAnalysisService aiService;

    public AiForensicController(AiForensicAnalysisService aiService) {
        this.aiService = aiService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANALYSIS TRIGGERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Run AI contradiction detection on a specific ForensicReport.
     * Roles: FORENSIC_OFFICER, ADMIN, SENIOR_OFFICER, INVESTIGATOR
     */
    @PostMapping("/analyze/forensic-report/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SENIOR_OFFICER','FORENSIC_OFFICER','INVESTIGATOR')")
    public ResponseEntity<AiAnalysisResult> analyzeForensicReport(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest request
    ) {
        String username = principal != null ? principal.getUsername() : "system";
        String ip = extractIp(request);
        UUID safeId = parseUuidSafe(id);
        AiAnalysisResult result = aiService.analyzeForensicReport(safeId, username, ip);
        return ResponseEntity.ok(result);
    }

    /**
     * Run AI legal compliance check on a specific ChargeSheet.
     * Roles: ADMIN, SENIOR_OFFICER, INVESTIGATOR, AUDITOR
     */
    @PostMapping("/analyze/charge-sheet/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SENIOR_OFFICER','INVESTIGATOR','AUDITOR','PROSECUTOR')")
    public ResponseEntity<AiAnalysisResult> analyzeChargeSheet(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest request
    ) {
        String username = principal != null ? principal.getUsername() : "system";
        String ip = extractIp(request);
        UUID safeId = parseUuidSafe(id);
        AiAnalysisResult result = aiService.analyzeChargeSheet(safeId, username, ip);
        return ResponseEntity.ok(result);
    }

    /**
     * Run holistic combined AI analysis on an entire case.
     * Roles: ADMIN, SENIOR_OFFICER, INVESTIGATOR, FORENSIC_OFFICER
     */
    @PostMapping("/analyze/case/{caseId}")
    @PreAuthorize("hasAnyRole('ADMIN','SENIOR_OFFICER','INVESTIGATOR','FORENSIC_OFFICER')")
    public ResponseEntity<AiAnalysisResult> analyzeCombinedCase(
        @PathVariable String caseId,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest request
    ) {
        String username = principal != null ? principal.getUsername() : "system";
        String ip = extractIp(request);
        UUID safeCaseId = parseUuidSafe(caseId);
        AiAnalysisResult result = aiService.analyzeCombinedCase(safeCaseId, username, ip);
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULT RETRIEVAL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Retrieve all historical AI analysis results for a case, newest first.
     */
    @GetMapping("/results/case/{caseId}")
    @PreAuthorize("hasAnyRole('ADMIN','SENIOR_OFFICER','FORENSIC_OFFICER','INVESTIGATOR','AUDITOR','PROSECUTOR')")
    public ResponseEntity<List<AiAnalysisResult>> getResultsByCaseId(@PathVariable String caseId) {
        UUID safeCaseId = parseUuidSafe(caseId);
        return ResponseEntity.ok(aiService.getResultsByCaseId(safeCaseId));
    }

    /**
     * Retrieve a single AI analysis result by its ID.
     */
    @GetMapping("/results/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SENIOR_OFFICER','FORENSIC_OFFICER','INVESTIGATOR','AUDITOR','PROSECUTOR')")
    public ResponseEntity<AiAnalysisResult> getResultById(@PathVariable String id) {
        UUID safeId = parseUuidSafe(id);
        return ResponseEntity.ok(aiService.getResultById(safeId));
    }

    /**
     * Health check — returns AI feature status.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
            "feature", "AI Forensic & Charge Sheet Analysis",
            "provider", "Automated Evidentiary Scrutiny Engine",
            "status", "operational"
        ));
    }

    /**
     * Multilingual NyayaSahayak user guidance chatbot endpoint.
     * Accessible to all authenticated users for operational navigation.
     */
    @PostMapping("/guide-chat")
    public ResponseEntity<Map<String, Object>> guideChat(@RequestBody Map<String, String> payload) {
        String query = payload.getOrDefault("query", "");
        String language = payload.getOrDefault("language", "en");
        String reply = aiService.getGuideChatResponse(query, language);
        return ResponseEntity.ok(Map.of(
            "reply", reply != null ? reply : "",
            "language", language
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Safely parse a UUID string or convert non-standard/client-side identifiers
     * (e.g. "case-1788668024291", "1", "CASE-2026-001") deterministically into a Type-3 UUID.
     */
    public static UUID parseUuidSafe(String input) {
        if (input == null || input.isBlank()) {
            return UUID.randomUUID();
        }
        try {
            return UUID.fromString(input.trim());
        } catch (IllegalArgumentException e) {
            return UUID.nameUUIDFromBytes(input.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }
}
