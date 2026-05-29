"""Update clinical modules with database integration"""

print("Updating clinical modules...\n")

# Update Care Plan
care_plan_content = '''"""Care Plan Module with Database Integration"""
import streamlit as st
from datetime import datetime
from src.db_helpers import (
    create_care_plan_goal, get_care_plan_goals_by_patient,
    update_care_plan_goal, create_care_plan_intervention
)
from src.dashboard_components import render_progress_card

def render():
    """Render care plan interface"""
    st.title("📋 Care Plan")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    tab1, tab2, tab3 = st.tabs(["Goals", "Interventions", "Progress"])
    
    with tab1:
        st.subheader("Care Goals")
        
        with st.expander("➕ Add New Goal"):
            with st.form("add_goal"):
                goal_text = st.text_input("Goal Description")
                category = st.selectbox("Category", ["pain_management", "comfort", "mobility", "nutrition", "psychosocial"])
                target_date = st.date_input("Target Date")
                priority = st.selectbox("Priority", ["low", "medium", "high"])
                
                if st.form_submit_button("Add Goal"):
                    if goal_text:
                        goal_data = {
                            'patient_id': patient_id,
                            'goal_text': goal_text,
                            'category': category,
                            'target_date': target_date.isoformat(),
                            'priority': priority,
                            'status': 'active'
                        }
                        create_care_plan_goal(goal_data)
                        st.success("Goal added!")
                        st.rerun()
        
        goals = get_care_plan_goals_by_patient(patient_id, status='active')
        
        if goals:
            for goal in goals:
                priority_emoji = "🔴" if goal['priority'] == 'high' else "🟡" if goal['priority'] == 'medium' else "🟢"
                with st.expander(f"{priority_emoji} {goal['goal_text']}"):
                    st.write(f"**Category:** {goal['category']}")
                    st.write(f"**Target Date:** {goal['target_date']}")
                    st.write(f"**Status:** {goal['status']}")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button("Mark Complete", key=f"comp_{goal['id']}"):
                            update_care_plan_goal(goal['id'], {'status': 'completed'})
                            st.success("Goal completed!")
                            st.rerun()
                    with col2:
                        if st.button("Update Progress", key=f"prog_{goal['id']}"):
                            st.info("Progress tracking coming soon")
        else:
            st.info("No active goals")
    
    with tab2:
        st.subheader("Interventions")
        
        with st.form("add_intervention"):
            intervention_text = st.text_area("Intervention Description")
            frequency = st.text_input("Frequency (e.g., 'twice daily')")
            
            if st.form_submit_button("Add Intervention"):
                if intervention_text:
                    intervention_data = {
                        'patient_id': patient_id,
                        'intervention_text': intervention_text,
                        'frequency': frequency,
                        'status': 'active'
                    }
                    create_care_plan_intervention(intervention_data)
                    st.success("Intervention added!")
                    st.rerun()
    
    with tab3:
        st.subheader("Progress Tracking")
        
        goals = get_care_plan_goals_by_patient(patient_id)
        total = len(goals)
        completed = len([g for g in goals if g['status'] == 'completed'])
        
        if total > 0:
            progress = (completed / total) * 100
            st.progress(progress / 100)
            st.write(f"**{completed} of {total} goals completed ({progress:.1f}%)**")
        else:
            st.info("No goals to track yet")
'''

with open('src/care_plan.py', 'w', encoding='utf-8') as f:
    f.write(care_plan_content)
print("✓ Updated src/care_plan.py")

# Update Functional Status
functional_status_content = '''"""Functional Status Module with Database Integration"""
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
'''

with open('src/functional_status.py', 'w', encoding='utf-8') as f:
    f.write(functional_status_content)
print("✓ Updated src/functional_status.py")

print("\n✅ Clinical modules updated successfully!")
