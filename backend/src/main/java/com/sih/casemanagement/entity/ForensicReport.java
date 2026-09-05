package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "forensic_reports")
public class ForensicReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false)
    private Evidence evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examiner_id", nullable = false)
    private User examiner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @Column(name = "laboratory_name", nullable = false, length = 255)
    private String laboratoryName = "Central Forensic Science Laboratory";

    @Column(name = "tools_utilized", columnDefinition = "TEXT")
    private String toolsUtilized;

    @Column(name = "examination_summary", nullable = false, columnDefinition = "TEXT")
    private String examinationSummary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String findings;

    @Column(nullable = false, length = 20)
    private String status = "COMPLETED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ForensicReport() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Evidence getEvidence() { return evidence; }
    public void setEvidence(Evidence evidence) { this.evidence = evidence; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public User getExaminer() { return examiner; }
    public void setExaminer(User examiner) { this.examiner = examiner; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public String getLaboratoryName() { return laboratoryName; }
    public void setLaboratoryName(String laboratoryName) { this.laboratoryName = laboratoryName; }

    public String getToolsUtilized() { return toolsUtilized; }
    public void setToolsUtilized(String toolsUtilized) { this.toolsUtilized = toolsUtilized; }

    public String getExaminationSummary() { return examinationSummary; }
    public void setExaminationSummary(String examinationSummary) { this.examinationSummary = examinationSummary; }

    public String getFindings() { return findings; }
    public void setFindings(String findings) { this.findings = findings; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
