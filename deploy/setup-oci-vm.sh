#!/usr/bin/env bash
# ==============================================================================
# deploy/setup-oci-vm.sh
# ONE-TIME server setup script. Run as root on the OCI VM.
#
# What it does:
#   - Opens firewall ports 80 and 443
#   - Creates deploy directory /opt/forsic
#   - Clones your GitHub repo
#   - Creates /etc/forsic/ for secrets storage
#
# Usage:
#   ssh user@YOUR_VM_IP
#   sudo bash <(curl -sL https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/deploy/setup-oci-vm.sh)
#   OR copy the file to the VM and run:
#   sudo bash deploy/setup-oci-vm.sh
# ==============================================================================
set -euo pipefail

GITHUB_REPO="https://github.com/YOUR_ORG/YOUR_REPO.git"   # <-- Update this
DEPLOY_DIR="/opt/forsic"
SECRETS_DIR="/etc/forsic"

echo "======================================================"
echo " FORSIC — OCI VM One-Time Setup"
echo "======================================================"

# ---- Open firewall ports (OCI Linux uses iptables / firewalld) ----
echo "[*] Opening ports 80 and 443..."
if command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
  echo "[OK] firewalld rules added."
elif command -v iptables &>/dev/null; then
  iptables -I INPUT -p tcp --dport 80 -j ACCEPT
  iptables -I INPUT -p tcp --dport 443 -j ACCEPT
  # Save rules (varies by distro)
  if command -v iptables-save &>/dev/null; then
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
    iptables-save > /etc/sysconfig/iptables 2>/dev/null || true
  fi
  echo "[OK] iptables rules added."
fi
echo "[!] Also ensure OCI Security List / Network Security Group allows TCP 80 and 443 inbound."

# ---- Create secrets directory ----
echo "[*] Creating secrets directory ${SECRETS_DIR}..."
mkdir -p "${SECRETS_DIR}"
chmod 700 "${SECRETS_DIR}"
echo "[OK] ${SECRETS_DIR} created (mode 700)."

# ---- Create deploy directory and clone repo ----
echo "[*] Creating deploy directory ${DEPLOY_DIR}..."
mkdir -p "${DEPLOY_DIR}"

if [[ -d "${DEPLOY_DIR}/forsic-case-management/.git" ]]; then
  echo "[SKIP] Repo already cloned. To re-clone, delete ${DEPLOY_DIR}/forsic-case-management first."
else
  echo "[*] Cloning repo from ${GITHUB_REPO}..."
  git clone "${GITHUB_REPO}" "${DEPLOY_DIR}/forsic-case-management"
  echo "[OK] Repo cloned to ${DEPLOY_DIR}/forsic-case-management"
fi

echo ""
echo "======================================================"
echo " Setup complete! Next steps:"
echo ""
echo " 1. Fetch secrets from OCI Vault:"
echo "    cd ${DEPLOY_DIR}/forsic-case-management"
echo "    sudo bash deploy/fetch-oci-vault-secrets.sh"
echo ""
echo " 2. Issue SSL certificate:"
echo "    sudo bash deploy/certbot-init.sh YOUR_DOMAIN your@email.com"
echo ""
echo " 3. Deploy the app:"
echo "    sudo bash deploy/deploy.sh"
echo "======================================================"
