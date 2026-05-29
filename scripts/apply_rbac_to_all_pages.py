"""Apply RBAC and UI utilities to all pages"""

import os
import re

# Pages to update (excluding login)
PAGES = [
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
    '17_Functional_Status.py'
]

def update_page(page_file):
    """Update a page to use RBAC and UI utilities"""
    
    filepath = f"pages/{page_file}"
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already updated
    if 'from src.ui_utils import setup_page' in content or 'setup_page(' in content:
        print(f"✓ Already updated: {page_file}")
        return True
    
    # Find the imports section
    lines = content.split('\n')
    
    # Find where to insert the new import
    import_index = -1
    for i, line in enumerate(lines):
        if 'from src import' in line or 'import src' in line:
            import_index = i
            break
    
    if import_index == -1:
        # Find sys.path.insert line
        for i, line in enumerate(lines):
            if 'sys.path.insert' in line:
                import_index = i + 1
                break
    
    if import_index == -1:
        print(f"⚠️  Could not find import location in {page_file}")
        return False
    
    # Add the new import
    if 'from src.ui_utils import setup_page' not in content:
        lines.insert(import_index + 1, 'from src.ui_utils import setup_page')
    
    # Find st.set_page_config and the authentication check
    config_index = -1
    auth_check_start = -1
    auth_check_end = -1
    
    for i, line in enumerate(lines):
        if 'st.set_page_config' in line:
            config_index = i
        if "if not st.session_state.get('authenticated'" in line:
            auth_check_start = i
        if auth_check_start != -1 and auth_check_end == -1:
            if 'st.switch_page("pages/1_Login.py")' in line:
                auth_check_end = i
    
    # Replace old authentication check with setup_page call
    if config_index != -1:
        # Find the end of st.set_page_config (could be multi-line)
        config_end = config_index
        paren_count = 0
        for i in range(config_index, len(lines)):
            paren_count += lines[i].count('(') - lines[i].count(')')
            if paren_count == 0:
                config_end = i
                break
        
        # Remove old auth check if exists
        if auth_check_start != -1 and auth_check_end != -1:
            del lines[auth_check_start:auth_check_end + 1]
            # Adjust config_end if needed
            if auth_check_start < config_end:
                config_end -= (auth_check_end - auth_check_start + 1)
        
        # Add setup_page call after config
        page_name = page_file.replace('.py', '').replace('_', ' ').title()
        page_icon = "📊"  # Default icon
        
        # Try to extract icon from existing header
        for line in lines:
            if 'page_icon=' in line:
                match = re.search(r'page_icon=["\']([^"\']+)["\']', line)
                if match:
                    page_icon = match.group(1)
                    break
        
        setup_call = f'\n# Setup page with RBAC and UI utilities\nuser_info = setup_page("{page_name}", "{page_icon}")\n'
        lines.insert(config_end + 1, setup_call)
    
    # Write back
    new_content = '\n'.join(lines)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Updated: {page_file}")
    return True


def main():
    print("=" * 60)
    print("APPLYING RBAC AND UI UTILITIES TO ALL PAGES")
    print("=" * 60)
    
    success_count = 0
    
    for page in PAGES:
        if update_page(page):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Successfully updated {success_count}/{len(PAGES)} pages")
    print("=" * 60)
    
    print("\n📝 Next steps:")
    print("1. Test login with different roles")
    print("2. Verify navigation menu shows only accessible pages")
    print("3. Confirm Streamlit menu is hidden")
    print("4. Check that unauthorized access is blocked")


if __name__ == "__main__":
    main()
