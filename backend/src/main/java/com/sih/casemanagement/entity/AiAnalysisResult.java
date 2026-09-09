package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Persists every AI-powered forensic or charge sheet analysis result.
 * One record is created per analysis run; historical runs are preserved (no overwrite).
 */
@Entity
@Table(name = "ai_analysis_results", indexes = {
    @Index(name = "idx_ai_result_case_id", columnList = "case_id"),
    @Index(name = "idx_ai_result_target_entity", columnList = "target_entity_id"),
    @Index(name = "idx_ai_result_created_at", columnList = "created_at")
})
public class AiAnalysisResult {

    public enum AnalysisType {
        FORENSIC_REPORT,
        CHARGE_SHEET,
        COMBINED_CASE,
        CUSTODY_CHAIN
    }

    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_type", nullable = false, length = 30)
    private AnalysisType analysisType;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    /** ID of the ForensicReport, ChargeSheet, or Case entity analyzed */
    @Column(name = "target_entity_id")
    private UUID targetEntityId;

    @Column(name = "target_entity_type", length = 60)
    private String targetEntityType;

    /** 0-100 composite risk score */
    @Column(name = "risk_score")
    private Integer riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 10)
    private RiskLevel riskLevel;

    @Column(name = "contradictions_detected")
    private Integer contradictionsDetected;

    @Column(name = "custody_gaps")
    private Integer custodyGaps;

    @Column(name = "missing_procedures")
    private Integer missingProcedures;

    /** AI-generated narrative summary in plain English */
    @Column(name = "summary_text", columnDefinition = "TEXT")
    private String summaryText;

    /** JSON array of BNS/IPC section recommendations */
    @Column(name = "recommended_charges", columnDefinition = "TEXT")
    private String recommendedCharges;

    /** Full structured JSON discrepancy report from the LLM */
    @Column(name = "discrepancy_report", columnDefinition = "TEXT")
    private String discrepancyReport;

    /** Raw LLM response for audit purposes */
    @Column(name = "raw_llm_response", columnDefinition = "TEXT")
    private String rawLlmResponse;

    @Column(name = "model_used", length = 120)
    private String modelUsed;

    @Column(name = "analysis_tokens")
    private Integer analysisTokens;

    @Column(name = "analysis_duration_ms")
    private Long analysisDurationMs;

    /** false = AI unavailable, used fallback structural check */
    @Column(name = "ai_powered")
    private boolean aiPowered;

    @Column(name = "initiated_by", length = 100)
    private String initiatedBy;

    @Column(name = "initiator_ip", length = 50)
    private String initiatorIp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }

    public AnalysisType getAnalysisType() { return analysisType; }
    public void setAnalysisType(AnalysisType analysisType) { this.analysisType = analysisType; }

    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }

    public UUID getTargetEntityId() { return targetEntityId; }
    public void setTargetEntityId(UUID targetEntityId) { this.targetEntityId = targetEntityId; }

    public String getTargetEntityType() { return targetEntityType; }
    public void setTargetEntityType(String t) { this.targetEntityType = t; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }

    public Integer getContradictionsDetected() { return contradictionsDetected; }
    public void setContradictionsDetected(Integer c) { this.contradictionsDetected = c; }

    public Integer getCustodyGaps() { return custodyGaps; }
    public void setCustodyGaps(Integer custodyGaps) { this.custodyGaps = custodyGaps; }

    public Integer getMissingProcedures() { return missingProcedures; }
    public void setMissingProcedures(Integer m) { this.missingProcedures = m; }

    public String getSummaryText() { return summaryText; }
    public void setSummaryText(String summaryText) { this.summaryText = summaryText; }

    public String getRecommendedCharges() { return recommendedCharges; }
    public void setRecommendedCharges(String r) { this.recommendedCharges = r; }

    public String getDiscrepancyReport() { return discrepancyReport; }
    public void setDiscrepancyReport(String d) { this.discrepancyReport = d; }

    public String getRawLlmResponse() { return rawLlmResponse; }
    public void setRawLlmResponse(String rawLlmResponse) { this.rawLlmResponse = rawLlmResponse; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public Integer getAnalysisTokens() { return analysisTokens; }
    public void setAnalysisTokens(Integer analysisTokens) { this.analysisTokens = analysisTokens; }

    public Long getAnalysisDurationMs() { return analysisDurationMs; }
    public void setAnalysisDurationMs(Long analysisDurationMs) { this.analysisDurationMs = analysisDurationMs; }

    public boolean isAiPowered() { return aiPowered; }
    public void setAiPowered(boolean aiPowered) { this.aiPowered = aiPowered; }

    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }

    public String getInitiatorIp() { return initiatorIp; }
    public void setInitiatorIp(String initiatorIp) { this.initiatorIp = initiatorIp; }

    public Instant getCreatedAt() { return createdAt; }
}
