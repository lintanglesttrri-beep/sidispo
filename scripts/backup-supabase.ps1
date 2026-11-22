# Skrip Backup Basis Data Supabase untuk SIDISPO (PRD §6: Ketersediaan & Pencadangan)
# Prasyarat: pg_dump terpasang (PostgreSQL client tools) dan DIRECT_URL terisi di .env.local
# Jalankan: powershell -ExecutionPolicy Bypass -File scripts\backup-supabase.ps1

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Error "File .env.local tidak ditemukan."
    exit 1
}

$directUrl = $null
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^DIRECT_URL\s*=\s*"?([^"]+)"?$') {
        $directUrl = $Matches[1].Trim()
    }
}

if (-not $directUrl) {
    Write-Error "DIRECT_URL tidak ditemukan di .env.local."
    exit 1
}

$backupDir = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $backupDir "sidispo_db_$timestamp.sql"

Write-Host "Menjalankan backup database SIDISPO ke $outFile ..."
& pg_dump "$directUrl" --no-owner --no-acl -f "$outFile"

Write-Host "Backup selesai: $outFile"
