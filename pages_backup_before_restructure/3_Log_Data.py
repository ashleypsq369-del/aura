"""
Log Patient Data - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header

# Setup page with unified design
username, role = setup_page("Log Patient Data", "📝")

# Render page header
render_page_header("Log Patient Data", "📝", "Record symptoms, vitals, and clinical observations")

# Render page content
setup_page("Log Data", "📝")
