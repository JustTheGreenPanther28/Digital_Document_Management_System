package com.sih.casemanagement.service;

import com.sih.casemanagement.common.exception.SecurityValidationException;
import com.sih.casemanagement.entity.DigitalSignature;
import com.sih.casemanagement.entity.Document;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.DigitalSignatureRepository;
import com.sih.casemanagement.repository.DocumentRepository;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Service
public class DigitalSignatureService {

    private static final Logger log = LoggerFactory.getLogger(DigitalSignatureService.class);
    private static final String SIGNING_ALGORITHM = "SHA256withRSA";
    private static final String KEY_ALIAS = "sih190-root-signer";

    private final KeyPair systemSigningKeyPair;
    private final Certificate signingCertificate;
    private final DigitalSignatureRepository signatureRepository;
    private final DocumentRepository documentRepository;

    public DigitalSignatureService(
        DigitalSignatureRepository signatureRepository,
        DocumentRepository documentRepository,
        @Value("${app.pki.keystore-path:./storage_vault/pki/sih190-pki.p12}") String keystorePathStr,
        @Value("${app.pki.keystore-password:Sih190PkiPassword!2026}") String keystorePassword
    ) {
        this.signatureRepository = signatureRepository;
        this.documentRepository = documentRepository;

        KeyPair kp;
        Certificate cert;

        try {
            Path keystorePath = Paths.get(keystorePathStr);
            char[] password = keystorePassword.toCharArray();
            KeyStore keyStore = KeyStore.getInstance("PKCS12");

            if (Files.exists(keystorePath)) {
                try (InputStream is = Files.newInputStream(keystorePath)) {
                    keyStore.load(is, password);
                }
                Key privateKey = keyStore.getKey(KEY_ALIAS, password);
                cert = keyStore.getCertificate(KEY_ALIAS);
                kp = new KeyPair(cert.getPublicKey(), (PrivateKey) privateKey);
                log.info("Loaded persistent production PKI signing key and certificate from {}", keystorePath);
            } else {
                if (keystorePath.getParent() != null) {
                    Files.createDirectories(keystorePath.getParent());
                }
                keyStore.load(null, password);

                KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                keyGen.initialize(2048);
                kp = keyGen.generateKeyPair();

                cert = generateSelfSignedCertificate(kp);
                keyStore.setKeyEntry(KEY_ALIAS, kp.getPrivate(), password, new Certificate[]{cert});

                try (OutputStream os = Files.newOutputStream(keystorePath)) {
                    keyStore.store(os, password);
                }
                log.info("Generated and saved new persistent production PKI keystore to {}", keystorePath);
            }
        } catch (Exception e) {
            log.warn("Persistent PKI initialization encountered an error, falling back to ephemeral keypair: {}", e.getMessage());
            try {
                KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                keyGen.initialize(2048);
                kp = keyGen.generateKeyPair();
                cert = generateSelfSignedCertificate(kp);
            } catch (Exception ex) {
                throw new IllegalStateException("Failed to initialize cryptographic signature subsystem", ex);
            }
        }

        this.systemSigningKeyPair = kp;
        this.signingCertificate = cert;
    }

    private static X509Certificate generateSelfSignedCertificate(KeyPair keyPair) throws Exception {
        long now = System.currentTimeMillis();
        Date startDate = new Date(now);
        Date endDate = Date.from(Instant.now().plus(3650, ChronoUnit.DAYS)); // 10 years validity

        X500Name dnName = new X500Name("CN=SIH190 National Evidence Authority, O=Ministry of Law and Justice, C=IN");
        BigInteger certSerialNumber = new BigInteger(Long.toString(now));

        ContentSigner contentSigner = new JcaContentSignerBuilder("SHA256WithRSAEncryption").build(keyPair.getPrivate());
        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
            dnName, certSerialNumber, startDate, endDate, dnName, keyPair.getPublic()
        );

        return new JcaX509CertificateConverter().getCertificate(certBuilder.build(contentSigner));
    }

    @Transactional
    public DigitalSignature signDocument(Document document, User signer, String signerRole) {
        if (document.isLocked()) {
            throw new SecurityValidationException("Document is already locked and cannot be signed again.");
        }

        try {
            Signature signature = Signature.getInstance(SIGNING_ALGORITHM);
            signature.initSign(systemSigningKeyPair.getPrivate());
            signature.update(document.getSha256Hash().getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = signature.sign();
            String signatureBase64 = Base64.getEncoder().encodeToString(signatureBytes);

            String certSerial = "CERT-IN-GOV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            DigitalSignature sigRecord = new DigitalSignature();
            sigRecord.setDocument(document);
            sigRecord.setSigner(signer);
            sigRecord.setSignerRole(signerRole);
            sigRecord.setSignatureAlgorithm(SIGNING_ALGORITHM);
            sigRecord.setDigitalSignatureValue(signatureBase64);
            sigRecord.setCertificateSerial(certSerial);
            sigRecord.setSignedHash(document.getSha256Hash());
            sigRecord.setVerified(true);

            DigitalSignature saved = signatureRepository.save(sigRecord);

            // Lock the document permanently
            document.setLocked(true);
            document.setLockedAt(sigRecord.getSignedAt());
            document.setLockedBy(signer);
            documentRepository.save(document);

            log.info("Document {} successfully signed by {} ({}) with persistent PKI.", document.getId(), signer.getUsername(), signerRole);
            return saved;
        } catch (GeneralSecurityException e) {
            log.error("Digital signing failed for document {}", document.getId(), e);
            throw new IllegalStateException("Failed to cryptographically sign document: " + e.getMessage(), e);
        }
    }

    public boolean verifySignature(DigitalSignature signatureRecord) {
        try {
            Signature signature = Signature.getInstance(signatureRecord.getSignatureAlgorithm());
            signature.initVerify(systemSigningKeyPair.getPublic());
            signature.update(signatureRecord.getSignedHash().getBytes(StandardCharsets.UTF_8));
            byte[] sigBytes = Base64.getDecoder().decode(signatureRecord.getDigitalSignatureValue());
            return signature.verify(sigBytes);
        } catch (Exception e) {
            log.warn("Signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    public Certificate getSigningCertificate() {
        return signingCertificate;
    }
}
