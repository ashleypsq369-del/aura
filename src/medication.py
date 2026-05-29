"""Medication Management Module"""
import streamlit as st
from src import db
from datetime import datetime, timedelta

def render():
    """Render medication management page"""
    
    st.markdown("### 💊 Medication Management")
    
    # Get patients
    patients = db.get_all_patients()
    
    if not patients:
        st.warning("No patients found")
        return
    
    # Patient selection
    patient_options = {f"{p.patient_code} (ID: {p.id})": p.id for p in patients}
    selected_patient = st.selectbox("Select Patient", options=list(patient_options.keys()))
    patient_id = patient_options[selected_patient]
    
    # Tabs
    tab1, tab2 = st.tabs(["📋 Current Medications", "➕ Add Medication"])
    
    with tab1:
        # Display current medications
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, medication_name, dosage, frequency, start_date, end_date, notes
            FROM medications
            WHERE patient_id = ?
            ORDER BY start_date DESC
        """, (patient_id,))
        meds = cursor.fetchall()
        conn.close()
        
        if not meds:
            st.info("No medications recorded")
        else:
            for med in meds:
                med_id, name, dosage, frequency, start_date, end_date, notes = med
                with st.expander(f"💊 {name} - {dosage}"):
                    st.write(f"**Frequency:** {frequency}")
                    st.write(f"**Start Date:** {start_date}")
                    if end_date:
                        st.write(f"**End Date:** {end_date}")
                    if notes:
                        st.write(f"**Notes:** {notes}")
    
    with tab2:
        # Add new medication
        with st.form("add_medication"):
            med_name = st.text_input("Medication Name *")
            dosage = st.text_input("Dosage *", placeholder="e.g., 10mg")
            frequency = st.selectbox("Frequency *", [
                "Once daily", "Twice daily", "Three times daily",
                "Four times daily", "As needed", "Every 4 hours",
                "Every 6 hours", "Every 8 hours", "Every 12 hours"
            ])
            
            col1, col2 = st.columns(2)
            with col1:
                start_date = st.date_input("Start Date *")
            with col2:
                end_date = st.date_input("End Date (optional)", value=None)
            
            notes = st.text_area("Notes (optional)")
            
            submitted = st.form_submit_button("Add Medication")
            
            if submitted:
                if med_name and dosage:
                    conn = db.get_connection()
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO medications 
                        (patient_id, medication_name, dosage, frequency, start_date, end_date, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (patient_id, med_name, dosage, frequency, str(start_date), 
                          str(end_date) if end_date else None, notes))
                    conn.commit()
                    conn.close()
                    st.success(f"✅ Added {med_name}")
                    st.rerun()
                else:
                    st.error("Please fill in required fields")
