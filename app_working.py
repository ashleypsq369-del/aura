"""
Project Aura - Complete Working Version with Functional User Account
"""
import streamlit as st
import sys
import os
from datetime import datetime, date
import hashlib

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from src import db
from src import user_account

# Page configuration
st.set_page_config(
    page_title="Project Aura",
    page_icon="🌅",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Initialize
db.init_database()
user_account.init_user_tables()

# Session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'show_signup' not in st.session_state:
    st.session_state.show_signup = False
if 'show_forgot' not in st.session_state:
    st.session_state.show_forgot = False
if 'show_account_menu' not in st.session_state:
    st.session_state.show_account_menu = False

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def authenticate_user(username, password):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, role FROM users WHERE username = ? AND password = ?",
        (username, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()
    return user

def register_user(username, password, email, role='patient'):
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
            (username, hash_password(password), email, role)
        )
        conn.commit()
        conn.close()
        return True
    except:
        return False

# Hide Streamlit UI
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    [data-testid="stSidebar"] {display: none;}
    .stDeployButton {display: none;}
    .main .block-container {padding: 0; max-width: 100%;}
    
    .stApp {
        background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
        background-size: 400% 400%;
        animation: gradientShift 15s ease infinite;
    }
    
    @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    .login-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 30px;
        padding: 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .top-nav {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin: -1rem -1rem 2rem -1rem;
    }
    
    .user-avatar {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 600;
        color: #667eea;
        border: 3px solid rgba(255,255,255,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .user-avatar:hover {
        transform: scale(1.1);
        border-color: white;
    }
</style>
""", unsafe_allow_html=True)

# AUTHENTICATED VIEW
if st.session_state.authenticated:
    # Top nav
    col_nav1, col_nav2 = st.columns([3, 1])
    with col_nav1:
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; border-radius: 10px;">
            <h2 style="margin:0; color: white;">🌅 Project Aura - Welcome, {st.session_state.user_name}!</h2>
        </div>
        """, unsafe_allow_html=True)
    
    with col_nav2:
        # User menu button
        if st.button(f"👤 {st.session_state.user_name[0].upper()}", key="user_menu_btn", use_container_width=True):
            st.session_state.show_account_menu = not st.session_state.show_account_menu
    
    # Account Menu Popup
    if st.session_state.show_account_menu:
        with st.expander("👤 Account Menu", expanded=True):
            menu_choice = st.radio(
                "Select an option:",
                ["🏠 Dashboard", "👤 My Profile", "⚙️ Settings", "🔔 Notifications", "🚪 Logout"],
                key="account_menu_radio"
            )
            
            if menu_choice == "🚪 Logout":
                st.session_state.authenticated = False
                st.session_state.show_account_menu = False
                st.rerun()
            elif menu_choice != "🏠 Dashboard":
                st.session_state.current_view = menu_choice.split()[1].lower()
                st.session_state.show_account_menu = False
                st.rerun()
    
    # Initialize current view
    if 'current_view' not in st.session_state:
        st.session_state.current_view = 'dashboard'
    
    st.markdown("---")
    
    # VIEWS
    if st.session_state.current_view == 'profile':
        st.markdown("## 👤 My Profile")
        
        # Load current profile
        profile = user_account.get_user_profile(st.session_state.user_id)
        
        col1, col2 = st.columns([1, 2])
        
        with col1:
            st.markdown(f"""
            <div style="text-align: center;">
                <div style="width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 4rem; color: white; font-weight: 600;">
                    {st.session_state.user_name[0].upper()}
                </div>
                <h3 style="margin-top: 1rem;">{st.session_state.user_name}</h3>
                <p style="color: #666;">{st.session_state.user_role.title()}</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            with st.form("profile_form"):
                st.markdown("### Personal Information")
                
                full_name = st.text_input("Full Name", value=profile.get('full_name', st.session_state.user_name) if profile else st.session_state.user_name)
                email = st.text_input("Email", value=profile.get('email', '') if profile else '')
                phone = st.text_input("Phone", value=profile.get('phone', '') if profile else '')
                
                col_a, col_b = st.columns(2)
                with col_a:
                    dob = st.date_input("Date of Birth", value=date(1990, 1, 1))
                with col_b:
                    gender = st.selectbox("Gender", ["Prefer not to say", "Male", "Female", "Other"])
                
                address = st.text_area("Address", value=profile.get('address', '') if profile else '')
                
                if st.form_submit_button("💾 Save Changes", use_container_width=True):
                    if user_account.update_user_profile(
                        st.session_state.user_id, full_name, email, phone, 
                        str(dob), gender, address
                    ):
                        st.success("✅ Profile updated successfully!")
                        st.balloons()
                    else:
                        st.error("❌ Error updating profile")
    
    elif st.session_state.current_view == 'settings':
        st.markdown("## ⚙️ Settings")
        
        # Load current settings
        settings = user_account.get_user_settings(st.session_state.user_id)
        
        tab1, tab2, tab3 = st.tabs(["🎨 Appearance", "🔔 Notifications", "🔒 Security"])
        
        with tab1:
            with st.form("appearance_form"):
                st.markdown("### Appearance Settings")
                theme = st.selectbox("Theme", ["Light Mode", "Dark Mode", "Auto"], 
                                    index=["Light Mode", "Dark Mode", "Auto"].index(settings.get('theme', 'Light Mode')))
                color_scheme = st.selectbox("Color Scheme", ["Purple (Default)", "Blue", "Green"],
                                           index=["Purple (Default)", "Blue", "Green"].index(settings.get('color_scheme', 'Purple (Default)')))
                font_size = st.slider("Font Size", 12, 20, settings.get('font_size', 14))
                
                animations = st.checkbox("Enable animations", value=settings.get('animations', True))
                
                if st.form_submit_button("Apply Settings", use_container_width=True):
                    settings.update({
                        'theme': theme,
                        'color_scheme': color_scheme,
                        'font_size': font_size,
                        'animations': animations
                    })
                    if user_account.save_user_settings(st.session_state.user_id, settings):
                        st.success("✅ Settings saved!")
                        st.balloons()
        
        with tab2:
            with st.form("notification_form"):
                st.markdown("### Notification Preferences")
                email_notif = st.checkbox("Email notifications", value=settings.get('email_notifications', True))
                push_notif = st.checkbox("Push notifications", value=settings.get('push_notifications', True))
                sms_alerts = st.checkbox("SMS alerts", value=settings.get('sms_alerts', False))
                
                if st.form_submit_button("Save Preferences", use_container_width=True):
                    settings.update({
                        'email_notifications': email_notif,
                        'push_notifications': push_notif,
                        'sms_alerts': sms_alerts
                    })
                    if user_account.save_user_settings(st.session_state.user_id, settings):
                        st.success("✅ Notification preferences saved!")
        
        with tab3:
            with st.form("password_form"):
                st.markdown("### Change Password")
                current_pwd = st.text_input("Current Password", type="password")
                new_pwd = st.text_input("New Password", type="password")
                confirm_pwd = st.text_input("Confirm Password", type="password")
                
                if st.form_submit_button("🔒 Update Password"):
                    if new_pwd != confirm_pwd:
                        st.error("❌ Passwords do not match")
                    elif len(new_pwd) < 6:
                        st.error("❌ Password must be at least 6 characters")
                    else:
                        success, message = user_account.change_password(
                            st.session_state.user_id, current_pwd, new_pwd
                        )
                        if success:
                            st.success(f"✅ {message}")
                            st.balloons()
                        else:
                            st.error(f"❌ {message}")
    
    elif st.session_state.current_view == 'notifications':
        st.markdown("## 🔔 Notifications")
        
        col1, col2 = st.columns([3, 1])
        with col2:
            if st.button("Mark all as read", use_container_width=True):
                user_account.mark_all_notifications_read(st.session_state.user_id)
                st.success("✅ All marked as read!")
                st.rerun()
        
        # Get notifications
        notifications = user_account.get_user_notifications(st.session_state.user_id)
        
        if not notifications:
            st.info("No notifications")
        else:
            for notif in notifications:
                priority_icons = {
                    'critical': '🔴',
                    'high': '🟡',
                    'normal': '🟢',
                    'low': '🔵'
                }
                icon = priority_icons.get(notif['priority'], '🔵')
                bg = "#f0f4ff" if not notif['is_read'] else "white"
                
                st.markdown(f"""
                <div style="background: {bg}; padding: 1rem; border-radius: 10px; margin: 0.5rem 0; border-left: 4px solid #667eea;">
                    <div style="font-size: 1.5rem;">{icon} <strong>{notif['title']}</strong></div>
                    <div style="color: #666; margin-top: 0.5rem;">{notif['message']}</div>
                    <div style="color: #999; font-size: 0.85rem; margin-top: 0.5rem;">{notif['created_at']}</div>
                </div>
                """, unsafe_allow_html=True)
    
    else:  # Dashboard
        st.markdown("## 📊 Dashboard")
        
        # Quick stats
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Active Patients", "24", "+3")
        with col2:
            notif_count = user_account.get_notification_count(st.session_state.user_id)
            st.metric("Unread Notifications", notif_count, f"+{notif_count}")
        with col3:
            st.metric("Appointments Today", "8", "+1")
        with col4:
            st.metric("Messages", "12", "+5")
        
        st.markdown("---")
        st.markdown("### 📋 Available Modules")
        
        modules = [
            ("📊", "Dashboard", "Overview"), ("📝", "Log Data", "Entry"),
            ("📈", "Trends", "Analytics"), ("🤖", "AI Insights", "Predictions"),
            ("🔔", "Alerts", "Notifications"), ("💬", "Support", "Resources"),
            ("🕊️", "Bereavement", "Grief"), ("👤", "Onboarding", "Intake"),
            ("🎓", "Simulation", "Training"), ("💊", "Medications", "Drugs"),
            ("📅", "Appointments", "Schedule"), ("👨‍⚕️", "Caregiver", "Tools"),
            ("📸", "Memories", "Vault"), ("📔", "Journal", "Reflection"),
            ("📋", "Care Plan", "Goals"), ("🏃", "Functional", "ADL"),
            ("💬", "AI Chat", "24/7")
        ]
        
        cols = st.columns(4)
        for idx, (icon, name, desc) in enumerate(modules):
            with cols[idx % 4]:
                if st.button(f"{icon}\n{name}", key=f"mod_{idx}", use_container_width=True):
                    st.info(f"Module: {name} - Coming soon!")
    
    st.stop()

# LOGIN VIEW
col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    st.markdown('<div style="font-size: 4rem; text-align: center;">🌅</div>', unsafe_allow_html=True)
    st.markdown('<h1 style="text-align: center;">Project Aura</h1>', unsafe_allow_html=True)
    st.markdown('<p style="text-align: center; color: #666;">Compassionate Hospice Care</p>', unsafe_allow_html=True)
    
    st.markdown('<div class="login-card">', unsafe_allow_html=True)
    
    if not st.session_state.show_signup and not st.session_state.show_forgot:
        st.markdown("### 🔐 Welcome Back")
        
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
                        st.balloons()
                        st.rerun()
                    else:
                        st.error("❌ Invalid credentials")
        
        col_x, col_y = st.columns(2)
        with col_x:
            if st.button("📝 Sign Up"):
                st.session_state.show_signup = True
                st.rerun()
        with col_y:
            if st.button("🔑 Forgot Password"):
                st.session_state.show_forgot = True
                st.rerun()
        
        with st.expander("🎯 Demo Credentials"):
            st.code("doctor / doctor123\npatient / patient123")
    
    elif st.session_state.show_signup:
        st.markdown("### 📝 Create Account")
        
        with st.form("signup_form"):
            new_user = st.text_input("Username")
            new_email = st.text_input("Email")
            new_pwd = st.text_input("Password", type="password")
            confirm = st.text_input("Confirm Password", type="password")
            role = st.selectbox("Role", ["Patient", "Caregiver", "Provider"])
            
            if st.form_submit_button("Create Account"):
                if new_pwd == confirm and len(new_pwd) >= 6:
                    role_map = {"Patient": "patient", "Caregiver": "caregiver", "Provider": "provider"}
                    if register_user(new_user, new_pwd, new_email, role_map[role]):
                        st.success("✅ Account created!")
                        st.session_state.show_signup = False
                        st.rerun()
                else:
                    st.error("❌ Check password")
        
        if st.button("← Back"):
            st.session_state.show_signup = False
            st.rerun()
    
    else:
        st.markdown("### 🔑 Reset Password")
        st.info("Contact admin@projectaura.com for password reset")
        
        if st.button("← Back"):
            st.session_state.show_forgot = False
            st.rerun()
    
    st.markdown('</div>', unsafe_allow_html=True)
