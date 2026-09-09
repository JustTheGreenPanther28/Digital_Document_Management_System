package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.BackupHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BackupHistoryRepository extends JpaRepository<BackupHistory, UUID> {

    List<BackupHistory> findAllByOrderByCreatedAtDesc();

    Optional<BackupHistory> findFirstByBackupTypeOrderByCreatedAtDesc(String backupType);

    Optional<BackupHistory> findFirstByStatusOrderByCreatedAtDesc(String status);

    Optional<BackupHistory> findFirstByRestoreStatusOrderByVerifiedAtDesc(String restoreStatus);

    long countByStatus(String status);
}
