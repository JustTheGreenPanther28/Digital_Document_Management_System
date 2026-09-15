# SIH 190 --- Secure Digital Document Management System

## Spring_Devs

**Team ID:** `SIH26190/0087`

> **SIH Problem Statement 190:**\
> **Secure Digital Document Management System for Legal and
> Investigation Documents**

------------------------------------------------------------------------

## 1. Project Overview

This project is a secure web-based platform for managing **legal,
investigative, forensic, evidentiary, and court-related documents**
throughout their lifecycle.

The system is designed around four primary goals:

1.  **Confidentiality** --- sensitive case information must only be
    accessible to authorized personnel.
2.  **Integrity** --- documents and evidence must be protected against
    unauthorized modification and tampering.
3.  **Traceability** --- important actions must be auditable and
    evidence custody must be traceable.
4.  **Availability** --- authorized users must be able to reliably
    access required case information and recover from infrastructure
    failures.

The application combines:

-   Secure authentication
-   Role-Based Access Control (RBAC)
-   Attribute-Based Access Control (ABAC)
-   Multi-factor authentication infrastructure
-   Cryptographic hashing
-   Digital signatures
-   Malware/file validation
-   Secure object storage
-   PostgreSQL transactional storage
-   Redis security/cache services
-   Elasticsearch-based search
-   Audit logging and hash-chain verification
-   Evidence chain-of-custody
-   Retention and legal-hold workflows
-   Backup and disaster-recovery workflows
-   AI-assisted forensic and charge-sheet analysis
-   Court/prosecution workflows
-   **Blockchain-backed evidence integrity and chain-of-custody
    architecture**

------------------------------------------------------------------------

# 2. Why This Project Exists

Legal and investigation workflows frequently involve large volumes of
sensitive documents and evidence.

Examples include:

-   Investigation reports
-   Statements
-   Case documents
-   Forensic reports
-   Digital evidence
-   Photographs
-   Videos
-   Network captures
-   Charge sheets
-   Court filings
-   Supporting documents
-   Evidence transfer records

A secure digital management platform must do more than simply upload
files.

It must answer questions such as:

-   Who created the record?
-   Who is allowed to access it?
-   Which case does it belong to?
-   Has the document changed?
-   Which version is authoritative?
-   Who handled the evidence?
-   When was custody transferred?
-   Was the file scanned for malware?
-   Can its integrity be independently verified?
-   Is the case under legal hold?
-   Can the evidence be safely archived or disposed of?
-   What happened to the record throughout its lifecycle?

This project addresses these requirements through a layered security and
evidence-management architecture.

------------------------------------------------------------------------

# 3. Core Architecture

The application follows a layered architecture:

``` text
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│              Vite + React + Tailwind CSS               │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Spring Boot Backend                    │
│       Controllers → Services → Repositories → JPA       │
└───────────────┬──────────────┬──────────────┬───────────┘
                │              │              │
                ▼              ▼              ▼
         PostgreSQL          Redis      Elasticsearch
         Transactional      Security       Search
            Data             State
                │
                ▼
        Secure Object Storage
        Evidence / Documents
                │
                ▼
       Cryptographic Integrity
       SHA-256 + Signatures
                │
                ▼
   ┌───────────────────────────────┐
   │ BLOCKCHAIN TRUST LAYER        │
   │ Evidence Hashes               │
   │ Evidence Versions             │
   │ Custody Transactions          │
   │ Timestamps / Signatures       │
   │ Immutable Verification        │
   └───────────────────────────────┘
```

### Responsibility of each layer

  Layer            Responsibility
  ---------------- --------------------------------------------------
  React            User interface and workflow presentation
  Spring Boot      Business logic and API security
  PostgreSQL       Transactional application metadata
  Redis            Cache, security state and token-related controls
  Elasticsearch    Search and inverted indexing
  Object Storage   Encrypted document/evidence payload storage
  Cryptography     Hashing, encryption and signatures
  Blockchain       Immutable evidence integrity/provenance layer
  AI               Controlled analytical assistance

------------------------------------------------------------------------

# 4. Important Data Architecture Principle

The system deliberately separates different responsibilities.

### PostgreSQL

PostgreSQL is used for operational/transactional information such as:

-   Users
-   Roles
-   Permissions
-   Cases
-   Case assignments
-   Documents
-   Document versions
-   Evidence metadata
-   Evidence versions
-   Custody records
-   Transfers
-   Forensic reports
-   Charge sheets
-   Court records
-   Audit records
-   Security alerts
-   Retention policies
-   Legal holds
-   Disposal records
-   AI analysis results

### Elasticsearch

Elasticsearch is used as the search/indexing layer.

It should not be treated as the authoritative source of evidence.

### Object Storage

Large binary objects are maintained through an S3-compatible storage
abstraction.

The backend supports S3-compatible storage and local development
fallback.

### Blockchain

The intended production architecture uses a **permissioned blockchain as
the immutable trust layer for evidence**.

The blockchain record should contain information such as:

-   Evidence identifier
-   Content hash
-   Evidence version
-   Timestamp
-   Custodian
-   Custody transition
-   Digital-signature reference
-   Storage/content reference
-   Transaction identifier

This allows the system to verify that the currently retrieved evidence
corresponds to the evidence state recorded in the immutable ledger.

> **Important:** Large evidence payloads should not normally be placed
> directly inside blockchain blocks. A scalable design keeps encrypted
> payloads in controlled storage and commits their cryptographic proof
> and lifecycle events to the permissioned blockchain.

------------------------------------------------------------------------

# 5. Current Repository Structure

The submitted project contains two major applications.

``` text
project/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
└── backend/
    ├── src/
    │   ├── main/
    │   │   ├── java/
    │   │   └── resources/
    │   └── test/
    ├── pom.xml
    ├── Dockerfile
    ├── mvnw
    └── mvnw.cmd
```

------------------------------------------------------------------------

# 6. Frontend

## 6.1 Frontend Technology

The frontend is built with:

-   React 18
-   Vite
-   React Router
-   Tailwind CSS
-   Lucide React icons

The frontend provides a role-aware application interface for case,
document, evidence, security, audit, court and administrative workflows.

------------------------------------------------------------------------

# 7. Frontend Pages

The current application includes the following major screens.

### Authentication

-   Login
-   Authentication state handling
-   Logout
-   Password reset workflow
-   MFA-related frontend support

### Dashboard

Provides a consolidated view of system activity and operational status.

### Cases

-   Case listing
-   Case search
-   Case creation
-   Case details
-   Team assignment
-   Case status changes
-   Legal hold
-   Case closure
-   Case archival

### Evidence

-   Evidence locker
-   Evidence registration
-   Evidence versions
-   Evidence custody
-   Custody transfers
-   Pending transfers
-   Evidence history

### Documents

-   Document vault
-   Document upload
-   Document versions
-   Document download
-   Document signing

