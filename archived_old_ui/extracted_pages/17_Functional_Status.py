"""
Functional Status - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.functional_status import render

# Setup page with unified design
username, role = setup_page("Functional Status", "🏃")

# Render page header
render_page_header("Functional Status", "🏃", "Activities of daily living assessments")

# Render page content
render()
