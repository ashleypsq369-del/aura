"""
AI Chatbot - Project Aura
24/7 Emotional Support and Guidance
"""
import streamlit as st
import sys
import os
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.conversational_support import generate_response, detect_crisis_keywords, get_crisis_resources

# Setup page
username, role = setup_page("AI Chatbot", "💬")

# Render header
render_page_header("AI Chatbot", "💬", "24/7 emotional support and compassionate guidance")

# Initialize chat history
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
    st.session_state.chat_history.append({
        'role': 'assistant',
        'content': 'Hello! I am here to provide emotional support and guidance. How are you feeling today?',
        'timestamp': datetime.now()
    })

# Display chat history
st.markdown("### 💬 Conversation")

for message in st.session_state.chat_history:
    if message['role'] == 'user':
        st.markdown(f"""
        <div style='background: #e3f2fd; padding: 1rem; border-radius: 12px; margin: 0.5rem 0;'>
            <strong>You:</strong> {message['content']}
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div style='background: #f3e5f5; padding: 1rem; border-radius: 12px; margin: 0.5rem 0;'>
            <strong>AI Assistant:</strong> {message['content']}
        </div>
        """, unsafe_allow_html=True)

# Chat input
st.markdown("---")
user_input = st.text_area("Your message:", placeholder="Share your thoughts and feelings...", height=100, key="chat_input")

col1, col2 = st.columns([1, 5])
with col1:
    if st.button("Send", type="primary", use_container_width=True):
        if user_input:
            # Add user message
            st.session_state.chat_history.append({
                'role': 'user',
                'content': user_input,
                'timestamp': datetime.now()
            })
            
            # Check for crisis keywords
            if detect_crisis_keywords(user_input):
                crisis_resources = get_crisis_resources()
                response = f"""I'm concerned about what you've shared. Please reach out for immediate help:
                
🆘 **Crisis Resources:**
- {crisis_resources['hotline']}
- {crisis_resources['text']}
- {crisis_resources['emergency']}

You don't have to face this alone. Professional help is available 24/7."""
            else:
                # Generate response based on context
                if any(word in user_input.lower() for word in ['grief', 'loss', 'died', 'passed']):
                    context = 'grief'
                elif any(word in user_input.lower() for word in ['anxious', 'worried', 'scared', 'fear']):
                    context = 'anxiety'
                else:
                    context = 'general'
                
                response = generate_response(user_input, context)
            
            # Add assistant response
            st.session_state.chat_history.append({
                'role': 'assistant',
                'content': response,
                'timestamp': datetime.now()
            })
            
            st.rerun()

with col2:
    if st.button("Clear Chat", use_container_width=True):
        st.session_state.chat_history = []
        st.rerun()

# Sidebar resources
st.sidebar.markdown("---")
st.sidebar.markdown("### 📚 Quick Resources")
st.sidebar.info("""
**Available Support:**
- Grief counseling
- Anxiety management
- Coping strategies
- Mindfulness exercises
- Crisis intervention
""")

st.sidebar.markdown("### 🆘 Crisis Help")
st.sidebar.error("""
**Immediate Help:**
- 988 - Crisis Lifeline
- Text HOME to 741741
- Call 911 for emergencies
""")
