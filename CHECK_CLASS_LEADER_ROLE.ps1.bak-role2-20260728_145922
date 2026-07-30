param(
  [string]$ApiBaseUrl = "http://localhost:8080/api",
  [string]$Identifier = "classleader@dthu.edu.vn"
)

$ErrorActionPreference = "Stop"
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function ConvertTo-Utf8JsonBody {
  param([Parameter(Mandatory = $true)] [object]$Value)
  $json = $Value | ConvertTo-Json -Depth 20 -Compress
  return [System.Text.Encoding]::UTF8.GetBytes($json)
}

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)] [string]$Method,
    [Parameter(Mandatory = $true)] [string]$Uri,
    [hashtable]$Headers,
    [object]$Body
  )
  $params = @{
    Method = $Method
    Uri = $Uri
    ContentType = "application/json; charset=utf-8"
  }
  if ($Headers) { $params.Headers = $Headers }
  if ($null -ne $Body) { $params.Body = ConvertTo-Utf8JsonBody -Value $Body }
  return Invoke-RestMethod @params
}

Write-Host "[1/8] Kiem tra API health..." -ForegroundColor Cyan
$health = Invoke-RestMethod "$ApiBaseUrl/health"
if (-not $health.success) { throw "API health khong thanh cong." }

$inputIdentifier = Read-Host "Email hoac ma sinh vien cua can bo lop [$Identifier]"
if (-not [string]::IsNullOrWhiteSpace($inputIdentifier)) { $Identifier = $inputIdentifier.Trim() }
$securePassword = Read-Host "Mat khau cua $Identifier" -AsSecureString
$credential = New-Object System.Management.Automation.PSCredential($Identifier, $securePassword)
$password = $credential.GetNetworkCredential().Password

Write-Host "[2/8] Dang nhap..." -ForegroundColor Cyan
$login = Invoke-JsonRequest -Method "Post" -Uri "$ApiBaseUrl/auth/login" -Body @{
  identifier = $Identifier
  password = $password
}
if (-not $login.success -or -not $login.token) { throw "Dang nhap that bai hoac API khong tra token." }
if ($login.data.role -ne "classleader") {
  throw "Tai khoan dang co role [$($login.data.role)], khong phai classleader. Hay phan cong tai /admin/class-leaders va dang nhap lai."
}
$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "[3/8] Kiem tra ho so can bo lop..." -ForegroundColor Cyan
$profile = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/class-leader/profile" -Headers $headers
if (-not $profile.data.classId) { throw "Tai khoan chua co managed_class_id." }
Write-Host "Lop: $($profile.data.classCode) - $($profile.data.className)" -ForegroundColor Green

Write-Host "[4/8] Kiem tra dashboard..." -ForegroundColor Cyan
$dashboard = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/class-leader/dashboard" -Headers $headers
Write-Host "So sinh vien: $($dashboard.data.totals.students)" -ForegroundColor Green

Write-Host "[5/8] Kiem tra danh sach su kien..." -ForegroundColor Cyan
$events = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/class-leader/events" -Headers $headers
Write-Host "So su kien phu hop: $(@($events.data).Count)" -ForegroundColor Green

Write-Host "[6/8] Kiem tra sinh vien trong lop..." -ForegroundColor Cyan
$students = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/class-leader/students" -Headers $headers
Write-Host "So sinh vien doc duoc: $(@($students.data).Count)" -ForegroundColor Green

Write-Host "[7/8] Kiem tra API bao cao CSV..." -ForegroundColor Cyan
$csvResponse = Invoke-WebRequest -Method Get -Uri "$ApiBaseUrl/class-leader/reports/work-credits.csv" -Headers $headers
if ($csvResponse.StatusCode -ne 200) { throw "Khong tai duoc CSV." }
if (-not ($csvResponse.Headers['Content-Type'] -match 'text/csv')) { throw "API bao cao khong tra text/csv." }
Write-Host "CSV hop le." -ForegroundColor Green

Write-Host "[8/8] Kiem tra can bo lop bi chan sua ngay cong..." -ForegroundColor Cyan
$forbidden = $false
try {
  Invoke-JsonRequest -Method "Put" -Uri "$ApiBaseUrl/credits/999999/status" -Headers $headers -Body @{ status = "RECORDED" } | Out-Null
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  if ($statusCode -eq 403) { $forbidden = $true }
}
if (-not $forbidden) { throw "API sua ngay cong khong tra 403 cho role classleader." }
Write-Host "Role classleader bi chan sua ngay cong dung nhu yeu cau." -ForegroundColor Green

Write-Host "ROLE 2 CLASS_LEADER HOAT DONG DUNG." -ForegroundColor Green
