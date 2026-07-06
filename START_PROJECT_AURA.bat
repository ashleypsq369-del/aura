@echo off
title Project Aura - Startup Script
color 0A

echo.
echo ========================================
echo    PROJECT AURA - STARTUP SCRIPT
echo ========================================
echo.
echo Starting Project Aura...
echo This will open 2 terminals:
echo   1. Backend (Python/FastAPI)
echo   2. Frontend (React/Vite)
echo.
echo Press any key to start...
pause > nul

echo.
echo [1/2] Starting Backend Server...
start cmd /k "cd /d %~dp0backend && title Project Aura - Backend && echo Starting Backend... && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 > nul

echo [2/2] Starting Frontend Server...
start cmd /k "cd /d %~dp0frontend && title Project Aura - Frontend && echo Starting Frontend... && npm run dev"

timeout /t 5 > nul

echo.
echo ========================================
echo    PROJECT AURA IS STARTING!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Opening browser in 5 seconds...
echo.
timeout /t 5 > nul

start http://localhost:5173

echo.
echo ========================================
echo    PROJECT AURA IS READY!
echo ========================================
echo.
echo Demo Accounts:
echo   - clinician / password123
echo   - patient / password123  
echo   - family / password123
echo.
echo Documentation:
echo   - START_NOW_GUIDE.md
echo   - COMPREHENSIVE_AUDIT_REPORT.md
echo   - PROJECT_COMPLETE.md
echo.
echo Press any key to exit this window...
echo (Backend and Frontend will keep running)
pause > nul
