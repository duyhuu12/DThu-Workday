param(
  [string]$ApiBaseUrl = "http://localhost:8080/api",
  [string]$Email = "admin@dthu.edu.vn"
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
    Method      = $Method
    Uri         = $Uri
    ContentType = "application/json; charset=utf-8"
  }

  if ($Headers) {
    $params.Headers = $Headers
  }

  if ($null -ne $Body) {
    $params.Body = ConvertTo-Utf8JsonBody -Value $Body
  }

  return Invoke-RestMethod @params
}

Write-Host "Kiểm tra API health..." -ForegroundColor Cyan
$health = Invoke-RestMethod "$ApiBaseUrl/health"
if (-not $health.success) {
  throw "API health không thành công."
}

$securePassword = Read-Host "Mật khẩu của $Email" -AsSecureString
$credential = New-Object System.Management.Automation.PSCredential($Email, $securePassword)
$password = $credential.GetNetworkCredential().Password

$login = Invoke-JsonRequest `
  -Method "Post" `
  -Uri "$ApiBaseUrl/auth/login" `
  -Body @{
    email    = $Email
    password = $password
  }

if (-not $login.success -or -not $login.token) {
  throw "Đăng nhập thất bại hoặc API không trả token."
}

$headers = @{
  Authorization = "Bearer $($login.token)"
}

$code = "TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
$createdName = "Khoa kiểm tra CRUD"
$updatedName = "Khoa kiểm tra CRUD đã sửa"
$id = $null

try {
  Write-Host "Tạo khoa thử nghiệm $code..." -ForegroundColor Cyan

  $created = Invoke-JsonRequest `
    -Method "Post" `
    -Uri "$ApiBaseUrl/system/faculties" `
    -Headers $headers `
    -Body @{
      code = $code
      name = $createdName
    }

  $id = [string]$created.data.id

  if ([string]::IsNullOrWhiteSpace($id)) {
    throw "API tạo khoa không trả về ID."
  }

  Write-Host "Đã tạo ID $id" -ForegroundColor Green

  Write-Host "Cập nhật khoa..." -ForegroundColor Cyan

  $updated = Invoke-JsonRequest `
    -Method "Put" `
    -Uri "$ApiBaseUrl/system/faculties/$id" `
    -Headers $headers `
    -Body @{
      code = $code
      name = $updatedName
    }

  $actualUpdatedName = [string]$updated.data.name
  Write-Host "Tên API trả về: [$actualUpdatedName]" -ForegroundColor DarkGray

  if ($actualUpdatedName -cne $updatedName) {
    throw "API trả dữ liệu cập nhật không đúng. Mong đợi=[$updatedName], thực tế=[$actualUpdatedName]"
  }

  Write-Host "API cập nhật thành công." -ForegroundColor Green

  $faculties = Invoke-RestMethod `
    -Method Get `
    -Uri "$ApiBaseUrl/system/faculties"

  $found = $faculties.data |
    Where-Object { [string]$_.id -eq $id } |
    Select-Object -First 1

  if (-not $found) {
    throw "Không đọc lại được bản ghi vừa tạo từ database."
  }

  $databaseName = [string]$found.name
  $databaseCode = [string]$found.code

  Write-Host "Tên đọc lại từ DB: [$databaseName]" -ForegroundColor DarkGray
  Write-Host "Mã đọc lại từ DB:  [$databaseCode]" -ForegroundColor DarkGray

  if ($databaseName -cne $updatedName -or $databaseCode -cne $code) {
    throw "Dữ liệu đọc lại từ database không khớp dữ liệu đã cập nhật."
  }

  Write-Host "Đọc lại từ database thành công." -ForegroundColor Green
}
finally {
  if ($id) {
    Write-Host "Xóa dữ liệu thử nghiệm..." -ForegroundColor Cyan

    Invoke-RestMethod `
      -Method Delete `
      -Uri "$ApiBaseUrl/system/faculties/$id" `
      -Headers $headers |
      Out-Null

    Write-Host "Đã xóa dữ liệu thử nghiệm." -ForegroundColor Green
  }
}

Write-Host "CRUD MySQL hoạt động bình thường." -ForegroundColor Green