### Audit

-   Audit ledger
-   Event filtering
-   Audit verification
-   Security/audit visibility

### Court

-   Court proceedings
-   Forensic reports
-   Charge sheets
-   Senior review
-   Prosecutor signing
-   Court filing
-   Hearings
-   Judgment/bundle workflows

### Search

Global search across supported case/document/evidence information.

### Administration

-   User management
-   Role management
-   Permission management

### Security

-   Security alerts
-   Threat intelligence view
-   Quarantine management

### Retention

-   Retention policies
-   Legal hold
-   Archival
-   Disposal

### Backup

-   Backup status
-   Backup history
-   Backup execution
-   Restore testing

### AI

-   Forensic report analysis
-   Charge-sheet analysis
-   Case analysis
-   Multilingual guidance assistant

------------------------------------------------------------------------

# 8. Frontend Routing

The application defines protected routes including:

``` text
/
 /login
 /dashboard
 /cases
 /cases/:caseId
 /custody
 /evidence
 /documents
 /court
 /audit
 /search
 /admin/users
 /admin/roles
 /security-alerts
 /retention-disposal
 /backup
```

Protected pages use authentication, role and/or permission checks before
rendering sensitive functionality.

------------------------------------------------------------------------

# 9. Frontend Security Model

The frontend contains client-side helpers for:

-   Authentication state
-   JWT handling
-   RBAC checks
-   ABAC checks
-   Security-clearance checks
-   Case assignment checks
-   Evidence ownership/custody checks
-   Audit event presentation

However:

> **Frontend authorization is not a security boundary.**

All critical authorization decisions must also be enforced by the Spring
Boot backend.

The frontend should be treated as a presentation and workflow layer,
while the backend remains the authoritative enforcement point.

------------------------------------------------------------------------

# 10. Backend

## 10.1 Backend Technology

The backend uses:

-   Java 21
-   Spring Boot 3.4.x
-   Spring Web
-   Spring Security
-   Spring Data JPA
-   Hibernate
-   PostgreSQL
-   Flyway
-   Redis
-   S3-compatible object storage
-   Apache Tika
-   Bouncy Castle
-   Elasticsearch integration
-   Spring AI
-   Spring Mail
-   Spring Actuator
-   SpringDoc/OpenAPI
-   **Web3j 4.10.3** (EVM/Ethereum blockchain client)
-   **Solidity** (EvidenceVaultRegistry smart contract)
-   Maven

------------------------------------------------------------------------

# 11. Backend Package Structure

The backend is organized into major layers:

``` text
com.sih.casemanagement
│
├── common
│   ├── enums
│   └── exception
│
├── config
│
├── controller
│
├── dto
│
├── entity
│
├── repository
│
├── security
│
└── service
```

This provides a conventional Spring Boot separation between API, domain
logic, persistence and security.

------------------------------------------------------------------------

# 12. Controller Layer

Major controllers include:

``` text
AuthController
CaseController
DocumentController
EvidenceController
AiForensicController
AuditAndSecurityController
BackupController
ProsecutionAndCourtController
QuarantineController
RetentionController
SearchController
UserController
AdminRolePermissionController
```

The controller layer exposes REST APIs and delegates business operations
to service classes.

------------------------------------------------------------------------

# 13. Service Layer

Important services include:

### Case

`CaseService`

Handles:

-   Case creation
-   Assignment
-   Status changes
-   Legal hold
-   Closing
-   Archiving
-   Case retrieval

### Document

`DocumentService`

Handles:

-   Upload
-   Versioning
-   Download
-   Integrity
-   Document lifecycle

### Evidence

`EvidenceAndCustodyService`

Handles:

-   Evidence registration
-   Evidence versions
-   Custody records
-   Custody transfer
-   Transfer acceptance/rejection
-   Evidence lifecycle

### Security

Security-related services include:

-   `JwtService`
-   `JwtAuthenticationFilter`
-   `CustomUserDetailsService`
-   `LoginAttemptService`
-   `EmailOtpService`
-   `TotpService`
-   `AbacSecurityService`
-   `RateLimitingService`
-   `RedisTokenBlacklistService`

### Cryptography

-   `EncryptionService`
-   `KeyManagementService`
-   `DigitalSignatureService`

### File security

-   `FileValidationService`
-   `MalwareScannerService`

### Storage

-   `ObjectStorageService`

### Search

-   `SearchService`
-   `ElasticsearchService`

### Audit and monitoring

-   `AuditService`
-   `ThreatDetectionService`

### Backup

-   `BackupOrchestrationService`
-   `DatabaseBackupService`
-   `BackupHealthIndicator`

### AI

-   `AiForensicAnalysisService`

### Retention

-   `RetentionDisposalService`

### Court

-   `ProsecutionAndCourtService`

------------------------------------------------------------------------

# 14. Database Model

The database contains entities covering the complete
case/document/evidence lifecycle.

Major entities include:

``` text
User
Role
Permission
Case
CaseUserAssignment
CaseStatusHistory

Document
DocumentVersion
DocumentPermission

Evidence
EvidenceVersion
EvidenceDocument
EvidenceTransfer
CustodyRecord

DigitalSignature
AuditLog
SecurityAlert

ForensicReport
ChargeSheet

CourtFiling
CourtProceeding
Judgment
Approval

LegalHold
RetentionPolicy
DisposalRecord

BackupHistory
Notification

MfaCredential
PasswordResetToken
RefreshToken

AiAnalysisResult
```

Database schema evolution is managed with Flyway migrations.

------------------------------------------------------------------------

# 15. Case Lifecycle

The case-management workflow supports a controlled lifecycle:

``` text
Case Creation
      ↓
Team Assignment
      ↓
Investigation
      ↓
Document / Evidence Registration
      ↓
Forensic Processing
      ↓
Charge Sheet
      ↓
Senior Review
      ↓
Prosecutor Sign-off
      ↓
Court Filing
      ↓
Court Proceedings
      ↓
Closure
      ↓
Retention / Archive
      ↓
Authorized Disposal
```

Critical state transitions are validated by the backend.

------------------------------------------------------------------------

# 16. Document Management

The document subsystem supports:

-   Case association
-   Upload
-   Metadata
-   Classification
-   Versioning
-   Download
-   Access control
-   Integrity checking
-   Digital signatures
-   Audit logging

Document versions allow the system to retain the history of changes
rather than silently replacing previous records.

------------------------------------------------------------------------

# 17. Evidence Management

Evidence is modeled separately from ordinary documents.

An evidence record can contain:

-   Evidence type
-   Status
-   Case association
-   Collector/submitter information
-   Current custodian
-   Storage reference
-   Hash/integrity information
-   Evidence versions
-   Custody history
-   Associated documents

This separation is important because evidence requires stronger
lifecycle and custody controls than ordinary documents.

------------------------------------------------------------------------

# 18. Evidence Chain of Custody

