"""
Script to add navigation to all pages
"""

import os
import re

# Pages to update (excluding Login and Dashboard which are already done)
pages_to_update = [
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

for page_file in pages_to_update:
    filepath = f"pages/{page_file}"
    
    if not os.path.exists(filepath):
        print(f"Skipping {page_file} - file not found")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if navigation is already imported
    if 'from src.navigation import render_sidebar' in content:
        print(f"Skipping {page_file} - navigation already added")
        continue
    
    # Add navigation import after other imports
    if 'from src import db' in content:
        content = content.replace(
            'from src import db',
            'from src import db\nfrom src.navigation import render_sidebar'
        )
    
    # Add hide default nav CSS after st.set_page_config
    if 'st.set_page_config(' in content:
        # Find the closing parenthesis of set_page_config
        config_end = content.find(')', content.find('st.set_page_config(')) + 1
        insert_pos = content.find('\n', config_end) + 1
        
        hide_nav_css = '\n# Hide default navigation\nst.markdown(\'<style>[data-testid="stSidebarNav"] {display: none;}</style>\', unsafe_allow_html=True)\n'
        content = content[:insert_pos] + hide_nav_css + content[insert_pos:]
    
    # Add render_sidebar() call after authentication check
    # Look for the authentication check pattern
    auth_patterns = [
        (r'if not st\.session_state\.get\([\'"]authenticated[\'"],[^)]+\):\s+st\.warning\([^)]+\)\s+st\.stop\(\)',
         lambda m: m.group(0).replace('st.stop()', 'st.switch_page("pages/1_Login.py")\n\n# Render custom sidebar\nrender_sidebar()')),
        (r'if not st\.session_state\.get\([\'"]authenticated[\'"],[^)]+\):\s+st\.warning\([^)]+\)\s+st\.switch_page\([^)]+\)',
         lambda m: m.group(0) + '\n\n# Render custom sidebar\nrender_sidebar()')
    ]
    
    for pattern, replacement in auth_patterns:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            break
    else:
        # If no auth check found, add render_sidebar after imports
        if 'def main():' in content:
            content = content.replace('def main():', '# Render custom sidebar\nrender_sidebar()\n\ndef main():')
    
    # Write updated content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Updated {page_file}")

print("\n✅ Navigation added to all pages!")
