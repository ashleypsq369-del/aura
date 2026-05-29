"""
Custom UI Foundation for Project Aura
All Streamlit default UI hidden - ready for custom design
"""
import streamlit as st

# Hide ALL Streamlit UI elements
st.markdown("""
<style>
    /* Hide Streamlit default elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Hide sidebar completely */
    [data-testid="stSidebar"] {display: none;}
    
    /* Remove padding */
    .main .block-container {
        padding-top: 0rem;
        padding-bottom: 0rem;
        padding-left: 1rem;
        padding-right: 1rem;
    }
    
    /* Full width */
    .main {
        max-width: 100%;
    }
    
    /* Remove Streamlit branding */
    .stDeployButton {display: none;}
    
    /* Clean canvas */
    .stApp {
        background-color: #ffffff;
    }
</style>
""", unsafe_allow_html=True)

def hide_streamlit_ui():
    """Hide all Streamlit default UI elements"""
    st.set_page_config(
        page_title="Project Aura",
        page_icon="🏥",
        layout="wide",
        initial_sidebar_state="collapsed"
    )

# YOUR CUSTOM UI WILL GO HERE
# All module functionality is preserved and can be called
