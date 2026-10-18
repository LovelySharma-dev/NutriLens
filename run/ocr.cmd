@echo off
setlocal
netstat -ano | findstr "LISTENING" | findstr /C:":8001 " >nul
if not errorlevel 1 (
  echo NutriLens OCR is already running at http://localhost:8001
  exit /b 0
)
cd /d "%~dp0..\services\ocr"
if not exist ".venv\Scripts\python.exe" (
  echo Create the OCR virtualenv first:
  echo   cd services\ocr
  echo   python -m venv .venv
  echo   .venv\Scripts\python.exe -m pip install -r requirements.txt
  exit /b 1
)
echo Starting NutriLens OCR at http://localhost:8001
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
