param(
  [string]$ApiBaseUrl = 'http://localhost:8080/api',
  [string]$Identifier = ''
)

$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function ConvertTo-Utf8JsonBody {
  param([Parameter(Mandatory = $true)][object]$Value)
  $json = $Value | ConvertTo-Json -Depth 20 -Compress
  return [System.Text.Encoding]::UTF8.GetBytes($json)
}

function Get-AuthHeaders([string]$Token) {
  return @{ Authorization = "Bearer $Token" }
}

Write-Host '1. Checking API health...' -ForegroundColor Cyan
$health = Invoke-RestMethod "$ApiBaseUrl/health"
if (-not $health.success) { throw 'Health check failed.' }

if ([string]::IsNullOrWhiteSpace($Identifier)) {
  $Identifier = Read-Host 'Student code or email'
}
$passwordSecure = Read-Host 'Password' -AsSecureString
$credential = New-Object System.Management.Automation.PSCredential($Identifier, $passwordSecure)
$password = $credential.GetNetworkCredential().Password

Write-Host '2. Logging in as student...' -ForegroundColor Cyan
$login = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/auth/login" -ContentType 'application/json; charset=utf-8' -Body (ConvertTo-Utf8JsonBody @{ identifier = $Identifier; password = $password })
if (-not $login.success -or -not $login.token) { throw 'Login failed or token is missing.' }
if ($login.data.role -ne 'student') { throw "The account is not a student account: $($login.data.role)" }

$headers = Get-AuthHeaders $login.token

Write-Host '3. Loading student profile...' -ForegroundColor Cyan
$profile = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/student/profile" -Headers $headers
Write-Host "   Student: $($profile.data.studentCode) - $($profile.data.fullName)" -ForegroundColor Green
Write-Host "   Credits: $($profile.data.accumulatedWorkdays)/$($profile.data.requiredWorkdays)"

Write-Host '4. Loading events and registrations...' -ForegroundColor Cyan
$events = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/events" -Headers $headers
$registrations = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/registrations" -Headers $headers
$credits = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/credits" -Headers $headers
$history = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/student/history" -Headers $headers

Write-Host "   Eligible events: $(@($events.data).Count)"
Write-Host "   Registrations: $(@($registrations.data).Count)"
Write-Host "   Credit records: $(@($credits.data).Count)"
Write-Host "   History records: $(@($history.data).Count)"

Write-Host 'Student-role API checks passed.' -ForegroundColor Green
Write-Host 'QR scan must be tested during an event with a live QR token.' -ForegroundColor Yellow
