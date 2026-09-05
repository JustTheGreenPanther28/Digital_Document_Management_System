package com.sih.casemanagement.dto;

import com.sih.casemanagement.common.enums.EvidenceType;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record RegisterEvidenceRequest(
    @NotBlank String title,
    String description,
    EvidenceType evidenceType,
    String seizureLocation,
    @NotBlank String sealNumber,
    @NotBlank String storageLocation,
    UUID custodianUserId
) {}
