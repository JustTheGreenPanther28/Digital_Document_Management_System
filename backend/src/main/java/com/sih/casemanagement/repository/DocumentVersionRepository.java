package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {
    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(UUID documentId);
    java.util.Optional<DocumentVersion> findByDocumentIdAndVersionNumber(UUID documentId, int versionNumber);
}
