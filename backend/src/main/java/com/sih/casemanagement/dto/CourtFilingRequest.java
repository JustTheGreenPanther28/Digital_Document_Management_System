package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record CourtFilingRequest(
    @NotBlank String courtName,
    @NotBlank String filingNumber
) {}
