@echo off
title Project Aura Launcher
color 0B
cls

echo.
echo  ============================================================
echo     PROJECT AURA  -  AI Palliative Care Platform
echo     University of Ghana  2026
echo  ============================================================
echo.

set ROOT=c:\xampp\htdocs\ProjectAura_React
set BACKEND=c:\xampp\htdocs\ProjectAura_React\backend
set FRONTEND=c:\xampp\htdocs\ProjectAura_React\frontend
set NODEMODULESCHECK=c:\xampp\htdocs\ProjectAura_React\frontend\node_modules\vite

REM ── Kill leftover processes ──────────────────────────────────────────────────
echo  [0/5] Cleaning up previous servers...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
ping -n 4 127.0.0.1 >nul 2>&1
echo        Done.

REM ── Validate project paths ───────────────────────────────────────────────────
echo  [1/5] Checking project files...
if not exist "%BACKEND%\main.py" goto errbackend
if not exist "%FRONTEND%\package.json" goto errfrontend
echo        OK.
goto checknpm

:errbackend
echo  ERROR: Backend not found at %BACKEND%\main.py
pause
exit /b 1

:errfrontend
echo  ERROR: Frontend not found at %FRONTEND%\package.json
pause
exit /b 1

REM ── Install npm deps if missing ──────────────────────────────────────────────
:checknpm
echo  [2/5] Checking npm packages...
if exist "%NODEMODULESCHECK%" goto npmready
echo        First run - installing npm packages (~1 min)...
cd /d "%FRONTEND%"
npm install
cd /d "%ROOT%"
:npmready
echo        Ready.

REM ── Launch Backend ───────────────────────────────────────────────────────────
echo  [3/5] Starting Backend...
start "Aura Backend" cmd /k "title Aura Backend && cd /d %BACKEND% && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
echo        Backend window opened.

REM ── Wait for port 8000 ───────────────────────────────────────────────────────
echo  [4/5] Waiting for Backend on port 8000 (takes ~30-40s)...
:waitbackend
ping -n 3 127.0.0.1 >nul 2>&1
netstat -an 2>nul | find "0.0.0.0:8000" | find "LISTENING" >nul 2>&1
if errorlevel 1 goto waitbackend
echo        Backend READY!

REM ── Launch Frontend ──────────────────────────────────────────────────────────
echo  [5/5] Starting Frontend...
start "Aura Frontend" cmd /k "title Aura Frontend && cd /d %FRONTEND% && npm run dev"
echo        Waiting for Frontend on port 5173...

REM ── Wait for port 5173 ──────────────────────────────────────────────────────
:waitfrontend
ping -n 3 127.0.0.1 >nul 2>&1
netstat -an 2>nul | find ":5173" | find "LISTENING" >nul 2>&1
if errorlevel 1 goto waitfrontend
echo        Frontend READY!

REM ── Open browser ─────────────────────────────────────────────────────────────
ping -n 3 127.0.0.1 >nul 2>&1
echo.
echo  Opening browser...
start http://localhost:5173
echo.
echo  ============================================================
echo     PROJECT AURA IS RUNNING!
echo.
echo     Frontend : http://localhost:5173
echo     Backend  : http://localhost:8000
echo     API Docs : http://localhost:8000/docs
echo.
echo     Credentials:
echo       clinician / clinician123
echo       patient   / patient123
echo       family    / family123
echo       caregiver / caregiver123
echo       admin     / admin123
echo.
echo     Close the Backend and Frontend windows to stop servers.
echo  ============================================================
echo.
echo  Press any key to close this launcher window...
pause >nul
exit
