package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record OAuthLoginRequest(
    @NotBlank String provider,
    String idToken,
    String code,
    String email,
    String name
) {}