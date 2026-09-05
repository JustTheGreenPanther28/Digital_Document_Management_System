package com.sih.casemanagement.dto;

import java.util.List;
import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    boolean mfaRequired,
    String preAuthToken,
    UUID userId,
    String username,
    String email,
    String fullName,
    String clearance,
    List<String> roles
) {
    public static AuthResponse mfaChallenge(String preAuthToken) {
        return new AuthResponse(null, null, true, preAuthToken, null, null, null, null, null, null);
    }

    public static AuthResponse authenticated(
        String accessToken,
        String refreshToken,
        UUID userId,
        String username,
        String email,
        String fullName,
        String clearance,
        List<String> roles
    ) {
        return new AuthResponse(accessToken, refreshToken, false, null, userId, username, email, fullName, clearance, roles);
    }
}
