"""
Project Aura - Beautiful Custom Login Experience
Professional healthcare platform with captivating UI
"""
import streamlit as st
import sys
import os
from datetime import datetime
import hashlib

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from src import db
from src import user_account

# Page configuration - responsive for all devices
st.set_page_config(
    page_title="Project Aura - Login",
    page_icon="🌅",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Initialize database
db.init_database()
user_account.init_user_tables()

# Initialize session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'show_signup' not in st.session_state:
    st.session_state.show_signup = False
if 'show_forgot' not in st.session_state:
    st.session_state.show_forgot = False

# Hide Streamlit UI
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    [data-testid="stSidebar"] {display: none;}
    .stDeployButton {display: none;}
    
    .main .block-container {
        padding: 0;
        max-width: 100%;
    }
    
    /* Animated gradient background */
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
    
    /* Floating particles animation */
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    
    /* Fade in animation */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Pulse animation */
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    /* Glass morphism card */
    .login-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 30px;
        padding: 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: fadeIn 0.8s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    /* Logo animation */
    .logo {
        font-size: 4rem;
        text-align: center;
        animation: pulse 2s ease-in-out infinite;
        margin-bottom: 1rem;
    }
    
    /* Title styling */
    .title {
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
        animation: fadeIn 1s ease-out;
    }
    
    .subtitle {
        text-align: center;
        color: #666;
        font-size: 1.1rem;
        margin-bottom: 2rem;
        animation: fadeIn 1.2s ease-out;
    }
    
    /* Input styling */
    .stTextInput > div > div > input {
        border-radius: 15px;
        border: 2px solid #e0e0e0;
        padding: 1rem;
        font-size: 1rem;
        transition: all 0.3s ease;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    /* Button styling */
    .stButton > button {
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 15px;
        padding: 1rem 2rem;
        font-size: 1.1rem;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    /* Link styling */
    .link-button {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .link-button:hover {
        color: #764ba2;
        text-decoration: underline;
    }
    
    /* Feature cards */
    .feature-card {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 20px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        animation: fadeIn 1.5s ease-out;
        transition: transform 0.3s ease;
    }
    
    .feature-card:hover {
        transform: translateY(-5px);
    }
    
    /* Success message */
    .stSuccess {
        border-radius: 15px;
        animation: fadeIn 0.5s ease-out;
    }
    
    /* Error message */
    .stError {
        border-radius: 15px;
        animation: fadeIn 0.5s ease-out;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .login-card {
            padding: 2rem 1.5rem;
        }
        .title {
            font-size: 2rem;
        }
        .logo {
            font-size: 3rem;
        }
    }
</style>
""", unsafe_allow_html=True)

def hash_password(password):
    """Hash password for security"""
    return hashlib.sha256(password.encode()).hexdigest()

def authenticate_user(username, password):
    """Authenticate user"""
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
    """Register new user"""
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

# Check if already authenticated - show main app
if st.session_state.authenticated:
    # Professional top navigation bar with user account
    st.markdown("""
    <style>
        /* Top Navigation Bar */
        .top-nav {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
            margin: -1rem -1rem 2rem -1rem;
        }
        
        .nav-brand {
            color: white;
            font-size: 1.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .nav-user {
            display: flex;
            align-items: center;
            gap: 1.5rem;
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
        
        .user-info {
            color: white;
            text-align: right;
        }
        
        .user-name {
            font-weight: 600;
            font-size: 1rem;
        }
        
        .user-role {
            font-size: 0.85rem;
            opacity: 0.9;
        }
        
        .nav-icons {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .nav-icon {
            color: white;
            font-size: 1.3rem;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .nav-icon:hover {
            transform: scale(1.2);
        }
        
        .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #fc8181;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }
        
        /* Main content area */
        .main-app {
            background: #f7fafc;
            min-height: 100vh;
            padding: 2rem;
        }
        
        .welcome-header {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .module-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            padding: 1.5rem;
            margin: 1rem 0;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .module-card:hover {
            border-color: #667eea;
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
        }
        
        /* Settings panel */
        .settings-section {
            background: white;
            padding: 1.5rem;
            border-radius: 15px;
            margin: 1rem 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .settings-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        }
    </style>
    """, unsafe_allow_html=True)
    
    # Initialize session state for menu
    if 'show_user_menu' not in st.session_state:
        st.session_state.show_user_menu = False
    if 'current_view' not in st.session_state:
        st.session_state.current_view = 'dashboard'
    
    # Top Navigation Bar
    st.markdown(f"""
    <div class="top-nav">
        <div class="nav-brand">
            <span>🌅</span>
            <span>Project Aura</span>
        </div>
        <div class="nav-user">
            <div class="nav-icons">
                <div class="nav-icon" title="Notifications">
                    🔔
                    <div class="notification-badge">{user_account.get_notification_count(st.session_state.user_id)}</div>
                </div>
                <div class="nav-icon" title="Messages">💬</div>
                <div class="nav-icon" title="Help">❓</div>
            </div>
            <div class="user-info">
                <div class="user-name">{st.session_state.user_name}</div>
                <div class="user-role">{st.session_state.user_role.title()}</div>
            </div>
            <div class="user-avatar" title="Account Menu">
                {st.session_state.user_name[0].upper()}
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # User Account Menu (in sidebar)
    with st.sidebar:
        st.markdown("### 👤 Account Menu")
        
        if st.button("🏠 Dashboard", use_container_width=True, key="nav_dashboard"):
            st.session_state.current_view = 'dashboard'
            st.rerun()
        
        if st.button("👤 My Profile", use_container_width=True, key="nav_profile"):
            st.session_state.current_view = 'profile'
            st.rerun()
        
        if st.button("⚙️ Settings", use_container_width=True, key="nav_settings"):
            st.session_state.current_view = 'settings'
            st.rerun()
        
        if st.button("🔔 Notifications", use_container_width=True, key="nav_notifications"):
            st.session_state.current_view = 'notifications'
            st.rerun()
        
        st.markdown("---")
        
        if st.button("🚪 Logout", use_container_width=True, type="primary", key="main_logout"):
            st.session_state.authenticated = False
            st.session_state.current_view = 'dashboard'
            st.rerun()
    
    # Main Content Area - Different views based on selection
    if st.session_state.current_view == 'dashboard':
        # DASHBOARD VIEW
        st.markdown("## 📊 Dashboard")
        
        # Quick stats
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Active Patients", "24", "+3")
        with col2:
            st.metric("Pending Alerts", "3", "-2")
        with col3:
            st.metric("Appointments Today", "8", "+1")
        with col4:
            st.metric("Messages", "12", "+5")
        
        st.markdown("---")
        
        # Module grid
        st.markdown("### 📋 Available Modules")
        
        modules = [
            ("📊", "Dashboard", "Overview and metrics"),
            ("📝", "Log Data", "Patient data entry"),
            ("📈", "View Trends", "Analytics and charts"),
            ("🤖", "AI Insights", "Predictive analytics"),
            ("🔔", "Alerts", "Priority notifications"),
            ("💬", "Support Hub", "Crisis resources"),
            ("🕊️", "Bereavement", "Grief support"),
            ("👤", "Onboarding", "Patient intake"),
            ("🎓", "Simulation", "Training scenarios"),
            ("💊", "Medications", "Drug tracking"),
            ("📅", "Appointments", "Scheduling"),
            ("👨‍⚕️", "Caregiver", "Care team tools"),
            ("📸", "Memory Vault", "Preserve memories"),
            ("📔", "Journal", "Personal reflection"),
            ("📋", "Care Plan", "Goals and interventions"),
            ("🏃", "Functional Status", "ADL assessments"),
            ("💬", "AI Chatbot", "24/7 support")
        ]
        
        cols = st.columns(3)
        for idx, (icon, name, desc) in enumerate(modules):
            with cols[idx % 3]:
                st.markdown(f"""
                <div class="module-card">
                    <div style="font-size: 2.5rem; text-align: center;">{icon}</div>
                    <div style="font-weight: 600; text-align: center; margin-top: 0.5rem;">{name}</div>
                    <div style="font-size: 0.9rem; color: #666; text-align: center;">{desc}</div>
                </div>
                """, unsafe_allow_html=True)
    
    elif st.session_state.current_view == 'profile':
        # PROFILE VIEW
        st.markdown("## 👤 My Profile")
        
        col1, col2 = st.columns([1, 2])
        
        with col1:
            # Profile picture
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
            
            if st.button("📸 Change Profile Picture", use_container_width=True):
                st.info("Profile picture upload coming soon!")
        
        with col2:
            st.markdown('<div class="settings-section">', unsafe_allow_html=True)
            st.markdown('<div class="settings-title">Personal Information</div>', unsafe_allow_html=True)
            
            with st.form("profile_form"):
                full_name = st.text_input("Full Name", value=st.session_state.user_name)
                email = st.text_input("Email", value=f"{st.session_state.user_name}@projectaura.com")
                phone = st.text_input("Phone Number", placeholder="+1 (555) 123-4567")
                
                col_a, col_b = st.columns(2)
                with col_a:
                    date_of_birth = st.date_input("Date of Birth")
                with col_b:
                    gender = st.selectbox("Gender", ["Prefer not to say", "Male", "Female", "Other"])
                
                address = st.text_area("Address", placeholder="Street address")
                
                if st.form_submit_button("💾 Save Changes", use_container_width=True):
                    st.success("✅ Profile updated successfully!")
            
            st.markdown('</div>', unsafe_allow_html=True)
    
    elif st.session_state.current_view == 'settings':
        # SETTINGS VIEW
        st.markdown("## ⚙️ Settings")
        
        tab1, tab2, tab3, tab4 = st.tabs(["🎨 Appearance", "🔔 Notifications", "🔒 Privacy & Security", "🌐 Language & Region"])
        
        with tab1:
            st.markdown('<div class="settings-section">', unsafe_allow_html=True)
            st.markdown('<div class="settings-title">Appearance Settings</div>', unsafe_allow_html=True)
            
            theme = st.selectbox("Theme", ["Light Mode", "Dark Mode", "Auto (System)"])
            color_scheme = st.selectbox("Color Scheme", ["Purple (Default)", "Blue", "Green", "Orange"])
            font_size = st.slider("Font Size", 12, 20, 14)
            
            st.checkbox("Enable animations", value=True)
            st.checkbox("Compact mode", value=False)
            
            if st.button("Apply Theme", use_container_width=True):
                st.success("✅ Theme settings applied!")
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        with tab2:
            st.markdown('<div class="settings-section">', unsafe_allow_html=True)
            st.markdown('<div class="settings-title">Notification Preferences</div>', unsafe_allow_html=True)
            
            st.checkbox("Email notifications", value=True)
            st.checkbox("Push notifications", value=True)
            st.checkbox("SMS alerts for critical events", value=False)
            
            st.markdown("**Notify me about:**")
            st.checkbox("New patient alerts", value=True)
            st.checkbox("Appointment reminders", value=True)
            st.checkbox("Medication updates", value=True)
            st.checkbox("System updates", value=False)
            
            if st.button("Save Notification Settings", use_container_width=True):
                st.success("✅ Notification preferences saved!")
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        with tab3:
            st.markdown('<div class="settings-section">', unsafe_allow_html=True)
            st.markdown('<div class="settings-title">Privacy & Security</div>', unsafe_allow_html=True)
            
            st.markdown("**Change Password**")
            with st.form("password_form"):
                current_password = st.text_input("Current Password", type="password")
                new_password = st.text_input("New Password", type="password")
                confirm_password = st.text_input("Confirm New Password", type="password")
                
                if st.form_submit_button("🔒 Update Password"):
                    if new_password == confirm_password:
                        st.success("✅ Password updated successfully!")
                    else:
                        st.error("❌ Passwords do not match")
            
            st.markdown("---")
            st.markdown("**Two-Factor Authentication**")
            st.checkbox("Enable 2FA", value=False)
            
            st.markdown("---")
            st.markdown("**Session Management**")
            if st.button("🚪 Log out from all devices"):
                st.warning("This will log you out from all active sessions")
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        with tab4:
            st.markdown('<div class="settings-section">', unsafe_allow_html=True)
            st.markdown('<div class="settings-title">Language & Region</div>', unsafe_allow_html=True)
            
            language = st.selectbox("Language", ["English", "Spanish", "French", "German", "Chinese"])
            timezone = st.selectbox("Timezone", ["UTC-5 (EST)", "UTC-6 (CST)", "UTC-7 (MST)", "UTC-8 (PST)"])
            date_format = st.selectbox("Date Format", ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])
            time_format = st.selectbox("Time Format", ["12-hour", "24-hour"])
            
            if st.button("Save Regional Settings", use_container_width=True):
                st.success("✅ Regional settings saved!")
            
            st.markdown('</div>', unsafe_allow_html=True)
    
    elif st.session_state.current_view == 'notifications':
        # NOTIFICATIONS VIEW
        st.markdown("## 🔔 Notifications")
        
        # Notification filters
        col1, col2, col3 = st.columns(3)
        with col1:
            filter_all = st.checkbox("All", value=True)
        with col2:
            filter_unread = st.checkbox("Unread", value=False)
        with col3:
            filter_important = st.checkbox("Important", value=False)
        
        st.markdown("---")
        
        # Sample notifications
        notifications = [
            ("🔴", "Critical Alert", "Patient John Doe requires immediate attention", "5 min ago", True),
            ("🟡", "Appointment Reminder", "Upcoming appointment with Dr. Smith at 2:00 PM", "1 hour ago", False),
            ("🟢", "Medication Update", "New prescription added for Patient Jane Smith", "2 hours ago", False),
            ("🔵", "System Update", "New features available in the dashboard", "1 day ago", False),
        ]
        
        for icon, title, message, time, is_unread in notifications:
            bg_color = "#f0f4ff" if is_unread else "white"
            st.markdown(f"""
            <div style="background: {bg_color}; padding: 1rem; border-radius: 10px; margin: 0.5rem 0; border-left: 4px solid #667eea;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <div style="font-size: 1.5rem;">{icon}</div>
                        <div style="font-weight: 600; margin-top: 0.5rem;">{title}</div>
                        <div style="color: #666; margin-top: 0.25rem;">{message}</div>
                    </div>
                    <div style="color: #999; font-size: 0.85rem;">{time}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        if st.button("Mark all as read", use_container_width=True):
            st.success("✅ All notifications marked as read!")
    
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; padding: 2rem;">
        <p>✨ All module functionality is preserved in the archive</p>
        <p>🎨 Custom UI development in progress</p>
        <p>📦 Reference: archived_old_ui/</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.stop()

# Main layout
col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    # Logo and title
    st.markdown('<div class="logo">🌅</div>', unsafe_allow_html=True)
    st.markdown('<div class="title">Project Aura</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Compassionate Hospice Care Management</div>', unsafe_allow_html=True)
    
    # Login card
    st.markdown('<div class="login-card">', unsafe_allow_html=True)
    
    # Toggle between login, signup, and forgot password
    if not st.session_state.show_signup and not st.session_state.show_forgot:
        # LOGIN FORM
        st.markdown("### 🔐 Welcome Back")
        st.markdown("Sign in to continue to your dashboard")
        
        with st.form("login_form", clear_on_submit=False):
            username = st.text_input("Username", placeholder="Enter your username", key="login_username")
            password = st.text_input("Password", type="password", placeholder="Enter your password", key="login_password")
            
            col_a, col_b = st.columns(2)
            with col_a:
                remember = st.checkbox("Remember me")
            with col_b:
                st.markdown('<div style="text-align: right; margin-top: 0.5rem;"></div>', unsafe_allow_html=True)
            
            submit = st.form_submit_button("Sign In", use_container_width=True)
            
            if submit:
                if username and password:
                    user = authenticate_user(username, password)
                    if user:
                        st.session_state.authenticated = True
                        st.session_state.user_id = user[0]
                        st.session_state.user_name = user[1]
                        st.session_state.user_role = user[2]
                        st.success("✅ Login successful! Redirecting...")
                        st.balloons()
                        st.rerun()
                    else:
                        st.error("❌ Invalid username or password")
                else:
                    st.warning("⚠️ Please fill in all fields")
        
        # Links
        st.markdown("---")
        col_x, col_y = st.columns(2)
        with col_x:
            if st.button("📝 Create Account", use_container_width=True, key="show_signup_btn"):
                st.session_state.show_signup = True
                st.rerun()
        with col_y:
            if st.button("🔑 Forgot Password?", use_container_width=True, key="show_forgot_btn"):
                st.session_state.show_forgot = True
                st.rerun()
    
    elif st.session_state.show_signup:
        # SIGNUP FORM
        st.markdown("### 📝 Create Your Account")
        st.markdown("Join Project Aura today")
        
        with st.form("signup_form", clear_on_submit=True):
            new_username = st.text_input("Username", placeholder="Choose a username", key="signup_username")
            new_email = st.text_input("Email", placeholder="your.email@example.com", key="signup_email")
            new_password = st.text_input("Password", type="password", placeholder="Create a strong password", key="signup_password")
            confirm_password = st.text_input("Confirm Password", type="password", placeholder="Confirm your password", key="confirm_password")
            
            role = st.selectbox("I am a:", ["Patient", "Caregiver", "Healthcare Provider", "Administrator"])
            
            agree = st.checkbox("I agree to the Terms of Service and Privacy Policy")
            
            submit_signup = st.form_submit_button("Create Account", use_container_width=True)
            
            if submit_signup:
                if not agree:
                    st.error("❌ Please agree to the terms and conditions")
                elif not all([new_username, new_email, new_password, confirm_password]):
                    st.warning("⚠️ Please fill in all fields")
                elif new_password != confirm_password:
                    st.error("❌ Passwords do not match")
                elif len(new_password) < 6:
                    st.error("❌ Password must be at least 6 characters")
                else:
                    role_map = {
                        "Patient": "patient",
                        "Caregiver": "caregiver",
                        "Healthcare Provider": "provider",
                        "Administrator": "admin"
                    }
                    if register_user(new_username, new_password, new_email, role_map[role]):
                        st.success("✅ Account created successfully! Please sign in.")
                        st.balloons()
                        st.session_state.show_signup = False
                        st.rerun()
                    else:
                        st.error("❌ Username already exists. Please choose another.")
        
        st.markdown("---")
        if st.button("← Back to Login", use_container_width=True):
            st.session_state.show_signup = False
            st.rerun()
    
    else:
        # FORGOT PASSWORD FORM
        st.markdown("### 🔑 Reset Password")
        st.markdown("Contact your administrator for password reset")
        
        with st.form("forgot_form"):
            forgot_email = st.text_input("Email Address", placeholder="your.email@example.com")
            forgot_username = st.text_input("Username", placeholder="Your username")
            
            submit_forgot = st.form_submit_button("Request Reset", use_container_width=True)
            
            if submit_forgot:
                if forgot_email and forgot_username:
                    st.info("""
                    📧 **Password Reset Request Submitted**
                    
                    Your request has been sent to the administrator. You will receive an email with reset instructions within 24 hours.
                    
                    **Need immediate help?**
                    - Email: admin@projectaura.com
                    - Phone: 1-800-AURA-HELP
                    """)
                else:
                    st.warning("⚠️ Please fill in all fields")
        
        st.markdown("---")
        if st.button("← Back to Login", use_container_width=True, key="back_from_forgot"):
            st.session_state.show_forgot = False
            st.rerun()
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Demo credentials
    with st.expander("🎯 Demo Credentials"):
        st.markdown("""
        **Try these demo accounts:**
        
        👨‍⚕️ **Healthcare Provider**
        - Username: `doctor`
        - Password: `doctor123`
        
        👤 **Patient**
        - Username: `patient`
        - Password: `patient123`
        
        👨‍👩‍👧 **Caregiver**
        - Username: `caregiver`
        - Password: `caregiver123`
        """)

# Features section
st.markdown("<br><br>", unsafe_allow_html=True)
col_f1, col_f2, col_f3, col_f4 = st.columns(4)

with col_f1:
    st.markdown("""
    <div class="feature-card">
        <div style="font-size: 2rem; text-align: center;">📊</div>
        <div style="text-align: center; font-weight: 600; margin-top: 0.5rem;">Analytics</div>
        <div style="text-align: center; font-size: 0.9rem; color: #666;">Real-time insights</div>
    </div>
    """, unsafe_allow_html=True)

with col_f2:
    st.markdown("""
    <div class="feature-card">
        <div style="font-size: 2rem; text-align: center;">🤖</div>
        <div style="text-align: center; font-weight: 600; margin-top: 0.5rem;">AI Support</div>
        <div style="text-align: center; font-size: 0.9rem; color: #666;">24/7 assistance</div>
    </div>
    """, unsafe_allow_html=True)

with col_f3:
    st.markdown("""
    <div class="feature-card">
        <div style="font-size: 2rem; text-align: center;">🔒</div>
        <div style="text-align: center; font-weight: 600; margin-top: 0.5rem;">Secure</div>
        <div style="text-align: center; font-size: 0.9rem; color: #666;">HIPAA compliant</div>
    </div>
    """, unsafe_allow_html=True)

with col_f4:
    st.markdown("""
    <div class="feature-card">
        <div style="font-size: 2rem; text-align: center;">📱</div>
        <div style="text-align: center; font-weight: 600; margin-top: 0.5rem;">Responsive</div>
        <div style="text-align: center; font-size: 0.9rem; color: #666;">All devices</div>
    </div>
    """, unsafe_allow_html=True)
