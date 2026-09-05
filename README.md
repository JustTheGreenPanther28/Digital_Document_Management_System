# Secure Digital Case Management, Document Management & Evidence Chain-of-Custody System

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://openjdk.org/)
[![Spring Boot 3.4.3](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-Zero--Trust%20%7C%20ABAC-red.svg)](#security-architecture)

> **Official Implementation** conforming strictly to the architectural specifications, security criteria, and program flow defined for SIH Problem Statement 190.

---

## 🏛️ System Overview

The **Secure Digital Case Management, Document Management & Evidence Chain-of-Custody System** is an enterprise-grade, Zero-Trust digital fortress designed for law enforcement agencies, forensic laboratories, public prosecutors, and judicial courts. It provides cryptographic non-repudiation, tamper-evident audit logging, hardware-level envelope encryption, and strict Attribute-Based Access Control (ABAC).

### Key Architectural Pillars

1. **Zero-Trust Request Pipeline**: Dual-layered RBAC + ABAC + Security Clearance enforcement. Having the `INVESTIGATOR` role is not enough; an investigator can *only* access cases where they are an assigned team member and meet the required classification clearance.
2. **Secure Upload & Document Pipeline**:
   - **Apache Tika Magic Bytes Inspection**: Detects disguised executables, scripts, and polyglot files regardless of file extension.
   - **ClamAV Anti-Malware Streaming**: Rejects malware, trojans, and EICAR test signatures.
   - **SHA-256 Integrity Fingerprint**: Computes deterministic hash before encryption.
   - **AES-256-GCM Envelope Encryption**: Generates a unique 256-bit Data Encryption Key (DEK), 96-bit IV, and 128-bit authentication tag for every artifact. DEKs are encrypted under an AES Key Encryption Key (KEK).
   - **RSA-2048 Digital Signatures & Immutable Locking**: Prevents modification or substitution of evidentiary documents once certified.
3. **Append-Only Digital Chain of Custody**:
   - Two-party verification protocol: Custody transfers remain `PENDING_ACCEPTANCE` until the receiving officer physically inspects the seal and counter-signs.
   - Cryptographic tracking of physical barcodes, locker locations, and item condition.
4. **Tamper-Evident Hash-Chained Audit Ledger**:
   - Merkle-like sequential hash chain: $\text{Hash}_n = \text{SHA-256}(\text{Log}_n + \text{Hash}_{n-1})$.
   - Automated continuous verification. If a rogue DBA alters any row, the chain breaks and triggers automated alerts.
5. **Role-Adaptive Command Frontends**: Tailored workflows for 8 specialized personas:
   - `ADMIN`, `SENIOR_OFFICER`, `INVESTIGATOR`, `EVIDENCE_CUSTODIAN`, `FORENSIC_OFFICER`, `PROSECUTOR`, `COURT_OFFICER`, `AUDITOR`.

---

## 👥 Demo Personas & Credentials

All demo accounts are pre-seeded in the database with password: `Password@123`.

| Username | Role | Clearance Level | Responsibilities |
| :--- | :--- | :--- | :--- |
| `admin` | `ADMIN` | `TOP_SECRET` | System administrator, user provisioning, security auditor |
| `senior_officer` | `SENIOR_OFFICER` | `TOP_SECRET` | Case creation, team assignment, workflow status approvals |
| `investigator_a` | `INVESTIGATOR` | `SECRET` | Assigned Lead Investigator on `CASE-2026-001` (full case access) |
| `investigator_b` | `INVESTIGATOR` | `CONFIDENTIAL` | Unassigned Investigator (demonstrates ABAC denial on Case 1) |
| `custodian` | `EVIDENCE_CUSTODIAN`| `CONFIDENTIAL` | Physical evidence locker, barcode tracking, custody transfers |
| `forensic_officer`| `FORENSIC_OFFICER` | `SECRET` | Digital forensics analysis, artifact extraction, RSA signing |
| `prosecutor` | `PROSECUTOR` | `SECRET` | Pre-trial discovery packages, Section 65B bundles, legal holds |
| `court_officer` | `COURT_OFFICER` | `CONFIDENTIAL` | Judicial court records, certified exhibit filing, hearing logs |
| `auditor` | `AUDITOR` | `TOP_SECRET` | Cryptographic hash ledger verification & tamper forensics |

> **Fast Role Switcher**: In the web UI, you can switch between any of these personas with a single click using the fast role dropdown in the top navigation bar.

---

## 🚀 Quickstart Guide

### Option 1: Run via Docker Compose (Complete Production Stack)

Requirements: Docker 24+ and Docker Compose v2.

```bash
# 1. Clone or navigate to the repository
cd sih190-case-management

# 2. Start all services in the background
docker compose up -d

# 3. View service status
docker compose ps
```

Services started:
- **Frontend Portal**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080` (Healthcheck: `http://localhost:8080/actuator/health`)
- **MinIO Storage Console**: `http://localhost:9001` (User: `minioadmin` / Pass: `MinioSecurePassword!2026`)
- **PostgreSQL Database**: `localhost:5432` (`sih190_db`)
- **Redis Cache**: `localhost:6379`
- **ClamAV Daemon**: `localhost:3310`
- **Elasticsearch**: `http://localhost:9200`

---

### Option 2: Local Development (Embedded Zero-Config Mode)

The backend includes a zero-config development profile that uses an in-memory PostgreSQL-compatible H2 database, local encrypted vault storage, and mock malware scanners so you can run the entire system immediately without installing external daemons.

#### 1. Start Spring Boot Backend

Requirements: Java 21 or Java 25.

```bash
cd sih190-case-management/backend

# Windows
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```
The backend starts on `http://localhost:8080`.

#### 2. Start React Frontend

Requirements: Node.js 20+ and npm.

```bash
cd sih190-case-management/frontend

# Install dependencies (already executed during build)
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🧪 Automated Security Integration Tests

The project includes an end-to-end security integration test suite (`SecurityIntegrationTests.java`) validating all security requirements:

```bash
cd sih190-case-management/backend

# Run the 20 comprehensive security tests
.\mvnw.cmd test
```

### Verified Test Suite Capabilities (20 Controls):
1. `testSuccessfulAuthentication`: Validates BCrypt password matching and JWT minting.
2. `testFailedAuthenticationOnBadPassword`: Verifies 401 response and failure auditing.
3. `testAbacIsolationBetweenInvestigators`: Verifies `investigator_b` gets 403 Access Denied when attempting to view `CASE-2026-001` where only `investigator_a` is assigned.
4. `testClearanceLevelEnforcement`: Verifies users with lower clearance cannot access higher-classified case documents.
5. `testMalwareDetectionViaMagicBytes`: Confirms Apache Tika catches disguised executables masquerading as `.pdf` files.
6. `testPathTraversalRejection`: Verifies path traversal attacks like `../../etc/passwd` are intercepted and rejected.
7. `testTamperDetectionViaSha256Mismatch`: Injects corrupted ciphertext and asserts immediate tamper alert.
8. `testCryptographicHashChainVerification`: Verifies mathematical integrity of the SHA-256 audit ledger.
9. `testAuditLedgerTamperDetection`: Simulates direct database corruption on a historical audit block and confirms immediate tamper detection.
10. `testDigitalSignatureAndDocumentLocking`: Validates RSA-2048 key generation, hash signing, and immutable locking.
11. `testCaseStatusTransitionStateMachine`: Asserts valid state transitions and rejects illegal workflow leaps.
12. `testExpiredJwtRejection`: Validates that expired JWT tokens are strictly rejected with 401 Unauthorized.
13. `testInvalidMfaTokenRejection`: Asserts that invalid TOTP codes return 401/400 during second-factor verification.
14. `testMalwareQuarantineWorkflow`: Validates that files with EICAR test signatures trigger immediate quarantine and a critical security alert.
15. `testOversizedUploadRejection`: Confirms payloads exceeding max file limits are rejected.
16. `testUnauthorizedDigitalSignatureRejection`: Confirms unauthorized users without signing entitlements cannot sign documents.
17. `testUnauthorizedEvidenceTransferRejection`: Rejects custody transfer attempts on evidence not held by the requesting officer.
18. `testLegalHoldDeletionVeto`: Confirms programmatic veto preventing deletion or disposal of cases under active judicial Legal Hold.
19. `testMassDownloadThreatAlert`: Asserts that rapid downloads trigger mass-download threat detection and security alert.
20. `testPrivilegeEscalationThreatAlert`: Confirms privilege escalation attempts are blocked and logged in the security incident feed.

---

## 📂 Project Structure

```text
sih190-case-management/
├── backend/
│   ├── src/main/java/com/sih/casemanagement/
│   │   ├── common/enums/         # RoleType, CaseStatus, SecurityClearance, etc.
│   │   ├── config/               # DataInitializer, SecurityConfig, StorageConfig
│   │   ├── controller/           # REST Controllers (Auth, Case, Document, Evidence, Audit, Court)
│   │   ├── dto/                  # Requests & Responses DTOs
│   │   ├── entity/               # JPA Entities (Case, Document, Evidence, AuditLog, Custody)
│   │   ├── repository/           # Spring Data JPA Repositories
│   │   ├── security/             # JWT, UserPrincipal, AbacSecurityService
│   │   └── service/              # Encryption, Malware, Tika, DigitalSignature, Audit
│   ├── src/main/resources/
│   │   ├── db/migration/         # Flyway SQL migrations (V1 22 tables, V2 Seed roles)
│   │   └── application.yml       # Application profiles & configuration
│   ├── src/test/java/            # Comprehensive Security Integration Tests
│   ├── Dockerfile                # Multi-stage hardened backend container
│   └── pom.xml                   # Maven dependencies (JJWT, Bouncy Castle, S3 SDK, Tika)
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, modals
│   │   ├── context/              # AuthContext, JWT persistence, quick role switcher
│   │   ├── pages/                # Dashboard, Cases, CaseDetails, Evidence, Custody, Audit, Vault
│   │   ├── services/             # API client with JWT bearer interceptor
│   │   ├── App.jsx               # Router & ProtectedLayout
│   │   └── index.css             # Tailwind dark tactical vault theme
│   ├── Dockerfile                # Multi-stage Node builder + Nginx Alpine runner
│   ├── nginx.conf                # Reverse proxy with hardened security headers
│   └── vite.config.js            # Vite build configuration with proxy
├── docs/
│   ├── ARCHITECTURE.md           # Full system architecture & data flow
│   ├── SECURITY.md               # Threat matrix, ABAC specification & encryption
│   ├── API.md                    # Complete REST API reference
│   ├── DEPLOYMENT.md             # Production setup & disaster recovery
│   └── THREAT_MODEL.md           # STRIDE analysis & compliance matrix
├── docker-compose.yml            # Complete container stack
└── README.md                     # This documentation
```

---

## 🛡️ License & Compliance

Built for **Smart India Hackathon (SIH) — Problem 190**.  
Compliant with Indian Evidence Act (Section 65B), ISO/IEC 27037 (Digital Evidence Handling), and NIST SP 800-53 security controls.
