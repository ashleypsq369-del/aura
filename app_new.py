"""
Project Aura - Single Page Application
Professional navigation without Streamlit's default page list
"""

import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src import db

# Page configuration
st.set_page_config(
    page_title="Project Aura | Hospice Care Platform",
    page_icon="🌅",
    layout="wide",
    initial_sidebar_state="expanded"
)

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

# Hide all Streamlit default elements
st.markdown("""
<style>
    /* Hide everything Streamlit adds by default */
    #MainMenu {visibility: hidden !important;}
    footer {visibility: hidden !important;}
    header {visibility: hidden !important;}
    [data-testid="stSidebarNav"] {display: none !important;}
    .css-1544g2n {display: none !important;}
    .css-1cypcdb {display: none !important;}
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #2c5282 0%, #1a365d 100%);
    }
    
    [data-testid="stSidebar"] * {
        color: #ffffff !important;
    }
    
    /* Button styling */
    .stButton > button {
        background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
        color: white !important;
        border: none;
        border-radius: 12px;
        padding: 0.75rem 2rem;
        font-weight: 600;
        transition: all 0.3s ease;
        width: 100%;
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
        transform: translateY(-2px);
    }
</style>
""", unsafe_allow_html=True)

def navigate_to(page):
    """Navigate to a specific page"""
    st.session_state.current_page = page
    st.rerun()

def render_sidebar():
    """Render custom sidebar with role-based navigation"""
    if not st.session_state.get('authenticated', False):
        return
    
    with st.sidebar:
        # User info
        st.markdown(f"""
        <div style='background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 12px; margin-bottom: 2rem;'>
            <div style='font-size: 0.85rem; opacity: 0.8; margin-bottom: 0.5rem;'>Logged in as</div>
            <div style='font-size: 1.1rem; font-weight: 600;'>{st.session_state.username}</div>
            <div style='font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem;'>
                {st.session_state.role.title()}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### 📋 Navigation")
        
        # Role-based pages
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
                ("👥 Caregiver Portal", "caregiver"),
                ("📋 Care Plan", "care_plan"),
                ("📊 Functional Status", "functional"),
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
                ("📊 Functional Status", "functional"),
                ("🏥 Onboarding", "onboarding")
            ],
            "caregiver": [
                ("🏠 Dashboard", "dashboard"),
                ("📝 Log Data", "log_data"),
                ("📊 View Trends", "view_trends"),
                ("🔔 Alerts", "alerts"),
                ("💬 Support Hub", "support"),
                ("👥 Caregiver Portal", "caregiver"),
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
                ("👥 Caregiver Portal", "caregiver")
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

# Main routing logic
def main():
    """Main application router"""
    
    # If not authenticated, show login
    if not st.session_state.get('authenticated', False):
        st.session_state.current_page = 'login'
    
    # Render sidebar for authenticated users
    if st.session_state.get('authenticated', False):
        render_sidebar()
    
    # Route to appropriate page
    page = st.session_state.current_page
    
    if page == 'login':
        from pages import login_page
        login_page.render()
    elif page == 'dashboard':
        from pages import dashboard_page
        dashboard_page.render()
    elif page == 'log_data':
        from pages import log_data_page
        log_data_page.render()
    elif page == 'view_trends':
        from pages import view_trends_page
        view_trends_page.render()
    elif page == 'ai_insights':
        from pages import ai_insights_page
        ai_insights_page.render()
    elif page == 'alerts':
        from pages import alerts_page
        alerts_page.render()
    elif page == 'support':
        from pages import support_page
        support_page.render()
    elif page == 'bereavement':
        from pages import bereavement_page
        bereavement_page.render()
    elif page == 'onboarding':
        from pages import onboarding_page
        onboarding_page.render()
    elif page == 'simulation':
        from pages import simulation_page
        simulation_page.render()
    elif page == 'medications':
        from pages import medications_page
        medications_page.render()
    elif page == 'appointments':
        from pages import appointments_page
        appointments_page.render()
    elif page == 'caregiver':
        from pages import caregiver_page
        caregiver_page.render()
    elif page == 'memories':
        from pages import memories_page
        memories_page.render()
    elif page == 'journal':
        from pages import journal_page
        journal_page.render()
    elif page == 'care_plan':
        from pages import care_plan_page
        care_plan_page.render()
    elif page == 'functional':
        from pages import functional_page
        functional_page.render()
    else:
        st.error(f"Page '{page}' not found")

if __name__ == "__main__":
    main()
