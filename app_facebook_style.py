"""
Project Aura - Facebook-Style UI/UX
Professional social media inspired layout
"""
import streamlit as st
import sys
import os
from datetime import datetime, date
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from src import db
from src import user_account

# Must be first Streamlit command
if 'authenticated' in st.session_state and st.session_state.authenticated:
    st.set_page_config(page_title="Project Aura", page_icon="🌅", layout="wide", initial_sidebar_state="collapsed")
else:
    st.set_page_config(page_title="Project Aura - Login", page_icon="🌅", layout="wide", initial_sidebar_state="collapsed")

db.init_database()
user_account.init_user_tables()

# Session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'show_signup' not in st.session_state:
    st.session_state.show_signup = False
if 'current_view' not in st.session_state:
    st.session_state.current_view = 'dashboard'
if 'show_profile_menu' not in st.session_state:
    st.session_state.show_profile_menu = False

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def authenticate_user(username, password):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role FROM users WHERE username = ? AND password = ?",
                  (username, hash_password(password)))
    user = cursor.fetchone()
    conn.close()
    return user

# Facebook-style CSS
st.markdown("""
<style>
    /* Hide Streamlit elements */
    #MainMenu, footer, header {visibility: hidden;}
    [data-testid="stSidebar"] {display: none !important;}
    .main .block-container {padding: 0; max-width: 100%;}
    
    /* Facebook-style Top Nav Bar */
    .fb-topnav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 56px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        padding: 0 16px;
        z-index: 1000;
        justify-content: space-between;
    }
    
    .fb-logo {
        font-size: 1.5rem;
        font-weight: 700;
        color: #667eea;
        cursor: pointer;
    }
    
    .fb-search {
        background: #f0f2f5;
        border-radius: 50px;
        padding: 8px 16px;
        width: 240px;
    }
    
    .fb-nav-icons {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    
    .fb-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f0f2f5;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.2rem;
        transition: background 0.2s;
    }
    
    .fb-icon:hover {
        background: #e4e6eb;
    }
    
    .fb-profile-pic {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        cursor: pointer;
    }
    
    /* Layout Container */
    .fb-container {
        display: flex;
        margin-top: 56px;
        min-height: calc(100vh - 56px);
    }
    
    /* Left Sidebar */
    .fb-left-sidebar {
        width: 280px;
        position: fixed;
        left: 0;
        top: 56px;
        bottom: 0;
        overflow-y: auto;
        padding: 16px;
        background: white;
    }
    
    .fb-menu-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        margin-bottom: 4px;
    }
    
    .fb-menu-item:hover {
        background: #f0f2f5;
    }
    
    .fb-menu-item.active {
        background: #e7f3ff;
        color: #1877f2;
    }
    
    .fb-menu-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #e4e6eb;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-size: 1.2rem;
    }
    
    /* Center Content */
    .fb-content {
        margin-left: 280px;
        margin-right: 280px;
        padding: 16px;
        flex: 1;
        background: #f0f2f5;
    }
    
    /* Right Sidebar */
    .fb-right-sidebar {
        width: 280px;
        position: fixed;
        right: 0;
        top: 56px;
        bottom: 0;
        overflow-y: auto;
        padding: 16px;
        background: white;
    }
    
    /* Cards */
    .fb-card {
        background: white;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    /* Profile Dropdown */
    .fb-dropdown {
        position: fixed;
        top: 60px;
        right: 16px;
        width: 360px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px;
        z-index: 1001;
    }
    
    .fb-dropdown-item {
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .fb-dropdown-item:hover {
        background: #f0f2f5;
    }
    
    /* Login page */
    .login-page {
        background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
    }
    
    .login-card {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1);
        width: 400px;
    }
</style>
""", unsafe_allow_html=True)

