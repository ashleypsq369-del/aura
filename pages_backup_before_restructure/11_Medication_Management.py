"""
Medication Management - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.medication import render

# Setup page with unified design
username, role = setup_page("Medication Management", "💊")

# Render page header
render_page_header("Medication Management", "💊", "Track medications, dosages, and schedules")

# Render page content
render()