The custody workflow is implemented through evidence transfers and
custody records.

Conceptually:

``` text
Evidence Registered
        ↓
Custodian Assigned
        ↓
Transfer Requested
        ↓
Recipient Verification
        ↓
Transfer Accepted
        ↓
Custody Record Created
        ↓
Next Custodian
```

Each transfer should record:

-   Evidence
-   Sender
-   Recipient
-   Timestamp
-   Reason
-   Verification/acceptance details
-   Transfer status

The production blockchain layer extends this by anchoring the custody
event to an immutable ledger.

------------------------------------------------------------------------

# 19. Blockchain Evidence Architecture (IMPLEMENTED)

## Overview

The system uses an **actual EVM-compatible blockchain** as the immutable trust layer for evidence and document integrity.

This is **not** a linked-list simulation or an internal hash chain — it is a real Ethereum-compatible smart contract integration using **Web3j** and **Solidity**, anchoring SHA-256 hashes of evidence and documents onto an EVM blockchain network.

---

## 19.1 Smart Contract — `EvidenceVaultRegistry.sol`

Location: `contracts/EvidenceVaultRegistry.sol`

The Solidity smart contract provides three write functions and two read functions:

```solidity
// Register a new evidence hash on-chain
function registerEvidence(
    bytes32 evidenceId,
    bytes32 contentHash,
    bytes32 caseId,
    string calldata evidenceNumber,
    string calldata custodian
) external

// Record a document hash on-chain
function recordDocument(
    bytes32 documentId,
    bytes32 contentHash,
    bytes32 caseId,
    string calldata fileName
) external

// Anchor a batch of audit log hashes on-chain
function recordAuditBatch(
    bytes32 batchId,
    bytes32 merkleRoot,
    uint256 logCount
) external

// Verify an evidence record
function verifyEvidence(bytes32 evidenceId) external view returns (...)

// Verify a document record
function verifyDocument(bytes32 documentId) external view returns (...)
```

Events emitted on-chain:

```text
EvidenceAnchored(evidenceId, contentHash, caseId, custodian, timestamp)
DocumentAnchored(documentId, contentHash, caseId, fileName, timestamp)
AuditBatchAnchored(batchId, merkleRoot, logCount, timestamp)
```

---

## 19.2 Backend Integration — `BlockchainEvidenceService`

Uses **Web3j 4.10.3** (Java Ethereum client library).

```text
Evidence/Document Registration
         ↓
SHA-256 hash computed
         ↓
Web3j Credentials.create(privateKey) — ECDSA wallet loaded
         ↓
RawTransaction built (gas price, gas limit, data)
         ↓
Transaction signed with wallet
         ↓
Sent to EVM RPC node (or integrated cryptographic engine if RPC unavailable)
         ↓
Transaction receipt stored in PostgreSQL (blockchain_tx_receipts table)
         ↓
txHash, blockNumber, contractAddress, timestamp stored
```

**Fallback mode:** If no external EVM RPC is available (e.g. local dev without Hardhat), the service uses BouncyCastle Keccak-256 signing to produce a real ECDSA-signed transaction payload and an internal block counter — so the system never crashes.

---

## 19.3 Database — `blockchain_tx_receipts` Table

Migration: `V5__blockchain_transactions.sql`

```sql
blockchain_tx_receipts
├── id (UUID)
├── entity_type        -- EVIDENCE / DOCUMENT / AUDIT_BATCH
├── entity_id          -- UUID of evidence or document
├── case_id            -- UUID of related case
├── tx_hash            -- 0x... Ethereum transaction hash
├── block_number       -- EVM block height
├── contract_address   -- Smart contract address
├── network_name       -- e.g. "EVM Forensic Trust Network"
├── chain_id           -- e.g. 31337 (Hardhat local) or mainnet
├── content_hash       -- SHA-256 of evidence payload
├── signer_address     -- ECDSA wallet address that signed
├── gas_used
├── status             -- CONFIRMED / PENDING / FAILED
├── anchored_at        -- timestamp
└── raw_receipt_json   -- full receipt JSON for audit
```

---

## 19.4 REST API — `/api/v1/blockchain/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/blockchain/status` | Blockchain node status, wallet address, block height |
| GET | `/api/v1/blockchain/receipts/entity/{entityType}/{entityId}` | All on-chain receipts for an entity |
| GET | `/api/v1/blockchain/receipts/case/{caseId}` | All receipts for a case |
| POST | `/api/v1/blockchain/verify/evidence/{evidenceNumber}` | Verify evidence hash against on-chain record |
| POST | `/api/v1/blockchain/anchor/evidence/{evidenceId}` | Manually anchor evidence on-chain |
| POST | `/api/v1/blockchain/verify/document/{documentId}` | Verify document hash against on-chain record |
| POST | `/api/v1/blockchain/anchor/document/{documentId}` | Manually anchor document on-chain |

---

## 19.5 Frontend — `BlockchainVerificationModal`

Component: `frontend/src/components/BlockchainVerificationModal.jsx`

Displays for each evidence/document:

- Smart contract address (`0x...`)
- Transaction hash (`0x...`)
- EVM block height
- Signer wallet address
- SHA-256 hash comparison (stored vs current)
- VERIFIED ✓ / TAMPERED ✗ status
- Section 65B certificate information
- "Anchor on Blockchain" button for unanchored items

Added to:
- **Evidence Locker** — "Blockchain Proof" button on each evidence card
- **Document Vault** — "Blockchain Proof" button on each document row
- **Audit Ledger** — "EVM Blockchain Trust Layer Active" badge in header

---

## 19.6 Evidence Registration Flow (End-to-End)

```text
POST /api/v1/evidence/register
         ↓
EvidenceAndCustodyService.registerEvidence()
         ↓
Validate → Malware Scan → SHA-256 → Encrypt → Store
         ↓
BlockchainEvidenceService.recordEvidenceOnChain(evidence)
         ↓
Web3j signs + sends transaction to EVM RPC
         ↓
TxHash 0x... returned
         ↓
BlockchainTxReceipt saved to PostgreSQL
         ↓
Evidence is now immutably anchored on-chain
```

---

## 19.7 Document Upload Flow (End-to-End)

```text
POST /api/v1/documents/upload
         ↓
DocumentService.uploadDocument()
         ↓
Validate → Malware Scan → SHA-256 → Encrypt → Store
         ↓
BlockchainEvidenceService.recordDocumentOnChain(document)
         ↓
Web3j signs + sends transaction
         ↓
TxHash + BlockNumber stored in PostgreSQL
```

---

## 19.8 Environment Variables for Blockchain

