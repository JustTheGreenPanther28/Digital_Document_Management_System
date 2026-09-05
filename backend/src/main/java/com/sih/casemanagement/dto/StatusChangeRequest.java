package com.sih.casemanagement.dto;

import com.sih.casemanagement.common.enums.CaseStatus;
import jakarta.validation.constraints.NotNull;

public record StatusChangeRequest(
    @NotNull CaseStatus status,
    String reason
) {}
