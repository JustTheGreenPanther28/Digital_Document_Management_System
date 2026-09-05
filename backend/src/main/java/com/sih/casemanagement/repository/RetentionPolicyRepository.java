package com.sih.casemanagement.repository;

import com.sih.casemanagement.common.enums.SecurityClearance;
import com.sih.casemanagement.entity.RetentionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RetentionPolicyRepository extends JpaRepository<RetentionPolicy, UUID> {
    Optional<RetentionPolicy> findByName(String name);
    List<RetentionPolicy> findByActiveTrue();
    List<RetentionPolicy> findByClassification(SecurityClearance classification);
}
