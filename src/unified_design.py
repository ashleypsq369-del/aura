"""
Unified Design System for Project Aura
Consistent styling, layout, and components across all pages
"""
import streamlit as st

# Professional color palette
COLORS = {
    'primary': '#667eea',
    'secondary': '#764ba2',
    'success': '#48bb78',
    'warning': '#f6ad55',
    'danger': '#fc8181',
    'info': '#4299e1',
    'dark': '#2d3748',
    'light': '#f7fafc',
    'text': '#2d3748',
    'border': '#e2e8f0'
}

def inject_custom_css():
    """Inject unified CSS for consistent styling"""
    st.markdown("""
    <style>
    /* Global Styles */
    .main {
        background-color: #f7fafc;
    }
    
    /* Unified Page Header */
    .page-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .page-header h1 {
        color: white !important;
        margin: 0;
        font-size: 2rem;
        font-weight: 600;
    }
    
    .page-header p {
        margin-top: 0.5rem;
        opacity: 0.95;
        font-size: 1.1rem;
    }
    
    /* Unified Cards */
    .unified-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
        margin-bottom: 1rem;
    }
    
    .unified-card h3 {
        color: #2d3748;
        margin-top: 0;
        font-size: 1.25rem;
        font-weight: 600;
    }
    
    /* Unified Buttons */
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 2rem;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    /* Unified Forms */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea,
    .stSelectbox > div > div > select {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        padding: 0.75rem;
    }
    
    /* Unified Metrics */
    div[data-testid="stMetricValue"] {
        font-size: 2rem;
        font-weight: 600;
        color: #667eea;
    }
    
    /* Unified Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: white;
        padding: 0.5rem;
        border-radius: 12px;
    }
    
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-weight: 500;
    }
    
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    /* Unified Sidebar */
    section[data-testid="stSidebar"] {
        background-color: #2d3748;
    }
    
    section[data-testid="stSidebar"] .stMarkdown {
        color: white;
    }
    
    /* Success/Warning/Error Messages */
    .stSuccess, .stWarning, .stError, .stInfo {
        border-radius: 8px;
        padding: 1rem;
    }
    
    /* Data Tables */
    .dataframe {
        border-radius: 8px;
        overflow: hidden;
    }
    
    /* Hide Streamlit Branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    </style>
    """, unsafe_allow_html=True)

def render_page_header(title, icon, description):
    """Render unified page header"""
    st.markdown(f"""
    <div class='page-header'>
        <h1>{icon} {title}</h1>
        <p>{description}</p>
    </div>
    """, unsafe_allow_html=True)

def render_card(title, content):
    """Render unified card component"""
    st.markdown(f"""
    <div class='unified-card'>
        <h3>{title}</h3>
        {content}
    </div>
    """, unsafe_allow_html=True)

def check_authentication():
    """Check if user is authenticated"""
    if 'authenticated' not in st.session_state or not st.session_state.authenticated:
        st.warning("⚠️ Please login first")
        if st.button("Go to Login", key="goto_login_btn"):
            st.switch_page("pages/1_Login.py")
        st.stop()
        
def show_user_info():
    """Display user info in sidebar"""
    if st.session_state.get('authenticated'):
        st.sidebar.markdown("---")
        st.sidebar.markdown(f"**👤 User:** {st.session_state.get('user_name', 'Unknown')}")
        st.sidebar.markdown(f"**🎭 Role:** {st.session_state.get('user_role', 'Unknown')}")
        
        if st.sidebar.button("🚪 Logout", key="logout_btn", use_container_width=True):
            st.session_state.authenticated = False
            st.rerun()

def setup_page(page_title, page_icon, layout="wide"):
    """
    Unified page setup - call this at the start of every page
    Returns: (username, role)
    """
    # Set page config
    st.set_page_config(
        page_title=f"Project Aura - {page_title}",
        page_icon=page_icon,
        layout=layout,
        initial_sidebar_state="expanded"
    )
    
    # Inject CSS
    inject_custom_css()
    
    # Check authentication
    check_authentication()
    
    # Show user info
    show_user_info()
    
    # Return user info
    return (
        st.session_state.get('user_name', 'Unknown'),
        st.session_state.get('user_role', 'Unknown')
    )
