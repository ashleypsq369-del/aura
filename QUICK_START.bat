@echo off
chcp 65001 >nul
title Project Aura
color 0A
echo.
echo  ================================================
echo   PROJECT AURA - AI Palliative Care Platform
echo  ================================================
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"

:: Kill anything already on these ports
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

:: Start backend
echo  [1/3] Starting backend...
start "Aura Backend - DO NOT CLOSE" cmd /k "cd /d "%BACKEND%" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level warning"

:: Wait for backend port 8000
echo  [2/3] Waiting for backend (may take 30-90s first launch)...
:WAIT_BACKEND
timeout /t 2 /nobreak >nul
python -c "import socket; s=socket.socket(); s.settimeout(1); r=s.connect_ex(('127.0.0.1',8000)); s.close(); exit(r)" >nul 2>&1
if errorlevel 1 goto WAIT_BACKEND
echo  [OK] Backend ready.

:: Start frontend dev server
echo  [3/3] Starting frontend...
start "Aura Frontend - DO NOT CLOSE" cmd /k "cd /d "%FRONTEND%" && npm run dev"

:: Fixed wait — Vite takes ~10-15 seconds to fully start
echo  Opening Chrome in 15 seconds...
timeout /t 15 /nobreak >nul

:: Open Chrome (force it, no default browser nonsense)
if exist "%CHROME%" (
    "%CHROME%" "http://localhost:5173"
) else (
    powershell -command "Start-Process 'http://localhost:5173'"
)

echo.
echo  ================================================
echo   Project Aura is running in Chrome!
echo.
echo   URL:     http://localhost:5173
echo   Admin:   admin / admin123
echo   Patient: patient / patient123
echo.
echo   Keep the two windows open:
echo     "Aura Backend"   port 8000
echo     "Aura Frontend"  port 5173
echo  ================================================
echo.
pause
