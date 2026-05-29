"""Care Plan Module with Database Integration"""
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
