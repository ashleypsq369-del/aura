"""
Care Plan - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.care_plan import render

# Setup page with unified design
username, role = setup_page("Care Plan", "📋")

# Render page header
render_page_header("Care Plan", "📋", "Goals, interventions, and care strategies")

# Render page content
render()
