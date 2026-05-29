"""
Dashboard Components for Professional UI
Provides reusable components for healthcare dashboards
"""
import streamlit as st
from datetime import datetime

def render_kpi_card(title: str, value, icon: str = "📊", status: str = "normal"):
    """Render a KPI card with title, value, and icon"""
    
    # Status colors
    colors = {
        "normal": "#4299e1",
        "success": "#48bb78",
        "warning": "#ed8936",
        "critical": "#f56565"
    }
    
    color = colors.get(status, colors["normal"])
    
    st.markdown(f"""
    <div style="
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        border-left: 4px solid {color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="color: #718096; font-size: 0.875rem; margin-bottom: 0.5rem;">
                    {title}
                </div>
                <div style="color: #2d3748; font-size: 1.875rem; font-weight: 700;">
                    {value}
                </div>
            </div>
            <div style="font-size: 2.5rem; opacity: 0.8;">
                {icon}
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_alert_card(title: str, message: str, severity: str = "info", timestamp: str = None):
    """Render an alert card with severity styling"""
    
    severity_config = {
        "info": {"color": "#4299e1", "icon": "ℹ️", "bg": "#ebf8ff"},
        "low": {"color": "#48bb78", "icon": "✓", "bg": "#f0fff4"},
        "medium": {"color": "#ed8936", "icon": "⚠️", "bg": "#fffaf0"},
        "high": {"color": "#f56565", "icon": "⚠️", "bg": "#fff5f5"},
        "critical": {"color": "#c53030", "icon": "🚨", "bg": "#fff5f5"}
    }
    
    config = severity_config.get(severity, severity_config["info"])
    
    st.markdown(f"""
    <div style="
        background: {config['bg']};
        border-left: 4px solid {config['color']};
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    ">
        <div style="display: flex; align-items: start; gap: 0.75rem;">
            <div style="font-size: 1.5rem;">{config['icon']}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #2d3748; margin-bottom: 0.25rem;">
                    {title}
                </div>
                <div style="color: #4a5568; font-size: 0.875rem;">
                    {message}
                </div>
                {f'<div style="color: #718096; font-size: 0.75rem; margin-top: 0.5rem;">{timestamp}</div>' if timestamp else ''}
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_timeline_item(icon: str, title: str, description: str, timestamp: str):
    """Render a timeline item"""
    
    st.markdown(f"""
    <div style="
        display: flex;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid #e2e8f0;
    ">
        <div style="
            font-size: 1.5rem;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7fafc;
            border-radius: 50%;
        ">
            {icon}
        </div>
        <div style="flex: 1;">
            <div style="font-weight: 600; color: #2d3748; margin-bottom: 0.25rem;">
                {title}
            </div>
            <div style="color: #4a5568; font-size: 0.875rem; margin-bottom: 0.5rem;">
                {description}
            </div>
            <div style="color: #a0aec0; font-size: 0.75rem;">
                {timestamp}
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_stat_card(label: str, value: str, change: str = None, trend: str = "neutral"):
    """Render a stat card with optional trend indicator"""
    
    trend_colors = {
        "up": "#48bb78",
        "down": "#f56565",
        "neutral": "#718096"
    }
    
    trend_icons = {
        "up": "↑",
        "down": "↓",
        "neutral": "→"
    }
    
    color = trend_colors.get(trend, trend_colors["neutral"])
    icon = trend_icons.get(trend, trend_icons["neutral"])
    
    st.markdown(f"""
    <div style="
        background: white;
        padding: 1.25rem;
        border-radius: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    ">
        <div style="color: #718096; font-size: 0.875rem; margin-bottom: 0.5rem;">
            {label}
        </div>
        <div style="color: #2d3748; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
            {value}
        </div>
        {f'<div style="color: {color}; font-size: 0.875rem;">{icon} {change}</div>' if change else ''}
    </div>
    """, unsafe_allow_html=True)

def render_progress_card(title: str, current: int, total: int, color: str = "#4299e1"):
    """Render a progress card"""
    
    percentage = (current / total * 100) if total > 0 else 0
    
    st.markdown(f"""
    <div style="
        background: white;
        padding: 1.25rem;
        border-radius: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    ">
        <div style="color: #2d3748; font-weight: 600; margin-bottom: 1rem;">
            {title}
        </div>
        <div style="
            background: #e2e8f0;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;
        ">
            <div style="
                background: {color};
                height: 100%;
                width: {percentage}%;
                transition: width 0.3s ease;
            "></div>
        </div>
        <div style="color: #718096; font-size: 0.875rem;">
            {current} of {total} ({percentage:.0f}%)
        </div>
    </div>
    """, unsafe_allow_html=True)
