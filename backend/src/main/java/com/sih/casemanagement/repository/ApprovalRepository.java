package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, UUID> {
    List<Approval> findByStatus(String status);
    List<Approval> findByTargetEntityId(UUID targetEntityId);
    List<Approval> findByRequestedById(UUID requestedById);
    List<Approval> findByReviewerId(UUID reviewerId);
}
