# How to Restart Backend Server

## Quick Instructions

### Step 1: Find the Backend Terminal
Look for the terminal/command prompt window where the backend is running. It should show output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 2: Stop the Server
- Press `Ctrl + C` in that terminal window
- Wait for the server to shut down gracefully

### Step 3: Restart the Server
```bash
cd c:\xampp\htdocs\ProjectAura_React\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Verify It's Running
You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using StatReload
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## If You Can't Find the Terminal

### Option 1: Kill Process by PID (Windows)
```bash
# Find the process ID
netstat -ano | findstr :8000

# Kill the process (replace XXXXX with the PID from above)
taskkill /F /PID XXXXX

# Start fresh
cd c:\xampp\htdocs\ProjectAura_React\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 2: Kill Process by Name (Windows)
```bash
# Kill all Python processes (WARNING: stops ALL Python processes)
taskkill /F /IM python.exe

# Start backend
cd c:\xampp\htdocs\ProjectAura_React\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## After Restarting

1. **Test the new endpoints:**
   - Open browser: http://localhost:8000/docs
   - Look for these new endpoints:
     - `GET /api/patients/{patient_id}/vitals`
     - `GET /api/patients/{patient_id}/medications`

2. **Test in the app:**
   - Go to Dashboard
   - Click on a patient
   - Click on Vitals or Medications cards
   - Should load without 404 errors

## Troubleshooting

### "Address already in use" error
Another process is using port 8000. Kill it:
```bash
netstat -ano | findstr :8000
taskkill /F /PID <PID_NUMBER>
```

### "Module not found" errors
Activate virtual environment or reinstall dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Database errors
Make sure `aura.db` exists:
```bash
# Should be in backend folder
dir backend\aura.db
```
