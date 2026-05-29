"""Login Module"""
import streamlit as st
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from src import db

def render():
    st.markdown('<style>[data-testid="stSidebar"] {display: none;}</style>', unsafe_allow_html=True)
    st.markdown("""<style>.main {background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe) !important; background-size: 400% 400% !important; animation: gradientShift 15s ease infinite !important;} @keyframes gradientShift {0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;}}</style>""", unsafe_allow_html=True)
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("<div style='text-align: center; padding: 2rem 0;'><div style='font-size: 5rem; margin-bottom: 1rem;'>🌅</div><h1 style='color: white; font-size: 3rem; margin: 0;'>Project Aura</h1><p style='color: rgba(255,255,255,0.9); font-size: 1.2rem; margin-top: 1rem;'>Compassionate Hospice Care Platform</p></div>", unsafe_allow_html=True)
        st.markdown("<div style='background: rgba(255,255,255,0.95); border-radius: 30px; padding: 3rem; box-shadow: 0 30px 60px rgba(0,0,0,0.3); margin: 2rem 0;'>", unsafe_allow_html=True)
        st.markdown("<h2 style='text-align: center; color: #2c5282; margin-bottom: 2rem;'>Welcome Back</h2>", unsafe_allow_html=True)
        with st.expander("👥 Demo Credentials", expanded=True):
            st.markdown("**Admin:** `admin` / `admin123`\n\n**Patient:** `patient` / `patient123`\n\n**Caregiver:** `caregiver` / `caregiver123`\n\n**Clinician:** `clinician` / `clinician123`\n\n**Family:** `family` / `family123`")
        with st.form("login_form"):
            username = st.text_input("👤 Username", placeholder="Enter your username")
            password = st.text_input("🔒 Password", type="password", placeholder="Enter your password")
            submit = st.form_submit_button("🚀 Login", use_container_width=True)
        if submit:
            if username and password:
                user = db.authenticate_user(username, password)
                if user:
                    st.session_state.authenticated = True
                    st.session_state.user_id = user.id
                    st.session_state.username = user.username
                    st.session_state.role = user.role
                    st.session_state.current_page = 'dashboard'
                    st.success(f"✅ Welcome, {user.username}!")
                    st.balloons()
                    st.rerun()
                else:
                    st.error("❌ Invalid username or password")
            else:
                st.warning("⚠️ Please enter both username and password")
        st.markdown("</div>", unsafe_allow_html=True)
        st.markdown("<div style='text-align: center; color: white; margin-top: 2rem; opacity: 0.8;'><p>🔒 100% Synthetic Data | Privacy-Preserving Prototype</p></div>", unsafe_allow_html=True)
