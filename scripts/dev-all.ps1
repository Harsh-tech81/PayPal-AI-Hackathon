# PayShield AI - Windows PowerShell Microservices & Web App Runner
$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir -or -not (Test-Path "$rootDir\package.json")) {
    $rootDir = (Get-Location).Path
}

Write-Host "[PayShield AI] Starting Microservices Ecosystem on Windows..." -ForegroundColor Cyan

Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "npx tsx services/user-service/src/index.ts"
Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "npx tsx services/transaction-service/src/index.ts"
Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "npx tsx services/verification-agent/src/index.ts"
Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "npx tsx services/risk-engine/src/index.ts"
Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "npx tsx services/alert-service/src/index.ts"
Start-Process powershell -WorkingDirectory $rootDir -ArgumentList "-NoExit", "-Command", "npx tsx services/escalation-service/src/index.ts"

Write-Host "[PayShield AI] Launching Next.js 15 Web App on Port 3000..." -ForegroundColor Green
Set-Location "$rootDir\web-app"
npm run dev
