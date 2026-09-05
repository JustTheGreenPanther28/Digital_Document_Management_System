#!/usr/bin/env bash
# ==============================================================================
# deploy/certbot-init.sh
# One-time Let's Encrypt certificate issuance for your domain.
# Run BEFORE starting docker containers (needs port 80 free).
#
# Usage:
#   sudo bash deploy/certbot-init.sh your-domain.com your@email.com
# ==============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [[ -z "${DOMAIN}" || -z "${EMAIL}" ]]; then
  echo "Usage: sudo bash deploy/certbot-init.sh <domain> <email>"
  echo "  e.g. sudo bash deploy/certbot-init.sh forsic.example.com admin@example.com"
  exit 1
fi

echo "======================================================"
echo " FORSIC — Let's Encrypt Certificate Setup"
echo " Domain: ${DOMAIN}"
echo " Email:  ${EMAIL}"
echo "======================================================"

# ---- Install Certbot if not present ----
if ! command -v certbot &>/dev/null; then
  echo "[*] Installing Certbot..."
  if command -v apt-get &>/dev/null; then
    apt-get update -q
    apt-get install -y -q certbot
  elif command -v yum &>/dev/null; then
    yum install -y certbot
  else
    echo "[ERROR] Cannot install Certbot — unsupported package manager."
    exit 1
  fi
fi

# ---- Stop containers if running (port 80 must be free for standalone challenge) ----
REPO_DIR="/opt/forsic/forsic-case-management"
if [[ -f "${REPO_DIR}/docker-compose.yml" ]]; then
  echo "[*] Stopping containers to free port 80..."
  cd "${REPO_DIR}"
  docker compose down 2>/dev/null || true
fi

# ---- Issue certificate ----
echo "[*] Requesting certificate from Let's Encrypt..."
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  -d "${DOMAIN}"

echo "[OK] Certificate issued at /etc/letsencrypt/live/${DOMAIN}/"

# ---- Update nginx.conf with real domain ----
echo "[*] Patching nginx.conf with domain: ${DOMAIN}"
NGINX_CONF="${REPO_DIR}/frontend/nginx.conf"
if [[ -f "${NGINX_CONF}" ]]; then
  sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" "${NGINX_CONF}"
  echo "[OK] nginx.conf updated."
else
  echo "[WARN] nginx.conf not found at ${NGINX_CONF} — update YOUR_DOMAIN manually."
fi

# ---- Setup auto-renewal cron ----
echo "[*] Setting up auto-renewal cron..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker compose -f ${REPO_DIR}/docker-compose.yml restart frontend") \
  | crontab -
echo "[OK] Auto-renewal cron added (runs daily at 3 AM)."

echo ""
echo "======================================================"
echo " Certificate ready! Now run:  sudo bash deploy/deploy.sh"
echo "======================================================"
