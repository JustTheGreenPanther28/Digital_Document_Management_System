package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.*;
import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.common.exception.WorkflowViolationException;
import com.sih.casemanagement.entity.*;
import com.sih.casemanagement.repository.*;
import com.sih.casemanagement.security.AbacSecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProsecutionAndCourtService {

    private final ChargeSheetRepository chargeSheetRepository;
    private final ForensicReportRepository forensicReportRepository;
    private final CourtFilingRepository courtFilingRepository;
    private final CourtProceedingRepository courtProceedingRepository;
    private final JudgmentRepository judgmentRepository;
    private final CaseRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final DocumentRepository documentRepository;
    private final DigitalSignatureService digitalSignatureService;
    private final CaseService caseService;
    private final AuditService auditService;
    private final AbacSecurityService abacSecurity;

    public ProsecutionAndCourtService(
        ChargeSheetRepository chargeSheetRepository,
        ForensicReportRepository forensicReportRepository,
        CourtFilingRepository courtFilingRepository,
        CourtProceedingRepository courtProceedingRepository,
        JudgmentRepository judgmentRepository,
        CaseRepository caseRepository,
        EvidenceRepository evidenceRepository,
        DocumentRepository documentRepository,
        DigitalSignatureService digitalSignatureService,
        CaseService caseService,
        AuditService auditService,
        AbacSecurityService abacSecurity
    ) {
        this.chargeSheetRepository = chargeSheetRepository;
        this.forensicReportRepository = forensicReportRepository;
        this.courtFilingRepository = courtFilingRepository;
        this.courtProceedingRepository = courtProceedingRepository;
        this.judgmentRepository = judgmentRepository;
        this.caseRepository = caseRepository;
        this.evidenceRepository = evidenceRepository;
        this.documentRepository = documentRepository;
        this.digitalSignatureService = digitalSignatureService;
        this.caseService = caseService;
        this.auditService = auditService;
        this.abacSecurity = abacSecurity;
    }

    // 1. Forensic Report Submission
    @Transactional
    public ForensicReport submitForensicReport(
        UUID caseId,
        UUID evidenceId,
        UUID documentId,
        String laboratoryName,
        String toolsUtilized,
        String examinationSummary,
        String findings,
        User forensicOfficer,
        String ipAddress
    ) {
        abacSecurity.checkCaseAccess(caseId, "SUBMIT_FORENSIC_REPORT");

        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        Evidence evidence = evidenceRepository.findById(evidenceId)
            .orElseThrow(() -> new ResourceNotFoundException("Evidence not found: " + evidenceId));
        Document doc = documentId != null ? documentRepository.findById(documentId).orElse(null) : null;

        ForensicReport report = new ForensicReport();
        report.setCase(aCase);
        report.setEvidence(evidence);
        report.setDocument(doc);
        report.setExaminer(forensicOfficer);
        report.setLaboratoryName(laboratoryName != null ? laboratoryName : "Central Forensic Science Laboratory");
        report.setToolsUtilized(toolsUtilized);
        report.setExaminationSummary(examinationSummary);
        report.setFindings(findings);
        report.setStatus("COMPLETED");

        ForensicReport saved = forensicReportRepository.save(report);

        evidence.setStatus(EvidenceStatus.ANALYZED);
        evidenceRepository.save(evidence);

        auditService.logEvent(
            AuditEventType.FORENSIC_REPORT_CREATED,
            forensicOfficer.getId(),
            forensicOfficer.getUsername(),
            "FORENSIC_OFFICER",
            caseId,
            "FORENSIC_REPORT",
            saved.getId().toString(),
            ipAddress,
            null,
            "Forensic analysis report completed for " + evidence.getEvidenceNumber()
        );

        return saved;
    }

    // 2. Charge Sheet Submission by Investigator
    @Transactional
    public ChargeSheet submitChargeSheet(UUID caseId, UUID documentId, User investigator, String ipAddress) {
        abacSecurity.checkCaseAccess(caseId, "SUBMIT_CHARGE_SHEET");

        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        Document doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        ChargeSheet sheet = chargeSheetRepository.findByACaseId(caseId).orElse(new ChargeSheet());
        sheet.setCase(aCase);
        sheet.setDocument(doc);
        sheet.setPreparedBy(investigator);
        sheet.setSeniorOfficerApprovalStatus(ApprovalStatus.PENDING);
        sheet.setProsecutorApprovalStatus(ApprovalStatus.PENDING);
        sheet.setStatus("SUBMITTED_FOR_REVIEW");

        ChargeSheet saved = chargeSheetRepository.save(sheet);

        caseService.updateCaseStatus(caseId, CaseStatus.UNDER_REVIEW, "Charge sheet submitted for Senior Officer review", investigator, ipAddress);

        auditService.logEvent(
            AuditEventType.CHARGE_SHEET_SUBMITTED,
            investigator.getId(),
            investigator.getUsername(),
            "INVESTIGATOR",
            caseId,
            "CHARGE_SHEET",
            saved.getId().toString(),
            ipAddress,
            null,
            "Charge sheet submitted for case " + aCase.getCaseNumber()
        );

        return saved;
    }

    // 3. Senior Officer Review
    @Transactional
    public ChargeSheet seniorOfficerReview(UUID chargeSheetId, boolean approved, String notes, User seniorOfficer, String ipAddress) {
        ChargeSheet sheet = chargeSheetRepository.findById(chargeSheetId)
            .orElseThrow(() -> new ResourceNotFoundException("Charge sheet not found: " + chargeSheetId));

        abacSecurity.checkCaseAccess(sheet.getCase().getId(), "REVIEW_CHARGE_SHEET");

        sheet.setSeniorOfficer(seniorOfficer);
        sheet.setSeniorOfficerReviewedAt(Instant.now());
        sheet.setSeniorOfficerReviewNotes(notes);
        sheet.setSeniorOfficerApprovalStatus(approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);

        if (approved) {
            sheet.setStatus("REVIEWED");
            caseService.updateCaseStatus(sheet.getCase().getId(), CaseStatus.CHARGE_SHEET_PENDING, "Approved by Senior Officer, forwarded to Prosecutor", seniorOfficer, ipAddress);
        } else {
            sheet.setStatus("DRAFT");
            caseService.updateCaseStatus(sheet.getCase().getId(), CaseStatus.INVESTIGATION_ONGOING, "Charge sheet rejected by Senior Officer: " + notes, seniorOfficer, ipAddress);
        }

        ChargeSheet saved = chargeSheetRepository.save(sheet);

        auditService.logEvent(
            AuditEventType.DOCUMENT_APPROVED,
            seniorOfficer.getId(),
            seniorOfficer.getUsername(),
            "SENIOR_OFFICER",
            sheet.getCase().getId(),
            "CHARGE_SHEET",
            saved.getId().toString(),
            ipAddress,
            null,
            "Senior Officer review: " + (approved ? "APPROVED" : "REJECTED") + ". Notes: " + notes
        );

        return saved;
    }

    // 4. Prosecutor Review, Digital Signing & Locking
    @Transactional
    public ChargeSheet prosecutorApproveAndSign(UUID chargeSheetId, boolean approved, String notes, User prosecutor, String ipAddress) {
        ChargeSheet sheet = chargeSheetRepository.findById(chargeSheetId)
            .orElseThrow(() -> new ResourceNotFoundException("Charge sheet not found: " + chargeSheetId));

        if (sheet.getSeniorOfficerApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new WorkflowViolationException("Cannot approve: Charge sheet must first be approved by Senior Officer.");
        }

        abacSecurity.checkCaseAccess(sheet.getCase().getId(), "PROSECUTOR_APPROVE");

        sheet.setProsecutor(prosecutor);
        sheet.setProsecutorApprovedAt(Instant.now());
        sheet.setProsecutorReviewNotes(notes);
        sheet.setProsecutorApprovalStatus(approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);

        if (approved) {
            // Cryptographically sign document and lock it
            Document doc = sheet.getDocument();
            DigitalSignature signature = digitalSignatureService.signDocument(doc, prosecutor, "PROSECUTOR");
            sheet.setSignature(signature);
            sheet.setStatus("LOCKED");

            caseService.updateCaseStatus(sheet.getCase().getId(), CaseStatus.SIGNED, "Prosecutor approved, digitally signed, and locked document", prosecutor, ipAddress);

            auditService.logEvent(
                AuditEventType.DOCUMENT_SIGNED,
                prosecutor.getId(),
                prosecutor.getUsername(),
                "PROSECUTOR",
                sheet.getCase().getId(),
                "CHARGE_SHEET",
                sheet.getId().toString(),
                ipAddress,
                null,
                "Prosecutor applied cryptographic digital signature (Cert: " + signature.getCertificateSerial() + "). Document locked."
            );
        } else {
            sheet.setStatus("REVIEWED");
            auditService.logEvent(
                AuditEventType.DOCUMENT_APPROVED,
                prosecutor.getId(),
                prosecutor.getUsername(),
                "PROSECUTOR",
                sheet.getCase().getId(),
                "CHARGE_SHEET",
                sheet.getId().toString(),
                ipAddress,
                null,
                "Prosecutor rejected charge sheet: " + notes
            );
        }

        return chargeSheetRepository.save(sheet);
    }

    // 5. Court Filing
    @Transactional
    public CourtFiling fileInCourt(UUID caseId, String courtName, String filingNumber, User courtOfficer, String ipAddress) {
        Case aCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        if (aCase.getStatus() != CaseStatus.SIGNED && aCase.getStatus() != CaseStatus.APPROVED) {
            throw new WorkflowViolationException("Case must be in SIGNED or APPROVED status prior to court filing.");
        }

        CourtFiling filing = new CourtFiling();
        filing.setCase(aCase);
        filing.setCourtName(courtName);
        filing.setFilingNumber(filingNumber);
        filing.setCourtOfficer(courtOfficer);
        filing.setFiledBy(courtOfficer);
        filing.setFilingDate(Instant.now());
        filing.setStatus("FILED");

        CourtFiling saved = courtFilingRepository.save(filing);

        caseService.updateCaseStatus(caseId, CaseStatus.FILED_IN_COURT, "Filed in " + courtName + " (Ref: " + filingNumber + ")", courtOfficer, ipAddress);

        auditService.logEvent(
            AuditEventType.COURT_FILED,
            courtOfficer.getId(),
            courtOfficer.getUsername(),
            "COURT_OFFICER",
            caseId,
            "COURT_FILING",
            saved.getFilingNumber(),
            ipAddress,
            null,
            "Formal court filing registered in " + courtName
        );

        return saved;
    }

    // 6. Record Court Proceeding
    @Transactional
    public CourtProceeding recordProceeding(
        UUID filingId,
        Instant hearingDate,
        String judgeName,
        String proceedingsSummary,
        Instant nextHearingDate,
        User courtOfficer,
        String ipAddress
    ) {
        CourtFiling filing = courtFilingRepository.findById(filingId)
            .orElseThrow(() -> new ResourceNotFoundException("Filing not found: " + filingId));

        CourtProceeding proceeding = new CourtProceeding();
        proceeding.setFiling(filing);
        proceeding.setCase(filing.getCase());
        proceeding.setHearingDate(hearingDate);
        proceeding.setJudgeName(judgeName);
        proceeding.setProceedingsSummary(proceedingsSummary);
        proceeding.setNextHearingDate(nextHearingDate);
        proceeding.setRecordedBy(courtOfficer);

        CourtProceeding saved = courtProceedingRepository.save(proceeding);

        caseService.updateCaseStatus(filing.getCase().getId(), CaseStatus.COURT_PROCEEDINGS, "Hearing recorded before Judge " + judgeName, courtOfficer, ipAddress);

        return saved;
    }

    // 7. Record Judgment and transition case
    @Transactional
    public Judgment recordJudgment(
        UUID filingId,
        String verdict,
        String summary,
        Instant judgmentDate,
        String judgeName,
        UUID judgmentDocId,
        User courtOfficer,
        String ipAddress
    ) {
        CourtFiling filing = courtFilingRepository.findById(filingId)
            .orElseThrow(() -> new ResourceNotFoundException("Filing not found: " + filingId));

        Document judgmentDoc = judgmentDocId != null ? documentRepository.findById(judgmentDocId).orElse(null) : null;

        Judgment judgment = new Judgment();
        judgment.setFiling(filing);
        judgment.setCase(filing.getCase());
        judgment.setVerdict(verdict);
        judgment.setSummary(summary);
        judgment.setJudgmentDate(judgmentDate);
        judgment.setJudgeName(judgeName);
        judgment.setDocument(judgmentDoc);

        Judgment saved = judgmentRepository.save(judgment);

        caseService.updateCaseStatus(filing.getCase().getId(), CaseStatus.JUDGMENT_DELIVERED, "Judgment delivered: " + verdict + " by " + judgeName, courtOfficer, ipAddress);

        auditService.logEvent(
            AuditEventType.JUDGMENT_RECORDED,
            courtOfficer.getId(),
            courtOfficer.getUsername(),
            "COURT_OFFICER",
            filing.getCase().getId(),
            "JUDGMENT",
            verdict,
            ipAddress,
            null,
            "Judgment recorded: " + verdict + ". Summary: " + summary
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public List<ForensicReport> getForensicReportsForCase(UUID caseId) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        return forensicReportRepository.findByACaseId(caseId);
    }

    @Transactional(readOnly = true)
    public ChargeSheet getChargeSheetForCase(UUID caseId) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        return chargeSheetRepository.findByACaseId(caseId).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<CourtFiling> getCourtFilingsForCase(UUID caseId) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        return courtFilingRepository.findByACaseId(caseId);
    }

    @Transactional(readOnly = true)
    public List<CourtProceeding> getProceedingsForCase(UUID caseId) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        return courtProceedingRepository.findByACaseIdOrderByHearingDateAsc(caseId);
    }

    @Transactional(readOnly = true)
    public Judgment getJudgmentForCase(UUID caseId) {
        abacSecurity.checkCaseAccess(caseId, "READ");
        return judgmentRepository.findByACaseId(caseId).orElse(null);
    }
}
