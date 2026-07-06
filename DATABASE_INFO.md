# 📊 ProjectAura Database Information

## Current Database: **SQLite** ✅

Your ProjectAura application is using **SQLite**, NOT PostgreSQL!

---

## 🎯 What This Means

### **Good News:**
✅ **No separate database server needed** - Database is just a file  
✅ **Zero configuration** - Works out of the box  
✅ **No PostgreSQL installation required** - Ignore all PostgreSQL setup  
✅ **Portable** - Copy the `aura.db` file to backup/restore data  
✅ **Fast** - Perfect for development and small deployments  

### **Database File:**
- **Location**: `c:\xampp\htdocs\ProjectAura_React\aura.db`
- **Type**: SQLite database file
- **Size**: ~few MB (grows with data)
- **Configured in**: `backend\.env`

---

## ⚙️ Configuration

Your `.env` file shows:
```
DATABASE_URL=sqlite:///../aura.db
```

This means:
- Using SQLite (not PostgreSQL)
- Database file is `aura.db` in project root
- No password or connection string needed
- No server to start!

---

## 🚀 Starting the App (Updated)

Since you're using SQLite, you **DO NOT need to start any database server!**

### **Just run:**
```
Double-click Start_ProjectAura.bat
```

That's it! SQLite works automatically.

---

## 📝 Why the Confusion?

The documentation and initial setup mentioned PostgreSQL because:
1. PostgreSQL is recommended for **production** deployments
2. The code supports **both** SQLite and PostgreSQL
3. You can switch by changing `DATABASE_URL` in `.env`

**But you're currently using SQLite, which is perfect for development!**

---

## 🔄 Switching to PostgreSQL (Optional - Not Needed Now)

If you ever want to switch to PostgreSQL for production:

### **Step 1: Install PostgreSQL**
- Download from: https://www.postgresql.org/download/windows/
- Set password during installation

### **Step 2: Create Database**
```sql
CREATE DATABASE projectaura;
```

### **Step 3: Update .env**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/projectaura
```

### **Step 4: Reinstall Dependencies**
```cmd
cd backend
pip install psycopg2-binary
```

### **Step 5: Migrate Data**
- Export from SQLite
- Import to PostgreSQL
- Or start fresh

**But this is NOT needed for development or small deployments!**

---

## 💾 Database Backup (SQLite)

### **Backup:**
Simply copy the file:
```cmd
copy aura.db aura_backup_2026-06-06.db
```

### **Restore:**
Replace the file:
```cmd
copy aura_backup_2026-06-06.db aura.db
```

### **Transfer to Another Computer:**
Copy `aura.db` to the new location.

---

## 🔍 View Database Contents

### **Option 1: DB Browser for SQLite (Recommended)**
1. Download: https://sqlitebrowser.org/
2. Open `aura.db`
3. Browse tables, run queries, export data

### **Option 2: Command Line**
```cmd
cd c:\xampp\htdocs\ProjectAura_React
sqlite3 aura.db
.tables
SELECT * FROM users;
.quit
```

### **Option 3: Python Script**
```python
import sqlite3
conn = sqlite3.connect('aura.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
print(cursor.fetchall())
conn.close()
```

---

## 📊 Database Schema

Your SQLite database has **40+ tables**:

### **Core Tables:**
- `users` - User accounts
- `user_profiles` - Extended user info
- `patients` - Patient records
- `vitals` - Vital signs
- `symptoms` - Symptom tracking
- `medications` - Prescriptions
- `appointments` - Scheduling
- `alerts` - Clinical alerts
- `notifications` - User notifications
- ... and 30+ more!

See `COMPLETE_SYSTEM_DOCUMENTATION.md` for full schema.

---

## ⚡ Performance

### **SQLite is Great For:**
✅ Development  
✅ Testing  
✅ Single-user or small team  
✅ Up to ~100,000 records  
✅ Simple deployment  

### **Consider PostgreSQL For:**
- Large teams (10+ concurrent users)
- Production with high traffic
- Complex queries and analytics
- Need for advanced features (full-text search, JSON queries)
- Compliance requirements

**For now, SQLite is perfect!**

---

## 🛠️ Troubleshooting

### **"Database is locked" error:**
- Only one process can write at a time
- Close any database browser tools
- Restart the backend

### **"No such table" error:**
- Database not initialized
- Run: `python -c "from src.db import init_database; init_database()"`
- Or delete `aura.db` and restart (will recreate)

### **Corrupted database:**
- Restore from backup
- Or delete `aura.db` and let it recreate
- Or run: `sqlite3 aura.db "PRAGMA integrity_check;"`

---

## ✅ Summary

**You ARE using**: SQLite ✅  
**You are NOT using**: PostgreSQL ❌  
**You need to start**: Nothing! (just Backend + Frontend)  
**Database location**: `aura.db` in project root  
**Backup method**: Copy the file  

**Your updated Start_ProjectAura.bat now works perfectly without PostgreSQL!**

---

**Created**: June 6, 2026  
**Last Updated**: June 6, 2026  
**Database**: SQLite (aura.db)