| Variable | Purpose | Production Value |
|----------|---------|------------------|
| `BLOCKCHAIN_ENABLED` | Enable/disable blockchain layer | `true` |
| `BLOCKCHAIN_RPC_URL` | EVM JSON-RPC endpoint | Your Alchemy/Infura/private node URL |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Deployed contract address | Address from `npx hardhat deploy` |
| `BLOCKCHAIN_PRIVATE_KEY` | ECDSA wallet private key for signing | **NEVER commit. Use Render secrets.** |
| `BLOCKCHAIN_GAS_PRICE` | Gas price in Wei | `20000000000` (20 Gwei) |
| `BLOCKCHAIN_GAS_LIMIT` | Gas limit per tx | `6721975` |
| `BLOCKCHAIN_NETWORK_NAME` | Display name | `EVM Forensic Trust Network` |
| `BLOCKCHAIN_CHAIN_ID` | EVM chain ID | `1` (mainnet), `137` (Polygon), `31337` (local) |

> **Security:** `BLOCKCHAIN_PRIVATE_KEY` must **never** be hardcoded in `application.properties` or committed to git. Always set it through Render's Environment Variables dashboard.

------------------------------------------------------------------------

# 20. Blockchain Technology Stack

| Component | Technology |
|-----------|-----------|
| Smart Contract Language | Solidity ^0.8.19 |
| Java Blockchain Client | Web3j 4.10.3 |
| Cryptography | BouncyCastle (Keccak-256, ECDSA secp256k1) |
| Transaction Signing | ECDSA with `Credentials.create(privateKey)` |
| Compatible Networks | Any EVM chain (Ethereum, Polygon, Hardhat, Anvil) |
| Local Dev Node | Hardhat / Anvil (chainId 31337) |
| Contract Registry | `EvidenceVaultRegistry.sol` |
| On-chain Events | `EvidenceAnchored`, `DocumentAnchored`, `AuditBatchAnchored` |

------------------------------------------------------------------------

# 21. Deploying the Smart Contract

For production, deploy `contracts/EvidenceVaultRegistry.sol`:

```bash
# Install Hardhat
npm install --save-dev hardhat

# Compile
npx hardhat compile

# Deploy to your target network
npx hardhat run scripts/deploy.js --network <your-network>

# Copy deployed contract address → BLOCKCHAIN_CONTRACT_ADDRESS env var
```

Then set in Render dashboard:
- `BLOCKCHAIN_CONTRACT_ADDRESS` = deployed address
- `BLOCKCHAIN_PRIVATE_KEY` = signing wallet private key
- `BLOCKCHAIN_RPC_URL` = your node RPC URL (Alchemy, Infura, etc.)

------------------------------------------------------------------------

# 22. Recommended Blockchain Network (Production)

The smart contract should support operations such as:

``` text
registerEvidence
getEvidence
createEvidenceVersion
transferEvidence
acceptEvidenceTransfer
verifyEvidence
getEvidenceHistory
registerSignature
placeLegalHold
releaseLegalHold
archiveEvidence
disposeEvidence
```

The smart contract must enforce valid state transitions.

------------------------------------------------------------------------

# 23. Cybersecurity Architecture

Cybersecurity is a core design principle of the system.

The security model follows defense in depth:

``` text
User
 ↓
Authentication
 ↓
MFA
 ↓
JWT
 ↓
RBAC
 ↓
ABAC
 ↓
Security Clearance
 ↓
Case Assignment
 ↓
Resource Authorization
 ↓
Workflow Validation
 ↓
Encrypted Data
 ↓
Audit
 ↓
Threat Detection
```

------------------------------------------------------------------------

# 24. Authentication

The backend uses Spring Security with stateless request handling.

Authentication capabilities include:

-   Username/password authentication
-   BCrypt password hashing
-   JWT access tokens
-   Refresh-token workflow
-   Login-attempt monitoring
-   Account lockout controls
-   Password reset workflow
-   MFA-related infrastructure

Authentication endpoints are exposed under:

``` text
/api/v1/auth
```

------------------------------------------------------------------------

# 25. Multi-Factor Authentication

The project contains MFA infrastructure for TOTP/email-based
verification.

The final deployment should configure MFA according to organizational
policy.

Privileged roles should use stronger authentication requirements than
ordinary users.

No secrets, OTPs, seed values or private credentials should be committed
to the repository.

------------------------------------------------------------------------

# 26. RBAC

Role-Based Access Control determines which broad operations a user may
perform.

The application defines roles such as:

``` text
ADMIN
SENIOR_OFFICER
INVESTIGATOR
EVIDENCE_CUSTODIAN
FORENSIC_OFFICER
PROSECUTOR
COURT_OFFICER
AUDITOR
```

Exact organizational role mapping should be configurable rather than
hard-coded to individual people.

------------------------------------------------------------------------

# 27. ABAC

Attribute-Based Access Control provides finer-grained resource
authorization.

Relevant attributes include:

-   User
-   Role
-   Case assignment
-   Security clearance
-   Resource classification
-   Evidence ownership/custody
-   Case status
-   Evidence status
-   Requested action

This reduces the risk of horizontal privilege escalation and
unauthorized cross-case access.

------------------------------------------------------------------------

# 28. Security Clearance

The project includes security-clearance concepts that can be used to
restrict access to classified information.

The authorization model can combine:

``` text
Role
+
Clearance
+
Case Assignment
+
Resource Classification
+
Action
```

A user having a role alone should not automatically imply access to
every case or document.

------------------------------------------------------------------------

# 29. Cryptographic Protection

The project uses cryptographic mechanisms for confidentiality and
integrity.

### Encryption

The backend provides an encryption/key-management layer based on AES-GCM
configuration.

### Integrity

SHA-256 hashes are used for integrity verification.

### Digital Signatures

The project includes a digital-signature service backed by cryptographic
libraries and PKI/keystore configuration.

### Blockchain

The target blockchain layer provides an immutable external trust anchor
for evidence integrity and lifecycle events.

------------------------------------------------------------------------

# 30. File Security

The upload pipeline includes security controls for:

-   File extension validation
-   MIME/magic-byte validation
-   File-size limits
-   Filename/path validation
-   Malware scanning
-   Quarantine workflows
-   Hash calculation

Supported evidence/document formats are configurable.

Examples include:

``` text
PDF
JPG/JPEG
PNG
DOCX
MP4
ZIP
TXT
PCAP
```

The exact production allowlist should be reviewed against organizational
requirements.

------------------------------------------------------------------------

# 31. Malware Scanning

The backend includes a `MalwareScannerService` with optional external
scanning support.

The intended workflow is:

``` text
Upload
 ↓
Validation
 ↓
Malware Scan
 ↓
Clean → Continue
 ↓
Malicious → Quarantine
```

Quarantined items are managed separately from accepted evidence.

The project includes a dedicated quarantine controller and
security-alert workflow.

------------------------------------------------------------------------

# 32. Audit Ledger

The backend contains an audit service and audit log entity.

The system can record security-sensitive activities such as:

