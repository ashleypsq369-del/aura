@echo off
echo ========================================
echo Starting ProjectAura Backend Server
echo ========================================
echo.

cd /d "c:\xampp\htdocs\ProjectAura_React\backend"

echo Activating virtual environment (if exists)...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

echo.
echo Starting FastAPI server on http://localhost:8000
echo Press CTRL+C to stop the server
echo.
echo ========================================
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
