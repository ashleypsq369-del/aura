"""
Recreate all page modules from scratch - properly
"""

import os
import re

# Page mappings
pages = {
    "2_Dashboard.py": "dashboard_module.py",
    "3_Log_Data.py": "log_data_module.py",
    "4_View_Trends.py": "view_trends_module.py",
    "5_AI_Insights.py": "ai_insights_module.py",
    "6_Alerts.py": "alerts_module.py",
    "7_Support_Hub.py": "support_module.py",
    "8_Bereavement_Bridge.py": "bereavement_module.py",
    "9_Patient_Onboarding.py": "onboarding_module.py",
    "10_Clinical_Simulation.py": "simulation_module.py",
    "11_Medication_Management.py": "medications_module.py",
    "12_Appointment_Scheduling.py": "appointments_module.py",
    "13_Caregiver_Portal.py": "caregiver_module.py",
    "14_Memory_Vault.py": "memories_module.py",
    "15_Journal.py": "journal_module.py",
    "16_Care_Plan.py": "care_plan_module.py",
    "17_Functional_Status.py": "functional_module.py"
}

for source_file, module_file in pages.items():
    source_path = f"pages/{source_file}"
    dest_path = f"page_modules/{module_file}"
    
    if not os.path.exists(source_path):
        print(f"❌ Source not found: {source_file}")
        continue
    
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove st.set_page_config
    content = re.sub(
        r'st\.set_page_config\([^)]*\)\s*\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Remove authentication check and redirect
    content = re.sub(
        r'# Check authentication\s*\nif not st\.session_state\.get\([\'"]authenticated[\'"],[^)]*\):[^}]*?st\.(switch_page|stop)\([^)]*\)\s*\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Remove navigation imports
    content = content.replace('from src.navigation import render_sidebar\n', '')
    content = content.replace('render_sidebar()\n', '')
    
    # Remove hide navigation CSS
    content = re.sub(
        r'# Hide default[^\n]*\s*st\.markdown\([\'"]<style>\[data-testid=["\']stSidebarNav["\']\][^<]*</style>[\'"],\s*unsafe_allow_html=True\)\s*\n',
        '',
        content
    )
    
    # Find where the main code starts (after imports)
    lines = content.split('\n')
    
    # Find the last import or setup line
    code_start = 0
    in_docstring = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Track docstrings
        if '"""' in stripped or "'''" in stripped:
            in_docstring = not in_docstring
            code_start = i + 1
            continue
            
        if in_docstring:
            code_start = i + 1
            continue
            
        if (stripped.startswith('from ') or 
            stripped.startswith('import ') or 
            stripped.startswith('#') or
            stripped == '' or
            'sys.path' in stripped):
            code_start = i + 1
        elif stripped and not stripped.startswith('#'):
            # Found actual code
            break
    
    # Split into header and body
    header = '\n'.join(lines[:code_start]).strip()
    body = '\n'.join(lines[code_start:]).strip()
    
    # Remove any existing def main() or def render()
    body = re.sub(r'^def main\(\):\s*\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'^def render\(\):\s*\n', '', body, flags=re.MULTILINE)
    body = re.sub(r'\nif __name__ == "__main__":\s*\n\s*main\(\)\s*$', '', body)
    
    # Indent the body
    indented_body = '\n'.join('    ' + line if line.strip() else '' for line in body.split('\n'))
    
    # Create the module with proper structure
    module_content = f'''{header}


def render():
    """Render this page"""
{indented_body}
'''
    
    # Write the module
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(module_content)
    
    print(f"✓ Created {module_file}")

print("\n✅ All modules recreated successfully!")
