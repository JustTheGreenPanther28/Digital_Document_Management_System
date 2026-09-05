package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.CaseStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaseStatusHistoryRepository extends JpaRepository<CaseStatusHistory, UUID> {
    @Query("SELECT h FROM CaseStatusHistory h LEFT JOIN FETCH h.changedBy WHERE h.aCase.id = :caseId ORDER BY h.timestamp ASC")
    List<CaseStatusHistory> findByACaseIdOrderByTimestampAsc(@Param("caseId") UUID caseId);
}
