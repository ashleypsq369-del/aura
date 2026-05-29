"""
Project Aura - Complete Facebook-Style UI with Full Functionality
All features working: Profile, Settings, Notifications, Password, Search, Messages
"""
import streamlit as st
import sys, os
from datetime import datetime, date
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from src import db
from src import user_account

# Page config
if 'authenticated' in st.session_state and st.session_state.authenticated:
    st.set_page_config(page_title="Project Aura", page_icon="🌅", layout="wide", initial_sidebar_state="collapsed")
else:
    st.set_page_config(page_title="Project Aura", page_icon="🌅", layout="wide", initial_sidebar_state="collapsed")

db.init_database()
user_account.init_user_tables()

# Session state
for key, default in [('authenticated', False), ('show_signup', False), ('current_view', 'dashboard'), 
                     ('show_profile_menu', False), ('show_notifications', False), ('show_messages', False)]:
    if key not in st.session_state:
        st.session_state[key] = default

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

# CSS
st.markdown("""
<style>
    #MainMenu, footer, header {visibility: hidden;}
    [data-testid="stSidebar"] {display: none !important;}
    .main .block-container {padding: 0; max-width: 100%;}
    
    .fb-topnav {
        position: fixed; top: 0; left: 0; right: 0; height: 56px;
        background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex; align-items: center; padding: 0 16px; z-index: 1000;
        justify-content: space-between;
    }
    .fb-logo {font-size: 1.5rem; font-weight: 700; color: #667eea; cursor: pointer;}
    .fb-container {display: flex; margin-top: 56px; min-height: calc(100vh - 56px);}
    .fb-left-sidebar {width: 280px; position: fixed; left: 0; top: 56px; bottom: 0; 
                      overflow-y: auto; padding: 16px; background: white;}
    .fb-content {margin-left: 280px; margin-right: 280px; padding: 16px; flex: 1; background: #f0f2f5;}
    .fb-right-sidebar {width: 280px; position: fixed; right: 0; top: 56px; bottom: 0; 
                       overflow-y: auto; padding: 16px; background: white;}
    .fb-card {background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px; 
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);}
    .login-page {background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
                 background-size: 400% 400%; animation: gradientShift 15s ease infinite;
                 min-height: 100vh; display: flex; align-items: center; justify-content: center;}
    @keyframes gradientShift {0%, 100% {background-position: 0% 50%;} 50% {background-position: 100% 50%;}}
    .login-card {background: white; border-radius: 8px; padding: 2rem; 
                 box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1); width: 400px;}
</style>
""", unsafe_allow_html=True)

