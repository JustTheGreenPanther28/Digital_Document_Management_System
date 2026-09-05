package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MfaVerifyRequest(
    @NotBlank String preAuthToken,
    @NotNull Integer code
) {}
