"""
Convert existing pages to modules for single-page app
"""

import os
import re

# Mapping of page files to module names
page_mappings = {
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

for page_file, module_file in page_mappings.items():
    source_path = f"pages/{page_file}"
    dest_path = f"page_modules/{module_file}"
    
    if not os.path.exists(source_path):
        print(f"Skipping {page_file} - not found")
        continue
    
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove st.set_page_config (not needed in modules)
    content = re.sub(
        r'st\.set_page_config\([^)]+\)\s*\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Remove authentication redirects (handled by main app)
    content = re.sub(
        r'if not st\.session_state\.get\([\'"]authenticated[\'"],[^)]+\):[^}]+st\.switch_page\([^)]+\)\s*\n',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Remove navigation imports and calls
    content = content.replace('from src.navigation import render_sidebar\n', '')
    content = content.replace('render_sidebar()\n', '')
    
    # Remove hide navigation CSS
    content = re.sub(
        r'st\.markdown\([\'"]<style>\[data-testid=["\']stSidebarNav["\']\][^<]+</style>[\'"],\s*unsafe_allow_html=True\)\s*\n',
        '',
        content
    )
    
    # Wrap main content in a render() function if not already
    if 'def render():' not in content:
        # Find where main() function starts
        if 'def main():' in content:
            content = content.replace('def main():', 'def render():')
            # Remove if __name__ == "__main__" block
            content = re.sub(
                r'\n\nif __name__ == "__main__":\s+main\(\)\s*$',
                '',
                content
            )
        else:
            # Wrap everything after imports in render()
            lines = content.split('\n')
            import_end = 0
            for i, line in enumerate(lines):
                if line.startswith('from ') or line.startswith('import ') or line.strip() == '' or line.startswith('#') or line.startswith('"""') or line.startswith("'''"):
                    import_end = i
                else:
                    break
            
            before_imports = '\n'.join(lines[:import_end+1])
            after_imports = '\n'.join(lines[import_end+1:])
            
            content = f"{before_imports}\n\ndef render():\n    \"\"\"Render this page\"\"\"\n    " + after_imports.replace('\n', '\n    ')
    
    # Write module
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Converted {page_file} → {module_file}")

print("\n✅ All pages converted to modules!")
