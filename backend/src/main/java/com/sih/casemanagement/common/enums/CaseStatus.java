package com.sih.casemanagement.common.enums;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum CaseStatus {
    DRAFT,
    REGISTERED,
    INVESTIGATION_ONGOING,
    EVIDENCE_COLLECTION,
    FORENSIC_ANALYSIS,
    UNDER_REVIEW,
    CHARGE_SHEET_PENDING,
    PROSECUTOR_REVIEW,
    APPROVED,
    SIGNED,
    FILED_IN_COURT,
    COURT_PROCEEDINGS,
    JUDGMENT_DELIVERED,
    CLOSED,
    ARCHIVED;

    private static final Map<CaseStatus, Set<CaseStatus>> VALID_TRANSITIONS = Map.ofEntries(
        Map.entry(DRAFT, EnumSet.of(REGISTERED)),
        Map.entry(REGISTERED, EnumSet.of(INVESTIGATION_ONGOING)),
        Map.entry(INVESTIGATION_ONGOING, EnumSet.of(EVIDENCE_COLLECTION, FORENSIC_ANALYSIS, UNDER_REVIEW)),
        Map.entry(EVIDENCE_COLLECTION, EnumSet.of(FORENSIC_ANALYSIS, INVESTIGATION_ONGOING, UNDER_REVIEW)),
        Map.entry(FORENSIC_ANALYSIS, EnumSet.of(INVESTIGATION_ONGOING, UNDER_REVIEW)),
        Map.entry(UNDER_REVIEW, EnumSet.of(INVESTIGATION_ONGOING, CHARGE_SHEET_PENDING)),
        Map.entry(CHARGE_SHEET_PENDING, EnumSet.of(PROSECUTOR_REVIEW, INVESTIGATION_ONGOING)),
        Map.entry(PROSECUTOR_REVIEW, EnumSet.of(APPROVED, INVESTIGATION_ONGOING)),
        Map.entry(APPROVED, EnumSet.of(SIGNED)),
        Map.entry(SIGNED, EnumSet.of(FILED_IN_COURT)),
        Map.entry(FILED_IN_COURT, EnumSet.of(COURT_PROCEEDINGS)),
        Map.entry(COURT_PROCEEDINGS, EnumSet.of(JUDGMENT_DELIVERED)),
        Map.entry(JUDGMENT_DELIVERED, EnumSet.of(CLOSED)),
        Map.entry(CLOSED, EnumSet.of(ARCHIVED)),
        Map.entry(ARCHIVED, EnumSet.noneOf(CaseStatus.class))
    );

    public boolean canTransitionTo(CaseStatus next) {
        if (next == null || this == next) return true;
        Set<CaseStatus> allowed = VALID_TRANSITIONS.get(this);
        return allowed != null && allowed.contains(next);
    }

    public boolean isReadOnly() {
        return this == CLOSED || this == ARCHIVED;
    }
}
