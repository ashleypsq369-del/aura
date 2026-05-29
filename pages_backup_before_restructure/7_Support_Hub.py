"""
Support Hub - Project Aura
Professional Hospice Care Management Platform
"""
import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.unified_design import setup_page, render_page_header
from page_modules.support_hub_module import render

# Setup page with unified design
username, role = setup_page("Support Hub", "💬")

# Render page header
render_page_header("Support Hub", "💬", "Crisis resources and emotional support services")

# Render page content
render()
