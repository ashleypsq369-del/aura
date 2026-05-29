"""UI Utilities - Hide Streamlit default elements and add custom styling"""

import streamlit as st


def hide_streamlit_elements():
    """Hide default Streamlit UI elements (hamburger menu, footer, etc.)"""
    hide_style = """
        <style>
        /* Hide hamburger menu */
        #MainMenu {visibility: hidden;}
        
        /* Hide footer */
        footer {visibility: hidden;}
        
        /* Hide "Deploy" button */
        .stDeployButton {display: none;}
        
        /* Hide Streamlit header */
        header {visibility: hidden;}
        
        /* Hide default page navigation */
        [data-testid="stSidebarNav"] {display: none;}
        section[data-testid="stSidebarNav"] {display: none;}
        
        /* Reduce top padding */
        .block-container {
            padding-top: 1rem;
            padding-bottom: 0rem;
        }
        
        /* Hide "Made with Streamlit" */
        .viewerBadge_container__1QSob {
            display: none;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        
        /* Remove extra padding from sidebar */
        [data-testid="stSidebar"] {
            padding-top: 0rem;
        }
        
        /* Style sidebar navigation */
        [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] {
            padding: 0.5rem;
        }
        
        /* Ensure sidebar is visible */
        [data-testid="stSidebar"] {
            display: block !important;
        }
        </style>
    """
    st.markdown(hide_style, unsafe_allow_html=True)


def add_logout_button():
    """Add a styled logout button to the sidebar"""
    with st.sidebar:
        st.markdown("---")
        if st.button("🚪 Logout", use_container_width=True, type="primary"):
            # Clear session state
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.switch_page("pages/1_Login.py")


def show_role_badge(role, username):
    """Display user role badge in sidebar"""
    from src.rbac import get_role_info
    
    role_info = get_role_info(role)
    
    badge_html = f"""
        <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 1rem; 
                    border-radius: 12px; 
                    margin-bottom: 1rem;
                    text-align: center;'>
            <div style='font-size: 2rem; margin-bottom: 0.5rem;'>{role_info['icon']}</div>
            <div style='font-weight: bold; font-size: 1.1rem;'>{username}</div>
            <div style='opacity: 0.9; font-size: 0.9rem;'>{role_info['display_name']}</div>
        </div>
    """
    
    with st.sidebar:
        st.markdown(badge_html, unsafe_allow_html=True)


def create_navigation_menu(role):
    """Create role-based navigation menu in sidebar"""
    from src.rbac import get_accessible_pages
    
    pages = get_accessible_pages(role)
    
    # Group pages by category
    categories = {}
    for page in pages:
        category = page['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(page)
    
    with st.sidebar:
        st.markdown("### 🧭 Navigation")
        
        for category, category_pages in categories.items():
            st.markdown(f"**{category}**")
            for page in category_pages:
                if st.button(
                    f"{page['icon']} {page['name']}", 
                    key=f"nav_{page['id']}",
                    use_container_width=True
                ):
                    st.switch_page(page['path'])
            st.markdown("")  # Add spacing


def check_authentication():
    """
    Check if user is authenticated.
    Redirects to login if not authenticated.
    Returns user info if authenticated.
    """
    # Check if authenticated
    if not st.session_state.get('authenticated', False):
        st.switch_page("pages/1_Login.py")
        st.stop()
    
    return {
        'username': st.session_state.get('username', ''),
        'role': st.session_state.get('role', ''),
        'user_id': st.session_state.get('user_id', '')
    }


def setup_page(page_title, page_icon, role_required=None, page_id=None):
    """
    Complete page setup with authentication, RBAC, and UI cleanup.
    Call this at the start of every page.
    
    Args:
        page_title: Title for the page
        page_icon: Icon for the page
        role_required: Optional specific role required (None = any authenticated user)
        page_id: Optional page ID for access control (e.g., "2_Dashboard")
    
    Returns:
        user_info dict with username, role, user_id
    """
    from src.rbac import has_access
    
    # Hide Streamlit elements
    hide_streamlit_elements()
    
    # Check authentication
    user_info = check_authentication()
    
    # Check page access if page_id provided
    if page_id and not has_access(user_info['role'], page_id):
        st.error("🚫 Access Denied - You don't have permission to view this page")
        st.info("Redirecting to dashboard...")
        import time
        time.sleep(1)
        st.switch_page("pages/2_Dashboard.py")
        st.stop()
    
    # Check specific role if required
    if role_required and user_info['role'] != role_required:
        st.error(f"🚫 This page requires {role_required} role")
        st.switch_page("pages/2_Dashboard.py")
        st.stop()
    
    # Show user badge
    show_role_badge(user_info['role'], user_info['username'])
    
    # Create navigation menu
    create_navigation_menu(user_info['role'])
    
    # Add logout button
    add_logout_button()
    
    return user_info