# AUTHENTICATED VIEW
if st.session_state.authenticated:
    # Top Navigation Bar
    st.markdown(f"""
    <div class="fb-topnav">
        <div style="display: flex; align-items: center; gap: 16px;">
            <div class="fb-logo">🌅 Aura</div>
            <div class="fb-search">🔍 Search...</div>
        </div>
        <div class="fb-nav-icons">
            <div class="fb-icon" title="Home">🏠</div>
            <div class="fb-icon" title="Notifications">🔔</div>
            <div class="fb-icon" title="Messages">💬</div>
            <div class="fb-profile-pic" id="profile-btn">{st.session_state.user_name[0].upper()}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Profile Dropdown Menu
    col_menu1, col_menu2, col_menu3 = st.columns([5, 1, 1])
    with col_menu3:
        if st.button("👤", key="profile_menu_toggle", help="Account"):
            st.session_state.show_profile_menu = not st.session_state.show_profile_menu
    
    if st.session_state.show_profile_menu:
        with st.container():
            st.markdown(f"""
            <div class="fb-dropdown">
                <div style="padding: 12px; border-bottom: 1px solid #e4e6eb;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="fb-profile-pic">{st.session_state.user_name[0].upper()}</div>
                        <div>
                            <div style="font-weight: 600;">{st.session_state.user_name}</div>
                            <div style="font-size: 0.9rem; color: #65676b;">{st.session_state.user_role.title()}</div>
                        </div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button("👤 View Profile", key="goto_profile", use_container_width=True):
                st.session_state.current_view = 'profile'
                st.session_state.show_profile_menu = False
                st.rerun()
            
            if st.button("⚙️ Settings", key="goto_settings", use_container_width=True):
                st.session_state.current_view = 'settings'
                st.session_state.show_profile_menu = False
                st.rerun()
            
            if st.button("🚪 Logout", key="logout_btn", use_container_width=True, type="primary"):
                st.session_state.authenticated = False
                st.session_state.show_profile_menu = False
                st.rerun()
    
    # Main Layout Container
    col_left, col_center, col_right = st.columns([1, 2, 1])
    
    # LEFT SIDEBAR - Main Navigation
    with col_left:
        st.markdown('<div class="fb-left-sidebar">', unsafe_allow_html=True)
        
        menu_items = [
            ("🏠", "Dashboard", "dashboard"),
            ("📊", "Analytics", "analytics"),
            ("💊", "Medications", "medications"),
            ("📅", "Appointments", "appointments"),
            ("👥", "Patients", "patients"),
            ("🔔", "Alerts", "alerts"),
            ("💬", "Messages", "messages"),
            ("📸", "Memories", "memories"),
            ("📔", "Journal", "journal"),
            ("🎓", "Training", "training"),
        ]
        
        for icon, label, view in menu_items:
            if st.button(f"{icon}  {label}", key=f"menu_{view}", use_container_width=True):
                st.session_state.current_view = view
                st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # CENTER CONTENT - Main Feed/Content
    with col_center:
        st.markdown('<div class="fb-content">', unsafe_allow_html=True)
        
        if st.session_state.current_view == 'profile':
            st.markdown('<div class="fb-card">', unsafe_allow_html=True)
            st.markdown("## 👤 My Profile")
            
            profile = user_account.get_user_profile(st.session_state.user_id)
            
            with st.form("profile_form"):
                full_name = st.text_input("Full Name", value=profile.get('full_name', '') if profile else '')
                email = st.text_input("Email", value=profile.get('email', '') if profile else '')
                phone = st.text_input("Phone", value=profile.get('phone', '') if profile else '')
                
                if st.form_submit_button("💾 Save Changes"):
                    if user_account.update_user_profile(st.session_state.user_id, full_name, email, phone, '', '', ''):
                        st.success("✅ Profile updated!")
                        st.balloons()
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        elif st.session_state.current_view == 'settings':
            st.markdown('<div class="fb-card">', unsafe_allow_html=True)
            st.markdown("## ⚙️ Settings")
            
            settings = user_account.get_user_settings(st.session_state.user_id)
            
            with st.form("settings_form"):
                theme = st.selectbox("Theme", ["Light", "Dark"], index=0)
                notifications = st.checkbox("Enable notifications", value=settings.get('email_notifications', True))
                
                if st.form_submit_button("Save Settings"):
                    settings.update({'theme': theme, 'email_notifications': notifications})
                    if user_account.save_user_settings(st.session_state.user_id, settings):
                        st.success("✅ Settings saved!")
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        else:  # Dashboard
            st.markdown('<div class="fb-card">', unsafe_allow_html=True)
            st.markdown("## 🏠 Dashboard")
            
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Patients", "24", "+3")
            with col2:
                st.metric("Alerts", user_account.get_notification_count(st.session_state.user_id), "+2")
            with col3:
                st.metric("Appointments", "8", "+1")
            with col4:
                st.metric("Messages", "12", "+5")
            
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Activity Feed
            st.markdown('<div class="fb-card">', unsafe_allow_html=True)
            st.markdown("### 📋 Recent Activity")
            st.info("Activity feed coming soon...")
            st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # RIGHT SIDEBAR - Notifications & Shortcuts
    with col_right:
        st.markdown('<div class="fb-right-sidebar">', unsafe_allow_html=True)
        
        st.markdown("### 🔔 Notifications")
        notifications = user_account.get_user_notifications(st.session_state.user_id)[:5]
        
        for notif in notifications:
            st.markdown(f"""
            <div style="padding: 8px; border-radius: 8px; background: {'#e7f3ff' if not notif['is_read'] else '#f0f2f5'}; margin-bottom: 8px;">
                <div style="font-weight: 600; font-size: 0.9rem;">{notif['title']}</div>
                <div style="font-size: 0.85rem; color: #65676b;">{notif['message'][:50]}...</div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("---")
        st.markdown("### ⚡ Quick Actions")
        if st.button("➕ Add Patient", use_container_width=True):
            st.info("Add patient feature coming soon")
        if st.button("📝 Log Data", use_container_width=True):
            st.info("Log data feature coming soon")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    st.stop()

# LOGIN PAGE
st.markdown('<div class="login-page">', unsafe_allow_html=True)

col1, col2, col3 = st.columns([1, 1, 1])

with col2:
    st.markdown('<div class="login-card">', unsafe_allow_html=True)
    st.markdown('<h1 style="text-align: center; color: #667eea;">🌅 Project Aura</h1>', unsafe_allow_html=True)
    st.markdown('<p style="text-align: center; color: #666;">Hospice Care Management</p>', unsafe_allow_html=True)
    
    with st.form("login_form"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        
        if st.form_submit_button("Sign In", use_container_width=True):
            if username and password:
                user = authenticate_user(username, password)
                if user:
                    st.session_state.authenticated = True
                    st.session_state.user_id = user[0]
                    st.session_state.user_name = user[1]
                    st.session_state.user_role = user[2]
                    st.success("✅ Login successful!")
                    st.rerun()
                else:
                    st.error("❌ Invalid credentials")
    
    with st.expander("🎯 Demo"):
        st.code("doctor / doctor123")
    
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)
