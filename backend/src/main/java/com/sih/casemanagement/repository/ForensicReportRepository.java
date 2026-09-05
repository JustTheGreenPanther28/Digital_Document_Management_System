package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.ForensicReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForensicReportRepository extends JpaRepository<ForensicReport, UUID> {
    List<ForensicReport> findByACaseId(UUID caseId);
    List<ForensicReport> findByEvidenceId(UUID evidenceId);
}