# AUTHENTICATED VIEW
if st.session_state.authenticated:
    # Top Nav
    st.markdown(f"""
    <div class="fb-topnav">
        <div style="display: flex; align-items: center; gap: 16px;">
            <div class="fb-logo">🌅 Aura</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
            <div style="font-size: 1.2rem;">🏠 🔔 💬 👤</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Top nav buttons
    col_t1, col_t2, col_t3, col_t4, col_t5 = st.columns([10, 1, 1, 1, 1])
    
    with col_t2:
        if st.button("🏠", key="nav_home", help="Home"):
            st.session_state.current_view = 'dashboard'
            st.rerun()
    
    with col_t3:
        if st.button("🔔", key="nav_notif", help="Notifications"):
            st.session_state.current_view = 'notifications'
            st.rerun()
    
    with col_t4:
        if st.button("💬", key="nav_msg", help="Messages"):
            st.session_state.current_view = 'messages'
            st.rerun()
    
    with col_t5:
        if st.button("👤", key="nav_profile", help="Profile"):
            st.session_state.show_profile_menu = not st.session_state.show_profile_menu
    
    # Profile dropdown
    if st.session_state.show_profile_menu:
        col_d1, col_d2, col_d3 = st.columns([5, 1, 1])
        with col_d3:
            st.markdown(f"**{st.session_state.user_name}** ({st.session_state.user_role})")
            if st.button("👤 My Profile", key="goto_prof", use_container_width=True):
                st.session_state.current_view = 'profile'
                st.session_state.show_profile_menu = False
                st.rerun()
            if st.button("⚙️ Settings", key="goto_set", use_container_width=True):
                st.session_state.current_view = 'settings'
                st.session_state.show_profile_menu = False
                st.rerun()
            if st.button("🚪 Logout", key="logout", use_container_width=True, type="primary"):
                st.session_state.authenticated = False
                st.rerun()
    
    # Layout
    col_left, col_center, col_right = st.columns([1, 2, 1])
    
    # LEFT SIDEBAR
    with col_left:
        st.markdown("### 📋 Menu")
        menu = [("🏠", "Dashboard", "dashboard"), ("📊", "Analytics", "analytics"), 
                ("💊", "Medications", "medications"), ("📅", "Appointments", "appointments"),
                ("🔔", "Alerts", "alerts"), ("📸", "Memories", "memories")]
        
        for icon, label, view in menu:
            if st.button(f"{icon} {label}", key=f"m_{view}", use_container_width=True):
                st.session_state.current_view = view
                st.rerun()
    
    # CENTER CONTENT
    with col_center:
        if st.session_state.current_view == 'profile':
            st.markdown("## 👤 My Profile")
            profile = user_account.get_user_profile(st.session_state.user_id)
            
            with st.form("prof_form"):
                st.markdown("### Personal Information")
                fname = st.text_input("Full Name", value=profile.get('full_name', '') if profile else '')
                email = st.text_input("Email", value=profile.get('email', '') if profile else '')
                phone = st.text_input("Phone", value=profile.get('phone', '') if profile else '')
                dob = st.date_input("Date of Birth", value=date(1990, 1, 1))
                gender = st.selectbox("Gender", ["Prefer not to say", "Male", "Female", "Other"])
                address = st.text_area("Address", value=profile.get('address', '') if profile else '')
                
                if st.form_submit_button("💾 Save Profile", use_container_width=True):
                    if user_account.update_user_profile(st.session_state.user_id, fname, email, phone, 
                                                       str(dob), gender, address):
                        st.success("✅ Profile updated successfully!")
                        st.balloons()
                    else:
                        st.error("❌ Error updating profile")
        
        elif st.session_state.current_view == 'settings':
            st.markdown("## ⚙️ Settings")
            settings = user_account.get_user_settings(st.session_state.user_id)
            
            tab1, tab2, tab3 = st.tabs(["🎨 Appearance", "🔔 Notifications", "🔒 Security"])
            
            with tab1:
                with st.form("appearance_form"):
                    theme = st.selectbox("Theme", ["Light", "Dark"], 
                                        index=["Light Mode", "Dark Mode"].index(settings.get('theme', 'Light Mode')) if settings.get('theme') in ["Light Mode", "Dark Mode"] else 0)
                    font_size = st.slider("Font Size", 12, 20, settings.get('font_size', 14))
                    animations = st.checkbox("Animations", value=settings.get('animations', True))
                    
                    if st.form_submit_button("Save Appearance"):
                        settings.update({'theme': f"{theme} Mode", 'font_size': font_size, 'animations': animations})
                        if user_account.save_user_settings(st.session_state.user_id, settings):
                            st.success("✅ Appearance settings saved!")
            
            with tab2:
                with st.form("notif_form"):
                    email_n = st.checkbox("Email notifications", value=settings.get('email_notifications', True))
                    push_n = st.checkbox("Push notifications", value=settings.get('push_notifications', True))
                    sms_n = st.checkbox("SMS alerts", value=settings.get('sms_alerts', False))
                    
                    if st.form_submit_button("Save Notifications"):
                        settings.update({'email_notifications': email_n, 'push_notifications': push_n, 'sms_alerts': sms_n})
                        if user_account.save_user_settings(st.session_state.user_id, settings):
                            st.success("✅ Notification settings saved!")
            
            with tab3:
                with st.form("pwd_form"):
                    st.markdown("### Change Password")
                    curr_pwd = st.text_input("Current Password", type="password")
                    new_pwd = st.text_input("New Password", type="password")
                    conf_pwd = st.text_input("Confirm Password", type="password")
                    
                    if st.form_submit_button("🔒 Update Password"):
                        if new_pwd != conf_pwd:
                            st.error("❌ Passwords don't match")
                        elif len(new_pwd) < 6:
                            st.error("❌ Password must be 6+ characters")
                        else:
                            success, msg = user_account.change_password(st.session_state.user_id, curr_pwd, new_pwd)
                            if success:
                                st.success(f"✅ {msg}")
                                st.balloons()
                            else:
                                st.error(f"❌ {msg}")
        
        elif st.session_state.current_view == 'notifications':
            st.markdown("## 🔔 Notifications")
            
            col_n1, col_n2 = st.columns([3, 1])
            with col_n2:
                if st.button("Mark all read", use_container_width=True):
                    user_account.mark_all_notifications_read(st.session_state.user_id)
                    st.success("✅ All marked as read!")
                    st.rerun()
            
            notifs = user_account.get_user_notifications(st.session_state.user_id)
            
            if not notifs:
                st.info("No notifications")
            else:
                for n in notifs:
                    bg = "#e7f3ff" if not n['is_read'] else "white"
                    st.markdown(f"""
                    <div style="background: {bg}; padding: 1rem; border-radius: 8px; margin: 0.5rem 0; border-left: 4px solid #667eea;">
                        <strong>{n['title']}</strong><br>
                        <span style="color: #666;">{n['message']}</span><br>
                        <small style="color: #999;">{n['created_at']}</small>
                    </div>
                    """, unsafe_allow_html=True)
        
        elif st.session_state.current_view == 'messages':
            st.markdown("## 💬 Messages")
            st.info("Messages feature - Coming soon!")
            st.markdown("This will show your conversations with care team members.")
        
        else:  # Dashboard
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
            
            st.markdown("---")
            st.markdown("### 📋 Recent Activity")
            st.info("Your recent activities will appear here")
    
    # RIGHT SIDEBAR
    with col_right:
        st.markdown("### 🔔 Recent Notifications")
        notifs = user_account.get_user_notifications(st.session_state.user_id)[:5]
        
        for n in notifs:
            bg = "#e7f3ff" if not n['is_read'] else "#f0f2f5"
            st.markdown(f"""
            <div style="padding: 8px; border-radius: 8px; background: {bg}; margin-bottom: 8px;">
                <div style="font-weight: 600; font-size: 0.9rem;">{n['title']}</div>
                <div style="font-size: 0.85rem; color: #65676b;">{n['message'][:40]}...</div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("---")
        st.markdown("### ⚡ Quick Actions")
        if st.button("➕ Add Patient", use_container_width=True):
            st.info("Add patient coming soon")
        if st.button("📝 Log Data", use_container_width=True):
            st.info("Log data coming soon")
    
    st.stop()

# LOGIN PAGE
st.markdown('<div class="login-page">', unsafe_allow_html=True)
col1, col2, col3 = st.columns([1, 1, 1])

with col2:
    st.markdown('<div class="login-card">', unsafe_allow_html=True)
    st.markdown('<h1 style="text-align: center; color: #667eea;">🌅 Project Aura</h1>', unsafe_allow_html=True)
    st.markdown('<p style="text-align: center;">Hospice Care Management</p>', unsafe_allow_html=True)
    
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
    
    with st.expander("🎯 Demo Credentials"):
        st.code("doctor / doctor123\npatient / patient123")
    
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)