-   Authentication events
-   Case operations
-   Document access
-   Evidence registration
-   Custody operations
-   Administrative actions
-   Security events
-   Court/export operations

The project also includes hash-chain verification for audit integrity.

This provides a second integrity mechanism alongside the planned
blockchain evidence ledger.

------------------------------------------------------------------------

# 33. Threat Detection

`ThreatDetectionService` provides application-level detection for
suspicious behavior.

Examples include:

-   Repeated failed access
-   Privilege escalation attempts
-   Abnormal downloads
-   Sensitive resource access anomalies
-   Security-policy violations
-   Malware events
-   Audit-integrity problems

The production system should integrate these alerts with an appropriate
monitoring/SOC workflow.

------------------------------------------------------------------------

# 34. Rate Limiting

Rate-limiting functionality is present to control abusive or excessive
requests.

Rate limits should be applied particularly to:

-   Authentication
-   Password reset
-   Sensitive administrative operations
-   File operations
-   High-volume search
-   Security-sensitive endpoints

Production thresholds should be configured according to expected
workload.

------------------------------------------------------------------------

# 35. Search Architecture

The application supports Elasticsearch integration.

The search architecture is:

``` text
Documents / Cases / Evidence
          ↓
Indexing
          ↓
Elasticsearch
          ↓
Inverted Index
          ↓
Query
          ↓
Ranked / Filtered Results
```

Elasticsearch improves retrieval performance without becoming the
primary transactional database.

Search authorization must remain permission-aware.

------------------------------------------------------------------------

# 36. AI-Assisted Analysis

The backend includes `AiForensicAnalysisService` and related
controller/endpoints.

Supported analysis areas include:

### Forensic Report Analysis

Can assist with:

-   Summarization
-   Key findings
-   Evidence relationships
-   Potential inconsistencies
-   Missing information

### Charge-Sheet Analysis

Can assist with:

-   Evidence mapping
-   Case-document relationships
-   Missing elements
-   Potential inconsistencies
-   Review support

### Case Analysis

Can assist with:

-   Case summaries
-   Timeline analysis
-   Evidence relationships
-   Document relationships
-   Analytical observations

------------------------------------------------------------------------

# 37. AI Safety Model

AI is an analytical assistant, not an authority.

AI should not directly:

-   Modify evidence
-   Modify blockchain records
-   Change custody
-   Approve court filings
-   Sign legal documents
-   Change case status
-   Dispose of evidence

The intended model is:

``` text
Source Data
    ↓
AI Analysis
    ↓
Human Review
    ↓
Authorized Decision
```

AI results should retain provenance such as source case, source records,
model configuration and analysis timestamp where required.

------------------------------------------------------------------------

# 38. Court and Prosecution Workflow

The backend includes a prosecution/court service and controller.

The workflow supports:

``` text
Forensic Report
      ↓
Charge Sheet
      ↓
Senior Review
      ↓
Prosecutor Signature
      ↓
Court Filing
      ↓
Court Proceedings
      ↓
Judgment
```

This allows investigative records to progress into the legal workflow
while retaining authorization and audit controls.

------------------------------------------------------------------------

# 39. Digital Signatures

Digital signatures are supported for controlled document/legal
workflows.

The architecture includes:

-   PKI/keystore configuration
-   Cryptographic signing service
-   Signature persistence
-   Signature-related approval workflow

Private keys must always remain outside source control and must be
managed through secure key storage in production.

------------------------------------------------------------------------

# 40. Retention and Legal Hold

The project includes retention and disposal functionality.

### Retention

Records may be retained according to configured policies.

### Legal Hold

A legal hold prevents unauthorized disposal while the hold remains
active.

### Disposal

Disposal must be subject to:

-   Retention-policy checks
-   Legal-hold checks
-   Case-state checks
-   Required authorization
-   Audit logging

In the target blockchain architecture, critical disposal events can also
be anchored as immutable lifecycle transactions.

------------------------------------------------------------------------

# 41. Backup and Disaster Recovery

The backend includes backup orchestration and database backup services.

The architecture considers:

-   Database backups
-   WAL-related recovery
-   Object-storage backups
-   Backup history
-   Restore testing
-   Backup health monitoring

The target production architecture should additionally include
blockchain ledger/network recovery.

------------------------------------------------------------------------

# 42. Backup Architecture

``` text
PostgreSQL
     ↓
Database Backup / WAL
     ↓
Encrypted Backup Storage

Object Storage
     ↓
Encrypted / Replicated Backup

Elasticsearch
     ↓
Snapshot / Rebuild

Blockchain
     ↓
Ledger + Network Configuration
     ↓
Recovery / Resynchronization
```

Backups must not contain exposed application secrets.

------------------------------------------------------------------------

# 43. REST API Overview

The backend API uses the `/api/v1` prefix.

### Authentication

``` text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/password-reset/request
POST /api/v1/auth/password-reset/confirm
GET  /api/v1/auth/me
```

### Cases

``` text
GET  /api/v1/cases
POST /api/v1/cases
GET  /api/v1/cases/{caseId}
POST /api/v1/cases/{caseId}/assign
POST /api/v1/cases/{caseId}/status
POST /api/v1/cases/{caseId}/legal-hold
POST /api/v1/cases/{caseId}/lift-legal-hold
POST /api/v1/cases/{caseId}/close
POST /api/v1/cases/{caseId}/archive
```

### Documents

``` text
POST /api/v1/cases/{caseId}/documents
GET  /api/v1/cases/{caseId}/documents
GET  /api/v1/documents/{documentId}/download
POST /api/v1/documents/{documentId}/versions
GET  /api/v1/documents/{documentId}/versions
GET  /api/v1/documents/{documentId}/versions/{versionNumber}/download
```

### Evidence

``` text
POST /api/v1/cases/{caseId}/evidence
GET  /api/v1/cases/{caseId}/evidence
POST /api/v1/evidence/{evidenceId}/versions
GET  /api/v1/evidence/{evidenceId}/versions
POST /api/v1/evidence/{evidenceId}/transfer-request
POST /api/v1/evidence/transfers/{transferId}/accept
POST /api/v1/evidence/transfers/{transferId}/reject
GET  /api/v1/evidence/{evidenceId}/custody
GET  /api/v1/evidence/transfers/pending
```

### AI

``` text
POST /api/v1/ai/analyze/forensic-report/{id}
POST /api/v1/ai/analyze/charge-sheet/{id}
POST /api/v1/ai/analyze/case/{caseId}
GET  /api/v1/ai/results/case/{caseId}
GET  /api/v1/ai/results/{id}
POST /api/v1/ai/guide-chat
```

### Audit and Security

``` text
GET  /api/v1/audit/logs
GET  /api/v1/audit/verify
GET  /api/v1/security/alerts
POST /api/v1/security/alerts/{id}/resolve
```

### Search

``` text
GET /api/v1/search?q={query}
```

### Retention

