@echo off
title ProjectAura - Start Frontend Manually
color 0B

echo.
echo ========================================
echo    STARTING FRONTEND MANUALLY
echo ========================================
echo.

cd /d "c:\xampp\htdocs\ProjectAura_React\frontend"

echo Checking for node_modules...
if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
)

echo.
echo ✅ Starting React + Vite...
echo ----------------------------------------
npm run dev

pause
