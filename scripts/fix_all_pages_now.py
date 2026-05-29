"""Fix all pages - remove setup_page calls and add simple auth"""

import os
import glob

SIMPLE_HEADER = '''"""
{page_name}
"""

import streamlit as st
import sys, os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from src import db

st.set_page_config(page_title="{page_title}", page_icon="{icon}", layout="wide", initial_sidebar_state="expanded")

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
    st.markdown(f"""
    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;'>
        <div style='font-size: 2rem; text-align: center; margin-bottom: 0.5rem;'>👤</div>
        <div style='font-weight: bold; font-size: 1.1rem; text-align: center;'>{{username}}</div>
        <div style='opacity: 0.9; font-size: 0.9rem; text-align: center;'>{{role.title()}}</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 🧭 Navigation")
    
    if st.button("📊 Dashboard", use_container_width=True, disabled={is_dashboard}):
        st.switch_page("pages/2_Dashboard.py")
    if st.button("📝 Log Data", use_container_width=True):
        st.switch_page("pages/3_Log_Data.py")
    if st.button("📈 View Trends", use_container_width=True):
        st.switch_page("pages/4_View_Trends.py")
    if st.button("🤖 AI Insights", use_container_width=True):
        st.switch_page("pages/5_AI_Insights.py")
    if st.button("🔔 Alerts", use_container_width=True):
        st.switch_page("pages/6_Alerts.py")
    if st.button("💬 Support Hub", use_container_width=True):
        st.switch_page("pages/7_Support_Hub.py")
    
    st.markdown("---")
    
    if st.button("🚪 Logout", use_container_width=True, type="primary"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.switch_page("pages/1_Login.py")

'''

def fix_page(filepath):
    """Fix a page file"""
    
    filename = os.path.basename(filepath)
    
    # Skip login
    if '1_Login' in filename:
        return False, "Login page - skipped"
    
    # Skip if already fixed (has simple auth check)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "# Simple auth check" in content and "setup_page" not in content:
        return False, "Already fixed"
    
    # Extract page info
    page_num = filename.split('_')[0]
    page_name = filename.replace('.py', '').replace(f'{page_num}_', '').replace('_', ' ')
    
    # Get icon
    icon = "📊"
    if 'page_icon=' in content:
        import re
        match = re.search(r'page_icon=["\']([^"\']+)["\']', content)
        if match:
            icon = match.group(1)
    
    # Find where content starts (after all the setup)
    lines = content.split('\n')
    content_start = 0
    
    for i, line in enumerate(lines):
        # Look for first real content (markdown, title, etc)
        if any(x in line for x in ['st.markdown', 'st.title', 'st.header', 'st.subheader', 'col1, col2', 'tab1, tab2']):
            if 'style' not in line.lower() and 'css' not in line.lower():
                content_start = i
                break
        if i > 100:  # Safety
            content_start = 50
            break
    
    # Keep content
    page_content = '\n'.join(lines[content_start:])
    
    # Create new page
    is_dashboard = "True" if "2_Dashboard" in filename else "False"
    new_content = SIMPLE_HEADER.format(
        page_name=page_name,
        page_title=f"{page_name} | Project Aura",
        icon=icon,
        is_dashboard=is_dashboard
    ) + '\n' + page_content
    
    # Write
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True, "Fixed"

def main():
    print("=" * 70)
    print("FIXING ALL PAGES - REMOVING setup_page() CALLS")
    print("=" * 70)
    
    pages = glob.glob('pages/*.py')
    fixed = 0
    skipped = 0
    
    for page in sorted(pages):
        filename = os.path.basename(page)
        try:
            success, msg = fix_page(page)
            if success:
                print(f"✅ {filename}: {msg}")
                fixed += 1
            else:
                print(f"⏭️  {filename}: {msg}")
                skipped += 1
        except Exception as e:
            print(f"❌ {filename}: Error - {str(e)}")
    
    print("\n" + "=" * 70)
    print(f"Fixed: {fixed} | Skipped: {skipped}")
    print("=" * 70)
    print("\n✅ All pages now have simple auth (no setup_page)")
    print("✅ All pages have sidebar navigation")
    print("\nRestart app to see changes")

if __name__ == "__main__":
    main()
