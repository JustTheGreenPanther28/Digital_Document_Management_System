package com.sih.casemanagement.service;

import com.sih.casemanagement.common.exception.SecurityValidationException;
import org.apache.tika.Tika;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Set;

@Service
public class FileValidationService {

    private static final Logger log = LoggerFactory.getLogger(FileValidationService.class);
    private final Tika tika = new Tika();

    @Value("${app.security.allowed-file-extensions:pdf,jpg,jpeg,png,docx,mp4,zip,txt,pcap}")
    private List<String> allowedExtensions;

    private static final Set<String> DANGEROUS_MIME_TYPES = Set.of(
        "application/x-dosexec",
        "application/x-executable",
        "application/x-sharedlib",
        "application/x-msdownload",
        "application/x-sh",
        "text/x-shellscript",
        "application/x-bat",
        "application/javascript"
    );

    public record ValidationResult(String sanitizedFilename, String detectedMimeType, String sha256Hash) {}

    public ValidationResult validateAndInspectFile(String originalFilename, byte[] fileBytes) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new SecurityValidationException("File payload is empty.");
        }

        if (fileBytes.length > 52428800) { // 50MB
            throw new SecurityValidationException("File payload exceeds maximum allowed size of 50MB.");
        }

        // 1. Path Traversal & Filename Sanitization
        String cleanFilename = StringUtils.cleanPath(originalFilename != null ? originalFilename : "unnamed_file");
        if (cleanFilename.contains("..") || cleanFilename.contains("/") || cleanFilename.contains("\\")) {
            throw new SecurityValidationException("Filename contains illegal path traversal characters: " + originalFilename);
        }

        // 2. Extension Whitelist Check
        String extension = "";
        int dotIndex = cleanFilename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < cleanFilename.length() - 1) {
            extension = cleanFilename.substring(dotIndex + 1).toLowerCase();
        }

        if (!allowedExtensions.contains(extension)) {
            throw new SecurityValidationException("File extension '" + extension + "' is not permitted. Allowed: " + allowedExtensions);
        }

        // 3. Magic Bytes Content Detection (Apache Tika)
        String detectedMime = tika.detect(fileBytes, cleanFilename);
        log.debug("Inspected magic bytes for {}: detected MIME = {}", cleanFilename, detectedMime);

        if (DANGEROUS_MIME_TYPES.contains(detectedMime.toLowerCase())) {
            log.error("SECURITY ALERT: Disguised dangerous executable/script detected! File: {}, Detected MIME: {}", cleanFilename, detectedMime);
            throw new SecurityValidationException("Disguised executable or malicious script detected via magic bytes inspection: " + detectedMime);
        }

        // 4. Calculate SHA-256 integrity hash
        String sha256Hash = calculateSha256(fileBytes);

        return new ValidationResult(cleanFilename, detectedMime, sha256Hash);
    }

    public static String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm missing", e);
        }
    }
}
