"""Caregiver Portal Module with Database Integration"""
import streamlit as st
from datetime import datetime
from src.db_helpers import (
    create_caregiver_note, get_caregiver_notes_by_patient,
    get_medications_by_patient, get_appointments_by_patient
)
from src.dashboard_components import render_kpi_card, render_timeline_item

def render():
    """Render caregiver portal"""
    st.title("👨‍⚕️ Caregiver Portal")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    caregiver_id = st.session_state.get('user_id', 1)
    
    tab1, tab2, tab3 = st.tabs(["Daily Log", "Patient Overview", "Resources"])
    
    with tab1:
        st.subheader("Daily Care Log")
        
        with st.form("care_log"):
            log_type = st.selectbox("Log Type", ["vital_signs", "medication_admin", "activity", "observation"])
            notes = st.text_area("Notes", height=150)
            
            if st.form_submit_button("Save Log"):
                if notes:
                    log_data = {
                        'patient_id': patient_id,
                        'caregiver_id': caregiver_id,
                        'note_type': log_type,
                        'note_text': notes,
                        'created_at': datetime.now().isoformat()
                    }
                    create_caregiver_note(log_data)
                    st.success("Log saved!")
                    st.rerun()
        
        st.markdown("---")
        st.subheader("Recent Logs")
        logs = get_caregiver_notes_by_patient(patient_id)
        
        for log in logs[:10]:
            render_timeline_item(
                "📝",
                log['note_type'].replace('_', ' ').title(),
                log['note_text'],
                log['created_at']
            )
    
    with tab2:
        st.subheader("Patient Overview")
        
        col1, col2 = st.columns(2)
        with col1:
            medications = get_medications_by_patient(patient_id, status='active')
            render_kpi_card("Active Medications", len(medications), "💊", "normal")
        
        with col2:
            appointments = get_appointments_by_patient(patient_id, status='scheduled')
            render_kpi_card("Upcoming Appointments", len(appointments), "📅", "normal")
    
    with tab3:
        st.subheader("Caregiver Resources")
        st.info("Access training materials, best practices, and support resources")
