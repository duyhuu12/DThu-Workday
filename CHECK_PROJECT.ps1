$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$checks = @(
  @{ Name = "FE package"; Path = ".\FE\package.json" },
  @{ Name = "FE app"; Path = ".\FE\app" },
  @{ Name = "BE package"; Path = ".\BE\package.json" },
  @{ Name = "BE source"; Path = ".\BE\src" },
  @{ Name = "Prisma schema"; Path = ".\BE\prisma\schema.prisma" },
  @{ Name = "BE env"; Path = ".\BE\.env" },
  @{ Name = "FE env"; Path = ".\FE\.env.local" }
)

foreach ($check in $checks) {
  if (Test-Path $check.Path) {
    Write-Host "[OK] $($check.Name)" -ForegroundColor Green
  } else {
    Write-Host "[THIEU] $($check.Name): $($check.Path)" -ForegroundColor Red
  }
}

Write-Host "`nMySQL 3306:" -ForegroundColor Cyan
Test-NetConnection 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue |
  Select-Object ComputerName, RemotePort, TcpTestSucceeded

Write-Host "`nBackend 8080:" -ForegroundColor Cyan
try {
  Invoke-RestMethod "http://localhost:8080/api/health" | Format-List
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Yellow
}
