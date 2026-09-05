package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.CourtProceeding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourtProceedingRepository extends JpaRepository<CourtProceeding, UUID> {
    List<CourtProceeding> findByFilingIdOrderByHearingDateAsc(UUID filingId);
    List<CourtProceeding> findByACaseIdOrderByHearingDateAsc(UUID caseId);
}
