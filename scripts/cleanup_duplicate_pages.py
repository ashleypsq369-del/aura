#!/usr/bin/env python3
"""
Clean up duplicate pages - keep only the professional versions
"""
import os

print("=" * 70)
print("CLEANING UP DUPLICATE PAGES")
print("=" * 70)

# Pages to DELETE (duplicates/old versions)
pages_to_remove = [
    'pages/2_Dashboard_Enhanced.py',
    'pages/2_Dashboard_OLD.py', 
    'pages/2_Dashboard_Seamless.py',
    'pages/7_Support_Hub.py',
    'pages/7_Support_Hub_Enhanced.py',
    'pages/8_Bereavement_Bridge.py'
]

print("\n[1/2] Removing duplicate pages...")
for page in pages_to_remove:
    if os.path.exists(page):
        os.remove(page)
        print(f"  ✓ Removed: {page}")
    else:
        print(f"  - Not found: {page}")

# Rename the "Complete" versions to be the main versions
print("\n[2/2] Renaming Complete versions to main...")

renames = [
    ('pages/7_Support_Hub_Complete.py', 'pages/7_Support_Hub.py'),
    ('pages/8_Bereavement_Bridge_Complete.py', 'pages/8_Bereavement_Bridge.py')
]

for old_name, new_name in renames:
    if os.path.exists(old_name):
        if os.path.exists(new_name):
            os.remove(new_name)
        os.rename(old_name, new_name)
        print(f"  ✓ Renamed: {old_name} → {new_name}")

print("\n" + "=" * 70)
print("✅ CLEANUP COMPLETE!")
print("=" * 70)

print("\n📋 Final page list (18 pages):")
final_pages = [
    '1_Login.py',
    '2_Dashboard.py',
    '3_Log_Data.py',
    '4_View_Trends.py',
    '5_AI_Insights.py',
    '6_Alerts.py',
    '7_Support_Hub.py',
    '8_Bereavement_Bridge.py',
    '9_Patient_Onboarding.py',
    '10_Clinical_Simulation.py',
    '11_Medication_Management.py',
    '12_Appointment_Scheduling.py',
    '13_Caregiver_Portal.py',
    '14_Memory_Vault.py',
    '15_Journal.py',
    '16_Care_Plan.py',
    '17_Functional_Status.py',
    '18_AI_Chatbot.py'
]

for i, page in enumerate(final_pages, 1):
    page_path = f'pages/{page}'
    status = "✓" if os.path.exists(page_path) else "✗"
    print(f"  {status} {i:2d}. {page}")

print("\n🚀 Restart Streamlit to see clean navigation!")
print("=" * 70)
