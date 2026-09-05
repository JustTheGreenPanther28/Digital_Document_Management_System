package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.Judgment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JudgmentRepository extends JpaRepository<Judgment, UUID> {
    Optional<Judgment> findByACaseId(UUID caseId);
    List<Judgment> findByFilingId(UUID filingId);
}
