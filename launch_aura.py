"""
Project Aura Launcher
Starts Backend (FastAPI) + Frontend (Vite/React) and opens the browser.
Each server runs in its own dedicated console window (no reload loops).
"""

import subprocess
import sys
import os
import time
import webbrowser
import ctypes
from pathlib import Path

# ─── Hardcoded project root ───────────────────────────────────────────────────
PROJECT_ROOT = Path(r"c:\xampp\htdocs\ProjectAura_React")
BACKEND_DIR  = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BACKEND_URL  = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

# ─── Find python executable (system python, NOT this EXE) ────────────────────
def find_python() -> str:
    """Return path to the real python.exe, never this frozen EXE."""
    candidates = [
        r"C:\Users\User\AppData\Local\Programs\Python\Python311\python.exe",
        r"C:\Python311\python.exe",
        r"C:\Python310\python.exe",
        r"C:\Python39\python.exe",
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    # Fallback: search PATH
    r = subprocess.run(["where", "python"], capture_output=True, text=True, shell=True)
    for line in r.stdout.strip().splitlines():
        line = line.strip()
        # Skip if this IS the frozen exe
        if line.lower().endswith(".exe") and "projectaura" not in line.lower():
            return line
    return "python"

PYTHON = find_python()

# ─── Console helpers ──────────────────────────────────────────────────────────
def set_title(t):
    ctypes.windll.kernel32.SetConsoleTitleW(t)

def cls():
    os.system("cls")

C  = "\033[96m"   # cyan
G  = "\033[92m"   # green
Y  = "\033[93m"   # yellow
R  = "\033[91m"   # red
B  = "\033[1m"    # bold
X  = "\033[0m"    # reset

def banner():
    cls()
    print(f"""{C}{B}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ░█████╗░██╗   ██╗██████╗░░█████╗░                       ║
║     ██╔══██╗██║   ██║██╔══██╗██╔══██╗                       ║
║     ███████║██║   ██║██████╔╝███████║                       ║
║     ██╔══██║██║   ██║██╔══██╗██╔══██║                       ║
║     ██║  ██║╚██████╔╝██║  ██║██║  ██║                       ║
║     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝                      ║
║                                                              ║
║        AI-Powered Palliative Care Platform                   ║
║              University of Ghana  2026                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
{X}""")

# ─── Dependency checks ────────────────────────────────────────────────────────
def check_node():
    try:
        r = subprocess.run(["node", "--version"],
                           capture_output=True, text=True, timeout=10, shell=True)
        return r.returncode == 0, r.stdout.strip()
    except Exception:
        return False, "not found"

def check_npm():
    try:
        r = subprocess.run(["npm", "--version"],
                           capture_output=True, text=True, timeout=10, shell=True)
        return r.returncode == 0, r.stdout.strip()
    except Exception:
        return False, "not found"

def install_python_deps():
    req = BACKEND_DIR / "requirements.txt"
    if not req.exists():
        return True
    print(f"  {C}→{X} Installing Python packages…")
    r = subprocess.run(
        [PYTHON, "-m", "pip", "install", "-r", str(req), "-q"],
        timeout=300, capture_output=True, text=True
    )
    return r.returncode == 0

def install_node_deps():
    if (FRONTEND_DIR / "node_modules").exists():
        return True
    print(f"  {C}→{X} Installing npm packages (first-time setup, ~1 min)…")
    r = subprocess.run(
        ["npm", "install"],
        cwd=str(FRONTEND_DIR),
        shell=True,
        timeout=300,
        capture_output=True,
        text=True
    )
    return r.returncode == 0

# ─── Server launchers ─────────────────────────────────────────────────────────
# Each server is launched via `cmd /c start "" "cmd" /k <command>`
# This opens ONE new console window that stays open and does NOT loop.
# Key: we use the real python.exe path and NO --reload flag.

def start_backend() -> subprocess.Popen:
    """Open a new console window running uvicorn (no --reload to avoid loop)."""
    cmd = (
        f'start "Project Aura - Backend" cmd /k '
        f'"cd /d {BACKEND_DIR} && '
        f'{PYTHON} -m uvicorn main:app --host 0.0.0.0 --port 8000"'
    )
    proc = subprocess.Popen(cmd, shell=True, cwd=str(BACKEND_DIR))
    time.sleep(5)   # give uvicorn time to bind the port
    return proc

def start_frontend() -> subprocess.Popen:
    """Open a new console window running Vite dev server."""
    cmd = (
        f'start "Project Aura - Frontend" cmd /k '
        f'"cd /d {FRONTEND_DIR} && npm run dev"'
    )
    proc = subprocess.Popen(cmd, shell=True, cwd=str(FRONTEND_DIR))
    time.sleep(7)   # give Vite time to compile
    return proc

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    set_title("Project Aura Launcher")
    banner()

    # 1 ── Validate project structure ─────────────────────────────────────────
    print(f"{B}[1/6]{X} Checking project structure…")
    missing = []
    for p in [BACKEND_DIR, FRONTEND_DIR,
               BACKEND_DIR / "main.py",
               FRONTEND_DIR / "package.json"]:
        if not p.exists():
            missing.append(str(p))
    if missing:
        for m in missing:
            print(f"  {R}✗ Missing: {m}{X}")
        input(f"\n{R}Project files not found. Press Enter to exit.{X}")
        sys.exit(1)
    print(f"  {G}✓{X} Project root: {PROJECT_ROOT}")

    # 2 ── Check Python ────────────────────────────────────────────────────────
    print(f"\n{B}[2/6]{X} Python interpreter…")
    print(f"  {G}✓{X} Using: {PYTHON}")

    # 3 ── Check Node / npm ────────────────────────────────────────────────────
    print(f"\n{B}[3/6]{X} Checking Node.js…")
    node_ok, node_ver = check_node()
    npm_ok,  npm_ver  = check_npm()
    if not node_ok or not npm_ok:
        print(f"  {R}✗ Node.js or npm not found. Install Node.js then retry.{X}")
        input("Press Enter to exit.")
        sys.exit(1)
    print(f"  {G}✓{X} Node.js {node_ver}  |  npm {npm_ver}")

    # 4 ── Install Python deps ─────────────────────────────────────────────────
    print(f"\n{B}[4/6]{X} Backend Python packages…")
    if install_python_deps():
        print(f"  {G}✓{X} Python dependencies ready")
    else:
        print(f"  {Y}⚠{X} Some packages may be missing (continuing anyway)")

    # 5 ── Install npm deps ────────────────────────────────────────────────────
    print(f"\n{B}[5/6]{X} Frontend npm packages…")
    if install_node_deps():
        print(f"  {G}✓{X} npm dependencies ready")
    else:
        print(f"  {Y}⚠{X} npm install had issues (continuing anyway)")

    # 6 ── Launch servers ──────────────────────────────────────────────────────
    print(f"\n{B}[6/6]{X} Launching servers…")

    print(f"  {C}→{X} Starting Backend  (port 8000)…")
    start_backend()
    print(f"  {G}✓{X} Backend window opened")

    print(f"  {C}→{X} Starting Frontend (port 5173)…")
    start_frontend()
    print(f"  {G}✓{X} Frontend window opened")

    # ── Open browser ──────────────────────────────────────────────────────────
    print(f"\n  {C}→{X} Opening browser…")
    webbrowser.open(FRONTEND_URL)

    # ── Done ──────────────────────────────────────────────────────────────────
    print(f"""
{G}{B}
╔══════════════════════════════════════════════════════════════╗
║            🚀  PROJECT AURA IS RUNNING!  🚀                  ║
╚══════════════════════════════════════════════════════════════╝
{X}
  {B}Frontend :{X}  {FRONTEND_URL}
  {B}Backend  :{X}  {BACKEND_URL}
  {B}API Docs :{X}  {BACKEND_URL}/docs

  {B}Demo accounts:{X}
    clinician / clinician123      patient  / patient123
    family    / family123         caregiver/ caregiver123
    admin     / admin123

  {Y}Close the Backend and Frontend console windows to stop the servers.{X}
  {Y}This launcher window can be closed now.{X}
""")
    input("Press Enter to close this launcher…")


if __name__ == "__main__":
    main()
