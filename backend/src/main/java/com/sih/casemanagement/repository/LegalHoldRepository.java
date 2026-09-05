package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.LegalHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LegalHoldRepository extends JpaRepository<LegalHold, UUID> {
    Optional<LegalHold> findByACaseIdAndActiveTrue(UUID caseId);
    List<LegalHold> findByACaseId(UUID caseId);
    boolean existsByACaseIdAndActiveTrue(UUID caseId);
}
