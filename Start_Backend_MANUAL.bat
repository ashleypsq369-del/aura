@echo off
title ProjectAura - Start Backend Manually
color 0E

echo.
echo ========================================
echo    STARTING BACKEND MANUALLY
echo ========================================
echo.

cd /d "c:\xampp\htdocs\ProjectAura_React\backend"

echo Activating virtual environment...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo.
    echo ❌ ERROR: Could not activate virtual environment!
    echo.
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo ✅ Virtual environment activated
echo.
echo Starting FastAPI backend...
echo ----------------------------------------
python -m uvicorn main:app --reload --port 8000

pause
