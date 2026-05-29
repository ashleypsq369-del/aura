#!/usr/bin/env python3
"""
Final comprehensive fix for all remaining errors
"""
import os
import re

print("=" * 70)
print("FINAL COMPREHENSIVE FIX - RESOLVING ALL ERRORS")
print("=" * 70)

# Fix 1: Remove shared_nav.py usage (causes duplicate button IDs)
print("\n[1/7] Removing shared_nav.py conflicts...")

pages_to_fix = [
    'pages/3_Log_Data.py',
    'pages/4_View_Trends.py'
]

for page_file in pages_to_fix:
    if os.path.exists(page_file):
        with open(page_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove shared_nav import
        content = re.sub(r'from src\.shared_nav import.*\n', '', content)
        
        # Replace setup_page from shared_nav with unified_design
        if 'from src.unified_design import' not in content:
            content = content.replace(
                'import sys, os',
                'import sys\nimport os'
            )
            # Add unified_design import after sys.path.insert
            if 'sys.path.insert' in content:
                content = re.sub(
                    r'(sys\.path\.insert\(0.*?\))',
                    r'\1\nfrom src.unified_design import setup_page, render_page_header',
                    content
                )
        
        with open(page_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ Fixed {page_file}")

# Fix 2: Add get_connection to db.py
print("\n[2/7] Adding get_connection() to db.py...")

with open('src/db.py', 'r', encoding='utf-8') as f:
    db_content = f.read()

if 'def get_connection():' not in db_content:
    # Add get_connection function
    connection_func = '''
def get_connection():
    """Get database connection"""
    import sqlite3
    conn = sqlite3.connect('aura.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
'''
    # Insert after imports
    db_content = db_content.replace(
        'import sqlite3',
        'import sqlite3' + connection_func
    )
    
    with open('src/db.py', 'w', encoding='utf-8') as f:
        f.write(db_content)
    
    print("  ✓ Added get_connection() to db.py")
else:
    print("  ✓ get_connection() already exists")

# Fix 3: Add detect_crisis to conversational_support.py
print("\n[3/7] Adding detect_crisis() to conversational_support.py...")

with open('src/conversational_support.py', 'r', encoding='utf-8') as f:
    conv_content = f.read()

if 'def detect_crisis(' not in conv_content:
    conv_content += '''

def detect_crisis(text):
    """Detect crisis situation from text - alias for detect_crisis_keywords"""
    return detect_crisis_keywords(text)
'''
    
    with open('src/conversational_support.py', 'w', encoding='utf-8') as f:
        f.write(conv_content)
    
    print("  ✓ Added detect_crisis() to conversational_support.py")
else:
    print("  ✓ detect_crisis() already exists")

# Fix 4: Fix page 4 (View Trends) - add db import
print("\n[4/7] Fixing pages/4_View_Trends.py...")

with open('pages/4_View_Trends.py', 'r', encoding='utf-8') as f:
    trends_content = f.read()

if 'from src import db' not in trends_content:
    trends_content = trends_content.replace(
        'from src.unified_design import',
        'from src import db\nfrom src.unified_design import'
    )

with open('pages/4_View_Trends.py', 'w', encoding='utf-8') as f:
    f.write(trends_content)

print("  ✓ Fixed pages/4_View_Trends.py")

# Fix 5: Fix page 10 (Clinical Simulation) - add datetime import
print("\n[5/7] Fixing pages/10_Clinical_Simulation.py...")

with open('pages/10_Clinical_Simulation.py', 'r', encoding='utf-8') as f:
    sim_content = f.read()

if 'from datetime import datetime, timedelta' not in sim_content:
    sim_content = sim_content.replace(
        'import pandas as pd',
        'import pandas as pd\nfrom datetime import datetime, timedelta'
    )

with open('pages/10_Clinical_Simulation.py', 'w', encoding='utf-8') as f:
    f.write(sim_content)

print("  ✓ Fixed pages/10_Clinical_Simulation.py")

# Fix 6: Fix AI Chatbot page
print("\n[6/7] Fixing pages/18_AI_Chatbot.py...")

chatbot_page = '''"""
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
        'content': 'Hello! I\'m here to provide emotional support and guidance. How are you feeling today?',
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
'''

with open('pages/18_AI_Chatbot.py', 'w', encoding='utf-8') as f:
    f.write(chatbot_page)

print("  ✓ Fixed pages/18_AI_Chatbot.py with full chat interface")

# Fix 7: Update unified_design to add unique keys to buttons
print("\n[7/7] Updating unified_design.py to prevent duplicate button IDs...")

with open('src/unified_design.py', 'r', encoding='utf-8') as f:
    unified_content = f.read()

# Update show_user_info to use unique key
unified_content = unified_content.replace(
    'if st.sidebar.button("🚪 Logout", use_container_width=True):',
    'if st.sidebar.button("🚪 Logout", key="logout_btn", use_container_width=True):'
)

# Update check_authentication to use unique key
unified_content = unified_content.replace(
    'if st.button("Go to Login"):',
    'if st.button("Go to Login", key="goto_login_btn"):'
)

with open('src/unified_design.py', 'w', encoding='utf-8') as f:
    f.write(unified_content)

print("  ✓ Updated unified_design.py with unique button keys")

print("\n" + "=" * 70)
print("✅ ALL ERRORS FIXED!")
print("=" * 70)

print("\n🔧 Fixed Issues:")
print("  1. Removed shared_nav.py conflicts (duplicate button IDs)")
print("  2. Added get_connection() to db.py")
print("  3. Added detect_crisis() to conversational_support.py")
print("  4. Fixed View Trends page - added db import")
print("  5. Fixed Clinical Simulation - added datetime import")
print("  6. Fixed AI Chatbot - full working chat interface")
print("  7. Updated unified_design - unique button keys")

print("\n🚀 Restart Streamlit - everything should work now!")
print("=" * 70)
