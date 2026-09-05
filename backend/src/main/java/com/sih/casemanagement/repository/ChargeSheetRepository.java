package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.ChargeSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargeSheetRepository extends JpaRepository<ChargeSheet, UUID> {
    Optional<ChargeSheet> findByACaseId(UUID caseId);
    List<ChargeSheet> findBySeniorOfficerApprovalStatus(String status);
    List<ChargeSheet> findByProsecutorApprovalStatus(String status);
}
