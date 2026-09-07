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
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DigitalSignatureService {

    private static final Logger log = LoggerFactory.getLogger(DigitalSignatureService.class);
    private static final String SIGNING_ALGORITHM = "SHA256withRSA";
    private static final String SYSTEM_KEY_ALIAS = "sih190-root-signer";

    private final KeyPair systemSigningKeyPair;
    private final Certificate signingCertificate;
    private final DigitalSignatureRepository signatureRepository;
    private final DocumentRepository documentRepository;
    private final Path officerKeystoreDir;
    private final String keystorePassword;
    private final ConcurrentHashMap<String, OfficerPki> officerKeyCache = new ConcurrentHashMap<>();

    public static class OfficerPki {
        private final KeyPair keyPair;
        private final X509Certificate certificate;

        public OfficerPki(KeyPair keyPair, X509Certificate certificate) {
            this.keyPair = keyPair;
            this.certificate = certificate;
        }

        public KeyPair getKeyPair() { return keyPair; }
        public X509Certificate getCertificate() { return certificate; }
    }

    public DigitalSignatureService(
        DigitalSignatureRepository signatureRepository,
        DocumentRepository documentRepository,
        @Value("${app.pki.keystore-path:./storage_vault/pki/sih190-pki.p12}") String keystorePathStr,
        @Value("${app.pki.keystore-password}") String keystorePassword
    ) {
        this.signatureRepository = signatureRepository;
        this.documentRepository = documentRepository;
        this.keystorePassword = keystorePassword;

        Path rootKeystorePath = Paths.get(keystorePathStr);
        Path pkiBaseDir = rootKeystorePath.getParent() != null ? rootKeystorePath.getParent() : Paths.get("./storage_vault/pki");
        this.officerKeystoreDir = pkiBaseDir.resolve("officers");

        try {
            Files.createDirectories(officerKeystoreDir);
        } catch (Exception e) {
            log.warn("Could not create officer PKI directory: {}", e.getMessage());
        }

        KeyPair kp;
        Certificate cert;

        try {
            char[] password = keystorePassword.toCharArray();
            KeyStore keyStore = KeyStore.getInstance("PKCS12");

            if (Files.exists(rootKeystorePath)) {
                try (InputStream is = Files.newInputStream(rootKeystorePath)) {
                    keyStore.load(is, password);
                }
                Key privateKey = keyStore.getKey(SYSTEM_KEY_ALIAS, password);
                cert = keyStore.getCertificate(SYSTEM_KEY_ALIAS);
                kp = new KeyPair(cert.getPublicKey(), (PrivateKey) privateKey);
                log.info("Loaded persistent root PKI signing key and certificate from {}", rootKeystorePath);
            } else {
                if (rootKeystorePath.getParent() != null) {
                    Files.createDirectories(rootKeystorePath.getParent());
                }
                keyStore.load(null, password);

                KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                keyGen.initialize(2048);
                kp = keyGen.generateKeyPair();

                cert = generateCertificate(kp, "CN=SIH190 National Evidence Authority, O=Ministry of Law and Justice, C=IN");
                keyStore.setKeyEntry(SYSTEM_KEY_ALIAS, kp.getPrivate(), password, new Certificate[]{cert});

                try (OutputStream os = Files.newOutputStream(rootKeystorePath)) {
                    keyStore.store(os, password);
                }
                log.info("Generated and saved new persistent root PKI keystore to {}", rootKeystorePath);
            }
        } catch (Exception e) {
            log.warn("Persistent PKI initialization encountered an error, falling back to ephemeral keypair: {}", e.getMessage());
            try {
                KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                keyGen.initialize(2048);
                kp = keyGen.generateKeyPair();
                cert = generateCertificate(kp, "CN=SIH190 Ephemeral Signer, O=Ministry of Law and Justice, C=IN");
            } catch (Exception ex) {
                throw new IllegalStateException("Failed to initialize cryptographic signature subsystem", ex);
            }
        }

        this.systemSigningKeyPair = kp;
        this.signingCertificate = cert;
    }

    public OfficerPki getOrCreateOfficerKeyPair(User officer, String role) {
        String username = officer != null && officer.getUsername() != null ? officer.getUsername() : "system_officer";
        return officerKeyCache.computeIfAbsent(username, u -> {
            try {
                Path officerKeystorePath = officerKeystoreDir.resolve(username + ".p12");
                char[] password = keystorePassword.toCharArray();
                KeyStore keyStore = KeyStore.getInstance("PKCS12");
                String alias = "officer-" + username;

                if (Files.exists(officerKeystorePath)) {
                    try (InputStream is = Files.newInputStream(officerKeystorePath)) {
                        keyStore.load(is, password);
                    }
                    Key privateKey = keyStore.getKey(alias, password);
                    Certificate cert = keyStore.getCertificate(alias);
                    if (privateKey != null && cert instanceof X509Certificate) {
                        log.info("Loaded dedicated PKI keypair & X.509 certificate for officer @{}", username);
                        return new OfficerPki(new KeyPair(cert.getPublicKey(), (PrivateKey) privateKey), (X509Certificate) cert);
                    }
                }

                // Generate dedicated 2048-bit RSA keypair for this officer
                KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
                keyGen.initialize(2048);
                KeyPair kp = keyGen.generateKeyPair();

                String fullName = (officer != null && officer.getFullName() != null && !officer.getFullName().isBlank())
                    ? officer.getFullName() : username;
                String department = (officer != null && officer.getDepartment() != null && !officer.getDepartment().isBlank())
                    ? officer.getDepartment() : "National Digital Investigation Directorate";
                String effectiveRole = (role != null && !role.isBlank()) ? role : "AUTHORIZED_OFFICER";

                String dnString = String.format("CN=%s, UID=%s, OU=%s, O=National Digital Evidence Authority, C=IN, T=%s",
                    fullName.replace(",", " "), username, department.replace(",", " "), effectiveRole);

                X509Certificate cert = generateCertificate(kp, dnString);

                keyStore.load(null, password);
                keyStore.setKeyEntry(alias, kp.getPrivate(), password, new Certificate[]{cert});

                try (OutputStream os = Files.newOutputStream(officerKeystorePath)) {
                    keyStore.store(os, password);
                }
                log.info("Provisioned dedicated PKI keypair and X.509 certificate for @{} ({}) [{}]", username, fullName, effectiveRole);
                return new OfficerPki(kp, cert);
            } catch (Exception e) {
                log.error("Failed to generate/load dedicated officer PKI for @{}, falling back to system key: {}", username, e.getMessage());
                return new OfficerPki(systemSigningKeyPair, (X509Certificate) signingCertificate);
            }
        });
    }

    private static X509Certificate generateCertificate(KeyPair keyPair, String dnString) throws Exception {
        long now = System.currentTimeMillis();
        Date startDate = new Date(now - 60000);
        Date endDate = Date.from(Instant.now().plus(3650, ChronoUnit.DAYS)); // 10 years validity

        X500Name dnName = new X500Name(dnString);
        BigInteger certSerialNumber = new BigInteger(Long.toString(now) + String.format("%04d", (int)(Math.random() * 10000)));

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
            // Retrieve officer-specific cryptographic private key and certificate
            OfficerPki officerPki = getOrCreateOfficerKeyPair(signer, signerRole);

            Signature signature = Signature.getInstance(SIGNING_ALGORITHM);
            signature.initSign(officerPki.getKeyPair().getPrivate());
            signature.update(document.getSha256Hash().getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = signature.sign();
            String signatureBase64 = Base64.getEncoder().encodeToString(signatureBytes);

            String certSerial = "CERT-IN-GOV-" + officerPki.getCertificate().getSerialNumber().toString(16).toUpperCase();
            String certDn = officerPki.getCertificate().getSubjectX500Principal().getName();

            DigitalSignature sigRecord = new DigitalSignature();
            sigRecord.setDocument(document);
            sigRecord.setSigner(signer);
            sigRecord.setSignerRole(signerRole);
            sigRecord.setSignatureAlgorithm(SIGNING_ALGORITHM);
            sigRecord.setDigitalSignatureValue(signatureBase64);
            sigRecord.setCertificateSerial(certSerial);
            sigRecord.setCertificateDn(certDn);
            sigRecord.setSignedHash(document.getSha256Hash());
            sigRecord.setVerified(true);

            DigitalSignature saved = signatureRepository.save(sigRecord);

            // Lock the document permanently
            document.setLocked(true);
            document.setLockedAt(sigRecord.getSignedAt());
            document.setLockedBy(signer);
            documentRepository.save(document);

            log.info("Document {} successfully co-signed by {} ({}) with dedicated PKI Certificate [DN: {}, Serial: {}]",
                document.getId(), signer.getUsername(), signerRole, certDn, certSerial);
            return saved;
        } catch (GeneralSecurityException e) {
            log.error("Digital signing failed for document {}", document.getId(), e);
            throw new IllegalStateException("Failed to cryptographically sign document: " + e.getMessage(), e);
        }
    }

    public boolean verifySignature(DigitalSignature signatureRecord) {
        try {
            Signature signature = Signature.getInstance(signatureRecord.getSignatureAlgorithm());

            PublicKey verifyKey = null;
            if (signatureRecord.getSigner() != null) {
                OfficerPki officerPki = getOrCreateOfficerKeyPair(signatureRecord.getSigner(), signatureRecord.getSignerRole());
                verifyKey = officerPki.getKeyPair().getPublic();
            }

            if (verifyKey == null) {
                verifyKey = systemSigningKeyPair.getPublic();
            }

            signature.initVerify(verifyKey);
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

