$ErrorActionPreference = "Stop"

$workspacePath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$composeFile = Join-Path $workspacePath "compose.postgres.yml"
$databaseUrl = if ($env:VILLAKU_DATABASE_URL) {
  $env:VILLAKU_DATABASE_URL
} else {
  "postgresql://postgres:postgres@127.0.0.1:5432/villaku?schema=public"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker tidak ditemukan. Instal atau jalankan Docker Desktop terlebih dahulu."
}

try {
  & docker info --format "{{.ServerVersion}}" | Out-Null
} catch {
  throw "Docker Desktop belum aktif. Jalankan Docker Desktop, lalu ulangi perintah ini."
}
if ($LASTEXITCODE -ne 0) {
  throw "Docker Desktop belum aktif. Jalankan Docker Desktop, lalu ulangi perintah ini."
}

$devProcesses = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq "node.exe" -and
  $_.CommandLine -like "*$workspacePath*" -and
  ($_.CommandLine -match "vinext[\\/]dist[\\/]cli\.js.*dev" -or $_.CommandLine -match "cross-env.*vinext dev")
}
if ($devProcesses) {
  Write-Host "Menghentikan sementara dev server VillaKu agar Prisma Client tidak terkunci..." -ForegroundColor Yellow
  $devProcesses | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 800
}

Write-Host "Menjalankan PostgreSQL..." -ForegroundColor Cyan
& docker compose -f $composeFile up -d
if ($LASTEXITCODE -ne 0) { throw "Container PostgreSQL gagal dijalankan." }

Write-Host "Menunggu PostgreSQL siap menerima koneksi..." -ForegroundColor Cyan
$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  $health = & docker inspect --format "{{.State.Health.Status}}" villaku-postgres 2>$null
  if ($health -eq "healthy") {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}
if (-not $ready) { throw "PostgreSQL belum sehat setelah 60 detik. Periksa: docker logs villaku-postgres" }

$env:DATABASE_URL = $databaseUrl

Write-Host "Menyinkronkan schema Prisma ke PostgreSQL..." -ForegroundColor Cyan
& npx prisma db push --accept-data-loss --skip-generate
if ($LASTEXITCODE -ne 0) { throw "Sinkronisasi schema Prisma gagal." }

Write-Host "Membuat Prisma Client..." -ForegroundColor Cyan
& npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "Prisma generate gagal." }

Write-Host "Mengisi role, permission, dan akun awal..." -ForegroundColor Cyan
& node prisma/seed.mjs
if ($LASTEXITCODE -ne 0) { throw "Database seed gagal." }

Write-Host "PostgreSQL VillaKu siap di 127.0.0.1:5432/villaku" -ForegroundColor Green
Write-Host "Jalankan backend dengan: npm run dev" -ForegroundColor Green
