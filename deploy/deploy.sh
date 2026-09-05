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
echo " FORSIC Case Management — Deployment"
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

# ---- Inject secrets from /etc/forsic/.env ----
echo ""
echo "[2/5] Injecting secrets from ${ENV_SOURCE}..."
cp "${ENV_SOURCE}" .env
chmod 600 .env
echo "[OK] Secrets ready."

# ---- Build Docker images ----
echo ""
echo "[3/5] Building Docker images (this takes a few minutes)..."
docker compose build --no-cache
echo "[OK] Images built."

# ---- Stop old containers ----
echo ""
echo "[4/5] Stopping old containers..."
docker compose down
echo "[OK] Stopped."

# ---- Start new containers ----
echo ""
echo "[5/5] Starting all containers..."
docker compose up -d
echo "[OK] Containers started."

# ---- Remove .env from repo dir immediately after startup ----
rm -f .env
echo "[SECURITY] .env removed from repo directory (secrets safe in /etc/forsic/ only)."

# ---- Wait for health ----
echo ""
echo "Waiting 30s for services to become ready..."
sleep 30

echo ""
echo "Container status:"
docker compose ps

echo ""
echo "Backend health:"
curl -sf http://localhost:8080/actuator/health && echo "" || echo "[WARN] Backend not yet healthy — try: docker compose logs backend"

# ---- Show VM public IP ----
PUBLIC_IP=$(curl -sf http://169.254.169.254/opc/v2/instance/metadata 2>/dev/null \
  | grep -oP '"publicIp"\s*:\s*"\K[^"]+' | head -1 \
  || curl -sf ifconfig.me 2>/dev/null \
  || echo "YOUR_VM_IP")

echo ""
echo "======================================================"
echo " Deployment complete!"
echo ""
echo " Access the app at:"
echo "   https://${PUBLIC_IP}        (accept the self-signed cert warning)"
echo "   http://${PUBLIC_IP}         (redirects to HTTPS)"
echo ""
echo " Default login:  admin / Password@123"
echo "======================================================"
