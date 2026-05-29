"""
Project Aura - Professional Healthcare Platform
Clean multi-page app with role-based navigation
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'page_modules'))

from src import db
from src.local_styles import apply_fast_styles

# Page config
st.set_page_config(
    page_title="Project Aura | Hospice Care Platform",
    page_icon="🌅",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Apply styles (hides default navigation)
apply_fast_styles()

# Initialize database
@st.cache_resource
def init_app():
    db.init_database()
    return True

init_app()

# Initialize session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'login'

def navigate_to(page):
    st.session_state.current_page = page
    st.rerun()

def render_sidebar():
    """Custom role-based sidebar"""
    if not st.session_state.get('authenticated', False):
        return
    
    with st.sidebar:
        st.markdown(f"""
        <div style='background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 12px; margin-bottom: 2rem;'>
            <div style='font-size: 0.85rem; opacity: 0.8;'>Logged in as</div>
            <div style='font-size: 1.1rem; font-weight: 600; margin-top: 0.5rem;'>{st.session_state.username}</div>
            <div style='font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem;'>{st.session_state.role.title()}</div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### 📋 Navigation")
        
        user_role = st.session_state.role.lower()
        
        role_pages = {
            "admin": [
                ("🏠 Dashboard", "dashboard"),
                ("📝 Log Data", "log_data"),
                ("📊 View Trends", "view_trends"),
                ("🤖 AI Insights", "ai_insights"),
                ("🔔 Alerts", "alerts"),
                ("💊 Medications", "medications"),
                ("📅 Appointments", "appointments"),
                ("👥 Caregiver", "caregiver"),
                ("📋 Care Plan", "care_plan"),
                ("📊 Functional", "functional"),
                ("🏥 Onboarding", "onboarding"),
                ("🎬 Simulation", "simulation")
            ],
            "clinician": [
                ("🏠 Dashboard", "dashboard"),
                ("📝 Log Data", "log_data"),
                ("📊 View Trends", "view_trends"),
                ("🤖 AI Insights", "ai_insights"),
                ("🔔 Alerts", "alerts"),
                ("💊 Medications", "medications"),
                ("📅 Appointments", "appointments"),
                ("📋 Care Plan", "care_plan"),
                ("📊 Functional", "functional"),
                ("🏥 Onboarding", "onboarding")
            ],
            "caregiver": [
                ("🏠 Dashboard", "dashboard"),
                ("📝 Log Data", "log_data"),
                ("📊 View Trends", "view_trends"),
                ("🔔 Alerts", "alerts"),
                ("💬 Support Hub", "support"),
                ("👥 Caregiver", "caregiver"),
                ("📅 Appointments", "appointments"),
                ("💊 Medications", "medications"),
                ("📸 Memories", "memories"),
                ("📔 Journal", "journal")
            ],
            "patient": [
                ("🏠 Dashboard", "dashboard"),
                ("📝 Log Data", "log_data"),
                ("📊 View Trends", "view_trends"),
                ("💬 Support Hub", "support"),
                ("📸 Memories", "memories"),
                ("📔 Journal", "journal"),
                ("🕊️ Bereavement", "bereavement")
            ],
            "family": [
                ("🏠 Dashboard", "dashboard"),
                ("📊 View Trends", "view_trends"),
                ("💬 Support Hub", "support"),
                ("📸 Memories", "memories"),
                ("📔 Journal", "journal"),
                ("🕊️ Bereavement", "bereavement"),
                ("👥 Caregiver", "caregiver")
            ]
        }
        
        pages = role_pages.get(user_role, role_pages["patient"])
        
        st.markdown(f"<small style='opacity: 0.7;'>Viewing as: {st.session_state.role.title()}</small>", unsafe_allow_html=True)
        st.markdown("---")
        
        for label, page_id in pages:
            if st.button(label, key=f"nav_{page_id}"):
                navigate_to(page_id)
        
        st.markdown("---")
        
        if st.button("🚪 Logout"):
            st.session_state.authenticated = False
            st.session_state.user_id = None
            st.session_state.username = None
            st.session_state.role = None
            navigate_to('login')
        
        st.markdown("---")
        st.markdown("""
        <div style='text-align: center; font-size: 0.75rem; opacity: 0.7;'>
            <div>🔒 Synthetic Data Only</div>
            <div style='margin-top: 0.5rem;'>© 2026 Project Aura</div>
        </div>
        """, unsafe_allow_html=True)

# Force login if not authenticated
if not st.session_state.get('authenticated', False):
    st.session_state.current_page = 'login'

# Render sidebar
if st.session_state.get('authenticated', False):
    render_sidebar()

# Route to page
page = st.session_state.current_page

if page == 'login':
    import login_module
    login_module.render()
elif page == 'dashboard':
    import dashboard_module
    dashboard_module.render()
elif page == 'log_data':
    import log_data_module
    log_data_module.render()
elif page == 'view_trends':
    import view_trends_module
    view_trends_module.render()
elif page == 'ai_insights':
    import ai_insights_module
    ai_insights_module.render()
elif page == 'alerts':
    import alerts_module
    alerts_module.render()
elif page == 'support':
    import support_module
    support_module.render()
elif page == 'bereavement':
    import bereavement_module
    bereavement_module.render()
elif page == 'onboarding':
    import onboarding_module
    onboarding_module.render()
elif page == 'simulation':
    import simulation_module
    simulation_module.render()
elif page == 'medications':
    import medications_module
    medications_module.render()
elif page == 'appointments':
    import appointments_module
    appointments_module.render()
elif page == 'caregiver':
    import caregiver_module
    caregiver_module.render()
elif page == 'memories':
    import memories_module
    memories_module.render()
elif page == 'journal':
    import journal_module
    journal_module.render()
elif page == 'care_plan':
    import care_plan_module
    care_plan_module.render()
elif page == 'functional':
    import functional_module
    functional_module.render()
else:
    st.error(f"Page '{page}' not found")
