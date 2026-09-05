package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query(value = "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    Optional<AuditLog> findLatestLog();

    List<AuditLog> findAllByOrderByTimestampAsc();
    List<AuditLog> findByCaseIdOrderByTimestampDesc(UUID caseId);
    List<AuditLog> findTop50ByOrderByTimestampDesc();
}
