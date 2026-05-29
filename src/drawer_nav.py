"""Professional Drawer Navigation with Floating Toggle"""
import streamlit as st
import streamlit.components.v1 as components

def setup_page(page_title, page_icon="📊"):
    """Setup page with professional drawer navigation
    
    NOTE: Call st.set_page_config() in your page BEFORE calling this function!
    """
    
    # Auth check
    if not st.session_state.get('authenticated', False):
        st.switch_page("pages/1_Login.py")
    
    # Initialize drawer state
    if 'drawer_open' not in st.session_state:
        st.session_state.drawer_open = True
    
    # Get user info
    username = st.session_state.get('username', 'User')
    role = st.session_state.get('role', 'user').lower()
    
    # Professional drawer styling
    drawer_transform = "translateX(0)" if st.session_state.drawer_open else "translateX(-100%)"
    main_margin = "280px" if st.session_state.drawer_open else "0px"
    
    st.markdown(f"""
    <style>
    /* Hide Streamlit branding */
    #MainMenu {{visibility: hidden;}}
    footer {{visibility: hidden;}}
    header {{visibility: hidden;}}
    [data-testid="stSidebarNav"] {{display: none;}}
    .stDeployButton {{display: none;}}
    
    /* Hide default sidebar */
    [data-testid="stSidebar"] {{
        display: none !important;
    }}
    
    /* Custom Drawer */
    .nav-drawer {{
        position: fixed;
        left: 0;
        top: 0;
        width: 280px;
        height: 100vh;
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        transform: {drawer_transform};
        transition: transform 0.3s ease-in-out;
        z-index: 1000;
        overflow-y: auto;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        padding: 2rem 1rem;
        color: white;
    }}
    
    /* Floating toggle button */
    .drawer-toggle {{
        position: fixed;
        top: 1rem;
        left: {('1rem' if not st.session_state.drawer_open else '290px')};
        z-index: 1001;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
    }}
    
    .drawer-toggle:hover {{
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }}
    
    /* Main content adjustment */
    .main .block-container {{
        margin-left: {main_margin};
        transition: margin-left 0.3s ease-in-out;
        padding-top: 4rem;
    }}
    
    /* Drawer content styling */
    .drawer-header {{
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(255,255,255,0.2);
    }}
    
    .drawer-user {{
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }}
    
    .drawer-role {{
        font-size: 0.9rem;
        opacity: 0.8;
    }}
    
    .drawer-nav {{
        margin-top: 2rem;
    }}
    
    .drawer-nav-title {{
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        opacity: 0.9;
    }}
    
    /* Overlay when drawer is open */
    .drawer-overlay {{
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.3);
        z-index: 999;
        display: {('block' if st.session_state.drawer_open else 'none')};
        transition: opacity 0.3s ease-in-out;
    }}
    </style>
    """, unsafe_allow_html=True)
    
    # Floating toggle button
    toggle_icon = "✕" if st.session_state.drawer_open else "☰"
    toggle_html = f"""
    <button class="drawer-toggle" onclick="window.parent.postMessage({{type: 'streamlit:setComponentValue', value: 'toggle'}}, '*')">
        {toggle_icon}
    </button>
    """
    
    # Create columns for toggle button
    col1, col2 = st.columns([1, 20])
    with col1:
        if st.button(toggle_icon, key="drawer_toggle", help="Toggle Navigation"):
            st.session_state.drawer_open = not st.session_state.drawer_open
            st.rerun()
    
    # Drawer content
    if st.session_state.drawer_open:
        # Create drawer using sidebar
        with st.sidebar:
            st.markdown(f"""
            <div class="drawer-header">
                <div class="drawer-user">👤 {username}</div>
                <div class="drawer-role">Role: {role.title()}</div>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown('<div class="drawer-nav-title">🧭 Navigation</div>', unsafe_allow_html=True)
            
            # Navigation buttons
            if st.button("📊 Dashboard", disabled=(page_title=="Dashboard"), use_container_width=True, key="nav_dash"):
                st.switch_page("pages/2_Dashboard.py")
            
            if role in ['admin', 'clinician', 'patient']:
                if st.button("📝 Log Data", disabled=(page_title=="Log Data"), use_container_width=True, key="nav_log"):
                    st.switch_page("pages/3_Log_Data.py")
            
            if st.button("📈 View Trends", disabled=(page_title=="View Trends"), use_container_width=True, key="nav_trends"):
                st.switch_page("pages/4_View_Trends.py")
            
            if role in ['admin', 'clinician']:
                if st.button("🤖 AI Insights", disabled=(page_title=="AI Insights"), use_container_width=True, key="nav_ai"):
                    st.switch_page("pages/5_AI_Insights.py")
                
                if st.button("🔔 Alerts", disabled=(page_title=="Alerts"), use_container_width=True, key="nav_alerts"):
                    st.switch_page("pages/6_Alerts.py")
            
            if st.button("💬 Support Hub", disabled=(page_title=="Support Hub"), use_container_width=True, key="nav_support"):
                st.switch_page("pages/7_Support_Hub.py")
            
            if role in ['admin', 'family', 'caregiver']:
                if st.button("🕊️ Bereavement", disabled=(page_title=="Bereavement"), use_container_width=True, key="nav_bereavement"):
                    st.switch_page("pages/8_Bereavement_Bridge.py")
            
            st.markdown("---")
            
            if st.button("🚪 Logout", use_container_width=True, type="primary", key="nav_logout"):
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                st.rerun()
    
    return username, role
