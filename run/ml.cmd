@echo off
setlocal
netstat -ano | findstr "LISTENING" | findstr /C:":8000 " >nul
if not errorlevel 1 (
  echo NutriLens ML is already running at http://localhost:8000
  exit /b 0
)
cd /d "%~dp0..\services\ml"
if not exist ".venv\Scripts\python.exe" (
  echo Create the ML virtualenv first:
  echo   cd services\ml
  echo   python -m venv .venv
  echo   .venv\Scripts\python.exe -m pip install -r requirements.txt
  exit /b 1
)
echo Starting NutriLens ML at http://localhost:8000
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
