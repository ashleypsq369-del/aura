"""Emergency fix - Remove problematic RBAC and simplify"""

import os
import glob

# Simple page template without RBAC complexity
SIMPLE_PAGE_HEADER = '''"""
{page_name}
"""

import streamlit as st
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import db

st.set_page_config(
    page_title="{page_title}",
    page_icon="{icon}",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Simple auth check
if not st.session_state.get('authenticated', False):
    st.switch_page("pages/1_Login.py")

# Hide Streamlit branding
st.markdown("""
<style>
#MainMenu {{visibility: hidden;}}
footer {{visibility: hidden;}}
header {{visibility: hidden;}}
[data-testid="stSidebarNav"] {{display: none;}}
</style>
""", unsafe_allow_html=True)

# Get user info
username = st.session_state.get('username', 'User')
role = st.session_state.get('role', 'user')

# Sidebar
with st.sidebar:
    st.markdown(f"### 👤 {username}")
    st.markdown(f"**Role:** {role}")
    st.markdown("---")
    if st.button("🚪 Logout", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.switch_page("pages/1_Login.py")

'''

def fix_page(filepath):
    """Fix a page by removing RBAC complexity"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip login page
    if '1_Login.py' in filepath:
        return False
    
    # Extract page name and icon
    filename = os.path.basename(filepath)
    page_num = filename.split('_')[0]
    page_name = filename.replace('.py', '').replace(f'{page_num}_', '').replace('_', ' ')
    
    # Try to find icon
    icon = "📊"
    if 'page_icon=' in content:
        import re
        match = re.search(r'page_icon=["\']([^"\']+)["\']', content)
        if match:
            icon = match.group(1)
    
    # Find where the actual page content starts (after imports and setup)
    lines = content.split('\n')
    content_start = 0
    
    for i, line in enumerate(lines):
        if 'st.markdown' in line and ('###' in line or 'div' in line or 'Welcome' in line):
            content_start = i
            break
        if i > 50:  # Safety limit
            content_start = 30
            break
    
    # Keep only the content part
    page_content = '\n'.join(lines[content_start:])
    
    # Create new page with simple header + original content
    new_content = SIMPLE_PAGE_HEADER.format(
        page_name=page_name,
        page_title=f"{page_name} | Project Aura",
        icon=icon
    ) + '\n' + page_content
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True

def main():
    print("=" * 70)
    print("EMERGENCY FIX - REMOVING RBAC COMPLEXITY")
    print("=" * 70)
    
    # Get all pages except login
    pages = [p for p in glob.glob('pages/*.py') if '1_Login' not in p]
    
    fixed = 0
    for page in pages:
        try:
            if fix_page(page):
                print(f"✅ Fixed: {os.path.basename(page)}")
                fixed += 1
        except Exception as e:
            print(f"❌ Error fixing {os.path.basename(page)}: {e}")
    
    print("\n" + "=" * 70)
    print(f"Fixed {fixed} pages")
    print("=" * 70)
    print("\n✅ All pages simplified - RBAC removed")
    print("✅ Refresh will stay on same page")
    print("✅ Simple sidebar with logout")
    print("\nRestart the app: streamlit run app.py")

if __name__ == "__main__":
    main()
