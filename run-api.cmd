@echo off
cd /d "%~dp0services\api"
echo Starting NutriLens API on http://localhost:4000
call pnpm dev
