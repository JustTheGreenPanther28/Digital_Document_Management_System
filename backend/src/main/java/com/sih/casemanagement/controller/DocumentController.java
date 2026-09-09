package com.sih.casemanagement.controller;

import com.sih.casemanagement.common.enums.DocumentClassification;
import com.sih.casemanagement.common.enums.DocumentType;
import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.DocumentVersion;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.UserRepository;
import com.sih.casemanagement.security.AbacSecurityService;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.DocumentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.sih.casemanagement.common.exception.RateLimitExceededException;
import com.sih.casemanagement.service.RateLimitingService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final AbacSecurityService abacSecurity;
    private final RateLimitingService rateLimitingService;

    public DocumentController(DocumentService documentService, UserRepository userRepository, AbacSecurityService abacSecurity, RateLimitingService rateLimitingService) {
        this.documentService = documentService;
        this.userRepository = userRepository;
        this.abacSecurity = abacSecurity;
        this.rateLimitingService = rateLimitingService;
    }

    @PostMapping(value = "/cases/{caseId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'PROSECUTOR', 'COURT_OFFICER', 'ADMIN')")
    public ResponseEntity<Document> uploadDocument(
        @PathVariable UUID caseId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "title", required = false) String title,
        @RequestParam(value = "documentType", required = false) DocumentType documentType,
        @RequestParam(value = "classification", required = false) DocumentClassification classification,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        String clientKey = principal != null ? "upload:user:" + principal.getId() : "upload:ip:" + httpRequest.getRemoteAddr();
        if (!rateLimitingService.isAllowed(clientKey, 20, 60)) {
            throw new RateLimitExceededException("Upload rate limit exceeded. Maximum 20 uploads per minute allowed.");
        }

        User uploader = userRepository.findById(principal.getId()).orElseThrow();
        Document doc = documentService.uploadDocument(
            caseId,
            title,
            documentType,
            classification,
            file,
            uploader,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(doc);
    }

    @GetMapping("/cases/{caseId}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Document>> getCaseDocuments(
        @PathVariable UUID caseId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        List<Document> docs = documentService.getDocumentsForCase(caseId);

        // Clearance filter
        List<Document> filtered = docs.stream()
            .filter(d -> principal.getClearance().canAccess(d.getClassification()))
            .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/documents/{documentId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocument(
        @PathVariable UUID documentId,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        String clientKey = principal != null ? "download:user:" + principal.getId() : "download:ip:" + httpRequest.getRemoteAddr();
        if (!rateLimitingService.isAllowed(clientKey, 60, 60)) {
            throw new RateLimitExceededException("Download rate limit exceeded. Maximum 60 downloads per minute allowed.");
        }

        User user = userRepository.findById(principal.getId()).orElseThrow();
        DocumentService.DownloadPayload payload = documentService.downloadDocument(documentId, user, httpRequest.getRemoteAddr());

        ByteArrayResource resource = new ByteArrayResource(payload.data());
        String safeFilename = payload.filename().replaceAll("[\\r\\n\\f]", "_");
        org.springframework.http.ContentDisposition contentDisposition = org.springframework.http.ContentDisposition.attachment()
            .filename(safeFilename, java.nio.charset.StandardCharsets.UTF_8)
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
            .contentType(MediaType.parseMediaType(payload.mimeType()))
            .contentLength(payload.data().length)
            .body(resource);
    }

    @PostMapping(value = "/documents/{documentId}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INVESTIGATOR', 'FORENSIC_OFFICER', 'SENIOR_OFFICER', 'PROSECUTOR', 'COURT_OFFICER', 'ADMIN')")
    public ResponseEntity<Document> uploadNewVersion(
        @PathVariable UUID documentId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "changeSummary", required = false) String changeSummary,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        String clientKey = principal != null ? "upload:user:" + principal.getId() : "upload:ip:" + httpRequest.getRemoteAddr();
        if (!rateLimitingService.isAllowed(clientKey, 20, 60)) {
            throw new RateLimitExceededException("Upload rate limit exceeded. Maximum 20 uploads per minute allowed.");
        }

        User uploader = userRepository.findById(principal.getId()).orElseThrow();
        Document updated = documentService.createNewVersion(documentId, file, changeSummary, uploader, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/documents/{documentId}/versions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DocumentVersion>> getVersionHistory(
        @PathVariable UUID documentId
    ) {
        return ResponseEntity.ok(documentService.getVersionHistory(documentId));
    }

    @GetMapping("/documents/{documentId}/versions/{versionNumber}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocumentVersion(
        @PathVariable UUID documentId,
        @PathVariable int versionNumber,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        String clientKey = principal != null ? "download:user:" + principal.getId() : "download:ip:" + httpRequest.getRemoteAddr();
        if (!rateLimitingService.isAllowed(clientKey, 60, 60)) {
            throw new RateLimitExceededException("Download rate limit exceeded. Maximum 60 downloads per minute allowed.");
        }

        User user = userRepository.findById(principal.getId()).orElseThrow();
        DocumentService.DownloadPayload payload = documentService.downloadDocumentVersion(documentId, versionNumber, user, httpRequest.getRemoteAddr());

        ByteArrayResource resource = new ByteArrayResource(payload.data());
        String safeFilename = payload.filename().replaceAll("[\\r\\n\\f]", "_");
        org.springframework.http.ContentDisposition contentDisposition = org.springframework.http.ContentDisposition.attachment()
            .filename(safeFilename, java.nio.charset.StandardCharsets.UTF_8)
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
            .contentType(MediaType.parseMediaType(payload.mimeType()))
            .contentLength(payload.data().length)
            .body(resource);
    }
}
