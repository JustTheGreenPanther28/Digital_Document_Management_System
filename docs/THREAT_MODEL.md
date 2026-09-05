# Threat Model & Risk Analysis (STRIDE)

## SIH Problem 190 — Secure Digital Case Management, Document Management & Evidence Chain-of-Custody System

---

## 1. STRIDE Threat Assessment Matrix

| Threat Category | Potential Attack Vector | System Defense & Cryptographic Countermeasure |
| :--- | :--- | :--- |
| **Spoofing** | Attacker steals investigator credentials or spoofs user session. | BCrypt work factor 12 password hashing; TOTP Multi-Factor Authentication; short-lived cryptographically signed stateless JWTs with HMAC-SHA256 signature verification. |
| **Tampering** | Rogue DBA or attacker modifies evidence metadata, alters audit records, or corrupts stored files. | Append-only deterministic SHA-256 hash-chained audit ledger; AES-256-GCM AEAD 128-bit authentication tags; pre-calculated SHA-256 binary fingerprints checked on download. |
| **Repudiation** | Custodian claims they never received physical evidence or signed a transfer. | Two-party digital custody transfer protocol: Transfer remains pending until receiving party explicitly verifies physical seal and counter-signs with their digital identity. |
| **Information Disclosure** | Unauthorized officer browses sensitive case documents or extracts unencrypted evidence binaries. | Attribute-Based Access Control (ABAC) denies unassigned investigators; security clearance hierarchy; AES-256-GCM envelope encryption at rest. |
| **Denial of Service** | Attacker floods upload endpoint with huge or compressed zip bombs, or floods login. | Apache Tika magic-byte detection rejects disguised executables; Spring Security rate limiting via Redis bucket token algorithm; 100MB body cap. |
| **Elevation of Privilege** | Investigator manipulates URL parameters to perform Senior Officer actions (e.g. status advancement, team reassignment). | Method-level authorization with `@PreAuthorize("hasRole(...)")`; case status finite-state machine enforcement; ABAC authorization interceptors. |

---

## 2. Specific Adversary Scenarios & Mitigations

### Scenario A: Disguised Executable Upload (Trojans / Backdoors)
- **Attack**: A hostile actor renames a Windows reverse-shell executable `payload.exe` to `crime_scene_photo.pdf` and uploads it as evidence.
- **Defense**: The upload pipeline does not trust file extensions. Apache Tika inspects the byte header (`MZ\x90\x00`). The MIME type `application/x-msdownload` fails the whitelist. The file is dropped immediately, ClamAV logs an alert, and an immutable audit log entry is committed.

### Scenario B: Rogue Database Administrator Tampering With Historical Logs
- **Attack**: A compromised DBA connects to PostgreSQL directly and modifies an audit log row to cover up unauthorized access:
  ```sql
  UPDATE audit_logs SET action = 'CASE_VIEW' WHERE username = 'rogue_officer';
  ```
- **Defense**: Because each log's hash incorporates the previous entry's hash ($\text{Hash}_n = \text{SHA-256}(\text{Log}_n + \text{Hash}_{n-1})$), modifying the row breaks the chain for all subsequent blocks. The auditor or automated audit job invokes `/api/v1/audit/ledger/verify`, immediately identifying the tamper point and timestamp.

### Scenario C: Evidence Substitution or Deletion During Litigation
- **Attack**: A corrupt insider attempts to delete or swap an incriminating document when a case goes to court.
- **Defense**:
  1. Once certified, documents are locked with RSA-2048 digital signatures.
  2. Imposing a **Legal Hold** places a hard programmatic veto on case closure, status regressions, or file expungement.
  3. The encrypted artifact in MinIO is verified against its initial plaintext SHA-256 fingerprint on every download. Any modified ciphertext fails GCM authentication tag verification.
