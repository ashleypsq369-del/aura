"""Professional Login Page - Project Aura"""
import streamlit as st
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from src import db

# Page config
st.set_page_config(
    page_title="Login - Project Aura",
    page_icon="🔐",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Redirect if already logged in
if st.session_state.get('authenticated', False):
    st.switch_page("pages/2_Dashboard.py")

# Professional styling
st.markdown("""
<style>
/* Hide all Streamlit elements */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
[data-testid="stSidebar"] {display: none;}
.stDeployButton {display: none;}

/* Full page background */
.stApp {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Login container */
.login-container {
    background: white;
    padding: 3rem;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 450px;
    margin: 2rem auto;
}

/* Logo */
.logo {
    text-align: center;
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

/* Title */
.title {
    text-align: center;
    color: #2d3748;
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.subtitle {
    text-align: center;
    color: #718096;
    font-size: 1rem;
    margin-bottom: 2rem;
}

/* Input fields */
.stTextInput > div > div > input {
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    transition: all 0.3s;
}

.stTextInput > div > div > input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Buttons */
.stButton > button {
    border-radius: 10px;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s;
    border: none;
}

.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.stButton > button[kind="primary"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

/* Demo credentials box */
.demo-box {
    background: #f7fafc;
    border-left: 4px solid #667eea;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
}

.demo-box h4 {
    color: #2d3748;
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
}

.demo-box p {
    color: #4a5568;
    margin: 0.25rem 0;
    font-size: 0.85rem;
}

/* Footer */
.login-footer {
    text-align: center;
    color: white;
    margin-top: 2rem;
    font-size: 0.9rem;
}
</style>
""", unsafe_allow_html=True)

# Login UI
st.markdown('<div class="login-container">', unsafe_allow_html=True)

# Logo and title
st.markdown("""
<div class="logo">🌅</div>
<div class="title">Project Aura</div>
<div class="subtitle">Hospice Care Management Platform</div>
""", unsafe_allow_html=True)

# Login form
with st.form("login_form", clear_on_submit=False):
    username = st.text_input(
        "Username",
        placeholder="Enter your username",
        key="username_input"
    )
    
    password = st.text_input(
        "Password",
        type="password",
        placeholder="Enter your password",
        key="password_input"
    )
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        login_button = st.form_submit_button(
            "🔐 Sign In",
            use_container_width=True,
            type="primary"
        )
    
    with col2:
        demo_button = st.form_submit_button(
            "👥 Demo Accounts",
            use_container_width=True
        )
    
    # Handle login
    if login_button:
        if username and password:
            user = db.authenticate_user(username, password)
            if user:
                st.session_state.authenticated = True
                st.session_state.user_id = user.id
                st.session_state.username = user.username
                st.session_state.role = user.role
                st.success(f"✅ Welcome back, {user.username}!")
                st.balloons()
                st.rerun()
            else:
                st.error("❌ Invalid username or password")
        else:
            st.warning("⚠️ Please enter both username and password")
    
    # Show demo accounts
    if demo_button:
        st.markdown("""
        <div class="demo-box">
            <h4>🔑 Demo Accounts</h4>
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>Doctor:</strong> doctor / doctor123</p>
            <p><strong>Caregiver:</strong> caregiver / caregiver123</p>
            <p><strong>Family:</strong> family / family123</p>
            <p><strong>Patient:</strong> patient / patient123</p>
        </div>
        """, unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("""
<div class="login-footer">
    <p>🔒 Secure Healthcare Platform | 100% Synthetic Data</p>
    <p style="opacity: 0.8; font-size: 0.8rem;">© 2024 Project Aura. All rights reserved.</p>
</div>
""", unsafe_allow_html=True)
