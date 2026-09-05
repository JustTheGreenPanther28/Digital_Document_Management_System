package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.DisposalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisposalRecordRepository extends JpaRepository<DisposalRecord, UUID> {
    Optional<DisposalRecord> findByCertificateHash(String certificateHash);
    List<DisposalRecord> findByRelatedCaseId(UUID caseId);
}
