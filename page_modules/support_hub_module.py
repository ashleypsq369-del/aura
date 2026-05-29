"""Enhanced Support Hub with Conversational AI"""
import streamlit as st
from datetime import datetime
import json
from src.conversational_support import (
    generate_response, detect_crisis, get_conversation_history,
    save_conversation
)
from src.db_helpers import get_family_contacts_by_patient
from src.dashboard_components import render_alert_card

def render():
    """Render support hub with AI conversation"""
    st.title("💬 Support Hub")
    st.markdown("*24/7 AI-powered support and resources*")
    
    patient_id = st.session_state.get('current_patient_id', 1)
    
    # Initialize conversation history
    if 'conversation_history' not in st.session_state:
        st.session_state.conversation_history = []
    
    tab1, tab2, tab3 = st.tabs(["AI Support Chat", "Crisis Resources", "Contact Team"])
    
    with tab1:
        st.subheader("Talk to Our AI Support Assistant")
        st.caption("Share your concerns, ask questions, or just talk. We're here to listen.")
        
        # Display conversation history
        chat_container = st.container()
        with chat_container:
            for msg in st.session_state.conversation_history:
                if msg['role'] == 'user':
                    st.markdown(f"**You:** {msg['content']}")
                else:
                    st.markdown(f"**Assistant:** {msg['content']}")
                st.markdown("---")
        
        # Chat input
        user_input = st.text_area("Your message:", key="chat_input", height=100)
        
        col1, col2 = st.columns([1, 4])
        with col1:
            if st.button("Send", type="primary"):
                if user_input:
                    # Check for crisis
                    is_crisis, crisis_type = detect_crisis(user_input)
                    
                    if is_crisis:
                        render_alert_card(
                            "🚨 Crisis Detected",
                            f"We detected {crisis_type} language. Please reach out to a crisis counselor immediately.",
                            "critical",
                            datetime.now().isoformat()
                        )
                        st.markdown("**Crisis Hotline: 988 (24/7)**")
                    
                    # Add user message
                    st.session_state.conversation_history.append({
                        'role': 'user',
                        'content': user_input,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Generate AI response
                    response = generate_response(
                        user_input,
                        st.session_state.conversation_history
                    )
                    
                    # Add assistant response
                    st.session_state.conversation_history.append({
                        'role': 'assistant',
                        'content': response,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Save conversation
                    save_conversation(
                        patient_id,
                        st.session_state.conversation_history
                    )
                    
                    st.rerun()
        
        with col2:
            if st.button("Clear Chat"):
                st.session_state.conversation_history = []
                st.rerun()
    
    with tab2:
        st.subheader("🆘 Crisis Resources")
        
        st.error("**If you're in immediate danger, call 911**")
        
        st.markdown("### 24/7 Crisis Hotlines")
        crisis_resources = [
            {"name": "988 Suicide & Crisis Lifeline", "number": "988", "description": "24/7 support for people in crisis"},
            {"name": "Crisis Text Line", "number": "Text HOME to 741741", "description": "Free 24/7 text support"},
            {"name": "SAMHSA National Helpline", "number": "1-800-662-4357", "description": "Mental health and substance abuse"},
            {"name": "Veterans Crisis Line", "number": "988 then Press 1", "description": "Support for veterans"}
        ]
        
        for resource in crisis_resources:
            with st.expander(f"📞 {resource['name']}"):
                st.markdown(f"**Call: {resource['number']}**")
                st.write(resource['description'])
    
    with tab3:
        st.subheader("👥 Contact Your Care Team")
        
        contacts = get_family_contacts_by_patient(patient_id)
        
        if contacts:
            for contact in contacts:
                primary = "⭐ " if contact.get('is_primary_contact') else ""
                st.markdown(f"### {primary}{contact['name']}")
                st.write(f"**Relationship:** {contact.get('relationship', 'N/A')}")
                
                col1, col2 = st.columns(2)
                with col1:
                    if contact.get('phone'):
                        st.markdown(f"📞 **Phone:** {contact['phone']}")
                with col2:
                    if contact.get('email'):
                        st.markdown(f"📧 **Email:** {contact['email']}")
                
                st.markdown("---")
        else:
            st.info("No care team contacts available. Please add contacts in the Bereavement Bridge.")
        
        # Quick message form
        st.subheader("Send Quick Message")
        with st.form("quick_message"):
            recipient = st.selectbox("To:", [c['name'] for c in contacts] if contacts else ["No contacts"])
            message = st.text_area("Message:")
            urgent = st.checkbox("Mark as urgent")
            
            if st.form_submit_button("Send Message"):
                if message:
                    st.success("✅ Message sent!")
                else:
                    st.error("Please enter a message")
