package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(
    @NotBlank(message = "Username or email is required")
    String identifier
) {}
