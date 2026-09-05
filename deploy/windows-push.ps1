# ==============================================================================
# deploy/windows-push.ps1
# Run from Windows PowerShell to push code to GitHub.
# After pushing, SSH into your OCI VM and run deploy.sh
#
# Usage:
#   cd C:\Users\vedan\Documents\...\forsic-case-management
#   .\deploy\windows-push.ps1 -CommitMessage "your message" -VMUser opc -VMHost YOUR_VM_IP
# ==============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "chore: deployment update $(Get-Date -Format 'yyyy-MM-dd HH:mm')",

    [Parameter(Mandatory=$false)]
    [string]$Branch = "main",

    [Parameter(Mandatory=$false)]
    [string]$VMUser = "opc",

    [Parameter(Mandatory=$false)]
    [string]$VMHost = "YOUR_VM_IP"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " FORSIC — Push & Deploy to OCI VM" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# ---- Step 1: Git status ----
Write-Host ""
Write-Host "[1/3] Git status..." -ForegroundColor Yellow
Set-Location $ProjectRoot
git status

# ---- Step 2: Add, commit, push ----
Write-Host ""
Write-Host "[2/3] Committing and pushing to GitHub ($Branch)..." -ForegroundColor Yellow
git add -A
git commit -m $CommitMessage
git push origin $Branch
Write-Host "[OK] Code pushed to GitHub." -ForegroundColor Green

# ---- Step 3: Print SSH deploy command ----
Write-Host ""
Write-Host "[3/3] SSH into your OCI VM and run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ssh ${VMUser}@${VMHost}" -ForegroundColor White
Write-Host "  cd /opt/forsic/forsic-case-management" -ForegroundColor White
Write-Host "  sudo bash deploy/deploy.sh" -ForegroundColor White
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " Push complete! App will update after you run deploy.sh on the VM." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
