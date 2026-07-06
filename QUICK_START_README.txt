╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           🚀 PROJECT AURA - QUICK START GUIDE 🚀              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📁 FILES CREATED FOR YOU:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Start_ProjectAura.bat  → On your DESKTOP (double-click to start)
✅ Stop_ProjectAura.bat   → On your DESKTOP (double-click to stop)
✅ Find_PostgreSQL.bat    → In project folder (helps find PostgreSQL)

📚 DOCUMENTATION:
✅ STARTUP_GUIDE.md           → Detailed startup instructions
✅ START_POSTGRESQL_FIRST.md  → PostgreSQL setup guide
✅ QUICK_START_README.txt     → This file


═══════════════════════════════════════════════════════════════
  IMPORTANT: PostgreSQL Error Fix
═══════════════════════════════════════════════════════════════

The error you got was because PostgreSQL needs to be started FIRST!

🔧 FIX: Before running Start_ProjectAura.bat, do this:

OPTION 1 (Easiest):
  1. Open pgAdmin 4 from Start Menu
  2. PostgreSQL will start automatically
  3. NOW run Start_ProjectAura.bat from Desktop

OPTION 2 (One-time setup):
  1. Press Win + R
  2. Type: services.msc
  3. Find "postgresql" service
  4. Right-click → Properties
  5. Set Startup Type to "Automatic"
  6. Click "Start" button
  7. Click OK
  
  ✅ PostgreSQL will now start with Windows automatically!

OPTION 3 (Find where PostgreSQL is):
  1. Run Find_PostgreSQL.bat (in project folder)
  2. Note the path it shows
  3. Tell me the path so I can update the startup script


═══════════════════════════════════════════════════════════════
  HOW TO USE (After PostgreSQL is Running)
═══════════════════════════════════════════════════════════════

🎯 EASY WAY:

  1. Make sure PostgreSQL is running (see options above)
  2. Double-click "Start_ProjectAura.bat" on your Desktop
  3. Wait ~10 seconds
  4. Browser opens automatically to http://localhost:5173
  5. Login and use the app!

🛑 TO STOP:

  - Double-click "Stop_ProjectAura.bat" on Desktop
  - OR close the two terminal windows that opened
  - OR press Ctrl+C in each terminal window


═══════════════════════════════════════════════════════════════
  WHAT THE STARTUP SCRIPT DOES
═══════════════════════════════════════════════════════════════

When you run Start_ProjectAura.bat:

  [1] ✅ Checks if PostgreSQL is running
  [2] ✅ Starts Backend (FastAPI) → http://localhost:8000
  [3] ✅ Starts Frontend (React)  → http://localhost:5173
  [4] ✅ Opens browser automatically

Two terminal windows will open:
  • "ProjectAura Backend"  - Keep this open!
  • "ProjectAura Frontend" - Keep this open!

You can minimize them, but DON'T close them while using the app.


═══════════════════════════════════════════════════════════════
  TROUBLESHOOTING
═══════════════════════════════════════════════════════════════

❌ "PostgreSQL is not running" warning:
   → Start PostgreSQL first (see options above)

❌ Backend window shows database connection error:
   → PostgreSQL is not running
   → Or check your .env file has correct password

❌ "Module not found" in Backend window:
   → Open Command Prompt in project folder:
     cd c:\xampp\htdocs\ProjectAura_React\backend
     venv\Scripts\activate
     pip install -r requirements.txt

❌ "Command not found" in Frontend window:
   → Open Command Prompt in project folder:
     cd c:\xampp\htdocs\ProjectAura_React\frontend
     npm install

❌ Port 8000 or 5173 already in use:
   → Close any running instances
   → Or run Stop_ProjectAura.bat first


═══════════════════════════════════════════════════════════════
  VERIFY EVERYTHING IS WORKING
═══════════════════════════════════════════════════════════════

After running Start_ProjectAura.bat, check:

  ☑ Two terminal windows opened
  ☑ Backend window says: "Uvicorn running on http://127.0.0.1:8000"
  ☑ Frontend window says: "Local: http://localhost:5173"
  ☑ Browser opened automatically
  ☑ Login page appears
  ☑ No red error messages in terminal windows

If all checked ✅ → Everything works! 🎉


═══════════════════════════════════════════════════════════════
  ACCESS POINTS
═══════════════════════════════════════════════════════════════

After starting, you can access:

  🌐 Frontend App:  http://localhost:5173
  🔧 Backend API:   http://localhost:8000
  📚 API Docs:      http://localhost:8000/docs


═══════════════════════════════════════════════════════════════
  TIPS
═══════════════════════════════════════════════════════════════

💡 Set PostgreSQL to auto-start with Windows (Option 2 above)
   → You'll never need to start it manually again!

💡 Create a shortcut to Start_ProjectAura.bat
   → Already on your Desktop!

💡 Keep the terminal windows open (but minimize them)
   → You can see real-time logs and errors

💡 Use Stop_ProjectAura.bat for clean shutdown
   → Prevents data corruption


═══════════════════════════════════════════════════════════════
  NEED MORE HELP?
═══════════════════════════════════════════════════════════════

📖 Read these detailed guides:
   • STARTUP_GUIDE.md - Complete startup documentation
   • START_POSTGRESQL_FIRST.md - PostgreSQL setup help
   • COMPLETE_SYSTEM_DOCUMENTATION.md - Full system docs

🔍 Find PostgreSQL installation:
   • Run Find_PostgreSQL.bat in project folder

💬 Still stuck?
   • Check the terminal windows for error messages
   • Read the error message carefully
   • Most issues are either:
     - PostgreSQL not running
     - Missing dependencies (npm install or pip install)
     - Ports already in use


═══════════════════════════════════════════════════════════════

Created: June 6, 2026
Version: 1.0
For: ProjectAura Development Team

═══════════════════════════════════════════════════════════════
