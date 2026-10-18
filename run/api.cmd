@echo off
setlocal
netstat -ano | findstr "LISTENING" | findstr /C:":4000 " >nul
if not errorlevel 1 (
  echo NutriLens API is already running at http://localhost:4000
  exit /b 0
)
cd /d "%~dp0..\services\api"
echo Starting NutriLens API at http://localhost:4000
call pnpm dev
