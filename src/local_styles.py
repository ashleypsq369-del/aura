"""
Local Styles Module - Fast loading with local resources
"""

import streamlit as st
import streamlit.components.v1
import os


def load_local_css():
    """Load local CSS file"""
    css_file = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts', 'inter.css')
    if os.path.exists(css_file):
        with open(css_file, 'r') as f:
            return f.read()
    return ""


def apply_fast_styles():
    """Apply optimized styles with local resources"""
    
    local_font_css = load_local_css()
    
    # Inject JavaScript to aggressively hide navigation
    st.components.v1.html("""
    <script>
        function hideNavigation() {
            const selectors = [
                '[data-testid="stSidebarNav"]',
                '[data-testid="stSidebarNav"] + div',
                '.css-1544g2n',
                '.css-1cypcdb',
                'nav[aria-label="Page navigation"]',
                '[role="navigation"]',
                'nav'
            ];
            
            selectors.forEach(selector => {
                const elements = parent.document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && el.textContent && (
                        el.textContent.includes('Login') || 
                        el.textContent.includes('Dashboard') ||
                        el.textContent.includes('app')
                    )) {
                        el.remove();
                    }
                });
            });
        }
        
        hideNavigation();
        setInterval(hideNavigation, 100);
        
        const observer = new MutationObserver(hideNavigation);
        observer.observe(parent.document.body, {
            childList: true,
            subtree: true
        });
    </script>
    """, height=0)
    
    st.markdown(f"""
    <style>
        /* Local fonts */
        {local_font_css}
        
        /* NUCLEAR OPTION: Hide ALL possible navigation elements */
        [data-testid="stSidebarNav"],
        [data-testid="stSidebarNav"] *,
        [data-testid="stSidebarNav"] + div,
        .css-1544g2n,
        .css-1cypcdb,
        nav[aria-label="Page navigation"],
        [role="navigation"],
        nav,
        #MainMenu,
        footer,
        header {{
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -99999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }}
        
        /* Base styles */
        * {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        /* Main container */
        .main {{
            background: linear-gradient(135deg, #f5f7fa 0%, #e8f0f7 100%);
            padding: 2rem;
            min-height: 100vh;
        }}
        
        /* Sidebar */
        [data-testid="stSidebar"] {{
            background: linear-gradient(180deg, #2c5282 0%, #1a365d 100%);
            padding: 1rem;
        }}
        
        [data-testid="stSidebar"] * {{
            color: #ffffff !important;
        }}
        
        /* Buttons */
        .stButton > button {{
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white !important;
            border: none;
            border-radius: 12px;
            padding: 0.75rem 2rem;
            font-weight: 600;
            transition: all 0.2s ease;
            width: 100%;
            cursor: pointer;
        }}
        
        .stButton > button:hover {{
            background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
        }}
        
        .stButton > button:active {{
            transform: translateY(0);
        }}
        
        /* Cards */
        .element-container {{
            animation: fadeIn 0.3s ease-out;
        }}
        
        @keyframes fadeIn {{
            from {{
                opacity: 0;
                transform: translateY(10px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}
        
        /* Inputs */
        .stTextInput > div > div > input,
        .stSelectbox > div > div > select,
        .stTextArea > div > div > textarea {{
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            padding: 0.75rem;
            transition: all 0.2s ease;
        }}
        
        .stTextInput > div > div > input:focus,
        .stSelectbox > div > div > select:focus,
        .stTextArea > div > div > textarea:focus {{
            border-color: #4299e1;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }}
        
        /* Metrics */
        [data-testid="stMetricValue"] {{
            font-size: 2rem;
            font-weight: 700;
            color: #1a365d;
        }}
        
        [data-testid="stMetricLabel"] {{
            font-size: 0.875rem;
            color: #4a5568;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        
        /* Expander */
        .streamlit-expanderHeader {{
            background: #f7fafc;
            border-radius: 8px;
            padding: 1rem;
            font-weight: 600;
        }}
        
        /* Success/Error/Warning */
        .stSuccess, .stError, .stWarning, .stInfo {{
            border-radius: 8px;
            padding: 1rem;
        }}
        
        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {{
            gap: 1rem;
        }}
        
        .stTabs [data-baseweb="tab"] {{
            border-radius: 8px 8px 0 0;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
        }}
        
        /* Loading spinner */
        .stSpinner > div {{
            border-color: #4299e1 !important;
        }}
        
        /* Scrollbar */
        ::-webkit-scrollbar {{
            width: 8px;
            height: 8px;
        }}
        
        ::-webkit-scrollbar-track {{
            background: #f1f1f1;
            border-radius: 4px;
        }}
        
        ::-webkit-scrollbar-thumb {{
            background: #4299e1;
            border-radius: 4px;
        }}
        
        ::-webkit-scrollbar-thumb:hover {{
            background: #3182ce;
        }}
    </style>
    """, unsafe_allow_html=True)
