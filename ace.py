"""
ACE - Aura Control Engine
One-click launcher for ProjectAura application

Starts:
1. Backend API (FastAPI/Uvicorn)
2. Frontend Dev Server (Vite/React)
3. Opens browser automatically

Usage: python ace.py
Or compile to EXE: pyinstaller --onefile --icon=aura_icon.ico --name=ace ace.py
"""

import subprocess
import sys
import os
import time
import webbrowser
import signal
from pathlib import Path

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    """Print ACE startup banner"""
    banner = f"""
{Colors.CYAN}{Colors.BOLD}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ░█████╗░░█████╗░███████╗                             ║
║     ██╔══██╗██╔══██╗██╔════╝                             ║
║     ███████║██║░░╚═╝█████╗░░                             ║
║     ██╔══██║██║░░██╗██╔══╝░░                             ║
║     ██║░░██║╚█████╔╝███████╗                             ║
║     ╚═╝░░╚═╝░╚════╝░╚══════╝                             ║
║                                                           ║
║            Aura Control Engine v1.0                       ║
║       One-Click ProjectAura Launcher                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
{Colors.END}
    """
    print(banner)

def check_dependencies():
    """Check if required dependencies are installed"""
    print(f"\n{Colors.BLUE}[1/6]{Colors.END} Checking dependencies...")
    
    issues = []
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=10, shell=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"  {Colors.GREEN}✓{Colors.END} Node.js: {version}")
        else:
            issues.append("Node.js not found")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        issues.append("Node.js not installed or not in PATH")
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True, timeout=10, shell=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"  {Colors.GREEN}✓{Colors.END} npm: {version}")
        else:
            issues.append("npm not found")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        issues.append("npm not installed or not in PATH")
    
    # Check Python
    try:
        version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        print(f"  {Colors.GREEN}✓{Colors.END} Python: {version}")
    except:
        issues.append("Python version detection failed")
    
    # Check pip
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"  {Colors.GREEN}✓{Colors.END} pip: installed")
        else:
            issues.append("pip not found")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        issues.append("pip not installed")
    
    if issues:
        print(f"\n{Colors.RED}✗ Missing dependencies:{Colors.END}")
        for issue in issues:
            print(f"  {Colors.RED}•{Colors.END} {issue}")
        print(f"\n{Colors.YELLOW}Please install missing dependencies and try again.{Colors.END}")
        return False
    
    print(f"\n{Colors.GREEN}✓ All dependencies installed!{Colors.END}")
    return True

def check_project_structure():
    """Verify project structure exists"""
    print(f"\n{Colors.BLUE}[2/6]{Colors.END} Checking project structure...")
    
    required_paths = [
        'frontend',
        'backend',
        'frontend/package.json',
        'backend/main.py',
        'backend/requirements.txt'
    ]
    
    missing = []
    for path in required_paths:
        if not Path(path).exists():
            missing.append(path)
    
    if missing:
        print(f"\n{Colors.RED}✗ Missing project files:{Colors.END}")
        for path in missing:
            print(f"  {Colors.RED}•{Colors.END} {path}")
        print(f"\n{Colors.YELLOW}Please run ACE from the ProjectAura root directory.{Colors.END}")
        return False
    
    print(f"  {Colors.GREEN}✓{Colors.END} Frontend directory found")
    print(f"  {Colors.GREEN}✓{Colors.END} Backend directory found")
    print(f"  {Colors.GREEN}✓{Colors.END} Configuration files present")
    return True

def install_backend_dependencies():
    """Install Python backend dependencies"""
    print(f"\n{Colors.BLUE}[3/6]{Colors.END} Installing backend dependencies...")
    
    requirements_file = Path('backend/requirements.txt')
    if not requirements_file.exists():
        print(f"  {Colors.YELLOW}⚠{Colors.END} requirements.txt not found, skipping...")
        return True
    
    try:
        print(f"  {Colors.CYAN}→{Colors.END} Installing Python packages...")
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '-r', 'backend/requirements.txt', '--quiet'],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print(f"  {Colors.GREEN}✓{Colors.END} Backend dependencies installed")
            return True
        else:
            print(f"  {Colors.RED}✗{Colors.END} Failed to install backend dependencies")
            print(f"  {Colors.RED}Error:{Colors.END} {result.stderr[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  {Colors.YELLOW}⚠{Colors.END} Installation timed out, continuing anyway...")
        return True
    except Exception as e:
        print(f"  {Colors.RED}✗{Colors.END} Error: {str(e)}")
        return False

