"""Batch update all pages with RBAC and clean UI"""

import os
import glob

def update_page_file(filepath):
    """Update a single page file"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already updated
    if 'from src.ui_utils import setup_page' in content:
        return False, "Already updated"
    
    # Skip login page
    if '1_Login.py' in filepath:
        return False, "Login page - skipped"
    
    lines = content.split('\n')
    new_lines = []
    skip_until = -1
    added_import = False
    added_setup = False
    
    for i, line in enumerate(lines):
        # Skip old auth check
        if i < skip_until:
            continue
        
        # Add import after other src imports
        if not added_import and ('from src import' in line or 'import src.' in line):
            new_lines.append(line)
            if 'from src.ui_utils import setup_page' not in content:
                new_lines.append('from src.ui_utils import setup_page')
                added_import = True
            continue
        
        # Replace old authentication check
        if "if not st.session_state.get('authenticated'" in line:
            # Find the end of this auth block
            for j in range(i, min(i + 5, len(lines))):
                if 'st.switch_page("pages/1_Login.py")' in lines[j]:
                    skip_until = j + 1
                    break
            continue
        
        # Add setup_page after st.set_page_config
        if not added_setup and 'st.set_page_config' in line:
            # Add the line
            new_lines.append(line)
            
            # Handle multi-line config
            if line.count('(') > line.count(')'):
                paren_count = line.count('(') - line.count(')')
                j = i + 1
                while j < len(lines) and paren_count > 0:
                    new_lines.append(lines[j])
                    paren_count += lines[j].count('(') - lines[j].count(')')
                    j += 1
                    skip_until = j
            
            # Extract page icon
            page_icon = "📊"
            for search_line in lines[max(0, i-2):min(len(lines), i+10)]:
                if 'page_icon=' in search_line:
                    import re
                    match = re.search(r'page_icon=["\']([^"\']+)["\']', search_line)
                    if match:
                        page_icon = match.group(1)
                        break
            
            # Extract page name from filename
            page_name = os.path.basename(filepath).replace('.py', '').split('_', 1)[1].replace('_', ' ').title()
            
            # Add setup call
            new_lines.append('')
            new_lines.append('# Setup page with RBAC and UI utilities')
            new_lines.append(f'user_info = setup_page("{page_name}", "{page_icon}")')
            new_lines.append('')
            added_setup = True
            continue
        
        new_lines.append(line)
    
    # Write back
    new_content = '\n'.join(new_lines)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True, "Updated successfully"


def main():
    print("=" * 70)
    print("UPDATING ALL PAGES WITH RBAC AND CLEAN UI")
    print("=" * 70)
    
    # Get all page files
    page_files = glob.glob('pages/*.py')
    page_files.sort()
    
    updated = 0
    skipped = 0
    errors = 0
    
    for filepath in page_files:
        filename = os.path.basename(filepath)
        try:
            success, message = update_page_file(filepath)
            if success:
                print(f"✅ {filename}: {message}")
                updated += 1
            else:
                print(f"⏭️  {filename}: {message}")
                skipped += 1
        except Exception as e:
            print(f"❌ {filename}: Error - {str(e)}")
            errors += 1
    
    print("\n" + "=" * 70)
    print(f"SUMMARY: {updated} updated | {skipped} skipped | {errors} errors")
    print("=" * 70)
    
    if errors == 0:
        print("\n✅ All pages updated successfully!")
        print("\n🎯 What's been implemented:")
        print("   ✓ Role-based access control (RBAC)")
        print("   ✓ Hidden Streamlit menu/hamburger")
        print("   ✓ Hidden footer and deploy button")
        print("   ✓ Custom navigation menu per role")
        print("   ✓ User badge showing role")
        print("   ✓ Logout button in sidebar")
        print("   ✓ Automatic access checks")
        print("\n🚀 Ready to test:")
        print("   streamlit run app.py")
        print("\n👥 Test with different roles:")
        print("   • admin / admin123 - Full access")
        print("   • clinician / doctor123 - Clinical tools")
        print("   • family / family123 - Family features")
        print("   • patient / patient123 - Patient features")


if __name__ == "__main__":
    main()
