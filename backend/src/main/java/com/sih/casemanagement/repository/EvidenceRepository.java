package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, UUID> {
    List<Evidence> findByACaseId(UUID caseId);
    Optional<Evidence> findByEvidenceNumber(String evidenceNumber);
    boolean existsByEvidenceNumber(String evidenceNumber);
    List<Evidence> findByCurrentCustodianId(UUID custodianId);
}
