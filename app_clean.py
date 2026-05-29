"""
Project Aura - Clean Minimal Version
Simple, working hospice care platform
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from src import db

# Page config
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
def init_db():
    db.init_database()
    return True

init_db()

# Initialize session
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False

# Route to login or dashboard
if not st.session_state.get('authenticated', False):
    st.switch_page("pages/1_Login.py")
else:
    st.switch_page("pages/2_Dashboard.py")
