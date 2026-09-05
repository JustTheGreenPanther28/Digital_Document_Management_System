# REST API Specification Reference

## SIH Problem 190 — Secure Digital Case Management, Document Management & Evidence Chain-of-Custody System

**Base URI**: `/api/v1`  
**Authentication**: Bearer Token in `Authorization: Bearer <jwt_token>` header.

---

## 1. Authentication Endpoints (`/auth`)

### `POST /api/v1/auth/login`
Authenticates user credentials. If MFA is enabled, returns a temporary `mfaSessionToken`.
- **Request Body**:
  ```json
  {
    "username": "investigator_a",
    "password": "Password@123"
  }
  ```
- **Success Response (MFA Disabled)**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "userId": "uuid...",
    "username": "investigator_a",
    "fullName": "Det. John Miller",
    "roles": ["INVESTIGATOR"],
    "clearance": "SECRET",
    "departmentalId": "DEP-POL-2026"
  }
  ```
- **Success Response (MFA Enabled)**:
  ```json
  {
    "mfaRequired": true,
    "mfaSessionToken": "session-uuid...",
    "message": "Two-Factor Authentication required. Enter TOTP code."
  }
  ```

### `POST /api/v1/auth/verify-totp`
Verifies 6-digit TOTP code.
- **Request Body**:
  ```json
  {
    "mfaSessionToken": "session-uuid...",
    "totpCode": "123456"
  }
  ```

---

## 2. Case Management Endpoints (`/cases`)

### `GET /api/v1/cases`
Returns cases accessible to the caller based on RBAC, ABAC assignments, and clearance level.

### `POST /api/v1/cases`
Registers a new crime case.  
**Required Role**: `SENIOR_OFFICER` or `ADMIN`.
- **Request Body**:
  ```json
  {
    "title": "State vs Alpha Syndicate",
    "description": "Cross-border financial fraud investigation.",
    "firNumber": "FIR-2026-889",
    "incidentDate": "2026-09-01T10:00:00Z",
    "investigatingAgency": "Central Crime Branch",
    "priority": "HIGH",
    "classification": "RESTRICTED"
  }
  ```

### `GET /api/v1/cases/{caseId}`
Returns detailed case dossier (facts, assigned team members, status trail).  
**Authorization**: Evaluates ABAC assignment on `{caseId}`.

### `POST /api/v1/cases/{caseId}/assign`
Assigns a user to the case team.  
**Required Role**: `SENIOR_OFFICER` or `ADMIN`.
- **Request Body**:
  ```json
  {
    "userId": "uuid...",
    "roleInCase": "LEAD_INVESTIGATOR"
  }
  ```

### `POST /api/v1/cases/{caseId}/status`
Advances the case workflow status.  
**Authorization**: Checked against status state machine.
- **Request Body**:
  ```json
  {
    "status": "CHARGESHEET_FILED",
    "reason": "Forensic audit completed and formal charges compiled."
  }
  ```

### `POST /api/v1/cases/{caseId}/legal-hold`
Places a statutory litigation hold on the case.  
**Required Role**: `SENIOR_OFFICER`, `PROSECUTOR`, or `ADMIN`.

---

## 3. Document Management Endpoints (`/documents`)

### `POST /api/v1/documents/case/{caseId}/upload`
Uploads and encrypts an evidentiary file.  
**Content-Type**: `multipart/form-data`
- **Parts**:
  - `file`: Binary file stream
  - `title`: String
  - `documentType`: `FIR` | `CHARGESHEET` | `FORENSIC_REPORT` | `SEIZURE_MEMO` | `POLICE_REPORT`
  - `classification`: `UNCLASSIFIED` | `RESTRICTED` | `CONFIDENTIAL` | `SECRET` | `TOP_SECRET`

### `GET /api/v1/documents/{documentId}/download`
Decrypts and streams the original artifact binary. Verifies SHA-256 integrity prior to sending.

### `POST /api/v1/documents/{documentId}/sign`
Asymmetrically signs document hash with RSA-2048 and permanently locks the document.

---

## 4. Evidence & Custody Endpoints (`/evidence`)

### `POST /api/v1/evidence/case/{caseId}`
Registers a physical or digital evidence item. Generates unique barcode.

### `POST /api/v1/evidence/{evidenceId}/transfer`
Initiates a custody transfer.
- **Request Body**:
  ```json
  {
    "toUserId": "uuid...",
    "reasonForTransfer": "Laboratory Ballistics Testing",
    "physicalCondition": "Sealed in evidence bag #908"
  }
  ```

### `POST /api/v1/evidence/transfers/{transferId}/accept`
Receiver accepts physical custody and signs the transfer record.
- **Request Body**:
  ```json
  {
    "verificationNotes": "Bag seal #908 verified undamaged."
  }
  ```

---

## 5. Audit Ledger Endpoints (`/audit`)

### `GET /api/v1/audit/ledger?page=0&size=50`
Retrieves sequential cryptographic audit ledger records.

### `POST /api/v1/audit/ledger/verify`
Runs continuous verification from Genesis block to latest block.
- **Response**:
  ```json
  {
    "verified": true,
    "totalEntriesChecked": 42,
    "timestamp": "2026-09-04T12:00:00Z"
  }
  ```

---

## 6. Prosecution & Court Endpoints (`/court`)

### `GET /api/v1/court/cases/{caseId}/bundle`
Compiles pre-trial forensic discovery package under Section 65B.
