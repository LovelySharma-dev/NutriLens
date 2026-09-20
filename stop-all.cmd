@echo off
echo Stopping local NutriLens development services...

taskkill /FI "WINDOWTITLE eq NutriLens API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NutriLens ML*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NutriLens OCR*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NutriLens Web*" /T /F >nul 2>&1

echo Done.
pause
