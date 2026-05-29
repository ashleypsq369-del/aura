"""
Navigation Module - Role-Based Sidebar Navigation
"""

import streamlit as st
from src.styles import hide_streamlit_elements, apply_global_styles


def render_sidebar():
    """Render role-based sidebar navigation"""
    
    # Apply styles to hide default navigation
    hide_streamlit_elements()
    apply_global_styles()
    
    if not st.session_state.get('authenticated', False):
        return
    
    with st.sidebar:
        # User info
        st.markdown(f"""
        <div style='background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 12px; margin-bottom: 2rem;'>
            <div style='font-size: 0.85rem; opacity: 0.8; margin-bottom: 0.5rem;'>Logged in as</div>
            <div style='font-size: 1.1rem; font-weight: 600;'>{st.session_state.username}</div>
            <div style='font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem;'>
                {st.session_state.role.title()}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### 📋 Navigation")
        
        # Role-based navigation
        user_role = st.session_state.role.lower()
        
        # Define pages by role
        role_pages = {
            "admin": [
                ("🏠 Dashboard", "2_Dashboard"),
                ("📝 Log Data", "3_Log_Data"),
                ("📊 View Trends", "4_View_Trends"),
                ("🤖 AI Insights", "5_AI_Insights"),
                ("🔔 Alerts", "6_Alerts"),
                ("💊 Medications", "11_Medication_Management"),
                ("📅 Appointments", "12_Appointment_Scheduling"),
                ("👥 Caregiver Portal", "13_Caregiver_Portal"),
                ("📋 Care Plan", "16_Care_Plan"),
                ("📊 Functional Status", "17_Functional_Status"),
                ("🏥 Onboarding", "9_Patient_Onboarding"),
                ("🎬 Simulation", "10_Clinical_Simulation")
            ],
            "clinician": [
                ("🏠 Dashboard", "2_Dashboard"),
                ("📝 Log Data", "3_Log_Data"),
                ("📊 View Trends", "4_View_Trends"),
                ("🤖 AI Insights", "5_AI_Insights"),
                ("🔔 Alerts", "6_Alerts"),
                ("💊 Medications", "11_Medication_Management"),
                ("📅 Appointments", "12_Appointment_Scheduling"),
                ("📋 Care Plan", "16_Care_Plan"),
                ("📊 Functional Status", "17_Functional_Status"),
                ("🏥 Onboarding", "9_Patient_Onboarding")
            ],
            "caregiver": [
                ("🏠 Dashboard", "2_Dashboard"),
                ("📝 Log Data", "3_Log_Data"),
                ("📊 View Trends", "4_View_Trends"),
                ("🔔 Alerts", "6_Alerts"),
                ("💬 Support Hub", "7_Support_Hub"),
                ("👥 Caregiver Portal", "13_Caregiver_Portal"),
                ("📅 Appointments", "12_Appointment_Scheduling"),
                ("💊 Medications", "11_Medication_Management"),
                ("📸 Memories", "14_Memory_Vault"),
                ("📔 Journal", "15_Journal")
            ],
            "patient": [
                ("🏠 Dashboard", "2_Dashboard"),
                ("📝 Log Data", "3_Log_Data"),
                ("📊 View Trends", "4_View_Trends"),
                ("💬 Support Hub", "7_Support_Hub"),
                ("📸 Memories", "14_Memory_Vault"),
                ("📔 Journal", "15_Journal"),
                ("🕊️ Bereavement", "8_Bereavement_Bridge")
            ],
            "family": [
                ("🏠 Dashboard", "2_Dashboard"),
                ("📊 View Trends", "4_View_Trends"),
                ("💬 Support Hub", "7_Support_Hub"),
                ("📸 Memories", "14_Memory_Vault"),
                ("📔 Journal", "15_Journal"),
                ("🕊️ Bereavement", "8_Bereavement_Bridge"),
                ("👥 Caregiver Portal", "13_Caregiver_Portal")
            ]
        }
        
        # Get pages for current role (default to patient if role not found)
        pages = role_pages.get(user_role, role_pages["patient"])
        
        # Display role-specific navigation
        st.markdown(f"<small style='opacity: 0.7;'>Viewing as: {st.session_state.role.title()}</small>", unsafe_allow_html=True)
        st.markdown("---")
        
        for label, page_file in pages:
            if st.button(label, key=f"nav_{page_file}", use_container_width=True):
                st.switch_page(f"pages/{page_file}.py")
        
        st.markdown("---")
        
        # Logout button
        if st.button("🚪 Logout", use_container_width=True, type="primary"):
            st.session_state.authenticated = False
            st.session_state.user_id = None
            st.session_state.username = None
            st.session_state.role = None
            st.switch_page("pages/1_Login.py")
        
        # Footer
        st.markdown("---")
        st.markdown("""
        <div style='text-align: center; font-size: 0.75rem; opacity: 0.7; padding: 1rem 0;'>
            <div>🔒 Synthetic Data Only</div>
            <div style='margin-top: 0.5rem;'>© 2026 Project Aura</div>
        </div>
        """, unsafe_allow_html=True)
