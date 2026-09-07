package com.sih.casemanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class KeyManagementService {

    private final Map<String, SecretKey> keyRing = new ConcurrentHashMap<>();
    private volatile String activeKeyId;
    private final SecureRandom secureRandom = new SecureRandom();

    public KeyManagementService(
        @Value("${app.kms.master-key-base64}") String masterKeyBase64,
        @Value("${app.kms.key-id:kms-key-vault-primary}") String keyId
    ) {
        SecretKey initialMasterKey = deriveSecretKey(masterKeyBase64);
        this.activeKeyId = keyId;
        this.keyRing.put(keyId, initialMasterKey);
    }

    private SecretKey deriveSecretKey(String keyString) {
        byte[] rawKey;
        try {
            rawKey = Base64.getDecoder().decode(keyString);
        } catch (IllegalArgumentException e) {
            rawKey = keyString.getBytes(java.nio.charset.StandardCharsets.UTF_8);
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
        return new SecretKeySpec(keyBytes, "AES");
    }

    public SecretKey getMasterKey() {
        return keyRing.get(activeKeyId);
    }

    public SecretKey getKeyById(String targetKeyId) {
        SecretKey key = keyRing.get(targetKeyId);
        return key != null ? key : getMasterKey();
    }

    public String getKeyId() {
        return activeKeyId;
    }

    public synchronized void rotateMasterKey(String newKeyBase64, String newKeyId) {
        SecretKey newKey = deriveSecretKey(newKeyBase64);
        this.keyRing.put(newKeyId, newKey);
        this.activeKeyId = newKeyId;
    }

    public SecretKey generateDataEncryptionKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance("AES");
            keyGen.init(256, secureRandom);
            return keyGen.generateKey();
        } catch (Exception e) {
            byte[] bytes = new byte[32];
            secureRandom.nextBytes(bytes);
            return new SecretKeySpec(bytes, "AES");
        }
    }

    public byte[] wrapDataKey(SecretKey dek, String kekId, byte[] iv) {
        try {
            SecretKey kek = getKeyById(kekId);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.WRAP_MODE, kek, new GCMParameterSpec(128, iv));
            return cipher.wrap(dek);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to wrap DEK with KEK: " + e.getMessage(), e);
        }
    }

    public SecretKey unwrapDataKey(byte[] wrappedDek, String kekId, byte[] iv) {
        try {
            SecretKey kek = getKeyById(kekId);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.UNWRAP_MODE, kek, new GCMParameterSpec(128, iv));
            return (SecretKey) cipher.unwrap(wrappedDek, "AES", Cipher.SECRET_KEY);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to unwrap DEK with KEK: " + e.getMessage(), e);
        }
    }

    public byte[] generateIv() {
        byte[] iv = new byte[12]; // 96-bit standard nonce for AES-GCM
        secureRandom.nextBytes(iv);
        return iv;
    }
}
