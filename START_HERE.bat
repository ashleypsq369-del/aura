@echo off
chcp 65001 >nul
title Project Aura - Setup
color 0A
echo.
echo  ================================================
echo   PROJECT AURA - First Run Setup + Launch
echo  ================================================
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found.
    echo  Install Python 3.10+ from https://python.org
    echo  Check "Add Python to PATH" during install.
    pause & exit /b 1
)
echo  [OK] Python found.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
echo  [OK] Node.js found.
echo.

:: Install Python packages only if missing
python -c "import fastapi, uvicorn, sqlalchemy" >nul 2>&1
if errorlevel 1 (
    echo  Installing Python packages (first run only)...
    pip install -r "%BACKEND%\requirements.txt" --quiet
    echo  [OK] Python packages installed.
) else (
    echo  [OK] Python packages already installed.
)
echo.

:: Install Node packages only if missing
if not exist "%FRONTEND%\node_modules\vite" (
    echo  Installing frontend packages (first run only)...
    cd /d "%FRONTEND%"
    npm install
    echo  [OK] Frontend packages installed.
) else (
    echo  [OK] Frontend packages already installed.
)
echo.

:: Seed database if new
cd /d "%BACKEND%"
if not exist "%BACKEND%\aura.db" (
    echo  Creating database with demo data...
    python seed_medical_db.py
    echo  [OK] Database ready.
) else (
    echo  [OK] Database found.
)
echo.

:: Kill anything on ports 8000/5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

:: Start backend
echo  Starting backend server...
start "Aura Backend - DO NOT CLOSE" cmd /k "cd /d "%BACKEND%" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level warning"

:: Wait for backend
echo  Waiting for backend...
:WAIT_B
timeout /t 2 /nobreak >nul
python -c "import socket; s=socket.socket(); s.settimeout(1); r=s.connect_ex(('127.0.0.1',8000)); s.close(); exit(r)" >nul 2>&1
if errorlevel 1 goto WAIT_B
echo  [OK] Backend ready.
echo.

:: Start frontend
echo  Starting frontend...
start "Aura Frontend - DO NOT CLOSE" cmd /k "cd /d "%FRONTEND%" && npm run dev"

:: Fixed wait for Vite
echo  Opening Chrome in 15 seconds...
timeout /t 15 /nobreak >nul

:: Open Chrome directly
if exist "%CHROME%" (
    "%CHROME%" "http://localhost:5173"
) else (
    powershell -command "Start-Process 'http://localhost:5173'"
)

echo.
echo  ================================================
echo   Project Aura is running!
echo.
echo   URL:     http://localhost:5173
echo   Admin:   admin / admin123
echo   Patient: patient / patient123
echo  ================================================
echo.
pause
