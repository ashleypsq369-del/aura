@echo off
title ProjectAura — Launching...
cd /d "c:\xampp\htdocs\ProjectAura_React"

REM Check if backend already running
curl -s http://127.0.0.1:8000/health >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo Backend already running - reusing
) ELSE (
    echo Starting backend...
    start /B python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level warning 2>projectaura_error.log
    timeout /t 8 /nobreak >nul
)

REM Launch the desktop window
echo Opening ProjectAura...
python projectaura_app.py