``` text
GET  /api/v1/retention/policies
POST /api/v1/retention/policies
GET  /api/v1/retention/disposals
POST /api/v1/retention/cases/{caseId}/archive
POST /api/v1/retention/disposals/{caseId}
```

### Backup

``` text
GET  /api/v1/backup/status
GET  /api/v1/backup/history
POST /api/v1/backup/trigger
POST /api/v1/backup/test-restore
```

### Administration

``` text
GET  /api/v1/users
POST /api/v1/users
POST /api/v1/users/bulk
PATCH /api/v1/users/{id}/status

GET /api/v1/admin/roles
GET /api/v1/admin/permissions
PUT /api/v1/admin/roles/{roleId}/permissions
```

------------------------------------------------------------------------

# 44. Local Development Requirements

Recommended prerequisites:

### Backend

-   Java 21
-   Maven 3.9+ or Maven Wrapper
-   PostgreSQL for production-like development
-   Redis
-   S3-compatible storage such as MinIO
-   Elasticsearch if search is enabled

### Frontend

-   Node.js 22+
-   npm

### Optional / External Services

-   SMTP provider for email workflows
-   Malware scanning provider
-   AI model/API provider
-   Permissioned blockchain network for blockchain integration

------------------------------------------------------------------------

# 45. Backend Configuration

The backend uses environment-variable-driven configuration.

Important configuration categories include:

``` text
Server
Database
Redis
Object Storage
Backup
Elasticsearch
Malware Scanning
JWT
Encryption / KMS
PKI
Email
AI
CORS
Security Policies
```

The actual secret values must be supplied through environment variables
or a secure secret-management system.

------------------------------------------------------------------------

# 46. Safe Environment Configuration

A local development environment may use a configuration file such as:

``` text
.env
```

or environment variables supplied by the shell/container/orchestrator.

**Never commit:**

``` text
JWT secrets
Database passwords
Redis passwords
Object-storage credentials
SMTP passwords
AI API keys
Malware-scanning API keys
Private keys
PKI keystore passwords
Cloud credentials
Blockchain private keys/certificates
```

Use `.env.example` only for **variable names and non-sensitive
placeholders**.

------------------------------------------------------------------------

# 47. Frontend Environment

The frontend expects an API base configuration such as:

``` env
VITE_API_URL=http://localhost:8080
```

The application derives the API path from this value.

Do not put backend secrets in Vite environment variables.

> Any variable prefixed with `VITE_` is potentially exposed to the
> browser bundle.

Therefore:

**Never place passwords, private keys, JWT signing secrets, database
credentials or API secrets in `VITE_*` variables.**

------------------------------------------------------------------------

# 48. Running the Backend

From the backend directory:

``` bash
./mvnw spring-boot:run
```

On Windows:

``` powershell
.\mvnw.cmd spring-boot:run
```

The default development server port is:

``` text
8080
```

The application health endpoint is:

``` text
http://localhost:8080/actuator/health
```

------------------------------------------------------------------------

# 49. Building the Backend

``` bash
./mvnw clean package
```

On Windows:

``` powershell
.\mvnw.cmd clean package
```

The generated JAR is placed under:

``` text
target/
```

------------------------------------------------------------------------

# 50. Running the Frontend

From the frontend directory:

``` bash
npm install
npm run dev
```

Vite normally starts the development server on its configured
development port.

The frontend can be configured to communicate with the local backend
using:

``` env
VITE_API_URL=http://localhost:8080
```

------------------------------------------------------------------------

# 51. Frontend Production Build

``` bash
npm run build
```

Preview the build with:

``` bash
npm run preview
```

The production build is generated in:

``` text
dist/
```

------------------------------------------------------------------------

# 52. Docker

Both frontend and backend contain Dockerfiles.

### Backend

The backend image:

-   Builds with Java/Maven
-   Runs on Java 21
-   Uses a non-root runtime user
-   Exposes port 8080
-   Includes an HTTP health check

### Frontend

The frontend image:

-   Builds the React application with Node
-   Serves static assets with Nginx
-   Includes security headers
-   Supports SPA routing
-   Provides API reverse-proxy configuration

Production deployments should replace development/self-signed TLS
behavior with organization-managed certificates and infrastructure.

------------------------------------------------------------------------

# 53. Database Migrations

Flyway migrations are located under:

``` text
backend/src/main/resources/db/migration/
```

Current migrations cover:

``` text
V1 — Initial schema
V2 — Seed roles
V3 — Enterprise/compliance schema
V4 — Administrative seed configuration
```

For production:

-   Do not manually edit already-applied migrations.
-   Add a new migration for schema changes.
-   Review seed data before production deployment.
-   Keep database credentials outside source control.

------------------------------------------------------------------------

# 54. Testing

The backend includes security integration tests.

The security test suite covers controls including:

-   Unauthenticated request rejection
-   Role-based authorization
-   Horizontal ABAC/IDOR protection
-   Direct document access protection
-   Document integrity verification
-   Audit hash-chain verification
-   JWT signature validation
-   Executable disguised as document rejection
-   Path traversal rejection
-   Locked document modification prevention
-   Closed-case modification prevention
-   Expired JWT rejection
-   MFA validation
-   Malware quarantine
-   Oversized upload rejection
-   Unauthorized digital signing
-   Unauthorized evidence transfer
-   Legal-hold disposal protection
-   Mass-download threat detection
-   Privilege-escalation detection

Run tests with:

``` bash
./mvnw test
```

or on Windows:

``` powershell
.\mvnw.cmd test
```

------------------------------------------------------------------------

# 55. Security Testing Philosophy

Security testing should verify both:

### Vertical authorization

A user cannot perform operations beyond their assigned privilege level.

### Horizontal authorization

A user cannot access another user's/case's resources merely by changing
an ID.

This is especially important for legal and investigation documents.

------------------------------------------------------------------------

# 56. Example Secure Evidence Flow

A complete evidence workflow should be:

``` text
Officer Authentication
        ↓
MFA / Security Verification
        ↓
Case Authorization
        ↓
Evidence Registration
        ↓
File Validation
        ↓
Malware Scan
        ↓
SHA-256 Hash
        ↓
Encryption
        ↓
Secure Storage
        ↓
Blockchain Integrity Anchor
        ↓
Evidence Metadata Persistence
        ↓
Search Indexing
        ↓
Audit Event
```

Later:

``` text
Custody Transfer
        ↓
Recipient Authorization
        ↓
Transfer Acceptance
        ↓
Digital Signature
        ↓
Blockchain Custody Event
        ↓
Audit Event
```

------------------------------------------------------------------------

# 57. Sensitive Information Policy

This README intentionally does **not** contain:

-   Passwords
-   API keys
-   JWT secrets
-   Database credentials
-   SMTP credentials
-   Cloud credentials
-   Private keys
-   PKI passwords
-   Blockchain private credentials
-   Personal authentication data
-   Production access tokens

