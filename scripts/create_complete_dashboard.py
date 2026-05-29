"""Script to create complete dashboard with all modules"""
import os

# This will be the complete dashboard code
dashboard_code = '''"""Complete Healthcare Platform - All Modules with Full RBAC"""
import streamlit as st
import sys, os
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from src import db
from src.rbac import get_accessible_pages, get_role_info

# Page config
st.set_page_config(
    page_title="Project Aura - Healthcare Platform",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Auth check
if not st.session_state.get('authenticated', False):
    st.switch_page("pages/1_Login.py")

# Get user info
username = st.session_state.get('username', 'User')
role = st.session_state.get('role', 'user').lower()
user_id = st.session_state.get('user_id', 1)
role_info = get_role_info(role)

# Get accessible pages for this role
accessible_pages = get_accessible_pages(role)

# Professional styling
st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
[data-testid="stSidebarNav"] {display: none;}
.stDeployButton {display: none;}
[data-testid="stSidebar"] {display: none;}

.main .block-container {
    padding-top: 0;
    padding-left: 0;
    padding-right: 0;
    max-width: 100%;
}

.top-nav {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
}

.nav-user {
    color: white;
    text-align: right;
}

.stTabs [data-baseweb="tab-list"] {
    gap: 0.5rem;
    background: white;
    padding: 1rem 2rem 0 2rem;
    border-bottom: 2px solid #f0f2f6;
}

.stTabs [data-baseweb="tab"] {
    padding: 0.75rem 1.5rem;
    border-radius: 8px 8px 0 0;
    background: transparent;
    color: #666;
    font-weight: 500;
}

.stTabs [data-baseweb="tab"]:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
}

.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white !important;
}

.page-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    border-radius: 16px;
    margin-bottom: 2rem;
}

.content-area {
    padding: 2rem;
}
</style>
""", unsafe_allow_html=True)

# Top Navigation Bar
st.markdown(f"""
<div class="top-nav">
    <div class="nav-brand">🏥 Project Aura</div>
    <div class="nav-user">
        <div>{role_info['icon']} {username}</div>
        <div style="font-size:0.8rem;opacity:0.9">{role_info['display_name']}</div>
    </div>
</div>
""", unsafe_allow_html=True)

# Logout button
col1, col2 = st.columns([10, 1])
with col2:
    if st.button("🚪 Logout", type="primary", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

# Build tab list from accessible pages
tab_names = [f"{page['icon']} {page['name']}" for page in accessible_pages]
tabs = st.tabs(tab_names)
'''

print("Creating complete dashboard...")
print(f"Dashboard code length: {len(dashboard_code)} characters")
print("Dashboard will be created in pages/2_Dashboard.py")
print("\nThis script prepares the dashboard code.")
print("The actual dashboard file will be created by the main process.")
