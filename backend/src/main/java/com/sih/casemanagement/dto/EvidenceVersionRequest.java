package com.sih.casemanagement.dto;

import com.sih.casemanagement.common.enums.EvidenceStatus;
import com.sih.casemanagement.common.enums.EvidenceType;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record EvidenceVersionRequest(
    String title,
    String description,
    EvidenceType evidenceType,
    String sealNumber,
    Boolean sealIntact,
    String storageLocation,
    String seizureLocation,
    EvidenceStatus status,
    UUID custodianUserId,
    @NotBlank(message = "Change reason or amendment justification is required") String changeReason
) {}
