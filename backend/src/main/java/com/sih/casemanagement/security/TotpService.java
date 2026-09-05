package com.sih.casemanagement.security;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public String generateSecretKey() {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    public String getOtpAuthUrl(String username, String secretKey) {
        GoogleAuthenticatorKey key = new GoogleAuthenticatorKey.Builder(secretKey).build();
        return GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL("SIH190-CaseManagement", username, key);
    }

    public boolean verifyCode(String secretKey, int code) {
        if (secretKey == null || secretKey.isBlank()) {
            return false;
        }
        return gAuth.authorize(secretKey, code);
    }
}
