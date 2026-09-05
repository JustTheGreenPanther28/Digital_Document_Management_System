package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.CustodyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustodyRecordRepository extends JpaRepository<CustodyRecord, UUID> {
    List<CustodyRecord> findByEvidenceIdOrderByTimestampAsc(UUID evidenceId);
    List<CustodyRecord> findByACaseIdOrderByTimestampAsc(UUID caseId);
}
