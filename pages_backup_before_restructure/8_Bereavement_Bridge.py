"""
Bereavement Bridge - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.bereavement_enhanced import render

# Setup page with unified design
username, role = setup_page("Bereavement Bridge", "🕊️")

# Render page header
render_page_header("Bereavement Bridge", "🕊️", "Grief support and memorial services")

# Render page content
render()
