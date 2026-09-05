package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.CaseUserAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaseUserAssignmentRepository extends JpaRepository<CaseUserAssignment, UUID> {
    
    @Query("SELECT COUNT(a) > 0 FROM CaseUserAssignment a WHERE a.aCase.id = :caseId AND a.user.id = :userId AND a.active = true")
    boolean isUserAssignedToCase(@Param("caseId") UUID caseId, @Param("userId") UUID userId);

    @Query("SELECT a FROM CaseUserAssignment a JOIN FETCH a.user WHERE a.aCase.id = :caseId AND a.active = true")
    List<CaseUserAssignment> findByACaseIdAndActiveTrue(@Param("caseId") UUID caseId);

    List<CaseUserAssignment> findByUserIdAndActiveTrue(UUID userId);
    Optional<CaseUserAssignment> findByACaseIdAndUserIdAndActiveTrue(UUID caseId, UUID userId);
}
