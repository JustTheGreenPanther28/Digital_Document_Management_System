package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.AiAnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiAnalysisResultRepository extends JpaRepository<AiAnalysisResult, UUID> {

    /** All analysis runs for a given case, newest first */
    List<AiAnalysisResult> findByCaseIdOrderByCreatedAtDesc(UUID caseId);

    /** All runs for a specific entity (e.g. a ForensicReport or ChargeSheet) */
    List<AiAnalysisResult> findByTargetEntityIdOrderByCreatedAtDesc(UUID targetEntityId);

    /** Most recent run for a case of a given type */
    Optional<AiAnalysisResult> findFirstByCaseIdAndAnalysisTypeOrderByCreatedAtDesc(
        UUID caseId, AiAnalysisResult.AnalysisType analysisType);

    /** Most recent run for a specific entity of a given type */
    Optional<AiAnalysisResult> findFirstByTargetEntityIdAndAnalysisTypeOrderByCreatedAtDesc(
        UUID targetEntityId, AiAnalysisResult.AnalysisType analysisType);

    /** Count of HIGH/CRITICAL analyses for a case */
    long countByCaseIdAndRiskLevel(UUID caseId, AiAnalysisResult.RiskLevel riskLevel);
}
