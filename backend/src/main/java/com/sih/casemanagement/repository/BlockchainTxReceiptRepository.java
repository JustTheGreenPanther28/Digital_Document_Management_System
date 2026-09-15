package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.BlockchainTxReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockchainTxReceiptRepository extends JpaRepository<BlockchainTxReceipt, UUID> {
    Optional<BlockchainTxReceipt> findByTxHash(String txHash);
    List<BlockchainTxReceipt> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);
    Optional<BlockchainTxReceipt> findFirstByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);
    List<BlockchainTxReceipt> findByCaseIdOrderByCreatedAtDesc(UUID caseId);
    List<BlockchainTxReceipt> findTop50ByOrderByCreatedAtDesc();
}
