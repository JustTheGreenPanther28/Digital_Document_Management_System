package com.sih.casemanagement.repository;

import com.sih.casemanagement.common.enums.TransferStatus;
import com.sih.casemanagement.entity.EvidenceTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceTransferRepository extends JpaRepository<EvidenceTransfer, UUID> {
    List<EvidenceTransfer> findByRecipientIdAndStatus(UUID recipientId, TransferStatus status);
    List<EvidenceTransfer> findBySenderIdAndStatus(UUID senderId, TransferStatus status);
    List<EvidenceTransfer> findByEvidenceId(UUID evidenceId);
    List<EvidenceTransfer> findByACaseId(UUID caseId);
}
