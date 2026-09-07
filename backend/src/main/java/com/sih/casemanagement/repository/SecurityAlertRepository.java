package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.SecurityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, UUID> {
    List<SecurityAlert> findByResolvedFalseOrderByCreatedAtDesc();
    List<SecurityAlert> findAllByOrderByCreatedAtDesc();
    List<SecurityAlert> findByAlertTypeInOrderByCreatedAtDesc(List<String> alertTypes);
    long countByResolvedFalse();
}
