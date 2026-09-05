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
    private final CaseRepository caseRepository;
    private final CaseUserAssignmentRepository assignmentRepository;
    private final CaseStatusHistoryRepository statusHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public DataInitializer(
        UserRepository userRepository,
        RoleRepository roleRepository,
        CaseRepository caseRepository,
        CaseUserAssignmentRepository assignmentRepository,
        CaseStatusHistoryRepository statusHistoryRepository,
        PasswordEncoder passwordEncoder,
        AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.caseRepository = caseRepository;
        this.assignmentRepository = assignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureRoles();
        ensureUsers();
        ensureDemoCase();
    }

    private void ensureRoles() {
        for (RoleType rt : RoleType.values()) {
            if (roleRepository.findByName(rt).isEmpty()) {
                roleRepository.save(new Role(rt, "System role: " + rt.name()));
            }
        }
    }

    private void ensureUsers() {
        String defaultPassword = passwordEncoder.encode("kirtan@123");

        createUserIfAbsent("admin", "admin@demo.local", defaultPassword, "Central System Administrator",
            "ADMIN-001", "Security IT", SecurityClearance.TOP_SECRET, RoleType.ADMIN);

        createUserIfAbsent("senior_officer", "senior@demo.local", defaultPassword, "ACP Vikram Rathore",
            "IPS-8921", "Crime Branch HQ", SecurityClearance.TOP_SECRET, RoleType.SENIOR_OFFICER);

        createUserIfAbsent("investigator_a", "investigator_a@demo.local", defaultPassword, "Inspector Naresh Sharma",
            "INS-4412", "Cyber Crime Cell", SecurityClearance.SECRET, RoleType.INVESTIGATOR);

        createUserIfAbsent("investigator_b", "investigator_b@demo.local", defaultPassword, "Inspector Priya Verma",
            "INS-4413", "Special Cell", SecurityClearance.SECRET, RoleType.INVESTIGATOR);

        createUserIfAbsent("custodian", "custodian@demo.local", defaultPassword, "Malkhana Custodian Ramesh Kumar",
            "CUST-102", "Central Evidence Vault", SecurityClearance.CONFIDENTIAL, RoleType.EVIDENCE_CUSTODIAN);

        createUserIfAbsent("forensic_officer", "forensic@demo.local", defaultPassword, "Dr. Ananya Sen",
            "CFSL-509", "Digital Forensics Division", SecurityClearance.SECRET, RoleType.FORENSIC_OFFICER);

        createUserIfAbsent("prosecutor", "prosecutor@demo.local", defaultPassword, "Advocate Rajesh Malhotra",
            "PROS-772", "Directorate of Prosecution", SecurityClearance.TOP_SECRET, RoleType.PROSECUTOR);

        createUserIfAbsent("court_officer", "court@demo.local", defaultPassword, "Registrar Sunita Menon",
            "CRT-301", "High Court / Sessions Court", SecurityClearance.PUBLIC, RoleType.COURT_OFFICER);

        createUserIfAbsent("auditor", "auditor@demo.local", defaultPassword, "Chief Auditor Deepak Gupta",
            "AUD-901", "Oversight & Vigilance", SecurityClearance.TOP_SECRET, RoleType.AUDITOR);
    }

    private void createUserIfAbsent(
        String username,
        String email,
        String encodedPassword,
        String fullName,
        String badge,
        String dept,
        SecurityClearance clearance,
        RoleType roleType
    ) {
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(encodedPassword);
            user.setFullName(fullName);
            user.setBadgeNumber(badge);
            user.setDepartment(dept);
            user.setSecurityClearance(clearance);
            user.setEnabled(true);
            user.setAccountLocked(false);
            user.setMfaEnabled(false); // Can be enabled on-demand or tested directly

            roleRepository.findByName(roleType).ifPresent(r -> user.setRoles(Set.of(r)));
            userRepository.save(user);
            log.info("Provisioned initial demo user: {} ({})", username, roleType);
        }
    }

    private void ensureDemoCase() {
        if (caseRepository.count() == 0) {
            User senior = userRepository.findByUsername("senior_officer").orElse(null);
            User invA = userRepository.findByUsername("investigator_a").orElse(null);
            User custodian = userRepository.findByUsername("custodian").orElse(null);
            User forensic = userRepository.findByUsername("forensic_officer").orElse(null);
            User prosecutor = userRepository.findByUsername("prosecutor").orElse(null);

            if (senior != null && invA != null) {
                Case demoCase = new Case();
                demoCase.setCaseNumber("CASE-2026-001");
                demoCase.setTitle("State v. Cyber Heist Syndicate");
                demoCase.setDescription("Investigation into unauthorized breach and exfiltration of financial records.");
                demoCase.setFirNumber("FIR-2026-ND-0891");
                demoCase.setIncidentDate(Instant.now().minusSeconds(86400 * 5));
                demoCase.setRegistrationDate(Instant.now().minusSeconds(86400 * 3));
                demoCase.setInvestigatingAgency("Central Investigative Bureau");
                demoCase.setStatus(CaseStatus.INVESTIGATION_ONGOING);
                demoCase.setPriority(CasePriority.HIGH);
                demoCase.setClassification(DocumentClassification.SECRET);
                demoCase.setCreatedBy(senior);

                Case savedCase = caseRepository.save(demoCase);

                // Assign Team: Senior, Investigator A, Custodian, Forensic, Prosecutor
                assignmentRepository.save(new CaseUserAssignment(savedCase, senior, "SUPERVISORY_OFFICER", senior));
                assignmentRepository.save(new CaseUserAssignment(savedCase, invA, "LEAD_INVESTIGATOR", senior));
                if (custodian != null) assignmentRepository.save(new CaseUserAssignment(savedCase, custodian, "EVIDENCE_CUSTODIAN", senior));
                if (forensic != null) assignmentRepository.save(new CaseUserAssignment(savedCase, forensic, "FORENSIC_ANALYST", senior));
                if (prosecutor != null) assignmentRepository.save(new CaseUserAssignment(savedCase, prosecutor, "PROSECUTOR", senior));

                // Status history
                statusHistoryRepository.save(new CaseStatusHistory(savedCase, null, CaseStatus.REGISTERED, senior, "Case Registered"));
                statusHistoryRepository.save(new CaseStatusHistory(savedCase, CaseStatus.REGISTERED, CaseStatus.INVESTIGATION_ONGOING, senior, "Assigned to Lead Investigator"));

                // Genesis Audit Log entry
                auditService.logEvent(
                    AuditEventType.CASE_CREATED,
                    senior.getId(),
                    senior.getUsername(),
                    "SENIOR_OFFICER",
                    savedCase.getId(),
                    "CASE",
                    savedCase.getCaseNumber(),
                    "127.0.0.1",
                    "System-Initializer",
                    "Genesis investigation record initialized for " + savedCase.getCaseNumber()
                );
                log.info("Initialized baseline demo investigation CASE-2026-001");
            }
        }
    }
}
