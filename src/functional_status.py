"""Functional Status Module with Database Integration"""
import streamlit as st
from datetime import datetime
from src.db_helpers import (
    create_functional_assessment, get_functional_assessments_by_patient
)
from src.dashboard_components import render_kpi_card

def render():
    """Render functional status assessment"""
    st.title("🏃 Functional Status Assessment")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    tab1, tab2 = st.tabs(["New Assessment", "Assessment History"])
    
    with tab1:
        st.subheader("Conduct Functional Assessment")
        
        with st.form("functional_assessment"):
            st.markdown("### Activities of Daily Living (ADL)")
            
            mobility = st.select_slider("Mobility", options=["Bedbound", "Chair-bound", "Walks with assistance", "Walks independently"])
            self_care = st.select_slider("Self-Care", options=["Total assistance", "Moderate assistance", "Minimal assistance", "Independent"])
            eating = st.select_slider("Eating", options=["Unable", "Needs feeding", "Needs setup", "Independent"])
            
            st.markdown("### Cognitive Function")
            orientation = st.select_slider("Orientation", options=["Disoriented", "Occasionally confused", "Usually oriented", "Fully oriented"])
            communication = st.select_slider("Communication", options=["Unable", "Limited", "Good", "Excellent"])
            
            st.markdown("### Pain & Comfort")
            pain_level = st.slider("Pain Level (0-10)", 0, 10, 0)
            comfort_level = st.select_slider("Comfort Level", options=["Very uncomfortable", "Uncomfortable", "Comfortable", "Very comfortable"])
            
            notes = st.text_area("Additional Notes")
            
            if st.form_submit_button("Save Assessment"):
                assessment_data = {
                    'patient_id': patient_id,
                    'mobility': mobility,
                    'self_care': self_care,
                    'eating': eating,
                    'orientation': orientation,
                    'communication': communication,
                    'pain_level': pain_level,
                    'comfort_level': comfort_level,
                    'notes': notes,
                    'assessment_date': datetime.now().isoformat()
                }
                create_functional_assessment(assessment_data)
                st.success("Assessment saved!")
                st.rerun()
    
    with tab2:
        st.subheader("Assessment History")
        
        assessments = get_functional_assessments_by_patient(patient_id)
        
        if assessments:
            for assessment in assessments:
                with st.expander(f"Assessment - {assessment['assessment_date'][:10]}"):
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.write(f"**Mobility:** {assessment.get('mobility', 'N/A')}")
                        st.write(f"**Self-Care:** {assessment.get('self_care', 'N/A')}")
                        st.write(f"**Eating:** {assessment.get('eating', 'N/A')}")
                    
                    with col2:
                        st.write(f"**Orientation:** {assessment.get('orientation', 'N/A')}")
                        st.write(f"**Communication:** {assessment.get('communication', 'N/A')}")
                        st.write(f"**Pain Level:** {assessment.get('pain_level', 'N/A')}/10")
                    
                    if assessment.get('notes'):
                        st.write(f"**Notes:** {assessment['notes']}")
        else:
            st.info("No assessments recorded yet")
