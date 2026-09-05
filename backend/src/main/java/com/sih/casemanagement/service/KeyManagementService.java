package com.sih.casemanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class KeyManagementService {

    private final SecretKey masterKey;
    private final String keyId;
    private final SecureRandom secureRandom = new SecureRandom();

    public KeyManagementService(
        @Value("${app.kms.master-key-base64:YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=}") String masterKeyBase64,
        @Value("${app.kms.key-id:kms-key-vault-primary}") String keyId
    ) {
        byte[] rawKey;
        try {
            rawKey = Base64.getDecoder().decode(masterKeyBase64);
        } catch (IllegalArgumentException e) {
            rawKey = masterKeyBase64.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }

        byte[] keyBytes;
        if (rawKey.length == 32) {
            keyBytes = rawKey;
        } else {
            try {
                java.security.MessageDigest sha256 = java.security.MessageDigest.getInstance("SHA-256");
                keyBytes = sha256.digest(rawKey);
            } catch (java.security.NoSuchAlgorithmException e) {
                throw new IllegalStateException("SHA-256 not available", e);
            }
        }
        this.masterKey = new SecretKeySpec(keyBytes, "AES");
        this.keyId = keyId;
    }

    public SecretKey getMasterKey() {
        return masterKey;
    }

    public String getKeyId() {
        return keyId;
    }

    public byte[] generateIv() {
        byte[] iv = new byte[12]; // 96-bit standard nonce for AES-GCM
        secureRandom.nextBytes(iv);
        return iv;
    }
}
