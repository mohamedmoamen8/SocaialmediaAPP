# Run once as Administrator to install MongoDB as a Windows service (starts on boot).
# Usage: Right-click PowerShell -> Run as administrator, then:
#   cd D:\SOCIALMEDIAAPP
#   .\scripts\setup-mongodb-service.ps1

$ErrorActionPreference = 'Stop'

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  Write-Host 'Re-run this script in an elevated (Administrator) PowerShell window.' -ForegroundColor Red
  exit 1
}

$mongod = (Get-Command mongod -ErrorAction Stop).Source
$mongoRoot = Split-Path (Split-Path $mongod -Parent) -Parent
$configPath = Join-Path $PSScriptRoot 'mongodb\mongod.cfg'
$dataPath = Join-Path $mongoRoot 'data'
$logPath = Join-Path $mongoRoot 'log'

New-Item -ItemType Directory -Force -Path $dataPath, $logPath | Out-Null

if (-not (Test-Path $configPath)) {
  @"
systemLog:
  destination: file
  path: $($logPath -replace '\\', '/')
  logAppend: true
storage:
  dbPath: $($dataPath -replace '\\', '/')
net:
  bindIp: 127.0.0.1
  port: 27017
"@ | Set-Content -Path $configPath -Encoding UTF8
}

$serviceName = 'MongoDB'
$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($existing) {
  Write-Host "Service '$serviceName' already exists (status: $($existing.Status))." -ForegroundColor Yellow
} else {
  Write-Host "Installing MongoDB service from: $mongod"
  & $mongod --config $configPath --install --serviceName $serviceName --serviceDisplayName 'MongoDB Server'
}

Set-Service -Name $serviceName -StartupType Automatic
Start-Service -Name $serviceName

Write-Host ''
Write-Host "MongoDB service is running and set to start automatically on boot." -ForegroundColor Green
Write-Host "Commands:"
Write-Host "  net start MongoDB   # start manually"
Write-Host "  net stop MongoDB    # stop manually"
Write-Host "  Get-Service MongoDB # check status"
