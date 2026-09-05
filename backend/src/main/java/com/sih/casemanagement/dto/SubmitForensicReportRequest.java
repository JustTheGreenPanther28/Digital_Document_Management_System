package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SubmitForensicReportRequest(
    @NotNull UUID evidenceId,
    UUID documentId,
    String laboratoryName,
    String toolsUtilized,
    @NotBlank String examinationSummary,
    @NotBlank String findings
) {}
