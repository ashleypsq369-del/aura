"""Journal Module with Database Integration"""
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
