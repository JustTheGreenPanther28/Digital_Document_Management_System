package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.DocumentPermission;
import com.sih.casemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, UUID> {
    List<DocumentPermission> findByDocument(Document document);
    List<DocumentPermission> findByDocumentId(UUID documentId);
    List<DocumentPermission> findByUser(User user);
    boolean existsByDocumentIdAndUserIdAndPermissionLevel(UUID documentId, UUID userId, String permissionLevel);
}
