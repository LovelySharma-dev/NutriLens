@echo off
cd /d "%~dp0web"
echo Starting NutriLens frontend on http://localhost:3000
call pnpm dev
