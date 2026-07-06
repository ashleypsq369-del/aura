@echo off
setlocal enabledelayedexpansion
title ProjectAura - All-in-One Launcher
color 0A

echo.
echo ========================================
echo    PROJECT AURA - STARTING...
echo ========================================
echo.

cd /d "c:\xampp\htdocs\ProjectAura_React"

REM Check database
if exist "aura.db" (
    echo [1/3] ✅ Database: aura.db found
) else (
    echo [1/3] ⚠️  Database will be created
)

REM Start Backend in minimized window (runs in background)
echo [2/3] 🚀 Starting Backend...
cd backend
start /MIN "ProjectAura-Backend" cmd /c "venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8000"
cd ..

REM Wait for backend
timeout /t 8 /nobreak >nul

REM Start Frontend in minimized window (runs in background)
echo [3/3] 🚀 Starting Frontend...
cd frontend
start /MIN "ProjectAura-Frontend" cmd /c "npm run dev"
cd ..

REM Wait for frontend
timeout /t 10 /nobreak >nul

REM Open browser
echo.
echo ✅ Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo    ✅ PROJECTAURA IS RUNNING!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Login: clinician / clinician123
echo.
echo Two MINIMIZED windows are running in background:
echo   - ProjectAura-Backend
echo   - ProjectAura-Frontend
echo.
echo To stop: Run STOP_ALL.bat
echo.
echo This window will close in 5 seconds...
timeout /t 5

exit
