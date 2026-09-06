package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for Step 3 of MFA: Email OTP verification.
 */
public record EmailOtpVerifyRequest(
    @NotBlank(message = "Pre-auth token is required")
    String preAuthToken,

    @NotBlank(message = "Email OTP code is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must contain only digits")
    String code
) {}
