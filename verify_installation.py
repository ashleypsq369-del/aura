"""
Verification script for Project Aura installation
Checks that all required files and modules are present
"""

import os
import sys

def check_file(filepath, description):
    """Check if a file exists"""
    exists = os.path.exists(filepath)
    status = "✓" if exists else "✗"
    print(f"  {status} {description}: {filepath}")
    return exists

def check_directory(dirpath, description):
    """Check if a directory exists"""
    exists = os.path.isdir(dirpath)
    status = "✓" if exists else "✗"
    print(f"  {status} {description}: {dirpath}")
    return exists

def verify_installation():
    """Verify Project Aura installation"""
    print("=" * 60)
    print("PROJECT AURA - INSTALLATION VERIFICATION")
    print("=" * 60)
    
    all_good = True
    
    # Check directories
    print("\n1. Checking Directories...")
    all_good &= check_directory("src", "Source code directory")
    all_good &= check_directory("pages", "Streamlit pages directory")
    all_good &= check_directory("data", "Data directory")
    all_good &= check_directory("models", "Models directory")
    all_good &= check_directory("tests", "Tests directory")
    all_good &= check_directory("logs", "Logs directory")
    all_good &= check_directory("docs", "Documentation directory")
    
    # Check backend modules
    print("\n2. Checking Backend Modules...")
    all_good &= check_file("src/db.py", "Database layer")
    all_good &= check_file("src/models.py", "XAI Engine")
    all_good &= check_file("src/simulator.py", "Synthetic data generator")
    all_good &= check_file("src/alerts.py", "Alert system")
    all_good &= check_file("src/chat.py", "Support Hub")
    all_good &= check_file("src/bereavement.py", "Bereavement Bridge")
    
    # Check Streamlit pages
    print("\n3. Checking Streamlit Pages...")
    all_good &= check_file("app.py", "Main application")
    all_good &= check_file("pages/1_Login.py", "Login page")
    all_good &= check_file("pages/2_Dashboard.py", "Dashboard page")
    all_good &= check_file("pages/3_Log_Data.py", "Log Data page")
    all_good &= check_file("pages/4_AI_Insights.py", "AI Insights page")
    all_good &= check_file("pages/5_Alerts.py", "Alerts page")
    
    # Check configuration files
    print("\n4. Checking Configuration Files...")
    all_good &= check_file("requirements.txt", "Dependencies")
    all_good &= check_file(".env.example", "Environment template")
    all_good &= check_file(".gitignore", "Git ignore rules")
    all_good &= check_file("setup.py", "Setup script")
    
    # Check documentation
    print("\n5. Checking Documentation...")
    all_good &= check_file("README.md", "README")
    all_good &= check_file("QUICKSTART.md", "Quick start guide")
    all_good &= check_file("IMPLEMENTATION_SUMMARY.md", "Implementation summary")
    all_good &= check_file("PROJECT_COMPLETE.txt", "Completion status")
    
    # Try importing modules
    print("\n6. Testing Module Imports...")
    try:
        sys.path.insert(0, 'src')
        import db
        print("  ✓ Database module imports successfully")
    except Exception as e:
        print(f"  ✗ Database module import failed: {e}")
        all_good = False
    
    try:
        import simulator
        print("  ✓ Simulator module imports successfully")
    except Exception as e:
        print(f"  ✗ Simulator module import failed: {e}")
        all_good = False
    
    try:
        import models
        print("  ✓ Models module imports successfully")
    except Exception as e:
        print(f"  ✗ Models module import failed: {e}")
        all_good = False
    
    try:
        import alerts
        print("  ✓ Alerts module imports successfully")
    except Exception as e:
        print(f"  ✗ Alerts module import failed: {e}")
        all_good = False
    
    try:
        import chat
        print("  ✓ Chat module imports successfully")
    except Exception as e:
        print(f"  ✗ Chat module import failed: {e}")
        all_good = False
    
    try:
        import bereavement
        print("  ✓ Bereavement module imports successfully")
    except Exception as e:
        print(f"  ✗ Bereavement module import failed: {e}")
        all_good = False
    
    # Final status
    print("\n" + "=" * 60)
    if all_good:
        print("✓ VERIFICATION PASSED - All components present!")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. pip install -r requirements.txt")
        print("  2. python setup.py")
        print("  3. streamlit run app.py")
    else:
        print("✗ VERIFICATION FAILED - Some components missing")
        print("=" * 60)
        print("\nPlease check the errors above and ensure all files are present.")
    
    return all_good

if __name__ == "__main__":
    success = verify_installation()
    sys.exit(0 if success else 1)
