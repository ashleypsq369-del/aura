@echo off
title Project Aura - Shutdown
color 0C

echo.
echo ================================================
echo    STOPPING PROJECT AURA SERVICES
echo ================================================
echo.

:: Kill backend processes (Python/Uvicorn)
echo [1/2] 🛑 Stopping Backend Server...
taskkill /FI "WindowTitle eq ProjectAura-Backend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Backend stopped
) else (
    echo     ℹ Backend was not running
)

:: Kill frontend processes (Node/Vite)
echo [2/2] 🛑 Stopping Frontend Server...
taskkill /FI "WindowTitle eq ProjectAura-Frontend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Frontend stopped
) else (
    echo     ℹ Frontend was not running
)

echo.
echo ================================================
echo    ✅ PROJECT AURA STOPPED
echo ================================================
echo.
echo All services have been shut down.
echo.
echo To start again: Run START_PROJECTAURA.bat
echo.
timeout /t 5
exit
