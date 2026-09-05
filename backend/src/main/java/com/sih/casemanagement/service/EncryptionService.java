package com.sih.casemanagement.service;

import com.sih.casemanagement.common.exception.TamperException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.GeneralSecurityException;

@Service
public class EncryptionService {

    private static final Logger log = LoggerFactory.getLogger(EncryptionService.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128; // 128-bit authentication tag

    private final KeyManagementService kms;

    public EncryptionService(KeyManagementService kms) {
        this.kms = kms;
    }

    public byte[] encrypt(byte[] plaintext, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, kms.getMasterKey(), spec);
            return cipher.doFinal(plaintext);
        } catch (GeneralSecurityException e) {
            log.error("Failed to encrypt data with AES-256-GCM", e);
            throw new IllegalStateException("Encryption failure: " + e.getMessage(), e);
        }
    }

    public byte[] decrypt(byte[] ciphertext, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, kms.getMasterKey(), spec);
            return cipher.doFinal(ciphertext);
        } catch (GeneralSecurityException e) {
            log.error("Failed to decrypt ciphertext: Authentication tag mismatch or corrupted ciphertext", e);
            throw new TamperException("Decryption authentication tag verification failed. Ciphertext may have been tampered with.");
        }
    }
}
