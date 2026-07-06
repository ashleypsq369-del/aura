@echo off
title ProjectAura - Stop All
color 0C

echo.
echo ========================================
echo    STOPPING PROJECTAURA...
echo ========================================
echo.

echo [1/2] Stopping Frontend...
taskkill /FI "WINDOWTITLE eq ProjectAura-Frontend*" /F >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend stopped
) else (
    echo ⚠️  Frontend was not running
)

echo [2/2] Stopping Backend...
taskkill /FI "WINDOWTITLE eq ProjectAura-Backend*" /F >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend stopped
) else (
    echo ⚠️  Backend was not running
)

echo.
echo ========================================
echo    ✅ ALL STOPPED!
echo ========================================
echo.
timeout /t 3
exit