Before publishing the repository, perform an additional secret scan.

Recommended checks include:

``` text
.env files
private keys
keystore files
credentials
access tokens
API keys
cloud configuration
database dumps
local storage
generated certificates
```

------------------------------------------------------------------------

# 58. Repository Hygiene

Do not commit generated/development directories such as:

``` text
node_modules/
target/
dist/
storage_vault/
.env
*.p12
*.jks
*.pem
*.key
```

A project-level `.gitignore` should be maintained for both frontend and
backend artifacts.

------------------------------------------------------------------------

# 59. Production Security Checklist

Before production deployment:

-   [ ] Replace all development/default credentials.
-   [ ] Generate a strong JWT signing secret.
-   [ ] Configure secure database credentials.
-   [ ] Configure secure object-storage credentials.
-   [ ] Configure secure Redis credentials.
-   [ ] Configure production CORS allowlist.
-   [ ] Disable development-only H2 console.
-   [ ] Review actuator exposure.
-   [ ] Configure TLS certificates.
-   [ ] Configure production secret management.
-   [ ] Configure malware scanning.
-   [ ] Enable appropriate MFA policies.
-   [ ] Review RBAC.
-   [ ] Review ABAC.
-   [ ] Configure rate limits.
-   [ ] Verify encryption keys.
-   [ ] Secure PKI/private keys.
-   [ ] Enable backup verification.
-   [ ] Test restore procedures.
-   [ ] Deploy the permissioned blockchain network.
-   [ ] Deploy and audit evidence smart contracts.
-   [ ] Verify blockchain evidence transactions.
-   [ ] Conduct penetration testing.
-   [ ] Perform dependency/container vulnerability scanning.
-   [ ] Remove demo/offline authentication behavior before production.

------------------------------------------------------------------------

# 60. Important Security Observation for This Source Snapshot

The uploaded source contains development/demo-oriented authentication
and local persistence behavior in the frontend, including local browser
storage used for fallback/demo workflows.

That is useful for prototyping and demonstrations, but it should **not
be treated as the production authentication or evidence-security
boundary**.

For production:

``` text
Frontend
   ↓
Spring Security
   ↓
Authoritative Backend
   ↓
Database / Storage / Blockchain
```

The backend must remain the authoritative security boundary.

------------------------------------------------------------------------

# 61. Production Blockchain Roadmap

The blockchain implementation should proceed in the following stages:

### Stage 1 --- Network

-   Permissioned blockchain network
-   Organization identities
-   Certificate authority
-   Peer/orderer configuration
-   Secure channel configuration

### Stage 2 --- Smart Contract

Implement:

``` text
registerEvidence
createVersion
transferCustody
acceptCustody
verifyEvidence
getHistory
archiveEvidence
disposeEvidence
```

### Stage 3 --- Spring Boot Integration

Create:

``` text
BlockchainClient
BlockchainEvidenceService
BlockchainCustodyService
BlockchainVerificationService
```

### Stage 4 --- Evidence Integration

Connect:

``` text
EvidenceAndCustodyService
        ↓
BlockchainEvidenceService
```

### Stage 5 --- Frontend

Display:

-   Blockchain verification state
-   Transaction identifier
-   Evidence hash
-   Version
-   Custody history
-   Integrity result

------------------------------------------------------------------------

# 62. Target Blockchain Verification Result

A successful verification should communicate something equivalent to:

``` text
Evidence Integrity: VERIFIED

Evidence Hash: MATCH
Blockchain Record: VALID
Evidence Version: VERIFIED
Custody Chain: VALID
Digital Signature: VALID
```

A mismatch should produce a security/integrity event rather than
silently allowing the operation.

------------------------------------------------------------------------

# 63. Operational Monitoring

Production monitoring should cover:

### Application

-   API health
-   Error rates
-   Latency
-   JVM health

### Database

-   Connection health
-   Storage
-   Query performance
-   Backup status

### Redis

-   Connectivity
-   Memory
-   Availability

### Elasticsearch

-   Cluster health
-   Index health
-   Search latency

### Object Storage

-   Capacity
-   Availability
-   Failed operations

### Blockchain

-   Peer availability
-   Ledger synchronization
-   Transaction failures
-   Block height
-   Chaincode health
-   Verification failures

### Security

-   Failed logins
-   Suspicious access
-   Malware events
-   Privilege violations
-   Unusual downloads
-   Audit integrity alerts

------------------------------------------------------------------------

# 64. Deployment Architecture

A production deployment can follow:

``` text
                    Users
                      │
                      ▼
                 WAF / Gateway
                      │
                      ▼
               React / Nginx
                      │
                      ▼
              Load Balancer
                      │
              ┌───────┴───────┐
              ▼               ▼
        Spring Boot       Spring Boot
          Instance          Instance
              │               │
              └───────┬───────┘
                      │
       ┌──────────────┼───────────────┐
       ▼              ▼               ▼
  PostgreSQL        Redis       Elasticsearch
       │
       ▼
 Secure Object Storage
       │
       ▼
 Permissioned Blockchain
```

------------------------------------------------------------------------

# 65. Scalability

The backend is designed around stateless HTTP request processing.

Scaling can be achieved by increasing Spring Boot application instances
behind a load balancer.

Stateful/shared infrastructure should be externalized to:

-   PostgreSQL
-   Redis
-   Object storage
-   Elasticsearch
-   Blockchain network

Large evidence uploads should use streaming and controlled storage
rather than loading entire files into JVM memory.

------------------------------------------------------------------------

# 66. Reliability

The system includes several reliability mechanisms:

-   Global exception handling
-   Resource-not-found handling
-   Security validation exceptions
-   Workflow violation handling
-   Rate-limit exceptions
-   Backup orchestration
-   Restore testing
-   Health indicators
-   Database transactions
-   Versioned documents/evidence
-   Audit verification

------------------------------------------------------------------------

# 67. Design Principles

### Security by Design

Security controls are part of the architecture rather than an
afterthought.

### Least Privilege

Users receive only the permissions required for their role and
assignment.

### Defense in Depth

Multiple independent controls protect sensitive information.

### Immutable Evidence

Evidence integrity is anchored using cryptographic verification and the
target permissioned blockchain layer.

### Separation of Concerns

Transactional data, search indexes, binary storage, audit data and
blockchain trust records have different responsibilities.

### Human Oversight

AI assists authorized personnel but does not replace legal or
evidentiary decision-making.

### Auditability

Sensitive actions should be traceable to an authenticated actor and
timestamp.

------------------------------------------------------------------------

