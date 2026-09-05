# Security Architecture & Cryptographic Controls

## SIH Problem 190 — Secure Digital Case Management, Document Management & Evidence Chain-of-Custody System

---

## 1. Zero-Trust Access Control (RBAC + ABAC + Clearance)

Traditional systems rely solely on Role-Based Access Control (RBAC). In law enforcement, this leads to catastrophic unauthorized surveillance (e.g. an investigator browsing sensitive cases handled by another precinct or investigating colleagues).

Our system implements a **Dual-Layered Access Model**:
1. **RBAC Layer**: Dictates coarse-grained functional permissions (e.g. only `SENIOR_OFFICER` can assign teams; only `COURT_OFFICER` can register judicial hearings).
2. **ABAC Layer**: Evaluates environmental, subject, and resource attributes dynamically per request:
   - **Subject**: User ID, assigned department, active case assignments.
   - **Resource**: Case ID, owning agency, required security clearance, legal hold status.
   - **Action**: `READ`, `UPLOAD_DOC`, `SIGN_DOC`, `UPDATE_STATUS`, `TRANSFER_CUSTODY`.

### Security Clearance Hierarchy:
Clearance access is mathematically enforced:

$$\text{Clearance}(User) \ge \text{Classification}(Resource)$$

```text
TOP_SECRET (Level 4)  ── Can access: TOP_SECRET, SECRET, CONFIDENTIAL, RESTRICTED, UNCLASSIFIED
SECRET     (Level 3)  ── Can access: SECRET, CONFIDENTIAL, RESTRICTED, UNCLASSIFIED
CONFIDENTIAL (Level 2)── Can access: CONFIDENTIAL, RESTRICTED, UNCLASSIFIED
RESTRICTED (Level 1)  ── Can access: RESTRICTED, UNCLASSIFIED
UNCLASSIFIED (Level 0)── Can access: UNCLASSIFIED
```

---

## 2. Cryptographic Envelope Encryption (AES-256-GCM)

All binary documents, forensic disk images, wiretap recordings, and witness statement PDFs are encrypted at rest using **NIST-approved AES-256-GCM envelope encryption**:

```text
Plaintext Artifact + DEK (Unique 256-bit Key) + 96-bit Random IV
                         │
                         ▼
        AES-256-GCM Encryption Algorithm
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
   Ciphertext                    128-bit Auth Tag
        │                                 │
        ▼                                 ▼
Stored in MinIO Vault             Database Metadata

Master Key (KEK) + DEK
       │
       ▼
AES-256 Key Wrap
       │
       ▼
Encrypted DEK stored in Database
```

### Advantages of GCM (Galois/Counter Mode):
- **Authenticated Encryption with Associated Data (AEAD)**: Combines confidentiality with cryptographic integrity. Any tampering with stored ciphertext immediately invalidates the 128-bit authentication tag during decryption, preventing chosen-ciphertext attacks.
- **Unique DEKs**: Even if a single Data Encryption Key were compromised, other evidence artifacts remain impenetrable.

---

## 3. Malware & Ingestion Defense Pipeline

### Apache Tika Magic Byte Analysis:
Attackers frequently disguise dangerous payloads (e.g. `.exe`, `.sh`, `.elf`, `.bat`) by renaming them to `.pdf` or `.docx`.
- The system uses `org.apache.tika.Tika` to inspect the raw header bytes:
  - Windows PE executables (`MZ` header $\rightarrow$ `application/x-msdownload`) are instantly dropped.
  - Linux ELF binaries (`\x7fELF`) are dropped.
  - Polyglot PDFs containing embedded executable streams are rejected.

### ClamAV Anti-Malware Streaming:
- Binary streams are sent over TCP socket directly to the ClamAV daemon (`INSTREAM` protocol).
- Rejects files containing known virus signatures, ransomware, and the EICAR test signature.
- If ClamAV daemon is unreachable in dev mode, a secure fallback scanner handles local validation.

---

## 4. Asymmetric Digital Signatures & Immutable Locking (RSA-2048)

To comply with **Section 65B of the Indian Evidence Act** and **ISO/IEC 27037**:
- When an investigator, forensic officer, or prosecutor certifies a document, the system computes the document's SHA-256 hash.
- The hash is digitally signed using an RSA-2048 private key with `SHA256withRSA` signature algorithm.
- The document's `locked` attribute is set to `true`.
- Any subsequent attempt to delete, overwrite, or update the document is rejected at the database and service layers.

---

## 5. Tamper-Evident Hash Chain Audit Engine

To protect against rogue system administrators or compromised database credentials, the audit log functions as a sequential cryptographically linked ledger:

$$\text{Block Hash}_n = \text{SHA-256}(\text{Index}_n \,\|\, \text{Action}_n \,\|\, \text{User}_n \,\|\, \text{IP}_n \,\|\, \text{TimestampMs}_n \,\|\, \text{Block Hash}_{n-1})$$

If an attacker executes an unauthorized SQL command (e.g. `UPDATE audit_logs SET action = 'READ' WHERE id = ...`), the altered row's hash changes. When the system performs continuous hash verification, every block following the modification fails validation, isolating the exact point of tampering.
