"""Update remaining modules with database integration"""
import os

print("Updating remaining modules with database integration...\n")

# Update Caregiver Portal
caregiver_content = '''"""Caregiver Portal Module with Database Integration"""
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
'''

with open('src/caregiver.py', 'w', encoding='utf-8') as f:
    f.write(caregiver_content)
print("✓ Updated src/caregiver.py")

# Update Memory Vault
memory_vault_content = '''"""Memory Vault Module with Database Integration"""
import streamlit as st
from datetime import datetime
from src.db_helpers import create_memory, get_memories_by_patient, delete_memory

def render():
    """Render memory vault"""
    st.title("📸 Memory Vault")
    st.markdown("*Preserve precious memories and stories*")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    tab1, tab2 = st.tabs(["Add Memory", "View Memories"])
    
    with tab1:
        st.subheader("Create New Memory")
        
        with st.form("add_memory"):
            title = st.text_input("Memory Title")
            description = st.text_area("Description", height=150)
            memory_date = st.date_input("Date of Memory")
            tags = st.text_input("Tags (comma-separated)")
            
            if st.form_submit_button("Save Memory"):
                if title and description:
                    memory_data = {
                        'patient_id': patient_id,
                        'title': title,
                        'description': description,
                        'memory_date': memory_date.isoformat(),
                        'tags': tags,
                        'created_at': datetime.now().isoformat()
                    }
                    create_memory(memory_data)
                    st.success("Memory saved!")
                    st.rerun()
    
    with tab2:
        st.subheader("Memory Collection")
        
        memories = get_memories_by_patient(patient_id)
        
        if memories:
            for memory in memories:
                with st.expander(f"📖 {memory['title']} - {memory['memory_date']}"):
                    st.write(memory['description'])
                    if memory.get('tags'):
                        st.caption(f"Tags: {memory['tags']}")
                    
                    if st.button(f"Delete", key=f"del_{memory['id']}"):
                        delete_memory(memory['id'])
                        st.success("Memory deleted")
                        st.rerun()
        else:
            st.info("No memories yet. Start preserving precious moments!")
'''

with open('src/memory_vault.py', 'w', encoding='utf-8') as f:
    f.write(memory_vault_content)
print("✓ Updated src/memory_vault.py")

# Update Journal
journal_content = '''"""Journal Module with Database Integration"""
import streamlit as st
from datetime import datetime
from src.db_helpers import create_journal_entry, get_journal_entries_by_patient
from src.sentiment_analyzer import analyze_sentiment

def render():
    """Render journal interface"""
    st.title("📔 Personal Journal")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    tab1, tab2 = st.tabs(["New Entry", "Past Entries"])
    
    with tab1:
        st.subheader("Write New Entry")
        
        with st.form("journal_entry"):
            entry_text = st.text_area("What's on your mind?", height=200)
            mood = st.select_slider("Mood", options=["😢", "😐", "🙂", "😊", "😄"])
            
            if st.form_submit_button("Save Entry"):
                if entry_text:
                    sentiment = analyze_sentiment(entry_text)
                    
                    entry_data = {
                        'patient_id': patient_id,
                        'entry_text': entry_text,
                        'mood': mood,
                        'sentiment_score': sentiment['compound'],
                        'entry_date': datetime.now().isoformat()
                    }
                    create_journal_entry(entry_data)
                    st.success("Entry saved!")
                    st.rerun()
    
    with tab2:
        st.subheader("Journal History")
        
        entries = get_journal_entries_by_patient(patient_id)
        
        if entries:
            for entry in entries:
                with st.expander(f"{entry['entry_date'][:10]} - {entry.get('mood', '📝')}"):
                    st.write(entry['entry_text'])
                    if 'sentiment_score' in entry:
                        st.caption(f"Sentiment: {entry['sentiment_score']:.2f}")
        else:
            st.info("No journal entries yet")
'''

with open('src/journal.py', 'w', encoding='utf-8') as f:
    f.write(journal_content)
print("✓ Updated src/journal.py")

print("\n✅ All remaining modules updated with database integration!")
