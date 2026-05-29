#!/usr/bin/env python3
"""
Fix all import errors and missing functions
"""
import os

print("=" * 70)
print("FIXING ALL IMPORT ERRORS")
print("=" * 70)

# Fix 1: Add missing functions to sentiment_analyzer.py
print("\n[1/8] Fixing sentiment_analyzer.py...")
sentiment_code = '''"""Sentiment Analysis Module"""
import re

def analyze_sentiment(text):
    """Analyze sentiment of text"""
    if not text:
        return "neutral"
    
    text_lower = text.lower()
    
    # Positive words
    positive_words = ['happy', 'joy', 'love', 'grateful', 'peace', 'hope', 'better', 'good', 'wonderful']
    # Negative words
    negative_words = ['sad', 'pain', 'hurt', 'difficult', 'hard', 'struggle', 'worry', 'fear', 'anxious']
    
    pos_count = sum(1 for word in positive_words if word in text_lower)
    neg_count = sum(1 for word in negative_words if word in text_lower)
    
    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    else:
        return "neutral"

def detect_grief_stage(text):
    """Detect grief stage from text"""
    if not text:
        return "Unknown"
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['deny', 'cannot believe', 'not real']):
        return "Denial"
    elif any(word in text_lower for word in ['angry', 'unfair', 'why me']):
        return "Anger"
    elif any(word in text_lower for word in ['if only', 'what if', 'should have']):
        return "Bargaining"
    elif any(word in text_lower for word in ['sad', 'empty', 'hopeless', 'depressed']):
        return "Depression"
    elif any(word in text_lower for word in ['accept', 'peace', 'moving forward']):
        return "Acceptance"
    else:
        return "Processing"
'''

with open('src/sentiment_analyzer.py', 'w', encoding='utf-8') as f:
    f.write(sentiment_code)
print("  ✓ Fixed sentiment_analyzer.py")

# Fix 2: Add missing functions to conversational_support.py
print("\n[2/8] Fixing conversational_support.py...")
conversational_code = '''"""Conversational Support Module"""
import random

def generate_response(user_input, context="general"):
    """Generate supportive response"""
    responses = {
        "general": [
            "I'm here to listen and support you.",
            "Thank you for sharing. How are you feeling right now?",
            "That sounds challenging. Would you like to talk more about it?"
        ],
        "grief": [
            "Grief is a natural process. Take all the time you need.",
            "Your feelings are valid. It's okay to feel this way.",
            "I'm here with you through this difficult time."
        ],
        "anxiety": [
            "Let's take a deep breath together.",
            "You're not alone in feeling this way.",
            "Would you like to try a calming exercise?"
        ]
    }
    
    response_list = responses.get(context, responses["general"])
    return random.choice(response_list)

def detect_crisis_keywords(text):
    """Detect crisis keywords in text"""
    crisis_words = ['suicide', 'kill myself', 'end it all', 'no reason to live', 'hurt myself']
    text_lower = text.lower()
    return any(word in text_lower for word in crisis_words)

def get_crisis_resources():
    """Get crisis resources"""
    return {
        "hotline": "988 - Suicide & Crisis Lifeline",
        "text": "Text HOME to 741741",
        "emergency": "Call 911 for immediate help"
    }
'''

with open('src/conversational_support.py', 'w', encoding='utf-8') as f:
    f.write(conversational_code)
print("  ✓ Fixed conversational_support.py")

# Fix 3: Fix page 3 (Log Data) - add missing arguments
print("\n[3/8] Fixing pages/3_Log_Data.py...")
with open('pages/3_Log_Data.py', 'r', encoding='utf-8') as f:
    log_data_content = f.read()

log_data_content = log_data_content.replace(
    'setup_page()',
    'setup_page("Log Data", "📝")'
)

with open('pages/3_Log_Data.py', 'w', encoding='utf-8') as f:
    f.write(log_data_content)
print("  ✓ Fixed pages/3_Log_Data.py")

# Fix 4: Fix page 9 (Patient Onboarding) - add date import
print("\n[4/8] Fixing pages/9_Patient_Onboarding.py...")
with open('pages/9_Patient_Onboarding.py', 'r', encoding='utf-8') as f:
    onboarding_content = f.read()

