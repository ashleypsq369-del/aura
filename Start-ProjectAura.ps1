# ProjectAura - One-Click Startup (PowerShell)
# Starts both Backend and Frontend in a single executable

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   PROJECT AURA - ONE-CLICK STARTUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Change to project directory
$projectPath = "c:\xampp\htdocs\ProjectAura_React"
Set-Location $projectPath

# Check database
Write-Host "[1/3] Checking Database (SQLite)..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
if (Test-Path "aura.db") {
    Write-Host "✅ Database found: aura.db" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database not found! Will be created on first run." -ForegroundColor Yellow
}
Write-Host ""

# Start Backend
Write-Host "[2/3] Starting Backend (FastAPI)..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

$backendPath = Join-Path $projectPath "backend"
$venvActivate = Join-Path $backendPath "venv\Scripts\Activate.ps1"

if (-not (Test-Path $venvActivate)) {
    Write-Host "❌ ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    Set-Location $backendPath
    python -m venv venv
    & $venvActivate
    pip install -r requirements.txt
    Set-Location $projectPath
}

# Start backend in new PowerShell window
$backendScript = @"
Set-Location '$backendPath'
& '$venvActivate'
Write-Host '✅ Virtual environment activated' -ForegroundColor Green
Write-Host 'Starting FastAPI backend...' -ForegroundColor Cyan
python -m uvicorn main:app --reload --port 8000
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Normal

Write-Host "✅ Backend starting in new window..." -ForegroundColor Green
Write-Host "   Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 8
Write-Host ""

# Start Frontend
Write-Host "[3/3] Starting Frontend (React + Vite)..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray

$frontendPath = Join-Path $projectPath "frontend"

if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "⚠️  Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install
    Set-Location $projectPath
}

# Start frontend in new PowerShell window
$frontendScript = @"
Set-Location '$frontendPath'
Write-Host '✅ Starting React + Vite...' -ForegroundColor Green
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Normal

Write-Host "✅ Frontend starting in new window..." -ForegroundColor Green
Write-Host "   Waiting for frontend to build..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-Host ""

# Open browser
Write-Host "Opening Browser..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
Start-Process "http://localhost:5173"
Write-Host ""

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ALL SERVICES STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Database:     SQLite (aura.db)" -ForegroundColor Green
Write-Host "✅ Backend API:  http://localhost:8000" -ForegroundColor Green
Write-Host "✅ API Docs:     http://localhost:8000/docs" -ForegroundColor Green
Write-Host "✅ Frontend App: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Two PowerShell windows are now open:" -ForegroundColor Yellow
Write-Host "  1. Backend (FastAPI) - Port 8000" -ForegroundColor White
Write-Host "  2. Frontend (React) - Port 5173" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Keep both windows open while using the app!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Cyan
Write-Host "  Username: clinician" -ForegroundColor White
Write-Host "  Password: clinician123" -ForegroundColor White
Write-Host ""
Write-Host "To STOP: Close both PowerShell windows or press Ctrl+C in each" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
