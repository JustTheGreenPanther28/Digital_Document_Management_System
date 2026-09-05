package com.sih.casemanagement.dto;

import com.sih.casemanagement.common.enums.CasePriority;
import com.sih.casemanagement.common.enums.CaseStatus;
import com.sih.casemanagement.common.enums.DocumentClassification;
import com.sih.casemanagement.entity.Case;
import com.sih.casemanagement.entity.CaseStatusHistory;
import com.sih.casemanagement.entity.CaseUserAssignment;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record CaseDetailsResponse(
    UUID id,
    String caseNumber,
    String title,
    String description,
    String firNumber,
    Instant incidentDate,
    Instant registrationDate,
    String investigatingAgency,
    CaseStatus status,
    CasePriority priority,
    DocumentClassification classification,
    String createdByUsername,
    boolean legalHold,
    String legalHoldReason,
    List<AssignmentItem> assignments,
    List<StatusHistoryItem> statusHistory
) {
    public record AssignmentItem(UUID id, UUID userId, String username, String fullName, String roleInCase, Instant assignedAt) {}
    public record StatusHistoryItem(UUID id, CaseStatus fromStatus, CaseStatus toStatus, String changedByUsername, String reason, Instant timestamp) {}

    public static CaseDetailsResponse from(Case c, List<CaseUserAssignment> assignments, List<CaseStatusHistory> history) {
        List<AssignmentItem> assignmentItems = assignments.stream()
            .map(a -> new AssignmentItem(
                a.getId(),
                a.getUser().getId(),
                a.getUser().getUsername(),
                a.getUser().getFullName(),
                a.getRoleInCase(),
                a.getAssignedAt()
            ))
            .collect(Collectors.toList());

        List<StatusHistoryItem> historyItems = history.stream()
            .map(h -> new StatusHistoryItem(
                h.getId(),
                h.getFromStatus(),
                h.getToStatus(),
                h.getChangedBy() != null ? h.getChangedBy().getUsername() : "SYSTEM",
                h.getReason(),
                h.getTimestamp()
            ))
            .collect(Collectors.toList());

        return new CaseDetailsResponse(
            c.getId(),
            c.getCaseNumber(),
            c.getTitle(),
            c.getDescription(),
            c.getFirNumber(),
            c.getIncidentDate(),
            c.getRegistrationDate(),
            c.getInvestigatingAgency(),
            c.getStatus(),
            c.getPriority(),
            c.getClassification(),
            c.getCreatedBy() != null ? c.getCreatedBy().getUsername() : null,
            c.isLegalHold(),
            c.getLegalHoldReason(),
            assignmentItems,
            historyItems
        );
    }
}
