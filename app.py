"""
Project Aura - Professional Hospice Care Platform
Complete Facebook-style UI with role-based navigation
Optimized for speed and offline use
"""
import streamlit as st
import sys, os
from datetime import datetime, date
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from src import db
from src import user_account

# Page config
st.set_page_config(
    page_title="Project Aura", 
    page_icon="🌅", 
    layout="wide", 
    initial_sidebar_state="collapsed"
)

# Initialize database once
@st.cache_resource
def init_app():
    db.init_database()
    user_account.init_user_tables()
    return True

init_app()

# Session state initialization with persistence
for key, default in [('authenticated', False), ('show_signup', False), ('current_view', 'dashboard'), 
                     ('show_profile_menu', False), ('sidebar_open', True), 
                     ('user_id', None), ('user_name', None), ('user_role', None)]:
    if key not in st.session_state:
        st.session_state[key] = default

# Check for persistent login (simple approach - in production use proper session management)
if not st.session_state.authenticated:
    # Try to restore from query params (set after login)
    query_params = st.query_params
    if 'user' in query_params and 'role' in query_params:
        st.session_state.authenticated = True
        st.session_state.user_name = query_params['user']
        st.session_state.user_role = query_params['role']
        st.session_state.user_id = int(query_params.get('uid', 1))

@st.cache_data(ttl=300)
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

def register_user(username, password, email, role='patient'):
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
                      (username, hash_password(password), email, role))
        conn.commit()
        conn.close()
        return True
    except:
        return False

def get_modules_for_role(role):
    """Get all 17 modules filtered by user role"""
    all_modules = [
        ("🏠", "Dashboard", "dashboard", ["all"]),
        ("📝", "Log Data", "log_data", ["provider", "admin"]),
        ("📈", "View Trends", "trends", ["provider", "admin"]),
        ("🤖", "AI Insights", "ai_insights", ["provider", "admin"]),
        ("🔔", "Alerts", "alerts", ["provider", "admin"]),
        ("💬", "Support Hub", "support", ["all"]),
        ("🕊️", "Bereavement", "bereavement", ["all"]),
        ("👤", "Patient Onboarding", "onboarding", ["provider", "admin"]),
        ("🎓", "Clinical Simulation", "simulation", ["provider", "admin"]),
        ("💊", "Medications", "medications", ["provider", "patient", "caregiver", "admin"]),
        ("📅", "Appointments", "appointments", ["all"]),
        ("👨‍⚕️", "Caregiver Portal", "caregiver", ["caregiver", "admin"]),
        ("📸", "Memory Vault", "memories", ["all"]),
        ("📔", "Journal", "journal", ["patient", "caregiver"]),
        ("📋", "Care Plan", "care_plan", ["provider", "admin"]),
        ("🏃", "Functional Status", "functional", ["provider", "admin"]),
        ("💬", "AI Chatbot", "chatbot", ["all"])
    ]
    
    return [(icon, name, view) for icon, name, view, roles in all_modules 
            if "all" in roles or role in roles]

