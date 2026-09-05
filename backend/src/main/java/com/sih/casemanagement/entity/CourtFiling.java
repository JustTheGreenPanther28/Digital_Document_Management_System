package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "court_filings")
public class CourtFiling {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case aCase;

    @Column(name = "court_name", nullable = false, length = 255)
    private String courtName;

    @Column(name = "filing_number", nullable = false, unique = true, length = 100)
    private String filingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filed_by")
    private User filedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_officer_id")
    private User courtOfficer;

    @Column(name = "filing_date", nullable = false)
    private Instant filingDate = Instant.now();

    @Column(nullable = false, length = 50)
    private String status = "FILED";

    public CourtFiling() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Case getCase() { return aCase; }
    public void setCase(Case aCase) { this.aCase = aCase; }

    public String getCourtName() { return courtName; }
    public void setCourtName(String courtName) { this.courtName = courtName; }

    public String getFilingNumber() { return filingNumber; }
    public void setFilingNumber(String filingNumber) { this.filingNumber = filingNumber; }

    public User getFiledBy() { return filedBy; }
    public void setFiledBy(User filedBy) { this.filedBy = filedBy; }

    public User getCourtOfficer() { return courtOfficer; }
    public void setCourtOfficer(User courtOfficer) { this.courtOfficer = courtOfficer; }

    public Instant getFilingDate() { return filingDate; }
    public void setFilingDate(Instant filingDate) { this.filingDate = filingDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
