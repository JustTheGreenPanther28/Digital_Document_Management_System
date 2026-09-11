package com.sih.casemanagement.config;

import com.sih.casemanagement.common.enums.*;
import com.sih.casemanagement.entity.*;
import com.sih.casemanagement.repository.*;

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
    


    public DataInitializer(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PermissionRepository permissionRepository,
        CaseRepository caseRepository,
        CaseUserAssignmentRepository assignmentRepository,
        CaseStatusHistoryRepository statusHistoryRepository,
        PasswordEncoder passwordEncoder,
        AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.caseRepository = caseRepository;
        this.assignmentRepository = assignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;

    }

    @Override
    @Transactional
    public void run(String... args) {
        ensurePermissions();
        ensureRoles();
        ensureUsers();
        ensureDemoCase();
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
        String encodedPassword = passwordEncoder.encode(adminInitialPassword != null ? adminInitialPassword : "Admin@2026");

        if (userRepository.findByUsernameIgnoreCase(effectiveAdminUser).isEmpty()) {
            User user = new User();
            user.setUsername(effectiveAdminUser);
            user.setEmail(adminEmail != null ? adminEmail : "admin@ndcms.gov.in");
            user.setPasswordHash(encodedPassword);
            user.setFullName(adminFullName != null ? adminFullName : "Chief System Administrator");
            user.setBadgeNumber(adminBadgeNumber != null ? adminBadgeNumber : "ADMIN-001");
            user.setDepartment(adminDepartment != null ? adminDepartment : "National Cyber Defense HQ");
            user.setSecurityClearance(SecurityClearance.TOP_SECRET);
            user.setEnabled(true);
            user.setMfaEnabled(false);
            user.setMfaSecret(null);

            roleRepository.findByName(RoleType.ADMIN).ifPresent(r -> user.setRoles(Set.of(r)));
            userRepository.save(user);
            log.info("Initialized secure Central Administrator user: {} ({})", effectiveAdminUser, RoleType.ADMIN);
        }

        // Seed default officers if not present
        Object[][] officers = {
            {"senior_officer", "senior@ndcms.gov.in", "Commissioner Sterling", "IPS-8921", "Crime Branch HQ", SecurityClearance.TOP_SECRET, RoleType.SENIOR_OFFICER},
            {"investigator_a", "investigator_a@ndcms.gov.in", "Det. John Miller (Lead)", "INS-4412", "Cyber Crime Cell", SecurityClearance.SECRET, RoleType.INVESTIGATOR},
            {"investigator_b", "investigator_b@ndcms.gov.in", "Det. Sarah Connor", "INS-4413", "Special Cell", SecurityClearance.CONFIDENTIAL, RoleType.INVESTIGATOR},
            {"custodian", "custodian@ndcms.gov.in", "Officer Michael Vance", "CUST-009", "Central Malkhana / Evidence Vault", SecurityClearance.CONFIDENTIAL, RoleType.EVIDENCE_CUSTODIAN},
            {"forensic_officer", "forensic@ndcms.gov.in", "Dr. Evelyn Reed", "CFSL-901", "Central Forensic Science Laboratory (CFSL)", SecurityClearance.SECRET, RoleType.FORENSIC_OFFICER},
            {"prosecutor", "prosecutor@ndcms.gov.in", "Counsel Diane Lockhart", "PROS-112", "Directorate of Prosecution", SecurityClearance.SECRET, RoleType.PROSECUTOR},
            {"court_officer", "court@ndcms.gov.in", "Registrar Arthur Pendelton", "CRT-004", "Principal Sessions Court Registry", SecurityClearance.PUBLIC, RoleType.COURT_OFFICER},
            {"auditor", "auditor@ndcms.gov.in", "Inspector General Hayes", "AUD-991", "Vigilance & Digital Compliance Directorate", SecurityClearance.TOP_SECRET, RoleType.AUDITOR}
        };

        String defaultPass = passwordEncoder.encode("Password@2026!");
        for (Object[] off : officers) {
            String uName = (String) off[0];
            if (userRepository.findByUsernameIgnoreCase(uName).isEmpty()) {
                User u = new User();
                u.setUsername(uName);
                u.setEmail((String) off[1]);
                u.setPasswordHash(defaultPass);
                u.setFullName((String) off[2]);
                u.setBadgeNumber((String) off[3]);
                u.setDepartment((String) off[4]);
                u.setSecurityClearance((SecurityClearance) off[5]);
                u.setEnabled(true);
                u.setAccountLocked(false);
                u.setMfaEnabled(false);
                roleRepository.findByName((RoleType) off[6]).ifPresent(r -> u.setRoles(Set.of(r)));
                userRepository.save(u);
                log.info("Seeded directory officer account: {}", uName);
            }
        }

        // Guarantee all user accounts are unlocked, active, and have reset attempts on startup
        userRepository.findAll().forEach(u -> {
            boolean modified = false;
            if (u.isAccountLocked() || u.getFailedLoginAttempts() > 0 || u.getLockTime() != null) {
                u.setAccountLocked(false);
                u.setFailedLoginAttempts(0);
                u.setLockTime(null);
                modified = true;
            }

            if (!u.isEnabled()) {
                u.setEnabled(true);
                modified = true;
            }
            if (modified) {
                userRepository.save(u);
                log.info("Unlocked account and cleared lockout state for user: {}", u.getUsername());
            }
        });
    }

    private void ensureDemoCase() {
        if (caseRepository.count() == 0) {
            String effectiveAdminUser = (adminUsername != null && !adminUsername.isBlank()) ? adminUsername.trim() : "ADMIN";
            User admin = userRepository.findByUsername(effectiveAdminUser).orElse(null);

            if (admin != null) {
                User invA = userRepository.findByUsername("investigator_a").orElse(null);
                User forensic = userRepository.findByUsername("forensic_officer").orElse(null);
                User custodian = userRepository.findByUsername("custodian").orElse(null);
                User prosecutor = userRepository.findByUsername("prosecutor").orElse(null);
                User courtOfficer = userRepository.findByUsername("court_officer").orElse(null);

                // CASE-2026-001 (SECRET)
                Case demoCase = new Case();
                demoCase.setCaseNumber("CASE-2026-001");
                demoCase.setTitle("State vs Syndicate Alpha (Cyber Breach & Exfiltration)");
                demoCase.setDescription("High-profile cyber espionage targeting power grid SCADA telemetry servers with zero-day exploits.");
                demoCase.setFirNumber("FIR-2026-0981");
                demoCase.setIncidentDate(Instant.now().minusSeconds(86400 * 2));
                demoCase.setRegistrationDate(Instant.now().minusSeconds(86400));
                demoCase.setInvestigatingAgency("Central Crime Branch (CCB)");
                demoCase.setStatus(CaseStatus.INVESTIGATION_ONGOING);
                demoCase.setPriority(CasePriority.CRITICAL);
                demoCase.setClassification(DocumentClassification.SECRET);
                demoCase.setCreatedBy(admin);

                Case savedCase1 = caseRepository.save(demoCase);
                assignmentRepository.save(new CaseUserAssignment(savedCase1, admin, "SYSTEM_ADMINISTRATOR", admin));
                if (invA != null) assignmentRepository.save(new CaseUserAssignment(savedCase1, invA, "LEAD_INVESTIGATOR", admin));
                if (forensic != null) assignmentRepository.save(new CaseUserAssignment(savedCase1, forensic, "FORENSIC_EXPERT", admin));
                if (custodian != null) assignmentRepository.save(new CaseUserAssignment(savedCase1, custodian, "EVIDENCE_CUSTODIAN", admin));
                statusHistoryRepository.save(new CaseStatusHistory(savedCase1, null, CaseStatus.INVESTIGATION_ONGOING, admin, "Genesis Case Initialized"));

                // CASE-2026-002 (SECRET)
                Case case2 = new Case();
                case2.setCaseNumber("CASE-2026-002");
                case2.setTitle("Financial Securities Manipulation & Ledger Tamper");
                case2.setDescription("Cryptographic fraud investigation involving unauthorized off-chain asset liquidation and forged signatures.");
                case2.setFirNumber("FIR-2026-1142");
                case2.setIncidentDate(Instant.now().minusSeconds(86400 * 4));
                case2.setRegistrationDate(Instant.now().minusSeconds(86400 * 3));
                case2.setInvestigatingAgency("Economic Offenses Wing (EOW)");
                case2.setStatus(CaseStatus.UNDER_REVIEW);
                case2.setPriority(CasePriority.HIGH);
                case2.setClassification(DocumentClassification.SECRET);
                case2.setCreatedBy(admin);
                Case savedCase2 = caseRepository.save(case2);
                assignmentRepository.save(new CaseUserAssignment(savedCase2, admin, "SYSTEM_ADMINISTRATOR", admin));
                if (invA != null) assignmentRepository.save(new CaseUserAssignment(savedCase2, invA, "LEAD_INVESTIGATOR", admin));
                if (prosecutor != null) assignmentRepository.save(new CaseUserAssignment(savedCase2, prosecutor, "LEAD_PROSECUTOR", admin));
                statusHistoryRepository.save(new CaseStatusHistory(savedCase2, null, CaseStatus.UNDER_REVIEW, admin, "Chargesheet Filed"));

                // CASE-2026-003 (CONFIDENTIAL)
                Case case3 = new Case();
                case3.setCaseNumber("CASE-2026-003");
                case3.setTitle("Confidential Document Exfiltration & Trade Secrets");
                case3.setDescription("Internal breach of classified engineering blueprints and unauthorized physical media duplication.");
                case3.setFirNumber("FIR-2026-0428");
                case3.setIncidentDate(Instant.now().minusSeconds(86400 * 6));
                case3.setRegistrationDate(Instant.now().minusSeconds(86400 * 5));
                case3.setInvestigatingAgency("Cyber Forensics Division (CFD)");
                case3.setStatus(CaseStatus.REGISTERED);
                case3.setPriority(CasePriority.MEDIUM);
                case3.setClassification(DocumentClassification.CONFIDENTIAL);
                case3.setCreatedBy(admin);
                Case savedCase3 = caseRepository.save(case3);
                assignmentRepository.save(new CaseUserAssignment(savedCase3, admin, "SYSTEM_ADMINISTRATOR", admin));
                if (forensic != null) assignmentRepository.save(new CaseUserAssignment(savedCase3, forensic, "FORENSIC_EXPERT", admin));
                if (custodian != null) assignmentRepository.save(new CaseUserAssignment(savedCase3, custodian, "EVIDENCE_CUSTODIAN", admin));
                statusHistoryRepository.save(new CaseStatusHistory(savedCase3, null, CaseStatus.REGISTERED, admin, "Case Registered"));

                auditService.logEvent(
                    AuditEventType.CASE_CREATED,
                    admin.getId(),
                    admin.getUsername(),
                    "ADMIN",
                    savedCase1.getId(),
                    "CASE",
                    savedCase1.getCaseNumber(),
                    "127.0.0.1",
                    "System-Initializer",
                    "Investigation records initialized with ABAC assignment matrix"
                );
                log.info("Initialized baseline cases CASE-2026-001 through CASE-2026-003 with ABAC team assignments");
            }
        }
    }
}
