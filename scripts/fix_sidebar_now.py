"""Emergency Sidebar Fix - Force sidebar to show"""
import os
import shutil
import time

print("🔧 EMERGENCY SIDEBAR FIX")
print("=" * 50)

# Step 1: Clear Streamlit cache
print("\n1️⃣ Clearing Streamlit cache...")
cache_dir = ".streamlit/cache"
if os.path.exists(cache_dir):
    shutil.rmtree(cache_dir)
    print("   ✅ Cache cleared")
else:
    print("   ℹ️ No cache to clear")

# Step 2: Update config to force sidebar
print("\n2️⃣ Updating Streamlit config...")
config_content = """[theme]
primaryColor = "#667eea"
backgroundColor = "#ffffff"
secondaryBackgroundColor = "#f0f2f6"
textColor = "#262730"
font = "sans serif"

[client]
showSidebarNavigation = false
toolbarMode = "minimal"

[server]
enableXsrfProtection = false
enableCORS = false

[browser]
gatherUsageStats = false
"""

os.makedirs(".streamlit", exist_ok=True)
with open(".streamlit/config.toml", "w") as f:
    f.write(config_content)
print("   ✅ Config updated")

# Step 3: Add explicit sidebar state to shared_nav
print("\n3️⃣ Updating shared navigation...")
nav_content = '''"""Shared Navigation - Consistent across all pages"""
import streamlit as st

def setup_page(page_title, page_icon="📊"):
    """Setup consistent page layout with navigation"""
    
    # Auth check
    if not st.session_state.get('authenticated', False):
        st.switch_page("pages/1_Login.py")
    
    # FORCE SIDEBAR TO SHOW
    st.set_page_config(
        page_title=f"{page_title} - Project Aura",
        page_icon=page_icon,
        layout="wide",
        initial_sidebar_state="expanded"  # FORCE EXPANDED
    )
    
    # Get user info
    username = st.session_state.get('username', 'User')
    role = st.session_state.get('role', 'user').lower()
    
    # Hide Streamlit branding + Style sidebar
    st.markdown("""
    <style>
    /* Hide Streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    [data-testid="stSidebarNav"] {display: none;}
    .stDeployButton {display: none;}
    
    /* FORCE SIDEBAR TO SHOW */
    [data-testid="stSidebar"] {
        display: block !important;
        visibility: visible !important;
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%) !important;
        min-width: 250px !important;
    }
    
    /* Sidebar text color */
    [data-testid="stSidebar"] * {
        color: white !important;
    }
    
    /* Navigation buttons */
    .stButton > button {
        width: 100%;
        border-radius: 10px;
        border: none;
        padding: 0.75rem;
        margin: 0.25rem 0;
        background: rgba(255,255,255,0.1);
        color: white !important;
        transition: all 0.3s;
    }
    
    .stButton > button:hover {
        background: rgba(255,255,255,0.2);
        transform: translateX(5px);
    }
    
    .stButton > button:disabled {
        background: rgba(255,255,255,0.3);
        cursor: default;
        transform: none;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Sidebar Navigation
    with st.sidebar:
        st.markdown(f"### 👤 {username}")
        st.caption(f"Role: {role.title()}")
        st.markdown("---")
        
        st.markdown("### 🧭 Navigation")
        
        # Dashboard
        if st.button("📊 Dashboard", disabled=(page_title=="Dashboard"), use_container_width=True):
            st.switch_page("pages/2_Dashboard.py")
        
        # Role-based navigation
        if role in ['admin', 'clinician', 'patient']:
            if st.button("📝 Log Data", disabled=(page_title=="Log Data"), use_container_width=True):
                st.switch_page("pages/3_Log_Data.py")
        
        if st.button("📈 View Trends", disabled=(page_title=="View Trends"), use_container_width=True):
            st.switch_page("pages/4_View_Trends.py")
        
        if role in ['admin', 'clinician']:
            if st.button("🤖 AI Insights", disabled=(page_title=="AI Insights"), use_container_width=True):
                st.switch_page("pages/5_AI_Insights.py")
            
            if st.button("🔔 Alerts", disabled=(page_title=="Alerts"), use_container_width=True):
                st.switch_page("pages/6_Alerts.py")
        
        if st.button("💬 Support Hub", disabled=(page_title=="Support Hub"), use_container_width=True):
            st.switch_page("pages/7_Support_Hub.py")
        
        if role in ['admin', 'family', 'caregiver']:
            if st.button("🕊️ Bereavement", disabled=(page_title=="Bereavement"), use_container_width=True):
                st.switch_page("pages/8_Bereavement_Bridge.py")
        
        st.markdown("---")
        
        if st.button("🚪 Logout", use_container_width=True, type="primary"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()
    
    return username, role
'''

with open("src/shared_nav.py", "w", encoding="utf-8") as f:
    f.write(nav_content)
print("   ✅ Navigation updated with forced sidebar")

print("\n" + "=" * 50)
print("✅ FIX COMPLETE!")
print("\n📋 NEXT STEPS:")
print("1. Stop the Streamlit app (Ctrl+C)")
print("2. Clear your browser cache (Ctrl+Shift+Delete)")
print("3. Restart: streamlit run app.py")
print("4. Login and check if sidebar shows")
print("\nIf sidebar still doesn't show, the issue is in the page files themselves.")
