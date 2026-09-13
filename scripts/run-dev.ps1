# Local dev start on port 5000; kill listeners first if occupied.
# Resolves project root via $PSScriptRoot (safe with Chinese paths).
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-dev.ps1
#   or double-click 启动.bat
#   or pnpm dev:win

$ErrorActionPreference = "Stop"

try {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

$Port = 5000
if ($env:DEPLOY_RUN_PORT) {
  $Port = [int]$env:DEPLOY_RUN_PORT
} elseif ($env:PORT) {
  $Port = [int]$env:PORT
}

$Workspace = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $Workspace "package.json"))) {
  Write-Error "package.json not found. Bad script location: $Workspace"
  exit 1
}

Set-Location -LiteralPath $Workspace
Write-Host "Workspace: $Workspace"
Write-Host "Port: $Port"

function Stop-PortListeners([int] $ListenPort) {
  $pids = New-Object "System.Collections.Generic.HashSet[int]"

  try {
    $conns = Get-NetTCPConnection -LocalPort $ListenPort -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
      if ($c.OwningProcess -gt 0) {
        [void]$pids.Add([int]$c.OwningProcess)
      }
    }
  } catch {}

  if ($pids.Count -eq 0) {
    $lines = & netstat.exe -ano -p tcp 2>$null | Select-String ":$ListenPort\s"
    foreach ($line in $lines) {
      $text = $line.ToString()
      if ($text -notmatch "LISTENING") {
        continue
      }
      if ($text -match "\s(\d+)\s*$") {
        $procId = [int]$Matches[1]
        if ($procId -gt 0) {
          [void]$pids.Add($procId)
        }
      }
    }
  }

  if ($pids.Count -eq 0) {
    Write-Host "Port $ListenPort is free."
    return
  }

  foreach ($procId in $pids) {
    Write-Host "Port $ListenPort in use by PID $procId, killing..."
    & taskkill.exe /PID $procId /T /F 2>$null | Out-Null
  }

  Start-Sleep -Seconds 1

  $left = @()
  try {
    $left = @(Get-NetTCPConnection -LocalPort $ListenPort -State Listen -ErrorAction SilentlyContinue)
  } catch {}
  if ($left.Count -gt 0) {
    Write-Error "Port $ListenPort still busy. Kill the process manually and retry."
    exit 1
  }
  Write-Host "Port $ListenPort cleared."
}

Stop-PortListeners $Port

$env:PORT = "$Port"
$env:HOSTNAME = if ($env:HOSTNAME) { $env:HOSTNAME } else { "localhost" }

Write-Host "Starting: http://$($env:HOSTNAME):$Port"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

& pnpm.cmd exec tsx watch src/server.ts
exit $LASTEXITCODE