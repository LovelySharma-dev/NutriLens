@echo off
cd /d "%~dp0"

echo ========================================
echo NutriLens - Starting Local Stack
echo ========================================
echo.
echo API  : http://localhost:4000
echo ML   : http://localhost:8000
echo OCR  : http://localhost:8001
echo Web  : http://localhost:3000
echo.
echo Four separate windows will be opened.
echo Close those windows to stop the services.
echo.

start "NutriLens API" cmd /k call "%~dp0run-api.cmd"
start "NutriLens ML" cmd /k call "%~dp0run-ml.cmd"
start "NutriLens OCR" cmd /k call "%~dp0run-ocr.cmd"
start "NutriLens Web" cmd /k call "%~dp0run-web.cmd"

echo Services launched.
timeout /t 3 >nul
exit /b 0
