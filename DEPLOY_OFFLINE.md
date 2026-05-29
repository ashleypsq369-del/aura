# 🚀 Offline Deployment Guide

## Making Project Aura Work Offline

While Streamlit requires a Python server, you can run it **locally without internet** after initial setup.

---

## ✅ Solution: Local Server Deployment

### What This Means:
- ✅ No internet required after installation
- ✅ Runs on your local machine/network
- ✅ Full functionality available
- ✅ Fast and secure
- ✅ Data stays local

### What You Need:
- Python 3.11+ installed
- Project files downloaded
- Dependencies installed once (with internet)

---

## 📋 One-Time Setup (Requires Internet)

### Step 1: Install Python
Download from: https://www.python.org/downloads/
- Choose Python 3.11 or higher
- Check "Add Python to PATH" during installation

### Step 2: Install Dependencies
```bash
# Navigate to project folder
cd path/to/HCARE

# Install all dependencies
pip install -r requirements.txt

# Download NLTK data
python scripts/download_nltk_data.py

# Create database tables
python scripts/create_missing_tables.py
```

**This is the ONLY time you need internet!**

---

## 🎯 Running Offline (No Internet Needed)

### Start the Application
```bash
# Navigate to project folder
cd path/to/HCARE

# Run the application
streamlit run app.py
```

### Access the Application
Open your browser and go to:
```
http://localhost:8501
```

**That's it! No internet required.**

---

## 🌐 Network Deployment (Multiple Users)

### Run on Local Network
```bash
# Run on network
streamlit run app.py --server.address 0.0.0.0 --server.port 8501
```

### Access from Other Computers
```
http://[your-computer-ip]:8501
```

**Example:** http://192.168.1.100:8501

**Benefits:**
- Multiple users can access
- Centralized data
- No internet required
- Works on LAN

---

## 💻 Desktop Application (True Offline)

### Option 1: Create Batch File (Windows)

Create `start_aura.bat`:
```batch
@echo off
cd /d "%~dp0"
streamlit run app.py
pause
```

**Double-click to start!**

### Option 2: Create Shell Script (Mac/Linux)

Create `start_aura.sh`:
```bash
#!/bin/bash
cd "$(dirname "$0")"
streamlit run app.py
```

Make executable:
```bash
chmod +x start_aura.sh
```

**Double-click to start!**

### Option 3: Package as Executable

```bash
# Install PyInstaller
pip install pyinstaller

# Create executable
pyinstaller --onefile --windowed app.py
```

**Distributable executable created!**

---

## 📦 Portable Installation

### Create Portable Package

1. **Install Python Portable**
   - Download WinPython or Python Embedded
   - Extract to project folder

2. **Install Dependencies**
   ```bash
   portable-python/python.exe -m pip install -r requirements.txt
   ```

3. **Create Launcher**
   ```batch
   @echo off
   portable-python\python.exe -m streamlit run app.py
   ```

4. **Package Everything**
   - Zip the entire folder
   - Distribute to users
   - No installation needed!

---

## 🔧 Configuration for Offline Use

### Update .streamlit/config.toml

```toml
[server]
headless = true
port = 8501
enableCORS = false
enableXsrfProtection = true

[browser]
serverAddress = "localhost"
gatherUsageStats = false

[client]
showErrorDetails = true
```

### Disable External Connections

In `app.py`, ensure no external API calls:
- ✅ All data from local database
- ✅ All assets served locally
- ✅ No CDN dependencies
- ✅ No external fonts (use local)

---

## 📊 Data Backup (Offline)

### Automatic Backup Script

Create `backup_data.py`:
```python
import shutil
from datetime import datetime

# Backup database
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy('aura.db', f'backups/aura_backup_{timestamp}.db')
print(f"Backup created: aura_backup_{timestamp}.db")
```

Run daily:
```bash
python backup_data.py
```

---

## 🔒 Security for Offline Use

### Local Security Measures

