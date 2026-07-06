@echo off
setlocal enabledelayedexpansion
title Project Aura - Startup Launcher
color 0B

:: ============================================
::  PROJECT AURA - AUTOMATIC STARTUP
:: ============================================

echo.
echo ================================================
echo    PROJECT AURA - STARTING ALL SERVICES
echo ================================================
echo.

:: Change to project directory
cd /d "c:\xampp\htdocs\ProjectAura_React"

:: Check if database exists
if exist "aura.db" (
    echo [1/4] ✓ Database: aura.db found
) else (
    echo [1/4] ⚠  Database will be created on first run
)

:: Start Backend
echo [2/4] 🚀 Starting Backend Server (with AI)...
cd backend
start /MIN "ProjectAura-Backend" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8000"
cd ..

:: Wait for backend to initialize
echo     ⏳ Waiting for backend to initialize (15 seconds)...
timeout /t 15 /nobreak >nul

:: Start Frontend
echo [3/4] 🚀 Starting Frontend...
cd frontend
start /MIN "ProjectAura-Frontend" cmd /k "npm run dev"
cd ..

:: Wait for frontend to build
echo     ⏳ Waiting for frontend to build (15 seconds)...
timeout /t 15 /nobreak >nul

:: Open browser
echo [4/4] 🌐 Opening browser...
start http://localhost:5173

echo.
echo ================================================
echo    ✅ PROJECT AURA IS NOW RUNNING!
echo ================================================
echo.
echo Mode:     🤖 FULL AI ENABLED
echo 🔗 Frontend:  http://localhost:5173
echo 🔗 Backend:   http://localhost:8000
echo 📚 API Docs:  http://localhost:8000/docs
echo.
echo 🤖 AI Features Active:
echo    ✓ Risk Prediction
echo    ✓ SHAP Explainability
echo    ✓ Intelligent Recommendations
echo    ✓ Proactive Monitoring
echo    ⚠ Chatbot (fallback mode - needs API key)
echo.
echo 📋 Login Credentials:
echo    Username: clinician
echo    Password: clinician123
echo.
echo 💡 Two minimized windows are running:
echo    - ProjectAura-Backend (backend server)
echo    - ProjectAura-Frontend (frontend dev server)
echo.
echo ⚠  DO NOT close those windows or the app will stop!
echo.
echo 🛑 To stop the app:
echo    1. Close both minimized CMD windows, OR
echo    2. Run STOP_PROJECTAURA.bat
echo.
echo This window will close in 10 seconds...
timeout /t 10
exit
