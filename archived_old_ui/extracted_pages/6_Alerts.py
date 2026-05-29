"""
Priority Alerts - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.alerts import render

# Setup page with unified design
username, role = setup_page("Priority Alerts", "🔔")

# Render page header
render_page_header("Priority Alerts", "🔔", "Critical notifications and action items")

# Render page content
render()
