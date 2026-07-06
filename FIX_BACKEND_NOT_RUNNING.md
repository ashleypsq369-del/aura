# Backend Server Not Running! ⚠️

**Issue:** Backend server on port 8000 is not running  
**Evidence:** `ERR_CONNECTION_REFUSED` errors in console  
**Impact:** App can't fetch data, using cached data only

---

## Error Messages You're Seeing

```
:8000/api/alerts/unread-count:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
:8000/api/notifications/unread-count:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
:8000/api/alerts:1 Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**This means:** The backend FastAPI server is NOT running!

---

## Quick Fix

### Start the Backend Server

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Or on Windows:**
```cmd
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### You Should See:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## Verify Backend is Running

### Test in Browser
Open: http://localhost:8000/docs

You should see the **FastAPI Swagger documentation** page.

### Test API Endpoint
Open: http://localhost:8000/api/alerts

You should see JSON response (not "connection refused").

---

## Why This Happened

The backend server was stopped or never started. Common causes:
1. Terminal was closed
2. Server crashed
3. Port 8000 is being used by another app
4. Python virtual environment not activated

---

## Troubleshooting

### Issue: "Module not found"
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: "Port 8000 is already in use"
**Find what's using port 8000:**
```bash
# Windows
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue: "Can't find uvicorn"
```bash
pip install uvicorn fastapi
```

---

## Once Backend is Running

The errors will stop and you'll see:
```
✅ IndexedDB initialized
✅ Offline cache database initialized
🎯 Initializing Touch Support...
✅ Touch Support initialized
```

**No more connection errors!**

---

## About the Offline Messages

These are **GOOD** messages (not errors):
```
Online request failed, trying cache: /api/alerts
📦 Serving /api/alerts from cache
```

This means:
- App tried to fetch fresh data
- Server wasn't available
- App used cached data instead
- **Offline mode is working!** ✅

But you still need the backend for:
- Login/authentication
- Creating new data
- Real-time updates
- Fresh data fetches

---

## Start Both Servers

### Terminal 1 - Backend
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Both should be running simultaneously!

---

## Check Status

### Backend Running? 
✅ http://localhost:8000/docs shows Swagger UI

### Frontend Running?
✅ http://localhost:5173 shows the app

### Both Connected?
✅ No "ERR_CONNECTION_REFUSED" errors in console

---

## Quick Summary

**Problem:** Backend not running  
**Solution:** Start backend with `python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`  
**Verify:** Open http://localhost:8000/docs  
**Result:** No more connection errors!

🚀 **START YOUR BACKEND NOW!**
