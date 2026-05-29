"""
Design System for Project Aura
Inspired by MatrixCare, Alora Hospice, and modern healthcare UI patterns
Provides consistent colors, typography, spacing, and component styles
"""

from typing import Dict, Any
import streamlit as st

class DesignSystem:
    """Centralized design system for consistent UI/UX"""
    
    # Color Palette (inspired by MatrixCare/Alora)
    COLORS = {
        # Primary Colors
        'primary': '#007bff',
        'primary_light': '#4da3ff',
        'primary_dark': '#0056b3',
        
        # Semantic Colors
        'success': '#28a745',
        'success_light': '#5cb85c',
        'success_dark': '#1e7e34',
        
        'warning': '#ffc107',
        'warning_light': '#ffd454',
        'warning_dark': '#d39e00',
        
        'danger': '#dc3545',
        'danger_light': '#e4606d',
        'danger_dark': '#bd2130',
        
        'info': '#17a2b8',
        'info_light': '#5bc0de',
        'info_dark': '#117a8b',
        
        # Neutral Colors
        'white': '#ffffff',
        'light': '#f8f9fa',
        'light_gray': '#e9ecef',
        'gray': '#6c757d',
        'dark_gray': '#495057',
        'dark': '#343a40',
        'black': '#000000',
        
        # Hospice-Specific Colors (soft, compassionate)
        'hospice_purple': '#6f42c1',
        'hospice_teal': '#20c997',
        'hospice_coral': '#fd7e14',
        'hospice_lavender': '#e0d4f7',
        'hospice_mint': '#d4f7e0',
        
        # Background Colors
        'bg_primary': '#ffffff',
        'bg_secondary': '#f8f9fa',
        'bg_tertiary': '#e9ecef',
        
        # Text Colors
        'text_primary': '#1a1a1a',
        'text_secondary': '#666666',
        'text_muted': '#999999',
        'text_light': '#cccccc'
    }
    
    # Typography
    TYPOGRAPHY = {
        'font_family': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        'font_family_mono': '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        
        'font_sizes': {
            'xs': '12px',
            'sm': '14px',
            'base': '16px',
            'lg': '18px',
            'xl': '20px',
            '2xl': '24px',
            '3xl': '30px',
            '4xl': '36px',
            '5xl': '48px'
        },
        
        'font_weights': {
            'light': 300,
            'normal': 400,
            'medium': 500,
            'semibold': 600,
            'bold': 700,
            'extrabold': 800
        },
        
        'line_heights': {
            'tight': 1.25,
            'normal': 1.5,
            'relaxed': 1.75,
            'loose': 2.0
        }
    }
    
    # Spacing (8px base unit)
    SPACING = {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px'
    }
    
    # Border Radius
    RADIUS = {
        'none': '0',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px'
    }
    
    # Shadows
    SHADOWS = {
        'none': 'none',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'lg': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'xl': '0 10px 15px rgba(0, 0, 0, 0.1)',
        '2xl': '0 20px 25px rgba(0, 0, 0, 0.15)'
    }
    
    # Transitions
    TRANSITIONS = {
        'fast': '150ms ease-in-out',
        'base': '300ms ease-in-out',
        'slow': '500ms ease-in-out'
    }
    
    # Breakpoints (responsive design)
    BREAKPOINTS = {
        'mobile': '640px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1280px'
    }
    
    # Component Styles
    COMPONENTS = {
        'card': {
            'background': COLORS['white'],
            'border_radius': RADIUS['lg'],
            'padding': SPACING['lg'],
            'shadow': SHADOWS['md'],
            'border': f"1px solid {COLORS['light_gray']}"
        },
        
        'button_primary': {
            'background': COLORS['primary'],
            'color': COLORS['white'],
            'border_radius': RADIUS['md'],
            'padding': f"{SPACING['sm']} {SPACING['lg']}",
            'font_weight': TYPOGRAPHY['font_weights']['semibold'],
            'transition': TRANSITIONS['base']
        },
        
        'button_secondary': {
            'background': COLORS['light'],
            'color': COLORS['text_primary'],
            'border_radius': RADIUS['md'],
            'padding': f"{SPACING['sm']} {SPACING['lg']}",
            'font_weight': TYPOGRAPHY['font_weights']['medium'],
            'transition': TRANSITIONS['base']
        },
        
        'alert_critical': {
            'background': f"{COLORS['danger']}15",
            'border_left': f"5px solid {COLORS['danger']}",
            'border_radius': RADIUS['md'],
            'padding': SPACING['md'],
            'color': COLORS['text_primary']
        },
        
        'alert_warning': {
            'background': f"{COLORS['warning']}15",
            'border_left': f"5px solid {COLORS['warning']}",
            'border_radius': RADIUS['md'],
            'padding': SPACING['md'],
            'color': COLORS['text_primary']
        },
        
        'alert_info': {
            'background': f"{COLORS['info']}15",
            'border_left': f"5px solid {COLORS['info']}",
            'border_radius': RADIUS['md'],
            'padding': SPACING['md'],
            'color': COLORS['text_primary']
        },
        
        'alert_success': {
            'background': f"{COLORS['success']}15",
            'border_left': f"5px solid {COLORS['success']}",
            'border_radius': RADIUS['md'],
            'padding': SPACING['md'],
            'color': COLORS['text_primary']
        }
    }
    
    # Icons (emoji-based for simplicity, can be replaced with icon library)
    ICONS = {
        # Navigation
        'home': '🏠',
        'dashboard': '📊',
        'patient': '👤',
        'patients': '👥',
        'calendar': '📅',
        'settings': '⚙️',
        'logout': '🚪',
        
        # Medical
        'heart': '❤️',
        'medication': '💊',
        'syringe': '💉',
        'thermometer': '🌡️',
        'stethoscope': '🩺',
        'ambulance': '🚑',
        'hospital': '🏥',
        
        # Alerts & Status
        'alert': '🚨',
        'warning': '⚠️',
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'check': '✓',
        'cross': '✗',
        
        # Actions
        'add': '➕',
        'edit': '✏️',
        'delete': '🗑️',
        'save': '💾',
        'download': '⬇️',
        'upload': '⬆️',
        'search': '🔍',
        'filter': '🔽',
        'refresh': '🔄',
        
        # Communication
        'message': '💬',
        'email': '📧',
        'phone': '📞',
        'notification': '🔔',
        
        # Emotional Support
        'heart_hands': '🫶',
        'dove': '🕊️',
        'candle': '🕯️',
        'flower': '🌸',
        'ribbon': '🎗️',
        'star': '⭐',
        
        # Documents
        'document': '📄',
        'folder': '📁',
        'chart': '📈',
        'report': '📋',
        'clipboard': '📋',
        
        # Time
        'clock': '🕐',
        'hourglass': '⏳',
        'timer': '⏱️',
        
        # Misc
        'lock': '🔒',
        'unlock': '🔓',
        'key': '🔑',
        'shield': '🛡️',
        'lightbulb': '💡',
        'question': '❓',
        'exclamation': '❗'
    }
    
    @classmethod
    def get_css(cls) -> str:
        """Generate CSS for the design system"""
        return f"""
        <style>
        /* Design System CSS */
        :root {{
            /* Colors */
            --color-primary: {cls.COLORS['primary']};
            --color-success: {cls.COLORS['success']};
            --color-warning: {cls.COLORS['warning']};
            --color-danger: {cls.COLORS['danger']};
            --color-info: {cls.COLORS['info']};
            
            /* Typography */
            --font-family: {cls.TYPOGRAPHY['font_family']};
            --font-size-base: {cls.TYPOGRAPHY['font_sizes']['base']};
            --line-height-normal: {cls.TYPOGRAPHY['line_heights']['normal']};
            
            /* Spacing */
            --spacing-sm: {cls.SPACING['sm']};
            --spacing-md: {cls.SPACING['md']};
            --spacing-lg: {cls.SPACING['lg']};
            
            /* Radius */
            --radius-md: {cls.RADIUS['md']};
            --radius-lg: {cls.RADIUS['lg']};
            
            /* Shadows */
            --shadow-md: {cls.SHADOWS['md']};
            --shadow-lg: {cls.SHADOWS['lg']};
        }}
        
        /* Global Styles */
        body {{
            font-family: var(--font-family);
            font-size: var(--font-size-base);
            line-height: var(--line-height-normal);
            color: {cls.COLORS['text_primary']};
            background-color: {cls.COLORS['bg_secondary']};
        }}
        
        /* Card Component */
        .aura-card {{
            background: {cls.COMPONENTS['card']['background']};
            border-radius: {cls.COMPONENTS['card']['border_radius']};
            padding: {cls.COMPONENTS['card']['padding']};
            box-shadow: {cls.COMPONENTS['card']['shadow']};
            border: {cls.COMPONENTS['card']['border']};
            margin-bottom: var(--spacing-md);
        }}
        
        /* Button Components */
        .aura-button-primary {{
            background: {cls.COMPONENTS['button_primary']['background']};
            color: {cls.COMPONENTS['button_primary']['color']};
            border-radius: {cls.COMPONENTS['button_primary']['border_radius']};
            padding: {cls.COMPONENTS['button_primary']['padding']};
            font-weight: {cls.COMPONENTS['button_primary']['font_weight']};
            border: none;
            cursor: pointer;
            transition: {cls.COMPONENTS['button_primary']['transition']};
        }}
        
        .aura-button-primary:hover {{
            background: {cls.COLORS['primary_dark']};
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }}
        
        /* Alert Components */
        .aura-alert-critical {{
            background: {cls.COMPONENTS['alert_critical']['background']};
            border-left: {cls.COMPONENTS['alert_critical']['border_left']};
            border-radius: {cls.COMPONENTS['alert_critical']['border_radius']};
            padding: {cls.COMPONENTS['alert_critical']['padding']};
            margin-bottom: var(--spacing-md);
        }}
        
        .aura-alert-warning {{
            background: {cls.COMPONENTS['alert_warning']['background']};
            border-left: {cls.COMPONENTS['alert_warning']['border_left']};
            border-radius: {cls.COMPONENTS['alert_warning']['border_radius']};
            padding: {cls.COMPONENTS['alert_warning']['padding']};
            margin-bottom: var(--spacing-md);
        }}
        
        /* Animations */
        @keyframes slideIn {{
            from {{
                opacity: 0;
                transform: translateY(-10px);
            }}
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}
        
        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}
        
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.5; }}
        }}
        
        .animate-slide-in {{
            animation: slideIn 0.3s ease-out;
        }}
        
        .animate-fade-in {{
            animation: fadeIn 0.5s ease-in;
        }}
        
        .animate-pulse {{
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }}
        
        /* Responsive Design */
        @media (max-width: {cls.BREAKPOINTS['tablet']}) {{
            :root {{
                --font-size-base: 14px;
                --spacing-md: 12px;
                --spacing-lg: 20px;
            }}
        }}
        </style>
        """
    
    @classmethod
    def apply_theme(cls):
        """Apply design system theme to Streamlit app"""
        st.markdown(cls.get_css(), unsafe_allow_html=True)
    
    @classmethod
    def get_color(cls, color_name: str) -> str:
        """Get color value by name"""
        return cls.COLORS.get(color_name, cls.COLORS['primary'])
    
    @classmethod
    def get_icon(cls, icon_name: str) -> str:
        """Get icon by name"""
        return cls.ICONS.get(icon_name, '•')

# Singleton instance
_design_system = DesignSystem()

def get_design_system() -> DesignSystem:
    """Get design system instance"""
    return _design_system
