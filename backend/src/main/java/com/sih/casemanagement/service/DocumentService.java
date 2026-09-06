package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.*;
import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.common.exception.SecurityValidationException;
import com.sih.casemanagement.common.exception.TamperException;
import com.sih.casemanagement.common.exception.WorkflowViolationException;
import com.sih.casemanagement.entity.Case;
import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.DocumentVersion;
import com.sih.casemanagement.entity.SecurityAlert;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.CaseRepository;
import com.sih.casemanagement.repository.DocumentRepository;
import com.sih.casemanagement.repository.DocumentVersionRepository;
import com.sih.casemanagement.repository.SecurityAlertRepository;
import com.sih.casemanagement.security.AbacSecurityService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final CaseRepository caseRepository;
    private final FileValidationService fileValidationService;
    private final MalwareScannerService malwareScannerService;
    private final EncryptionService encryptionService;
    private final KeyManagementService kms;
    private final ObjectStorageService storageService;
    private final AuditService auditService;
    private final SecurityAlertRepository alertRepository;
    private final AbacSecurityService abacSecurity;
    private final ThreatDetectionService threatDetectionService;

    @org.springframework.beans.factory.annotation.Value("${app.security.enforce-duplicate-rejection:true}")
    private boolean enforceDuplicateRejection;

    public DocumentService(
        DocumentRepository documentRepository,
        DocumentVersionRepository versionRepository,
        CaseRepository caseRepository,
        FileValidationService fileValidationService,
        MalwareScannerService malwareScannerService,
        EncryptionService encryptionService,
        KeyManagementService kms,
        ObjectStorageService storageService,
        AuditService auditService,
        SecurityAlertRepository alertRepository,
        AbacSecurityService abacSecurity,
        ThreatDetectionService threatDetectionService
    ) {
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.caseRepository = caseRepository;
        this.fileValidationService = fileValidationService;
        this.malwareScannerService = malwareScannerService;
        this.encryptionService = encryptionService;
        this.kms = kms;
        this.storageService = storageService;
        this.auditService = auditService;
        this.alertRepository = alertRepository;
        this.abacSecurity = abacSecurity;
        this.threatDetectionService = threatDetectionService;
    }

    @Transactional
    public Document uploadDocument(
        UUID caseId,
        String title,
        DocumentType documentType,
        DocumentClassification classification,
        MultipartFile file,
        User uploader,
        String ipAddress
    ) {
        // Step 1: ABAC validation on case
        abacSecurity.checkCaseAccess(caseId, "UPLOAD");

        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new SecurityValidationException("Failed to read uploaded file stream: " + e.getMessage());
        }

        // Step 2 & 3: File validation (extension, path traversal, magic bytes, SHA-256)
        FileValidationService.ValidationResult valResult =
            fileValidationService.validateAndInspectFile(file.getOriginalFilename(), fileBytes);

        // Step 4: Malware Scan & Quarantine check
        MalwareScannerService.ScanResult scanResult = malwareScannerService.scanFile(fileBytes);
        if (!scanResult.isClean()) {
            String quarantineKey = "quarantine/" + UUID.randomUUID() + "_" + valResult.sanitizedFilename();
            try {
                storageService.storeQuarantineObject(quarantineKey, fileBytes);
            } catch (Exception qEx) {
                log.warn("Quarantine storage notification: {}", qEx.getMessage());
            }

            threatDetectionService.recordMalwareAlert(valResult.sanitizedFilename(), scanResult.details(), ipAddress, uploader.getUsername(), caseId);
            throw new SecurityValidationException("Malware detected by system scanner: " + scanResult.details());
        }

        // Step 5: Duplicate detection & enforcement
        if (documentRepository.existsBySha256Hash(valResult.sha256Hash())) {
            log.warn("Duplicate document SHA-256 detected: {}", valResult.sha256Hash());
            if (enforceDuplicateRejection) {
                throw new SecurityValidationException("Duplicate document rejected: File with identical SHA-256 hash already exists in vault repository.");
            }
        }

        // Step 6: Generate AES-256-GCM IV and encrypt
        byte[] iv = kms.generateIv();
        byte[] encryptedBytes = encryptionService.encrypt(fileBytes, iv);
        String ivBase64 = Base64.getEncoder().encodeToString(iv);

        // Step 7: MinIO/S3 Private Storage with UUID object key
        UUID docId = UUID.randomUUID();
        String objectKey = String.format("cases/%s/%s_v1.enc", caseId, docId);
        storageService.storeObject(storageService.getDefaultBucket(), objectKey, encryptedBytes);

        // Step 8: Persist Document Metadata in PostgreSQL
        Document doc = new Document();
        doc.setId(docId);
        doc.setCase(aCase);
        doc.setTitle(title != null && !title.isBlank() ? title : valResult.sanitizedFilename());
        doc.setDocumentType(documentType != null ? documentType : DocumentType.GENERAL_EVIDENCE);
        doc.setOriginalFilename(valResult.sanitizedFilename());
        doc.setStorageObjectKey(objectKey);
        doc.setMimeType(valResult.detectedMimeType());
        doc.setFileSizeBytes(fileBytes.length);
        doc.setSha256Hash(valResult.sha256Hash());
        doc.setClassification(classification != null ? classification : DocumentClassification.CONFIDENTIAL);
        doc.setCurrentVersion(1);
        doc.setLocked(false);
        doc.setQuarantineStatus(QuarantineStatus.CLEAN);
        doc.setEncryptionIv(ivBase64);
        doc.setEncryptionAlgorithm("AES-256-GCM");
        doc.setKmsKeyId(kms.getKeyId());
        doc.setUploadedBy(uploader);

        Document savedDoc = documentRepository.save(doc);

        // Step 9: Create initial immutable version record
        DocumentVersion v1 = new DocumentVersion(
            savedDoc,
            1,
            objectKey,
            fileBytes.length,
            valResult.sha256Hash(),
            "Initial Document Upload",
            uploader,
            ivBase64
        );
        versionRepository.save(v1);

        // Step 10: Hash-chained audit event
        auditService.logEvent(
            AuditEventType.DOCUMENT_UPLOADED,
            uploader.getId(),
            uploader.getUsername(),
            uploader.getRoles().iterator().next().getName().name(),
            caseId,
            "DOCUMENT",
            savedDoc.getId().toString(),
            ipAddress,
            null,
            String.format("Uploaded document '%s' (SHA-256: %s, Classification: %s)",
                savedDoc.getTitle(), savedDoc.getSha256Hash(), savedDoc.getClassification())
        );

        return savedDoc;
    }

    @Transactional
    public Document createNewVersion(
        UUID documentId,
        MultipartFile file,
        String changeSummary,
        User uploader,
        String ipAddress
    ) {
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        if (doc.isLocked()) {
            throw new WorkflowViolationException("Cannot create new version: Document is locked/digitally signed.");
        }

        abacSecurity.checkDocumentAccess(documentId, "UPDATE");

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new SecurityValidationException("Failed to read file stream: " + e.getMessage());
        }

        FileValidationService.ValidationResult valResult =
            fileValidationService.validateAndInspectFile(file.getOriginalFilename(), fileBytes);

        MalwareScannerService.ScanResult scanResult = malwareScannerService.scanFile(fileBytes);
        if (!scanResult.isClean()) {
            throw new SecurityValidationException("Malware detected: " + scanResult.details());
        }

        int nextVersion = doc.getCurrentVersion() + 1;
        byte[] iv = kms.generateIv();
        byte[] encryptedBytes = encryptionService.encrypt(fileBytes, iv);
        String ivBase64 = Base64.getEncoder().encodeToString(iv);

        String objectKey = String.format("cases/%s/%s_v%d.enc", doc.getCase().getId(), doc.getId(), nextVersion);
        storageService.storeObject(storageService.getDefaultBucket(), objectKey, encryptedBytes);

        // Update Document entity to reflect latest version
        doc.setCurrentVersion(nextVersion);
        doc.setStorageObjectKey(objectKey);
        doc.setFileSizeBytes(fileBytes.length);
        doc.setSha256Hash(valResult.sha256Hash());
        doc.setEncryptionIv(ivBase64);
        Document updated = documentRepository.save(doc);

        DocumentVersion version = new DocumentVersion(
            doc,
            nextVersion,
            objectKey,
            fileBytes.length,
            valResult.sha256Hash(),
            changeSummary != null ? changeSummary : "Revision v" + nextVersion,
            uploader,
            ivBase64
        );
        versionRepository.save(version);

        auditService.logEvent(
            AuditEventType.DOCUMENT_VERSION_CREATED,
            uploader.getId(),
            uploader.getUsername(),
            uploader.getRoles().iterator().next().getName().name(),
            doc.getCase().getId(),
            "DOCUMENT_VERSION",
            String.valueOf(nextVersion),
            ipAddress,
            null,
            "Created version v" + nextVersion + " for document: " + doc.getTitle()
        );

        return updated;
    }

    @Transactional
    public DownloadPayload downloadDocument(UUID documentId, User user, String ipAddress) {
        abacSecurity.checkDocumentAccess(documentId, "READ");

        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        if (doc.getQuarantineStatus() == QuarantineStatus.QUARANTINED) {
            throw new SecurityValidationException("Document is quarantined due to security violation and cannot be accessed.");
        }

        // Threat detection: Track download velocity
        threatDetectionService.recordDownload(user.getId(), user.getUsername(), ipAddress, doc.getId(), doc.getCase().getId());

        // 1. Retrieve encrypted ciphertext from MinIO/S3
        byte[] encryptedData = storageService.getObject(storageService.getDefaultBucket(), doc.getStorageObjectKey());

        // 2. Decrypt with AES-256-GCM using IV and KMS key
        byte[] iv = Base64.getDecoder().decode(doc.getEncryptionIv());
        byte[] decryptedBytes = encryptionService.decrypt(encryptedData, iv);

        // 3. Cryptographic SHA-256 Tamper Verification
        String recalculatedHash = FileValidationService.calculateSha256(decryptedBytes);
        if (!recalculatedHash.equalsIgnoreCase(doc.getSha256Hash())) {
            log.error("CRITICAL TAMPER DETECTED: Recalculated hash {} does not match stored hash {} for document {}",
                recalculatedHash, doc.getSha256Hash(), doc.getId());

            SecurityAlert alert = new SecurityAlert(
                "TAMPER_DETECTED",
                AlertSeverity.CRITICAL,
                "Cryptographic integrity verification failed for document: " + doc.getTitle() + " (ID: " + doc.getId() + ")",
                ipAddress,
                user.getUsername(),
                doc.getCase().getId()
            );
            alertRepository.save(alert);

            auditService.logEvent(
                AuditEventType.TAMPER_DETECTED,
                user.getId(),
                user.getUsername(),
                user.getRoles().iterator().next().getName().name(),
                doc.getCase().getId(),
                "DOCUMENT",
                doc.getId().toString(),
                ipAddress,
                null,
                "CRITICAL: Integrity verification failed during retrieval. Access blocked."
            );

            throw new TamperException("Integrity check failed: Decrypted document hash does not match original digital fingerprint. Potential tampering detected!");
        }

        // 4. Audit retrieval
        auditService.logEvent(
            AuditEventType.DOCUMENT_DOWNLOADED,
            user.getId(),
            user.getUsername(),
            user.getRoles().iterator().next().getName().name(),
            doc.getCase().getId(),
            "DOCUMENT",
            doc.getId().toString(),
            ipAddress,
            null,
            "Successfully verified SHA-256 integrity and downloaded document: " + doc.getTitle()
        );

        return new DownloadPayload(doc.getOriginalFilename(), doc.getMimeType(), decryptedBytes);
    }

    @Transactional(readOnly = true)
    public List<Document> getDocumentsForCase(UUID caseId) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        return documentRepository.findByACaseId(caseId);
    }

    @Transactional(readOnly = true)
    public List<DocumentVersion> getVersionHistory(UUID documentId) {
        abacSecurity.checkDocumentAccess(documentId, "READ");
        return versionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
    }

    public record DownloadPayload(String filename, String mimeType, byte[] data) {}
}
