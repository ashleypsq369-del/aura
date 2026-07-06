# 🚀 ProjectAura - One-Click Startup Guide

## 📁 Quick Start Files Created

Two convenient batch files have been created to make your life easier:

1. **Start_ProjectAura.bat** - Starts all services with one click
2. **Stop_ProjectAura.bat** - Stops all services with one click

---

## ✨ How to Use

### **Option 1: Run from Desktop (Recommended)**

1. **Copy the startup file to your Desktop:**
   - Right-click `Start_ProjectAura.bat` 
   - Select "Send to" → "Desktop (create shortcut)"
   - Optionally rename to "🚀 Start ProjectAura"

2. **Double-click the file on your desktop** whenever you want to start ProjectAura

3. **That's it!** The script will:
   - ✅ Start PostgreSQL database
   - ✅ Start FastAPI backend (Port 8000)
   - ✅ Start React frontend (Port 5173)
   - ✅ Open browser automatically

### **Option 2: Run from Project Folder**

Simply double-click `Start_ProjectAura.bat` in the project root folder.

---

## 🛑 How to Stop All Services

**Method 1: Use the Stop Script**
- Double-click `Stop_ProjectAura.bat`
- All services will shut down automatically

**Method 2: Close Command Windows**
- Close the two terminal windows that opened:
  - "ProjectAura Backend"
  - "ProjectAura Frontend"

**Method 3: Manual (Ctrl+C)**
- Press `Ctrl+C` in each terminal window
- Type `Y` to confirm termination

---

## 🌐 Access Points After Starting

Once started, access the application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main web application |
| **Backend API** | http://localhost:8000 | API server |
| **API Docs** | http://localhost:8000/docs | Swagger documentation |

---

## 🔧 What the Startup Script Does

The `Start_ProjectAura.bat` script performs these steps automatically:

1. **Checks PostgreSQL Status**
   - If not running → Starts it
   - If already running → Skips

2. **Starts Backend**
   - Changes to `backend` directory
   - Activates Python virtual environment
   - Runs `uvicorn main:app --reload --port 8000`
   - Opens in new terminal window

3. **Starts Frontend**
   - Changes to `frontend` directory
   - Runs `npm run dev`
   - Opens in new terminal window

4. **Opens Browser**
   - Waits 8 seconds for services to initialize
   - Opens http://localhost:5173 automatically

---

## ⚠️ Troubleshooting

### **PostgreSQL Won't Start**
If PostgreSQL fails to start, manually start it:
```cmd
C:\xampp\postgresql\bin\pg_ctl.exe -D C:\xampp\postgresql\data start
```

Or use XAMPP Control Panel and click "Start" next to PostgreSQL.

### **Backend Fails with "Module not found"**
Make sure virtual environment is set up:
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### **Frontend Fails with "Command not found"**
Install dependencies first:
```cmd
cd frontend
npm install
```

### **Port Already in Use**
If ports 8000 or 5173 are busy:
1. Close any running instances
2. Or modify the ports in:
   - Backend: `main.py` (change `port=8000`)
   - Frontend: `vite.config.js` (change server port)

### **Virtual Environment Path Issues**
If the script can't find the virtual environment, check that:
- `backend/venv` folder exists
- Python virtual environment is properly set up

---

## 🎨 Customization

### **Change Ports**

Edit `Start_ProjectAura.bat` and modify these lines:

```batch
REM Backend port (line ~30)
start "ProjectAura Backend" cmd /k "venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"

REM Frontend port (automatic via vite.config.js)
```

### **Add PostgreSQL Auto-Start**

If you want PostgreSQL to always start with Windows:
1. Open XAMPP Control Panel
2. Click "Config" next to PostgreSQL
3. Check "Install as Windows Service"

### **Change Wait Times**

Edit the timeout values if services need more/less time:
```batch
timeout /t 5 /nobreak >nul   REM Backend wait (5 seconds)
timeout /t 8 /nobreak >nul   REM Frontend wait (8 seconds)
```

---

## 📝 Manual Startup (For Reference)

If you prefer manual control, here's what to do:

### **Step 1: Start PostgreSQL**
```cmd
C:\xampp\postgresql\bin\pg_ctl.exe -D C:\xampp\postgresql\data start
```

### **Step 2: Start Backend**
```cmd
cd c:\xampp\htdocs\ProjectAura_React\backend
venv\Scripts\activate
python -m uvicorn main:app --reload
```

### **Step 3: Start Frontend**
```cmd
cd c:\xampp\htdocs\ProjectAura_React\frontend
npm run dev
```

### **Step 4: Open Browser**
Navigate to http://localhost:5173

---

## 🎯 Tips & Best Practices

1. **Always use the startup script** - It ensures proper initialization order
2. **Wait for services to fully start** - Backend takes ~5s, Frontend ~8s
3. **Check terminal windows** - Look for errors if something fails
4. **Use the stop script** - Clean shutdown prevents data corruption
5. **Keep terminals open** - You can see real-time logs and errors

---

## 🔐 Security Note

The startup script uses hardcoded paths. If you move the project:
1. Edit `Start_ProjectAura.bat`
2. Update the path on line 12:
   ```batch
   cd /d "c:\xampp\htdocs\ProjectAura_React"
   ```

---

## 📞 Need Help?

If you encounter issues:
1. Check the terminal windows for error messages
2. Verify all dependencies are installed:
   - Python packages: `pip list`
   - Node packages: `npm list`
3. Check PostgreSQL is running: `tasklist | find "postgres"`
4. Review logs in:
   - Backend: Terminal output
   - Frontend: Terminal output
   - PostgreSQL: `C:\xampp\postgresql\data\logfile`

---

## ✅ Verification Checklist

After running the startup script, verify:

- [ ] Two terminal windows opened (Backend + Frontend)
- [ ] Backend shows: "Uvicorn running on http://127.0.0.1:8000"
- [ ] Frontend shows: "Local: http://localhost:5173"
- [ ] Browser opened automatically
- [ ] Login page loads successfully
- [ ] No error messages in terminal windows

If all checked ✅ - **You're good to go!** 🎉

---

**Created**: June 6, 2026  
**For**: ProjectAura Development Team  
**Version**: 1.0

