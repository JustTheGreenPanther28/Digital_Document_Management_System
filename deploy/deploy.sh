#!/usr/bin/env bash
# ==============================================================================
# deploy/deploy.sh
# Main deployment script — run on the OCI VM to update and restart the app.
#
# Usage (on the OCI VM):
#   cd /opt/forsic/forsic-case-management
#   sudo bash deploy/deploy.sh
# ==============================================================================
set -euo pipefail

REPO_DIR="/opt/forsic/forsic-case-management"
ENV_SOURCE="/etc/forsic/.env"

echo "======================================================"
echo " FORSIC Case Management — Deployment Started"
echo " $(date -u)"
echo "======================================================"

# ---- Verify secrets file exists ----
if [[ ! -f "${ENV_SOURCE}" ]]; then
  echo "[ERROR] Secrets file not found: ${ENV_SOURCE}"
  echo "        Run first:  sudo bash deploy/fetch-oci-vault-secrets.sh"
  exit 1
fi

cd "${REPO_DIR}"

# ---- Pull latest code from GitHub ----
echo ""
echo "[1/5] Pulling latest code from GitHub..."
git pull origin main
echo "[OK] Code updated."

# ---- Inject secrets from OCI Vault env file ----
echo ""
echo "[2/5] Injecting secrets from ${ENV_SOURCE}..."
cp "${ENV_SOURCE}" .env
chmod 600 .env
echo "[OK] Secrets injected into .env"

# ---- Build images ----
echo ""
echo "[3/5] Building Docker images..."
docker compose build --no-cache
echo "[OK] Images built."

# ---- Stop old containers ----
echo ""
echo "[4/5] Stopping old containers..."
docker compose down
echo "[OK] Old containers stopped."

# ---- Start new containers ----
echo ""
echo "[5/5] Starting containers..."
docker compose up -d
echo "[OK] Containers started."

# ---- Cleanup .env from repo dir immediately (secrets only live in /etc/forsic/) ----
rm -f .env
echo "[SECURITY] .env removed from repo directory after startup."

# ---- Health check ----
echo ""
echo "Waiting 30s for services to become healthy..."
sleep 30

echo "Container status:"
docker compose ps

echo ""
echo "Backend health:"
curl -sf http://localhost:8080/actuator/health || echo "[WARN] Backend not yet healthy — check logs"

echo ""
echo "======================================================"
echo " Deployment complete!"
echo " App should be live at https://YOUR_DOMAIN"
echo "======================================================"
