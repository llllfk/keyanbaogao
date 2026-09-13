# Register daily Windows Task Scheduler job for basis library sync.
# Usage (from repo root, PowerShell as current user):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-basis-sync-task.ps1
#
# Optional:
#   -TaskName "KeyanBasisSync"
#   -Time "02:00"

param(
  [string]$TaskName = "KeyanBasisSync",
  [string]$Time = "02:00"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $Pnpm) {
  Write-Error "pnpm not found in PATH. Install pnpm first."
}

$Action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -Command `"Set-Location '$RepoRoot'; pnpm basis:sync`"" `
  -WorkingDirectory "$RepoRoot"

$Trigger = New-ScheduledTaskTrigger -Daily -At $Time
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Settings $Settings `
  -Description "Sync keyanbaogao basis library from allowlisted official list pages (metadata only)." `
  -Force | Out-Null

Write-Host "OK: Scheduled task '$TaskName' runs daily at $Time"
Write-Host "Repo: $RepoRoot"
Write-Host "Command: pnpm basis:sync"
Write-Host "Check: schtasks /Query /TN $TaskName"
Write-Host "Remove: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
