package com.sih.casemanagement.repository;

import com.sih.casemanagement.common.enums.CaseStatus;
import com.sih.casemanagement.entity.Case;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaseRepository extends JpaRepository<Case, UUID> {
    Optional<Case> findByCaseNumber(String caseNumber);
    boolean existsByCaseNumber(String caseNumber);
    boolean existsByFirNumber(String firNumber);
    List<Case> findByStatus(CaseStatus status);

    @Query("SELECT c FROM Case c WHERE " +
           "LOWER(c.caseNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.firNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Case> searchCases(@Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM Case c JOIN CaseUserAssignment a ON a.aCase.id = c.id " +
           "WHERE a.user.id = :userId AND a.active = true")
    List<Case> findAssignedCasesForUser(@Param("userId") UUID userId);
}
