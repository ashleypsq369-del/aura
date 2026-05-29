"""
Project Aura - Simple Working Version
No complex RBAC, just basic auth and navigation
"""

import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src import db

# Page configuration
st.set_page_config(
    page_title="Project Aura",
    page_icon="🌅",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Hide Streamlit branding
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
[data-testid="stSidebarNav"] {display: none;}
.stDeployButton {display: none;}
</style>
""", unsafe_allow_html=True)

# Initialize database
@st.cache_resource
def init_app():
    db.init_database()
    return True

init_app()

# Initialize session
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False

# Check auth
if not st.session_state.get('authenticated', False):
    st.switch_page("pages/1_Login.py")

# Show welcome page
st.markdown("""
<div style='text-align: center; padding: 4rem 2rem;'>
    <h1 style='font-size: 3rem;'>🌅 Project Aura</h1>
    <p style='font-size: 1.3rem; color: #666;'>Hospice Care Management Platform</p>
</div>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    username = st.session_state.get('username', 'User')
    role = st.session_state.get('role', 'user')
    
    st.markdown(f"""
    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;'>
        <div style='font-size: 2rem; text-align: center; margin-bottom: 0.5rem;'>👤</div>
        <div style='font-weight: bold; font-size: 1.1rem; text-align: center;'>{username}</div>
        <div style='opacity: 0.9; font-size: 0.9rem; text-align: center;'>{role.title()}</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 🧭 Navigation")
    
    if st.button("📊 Dashboard", use_container_width=True):
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
    
    if st.button("🕊️ Bereavement", use_container_width=True):
        st.switch_page("pages/8_Bereavement_Bridge.py")
    
    st.markdown("---")
    
    if st.button("🚪 Logout", use_container_width=True, type="primary"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.switch_page("pages/1_Login.py")

st.info("👈 Use the sidebar to navigate to different pages")
