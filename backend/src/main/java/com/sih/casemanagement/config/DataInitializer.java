package com.sih.casemanagement.config;

import com.sih.casemanagement.common.enums.*;
import com.sih.casemanagement.entity.*;
import com.sih.casemanagement.repository.*;
import com.sih.casemanagement.security.TotpService;
import com.sih.casemanagement.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Component
@ConditionalOnProperty(name = "app.seed-demo-data", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final CaseRepository caseRepository;
    private final CaseUserAssignmentRepository assignmentRepository;
    private final CaseStatusHistoryRepository statusHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    private final TotpService totpService;

    @org.springframework.beans.factory.annotation.Value("${app.admin.username:ADMIN}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${app.admin.email:admin@ndcms.gov.in}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.admin.initial-password:Admin@2026!Secure}")
    private String adminInitialPassword;

    @org.springframework.beans.factory.annotation.Value("${app.admin.badge-number:ADMIN-001}")
    private String adminBadgeNumber;

    @org.springframework.beans.factory.annotation.Value("${app.admin.full-name:Chief System Administrator}")
    private String adminFullName;

    @org.springframework.beans.factory.annotation.Value("${app.admin.department:National Cyber Defense HQ}")
    private String adminDepartment;
    
    @org.springframework.beans.factory.annotation.Value("${app.totp.secret}")
    private String totpSecret;

    public DataInitializer(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PermissionRepository permissionRepository,
        CaseRepository caseRepository,
        CaseUserAssignmentRepository assignmentRepository,
        CaseStatusHistoryRepository statusHistoryRepository,
        PasswordEncoder passwordEncoder,
        AuditService auditService,
        TotpService totpService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.caseRepository = caseRepository;
        this.assignmentRepository = assignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.totpService = totpService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensurePermissions();
        ensureRoles();
        purgeLegacyUsers();
        ensureUsers();
        ensureDemoCase();
    }

    private void purgeLegacyUsers() {
        String[] legacyUsernames = {
            "senior_officer", "investigator_a", "investigator_b", "custodian",
            "forensic_officer", "prosecutor", "court_officer", "auditor", "admin"
        };
        for (String uname : legacyUsernames) {
            if (!uname.equalsIgnoreCase(adminUsername)) {
                userRepository.findByUsername(uname).ifPresent(user -> {
                    try {
                        userRepository.delete(user);
                        log.info("Purged legacy demo account: {}", uname);
                    } catch (Exception e) {
                        log.debug("Note during purge: {}", e.getMessage());
                    }
                });
            }
        }
    }

    private void ensurePermissions() {
        String[][] permDefs = {
            {"CASE_READ", "CASE", "View case details and history"},
            {"CASE_CREATE", "CASE", "Register a new investigative case"},
            {"CASE_ASSIGN_TEAM", "CASE", "Assign and reassign officers to a case"},
            {"CASE_UPDATE_STATUS", "CASE", "Advance or modify case status in workflow"},
            {"CASE_LEGAL_HOLD", "CASE", "Apply or release legal hold on case and evidence"},
            {"DOCUMENT_UPLOAD", "DOCUMENT", "Ingest and encrypt documents into vault"},
            {"DOCUMENT_DOWNLOAD", "DOCUMENT", "Decrypt and download evidence documents"},
            {"DOCUMENT_SIGN", "DOCUMENT", "Digitally sign documents using RSA-2048 PKI"},
            {"DOCUMENT_DELETE", "DOCUMENT", "Securely purge documents"},
            {"EVIDENCE_REGISTER", "EVIDENCE", "Log physical or digital evidence with barcode"},
            {"EVIDENCE_TRANSFER", "EVIDENCE", "Initiate two-party chain-of-custody transfer"},
            {"EVIDENCE_ACCEPT_CUSTODY", "EVIDENCE", "Accept custody transfer with counter-signature"},
            {"FORENSIC_ANALYZE", "FORENSICS", "Perform forensic extraction and lab reporting"},
            {"PROSECUTION_REVIEW", "PROSECUTION", "Scrutinize charge-sheets and build trial bundles"},
            {"COURT_RECORD_HEARING", "COURT", "Record court filings and judicial hearing dispositions"},
            {"AUDIT_VERIFY_LEDGER", "AUDIT", "Verify SHA-256 cryptographic audit ledger integrity"},
            {"ADMIN_USER_PROVISION", "ADMIN", "Provision, lock, and manage security clearance of users"},
            {"RETENTION_MANAGE", "LIFECYCLE", "Configure retention policies and authorize disposals"}
        };
        for (String[] def : permDefs) {
            if (permissionRepository.findByName(def[0]).isEmpty()) {
                permissionRepository.save(new Permission(def[0], def[1], def[2]));
            }
        }
    }

    private void ensureRoles() {
        for (RoleType rt : RoleType.values()) {
            Role role = roleRepository.findByName(rt).orElseGet(() -> {
                Role r = new Role(rt, "System role: " + rt.name());
                return roleRepository.save(r);
            });

            if (role.getPermissions() == null || role.getPermissions().isEmpty()) {
                java.util.List<Permission> allPerms = permissionRepository.findAll();
                java.util.Set<Permission> assigned = new java.util.HashSet<>();
                if (rt == RoleType.ADMIN) {
                    assigned.addAll(allPerms);
                } else if (rt == RoleType.SENIOR_OFFICER) {
                    for (Permission p : allPerms) {
                        if (java.util.Set.of("CASE_READ", "CASE_CREATE", "CASE_ASSIGN_TEAM", "CASE_UPDATE_STATUS", "CASE_LEGAL_HOLD", "DOCUMENT_UPLOAD", "DOCUMENT_DOWNLOAD", "DOCUMENT_SIGN", "EVIDENCE_REGISTER", "RETENTION_MANAGE", "AUDIT_VERIFY_LEDGER").contains(p.getName())) {
                            assigned.add(p);
                        }
                    }
                } else if (rt == RoleType.INVESTIGATOR) {
                    for (Permission p : allPerms) {
                        if (java.util.Set.of("CASE_READ", "DOCUMENT_UPLOAD", "DOCUMENT_DOWNLOAD", "DOCUMENT_SIGN", "EVIDENCE_REGISTER", "EVIDENCE_TRANSFER").contains(p.getName())) {
                            assigned.add(p);
                        }
                    }
                } else if (rt == RoleType.EVIDENCE_CUSTODIAN) {
                    for (Permission p : allPerms) {
                        if (java.util.Set.of("CASE_READ", "EVIDENCE_REGISTER", "EVIDENCE_TRANSFER", "EVIDENCE_ACCEPT_CUSTODY", "DOCUMENT_DOWNLOAD").contains(p.getName())) {
                            assigned.add(p);
                        }
                    }
                } else if (rt == RoleType.FORENSIC_OFFICER) {
                    for (Permission p : allPerms) {
                        if (java.util.Set.of("CASE_READ", "FORENSIC_ANALYZE", "DOCUMENT_UPLOAD", "DOCUMENT_DOWNLOAD", "DOCUMENT_SIGN", "EVIDENCE_ACCEPT_CUSTODY").contains(p.getName())) {
                            assigned.add(p);
                        }
                    }
                } else if (rt == RoleType.PROSECUTOR) {
                    for (Permission p : allPerms) {
                        if (java.util.Set.of("CASE_READ", "PROSECUTION_REVIEW", "DOCUMENT_DOWNLOAD", "DOCUMENT_SIGN", "CASE_LEGAL_HOLD").contains(p.getName())) {
                            assigned.add(p);
                        }
                    }
                } else if (rt == RoleType.COURT_OFFICER) {
                    for (Permission p : allPerms) {
                        if (java.util.Set.of("CASE_READ", "COURT_RECORD_HEARING", "DOCUMENT_DOWNLOAD").contains(p.getName())) {
                            assigned.add(p);
                        }
                    }
                } else if (rt == RoleType.AUDITOR) {
                    for (Permission p : allPerms) {
                        if (java.util.Set.of("CASE_READ", "AUDIT_VERIFY_LEDGER", "DOCUMENT_DOWNLOAD").contains(p.getName())) {
                            assigned.add(p);
                        }
                    }
                }
                role.setPermissions(assigned);
                roleRepository.save(role);
            }
        }
    }

    private void ensureUsers() {
        String effectiveAdminUser = (adminUsername != null && !adminUsername.isBlank()) ? adminUsername.trim() : "ADMIN";
        String encodedPassword = passwordEncoder.encode(adminInitialPassword != null ? adminInitialPassword : "Admin@2026!Secure");

        if (userRepository.findByUsername(effectiveAdminUser).isEmpty()) {
            User user = new User();
            user.setUsername(effectiveAdminUser);
            user.setEmail(adminEmail != null ? adminEmail : "admin@ndcms.gov.in");
            user.setPasswordHash(encodedPassword);
            user.setFullName(adminFullName != null ? adminFullName : "Chief System Administrator");
            user.setBadgeNumber(adminBadgeNumber != null ? adminBadgeNumber : "ADMIN-001");
            user.setDepartment(adminDepartment != null ? adminDepartment : "National Cyber Defense HQ");
            user.setSecurityClearance(SecurityClearance.TOP_SECRET);
            user.setEnabled(true);
            user.setAccountLocked(false);
            user.setMfaEnabled(true);
            user.setMfaSecret(this.totpSecret);

            roleRepository.findByName(RoleType.ADMIN).ifPresent(r -> user.setRoles(Set.of(r)));
            userRepository.save(user);
            log.info("Initialized secure Central Administrator user: {} ({}) with MFA mandatory", effectiveAdminUser, RoleType.ADMIN);
        }
    }

    private void ensureDemoCase() {
        if (caseRepository.count() == 0) {
            String effectiveAdminUser = (adminUsername != null && !adminUsername.isBlank()) ? adminUsername.trim() : "ADMIN";
            User admin = userRepository.findByUsername(effectiveAdminUser).orElse(null);

            if (admin != null) {
                Case demoCase = new Case();
                demoCase.setCaseNumber("CASE-2026-001");
                demoCase.setTitle("National Cyber Security Briefing & Incident Registry");
                demoCase.setDescription("Central secure digital repository and case registry initialized under zero-trust governance.");
                demoCase.setFirNumber("FIR-2026-HQ-0001");
                demoCase.setIncidentDate(Instant.now().minusSeconds(86400 * 2));
                demoCase.setRegistrationDate(Instant.now().minusSeconds(86400));
                demoCase.setInvestigatingAgency("National Cyber Defense Command");
                demoCase.setStatus(CaseStatus.REGISTERED);
                demoCase.setPriority(CasePriority.CRITICAL);
                demoCase.setClassification(DocumentClassification.TOP_SECRET);
                demoCase.setCreatedBy(admin);

                Case savedCase = caseRepository.save(demoCase);
                assignmentRepository.save(new CaseUserAssignment(savedCase, admin, "SYSTEM_ADMINISTRATOR", admin));
                statusHistoryRepository.save(new CaseStatusHistory(savedCase, null, CaseStatus.REGISTERED, admin, "Genesis Case Initialized"));

                auditService.logEvent(
                    AuditEventType.CASE_CREATED,
                    admin.getId(),
                    admin.getUsername(),
                    "ADMIN",
                    savedCase.getId(),
                    "CASE",
                    savedCase.getCaseNumber(),
                    "127.0.0.1",
                    "System-Initializer",
                    "Genesis investigation record initialized for " + savedCase.getCaseNumber()
                );
                log.info("Initialized baseline case CASE-2026-001 for Administrator {}", effectiveAdminUser);
            }
        }
    }
}
