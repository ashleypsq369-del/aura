"""Comprehensive System Verification Script"""

import os
import sys

def check_file(path, description):
    """Check if a file exists"""
    exists = os.path.exists(path)
    status = "✓" if exists else "✗"
    print(f"  {status} {description}: {path}")
    return exists

def check_directory(path, description):
    """Check if a directory exists"""
    exists = os.path.isdir(path)
    status = "✓" if exists else "✗"
    print(f"  {status} {description}: {path}")
    return exists

def main():
    print("=" * 60)
    print("PROJECT AURA - COMPLETE SYSTEM VERIFICATION")
    print("=" * 60)
    
    total_checks = 0
    passed_checks = 0
    
    # Check core application files
    print("\n1. Core Application Files...")
    core_files = [
        ("app.py", "Main application"),
        ("app_new.py", "Alternative entry"),
        ("app_single.py", "Single-page version"),
        ("main.py", "CLI entry point"),
        ("start_aura.py", "Deployment launcher"),
    ]
    
    for file, desc in core_files:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Check all 17 pages
    print("\n2. Streamlit Pages (17 total)...")
    pages = [
        ("pages/1_Login.py", "Login & Authentication"),
        ("pages/2_Dashboard.py", "Dashboard"),
        ("pages/3_Log_Data.py", "Data Logging"),
        ("pages/4_View_Trends.py", "Trend Analysis"),
        ("pages/5_AI_Insights.py", "AI Insights"),
        ("pages/6_Alerts.py", "Alert Management"),
        ("pages/7_Support_Hub.py", "Support Hub"),
        ("pages/8_Bereavement_Bridge.py", "Bereavement Support"),
        ("pages/9_Patient_Onboarding.py", "Patient Onboarding"),
        ("pages/10_Clinical_Simulation.py", "Clinical Simulation"),
        ("pages/11_Medication_Management.py", "Medication Management"),
        ("pages/12_Appointment_Scheduling.py", "Appointment Scheduling"),
        ("pages/13_Caregiver_Portal.py", "Caregiver Portal"),
        ("pages/14_Memory_Vault.py", "Memory Vault"),
        ("pages/15_Journal.py", "Journal"),
        ("pages/16_Care_Plan.py", "Care Plan"),
        ("pages/17_Functional_Status.py", "Functional Status"),
    ]
    
    for file, desc in pages:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Check core modules
    print("\n3. Core Modules (src/)...")
    modules = [
        ("src/__init__.py", "Package init"),
        ("src/db.py", "Database operations"),
        ("src/simulator.py", "Clinical simulator"),
        ("src/xai.py", "Explainable AI"),
        ("src/alerts.py", "Alert system"),
        ("src/notifications.py", "Notifications"),
        ("src/analytics.py", "Analytics"),
        ("src/reporting.py", "Reporting"),
        ("src/audit.py", "Audit logging"),
        ("src/medication.py", "Medication management"),
        ("src/scheduling.py", "Scheduling"),
        ("src/caregiver.py", "Caregiver support"),
        ("src/memory_vault.py", "Memory vault"),
        ("src/journal.py", "Journaling"),
        ("src/care_plan.py", "Care planning"),
        ("src/functional_status.py", "Functional status"),
        ("src/bereavement_enhanced.py", "Bereavement support"),
        ("src/navigation.py", "Navigation"),
        ("src/styles.py", "Styling"),
        ("src/theme.py", "Theme management"),
        ("src/models.py", "Data models"),
    ]
    
    for file, desc in modules:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Check data files
    print("\n4. Data Files...")
    data_files = [
        ("data/resources.json", "Support resources"),
        ("data/bereavement_resources.json", "Bereavement resources"),
        ("data/bereavement_resources_extended.json", "Extended bereavement"),
        ("data/medications.json", "Medication database"),
    ]
    
    for file, desc in data_files:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Check configuration
    print("\n5. Configuration Files...")
    config_files = [
        (".streamlit/config.toml", "Streamlit config"),
        (".env.example", "Environment template"),
        ("requirements.txt", "Dependencies"),
        ("setup.py", "Package setup"),
        (".gitignore", "Git ignore"),
    ]
    
    for file, desc in config_files:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Check assets
    print("\n6. Assets...")
    asset_files = [
        ("assets/healthcare_theme.css", "Healthcare theme"),
        ("assets/animations.css", "Animations"),
        ("assets/icons.py", "Icons"),
        ("assets/fonts/inter.css", "Typography"),
    ]
    
    for file, desc in asset_files:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Check directories
    print("\n7. Required Directories...")
    directories = [
        ("src", "Source code"),
        ("pages", "Streamlit pages"),
        ("data", "Data files"),
        ("tests", "Test suite"),
        ("scripts", "Utility scripts"),
        ("assets", "Static assets"),
        ("logs", "Log files"),
        ("models", "ML models"),
    ]
    
    for dir_path, desc in directories:
        total_checks += 1
        if check_directory(dir_path, desc):
            passed_checks += 1
    
    # Check key scripts
    print("\n8. Utility Scripts...")
    scripts = [
        ("scripts/setup_demo_users.py", "Demo user setup"),
        ("scripts/migrate_database.py", "Database migration"),
        ("scripts/comprehensive_setup.py", "System setup"),
    ]
    
    for file, desc in scripts:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Check documentation
    print("\n9. Documentation...")
    docs = [
        ("README.md", "Project README"),
        ("USER_GUIDE.md", "User guide"),
        ("QUICK_START_GUIDE.md", "Quick start"),
        ("DEPLOYMENT_GUIDE.md", "Deployment guide"),
        ("SYSTEM_STATUS_COMPLETE.md", "System status"),
    ]
    
    for file, desc in docs:
        total_checks += 1
        if check_file(file, desc):
            passed_checks += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"Total Checks: {total_checks}")
    print(f"Passed: {passed_checks}")
    print(f"Failed: {total_checks - passed_checks}")
    print(f"Success Rate: {(passed_checks/total_checks)*100:.1f}%")
    
    if passed_checks == total_checks:
        print("\n✅ ALL CHECKS PASSED - SYSTEM IS COMPLETE!")
        print("\n🚀 Ready to launch:")
        print("   streamlit run app.py")
        return 0
    else:
        print(f"\n⚠️  {total_checks - passed_checks} checks failed")
        print("   Review missing files above")
        return 1

if __name__ == "__main__":
    sys.exit(main())
