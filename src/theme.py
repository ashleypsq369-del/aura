"""
Healthcare Theme Loader
Centralized theme management for consistent UI across all pages
"""

import streamlit as st
import os


def load_healthcare_theme():
    """Load the professional healthcare CSS theme"""
    css_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'healthcare_theme.css')
    
    if os.path.exists(css_file):
        with open(css_file) as f:
            st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
    
    # Add role-specific theme enhancements
    role = st.session_state.get('role', 'patient').lower()
    
    role_themes = {
        'patient': {
            'primary': '#805AD5',  # Purple - compassionate
            'accent': '#E6E6FA',   # Soft lavender
        },
        'caregiver': {
            'primary': '#38A169',  # Green - nurturing
            'accent': '#D1FAE5',   # Soft green
        },
        'clinician': {
            'primary': '#2C5282',  # Blue - professional
            'accent': '#DBEAFE',   # Soft blue
        },
        'admin': {
            'primary': '#1A202C',  # Dark - authoritative
            'accent': '#E2E8F0',   # Gray
        },
        'family': {
            'primary': '#D97706',  # Warm orange - supportive
            'accent': '#FEF3C7',   # Soft yellow
        }
    }
    
    theme = role_themes.get(role, role_themes['patient'])
    
    st.markdown(f"""
    <style>
        :root {{
            --role-primary: {theme['primary']};
            --role-accent: {theme['accent']};
        }}
        
        /* Role-specific button styling */
        .stButton > button {{
            background: linear-gradient(135deg, var(--role-primary) 0%, {theme['primary']}dd 100%);
        }}
        
        /* Role-specific metric cards */
        .metric-card {{
            background: linear-gradient(135deg, var(--role-primary) 0%, {theme['primary']}dd 100%);
        }}
        
        /* Role indicator badge */
        .role-badge {{
            background: var(--role-accent);
            color: var(--role-primary);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
    </style>
    """, unsafe_allow_html=True)


def render_page_header(title, subtitle=None, icon=None):
    """Render a consistent page header"""
    role = st.session_state.get('role', 'Patient').title()
    
    header_html = f"""
    <div class="fade-in" style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
                <h1 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    {icon if icon else ''} {title}
                </h1>
                {f'<p style="color: var(--gray-600); margin-top: 0.5rem;">{subtitle}</p>' if subtitle else ''}
            </div>
            <span class="role-badge">{role}</span>
        </div>
        <hr style="border: none; border-top: 2px solid var(--gray-200); margin: 1rem 0;">
    </div>
    """
    st.markdown(header_html, unsafe_allow_html=True)


def render_metric_card(label, value, change=None, icon=None):
    """Render a metric card"""
    change_html = ''
    if change:
        change_class = 'positive' if change > 0 else 'negative'
        change_icon = '↑' if change > 0 else '↓'
        change_html = f'<div class="metric-change {change_class}">{change_icon} {abs(change)}%</div>'
    
    card_html = f"""
    <div class="metric-card fade-in">
        {f'<div style="font-size: 2rem; margin-bottom: 0.5rem;">{icon}</div>' if icon else ''}
        <div class="metric-value">{value}</div>
        <div class="metric-label">{label}</div>
        {change_html}
    </div>
    """
    st.markdown(card_html, unsafe_allow_html=True)


def render_alert(message, alert_type='info', title=None):
    """Render an alert banner"""
    icons = {
        'urgent': '🚨',
        'warning': '⚠️',
        'success': '✅',
        'info': 'ℹ️'
    }
    
    icon = icons.get(alert_type, 'ℹ️')
    title_html = f'<div class="alert-title">{title}</div>' if title else ''
    
    alert_html = f"""
    <div class="alert alert-{alert_type} slide-in">
        <div class="alert-icon">{icon}</div>
        <div class="alert-content">
            {title_html}
            <div>{message}</div>
        </div>
    </div>
    """
    st.markdown(alert_html, unsafe_allow_html=True)


def render_status_badge(text, status='active'):
    """Render a status badge"""
    return f'<span class="badge badge-{status}">{text}</span>'


def render_card(title, content, footer=None, badge=None):
    """Render a healthcare card"""
    badge_html = f'<span class="badge badge-{badge}">{badge.upper()}</span>' if badge else ''
    footer_html = f'<div class="card-footer">{footer}</div>' if footer else ''
    
    card_html = f"""
    <div class="healthcare-card fade-in">
        <div class="card-header">
            <h3 class="card-title">{title}</h3>
            {badge_html}
        </div>
        <div class="card-body">
            {content}
        </div>
        {footer_html}
    </div>
    """
    st.markdown(card_html, unsafe_allow_html=True)


def render_timeline_item(time, title, description, completed=False):
    """Render a timeline item"""
    status_class = 'completed' if completed else ''
    status_icon = '✅' if completed else '⏰'
    
    item_html = f"""
    <div class="timeline-item {status_class}">
        <div class="timeline-time">{time} {status_icon}</div>
        <div class="timeline-content">
            <strong>{title}</strong>
            <p style="margin: 0.5rem 0 0 0; color: var(--gray-600);">{description}</p>
        </div>
    </div>
    """
    return item_html


def render_progress_bar(label, value, max_value=100):
    """Render a progress bar"""
    percentage = (value / max_value) * 100
    
    progress_html = f"""
    <div style="margin-bottom: 1rem;">
        <div class="progress-label">
            <span>{label}</span>
            <span>{value}/{max_value}</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: {percentage}%"></div>
        </div>
    </div>
    """
    st.markdown(progress_html, unsafe_allow_html=True)


def get_role_icon(role):
    """Get icon for role"""
    icons = {
        'admin': '👨‍💼',
        'clinician': '👨‍⚕️',
        'caregiver': '👨‍👩‍👧',
        'patient': '🧑‍🦱',
        'family': '👨‍👩‍👧‍👦'
    }
    return icons.get(role.lower(), '👤')


def get_priority_color(priority):
    """Get color for priority level"""
    colors = {
        'urgent': 'var(--danger)',
        'high': 'var(--warning)',
        'medium': 'var(--info)',
        'low': 'var(--gray-400)'
    }
    return colors.get(priority.lower(), 'var(--gray-400)')
