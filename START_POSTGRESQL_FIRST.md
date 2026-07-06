# ⚠️ IMPORTANT: Start PostgreSQL First!

## Why This Error Happened

The startup script couldn't find PostgreSQL in the default XAMPP location. PostgreSQL might be:
- Installed in a different location
- Not installed yet
- Installed as a Windows Service with a different name

---

## ✅ How to Start PostgreSQL (Choose One Method)

### **Method 1: Using pgAdmin 4 (Recommended)**

1. Open **pgAdmin 4** from Start Menu
2. If prompted, enter your PostgreSQL master password
3. PostgreSQL will start automatically when pgAdmin opens
4. You should see "PostgreSQL 14" (or your version) in the left sidebar
5. Now run `Start_ProjectAura.bat`

---

### **Method 2: Using Windows Services**

1. Press `Win + R` to open Run dialog
2. Type: `services.msc` and press Enter
3. Look for service named:
   - `postgresql-x64-14` (or similar)
   - `PostgreSQL`
   - Or any service with "postgres" in the name
4. Right-click the service → **Start**
5. Now run `Start_ProjectAura.bat`

---

### **Method 3: Using Command Line**

If you know where PostgreSQL is installed, use:

```cmd
"C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\14\data" start
```

*Adjust the version number (14) to match your installation*

---

### **Method 4: Auto-Start PostgreSQL on Windows Boot**

To avoid starting PostgreSQL manually every time:

1. Open `services.msc` (Win + R → services.msc)
2. Find PostgreSQL service
3. Right-click → **Properties**
4. Change "Startup type" to **Automatic**
5. Click **OK**
6. PostgreSQL will now start automatically when Windows boots

---

## 🔍 How to Check if PostgreSQL is Running

### **Quick Check:**
```cmd
tasklist | find "postgres"
```

If you see multiple `postgres.exe` processes, it's running! ✅

### **Or Check in Task Manager:**
1. Open Task Manager (Ctrl + Shift + Esc)
2. Go to "Details" tab
3. Look for `postgres.exe` processes
4. If you see 5-10 postgres.exe processes, it's running properly ✅

---

## 📥 If PostgreSQL is NOT Installed

### **Install PostgreSQL:**

1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set a password (remember this!)
   - Port: 5432 (default)
   - Install pgAdmin 4
4. After installation, PostgreSQL will be running
5. Update your backend `.env` file with the password:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/projectaura
   ```

---

## 🛠️ Updated Startup Workflow

### **Every Time You Want to Use ProjectAura:**

1. **Start PostgreSQL** (one of the methods above)
2. **Run `Start_ProjectAura.bat`** (from Desktop or project folder)
3. **Done!** The script will start Backend + Frontend

---

## 🎯 Quick Reference

### **Project Aura Startup Order:**
```
1. PostgreSQL (Database) ← YOU MUST START THIS FIRST
2. Backend (FastAPI)     ← Started by script
3. Frontend (React)      ← Started by script
```

---

## ⚙️ Advanced: Auto-Detect PostgreSQL Location

If you want the script to auto-detect PostgreSQL, tell me where it's installed:

Common locations:
- `C:\Program Files\PostgreSQL\14\bin\pg_ctl.exe`
- `C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe`
- `C:\PostgreSQL\14\bin\pg_ctl.exe`

Once I know the path, I can update the startup script to start it automatically!

---

## 📞 Still Having Issues?

Run this in Command Prompt to find PostgreSQL:
```cmd
where pg_ctl
where postgres
```

If found, tell me the path and I'll update the script!

---

**Created**: June 6, 2026  
**Last Updated**: June 6, 2026
