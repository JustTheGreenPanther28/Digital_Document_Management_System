package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByACaseId(UUID caseId);
    Optional<Document> findBySha256Hash(String sha256Hash);
    boolean existsBySha256Hash(String sha256Hash);
}
