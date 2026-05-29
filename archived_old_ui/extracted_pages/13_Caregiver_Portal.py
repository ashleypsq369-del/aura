"""
Caregiver Portal - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.caregiver import render

# Setup page with unified design
username, role = setup_page("Caregiver Portal", "👨‍⚕️")

# Render page header
render_page_header("Caregiver Portal", "👨‍⚕️", "Resources and tools for family caregivers")

# Render page content
render()
