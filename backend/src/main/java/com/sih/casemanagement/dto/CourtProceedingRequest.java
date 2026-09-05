package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CourtProceedingRequest(
    @NotNull Instant hearingDate,
    @NotBlank String judgeName,
    @NotBlank String proceedingsSummary,
    Instant nextHearingDate
) {}