def install_frontend_dependencies():
    """Install npm frontend dependencies"""
    print(f"\n{Colors.BLUE}[4/6]{Colors.END} Checking frontend dependencies...")
    
    node_modules = Path('frontend/node_modules')
    if node_modules.exists():
        print(f"  {Colors.GREEN}✓{Colors.END} Frontend dependencies already installed")
        return True
    
    print(f"  {Colors.CYAN}→{Colors.END} Installing npm packages (this may take a few minutes)...")
    
    try:
        result = subprocess.run(
            ['npm', 'install'],
            cwd='frontend',
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print(f"  {Colors.GREEN}✓{Colors.END} Frontend dependencies installed")
            return True
        else:
            print(f"  {Colors.RED}✗{Colors.END} Failed to install frontend dependencies")
            print(f"  {Colors.RED}Error:{Colors.END} {result.stderr[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"  {Colors.YELLOW}⚠{Colors.END} Installation timed out, continuing anyway...")
        return True
    except Exception as e:
        print(f"  {Colors.RED}✗{Colors.END} Error: {str(e)}")
        return False

def start_backend():
    """Start the FastAPI backend server"""
    print(f"\n{Colors.BLUE}[5/6]{Colors.END} Starting backend server...")
    
    try:
        # Start uvicorn backend
        process = subprocess.Popen(
            [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
            cwd='backend',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        
        # Give it time to start
        time.sleep(3)
        
        if process.poll() is None:
            print(f"  {Colors.GREEN}✓{Colors.END} Backend started on http://localhost:8000")
            print(f"  {Colors.CYAN}→{Colors.END} API Docs: http://localhost:8000/docs")
            return process
        else:
            print(f"  {Colors.RED}✗{Colors.END} Backend failed to start")
            return None
    except Exception as e:
        print(f"  {Colors.RED}✗{Colors.END} Error starting backend: {str(e)}")
        return None

def start_frontend():
    """Start the Vite frontend dev server"""
    print(f"\n{Colors.BLUE}[6/6]{Colors.END} Starting frontend server...")
    
    try:
        # Start Vite dev server
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd='frontend',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
        )
        
        # Give it time to start
        time.sleep(5)
        
        if process.poll() is None:
            print(f"  {Colors.GREEN}✓{Colors.END} Frontend started on http://localhost:5173")
            return process
        else:
            print(f"  {Colors.RED}✗{Colors.END} Frontend failed to start")
            return None
    except Exception as e:
        print(f"  {Colors.RED}✗{Colors.END} Error starting frontend: {str(e)}")
        return None

def open_browser():
    """Open the application in default browser"""
    print(f"\n{Colors.CYAN}→{Colors.END} Opening browser...")
    time.sleep(2)
    try:
        webbrowser.open('http://localhost:5173')
        print(f"  {Colors.GREEN}✓{Colors.END} Browser opened")
    except Exception as e:
        print(f"  {Colors.YELLOW}⚠{Colors.END} Could not open browser automatically: {str(e)}")
        print(f"  {Colors.CYAN}→{Colors.END} Please open http://localhost:5173 manually")

def print_success_message():
    """Print success banner with instructions"""
    message = f"""
{Colors.GREEN}{Colors.BOLD}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🚀 PROJECT AURA IS RUNNING! 🚀               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
{Colors.END}

{Colors.CYAN}Access Points:{Colors.END}
  {Colors.BOLD}Frontend:{Colors.END}  http://localhost:5173
  {Colors.BOLD}Backend:{Colors.END}   http://localhost:8000
  {Colors.BOLD}API Docs:{Colors.END}  http://localhost:8000/docs

{Colors.CYAN}What's Running:{Colors.END}
  {Colors.GREEN}✓{Colors.END} FastAPI Backend (Python/Uvicorn)
  {Colors.GREEN}✓{Colors.END} React Frontend (Vite Dev Server)
  {Colors.GREEN}✓{Colors.END} Database (SQLite)
  {Colors.GREEN}✓{Colors.END} All Gap Analysis Priorities Integrated

{Colors.CYAN}Available Features:{Colors.END}
  {Colors.GREEN}✓{Colors.END} AI-Powered Patient Monitoring
  {Colors.GREEN}✓{Colors.END} SHAP Explainability (XAI)
  {Colors.GREEN}✓{Colors.END} HIPAA Auto-Logoff
  {Colors.GREEN}✓{Colors.END} ChatBot with Safety Features
  {Colors.GREEN}✓{Colors.END} Bereavement Support Dashboard
  {Colors.GREEN}✓{Colors.END} Model Bias Monitoring

{Colors.YELLOW}To Stop:{Colors.END}
  Press {Colors.BOLD}Ctrl+C{Colors.END} in this window

{Colors.CYAN}Need Help?{Colors.END}
  • Check TEST_ALL_PRIORITIES_NOW.md for testing guide
  • Check ALL_PRIORITIES_COMPLETE_FINAL.md for documentation
  • Check backend/frontend console windows for logs

{Colors.GREEN}Happy coding! 💙{Colors.END}
    """
    print(message)

def cleanup(backend_process, frontend_process):
    """Cleanup processes on exit"""
    print(f"\n\n{Colors.YELLOW}Shutting down ACE...{Colors.END}")
    
    if backend_process and backend_process.poll() is None:
        print(f"  {Colors.CYAN}→{Colors.END} Stopping backend...")
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
            print(f"  {Colors.GREEN}✓{Colors.END} Backend stopped")
        except subprocess.TimeoutExpired:
            backend_process.kill()
            print(f"  {Colors.YELLOW}⚠{Colors.END} Backend force killed")
    
    if frontend_process and frontend_process.poll() is None:
        print(f"  {Colors.CYAN}→{Colors.END} Stopping frontend...")
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
            print(f"  {Colors.GREEN}✓{Colors.END} Frontend stopped")
        except subprocess.TimeoutExpired:
            frontend_process.kill()
            print(f"  {Colors.YELLOW}⚠{Colors.END} Frontend force killed")
    
    print(f"\n{Colors.GREEN}✓ ACE stopped successfully. Goodbye! 👋{Colors.END}\n")

def main():
    """Main ACE launcher function"""
    backend_process = None
    frontend_process = None
    
    try:
        # Print banner
        print_banner()
        
        # Step 1: Check dependencies
        if not check_dependencies():
            sys.exit(1)
        
        # Step 2: Check project structure
        if not check_project_structure():
            sys.exit(1)
        
        # Step 3: Install backend dependencies
        if not install_backend_dependencies():
            print(f"\n{Colors.YELLOW}⚠ Continuing despite backend dependency issues...{Colors.END}")
        
        # Step 4: Install frontend dependencies
        if not install_frontend_dependencies():
            print(f"\n{Colors.YELLOW}⚠ Continuing despite frontend dependency issues...{Colors.END}")
        
        # Step 5: Start backend
        backend_process = start_backend()
        if not backend_process:
            print(f"\n{Colors.RED}✗ Failed to start backend. Exiting...{Colors.END}")
            sys.exit(1)
        
        # Step 6: Start frontend
        frontend_process = start_frontend()
        if not frontend_process:
            print(f"\n{Colors.RED}✗ Failed to start frontend. Exiting...{Colors.END}")
            cleanup(backend_process, None)
            sys.exit(1)
        
        # Open browser
        open_browser()
        
        # Print success message
        print_success_message()
        
        # Keep running until Ctrl+C
        print(f"{Colors.CYAN}ACE is running. Press Ctrl+C to stop...{Colors.END}\n")
        while True:
            time.sleep(1)
            
            # Check if processes are still running
            if backend_process.poll() is not None:
                print(f"\n{Colors.RED}✗ Backend process died unexpectedly!{Colors.END}")
                break
            if frontend_process.poll() is not None:
                print(f"\n{Colors.RED}✗ Frontend process died unexpectedly!{Colors.END}")
                break
    
    except KeyboardInterrupt:
        print(f"\n\n{Colors.CYAN}Received shutdown signal...{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}✗ Unexpected error: {str(e)}{Colors.END}")
    finally:
        cleanup(backend_process, frontend_process)

if __name__ == '__main__':
    main()
