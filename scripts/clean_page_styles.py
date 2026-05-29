"""
Remove inline CSS from pages since it's now in navigation module
"""

import os
import re

pages_to_clean = [
    "3_Log_Data.py",
    "4_View_Trends.py",
    "5_AI_Insights.py",
    "6_Alerts.py",
    "7_Support_Hub.py",
    "8_Bereavement_Bridge.py",
    "9_Patient_Onboarding.py",
    "10_Clinical_Simulation.py",
    "11_Medication_Management.py",
    "12_Appointment_Scheduling.py",
    "13_Caregiver_Portal.py",
    "14_Memory_Vault.py",
    "15_Journal.py",
    "16_Care_Plan.py",
    "17_Functional_Status.py"
]

for page_file in pages_to_clean:
    filepath = f"pages/{page_file}"
    
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the inline CSS hiding navigation
    content = re.sub(
        r'# Hide default navigation\s*st\.markdown\(\'<style>\[data-testid="stSidebarNav"\][^<]+</style>\',\s*unsafe_allow_html=True\)\s*\n',
        '',
        content
    )
    
    # Also remove any other variations
    content = re.sub(
        r'st\.markdown\([\'"]<style>\[data-testid=["\']stSidebarNav["\']\][^<]+</style>[\'"],\s*unsafe_allow_html=True\)\s*\n',
        '',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Cleaned {page_file}")

print("\n✅ All pages cleaned!")
