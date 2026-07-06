"""
Build script for ACE.exe
Compiles ace.py into a standalone Windows executable

Requirements:
- pyinstaller: pip install pyinstaller

Usage:
    python build_ace_exe.py
"""

import subprocess
import sys
import os
from pathlib import Path

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def check_pyinstaller():
    """Check if PyInstaller is installed"""
    print("Checking for PyInstaller...")
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'PyInstaller', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✓ PyInstaller found: {version}")
            return True
        else:
            return False
    except:
        return False

def install_pyinstaller():
    """Install PyInstaller"""
    print("\nInstalling PyInstaller...")
    try:
        subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'pyinstaller'],
            check=True,
            timeout=60
        )
        print("✓ PyInstaller installed successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to install PyInstaller: {e}")
        return False

def build_exe():
    """Build the EXE using PyInstaller"""
    print("\nBuilding ACE.exe...")
    
    # PyInstaller command
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--onefile',                    # Single executable file
        '--name=ace',                   # Output name
        '--console',                    # Keep console window
        '--clean',                      # Clean cache
        '--noconfirm',                  # Overwrite without asking
        'ace.py'
    ]
    
    # Add icon if exists
    if Path('aura_icon.ico').exists():
        cmd.insert(4, '--icon=aura_icon.ico')
        print("  → Using custom icon: aura_icon.ico")
    
    try:
        print(f"  → Running PyInstaller...")
        result = subprocess.run(cmd, check=True, timeout=120)
        
        if result.returncode == 0:
            print("\n✓ Build successful!")
            
            # Check if EXE was created
            exe_path = Path('dist/ace.exe')
            if exe_path.exists():
                size_mb = exe_path.stat().st_size / (1024 * 1024)
                print(f"\n✓ ACE.exe created successfully!")
                print(f"  Location: {exe_path.absolute()}")
                print(f"  Size: {size_mb:.2f} MB")
                return True
            else:
                print("\n✗ EXE file not found in dist/ directory")
                return False
        else:
            print("\n✗ Build failed")
            return False
    except subprocess.TimeoutExpired:
        print("\n✗ Build timed out")
        return False
    except Exception as e:
        print(f"\n✗ Build error: {e}")
        return False

def create_readme():
    """Create README for the EXE"""
    readme_content = """# ACE.exe - Aura Control Engine

## What is ACE?

ACE (Aura Control Engine) is a one-click launcher for ProjectAura that automatically:
- Starts the backend API server (FastAPI)
- Starts the frontend dev server (Vite/React)
- Opens your browser to the application
- Manages both processes until you close it

## How to Use

1. **Double-click `ace.exe`** in the ProjectAura root directory
2. Wait for the startup process (10-15 seconds)
3. Your browser will open automatically to http://localhost:5173
4. **To stop**: Press Ctrl+C in the ACE window or close the window

## Requirements

Before running ACE.exe, make sure you have:
- Node.js (v16 or higher)
- npm (comes with Node.js)
- Python 3.8+ (for backend)
- All dependencies installed (ACE will check and warn you)

## What ACE Does

1. ✓ Checks if Node.js, npm, and Python are installed
2. ✓ Verifies project structure
3. ✓ Installs backend dependencies (if needed)
4. ✓ Checks frontend dependencies (if needed)
5. ✓ Starts backend server on port 8000
6. ✓ Starts frontend server on port 5173
7. ✓ Opens browser automatically
8. ✓ Keeps both servers running

## Access Points

Once ACE starts successfully:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Troubleshooting

### ACE says dependencies are missing
- Install Node.js from https://nodejs.org
- Install Python from https://python.org
- Make sure they're in your PATH

### Backend fails to start
- Check if port 8000 is already in use
- Check backend/requirements.txt dependencies
- Run manually: `cd backend && python -m uvicorn main:app --reload`

### Frontend fails to start
- Check if port 5173 is already in use
- Run `npm install` in the frontend directory
- Check for error messages in the ACE console

### Processes don't stop when closing ACE
- Press Ctrl+C in the ACE window before closing
- Or manually kill processes in Task Manager

## Manual Alternative

If ACE doesn't work, you can start manually:

**Terminal 1 (Backend)**:
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```

Then open: http://localhost:5173

## Support

For issues or questions:
- Check the ACE console output for error messages
- Review backend/frontend logs in their console windows
- See TEST_ALL_PRIORITIES_NOW.md for testing guide
- See ALL_PRIORITIES_COMPLETE_FINAL.md for documentation

---

**ACE Version**: 1.0
**ProjectAura**: AI-Powered Palliative Care Platform
"""
    
    Path('dist/ACE_README.txt').write_text(readme_content)
    print("\n✓ Created ACE_README.txt in dist/")

def main():
    print_header("ACE.exe Builder")
    
    # Check if ace.py exists
    if not Path('ace.py').exists():
        print("✗ ace.py not found in current directory")
        print("  Please run this script from the ProjectAura root directory")
        sys.exit(1)
    
    print("Building ACE.exe for ProjectAura\n")
    
    # Step 1: Check PyInstaller
    if not check_pyinstaller():
        print("✗ PyInstaller not found")
        if not install_pyinstaller():
            print("\n✗ Cannot proceed without PyInstaller")
            print("  Please install manually: pip install pyinstaller")
            sys.exit(1)
    
    # Step 2: Build EXE
    if not build_exe():
        print("\n✗ Build failed. See errors above.")
        sys.exit(1)
    
    # Step 3: Create README
    create_readme()
    
    # Success message
    print_header("Build Complete!")
    print("✓ ACE.exe is ready to use!")
    print("\nNext steps:")
    print("  1. Find ace.exe in the 'dist' folder")
    print("  2. Copy ace.exe to your ProjectAura root directory")
    print("  3. Double-click ace.exe to start the application")
    print("\nOptional:")
    print("  • Read dist/ACE_README.txt for usage instructions")
    print("  • Create a desktop shortcut to ace.exe for easy access")
    print("  • Share ace.exe with team members (they still need Node.js/Python)")
    print("\nHappy coding! 🚀\n")

if __name__ == '__main__':
    main()
