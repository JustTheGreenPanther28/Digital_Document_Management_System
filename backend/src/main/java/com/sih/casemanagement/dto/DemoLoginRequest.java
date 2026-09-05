package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record DemoLoginRequest(
    @NotBlank(message = "Demo username is required")
    String username
) {}
