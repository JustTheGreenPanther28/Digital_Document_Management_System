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
        byte[] decodedKey = Base64.getDecoder().decode(masterKeyBase64);
        if (decodedKey.length != 32) {
            // Ensure 256-bit key
            byte[] padded = new byte[32];
            System.arraycopy(decodedKey, 0, padded, 0, Math.min(decodedKey.length, 32));
            decodedKey = padded;
        }
        this.masterKey = new SecretKeySpec(decodedKey, "AES");
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
