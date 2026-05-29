"""
Phase 3: Connect Forms & Integrate Resources
This script updates all modules to use database helpers and integrates advanced features.
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def update_alerts_module():
    """Update alerts module with database integration"""
    content = '''"""Alert Management Module with Database Integration"""
import streamlit as st
from datetime import datetime
from src.db_helpers import (
    create_alert, get_alerts_by_patient, update_alert, delete_alert,
    get_alert_by_id
)
from src.dashboard_components import render_alert_card, render_kpi_card

def render():
    """Render alerts management interface with database"""
    st.title("🔔 Alert Management")
    
    # Get patient_id from session
    patient_id = st.session_state.get('current_patient_id', 1)
    
    # Tabs for different views
    tab1, tab2, tab3 = st.tabs(["Active Alerts", "Create Alert", "Alert History"])
    
    with tab1:
        st.subheader("Active Alerts")
        alerts = get_alerts_by_patient(patient_id, status='active')
        
        if alerts:
            for alert in alerts:
                render_alert_card(
                    title=alert['title'],
                    message=alert['message'],
                    severity=alert['severity'],
                    timestamp=alert['created_at']
                )
                
                col1, col2 = st.columns([1, 1])
                with col1:
                    if st.button(f"Resolve #{alert['id']}", key=f"resolve_{alert['id']}"):
                        update_alert(alert['id'], {'status': 'resolved'})
                        st.success("Alert resolved!")
                        st.rerun()
                with col2:
                    if st.button(f"Delete #{alert['id']}", key=f"delete_{alert['id']}"):
                        delete_alert(alert['id'])
                        st.success("Alert deleted!")
                        st.rerun()
        else:
            st.info("No active alerts")
    
    with tab2:
        st.subheader("Create New Alert")
        with st.form("create_alert_form"):
            title = st.text_input("Alert Title")
            message = st.text_area("Alert Message")
            severity = st.selectbox("Severity", ["low", "medium", "high", "critical"])
            alert_type = st.selectbox("Type", ["medication", "vital_sign", "appointment", "general"])
            
            if st.form_submit_button("Create Alert"):
                if title and message:
                    alert_data = {
                        'patient_id': patient_id,
                        'title': title,
                        'message': message,
                        'severity': severity,
                        'alert_type': alert_type,
                        'status': 'active'
                    }
                    create_alert(alert_data)
                    st.success("Alert created successfully!")
                    st.rerun()
                else:
                    st.error("Please fill in all required fields")
    
    with tab3:
        st.subheader("Alert History")
        all_alerts = get_alerts_by_patient(patient_id)
        
        if all_alerts:
            for alert in all_alerts:
                with st.expander(f"{alert['title']} - {alert['status']}"):
                    st.write(f"**Message:** {alert['message']}")
                    st.write(f"**Severity:** {alert['severity']}")
                    st.write(f"**Type:** {alert['alert_type']}")
                    st.write(f"**Created:** {alert['created_at']}")
        else:
            st.info("No alert history")
'''
    
    with open('src/alerts.py', 'w') as f:
        f.write(content)
    print("✓ Updated src/alerts.py with database integration")

def update_medication_module():
    """Update medication module with database integration"""
    content = '''"""Medication Management Module with Database Integration"""
import streamlit as st
from datetime import datetime, time
from src.db_helpers import (
    create_medication, get_medications_by_patient, update_medication,
    delete_medication, create_medication_schedule
)
from src.dashboard_components import render_kpi_card

def render():
    """Render medication management interface"""
    st.title("💊 Medication Management")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    tab1, tab2, tab3 = st.tabs(["Current Medications", "Add Medication", "Schedule"])
    
    with tab1:
        st.subheader("Current Medications")
        medications = get_medications_by_patient(patient_id, status='active')
        
        if medications:
            for med in medications:
                with st.expander(f"{med['name']} - {med['dosage']}"):
                    st.write(f"**Route:** {med['route']}")
                    st.write(f"**Frequency:** {med['frequency']}")
                    st.write(f"**Instructions:** {med.get('instructions', 'N/A')}")
                    st.write(f"**Prescriber:** {med.get('prescriber', 'N/A')}")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        if st.button(f"Discontinue", key=f"disc_{med['id']}"):
                            update_medication(med['id'], {'status': 'discontinued'})
                            st.success("Medication discontinued")
                            st.rerun()
                    with col2:
                        if st.button(f"Delete", key=f"del_{med['id']}"):
                            delete_medication(med['id'])
                            st.success("Medication deleted")
                            st.rerun()
        else:
            st.info("No active medications")
    
    with tab2:
        st.subheader("Add New Medication")
        with st.form("add_medication_form"):
            name = st.text_input("Medication Name")
            dosage = st.text_input("Dosage (e.g., 10mg)")
            route = st.selectbox("Route", ["oral", "IV", "IM", "subcutaneous", "topical", "inhalation"])
            frequency = st.text_input("Frequency (e.g., twice daily)")
            instructions = st.text_area("Special Instructions")
            prescriber = st.text_input("Prescriber Name")
            
            if st.form_submit_button("Add Medication"):
                if name and dosage and frequency:
                    med_data = {
                        'patient_id': patient_id,
                        'name': name,
                        'dosage': dosage,
                        'route': route,
                        'frequency': frequency,
                        'instructions': instructions,
                        'prescriber': prescriber,
                        'status': 'active'
                    }
                    create_medication(med_data)
                    st.success("Medication added successfully!")
                    st.rerun()
                else:
                    st.error("Please fill in required fields")
    
    with tab3:
        st.subheader("Medication Schedule")
        st.info("Schedule administration times for medications")
        
        medications = get_medications_by_patient(patient_id, status='active')
        if medications:
            with st.form("schedule_form"):
                med_id = st.selectbox("Select Medication", 
                                     options=[m['id'] for m in medications],
                                     format_func=lambda x: next(m['name'] for m in medications if m['id'] == x))
                scheduled_time = st.time_input("Administration Time")
                
                if st.form_submit_button("Add to Schedule"):
                    schedule_data = {
                        'medication_id': med_id,
                        'scheduled_time': scheduled_time.strftime('%H:%M:%S'),
                        'status': 'pending'
                    }
                    create_medication_schedule(schedule_data)
                    st.success("Added to schedule!")
                    st.rerun()
'''
    
    with open('src/medication.py', 'w') as f:
        f.write(content)
    print("✓ Updated src/medication.py with database integration")

if __name__ == "__main__":
    print("Starting Phase 3 Integration...")
    print("\n1. Updating module files with database integration...")
    update_alerts_module()
    update_medication_module()
    print("\n✓ Phase 3 Integration Complete!")
