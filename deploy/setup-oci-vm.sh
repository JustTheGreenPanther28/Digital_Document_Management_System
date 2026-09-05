#!/usr/bin/env bash
# ==============================================================================
# deploy/setup-oci-vm.sh
# ONE-TIME server setup script. Run as root on the OCI VM.
#
# What it does:
#   - Opens firewall ports 80 and 443
#   - Creates /etc/forsic/ for secrets (mode 700)
#   - Clones your GitHub repo to /opt/forsic/
#
# Usage (copy to VM and run OR paste directly):
#   ssh USER@YOUR_VM_IP "sudo bash -s" < deploy/setup-oci-vm.sh
#
# OR on the VM:
#   sudo bash deploy/setup-oci-vm.sh
# ==============================================================================
set -euo pipefail

# ---- UPDATE THIS LINE with your GitHub repo URL ----
GITHUB_REPO="https://github.com/YOUR_ORG/YOUR_REPO.git"

DEPLOY_DIR="/opt/forsic"
SECRETS_DIR="/etc/forsic"

echo "======================================================"
echo " FORSIC — OCI VM One-Time Setup"
echo "======================================================"

# ---- Open firewall ports ----
echo "[*] Opening ports 80 (HTTP) and 443 (HTTPS)..."

if command -v firewall-cmd &>/dev/null; then
  # Oracle Linux / RHEL / CentOS
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
  echo "[OK] firewalld rules added."
elif command -v ufw &>/dev/null; then
  # Ubuntu
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 22/tcp
  ufw --force enable
  echo "[OK] ufw rules added."
elif command -v iptables &>/dev/null; then
  # Fallback
  iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
  iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
  echo "[OK] iptables rules added."
fi

echo ""
echo "[!] IMPORTANT: Also add inbound rules in OCI Console:"
echo "    Networking → VCN → Security List → Add Ingress Rule"
echo "    TCP port 80  from 0.0.0.0/0"
echo "    TCP port 443 from 0.0.0.0/0"

# ---- Create secrets directory ----
echo ""
echo "[*] Creating secrets directory ${SECRETS_DIR}..."
mkdir -p "${SECRETS_DIR}"
chmod 700 "${SECRETS_DIR}"
chown root:root "${SECRETS_DIR}"
echo "[OK] ${SECRETS_DIR} created (mode 700, owner root)."

# ---- Clone repo ----
echo ""
echo "[*] Setting up deploy directory ${DEPLOY_DIR}..."
mkdir -p "${DEPLOY_DIR}"

if [[ -d "${DEPLOY_DIR}/forsic-case-management/.git" ]]; then
  echo "[SKIP] Repo already cloned at ${DEPLOY_DIR}/forsic-case-management"
else
  echo "[*] Cloning from ${GITHUB_REPO}..."
  git clone "${GITHUB_REPO}" "${DEPLOY_DIR}/forsic-case-management"
  echo "[OK] Repo cloned."
fi

# ---- Show VM public IP ----
PUBLIC_IP=$(curl -sf ifconfig.me 2>/dev/null || echo "YOUR_VM_IP")

echo ""
echo "======================================================"
echo " Setup complete! Your VM public IP: ${PUBLIC_IP}"
echo ""
echo " Next steps:"
echo ""
echo " 1. Enter your production secrets:"
echo "    cd ${DEPLOY_DIR}/forsic-case-management"
echo "    sudo bash deploy/fetch-oci-vault-secrets.sh"
echo ""
echo " 2. Deploy the app:"
echo "    sudo bash deploy/deploy.sh"
echo ""
echo " 3. Access at:  https://${PUBLIC_IP}"
echo "    (Accept the self-signed certificate browser warning)"
echo "======================================================"
