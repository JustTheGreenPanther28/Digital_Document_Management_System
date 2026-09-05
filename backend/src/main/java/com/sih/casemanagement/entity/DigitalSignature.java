package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "digital_signatures")
public class DigitalSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signer_id", nullable = false)
    private User signer;

    @Column(name = "signer_role", nullable = false, length = 50)
    private String signerRole;

    @Column(name = "signature_algorithm", nullable = false, length = 50)
    private String signatureAlgorithm = "SHA256withRSA";

    @Column(name = "digital_signature_value", nullable = false, columnDefinition = "TEXT")
    private String digitalSignatureValue;

    @Column(name = "certificate_serial", nullable = false, length = 100)
    private String certificateSerial;

    @Column(name = "signed_hash", nullable = false, length = 64)
    private String signedHash;

    @Column(nullable = false)
    private boolean verified = true;

    @Column(name = "signed_at", nullable = false)
    private Instant signedAt = Instant.now();

    public DigitalSignature() {}

    public DigitalSignature(Document document, User signer, String signerRole, String signatureAlgorithm,
                            String digitalSignatureValue, String certificateSerial, String signedHash) {
        this.document = document;
        this.signer = signer;
        this.signerRole = signerRole;
        this.signatureAlgorithm = signatureAlgorithm;
        this.digitalSignatureValue = digitalSignatureValue;
        this.certificateSerial = certificateSerial;
        this.signedHash = signedHash;
        this.verified = true;
        this.signedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }

    public User getSigner() { return signer; }
    public void setSigner(User signer) { this.signer = signer; }

    public String getSignerRole() { return signerRole; }
    public void setSignerRole(String signerRole) { this.signerRole = signerRole; }

    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public void setSignatureAlgorithm(String signatureAlgorithm) { this.signatureAlgorithm = signatureAlgorithm; }

    public String getDigitalSignatureValue() { return digitalSignatureValue; }
    public void setDigitalSignatureValue(String digitalSignatureValue) { this.digitalSignatureValue = digitalSignatureValue; }

    public String getCertificateSerial() { return certificateSerial; }
    public void setCertificateSerial(String certificateSerial) { this.certificateSerial = certificateSerial; }

    public String getSignedHash() { return signedHash; }
    public void setSignedHash(String signedHash) { this.signedHash = signedHash; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }
}
