"""Enhanced Bereavement Bridge with Sentiment Analysis"""
import streamlit as st
from datetime import datetime
import json
from src.db_helpers import (
    create_bereavement_entry, get_bereavement_entries_by_family,
    create_family_contact, get_family_contacts_by_patient
)
from src.sentiment_analyzer import analyze_sentiment, detect_grief_stage
from src.dashboard_components import render_alert_card, render_timeline_item

def render():
    """Render bereavement support interface with sentiment analysis"""
    st.title("🕊️ Bereavement Bridge")
    st.markdown("*Supporting families through grief with AI-powered insights*")
    
    # Get patient/family context
    patient_id = st.session_state.get('current_patient_id', 1)
    
    tab1, tab2, tab3 = st.tabs(["Journal", "Resources", "Family Contacts"])
    
    with tab1:
        st.subheader("Grief Journal")
        st.markdown("Express your feelings. Our AI provides supportive insights.")
        
        # Journal entry form
        with st.form("journal_entry"):
            entry_text = st.text_area("How are you feeling today?", height=150,
                                     placeholder="Share your thoughts, memories, or feelings...")
            
            if st.form_submit_button("Save Entry", type="primary"):
                if entry_text:
                    # Analyze sentiment
                    sentiment_result = analyze_sentiment(entry_text)
                    grief_stage = detect_grief_stage(entry_text)
                    
                    # Save to database
                    entry_data = {
                        'patient_id': patient_id,
                        'family_member_id': st.session_state.get('user_id', 1),
                        'entry_text': entry_text,
                        'sentiment_score': sentiment_result['compound'],
                        'sentiment_label': sentiment_result['label'],
                        'grief_stage': grief_stage,
                        'entry_date': datetime.now().isoformat()
                    }
                    create_bereavement_entry(entry_data)
                    
                    st.success("✅ Entry saved")
                    
                    # Show sentiment analysis
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Sentiment", sentiment_result['label'])
                    with col2:
                        st.metric("Grief Stage", grief_stage)
                    with col3:
                        sentiment_emoji = "😊" if sentiment_result['compound'] > 0.3 else "😐" if sentiment_result['compound'] > -0.3 else "😢"
                        st.metric("Mood", sentiment_emoji)
                    
                    # Provide supportive message
                    if sentiment_result['compound'] < -0.5:
                        render_alert_card(
                            "We're here for you",
                            "Your entry suggests you're going through a difficult time. Consider reaching out to a counselor or support group.",
                            "medium",
                            datetime.now().isoformat()
                        )
                else:
                    st.error("Please write something before saving")
        
        # Display previous entries
        st.markdown("---")
        st.subheader("Previous Entries")
        entries = get_bereavement_entries_by_family(patient_id)
        
        if entries:
            for entry in entries[:5]:  # Show last 5
                with st.expander(f"{entry['entry_date'][:10]} - {entry['sentiment_label']}"):
                    st.write(entry['entry_text'])
                    st.caption(f"Grief Stage: {entry['grief_stage']} | Sentiment: {entry['sentiment_score']:.2f}")
        else:
            st.info("No entries yet. Start journaling to track your grief journey.")
    
    with tab2:
        st.subheader("Grief Support Resources")
        
        # Load resources
        try:
            with open('data/bereavement_resources_extended.json', 'r') as f:
                resources = json.load(f)
            
            # Display by category
            for category in resources.get('categories', []):
                with st.expander(f"📚 {category['name']}"):
                    st.markdown(category.get('description', ''))
                    for resource in category.get('resources', []):
                        st.markdown(f"**{resource['title']}**")
                        st.markdown(resource.get('description', ''))
                        if 'link' in resource:
                            st.markdown(f"[Learn More]({resource['link']})")
                        st.markdown("---")
        except FileNotFoundError:
            st.warning("Resources file not found")
    
    with tab3:
        st.subheader("Family Contacts")
        
        # Add new contact
        with st.expander("➕ Add Family Contact"):
            with st.form("add_contact"):
                name = st.text_input("Name")
                relationship = st.text_input("Relationship")
                phone = st.text_input("Phone")
                email = st.text_input("Email")
                is_primary = st.checkbox("Primary Contact")
                
                if st.form_submit_button("Add Contact"):
                    if name:
                        contact_data = {
                            'patient_id': patient_id,
                            'name': name,
                            'relationship': relationship,
                            'phone': phone,
                            'email': email,
                            'is_primary_contact': 1 if is_primary else 0
                        }
                        create_family_contact(contact_data)
                        st.success("Contact added!")
                        st.rerun()
        
        # Display contacts
        contacts = get_family_contacts_by_patient(patient_id)
        if contacts:
            for contact in contacts:
                primary_badge = "⭐ PRIMARY" if contact.get('is_primary_contact') else ""
                st.markdown(f"**{contact['name']}** {primary_badge}")
                st.write(f"Relationship: {contact.get('relationship', 'N/A')}")
                st.write(f"📞 {contact.get('phone', 'N/A')} | 📧 {contact.get('email', 'N/A')}")
                st.markdown("---")
        else:
            st.info("No family contacts added yet")
