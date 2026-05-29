"""
Personal Journal - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from src.journal import render

# Setup page with unified design
username, role = setup_page("Personal Journal", "📔")

# Render page header
render_page_header("Personal Journal", "📔", "Private reflections and thoughts")

# Render page content
render()
