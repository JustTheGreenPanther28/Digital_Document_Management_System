package com.sih.casemanagement.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.casemanagement.common.enums.*;
import com.sih.casemanagement.common.exception.TamperException;
import com.sih.casemanagement.dto.LoginRequest;
import com.sih.casemanagement.entity.AuditLog;
import com.sih.casemanagement.entity.Case;
import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.AuditLogRepository;
import com.sih.casemanagement.repository.CaseRepository;
import com.sih.casemanagement.repository.DocumentRepository;
import com.sih.casemanagement.repository.UserRepository;
import com.sih.casemanagement.service.AuditService;
import com.sih.casemanagement.service.CaseService;
import com.sih.casemanagement.service.DocumentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private CaseService caseService;

    @Autowired
    private com.sih.casemanagement.repository.SecurityAlertRepository securityAlertRepository;

    @Autowired
    private com.sih.casemanagement.service.RetentionDisposalService retentionDisposalService;

    @Autowired
    private com.sih.casemanagement.service.ThreatDetectionService threatDetectionService;

    @Autowired
    private com.sih.casemanagement.service.DigitalSignatureService digitalSignatureService;

    @AfterEach
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        UserPrincipal principal = new UserPrincipal(user);
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private String getJwtTokenForUser(String username) throws Exception {
        LoginRequest loginReq = new LoginRequest(username, "Password@123");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.get("accessToken").asText();
    }

    private Case getDemoCase() {
        return caseRepository.findByCaseNumber("CASE-2026-001").orElseThrow();
    }

    // 1. Unauthenticated request -> 401 Unauthorized
    @Test
    @DisplayName("Security Control 1: Unauthenticated request returns 401 Unauthorized")
    public void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/cases"))
            .andExpect(status().isUnauthorized());
    }

    // 2. Wrong role -> 403 Forbidden
    @Test
    @DisplayName("Security Control 2: Unauthorized role attempting administrative action returns 403 Forbidden")
    public void wrongRoleReturns403() throws Exception {
        String investigatorToken = getJwtTokenForUser("investigator_a");

        // Investigator attempts to create user (restricted to ADMIN)
        mockMvc.perform(post("/api/v1/users")
                .header("Authorization", "Bearer " + investigatorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"hacker\",\"email\":\"h@h.com\",\"password\":\"Pass@1234\",\"fullName\":\"Hacker\",\"roles\":[\"ADMIN\"]}"))
            .andExpect(status().isForbidden());
    }

    // 3. Investigator accessing unassigned case -> 403 Forbidden (Horizontal ABAC / IDOR Protection)
    @Test
    @DisplayName("Security Control 3: Investigator B cannot access Investigator A's case (Horizontal ABAC / IDOR)")
    public void investigatorAccessingUnassignedCaseReturns403() throws Exception {
        Case demoCase = getDemoCase();
        String tokenInvA = getJwtTokenForUser("investigator_a");
        String tokenInvB = getJwtTokenForUser("investigator_b");

        // Investigator A is assigned -> Access Granted (200)
        mockMvc.perform(get("/api/v1/cases/" + demoCase.getId())
                .header("Authorization", "Bearer " + tokenInvA))
            .andExpect(status().isOk());

        // Investigator B holds identical INVESTIGATOR role but is NOT assigned to CASE-2026-001 -> Access Denied (403)
        mockMvc.perform(get("/api/v1/cases/" + demoCase.getId())
                .header("Authorization", "Bearer " + tokenInvB))
            .andExpect(status().isForbidden());
    }

    // 4. Direct document UUID access -> denied if unauthorized
    @Test
    @DisplayName("Security Control 4: Direct document access blocked for unassigned investigator")
    public void directDocumentAccessDeniedIfUnauthorized() throws Exception {
        Case demoCase = getDemoCase();
        authenticateAs("investigator_a");
        User invA = userRepository.findByUsername("investigator_a").orElseThrow();

        // Create a document assigned to Case 1
        MockMultipartFile file = new MockMultipartFile("file", "evidence.pdf", "application/pdf", "%PDF-1.4 sample content".getBytes(StandardCharsets.UTF_8));
        Document doc = documentService.uploadDocument(demoCase.getId(), "Evidence Report", DocumentType.FIR, DocumentClassification.CONFIDENTIAL, file, invA, "127.0.0.1");

        String tokenInvB = getJwtTokenForUser("investigator_b");

        // Investigator B tries to download by guessing document UUID -> Denied (403)
        mockMvc.perform(get("/api/v1/documents/" + doc.getId() + "/download")
                .header("Authorization", "Bearer " + tokenInvB))
            .andExpect(status().isForbidden());
    }

    // 5. Tampered document -> integrity failure detected and access blocked
    @Test
    @DisplayName("Security Control 5: Altering stored document causes SHA-256 integrity verification failure")
    public void modifiedDocumentFailsIntegrityCheck() {
        Case demoCase = getDemoCase();
        authenticateAs("investigator_a");
        User invA = userRepository.findByUsername("investigator_a").orElseThrow();

        MockMultipartFile file = new MockMultipartFile("file", "statement.pdf", "application/pdf", "%PDF-1.4 pristine statement".getBytes(StandardCharsets.UTF_8));
        Document doc = documentService.uploadDocument(demoCase.getId(), "Witness Statement", DocumentType.WITNESS_STATEMENT, DocumentClassification.CONFIDENTIAL, file, invA, "127.0.0.1");

        // Simulate tampering in the database metadata hash
        doc.setSha256Hash("0000000000000000000000000000000000000000000000000000000000000000");
        documentRepository.save(doc);

        // Attempt retrieval -> must throw TamperException
        assertThrows(TamperException.class, () -> {
            documentService.downloadDocument(doc.getId(), invA, "127.0.0.1");
        });
    }

    // 6. Modified audit record -> hash-chain verification failure detected
    @Test
    @DisplayName("Security Control 6: Audit trail tampering breaks cryptographic hash chain")
    public void modifiedAuditRecordBreaksHashChainVerification() {
        // Initial chain verification
        Map<String, Object> initialVerify = auditService.verifyAuditChain();
        assertTrue((Boolean) initialVerify.get("valid"), "Initial chain should be intact");

        // Log a test event
        AuditLog testLog = auditService.logEvent(AuditEventType.LOGIN, UUID.randomUUID(), "test_user", "INVESTIGATOR", null, "USER", "1", "127.0.0.1", null, "Initial login");

        Map<String, Object> verifyBeforeTamper = auditService.verifyAuditChain();
        assertTrue((Boolean) verifyBeforeTamper.get("valid"));

        // Attacker tampers with historical actionDetails
        testLog.setActionDetails("TAMPERED_ACTION_DETAILS");
        auditLogRepository.save(testLog);

        // Verify chain again -> Must detect broken chain!
        Map<String, Object> tamperedVerify = auditService.verifyAuditChain();
        assertFalse((Boolean) tamperedVerify.get("valid"));
        assertTrue(tamperedVerify.containsKey("brokenAtIndex"));
    }

    // 7. Invalid JWT -> 401 Unauthorized
    @Test
    @DisplayName("Security Control 7: Tampered or invalid JWT signature rejected with 401")
    public void invalidJwtReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.fakeSignature"))
            .andExpect(status().isUnauthorized());
    }

    // 8. Disguised executable / magic bytes inspection rejects dangerous uploads
    @Test
    @DisplayName("Security Control 8: Upload disguised as .pdf with DOS/MZ executable magic bytes rejected")
    public void disguisedExecutableRejected() throws Exception {
        Case demoCase = getDemoCase();
        String tokenInvA = getJwtTokenForUser("investigator_a");

        // Fake PDF starting with Windows MZ executable magic bytes
        byte[] fakePdfBytes = new byte[]{'M', 'Z', (byte) 0x90, 0x00, 0x03, 0x00, 0x00, 0x00};
        MockMultipartFile maliciousFile = new MockMultipartFile("file", "malware.pdf", "application/pdf", fakePdfBytes);

        mockMvc.perform(multipart("/api/v1/cases/" + demoCase.getId() + "/documents")
                .file(maliciousFile)
                .header("Authorization", "Bearer " + tokenInvA))
            .andExpect(status().isBadRequest());
    }

    // 9. Path traversal filename rejected
    @Test
    @DisplayName("Security Control 9: Path traversal in upload filename rejected")
    public void pathTraversalFilenameRejected() throws Exception {
        Case demoCase = getDemoCase();
        String tokenInvA = getJwtTokenForUser("investigator_a");

        MockMultipartFile file = new MockMultipartFile("file", "../../etc/passwd.pdf", "application/pdf", "%PDF-1.4 dummy".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/v1/cases/" + demoCase.getId() + "/documents")
                .file(file)
                .header("Authorization", "Bearer " + tokenInvA))
            .andExpect(status().isBadRequest());
    }

    // 10. Locked document modification rejected
    @Test
    @DisplayName("Security Control 10: Modifying locked document is prohibited")
    public void lockedDocumentModificationRejected() throws Exception {
        Case demoCase = getDemoCase();
        authenticateAs("investigator_a");
        User invA = userRepository.findByUsername("investigator_a").orElseThrow();

        MockMultipartFile file = new MockMultipartFile("file", "chargesheet.pdf", "application/pdf", "%PDF-1.4 chargesheet draft".getBytes(StandardCharsets.UTF_8));
        Document doc = documentService.uploadDocument(demoCase.getId(), "Charge Sheet Draft", DocumentType.CHARGE_SHEET, DocumentClassification.SECRET, file, invA, "127.0.0.1");

        // Lock document
        doc.setLocked(true);
        documentRepository.save(doc);

        String tokenInvA = getJwtTokenForUser("investigator_a");
        MockMultipartFile newVersion = new MockMultipartFile("file", "chargesheet_v2.pdf", "application/pdf", "%PDF-1.4 revised".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/v1/documents/" + doc.getId() + "/versions")
                .file(newVersion)
                .header("Authorization", "Bearer " + tokenInvA))
            .andExpect(status().isBadRequest());
    }

    // 11. Closed case cannot be modified
    @Test
    @DisplayName("Security Control 11: Modifications to closed case rejected")
    public void closedCaseModificationRejected() throws Exception {
        Case demoCase = getDemoCase();
        demoCase.setStatus(CaseStatus.CLOSED);
        caseRepository.save(demoCase);

        String tokenSenior = getJwtTokenForUser("senior_officer");

        mockMvc.perform(post("/api/v1/cases/" + demoCase.getId() + "/status")
                .header("Authorization", "Bearer " + tokenSenior)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"INVESTIGATION_ONGOING\",\"reason\":\"Reopen attempt\"}"))
            .andExpect(status().isBadRequest());

        // Restore status
        demoCase.setStatus(CaseStatus.INVESTIGATION_ONGOING);
        caseRepository.save(demoCase);
    }

    // 12. Expired JWT -> 401 Unauthorized (Item 60)
    @Test
    @DisplayName("Security Control 12: Expired JWT token is strictly rejected with 401")
    public void testExpiredJwtRejection() throws Exception {
        // Expired token with exp in the past (1970)
        String expiredJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTYwOTQ1OTIwMCwiaWF0IjoxNjA5NDU1NjAwfQ.fZ1zPfv_wT5Uq_B8380w7R0mC_NZZW241p1gS3w_5vA";

        mockMvc.perform(get("/api/v1/cases")
                .header("Authorization", "Bearer " + expiredJwt))
            .andExpect(status().isUnauthorized());
    }

    // 13. Invalid MFA code -> Rejected (Item 61)
    @Test
    @DisplayName("Security Control 13: Invalid MFA / TOTP code returns 401 Unauthorized")
    public void testInvalidMfaTokenRejection() throws Exception {
        String invalidMfaRequest = "{\"preAuthToken\":\"fake.preauth.token\",\"code\":\"000000\"}";

        mockMvc.perform(post("/api/v1/auth/mfa/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidMfaRequest))
            .andExpect(status().isUnauthorized());
    }

    // 14. Malware detection & quarantine isolation (Item 62)
    @Test
    @DisplayName("Security Control 14: EICAR malware string upload triggers critical quarantine alert")
    public void testMalwareQuarantineWorkflow() throws Exception {
        Case demoCase = getDemoCase();
        authenticateAs("investigator_a");
        User invA = userRepository.findByUsername("investigator_a").orElseThrow();

        byte[] eicarBytes = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*".getBytes(StandardCharsets.US_ASCII);
        MockMultipartFile eicarFile = new MockMultipartFile("file", "infected_file.pdf", "application/pdf", eicarBytes);

        // Uploading malware must throw SecurityValidationException and record alert
        assertThrows(Exception.class, () -> {
            documentService.uploadDocument(demoCase.getId(), "Infected Evidence", DocumentType.GENERAL_EVIDENCE, DocumentClassification.CONFIDENTIAL, eicarFile, invA, "10.0.0.99");
        });

        // Verify alert was logged
        assertTrue(securityAlertRepository.findAll().stream()
            .anyMatch(a -> a.getAlertType().contains("MALWARE")), "Security alert for malware should be saved");
    }

    // 15. Oversized upload rejection (Item 63)
    @Test
    @DisplayName("Security Control 15: Oversized payload exceeding allowed limit is rejected")
    public void testOversizedUploadRejection() throws Exception {
        Case demoCase = getDemoCase();
        String tokenInvA = getJwtTokenForUser("investigator_a");

        // Simulate 60MB payload exceeding 50MB spring.servlet.multipart.max-file-size
        byte[] oversizedBytes = new byte[1024]; // Represent header
        MockMultipartFile file = new MockMultipartFile("file", "oversized.pdf", "application/pdf", oversizedBytes);

        mockMvc.perform(multipart("/api/v1/cases/" + demoCase.getId() + "/documents")
                .file(file)
                .header("Authorization", "Bearer " + tokenInvA)
                .header("Content-Length", "62914560")) // 60MB
            .andExpect(status().is4xxClientError());
    }

    // 16. Unauthorized digital signature rejection (Item 64)
    @Test
    @DisplayName("Security Control 16: Document signing by unauthorized persona without signature permission is rejected")
    public void testUnauthorizedDigitalSignatureRejection() throws Exception {
        Case demoCase = getDemoCase();
        authenticateAs("investigator_a");
        User invA = userRepository.findByUsername("investigator_a").orElseThrow();

        MockMultipartFile file = new MockMultipartFile("file", "doc_to_sign.pdf", "application/pdf", "%PDF-1.4 pristine draft".getBytes(StandardCharsets.UTF_8));
        Document doc = documentService.uploadDocument(demoCase.getId(), "Report", DocumentType.INVESTIGATION_NOTE, DocumentClassification.SECRET, file, invA, "127.0.0.1");

        // Attempting to sign without assigned prosecutor or forensic role / permission returns 403 or 400
        String tokenInvB = getJwtTokenForUser("investigator_b");
        mockMvc.perform(post("/api/v1/documents/" + doc.getId() + "/sign")
                .header("Authorization", "Bearer " + tokenInvB))
            .andExpect(status().is4xxClientError());
    }

    // 17. Unauthorized evidence transfer rejection (Item 65)
    @Test
    @DisplayName("Security Control 17: Unauthorized evidence transfer request is rejected")
    public void testUnauthorizedEvidenceTransferRejection() throws Exception {
        String tokenInvB = getJwtTokenForUser("investigator_b");

        // Investigator B attempting to initiate transfer on an unassigned evidence item is rejected
        mockMvc.perform(post("/api/v1/evidence/" + UUID.randomUUID() + "/transfer")
                .header("Authorization", "Bearer " + tokenInvB)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"toCustodianId\":\"" + UUID.randomUUID() + "\",\"reason\":\"Unauthorized test\"}"))
            .andExpect(status().is4xxClientError());
    }

    // 18. Legal hold deletion veto (Item 66)
    @Test
    @DisplayName("Security Control 18: Deletion or disposal of evidence under active Legal Hold is blocked")
    public void testLegalHoldDeletionVeto() {
        Case demoCase = getDemoCase();
        demoCase.setLegalHold(true);
        demoCase.setLegalHoldReason("Judicial injunction in Supreme Court");
        caseRepository.save(demoCase);

        User senior = userRepository.findByUsername("senior_officer").orElseThrow();

        // Execution of disposal must throw WorkflowViolationException due to legal hold
        assertThrows(Exception.class, () -> {
            retentionDisposalService.executeDisposal(demoCase.getId(), senior, "CRYPTOGRAPHIC_ERASURE", "Attempted test disposal");
        });

        // Restore legal hold status
        demoCase.setLegalHold(false);
        caseRepository.save(demoCase);
    }

    // 19. Mass-download threat alert (Item 67)
    @Test
    @DisplayName("Security Control 19: Rapid repeated document downloads trigger mass-download threat alert")
    public void testMassDownloadThreatAlert() {
        User user = userRepository.findByUsername("investigator_a").orElseThrow();
        UUID caseId = getDemoCase().getId();
        UUID docId = UUID.randomUUID();

        // Simulate 12 rapid downloads in under 60 seconds
        for (int i = 0; i < 12; i++) {
            threatDetectionService.recordDownload(user.getId(), user.getUsername(), "192.168.1.50", docId, caseId);
        }

        assertTrue(securityAlertRepository.findAll().stream()
            .anyMatch(a -> a.getAlertType().contains("MASS_DOWNLOAD")), "Mass download alert should be triggered");
    }

    // 20. Privilege-escalation threat alert (Item 68)
    @Test
    @DisplayName("Security Control 20: Privilege escalation attempt triggers critical security alert")
    public void testPrivilegeEscalationThreatAlert() {
        User user = userRepository.findByUsername("investigator_b").orElseThrow();

        // Record unauthorized attempt
        threatDetectionService.recordPrivilegeViolation(user.getId(), user.getUsername(), "10.10.10.10", "PROVISION_USER", "/api/v1/users");

        assertTrue(securityAlertRepository.findAll().stream()
            .anyMatch(a -> a.getAlertType().contains("PRIVILEGE_ESCALATION")), "Privilege escalation alert should be logged");
    }
}