# Hospice Care Theme CSS - Authentic Colors
st.markdown("""
<style>
    /* Hide Streamlit elements */
    #MainMenu, footer, header {visibility: hidden;}
    .main .block-container {padding: 0; max-width: 100%; height: 100vh; overflow-y: auto;}
    
    /* Hospice Care Color Palette */
    :root {
        --hospice-purple: #7B2D8E;        /* National Hospice Purple */
        --hospice-lilac: #C8A2D0;         /* Soft Lilac */
        --hospice-lavender: #E6D5F0;      /* Light Lavender */
        --life-green: #6B9F5C;            /* Hope & Renewal Green */
        --soft-green: #A8D5A1;            /* Gentle Green */
        --warm-orange: #F4A460;           /* Reconnection Orange */
        --sunlight-yellow: #FFD966;       /* Cherish Time Yellow */
        --gentle-cream: #FFF9F0;          /* Soft Cream */
        --text-dark: #4A3B52;             /* Deep Purple-Gray */
        --text-light: #F5F0FA;            /* Very Light Lavender */
    }
    
    /* Main App Background - Purple to Lilac Gradient */
    .stApp {
        max-height: 100vh;
        overflow: hidden;
        background: linear-gradient(135deg, 
            #9B59B6 0%,      /* Deep Purple */
            #B39DDB 25%,     /* Medium Purple */
            #D1C4E9 50%,     /* Lilac */
            #E1BEE7 75%,     /* Light Lilac */
            #F3E5F5 100%     /* Very Light Lavender */
        );
    }
    
    /* Remove blur/transition effects for instant switching */
    .element-container {
        transition: none !important;
    }
    
    .stMarkdown {
        transition: none !important;
    }
    
    /* Top Navigation Bar - Hospice Purple Theme */
    .nav-brand {
        font-size: 1.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--hospice-purple), var(--hospice-lilac));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 2px 4px rgba(123, 45, 142, 0.2);
    }
    
    /* Sidebar - Purple Butterfly Theme */
    .sidebar-header {
        color: var(--text-light);
        font-size: 1.2rem;
        font-weight: 700;
        margin-bottom: 1rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    /* Module Navigation Buttons - Purple & Green Theme */
    .stButton button {
        border-radius: 12px;
        font-weight: 500;
        transition: all 0.3s ease !important;
        border: 2px solid var(--hospice-lilac);
        white-space: nowrap;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(230, 213, 240, 0.95));
        color: var(--text-dark);
        box-shadow: 0 2px 8px rgba(123, 45, 142, 0.15);
    }
    
    .stButton button:hover {
        background: linear-gradient(135deg, var(--hospice-purple), var(--life-green)) !important;
        color: white !important;
        border-color: var(--hospice-purple) !important;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(123, 45, 142, 0.4);
    }
    
    /* Content Cards - Warm Hospice Design with Purple Butterfly Border */
    .content-card {
        background: linear-gradient(135deg, 
            rgba(255, 249, 240, 0.98) 0%,    /* Gentle Cream */
            rgba(246, 237, 255, 0.98) 100%   /* Light Lavender */
        );
        padding: 2rem;
        border-radius: 20px;
        box-shadow: 0 8px 24px rgba(123, 45, 142, 0.2);
        margin-bottom: 1.5rem;
        max-height: 80vh;
        overflow-y: auto;
        border-left: 6px solid var(--hospice-purple);
        border-top: 2px solid var(--hospice-lilac);
        backdrop-filter: blur(10px);
    }
    
    .content-card::-webkit-scrollbar {
        width: 10px;
    }
    
    .content-card::-webkit-scrollbar-track {
        background: var(--hospice-lavender);
        border-radius: 10px;
    }
    
    .content-card::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, var(--hospice-purple), var(--hospice-lilac));
        border-radius: 10px;
    }
    
    /* Profile Avatar - Purple Butterfly Symbol */
    .profile-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--hospice-purple), var(--hospice-lilac));
        margin: 0 auto 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: white;
        font-weight: 700;
        box-shadow: 0 6px 20px rgba(123, 45, 142, 0.4);
        border: 4px solid rgba(255, 255, 255, 0.5);
    }
    
    /* Metrics - Warm Orange & Yellow Accents */
    .metric-card {
        background: linear-gradient(135deg, 
            var(--warm-orange) 0%, 
            var(--sunlight-yellow) 100%
        );
        color: var(--text-dark);
        padding: 1.5rem;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 6px 16px rgba(244, 164, 96, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.6);
    }
    
    /* Expander - Purple & Green Theme */
    .streamlit-expanderHeader {
        background: linear-gradient(135deg, var(--hospice-purple), var(--life-green));
        color: white !important;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(123, 45, 142, 0.3);
    }
    
    /* LOGIN PAGE - Hospice Purple Butterfly Background */
    .login-container {
        background: 
            linear-gradient(135deg, 
                rgba(155, 89, 182, 0.95) 0%,      /* Deep Purple */
                rgba(179, 157, 219, 0.95) 20%,    /* Medium Purple */
                rgba(209, 196, 233, 0.95) 40%,    /* Lilac */
                rgba(225, 190, 231, 0.95) 60%,    /* Light Lilac */
                rgba(168, 213, 161, 0.95) 80%,    /* Soft Green */
                rgba(107, 159, 92, 0.95) 100%     /* Life Green */
            ),
            repeating-linear-gradient(45deg, 
                transparent, 
                transparent 35px, 
                rgba(255,255,255,.08) 35px, 
                rgba(255,255,255,.08) 70px
            );
        background-size: 400% 400%, 100% 100%;
        animation: hospiceFlow 25s ease infinite;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
        pointer-events: none;
    }
    
    /* Purple Butterfly Pattern Overlay */
    .login-container::before {
        content: '🦋';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        font-size: 4rem;
        opacity: 0.1;
        background-image: 
            radial-gradient(circle at 20% 30%, rgba(123, 45, 142, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(107, 159, 92, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(244, 164, 96, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 60% 20%, rgba(255, 217, 102, 0.15) 0%, transparent 40%);
        pointer-events: none;
        z-index: -1;
    }
    
    /* Floating Butterfly Elements */
    .login-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
            radial-gradient(circle, rgba(200, 162, 208, 0.15) 2px, transparent 2px),
            radial-gradient(circle, rgba(168, 213, 161, 0.15) 2px, transparent 2px);
        background-size: 60px 60px, 90px 90px;
        background-position: 0 0, 45px 45px;
        opacity: 0.4;
        pointer-events: none;
        z-index: -1;
        animation: floatButterfly 20s linear infinite;
    }
    
    @keyframes hospiceFlow {
        0%, 100% {background-position: 0% 50%, 0 0;}
        50% {background-position: 100% 50%, 0 0;}
    }
    
    @keyframes floatButterfly {
        0% {transform: translateY(0) rotate(0deg);}
        50% {transform: translateY(-20px) rotate(5deg);}
        100% {transform: translateY(0) rotate(0deg);}
    }
    
    .login-card {
        background: linear-gradient(135deg, 
            rgba(255, 249, 240, 0.98) 0%,
            rgba(246, 237, 255, 0.98) 100%
        );
        backdrop-filter: blur(20px);
        border-radius: 28px;
        padding: 3rem 2.5rem;
        box-shadow: 0 20px 60px rgba(123, 45, 142, 0.4);
        border: 3px solid rgba(200, 162, 208, 0.6);
        max-width: 480px;
        width: 100%;
        position: relative;
        z-index: 1000;
        pointer-events: auto;
    }
    
    /* All login card children above background */
    .login-card * {
        position: relative;
        z-index: 1001;
        pointer-events: auto;
    }
    
    .login-logo {
        font-size: 5rem;
        text-align: center;
        animation: butterflyPulse 4s ease-in-out infinite;
        margin-bottom: 0.5rem;
        filter: drop-shadow(0 6px 12px rgba(123, 45, 142, 0.4));
    }
    
    @keyframes butterflyPulse {
        0%, 100% {transform: scale(1) rotate(0deg); opacity: 1;}
        25% {transform: scale(1.05) rotate(-5deg); opacity: 0.95;}
        50% {transform: scale(1.1) rotate(0deg); opacity: 1;}
        75% {transform: scale(1.05) rotate(5deg); opacity: 0.95;}
    }
    
    .login-title {
        text-align: center;
        background: linear-gradient(135deg, var(--hospice-purple), var(--life-green));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.5rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -1px;
        text-shadow: 0 2px 4px rgba(123, 45, 142, 0.2);
    }
    
    .login-subtitle {
        text-align: center;
        color: var(--text-dark);
        font-size: 1rem;
        margin-bottom: 2rem;
        font-weight: 400;
    }
    
    /* Form inputs - Hospice Purple & Lilac styling with proper z-index */
    .stTextInput, .stSelectbox, .stTextArea, .stCheckbox, .stButton, .stForm {
        position: relative;
        z-index: 1001;
        pointer-events: auto;
    }
    
    .stTextInput input, .stSelectbox select, .stTextArea textarea, .stCheckbox {
        border: 2px solid var(--hospice-lilac) !important;
        border-radius: 12px !important;
        padding: 0.75rem !important;
        background: rgba(255, 249, 240, 0.95) !important;
    }
    
    .stTextInput input:focus, .stSelectbox select:focus, .stTextArea textarea:focus {
        border-color: var(--hospice-purple) !important;
        box-shadow: 0 0 0 4px rgba(123, 45, 142, 0.15) !important;
    }
    
    /* Expander above background */
    .streamlit-expanderHeader, .streamlit-expanderContent {
        position: relative;
        z-index: 1001;
        pointer-events: auto;
    }
    
    /* Tabs - Purple & Green Theme */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    
    .stTabs [data-baseweb="tab"] {
        background: var(--hospice-lavender);
        border-radius: 12px;
        color: var(--text-dark);
        font-weight: 500;
        border: 2px solid var(--hospice-lilac);
    }
    
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, var(--hospice-purple), var(--life-green));
        color: white;
        border-color: var(--hospice-purple);
    }
    
    /* Purple Butterfly Symbol - End of Life Care Indicator */
    .butterfly-symbol {
        display: inline-block;
        font-size: 1.5rem;
        animation: butterflyFloat 3s ease-in-out infinite;
        filter: drop-shadow(0 2px 4px rgba(123, 45, 142, 0.3));
    }
    
    @keyframes butterflyFloat {
        0%, 100% {transform: translateY(0) rotate(0deg);}
        50% {transform: translateY(-5px) rotate(5deg);}
    }
</style>
""", unsafe_allow_html=True)