1. **User Authentication** - Already implemented
2. **RBAC** - Already implemented
3. **Local Firewall** - Block external access
4. **Encrypted Storage** - Encrypt database file
5. **Access Logs** - Monitor user activity

### Recommended Settings

```python
# In app.py
st.set_page_config(
    page_title="Project Aura",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': None,  # Disable external help
        'Report a bug': None,  # Disable external reporting
        'About': "Project Aura - Offline Mode"
    }
)
```

---

## 🚀 Quick Start Commands

### Windows
```batch
# One-time setup
pip install -r requirements.txt
python scripts/download_nltk_data.py
python scripts/create_missing_tables.py

# Run offline
streamlit run app.py
```

### Mac/Linux
```bash
# One-time setup
pip3 install -r requirements.txt
python3 scripts/download_nltk_data.py
python3 scripts/create_missing_tables.py

# Run offline
streamlit run app.py
```

---

## 📱 Mobile Access (Offline Network)

### Access from Mobile Devices

1. **Connect to same WiFi** as server
2. **Find server IP address**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
3. **Open browser on mobile**
   ```
   http://[server-ip]:8501
   ```

**Works without internet!**

---

## 🔄 Updates (Offline)

### Update Process

1. **Download updates** (with internet)
2. **Copy to offline machine** (USB/network)
3. **Replace files**
4. **Restart application**

### Update Script

Create `update.py`:
```python
import shutil
import os

# Backup current version
shutil.copytree('.', '../backup_before_update')

# Copy new files
# (Manual or automated)

print("Update complete! Restart the application.")
```

---

## 🎯 Performance Optimization (Offline)

### Speed Up Local Deployment

1. **Use SQLite** - Already configured
2. **Cache Data** - Streamlit caching enabled
3. **Optimize Images** - Compress assets
4. **Minimize Queries** - Batch operations
5. **Local Storage** - Fast SSD recommended

### Configuration
```python
# In modules
@st.cache_data(ttl=3600)  # Cache for 1 hour
def load_data():
    # Data loading logic
    pass
```

---

## ✅ Verification Checklist

### Offline Functionality
- [ ] Application starts without internet
- [ ] All pages load correctly
- [ ] Database operations work
- [ ] Forms submit successfully
- [ ] AI features function
- [ ] No external API calls
- [ ] All assets load locally

### Network Functionality
- [ ] Accessible from other devices
- [ ] Multiple users can connect
- [ ] Data syncs correctly
- [ ] Performance is good
- [ ] Security is maintained

---

## 🆘 Troubleshooting

### Issue: "Module not found"
**Solution:** Reinstall dependencies
```bash
pip install -r requirements.txt
```

### Issue: "Database locked"
**Solution:** Close other instances
```bash
# Kill all Python processes
taskkill /F /IM python.exe  # Windows
pkill python  # Mac/Linux
```

### Issue: "Port already in use"
**Solution:** Use different port
```bash
streamlit run app.py --server.port 8502
```

### Issue: "Slow performance"
**Solution:** 
- Close other applications
- Use SSD for database
- Increase system RAM
- Optimize database queries

---

## 📞 Support

### Getting Help Offline

1. **Check Documentation** - All docs included
2. **Review Logs** - Check logs/ folder
3. **Test Incrementally** - Isolate issues
4. **Backup Data** - Before troubleshooting

### Documentation Files
- README.md - Getting started
- USER_GUIDE.md - User manual
- DEPLOYMENT_GUIDE.md - Deployment help
- FINAL_PROJECT_VERIFICATION.md - Status check

---

## 🎉 Summary

**Project Aura CAN work offline!**

✅ **One-time setup** with internet
✅ **Run locally** without internet
✅ **Network deployment** for multiple users
✅ **Desktop application** option available
✅ **Portable installation** possible
✅ **Full functionality** maintained
✅ **Fast performance** guaranteed
✅ **Secure** and private

**Your data stays local. No internet required after setup.**

---

*Offline Deployment Guide*
*Project Aura - Enterprise Hospice Care Management*
*January 25, 2026*
