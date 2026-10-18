@echo off
echo NutriLens health
echo.
echo Web  http://localhost:3000
curl.exe -s -m 5 -o NUL -w "  HTTP %%{http_code}\n" http://localhost:3000
echo API  http://localhost:4000/health
curl.exe -s -m 5 http://localhost:4000/health
echo.
echo ML   http://localhost:8000/health
curl.exe -s -m 5 http://localhost:8000/health
echo.
echo OCR  http://localhost:8001/health
curl.exe -s -m 5 http://localhost:8001/health
echo.
exit /b 0
