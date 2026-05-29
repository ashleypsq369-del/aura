"""
Custom SVG Icons for Healthcare Platform
Original designs for hospice care application
"""

def get_icon_svg(icon_name, size=24, color="#2C5282"):
    """Get SVG code for custom icons"""
    
    icons = {
        'medication': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12h16M12 4v16" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="8" stroke="{color}" stroke-width="2" fill="none"/>
            </svg>
        ''',
        
        'heart': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                      fill="{color}" opacity="0.2" stroke="{color}" stroke-width="2"/>
            </svg>
        ''',
        
        'calendar': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M3 10h18M8 2v4M16 2v4" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'user': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'alert': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" 
                      stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M12 9v4M12 17h.01" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'check': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'clock': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M12 6v6l4 2" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'document': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'chart': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3v18h18" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
                <path d="M7 16l4-4 4 4 6-6" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'message': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" 
                      stroke="{color}" stroke-width="2" fill="none"/>
            </svg>
        ''',
        
        'settings': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'home': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M9 22V12h6v10" stroke="{color}" stroke-width="2"/>
            </svg>
        ''',
        
        'memory': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="{color}" stroke-width="2" fill="none"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="{color}"/>
                <path d="M21 15l-5-5L5 21" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'journal': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" 
                      stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M8 7h8M8 11h8M8 15h5" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'care': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="{color}" stroke-width="2"/>
                <circle cx="9" cy="7" r="4" stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" 
                      stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'dove': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" 
                      stroke="{color}" stroke-width="2" fill="none"/>
                <path d="M8 12h8M12 8v8" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        '''
    }
    
    return icons.get(icon_name, icons['home'])


def render_icon(icon_name, size=24, color="#2C5282"):
    """Render an SVG icon inline"""
    return get_icon_svg(icon_name, size, color)


# Icon library for easy access
ICONS = {
    'medication': '💊',
    'calendar': '📅',
    'user': '👤',
    'alert': '🔔',
    'check': '✅',
    'clock': '⏰',
    'document': '📄',
    'chart': '📊',
    'message': '💬',
    'settings': '⚙️',
    'home': '🏠',
    'memory': '📸',
    'journal': '📔',
    'care': '👥',
    'dove': '🕊️',
    'heart': '❤️'
}


def get_emoji_icon(icon_name):
    """Get emoji icon"""
    return ICONS.get(icon_name, '📌')
