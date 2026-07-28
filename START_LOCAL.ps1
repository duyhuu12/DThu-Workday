$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "[1/4] Kiem tra file cau hinh..." -ForegroundColor Cyan
if (-not (Test-Path ".\BE\.env")) {
  Copy-Item ".\BE\.env.example" ".\BE\.env"
  Write-Host "Da tao BE/.env. Hay nhap mat khau MySQL roi chay lai." -ForegroundColor Yellow
  notepad ".\BE\.env"
  exit 1
}
if (-not (Test-Path ".\FE\.env.local")) {
  Copy-Item ".\FE\.env.example" ".\FE\.env.local"
}

Write-Host "[2/4] Kiem tra MySQL cong 3306..." -ForegroundColor Cyan
$mysql = Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if (-not $mysql.TcpTestSucceeded) {
  Write-Host "MySQL chua hoat dong tren 127.0.0.1:3306." -ForegroundColor Red
  Write-Host "Hay khoi dong dich vu MySQL truoc." -ForegroundColor Yellow
  exit 1
}

Write-Host "[3/4] Kiem tra node_modules..." -ForegroundColor Cyan
if (-not (Test-Path ".\FE\node_modules") -or -not (Test-Path ".\BE\node_modules")) {
  npm run install:all
}

Write-Host "[4/4] Khoi dong FE va BE..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$ProjectRoot'; npm run dev"
)
Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"
