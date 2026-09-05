package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record JudgmentRequest(
    @NotBlank String verdict,
    @NotBlank String summary,
    @NotNull Instant judgmentDate,
    @NotBlank String judgeName,
    UUID judgmentDocId
) {}
