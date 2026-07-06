@echo off
echo ========================================
echo Starting ProjectAura - Both Servers
echo ========================================
echo.
echo This will open 2 windows:
echo 1. Backend Server (Port 8000)
echo 2. Frontend Server (Port 5173)
echo.
echo Close this window to stop both servers
echo ========================================
echo.

cd /d "c:\xampp\htdocs\ProjectAura_React"

echo Starting Backend Server...
start "ProjectAura Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "ProjectAura Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo Close the opened windows to stop servers
echo ========================================

pause