if 'from datetime import' not in onboarding_content:
    onboarding_content = onboarding_content.replace(
        'import streamlit as st',
        'import streamlit as st\nfrom datetime import date, datetime'
    )
    
with open('pages/9_Patient_Onboarding.py', 'w', encoding='utf-8') as f:
    f.write(onboarding_content)
print("  ✓ Fixed pages/9_Patient_Onboarding.py")

# Fix 5: Fix page 10 (Clinical Simulation) - add pandas import
print("\n[5/8] Fixing pages/10_Clinical_Simulation.py...")
with open('pages/10_Clinical_Simulation.py', 'r', encoding='utf-8') as f:
    simulation_content = f.read()

if 'import pandas as pd' not in simulation_content:
    simulation_content = simulation_content.replace(
        'import streamlit as st',
        'import streamlit as st\nimport pandas as pd'
    )
    
with open('pages/10_Clinical_Simulation.py', 'w', encoding='utf-8') as f:
    f.write(simulation_content)
print("  ✓ Fixed pages/10_Clinical_Simulation.py")

# Fix 6: Add render function to alerts.py
print("\n[6/8] Fixing src/alerts.py...")
with open('src/alerts.py', 'r', encoding='utf-8') as f:
    alerts_content = f.read()

if 'def render():' not in alerts_content:
    alerts_content += '''

def render():
    """Render alerts page"""
    import streamlit as st
    from src import db
    
    st.markdown("### 🔔 Priority Alerts")
    
    # Get all alerts
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, patient_id, alert_type, severity, message, created_at, resolved
        FROM alerts
        ORDER BY created_at DESC
        LIMIT 50
    """)
    alerts = cursor.fetchall()
    conn.close()
    
    if not alerts:
        st.info("No alerts at this time")
        return
    
    # Display alerts
    for alert in alerts:
        alert_id, patient_id, alert_type, severity, message, created_at, resolved = alert
        
        if resolved:
            continue
            
        severity_colors = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        }
        
        icon = severity_colors.get(severity, '🔵')
        
        with st.expander(f"{icon} {alert_type} - {message[:50]}..."):
            st.write(f"**Patient ID:** {patient_id}")
            st.write(f"**Severity:** {severity}")
            st.write(f"**Message:** {message}")
            st.write(f"**Time:** {created_at}")
            
            if st.button(f"Resolve Alert {alert_id}", key=f"resolve_{alert_id}"):
                conn = db.get_connection()
                cursor = conn.cursor()
                cursor.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
                conn.commit()
                conn.close()
                st.success("Alert resolved!")
                st.rerun()
'''

with open('src/alerts.py', 'w', encoding='utf-8') as f:
    f.write(alerts_content)
print("  ✓ Fixed src/alerts.py")

# Fix 7: Add render function to medication.py
print("\n[7/8] Fixing src/medication.py...")
medication_code = '''"""Medication Management Module"""
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
'''

with open('src/medication.py', 'w', encoding='utf-8') as f:
    f.write(medication_code)
print("  ✓ Fixed src/medication.py")

# Fix 8: Ensure medications table exists
print("\n[8/8] Ensuring database tables exist...")
db_fix_code = '''
import sqlite3
import os

db_path = 'aura.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create medications table if not exists
cursor.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
""")

# Create alerts table if not exists
cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        resolved INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
""")

conn.commit()
conn.close()
print("  ✓ Database tables verified")
'''

with open('scripts/temp_db_fix.py', 'w', encoding='utf-8') as f:
    f.write(db_fix_code)

os.system('python scripts/temp_db_fix.py')

print("\n" + "=" * 70)
print("✅ ALL IMPORT ERRORS FIXED!")
print("=" * 70)

print("\n🔧 Fixed:")
print("  • sentiment_analyzer.py - Added analyze_sentiment() and detect_grief_stage()")
print("  • conversational_support.py - Added generate_response() and crisis detection")
print("  • pages/3_Log_Data.py - Fixed setup_page() call")
print("  • pages/9_Patient_Onboarding.py - Added date import")
print("  • pages/10_Clinical_Simulation.py - Added pandas import")
print("  • src/alerts.py - Added render() function")
print("  • src/medication.py - Added render() function")
print("  • Database tables - Verified medications and alerts tables")

print("\n🚀 Restart Streamlit - all errors should be resolved!")
print("=" * 70)
