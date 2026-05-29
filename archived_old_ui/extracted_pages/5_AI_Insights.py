"""
AI Insights - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header

# Setup page with unified design
username, role = setup_page("AI Insights", "🤖")

# Render page header
render_page_header("AI Insights", "🤖", "AI-powered predictive analytics and recommendations")

# Original page content below


# Simple auth check
if not st.session_state.get('authenticated', False):
    st.switch_page("pages/1_Login.py")

# Hide Streamlit branding
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
[data-testid="stSidebarNav"] {display: none;}
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
        <div style='font-weight: bold; font-size: 1.1rem; text-align: center;'>{username}</div>
        <div style='opacity: 0.9; font-size: 0.9rem; text-align: center;'>{role.title()}</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 🧭 Navigation")
    
    if st.button("📊 Dashboard", use_container_width=True, disabled=False):
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


st.title("🤖 AI Insights")
st.info("AI-powered predictions and insights")

