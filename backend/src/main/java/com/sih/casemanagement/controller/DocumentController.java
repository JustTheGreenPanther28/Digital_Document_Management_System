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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;
    private final AbacSecurityService abacSecurity;

    public DocumentController(DocumentService documentService, UserRepository userRepository, AbacSecurityService abacSecurity) {
        this.documentService = documentService;
        this.userRepository = userRepository;
        this.abacSecurity = abacSecurity;
    }

    @PostMapping(value = "/cases/{caseId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> uploadDocument(
        @PathVariable UUID caseId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "title", required = false) String title,
        @RequestParam(value = "documentType", required = false) DocumentType documentType,
        @RequestParam(value = "classification", required = false) DocumentClassification classification,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
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
    public ResponseEntity<Resource> downloadDocument(
        @PathVariable UUID documentId,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        DocumentService.DownloadPayload payload = documentService.downloadDocument(documentId, user, httpRequest.getRemoteAddr());

        ByteArrayResource resource = new ByteArrayResource(payload.data());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.filename() + "\"")
            .contentType(MediaType.parseMediaType(payload.mimeType()))
            .contentLength(payload.data().length)
            .body(resource);
    }

    @PostMapping(value = "/documents/{documentId}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Document> uploadNewVersion(
        @PathVariable UUID documentId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "changeSummary", required = false) String changeSummary,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        User uploader = userRepository.findById(principal.getId()).orElseThrow();
        Document updated = documentService.createNewVersion(documentId, file, changeSummary, uploader, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/documents/{documentId}/versions")
    public ResponseEntity<List<DocumentVersion>> getVersionHistory(
        @PathVariable UUID documentId
    ) {
        return ResponseEntity.ok(documentService.getVersionHistory(documentId));
    }
}
