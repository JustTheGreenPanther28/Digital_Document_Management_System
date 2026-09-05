package com.sih.casemanagement.dto;

import com.sih.casemanagement.common.enums.CasePriority;
import com.sih.casemanagement.common.enums.DocumentClassification;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record CreateCaseRequest(
    @NotBlank(message = "Title is required") String title,
    String description,
    @NotBlank(message = "FIR Number is required") String firNumber,
    Instant incidentDate,
    String investigatingAgency,
    CasePriority priority,
    DocumentClassification classification
) {}
