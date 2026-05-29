"""Project AURA - Quick Start Script"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

def print_banner():
    """Print startup banner"""
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║                    PROJECT AURA                               ║
    ║         AI-Powered Hospice Care Platform                      ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_setup():
    """Check if setup is complete"""
    print("🔍 Checking system setup...")
    
    required_files = [
        'aura.db',
        'requirements.txt',
        'app.py',
        'src/db.py'
    ]
    
    missing = []
    for file in required_files:
        if not os.path.exists(file):
            missing.append(file)
    
    if missing:
        print("\n❌ Setup incomplete. Missing files:")
        for file in missing:
            print(f"   - {file}")
        print("\n💡 Run setup first:")
        print("   python scripts/comprehensive_setup.py")
        return False
    
    print("✅ System setup verified")
    return True

def start_application():
    """Start the Streamlit application"""
    print("\n🚀 Starting Project AURA...")
    print("   Please wait while the application loads...")
    
    try:
        # Start streamlit
        process = subprocess.Popen(
            [sys.executable, "-m", "streamlit", "run", "app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit for server to start
        time.sleep(3)
        
        # Open browser
        print("\n✅ Application started successfully!")
        print("\n📱 Opening browser...")
        print("   URL: http://localhost:8501")
        
        webbrowser.open('http://localhost:8501')
        
        print("\n" + "="*70)
        print("  APPLICATION RUNNING")
        print("="*70)
        print("\n📋 Default Login Credentials:")
        print("   Admin:     admin / admin123")
        print("   Doctor:    doctor / doctor123")
        print("   Family:    family / family123")
        print("\n💡 Press Ctrl+C to stop the application")
        print("="*70 + "\n")
        
        # Wait for process
        process.wait()
        
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down Project AURA...")
        process.terminate()
        print("✅ Application stopped")
    except Exception as e:
        print(f"\n❌ Error starting application: {e}")
        return False
    
    return True

def main():
    """Main function"""
    print_banner()
    
    if not check_setup():
        sys.exit(1)
    
    start_application()

if __name__ == '__main__':
    main()
