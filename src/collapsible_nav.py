"""Professional Collapsible Navigation with Hamburger Menu"""
import streamlit as st

def setup_page(page_title, page_icon="📊"):
    """Setup page with collapsible navigation
    
    NOTE: Call st.set_page_config() in your page BEFORE calling this function!
    """
    
    # Auth check
    if not st.session_state.get('authenticated', False):
        st.switch_page("pages/1_Login.py")
    
    # Initialize sidebar state
    if 'sidebar_collapsed' not in st.session_state:
        st.session_state.sidebar_collapsed = False
    
    # Get user info
    username = st.session_state.get('username', 'User')
    role = st.session_state.get('role', 'user').lower()
    
    # Professional styling with collapsible sidebar
    sidebar_width = "60px" if st.session_state.sidebar_collapsed else "280px"
    
    st.markdown(f"""
    <style>
    /* Hide Streamlit branding */
    #MainMenu {{visibility: hidden;}}
    footer {{visibility: hidden;}}
    header {{visibility: hidden;}}
    [data-testid="stSidebarNav"] {{display: none;}}
    .stDeployButton {{display: none;}}
    
    /* Custom Sidebar */
    [data-testid="stSidebar"] {{
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        width: {sidebar_width} !important;
        min-width: {sidebar_width} !important;
        max-width: {sidebar_width} !important;
        transition: all 0.3s ease-in-out;
    }}
    
    [data-testid="stSidebar"] * {{
        color: white !important;
    }}
    
    /* Hamburger toggle button */
    .nav-toggle {{
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 999;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 8px;
        padding: 0.75rem;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: all 0.3s;
    }}
    
    .nav-toggle:hover {{
        transform: scale(1.05);
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }}
    
    /* Navigation buttons */
    .stButton > button {{
        width: 100%;
        border-radius: 10px;
        border: none;
        padding: 0.75rem;
        margin: 0.25rem 0;
        background: rgba(255,255,255,0.1);
        color: white !important;
        transition: all 0.3s;
        text-align: left;
    }}
    
    .stButton > button:hover {{
        background: rgba(255,255,255,0.2);
        transform: translateX(5px);
    }}
    
    .stButton > button:disabled {{
        background: rgba(255,255,255,0.3);
    }}
    
    /* Adjust main content when sidebar is collapsed */
    .main .block-container {{
        padding-left: {('80px' if st.session_state.sidebar_collapsed else '2rem')};
        transition: padding-left 0.3s ease-in-out;
    }}
    </style>
    """, unsafe_allow_html=True)
    
    # Hamburger menu toggle button (fixed position)
    col1, col2 = st.columns([1, 20])
    with col1:
        toggle_icon = "☰" if st.session_state.sidebar_collapsed else "✕"
        if st.button(toggle_icon, key="nav_toggle", help="Toggle Navigation"):
            st.session_state.sidebar_collapsed = not st.session_state.sidebar_collapsed
            st.rerun()
    
    # Sidebar content
    if not st.session_state.sidebar_collapsed:
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
    else:
        # Collapsed sidebar - show icons only
        with st.sidebar:
            st.markdown("### ☰")
            st.caption("Menu")
    
    return username, role
