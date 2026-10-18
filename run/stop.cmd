@echo off
echo Stopping NutriLens windows...
taskkill /FI "WINDOWTITLE eq NutriLens Web*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NutriLens API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NutriLens ML*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NutriLens OCR*" /T /F >nul 2>&1

echo Stopping listeners on 3000, 4000, 8000, and 8001...
for %%P in (3000 4000 8000 8001) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr "LISTENING" ^| findstr /C:":%%P "') do (
    taskkill /PID %%A /T /F >nul 2>&1
  )
)
echo Done.
exit /b 0
