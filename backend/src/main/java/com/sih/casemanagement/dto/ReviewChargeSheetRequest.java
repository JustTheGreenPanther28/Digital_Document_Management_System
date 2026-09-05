package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotNull;

public record ReviewChargeSheetRequest(
    @NotNull Boolean approved,
    String notes
) {}
