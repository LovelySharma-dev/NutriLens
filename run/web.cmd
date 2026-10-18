@echo off
setlocal
netstat -ano | findstr "LISTENING" | findstr /C:":3000 " >nul
if not errorlevel 1 (
  echo NutriLens web is already running at http://localhost:3000
  exit /b 0
)
cd /d "%~dp0..\apps\web"
echo Starting NutriLens web at http://localhost:3000
call pnpm dev
