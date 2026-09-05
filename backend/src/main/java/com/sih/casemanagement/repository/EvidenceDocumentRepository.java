package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.Evidence;
import com.sih.casemanagement.entity.EvidenceDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceDocumentRepository extends JpaRepository<EvidenceDocument, UUID> {
    List<EvidenceDocument> findByEvidence(Evidence evidence);
    List<EvidenceDocument> findByEvidenceId(UUID evidenceId);
    List<EvidenceDocument> findByDocument(Document document);
}
