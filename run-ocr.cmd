@echo off
cd /d "%~dp0services\ocr"
echo Starting NutriLens OCR service on http://localhost:8001
call .venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
