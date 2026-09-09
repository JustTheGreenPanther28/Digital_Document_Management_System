package com.sih.casemanagement.controller;

import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.entity.BackupHistory;
import com.sih.casemanagement.repository.BackupHistoryRepository;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.BackupOrchestrationService;
import com.sih.casemanagement.service.DatabaseBackupService;
import com.sih.casemanagement.service.ObjectStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/backup")
public class BackupController {

    private final BackupOrchestrationService orchestrationService;
    private final DatabaseBackupService databaseBackupService;
    private final BackupHistoryRepository backupHistoryRepository;
    private final ObjectStorageService objectStorageService;

    public BackupController(
        BackupOrchestrationService orchestrationService,
        DatabaseBackupService databaseBackupService,
        BackupHistoryRepository backupHistoryRepository,
        ObjectStorageService objectStorageService
    ) {
        this.orchestrationService = orchestrationService;
        this.databaseBackupService = databaseBackupService;
        this.backupHistoryRepository = backupHistoryRepository;
        this.objectStorageService = objectStorageService;
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'SENIOR_OFFICER', 'INVESTIGATOR')")
    public ResponseEntity<BackupOrchestrationService.BackupSystemStatus> getStatus() {
        return ResponseEntity.ok(orchestrationService.getSystemStatus());
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'SENIOR_OFFICER')")
    public ResponseEntity<List<BackupHistory>> getHistory() {
        return ResponseEntity.ok(orchestrationService.getHistory());
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER')")
    public ResponseEntity<?> triggerBackup(
        @RequestBody(required = false) Map<String, String> payload,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest request
    ) {
        String initiatedBy = principal != null ? principal.getUsername() : "ADMIN";
        String ipAddress = request.getRemoteAddr();
        String type = (payload != null && payload.containsKey("type")) ? payload.get("type") : "PARALLEL_SYSTEM";

        if ("FULL_DB".equalsIgnoreCase(type)) {
            BackupHistory dbHistory = databaseBackupService.performFullDatabaseBackup(initiatedBy, ipAddress);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "PostgreSQL full database snapshot completed successfully.",
                "backup", dbHistory
            ));
        }

        BackupOrchestrationService.ParallelBackupResult result =
            orchestrationService.performParallelSystemBackup(initiatedBy, ipAddress);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/test-restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'AUDITOR', 'SENIOR_OFFICER')")
    public ResponseEntity<DatabaseBackupService.TestRestoreResult> testRestore(
        @RequestBody(required = false) Map<String, String> payload,
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest request
    ) {
        String initiatedBy = principal != null ? principal.getUsername() : "AUDITOR";
        String ipAddress = request.getRemoteAddr();
        UUID backupId = null;
        if (payload != null && payload.containsKey("backupId") && !payload.get("backupId").isBlank()) {
            backupId = UUID.fromString(payload.get("backupId"));
        }

        DatabaseBackupService.TestRestoreResult result =
            databaseBackupService.executeAutomatedTestRestore(backupId, initiatedBy, ipAddress);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/download/{backupId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadBackupArtifact(@PathVariable UUID backupId) {
        BackupHistory backup = backupHistoryRepository.findById(backupId)
            .orElseThrow(() -> new ResourceNotFoundException("Backup record not found: " + backupId));

        byte[] fileData = objectStorageService.getObject(
            objectStorageService.getBackupBucket(),
            backup.getTargetLocation()
        );

        String filename = "backup_" + backup.getCreatedAt().toString().substring(0, 10) + ".enc";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(fileData);
    }
}
