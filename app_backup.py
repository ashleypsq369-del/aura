"""
Project Aura - Main Application Entry Point
Handles routing to login or dashboard with role-based access
"""

import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src import db
from src.ui_utils import hide_streamlit_elements

# Page configuration - MUST BE FIRST
st.set_page_config(
    page_title="Project Aura | Hospice Care Platform",
    page_icon="🌅",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Hide Streamlit default UI elements
hide_streamlit_elements()

# Initialize database
@st.cache_resource
def init_app():
    """Initialize application"""
    db.init_database()
    return True

init_app()

# Initialize session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False

# ONLY redirect if not authenticated - otherwise show welcome page
if not st.session_state.get('authenticated', False):
    st.switch_page("pages/1_Login.py")
else:
    # Show a simple welcome page instead of forcing redirect
    st.markdown("""
    <div style='text-align: center; padding: 4rem 2rem;'>
        <h1 style='font-size: 3rem; margin-bottom: 1rem;'>🌅 Welcome to Project Aura</h1>
        <p style='font-size: 1.2rem; color: #666; margin-bottom: 2rem;'>
            Use the navigation menu in the sidebar to access your pages
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Show user info
    from src.ui_utils import setup_page
    user_info = setup_page("Home", "🌅")
    
    st.info("👈 Use the sidebar navigation to access your dashboard and other features")

