package com.sih.casemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TransferRequestDto(
    @NotNull UUID recipientId,
    String sealNumber,
    @NotBlank String reason
) {}
