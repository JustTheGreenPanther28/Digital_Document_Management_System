package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaVerifyRequest(
    @NotBlank String preAuthToken,
    Integer code,
    String totpCode,
    String emailOtp
) {
    public Integer getEffectiveTotpCode() {
        if (code != null) return code;
        if (totpCode != null && !totpCode.isBlank()) {
            try {
                return Integer.parseInt(totpCode.trim());
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
