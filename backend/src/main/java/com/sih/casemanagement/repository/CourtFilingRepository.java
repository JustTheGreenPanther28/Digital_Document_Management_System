package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.CourtFiling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourtFilingRepository extends JpaRepository<CourtFiling, UUID> {
    List<CourtFiling> findByACaseId(UUID caseId);
    Optional<CourtFiling> findByFilingNumber(String filingNumber);
}
