package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignTeamRequest(
    @NotNull UUID userId,
    @NotBlank String roleInCase
) {}