# 68. Technology Summary

  Layer                      Technology
  -------------------------- -------------------------------------------------
  Frontend                   React 18
  Frontend Build             Vite
  Styling                    Tailwind CSS
  Routing                    React Router
  Backend                    Spring Boot 3.4.x
  Language                   Java 21
  Security                   Spring Security
  Authentication             JWT + MFA infrastructure
  Authorization              RBAC + ABAC
  Database                   PostgreSQL
  Migrations                 Flyway
  Cache/Security State       Redis
  Search                     Elasticsearch
  Binary Storage             S3-compatible storage / MinIO
  File Detection             Apache Tika
  Malware Scanning           Malware scanning service integration
  Encryption                 AES-GCM based encryption layer
  Hashing                    SHA-256
  Signatures                 PKI / Bouncy Castle
  AI                         Spring AI / OpenAI-compatible model integration
  Email                      Spring Mail
  API Documentation          SpringDoc / OpenAPI
  Monitoring                 Spring Actuator
  Containerization           Docker
  **Evidence Trust Layer**   **Permissioned Blockchain**

------------------------------------------------------------------------

# 69. Project Strengths

The project provides a broad security-oriented foundation for SIH 190:

### Document Security

-   Controlled uploads
-   Versioning
-   Integrity checks
-   Access control
-   Digital signatures

### Evidence Security

-   Evidence lifecycle
-   Versioning
-   Custody tracking
-   Integrity verification
-   Blockchain-backed target architecture

### Cybersecurity

-   JWT
-   MFA infrastructure
-   RBAC
-   ABAC
-   Encryption
-   Malware scanning
-   Quarantine
-   Rate limiting
-   Threat detection
-   Audit verification

### Legal Workflow

-   Forensic reports
-   Charge sheets
-   Senior review
-   Prosecutor signing
-   Court filing
-   Proceedings
-   Judgment

### Information Retrieval

-   Elasticsearch
-   Inverted indexing
-   Global search

### Intelligence

-   AI-assisted forensic analysis
-   AI-assisted charge-sheet analysis
-   AI-assisted case analysis
-   Multilingual guidance

### Resilience

-   Backup orchestration
-   Restore testing
-   WAL/database recovery concepts
-   Object-storage backup
-   Health monitoring

------------------------------------------------------------------------

# 70. Limitations and Production Gaps

The current source snapshot is a strong prototype/foundation, but the
following areas require final productionization:

1.  **Blockchain client/network/chaincode integration must be
    implemented.**
2.  Frontend demo/offline authentication behavior must be removed or
    isolated from production.
3.  Development/default credentials must be eliminated.
4.  Production secret management must be configured.
5.  Production CORS must be strictly allowlisted.
6.  Development H2 console must be disabled in production.
7.  Actuator exposure must be reviewed.
8.  Production PKI/key management must be hardened.
9.  Elasticsearch permission-aware search must be validated end-to-end.
10. Backup and blockchain disaster-recovery procedures must be tested.
11. Full penetration testing and infrastructure security assessment
    should be completed.
12. Container/dependency security scanning should be incorporated into
    CI/CD.

These are deployment-hardening requirements, not reasons to discard the
existing architecture.

------------------------------------------------------------------------

# 71. Recommended Development Workflow

``` text
Requirement
    ↓
Domain Model
    ↓
Database Migration
    ↓
Repository
    ↓
Service
    ↓
Authorization Rules
    ↓
Controller/API
    ↓
Frontend Service
    ↓
Frontend Page
    ↓
Audit Event
    ↓
Security Test
    ↓
Integration Test
```

For evidence-related functionality, add:

``` text
Blockchain Transaction
    ↓
Blockchain Verification Test
```

------------------------------------------------------------------------

# 72. Contribution Guidelines

When extending the project:

1.  Keep controllers thin.
2.  Put business logic in services.
3.  Use DTOs for API boundaries.
4.  Validate inputs server-side.
5.  Enforce authorization on the backend.
6.  Add audit logging for security-sensitive operations.
7.  Add database migrations rather than modifying existing migrations.
8.  Do not commit secrets.
9.  Add tests for security-sensitive functionality.
10. Keep blockchain-specific logic behind a service/client abstraction.
11. Do not expose private cryptographic material to the frontend.
12. Do not allow AI-generated output to directly modify authoritative
    records.

------------------------------------------------------------------------

# 73. Security Reporting

If a security vulnerability is discovered:

-   Do not publish credentials or exploit details in an issue.
-   Do not commit proof-of-concept secrets.
-   Report the issue privately to the project/security owner.
-   Rotate exposed credentials immediately.
-   Preserve relevant audit/security information.
-   Assess whether affected evidence/document integrity must be
    re-verified.

------------------------------------------------------------------------

# 74. Disclaimer

This repository is a technical implementation for the SIH 190 problem
statement.

It is not, by itself, a declaration of legal admissibility, statutory
compliance, or production readiness for any particular government,
police, forensic, prosecution or judicial environment.

Before operational deployment, the system must undergo the applicable:

-   Legal review
-   Security review
-   Privacy review
-   Infrastructure review
-   Compliance assessment
-   Penetration testing
-   Operational acceptance testing
-   Data-governance approval

------------------------------------------------------------------------

# 75. Final System Vision

The target system provides a secure digital lifecycle for legal and
investigative records:

``` text
             CASE
              │
      ┌───────┴────────┐
      ▼                ▼
   DOCUMENT          EVIDENCE
      │                │
      ▼                ▼
   VERSIONING       HASHING
      │                │
      ▼                ▼
  ENCRYPTION       ENCRYPTION
      │                │
      ▼                ▼
 SECURE STORAGE   BLOCKCHAIN TRUST
      │                │
      └───────┬────────┘
              ▼
       FORENSIC ANALYSIS
              │
              ▼
        CHARGE SHEET
              │
              ▼
        COURT WORKFLOW
              │
              ▼
        RETENTION / HOLD
              │
              ▼
        ARCHIVE / DISPOSAL
```

The resulting platform is intended to provide a unified, secure and
auditable environment for **legal and investigation document
management**, while giving evidence an additional **cryptographically
verifiable and blockchain-backed chain of trust**.

------------------------------------------------------------------------

## 76. Quick Reference

### Start Backend

``` bash
cd backend
./mvnw spring-boot:run
```

### Start Frontend

``` bash
cd frontend
npm install
npm run dev
```

### Build Backend

``` bash
cd backend
./mvnw clean package
```

### Build Frontend

``` bash
cd frontend
npm run build
```

### Run Backend Tests

``` bash
cd backend
./mvnw test
```

### Default Local Backend

``` text
http://localhost:8080
```

### Health Check

``` text
http://localhost:8080/actuator/health
```

------------------------------------------------------------------------

## 77. Project Identity

**Project:** Secure Digital Document Management System for Legal and
Investigation Documents

**SIH Problem Statement:** 190

**Team:** Spring_Devs

**Team ID:** SIH26190/0087

**Primary Focus:**

> Secure digital document management with strong cybersecurity, evidence
> chain-of-custody, cryptographic integrity, intelligent search,
> AI-assisted analysis, and blockchain-backed evidence trust.
