"""Shared Navigation - Consistent across all pages"""
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