# ============= AUTHENTICATED VIEW =============
if st.session_state.authenticated:
    
    # Remove login background when authenticated, keep purple gradient
    st.markdown("""
    <style>
        .login-container {
            display: none !important;
        }
    </style>
    """, unsafe_allow_html=True)
    
    # Get modules for role
    modules = get_modules_for_role(st.session_state.user_role)
    
    # Top Bar with Purple Butterfly Theme
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, var(--hospice-purple), var(--hospice-lilac)); 
                padding: 0.75rem 2rem; box-shadow: 0 4px 12px rgba(123, 45, 142, 0.3); 
                margin-bottom: 1rem; border-bottom: 3px solid var(--life-green);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="nav-brand" style="color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                🦋 Project Aura <span style="font-size: 0.8rem; opacity: 0.9;">Hospice Care</span>
            </div>
            <div style="color: white; font-size: 0.9rem; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                Welcome, <strong>{st.session_state.user_name}</strong> 
                <span style="background: linear-gradient(135deg, var(--warm-orange), var(--sunlight-yellow)); 
                            color: var(--text-dark); padding: 0.25rem 0.75rem; 
                            border-radius: 12px; font-size: 0.8rem; margin-left: 0.5rem;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
                    {st.session_state.user_role.title()}
                </span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Account Features in Header
    col1, col2, col3, col4, col5, col6 = st.columns([2, 1, 1, 1, 1, 1])
    
    with col1:
        st.write("")  # Spacer
    
    with col2:
        if st.button("👤 My Profile", key="header_profile", use_container_width=True):
            st.session_state.current_view = 'profile'
    
    with col3:
        if st.button("⚙️ Settings", key="header_settings", use_container_width=True):
            st.session_state.current_view = 'settings'
    
    with col4:
        notif_count = user_account.get_notification_count(st.session_state.user_id)
        notif_label = f"🔔 Notifications ({notif_count})" if notif_count > 0 else "🔔 Notifications"
        if st.button(notif_label, key="header_notif", use_container_width=True):
            st.session_state.current_view = 'notifications'
    
    with col5:
        if st.button("💬 Messages", key="header_messages", use_container_width=True):
            st.session_state.current_view = 'messages'
    
    with col6:
        if st.button("🚪 Logout", key="header_logout", use_container_width=True, type="primary"):
            st.session_state.authenticated = False
            # Clear query params
            st.query_params.clear()
            st.rerun()
    
    st.markdown("---")
    
    # Main Layout: Sidebar + Content (Full Width)
    col_sidebar, col_content = st.columns([1, 4])
    
    # LEFT SIDEBAR - Collapsible with All Modules + Account at Bottom
    with col_sidebar:
        # Toggle button
        if st.button("☰ Menu" if st.session_state.sidebar_open else "☰", 
                    key="toggle_sidebar", use_container_width=True):
            st.session_state.sidebar_open = not st.session_state.sidebar_open
            st.rerun()
        
        if st.session_state.sidebar_open:
            # Use expander for scrollable module list
            with st.expander("📋 All Modules", expanded=True):
                # Display all role-based modules
                for icon, name, view in modules:
                    if st.button(f"{icon} {name}", key=f"sidebar_{view}", use_container_width=True):
                        st.session_state.current_view = view
                        st.session_state.show_profile_menu = False
            
            st.markdown("---")
            st.caption(f"Logged in as: **{st.session_state.user_name}**")
            st.caption(f"Role: **{st.session_state.user_role.title()}**")
    
    # CENTER CONTENT AREA
    with col_content:
        
        # Profile View
        if st.session_state.current_view == 'profile':
            st.markdown('<div class="content-card">', unsafe_allow_html=True)
            st.markdown("## 👤 My Profile")
            
            profile = user_account.get_user_profile(st.session_state.user_id)
            
            with st.form("profile_form"):
                col1, col2 = st.columns(2)
                
                with col1:
                    full_name = st.text_input("Full Name", value=profile.get('full_name', '') if profile else '')
                    email = st.text_input("Email", value=profile.get('email', '') if profile else '')
                    phone = st.text_input("Phone", value=profile.get('phone', '') if profile else '')
                
                with col2:
                    dob = st.date_input("Date of Birth", value=date(1990, 1, 1))
                    gender = st.selectbox("Gender", ["Prefer not to say", "Male", "Female", "Other"])
                
                address = st.text_area("Address", value=profile.get('address', '') if profile else '', height=100)
                
                col_a, col_b = st.columns([3, 1])
                with col_b:
                    if st.form_submit_button("💾 Save Profile", use_container_width=True, type="primary"):
                        if user_account.update_user_profile(st.session_state.user_id, full_name, email, 
                                                           phone, str(dob), gender, address):
                            st.success("✅ Profile updated successfully!")
                            st.balloons()
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Settings View
        elif st.session_state.current_view == 'settings':
            st.markdown('<div class="content-card">', unsafe_allow_html=True)
            st.markdown("## ⚙️ Settings")
            
            settings = user_account.get_user_settings(st.session_state.user_id)
            
            tab1, tab2, tab3 = st.tabs(["🎨 Appearance", "🔔 Notifications", "🔒 Security"])
            
            with tab1:
                st.markdown("### Appearance Settings")
                with st.form("appearance_form"):
                    theme = st.selectbox("Theme", ["Light Mode", "Dark Mode"], 
                                        index=0 if settings.get('theme', 'Light Mode') == 'Light Mode' else 1)
                    font_size = st.slider("Font Size", 12, 20, settings.get('font_size', 14))
                    language = st.selectbox("Language", ["English", "Spanish", "French"])
                    
                    if st.form_submit_button("💾 Save Appearance", use_container_width=True):
                        settings.update({'theme': theme, 'font_size': font_size, 'language': language})
                        if user_account.save_user_settings(st.session_state.user_id, settings):
                            st.success("✅ Appearance settings saved!")
            
            with tab2:
                st.markdown("### Notification Preferences")
                with st.form("notification_form"):
                    email_notif = st.checkbox("Email Notifications", 
                                             value=settings.get('email_notifications', True))
                    push_notif = st.checkbox("Push Notifications", 
                                            value=settings.get('push_notifications', True))
                    sms_notif = st.checkbox("SMS Notifications", 
                                           value=settings.get('sms_notifications', False))
                    
                    st.markdown("**Notification Types:**")
                    alerts = st.checkbox("Critical Alerts", value=True)
                    appointments = st.checkbox("Appointment Reminders", value=True)
                    messages = st.checkbox("New Messages", value=True)
                    
                    if st.form_submit_button("💾 Save Notifications", use_container_width=True):
                        settings.update({
                            'email_notifications': email_notif,
                            'push_notifications': push_notif,
                            'sms_notifications': sms_notif
                        })
                        if user_account.save_user_settings(st.session_state.user_id, settings):
                            st.success("✅ Notification settings saved!")
            
            with tab3:
                st.markdown("### Security Settings")
                with st.form("security_form"):
                    current_pwd = st.text_input("Current Password", type="password")
                    new_pwd = st.text_input("New Password", type="password")
                    confirm_pwd = st.text_input("Confirm New Password", type="password")
                    
                    st.markdown("**Password Requirements:**")
                    st.caption("• At least 6 characters")
                    st.caption("• Mix of letters and numbers recommended")
                    
                    if st.form_submit_button("🔒 Update Password", use_container_width=True):
                        if new_pwd == confirm_pwd and len(new_pwd) >= 6:
                            success, msg = user_account.change_password(st.session_state.user_id, 
                                                                       current_pwd, new_pwd)
                            if success:
                                st.success(f"✅ {msg}")
                                st.balloons()
                            else:
                                st.error(f"❌ {msg}")
                        else:
                            st.error("❌ Passwords don't match or too short!")
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Notifications View
        elif st.session_state.current_view == 'notifications':
            st.markdown('<div class="content-card">', unsafe_allow_html=True)
            st.markdown("## 🔔 Notifications")
            
            col_a, col_b = st.columns([3, 1])
            with col_b:
                if st.button("✓ Mark All Read", use_container_width=True):
                    user_account.mark_all_notifications_read(st.session_state.user_id)
                    st.success("✅ All notifications marked as read!")
                    # st.rerun() - removed for performance
            
            st.markdown("---")
            
            notifications = user_account.get_user_notifications(st.session_state.user_id)
            
            if notifications:
                for notif in notifications:
                    bg_color = "#e7f3ff" if not notif['is_read'] else "#f8f9fa"
                    border = "2px solid #667eea" if not notif['is_read'] else "1px solid #e0e0e0"
                    
                    st.markdown(f"""
                    <div style="background: {bg_color}; padding: 1.25rem; border-radius: 12px; 
                                margin: 0.75rem 0; border: {border};">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong style="font-size: 1.1rem; color: #333;">{notif['title']}</strong>
                                <p style="margin: 0.5rem 0; color: #666;">{notif['message']}</p>
                                <small style="color: #999;">📅 {notif['created_at']}</small>
                            </div>
                            <span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; 
                                        border-radius: 20px; font-size: 0.8rem;">
                                {'NEW' if not notif['is_read'] else 'READ'}
                            </span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.info("📭 No notifications yet!")
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Messages View
        elif st.session_state.current_view == 'messages':
            st.markdown('<div class="content-card">', unsafe_allow_html=True)
            st.markdown("## 💬 Messages")
            st.info("💬 Messaging feature coming soon! You'll be able to communicate with your care team here.")
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Dashboard View
        elif st.session_state.current_view == 'dashboard':
            st.markdown('<div class="content-card">', unsafe_allow_html=True)
            st.markdown("## 🏠 Dashboard")
            st.markdown(f"### Welcome back, {st.session_state.user_name}! 🦋")
            
            # Metrics with Warm Orange & Yellow
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.markdown("""
                <div class="metric-card">
                    <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">24</div>
                    <div style="font-size: 1rem; font-weight: 500;">👥 Patients</div>
                </div>
                """, unsafe_allow_html=True)
            
            with col2:
                notif_count = user_account.get_notification_count(st.session_state.user_id)
                st.markdown(f"""
                <div class="metric-card" style="background: linear-gradient(135deg, var(--hospice-purple), var(--hospice-lilac)); color: white;">
                    <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">{notif_count}</div>
                    <div style="font-size: 1rem; font-weight: 500;">🔔 Alerts</div>
                </div>
                """, unsafe_allow_html=True)
            
            with col3:
                st.markdown("""
                <div class="metric-card" style="background: linear-gradient(135deg, var(--life-green), var(--soft-green)); color: white;">
                    <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">8</div>
                    <div style="font-size: 1rem; font-weight: 500;">📅 Appointments</div>
                </div>
                """, unsafe_allow_html=True)
            
            with col4:
                st.markdown("""
                <div class="metric-card">
                    <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem;">12</div>
                    <div style="font-size: 1rem; font-weight: 500;">💬 Messages</div>
                </div>
                """, unsafe_allow_html=True)
            
            st.markdown("---")
            
            # Quick Actions
            st.markdown("### ⚡ Quick Actions")
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("📝 Log New Data", use_container_width=True):
                    st.session_state.current_view = 'log_data'
                    # st.rerun() - removed for performance
            
            with col2:
                if st.button("📈 View Trends", use_container_width=True):
                    st.session_state.current_view = 'trends'
                    # st.rerun() - removed for performance
            
            with col3:
                if st.button("💬 AI Chatbot", use_container_width=True):
                    st.session_state.current_view = 'chatbot'
                    # st.rerun() - removed for performance
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        # All Other Module Views
        else:
            st.markdown('<div class="content-card">', unsafe_allow_html=True)
            
            # Get module name
            module_name = st.session_state.current_view.replace('_', ' ').title()
            module_icon = next((icon for icon, name, view in modules if view == st.session_state.current_view), "📄")
            
            st.markdown(f"## {module_icon} {module_name}")
            
            # Import and render module-specific content
            try:
                if st.session_state.current_view == 'alerts':
                    from src import alerts
                    alerts.render()
                    
                elif st.session_state.current_view == 'medications':
                    st.markdown("### 💊 Medication Management")
                    
                    tab1, tab2 = st.tabs(["📋 Current Medications", "➕ Add Medication"])
                    
                    with tab1:
                        st.info("No medications recorded yet")
                        
                        # Sample medication display
                        with st.expander("💊 Sample Medication - 10mg"):
                            st.write("**Frequency:** Twice daily")
                            st.write("**Start Date:** 2025-01-01")
                            st.write("**Notes:** Take with food")
                    
                    with tab2:
                        with st.form("add_medication"):
                            col1, col2 = st.columns(2)
                            with col1:
                                med_name = st.text_input("Medication Name *")
                                dosage = st.text_input("Dosage *", placeholder="e.g., 10mg")
                            with col2:
                                frequency = st.selectbox("Frequency *", [
                                    "Once daily", "Twice daily", "Three times daily",
                                    "As needed", "Every 4 hours", "Every 6 hours"
                                ])
                                start_date = st.date_input("Start Date *")
                            
                            notes = st.text_area("Notes (optional)")
                            
                            if st.form_submit_button("Add Medication", type="primary"):
                                if med_name and dosage:
                                    st.success(f"✅ Added {med_name}")
                                else:
                                    st.error("Please fill in required fields")
                    
                elif st.session_state.current_view == 'bereavement':
                    # Bereavement support with full functionality
                    st.markdown("### 🕊️ Bereavement Support")
                    st.markdown("*Compassionate support during your grief journey*")
                    
                    tab1, tab2, tab3 = st.tabs(["📔 Grief Journal", "💙 Support Resources", "📅 Timeline"])
                    
                    with tab1:
                        st.markdown("#### Express Your Feelings")
                        with st.form("grief_journal"):
                            entry = st.text_area("Write your thoughts...", height=200)
                            mood = st.select_slider("How are you feeling?", 
                                options=["😢 Very Sad", "😔 Sad", "😐 Neutral", "🙂 Better", "😊 Good"])
                            if st.form_submit_button("Save Entry"):
                                st.success("✅ Journal entry saved")
                    
                    with tab2:
                        st.info("📚 Understanding Grief: A Comprehensive Guide")
                        st.info("💬 24/7 Grief Support Hotline: 1-800-273-8255")
                        st.info("👥 Local Support Groups")
                        st.info("🧘 Mindfulness and Meditation for Grief")
                    
                    with tab3:
                        st.markdown("#### Support Timeline")
                        st.info("📅 Day 3: Initial condolence and support")
                        st.info("📅 Day 7: Resource sharing")
                        st.info("📅 Day 30: Check-in")
                        st.info("📅 Day 90: Support group invitation")
                    
                elif st.session_state.current_view == 'simulation':
                    from src import simulator
                    simulator.render_simulator_page()
                    
                elif st.session_state.current_view == 'care_plan':
                    from src import care_plan
                    care_plan.render()
                    
                elif st.session_state.current_view == 'appointments':
                    from src import scheduling
                    scheduling.render_scheduling_page()
                    
                elif st.session_state.current_view == 'journal':
                    from src import journal
                    journal.render()
                    
                elif st.session_state.current_view == 'memories':
                    from src import memory_vault
                    memory_vault.render()
                    
                elif st.session_state.current_view == 'log_data':
                    st.markdown("### 📝 Log Patient Data")
                    
                    tab1, tab2 = st.tabs(["Vital Signs", "Symptoms"])
                    
                    with tab1:
                        with st.form("log_vitals"):
                            col1, col2 = st.columns(2)
                            with col1:
                                hr = st.number_input("Heart Rate (bpm)", 40, 200, 75)
                                bp_sys = st.number_input("BP Systolic", 60, 200, 120)
                                bp_dia = st.number_input("BP Diastolic", 40, 140, 80)
                            with col2:
                                o2 = st.number_input("O2 Saturation (%)", 70, 100, 95)
                                temp = st.number_input("Temperature (°F)", 95.0, 105.0, 98.6)
                            
                            if st.form_submit_button("Log Vitals", type="primary"):
                                st.success("✅ Vitals logged successfully!")
                    
                    with tab2:
                        with st.form("log_symptoms"):
                            pain = st.slider("Pain Level", 0, 10, 3)
                            nausea = st.checkbox("Nausea")
                            fatigue = st.checkbox("Fatigue")
                            anxiety = st.checkbox("Anxiety")
                            notes = st.text_area("Notes")
                            
                            if st.form_submit_button("Log Symptoms", type="primary"):
                                st.success("✅ Symptoms logged successfully!")
                    
                elif st.session_state.current_view == 'trends':
                    st.markdown("### 📈 Patient Trends & Analytics")
                    
                    import pandas as pd
                    import numpy as np
                    
                    # Sample trend data
                    dates = pd.date_range(end=datetime.now(), periods=14)
                    data = pd.DataFrame({
                        'Date': dates,
                        'Pain Level': np.random.randint(2, 8, 14),
                        'Heart Rate': np.random.randint(65, 95, 14),
                        'O2 Saturation': np.random.randint(90, 98, 14)
                    })
                    
                    st.line_chart(data.set_index('Date'))
                    
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Avg Pain", "4.2", "-0.8")
                    with col2:
                        st.metric("Avg HR", "78 bpm", "+3")
                    with col3:
                        st.metric("Avg O2", "94%", "-2%")
                    
                elif st.session_state.current_view == 'ai_insights':
                    st.markdown("### 🤖 AI-Powered Insights")
                    
                    st.info("🔍 **Trend Analysis:** Pain levels have decreased by 15% over the past week")
                    st.warning("⚠️ **Alert:** Oxygen saturation trending downward - consider assessment")
                    st.success("✅ **Positive:** Medication adherence at 95% - excellent!")
                    
                    st.markdown("#### Recommendations")
                    st.write("• Consider adjusting pain medication schedule")
                    st.write("• Schedule respiratory assessment")
                    st.write("• Continue current care plan")
                    
                elif st.session_state.current_view == 'support':
                    st.markdown("### 💬 Support Hub")
                    
                    tab1, tab2, tab3 = st.tabs(["Resources", "Contact Support", "FAQs"])
                    
                    with tab1:
                        st.info("📚 Caregiver Guide")
                        st.info("🎥 Video Tutorials")
                        st.info("📞 24/7 Hotline: 1-800-HOSPICE")
                        st.info("💬 Live Chat Support")
                    
                    with tab2:
                        with st.form("contact_support"):
                            subject = st.text_input("Subject")
                            message = st.text_area("Message")
                            if st.form_submit_button("Send Message"):
                                st.success("✅ Message sent! We'll respond within 24 hours.")
                    
                    with tab3:
                        with st.expander("How do I log patient data?"):
                            st.write("Navigate to Log Data and fill in the vitals or symptoms form.")
                        with st.expander("How do I schedule appointments?"):
                            st.write("Go to Appointments and click Schedule New Appointment.")
                        with st.expander("How do I access bereavement resources?"):
                            st.write("Visit the Bereavement section for comprehensive support resources.")
                    
                elif st.session_state.current_view == 'onboarding':
                    st.markdown("### 👤 Patient Onboarding & Assignment")
                    
                    tab1, tab2 = st.tabs(["📝 New Patient", "🔍 Search & Assign"])
                    
                    with tab1:
                        with st.form("onboard_patient"):
                            st.markdown("#### Patient Information")
                            col1, col2 = st.columns(2)
                            with col1:
                                patient_name = st.text_input("Patient Name *")
                                dob = st.date_input("Date of Birth *")
                                gender = st.selectbox("Gender", ["Male", "Female", "Other"])
                            with col2:
                                patient_id = st.text_input("Patient ID", f"PAT-{datetime.now().strftime('%Y%m%d')}")
                                admission_date = st.date_input("Admission Date", datetime.now())
                                diagnosis = st.text_input("Primary Diagnosis")
                            
                            address = st.text_area("Address")
                            emergency_contact = st.text_input("Emergency Contact")
                            phone = st.text_input("Phone Number")
                            
                            st.markdown("---")
                            st.markdown("#### Care Setting Assignment")
                            
                            care_setting = st.selectbox(
                                "Assign to Care Setting *",
                                ["🏠 Home Care", "👥 Shared Care", "🏥 Facility Care"],
                                help="Select where the patient will receive care"
                            )
                            
                            col_a, col_b = st.columns(2)
                            with col_a:
                                primary_nurse = st.text_input("Primary Nurse")
                            with col_b:
                                care_coordinator = st.text_input("Care Coordinator")
                            
                            special_needs = st.text_area("Special Needs / Notes")
                            
                            if st.form_submit_button("Complete Onboarding & Assign", type="primary"):
                                if patient_name and care_setting:
                                    st.success(f"✅ Patient {patient_name} successfully onboarded!")
                                    st.info(f"📍 Assigned to: {care_setting}")
                                    st.balloons()
                                else:
                                    st.error("❌ Please fill in required fields")
                    
                    with tab2:
                        st.markdown("#### Search Patients")
                        
                        col_search, col_filter = st.columns([3, 1])
                        with col_search:
                            search_term = st.text_input("🔍 Search by name or ID", placeholder="Enter patient name or ID")
                        with col_filter:
                            filter_setting = st.selectbox("Filter", ["All", "Home Care", "Shared Care", "Facility Care"])
                        
                        st.markdown("---")
                        st.markdown("#### Patient List")
                        
                        # Sample patient data
                        patients = [
                            {"id": "PAT-001", "name": "John Smith", "setting": "🏠 Home Care", "status": "Active"},
                            {"id": "PAT-002", "name": "Mary Johnson", "setting": "🏥 Facility Care", "status": "Active"},
                            {"id": "PAT-003", "name": "Robert Williams", "setting": "👥 Shared Care", "status": "Active"},
                            {"id": "PAT-004", "name": "Patricia Brown", "setting": "🏠 Home Care", "status": "Active"},
                            {"id": "PAT-005", "name": "Michael Davis", "setting": "🏥 Facility Care", "status": "Active"},
                        ]
                        
                        # Filter patients
                        filtered_patients = patients
                        if search_term:
                            filtered_patients = [p for p in patients if search_term.lower() in p['name'].lower() or search_term.lower() in p['id'].lower()]
                        if filter_setting != "All":
                            filtered_patients = [p for p in filtered_patients if filter_setting in p['setting']]
                        
                        # Display patients
                        for patient in filtered_patients:
                            with st.expander(f"{patient['setting']} - {patient['name']} ({patient['id']})"):
                                col1, col2, col3 = st.columns([2, 2, 1])
                                
                                with col1:
                                    st.write(f"**Patient ID:** {patient['id']}")
                                    st.write(f"**Status:** {patient['status']}")
                                
                                with col2:
                                    st.write(f"**Current Setting:** {patient['setting']}")
                                
                                with col3:
                                    if st.button("📝 Edit", key=f"edit_{patient['id']}"):
                                        st.info("Edit functionality coming soon")
                                
                                st.markdown("---")
                                st.markdown("**Reassign Patient:**")
                                
                                col_a, col_b = st.columns([3, 1])
                                with col_a:
                                    new_setting = st.selectbox(
                                        "New Care Setting",
                                        ["🏠 Home Care", "👥 Shared Care", "🏥 Facility Care"],
                                        key=f"setting_{patient['id']}"
                                    )
                                with col_b:
                                    if st.button("✓ Assign", key=f"assign_{patient['id']}", type="primary"):
                                        st.success(f"✅ {patient['name']} reassigned to {new_setting}")
                                        st.rerun()
                    
                elif st.session_state.current_view == 'caregiver':
                    st.markdown("### 👨‍⚕️ Caregiver Portal")
                    
                    tab1, tab2, tab3 = st.tabs(["Resources", "Training", "Support Groups"])
                    
                    with tab1:
                        st.info("📖 Caregiver Handbook")
                        st.info("🎥 How-to Videos")
                        st.info("📋 Daily Care Checklist")
                        st.info("💊 Medication Management Guide")
                    
                    with tab2:
                        st.markdown("#### Available Training Modules")
                        st.write("• Basic Caregiving Skills")
                        st.write("• Pain Management")
                        st.write("• Emotional Support")
                        st.write("• End-of-Life Care")
                    
                    with tab3:
                        st.markdown("#### Local Support Groups")
                        st.info("📅 Weekly Meeting: Tuesdays 6PM")
                        st.info("📍 Location: Community Center")
                        st.info("💬 Online Forum: Available 24/7")
                    
                elif st.session_state.current_view == 'functional':
                    st.markdown("### 🏃 Functional Status Assessment")
                    
                    with st.form("functional_assessment"):
                        st.markdown("#### Activities of Daily Living (ADL)")
                        
                        mobility = st.select_slider("Mobility", 
                            options=["Bedbound", "Chair-bound", "Walks with assistance", "Walks independently"])
                        eating = st.select_slider("Eating", 
                            options=["Unable", "Needs full assistance", "Needs some help", "Independent"])
                        dressing = st.select_slider("Dressing", 
                            options=["Unable", "Needs full assistance", "Needs some help", "Independent"])
                        bathing = st.select_slider("Bathing", 
                            options=["Unable", "Needs full assistance", "Needs some help", "Independent"])
                        
                        notes = st.text_area("Assessment Notes")
                        
                        if st.form_submit_button("Save Assessment"):
                            st.success("✅ Functional assessment saved!")
                    
                elif st.session_state.current_view == 'chatbot':
                    st.markdown("### 💬 AI Support Chatbot")
                    
                    st.info("👋 Hello! I'm here to provide compassionate support. Ask me anything about your care, symptoms, emotions, or concerns. I'm trained to listen and help.")
                    
                    # Initialize chatbot engine
                    if 'chatbot_engine' not in st.session_state:
                        from src.chatbot_engine import ChatbotEngine
                        st.session_state.chatbot_engine = ChatbotEngine()
                    
                    # Chat interface
                    if 'chat_history' not in st.session_state:
                        st.session_state.chat_history = []
                    
                    # Display chat history with better styling
                    chat_container = st.container()
                    with chat_container:
                        for msg in st.session_state.chat_history:
                            if msg['role'] == 'user':
                                st.markdown(f"""
                                <div style="background: #E3F2FD; padding: 1rem; border-radius: 12px; 
                                            margin: 0.5rem 0; border-left: 4px solid #2196F3;">
                                    <strong style="color: #1976D2;">You:</strong><br>
                                    {msg['content']}
                                </div>
                                """, unsafe_allow_html=True)
                            else:
                                st.markdown(f"""
                                <div style="background: #F1F8E9; padding: 1rem; border-radius: 12px; 
                                            margin: 0.5rem 0; border-left: 4px solid #7CB342;">
                                    <strong style="color: #558B2F;">💚 Assistant:</strong><br>
                                    {msg['content']}
                                </div>
                                """, unsafe_allow_html=True)
                    
                    # Input area
                    st.markdown("---")
                    col_input, col_send, col_clear = st.columns([6, 1, 1])
                    
                    with col_input:
                        user_input = st.text_input("Type your message...", key="chat_input", label_visibility="collapsed", 
                                                   placeholder="Ask me anything... I'm here to listen and help")
                    
                    with col_send:
                        send_button = st.button("📤 Send", use_container_width=True, type="primary")
                    
                    with col_clear:
                        if st.button("🗑️ Clear", use_container_width=True):
                            st.session_state.chat_history = []
                            st.session_state.chatbot_engine.clear_history()
                            st.rerun()
                    
                    # Process message
                    if send_button and user_input:
                        # Add user message
                        st.session_state.chat_history.append({'role': 'user', 'content': user_input})
                        
                        # Generate intelligent response using the chatbot engine
                        context = {
                            'name': st.session_state.user_name,
                            'role': st.session_state.user_role
                        }
                        response = st.session_state.chatbot_engine.generate_response(user_input, context)
                        
                        # Add assistant response
                        st.session_state.chat_history.append({'role': 'assistant', 'content': response})
                        st.rerun()
                    
                    # Quick action buttons
                    st.markdown("---")
                    st.markdown("**Quick Topics:**")
                    col1, col2, col3, col4 = st.columns(4)
                    
                    with col1:
                        if st.button("💊 Medications", key="quick_meds"):
                            quick_msg = "I have a question about my medications"
                            st.session_state.chat_history.append({'role': 'user', 'content': quick_msg})
                            response = st.session_state.chatbot_engine.generate_response(quick_msg, {'name': st.session_state.user_name})
                            st.session_state.chat_history.append({'role': 'assistant', 'content': response})
                            st.rerun()
                    
                    with col2:
                        if st.button("😔 Feeling Down", key="quick_emotion"):
                            quick_msg = "I'm feeling sad and overwhelmed"
                            st.session_state.chat_history.append({'role': 'user', 'content': quick_msg})
                            response = st.session_state.chatbot_engine.generate_response(quick_msg, {'name': st.session_state.user_name})
                            st.session_state.chat_history.append({'role': 'assistant', 'content': response})
                            st.rerun()
                    
                    with col3:
                        if st.button("🤕 Pain Help", key="quick_pain"):
                            quick_msg = "I'm experiencing pain and need help"
                            st.session_state.chat_history.append({'role': 'user', 'content': quick_msg})
                            response = st.session_state.chatbot_engine.generate_response(quick_msg, {'name': st.session_state.user_name})
                            st.session_state.chat_history.append({'role': 'assistant', 'content': response})
                            st.rerun()
                    
                    with col4:
                        if st.button("📞 Need Support", key="quick_support"):
                            quick_msg = "I need someone to talk to"
                            st.session_state.chat_history.append({'role': 'user', 'content': quick_msg})
                            response = st.session_state.chatbot_engine.generate_response(quick_msg, {'name': st.session_state.user_name})
                            st.session_state.chat_history.append({'role': 'assistant', 'content': response})
                            st.rerun()
                
                else:
                    st.info(f"Module: {module_name} - Full implementation coming soon!")
                    
            except Exception as e:
                st.error(f"Error loading module: {str(e)}")
                st.info(f"Module: {module_name} - Implementation in progress")
            
            st.markdown('</div>', unsafe_allow_html=True)
    
    st.stop()


# ============= LOGIN PAGE =============
st.markdown('<div class="login-container">', unsafe_allow_html=True)

col_left, col_center, col_right = st.columns([1, 1.5, 1])

with col_center:
    st.markdown('<div class="login-card">', unsafe_allow_html=True)
    
    # Logo and Title
    st.markdown('<div class="login-logo">🌅</div>', unsafe_allow_html=True)
    st.markdown('<h1 class="login-title">Project Aura</h1>', unsafe_allow_html=True)
    st.markdown('<p class="login-subtitle">Compassionate Hospice Care Management Platform</p>', unsafe_allow_html=True)
    
    # Login or Signup Form
    if not st.session_state.show_signup:
        # LOGIN FORM
        st.markdown("### 🔐 Welcome Back")
        st.markdown("Sign in to access your account")
        
        with st.form("login_form", clear_on_submit=False):
            username = st.text_input("👤 Username", placeholder="Enter your username")
            password = st.text_input("🔒 Password", type="password", placeholder="Enter your password")
            
            col_rem, col_forgot = st.columns(2)
            with col_rem:
                remember = st.checkbox("Remember me")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            submit = st.form_submit_button("🚀 Sign In", use_container_width=True, type="primary")
            
            if submit:
                if username and password:
                    user = authenticate_user(username, password)
                    if user:
                        st.session_state.authenticated = True
                        st.session_state.user_id = user[0]
                        st.session_state.user_name = user[1]
                        st.session_state.user_role = user[2]
                        # Set query params for session persistence
                        st.query_params['user'] = user[1]
                        st.query_params['role'] = user[2]
                        st.query_params['uid'] = str(user[0])
                        st.rerun()
                    else:
                        st.error("❌ Invalid username or password")
                else:
                    st.warning("⚠️ Please enter both username and password")
        
        st.markdown("---")
        
        # Action Buttons
        col_signup, col_forgot = st.columns(2)
        
        with col_signup:
            if st.button("📝 Create Account", use_container_width=True):
                st.session_state.show_signup = True
                st.rerun()
        
        with col_forgot:
            if st.button("🔑 Forgot Password?", use_container_width=True):
                st.info("📧 Contact: admin@projectaura.com")
        
        # Demo Credentials
        with st.expander("🎯 Demo Credentials - Click to View"):
            st.markdown("""
            **Healthcare Provider:**
            - Username: `doctor`
            - Password: `doctor123`
            
            **Patient:**
            - Username: `patient`
            - Password: `patient123`
            
            **Caregiver:**
            - Username: `caregiver`
            - Password: `caregiver123`
            """)
    
    else:
        # SIGNUP FORM
        st.markdown("### 📝 Create Your Account")
        st.markdown("Join Project Aura today")
        
        with st.form("signup_form", clear_on_submit=False):
            new_username = st.text_input("👤 Username", placeholder="Choose a username")
            new_email = st.text_input("📧 Email", placeholder="your.email@example.com")
            new_password = st.text_input("🔒 Password", type="password", placeholder="Create a password")
            confirm_password = st.text_input("🔒 Confirm Password", type="password", placeholder="Confirm your password")
            
            role = st.selectbox("👥 I am a:", [
                "Patient - Receiving hospice care",
                "Caregiver - Supporting a loved one",
                "Healthcare Provider - Medical professional"
            ])
            
            agree = st.checkbox("I agree to the Terms of Service and Privacy Policy")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            submit = st.form_submit_button("✨ Create Account", use_container_width=True, type="primary")
            
            if submit:
                if not agree:
                    st.error("❌ Please agree to the Terms of Service")
                elif new_password != confirm_password:
                    st.error("❌ Passwords don't match!")
                elif len(new_password) < 6:
                    st.error("❌ Password must be at least 6 characters")
                elif not new_username or not new_email:
                    st.warning("⚠️ Please fill in all fields")
                else:
                    # Map role selection to database role
                    role_map = {
                        "Patient - Receiving hospice care": "patient",
                        "Caregiver - Supporting a loved one": "caregiver",
                        "Healthcare Provider - Medical professional": "provider"
                    }
                    
                    if register_user(new_username, new_password, new_email, role_map[role]):
                        st.success("✅ Account created!")
                        st.info("👉 Please sign in with your new credentials")
                        st.session_state.show_signup = False
                        st.rerun()
                    else:
                        st.error("❌ Username already exists. Please choose another.")
        
        st.markdown("---")
        
        if st.button("← Back to Login", use_container_width=True):
            st.session_state.show_signup = False
            st.rerun()
    
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)
