@echo off
title ProjectAura Launcher
color 0A

REM This launches the PowerShell script that starts both Backend and Frontend

cd /d "c:\xampp\htdocs\ProjectAura_React"

echo.
echo ========================================
echo    LAUNCHING PROJECTAURA...
echo ========================================
echo.
echo Starting Backend + Frontend in new windows...
echo.

REM Launch PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "Start-ProjectAura.ps1"

exit
