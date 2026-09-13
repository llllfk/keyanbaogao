@echo off
REM Start local dev on port 5000; kill occupied port first.
REM %~dp0 is project root (safe with Chinese path).
chcp 65001 >nul
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-dev.ps1"
if errorlevel 1 (
  echo.
  echo Start failed. See errors above.
  pause
  exit /b 1
)
