"""
Global Styles Module - Consistent styling across all pages
"""

import streamlit as st
import streamlit.components.v1 as components


def hide_streamlit_elements():
    """Hide default Streamlit navigation and branding with immediate JavaScript"""
    
    # Immediate JavaScript to hide elements before they render
    components.html("""
    <script>
        // Hide navigation immediately
        function hideNav() {
            const selectors = [
                '[data-testid="stSidebarNav"]',
                '.css-1544g2n',
                '.css-1cypcdb',
                'nav[aria-label="Page navigation"]',
                '[data-testid="stSidebarNav"] + div'
            ];
            
            selectors.forEach(selector => {
                const elements = parent.document.querySelectorAll(selector);
                elements.forEach(el => {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.height = '0';
                    el.style.overflow = 'hidden';
                });
            });
        }
        
        // Run immediately
        hideNav();
        
        // Run again after a short delay
        setTimeout(hideNav, 100);
        setTimeout(hideNav, 500);
        
        // Watch for DOM changes
        const observer = new MutationObserver(hideNav);
        observer.observe(parent.document.body, {
            childList: true,
            subtree: true
        });
    </script>
    """, height=0)
    
    # CSS backup
    st.markdown("""
    <style>
        /* CRITICAL: Hide default Streamlit page navigation */
        [data-testid="stSidebarNav"],
        [data-testid="stSidebarNav"] + div,
        .css-1544g2n,
        .css-1cypcdb,
        nav[aria-label="Page navigation"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
        }
        
        /* Hide Streamlit branding */
        #MainMenu {visibility: hidden !important;}
        footer {visibility: hidden !important;}
        header {visibility: hidden !important;}
        
        /* Ensure sidebar only shows our custom content */
        section[data-testid="stSidebar"] > div:first-child {
            padding-top: 1rem;
        }
    </style>
    """, unsafe_allow_html=True)


def apply_global_styles():
    """Apply global professional healthcare styles"""
    st.markdown("""
    <style>
        /* Import professional fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@300;400&display=swap');
        
        /* Global styles */
        * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        /* Main container */
        .main {
            background: linear-gradient(135deg, #f5f7fa 0%, #e8f0f7 100%);
            padding: 2rem;
        }
        
        /* Sidebar styling */
        [data-testid="stSidebar"] {
            background: linear-gradient(180deg, #2c5282 0%, #1a365d 100%);
            padding: 2rem 1rem;
        }
        
        [data-testid="stSidebar"] * {
            color: #ffffff !important;
        }
        
        /* Button styling */
        .stButton > button {
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 0.75rem 2rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(66, 153, 225, 0.3);
            width: 100%;
        }
        
        .stButton > button:hover {
            background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
            box-shadow: 0 8px 16px rgba(66, 153, 225, 0.5);
            transform: translateY(-2px);
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }
    </style>
    """, unsafe_allow_html=True)
