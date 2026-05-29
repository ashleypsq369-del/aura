"""Professional Top Navigation Bar with Dropdown Menu"""
import streamlit as st

def setup_page(page_title, page_icon="📊"):
    """Setup page with professional top navigation
    
    NOTE: Call st.set_page_config() in your page BEFORE calling this function!
    """
    
    # Auth check
    if not st.session_state.get('authenticated', False):
        st.switch_page("pages/1_Login.py")
    
    # Initialize menu state
    if 'menu_open' not in st.session_state:
        st.session_state.menu_open = False
    
    # Get user info
    username = st.session_state.get('username', 'User')
    role = st.session_state.get('role', 'user').lower()
    
    # Hide Streamlit default elements
    st.markdown("""
    <style>
    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    [data-testid="stSidebarNav"] {display: none;}
    .stDeployButton {display: none;}
    [data-testid="stSidebar"] {display: none;}
    
    /* Remove default padding */
    .main .block-container {
        padding-top: 5rem;
        max-width: 100%;
    }
    
    /* Top Navigation Bar */
    .top-nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 70px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        padding: 0 2rem;
        color: white;
    }
    
    .nav-brand {
        font-size: 1.5rem;
        font-weight: 700;
        margin-right: 2rem;
    }
    
    .nav-links {
        display: flex;
        gap: 1rem;
        flex: 1;
        align-items: center;
    }
    
    .nav-link {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        background: rgba(255,255,255,0.1);
        color: white;
        text-decoration: none;
        transition: all 0.3s;
        cursor: pointer;
        border: none;
        font-size: 0.95rem;
    }
    
    .nav-link:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
    }
    
    .nav-link.active {
        background: rgba(255,255,255,0.3);
        font-weight: 600;
    }
    
    .nav-user {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .user-info {
        text-align: right;
    }
    
    .user-name {
        font-weight: 600;
        font-size: 0.95rem;
    }
    
    .user-role {
        font-size: 0.8rem;
        opacity: 0.8;
    }
    
    /* Dropdown menu */
    .dropdown {
        position: relative;
    }
    
    .dropdown-toggle {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        background: rgba(255,255,255,0.1);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.3s;
    }
    
    .dropdown-toggle:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 200px;
        overflow: hidden;
    }
    
    .dropdown-item {
        padding: 0.75rem 1rem;
        color: #333;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        width: 100%;
        text-align: left;
        background: white;
    }
    
    .dropdown-item:hover {
        background: #f0f2f6;
    }
    
    .dropdown-divider {
        height: 1px;
        background: #e0e0e0;
        margin: 0.5rem 0;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Top navigation bar
    st.markdown(f"""
    <div class="top-nav">
        <div class="nav-brand">🏥 Project Aura</div>
        <div class="nav-links">
            <span class="nav-link {'active' if page_title=='Dashboard' else ''}" id="nav-dashboard">📊 Dashboard</span>
            <span class="nav-link {'active' if page_title=='Log Data' else ''}" id="nav-log">📝 Log Data</span>
            <span class="nav-link {'active' if page_title=='View Trends' else ''}" id="nav-trends">📈 Trends</span>
            <span class="nav-link {'active' if page_title=='AI Insights' else ''}" id="nav-ai">🤖 AI</span>
            <span class="nav-link {'active' if page_title=='Support Hub' else ''}" id="nav-support">💬 Support</span>
        </div>
        <div class="nav-user">
            <div class="user-info">
                <div class="user-name">👤 {username}</div>
                <div class="user-role">{role.title()}</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation buttons (hidden but functional)
    col1, col2, col3, col4, col5, col6, col7 = st.columns(7)
    
    with col1:
        if st.button("Dashboard", key="btn_dash", use_container_width=True):
            st.switch_page("pages/2_Dashboard.py")
    
    with col2:
        if role in ['admin', 'clinician', 'patient']:
            if st.button("Log Data", key="btn_log", use_container_width=True):
                st.switch_page("pages/3_Log_Data.py")
    
    with col3:
        if st.button("Trends", key="btn_trends", use_container_width=True):
            st.switch_page("pages/4_View_Trends.py")
    
    with col4:
        if role in ['admin', 'clinician']:
            if st.button("AI Insights", key="btn_ai", use_container_width=True):
                st.switch_page("pages/5_AI_Insights.py")
    
    with col5:
        if role in ['admin', 'clinician']:
            if st.button("Alerts", key="btn_alerts", use_container_width=True):
                st.switch_page("pages/6_Alerts.py")
    
    with col6:
        if st.button("Support", key="btn_support", use_container_width=True):
            st.switch_page("pages/7_Support_Hub.py")
    
    with col7:
        if st.button("🚪 Logout", key="btn_logout", type="primary"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()
    
    # Hide the button row
    st.markdown("""
    <style>
    /* Hide the button row */
    div[data-testid="column"] {
        display: none;
    }
    </style>
    """, unsafe_allow_html=True)
    
    return username, role
