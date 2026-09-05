# Production Deployment & Operations Guide

## SIH Problem 190 — Secure Digital Case Management, Document Management & Evidence Chain-of-Custody System

---

## 1. Prerequisites

- **Hardware**: Minimum 4 CPU cores, 16 GB RAM, 100 GB NVMe storage (for encrypted vault artifacts).
- **Host OS**: Ubuntu 22.04 LTS, Debian 12, or RHEL 9.
- **Container Tooling**: Docker Engine 24.0+ and Docker Compose v2.20+.

---

## 2. Environment Configuration

Copy `.env.example` to `.env` and configure production secrets:

```bash
cp .env.example .env
```

### Critical Production Secrets:
1. `SECURITY_JWT_SECRET`: Must be a high-entropy 256-bit or 512-bit Base64-encoded string.
   ```bash
   openssl rand -base64 64
   ```
2. `SECURITY_MASTER_KEY`: 256-bit Master Key (KEK) for AES envelope encryption.
   ```bash
   openssl rand -base64 32
   ```
3. `POSTGRES_PASSWORD` and `MINIO_ROOT_PASSWORD`: Unique, strong alphanumeric passwords.

---

## 3. Deploying the Full Stack

Launch all services via Docker Compose:

```bash
# Build and run all containers in detached mode
docker compose up -d --build

# Inspect operational logs
docker compose logs -f backend
```

Verify service health:
```bash
docker compose ps
```

All 7 containers (`postgres`, `redis`, `minio`, `clamav`, `elasticsearch`, `backend`, `frontend`) should display `Up (healthy)`.

---

## 4. Production Hardening & SSL/TLS

In an enterprise police or judiciary deployment, place the frontend Nginx reverse proxy behind an enterprise SSL termination layer:

```text
Internet / WAN  ──[ Port 443 / TLS 1.3 ]──>  Host Reverse Proxy (Let's Encrypt / Certbot)
                                                         │
                                             [ Internal Docker Network ]
                                                         ▼
                                                sih190-frontend (Nginx)
                                                         │
                                                         ▼
                                                sih190-backend (Spring Boot)
```

---

## 5. Backup & Disaster Recovery

### 1. PostgreSQL Database Backup
```bash
docker exec -t sih190-postgres pg_dump -U sih190_user -d sih190_db -F c -b -v -f /tmp/backup.dump
docker cp sih190-postgres:/tmp/backup.dump ./backups/db_$(date +%Y%m%d_%H%M%S).dump
```

### 2. MinIO Encrypted Vault Backup
MinIO stores all encrypted ciphertext artifacts under the named volume `minio_data`. Sync to offsite cold storage:
```bash
aws --endpoint-url http://localhost:9000 s3 sync s3://sih190-evidence-vault s3://offsite-backup-vault/
```

### 3. Hash Ledger Sanity Check
Execute a hash integrity verification run via curl:
```bash
curl -X POST http://localhost:8080/api/v1/audit/ledger/verify \
  -H "Authorization: Bearer <AUDITOR_TOKEN>"
```
