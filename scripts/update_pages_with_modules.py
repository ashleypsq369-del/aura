"""Update pages to use enhanced modules"""

print("Updating pages with enhanced modules...\n")

# Update Bereavement Bridge page
bereavement_page = '''"""Bereavement Bridge Page"""
import streamlit as st
from src.bereavement_enhanced import render

st.set_page_config(page_title="Bereavement Bridge", page_icon="🕊️", layout="wide")

# Check authentication
if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/8_Bereavement_Bridge_Complete.py', 'w', encoding='utf-8') as f:
    f.write(bereavement_page)
print("✓ Updated pages/8_Bereavement_Bridge_Complete.py")

# Update Support Hub page
support_page = '''"""Support Hub Page"""
import streamlit as st
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from page_modules.support_hub_module import render

st.set_page_config(page_title="Support Hub", page_icon="💬", layout="wide")

# Check authentication
if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/7_Support_Hub_Complete.py', 'w', encoding='utf-8') as f:
    f.write(support_page)
print("✓ Updated pages/7_Support_Hub_Complete.py")

# Update Dashboard page
dashboard_page = '''"""Enhanced Dashboard Page"""
import streamlit as st
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from page_modules.dashboard_module import render

st.set_page_config(page_title="Dashboard", page_icon="📊", layout="wide")

# Check authentication
if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/2_Dashboard.py', 'w', encoding='utf-8') as f:
    f.write(dashboard_page)
print("✓ Updated pages/2_Dashboard.py")

# Update Medication Management page
medication_page = '''"""Medication Management Page"""
import streamlit as st
from src.medication import render

st.set_page_config(page_title="Medication Management", page_icon="💊", layout="wide")

if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/11_Medication_Management.py', 'w', encoding='utf-8') as f:
    f.write(medication_page)
print("✓ Updated pages/11_Medication_Management.py")

# Update Alerts page
alerts_page = '''"""Alerts Page"""
import streamlit as st
from src.alerts import render

st.set_page_config(page_title="Alerts", page_icon="🔔", layout="wide")

if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/6_Alerts.py', 'w', encoding='utf-8') as f:
    f.write(alerts_page)
print("✓ Updated pages/6_Alerts.py")

# Update Caregiver Portal page
caregiver_page = '''"""Caregiver Portal Page"""
import streamlit as st
from src.caregiver import render

st.set_page_config(page_title="Caregiver Portal", page_icon="👨‍⚕️", layout="wide")

if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/13_Caregiver_Portal.py', 'w', encoding='utf-8') as f:
    f.write(caregiver_page)
print("✓ Updated pages/13_Caregiver_Portal.py")

# Update Memory Vault page
memory_page = '''"""Memory Vault Page"""
import streamlit as st
from src.memory_vault import render

st.set_page_config(page_title="Memory Vault", page_icon="📸", layout="wide")

if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/14_Memory_Vault.py', 'w', encoding='utf-8') as f:
    f.write(memory_page)
print("✓ Updated pages/14_Memory_Vault.py")

# Update Journal page
journal_page = '''"""Journal Page"""
import streamlit as st
from src.journal import render

st.set_page_config(page_title="Journal", page_icon="📔", layout="wide")

if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/15_Journal.py', 'w', encoding='utf-8') as f:
    f.write(journal_page)
print("✓ Updated pages/15_Journal.py")

# Update Care Plan page
care_plan_page = '''"""Care Plan Page"""
import streamlit as st
from src.care_plan import render

st.set_page_config(page_title="Care Plan", page_icon="📋", layout="wide")

if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/16_Care_Plan.py', 'w', encoding='utf-8') as f:
    f.write(care_plan_page)
print("✓ Updated pages/16_Care_Plan.py")

# Update Functional Status page
functional_page = '''"""Functional Status Page"""
import streamlit as st
from src.functional_status import render

st.set_page_config(page_title="Functional Status", page_icon="🏃", layout="wide")

if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.warning("Please login first")
    st.stop()

render()
'''

with open('pages/17_Functional_Status.py', 'w', encoding='utf-8') as f:
    f.write(functional_page)
print("✓ Updated pages/17_Functional_Status.py")

print("\n✅ All pages updated with enhanced modules!")
print("\nPages now connected to:")
print("  • Database helpers for data persistence")
print("  • Sentiment analysis for emotional insights")
print("  • Conversational AI for support")
print("  • Professional dashboard components")
print("  • Platform resources integration")
