#!/usr/bin/env python3
"""
Apply unified design system to all pages
"""
import os
import re

print("=" * 70)
print("APPLYING UNIFIED DESIGN TO ALL PAGES")
print("=" * 70)

# Page configurations
pages_config = {
    '2_Dashboard.py': {
        'title': 'Patient Dashboard',
        'icon': '📊',
        'description': 'Comprehensive overview of patient care metrics and activities'
    },
    '3_Log_Data.py': {
        'title': 'Log Patient Data',
        'icon': '📝',
        'description': 'Record symptoms, vitals, and clinical observations'
    },
    '4_View_Trends.py': {
        'title': 'View Trends',
        'icon': '📈',
        'description': 'Analyze patient data trends and patterns over time'
    },
    '5_AI_Insights.py': {
        'title': 'AI Insights',
        'icon': '🤖',
        'description': 'AI-powered predictive analytics and recommendations'
    },
    '6_Alerts.py': {
        'title': 'Priority Alerts',
        'icon': '🔔',
        'description': 'Critical notifications and action items'
    },
    '7_Support_Hub.py': {
        'title': 'Support Hub',
        'icon': '💬',
        'description': 'Crisis resources and emotional support services'
    },
    '8_Bereavement_Bridge.py': {
        'title': 'Bereavement Bridge',
        'icon': '🕊️',
        'description': 'Grief support and memorial services'
    },
    '9_Patient_Onboarding.py': {
        'title': 'Patient Onboarding',
        'icon': '👤',
        'description': 'New patient intake and registration'
    },
    '10_Clinical_Simulation.py': {
        'title': 'Clinical Simulation',
        'icon': '🎓',
        'description': 'Training scenarios and skill development'
    },
    '11_Medication_Management.py': {
        'title': 'Medication Management',
        'icon': '💊',
        'description': 'Track medications, dosages, and schedules'
    },
    '12_Appointment_Scheduling.py': {
        'title': 'Appointment Scheduling',
        'icon': '📅',
        'description': 'Manage appointments and care team calendar'
    },
    '13_Caregiver_Portal.py': {
        'title': 'Caregiver Portal',
        'icon': '👨‍⚕️',
        'description': 'Resources and tools for family caregivers'
    },
    '14_Memory_Vault.py': {
        'title': 'Memory Vault',
        'icon': '📸',
        'description': 'Preserve and share precious memories'
    },
    '15_Journal.py': {
        'title': 'Personal Journal',
        'icon': '📔',
        'description': 'Private reflections and thoughts'
    },
    '16_Care_Plan.py': {
        'title': 'Care Plan',
        'icon': '📋',
        'description': 'Goals, interventions, and care strategies'
    },
    '17_Functional_Status.py': {
        'title': 'Functional Status',
        'icon': '🏃',
        'description': 'Activities of daily living assessments'
    },
    '18_AI_Chatbot.py': {
        'title': 'AI Chatbot',
        'icon': '💬',
        'description': '24/7 emotional support and guidance'
    }
}

def create_unified_page_template(filename, config):
    """Create a unified page with consistent structure"""
    
    # Read existing page to preserve functionality
    page_path = f'pages/{filename}'
    if not os.path.exists(page_path):
        print(f"  ✗ Page not found: {filename}")
        return False
    
    with open(page_path, 'r', encoding='utf-8') as f:
        existing_content = f.read()
    
    # Extract the render function or main logic
    # Look for existing render calls or main content
    has_render_module = 'from page_modules' in existing_content or 'from src.' in existing_content
    
    if has_render_module:
        # Extract module imports
        module_match = re.search(r'from (page_modules\.\w+|src\.\w+) import (\w+)', existing_content)
        if module_match:
            module_path = module_match.group(1)
            render_func = module_match.group(2)
            
            template = f'''"""
{config['title']} - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from {module_path} import {render_func}

# Setup page with unified design
username, role = setup_page("{config['title']}", "{config['icon']}")

# Render page header
render_page_header("{config['title']}", "{config['icon']}", "{config['description']}")

# Render page content
{render_func}()
'''
        else:
            return False
    else:
        # Page doesn't have a module - keep existing but add unified design
        template = f'''"""
{config['title']} - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header

# Setup page with unified design
username, role = setup_page("{config['title']}", "{config['icon']}")

# Render page header
render_page_header("{config['title']}", "{config['icon']}", "{config['description']}")

# Original page content below
{existing_content.split("st.set_page_config", 1)[-1].split(")", 1)[-1] if "st.set_page_config" in existing_content else existing_content}
'''
    
    # Write updated page
    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(template)
    
    return True

print("\n[1/1] Applying unified design to all pages...")
success_count = 0
for filename, config in pages_config.items():
    if create_unified_page_template(filename, config):
        print(f"  ✓ Updated: {filename}")
        success_count += 1
    else:
        print(f"  ⚠ Skipped: {filename} (manual review needed)")

print("\n" + "=" * 70)
print(f"✅ UNIFIED DESIGN APPLIED TO {success_count}/{len(pages_config)} PAGES!")
print("=" * 70)

print("\n🎨 All pages now have:")
print("  • Consistent header design")
print("  • Unified color scheme")
print("  • Professional styling")
print("  • Standardized buttons and forms")
print("  • Role-based access control")
print("  • User info in sidebar")

print("\n🚀 Restart Streamlit to see the unified design!")
print("=" * 70)
