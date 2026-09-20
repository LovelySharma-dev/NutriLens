@echo off
cd /d "%~dp0services\ml"
echo Starting NutriLens ML service on http://localhost:8000
call .venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
