@echo off
cd /d "%~dp0.."
if "%~1"=="" (
  echo Usage:
  echo   run\test-ocr.cmd "D:\path\to\label.jpg"
  exit /b 1
)
echo Sending the image to http://localhost:4000/api/v1/ocr/extract
curl.exe -s -X POST "http://localhost:4000/api/v1/ocr/extract" -F "file=@%~1"
echo.
exit /b 0
