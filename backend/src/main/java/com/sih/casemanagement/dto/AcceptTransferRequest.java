package com.sih.casemanagement.dto;

public record AcceptTransferRequest(
    String verifiedSealNumber,
    String acceptanceSignature
) {}
