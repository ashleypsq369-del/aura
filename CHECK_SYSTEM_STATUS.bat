@echo off
echo.
echo ============================================
echo  PROJECT AURA - SYSTEM STATUS CHECK
echo ============================================
echo.

echo [1/4] Checking if backend files exist...
if exist "backend\routers\caregiver_intelligence.py" (
    echo     ✅ caregiver_intelligence.py exists
) else (
    echo     ❌ caregiver_intelligence.py MISSING
)

if exist "backend\routers\intelligent_care.py" (
    echo     ✅ intelligent_care.py exists
) else (
    echo     ❌ intelligent_care.py MISSING
)
echo.

echo [2/4] Checking if frontend files exist...
if exist "frontend\src\pages\Caregivers.jsx" (
    echo     ✅ Caregivers.jsx exists
) else (
    echo     ❌ Caregivers.jsx MISSING
)

if exist "frontend\src\components\RealTimeAlerts.jsx" (
    echo     ✅ RealTimeAlerts.jsx exists
) else (
    echo     ❌ RealTimeAlerts.jsx MISSING
)
echo.

echo [3/4] Checking if backend is running...
curl -s http://localhost:8000/docs >nul 2>&1
if %errorlevel% == 0 (
    echo     ✅ Backend is RUNNING at http://localhost:8000
) else (
    echo     ❌ Backend is NOT running
    echo     👉 Start it with: cd backend ^&^& python -m uvicorn main:app --reload --port 8000
)
echo.

echo [4/4] Checking if frontend is running...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% == 0 (
    echo     ✅ Frontend is RUNNING at http://localhost:5173
) else (
    echo     ❌ Frontend is NOT running
    echo     👉 Start it with: cd frontend ^&^& npm run dev
)
echo.

echo ============================================
echo  QUICK ACTIONS
echo ============================================
echo.
echo  To start backend:  cd backend ^&^& python -m uvicorn main:app --reload --port 8000
echo  To start frontend: cd frontend ^&^& npm run dev
echo  Then login at:     http://localhost:5173
echo                     clinician / clinician123
echo.
echo ============================================
pause
