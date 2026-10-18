@echo off
cd /d "%~dp0.."
echo ========================================
echo NutriLens local stack
echo ========================================
echo Web  http://localhost:3000
echo API  http://localhost:4000
echo ML   http://localhost:8000
echo OCR  http://localhost:8001
echo.
echo Each service opens its own window.
echo A service that is already listening stays as it is.
echo Close a window to stop that service, or run stop.cmd.
echo.
start "NutriLens Web" cmd /k call "%~dp0web.cmd"
start "NutriLens API" cmd /k call "%~dp0api.cmd"
start "NutriLens ML" cmd /k call "%~dp0ml.cmd"
start "NutriLens OCR" cmd /k call "%~dp0ocr.cmd"
echo Launched.
exit /b 0
