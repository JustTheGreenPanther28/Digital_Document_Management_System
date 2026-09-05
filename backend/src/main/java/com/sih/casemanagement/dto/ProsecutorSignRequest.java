package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotNull;

public record ProsecutorSignRequest(
    @NotNull Boolean approved,
    String notes
) {}
