package com.sih.casemanagement.security;

import org.springframework.stereotype.Service;

/**
 * TOTP Service - Removed. MFA/TOTP has been completely removed from the system.
 * This stub remains to prevent Spring wiring errors from any residual references.
 */
@Service
public class TotpService {

    public String generateSecretKey() {
        return "DISABLED";
    }

    public String getOtpAuthUrl(String username, String secretKey) {
        return "";
    }

    public boolean verifyCode(String secretKey, int code) {
        return false;
    }
}
