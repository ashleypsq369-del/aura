"""
Custom SVG Icon Library for Healthcare Platform
Original icons designed for hospice care
"""

def get_icon(name, size=24, color="currentColor"):
    """Get SVG icon by name"""
    
    icons = {
        'heart_pulse': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                      stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.5 12h6l2-3 2 6 2-3h5.5" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'pill': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 16.5c-1.5 1.5-1.5 4 0 5.5s4 1.5 5.5 0l7-7c1.5-1.5 1.5-4 0-5.5s-4-1.5-5.5 0l-7 7z" 
                      stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.5 8.5l7 7" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'calendar_check': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="{color}" stroke-width="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
                <path d="M9 16l2 2 4-4" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'user_care': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="{color}" stroke-width="2"/>
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 12v3M10.5 13.5l3 3M13.5 13.5l-3 3" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'clipboard_list': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="2" width="8" height="4" rx="1" stroke="{color}" stroke-width="2"/>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" 
                      stroke="{color}" stroke-width="2"/>
                <path d="M9 12h6M9 16h6" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'photo_album': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="{color}" stroke-width="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="{color}"/>
                <path d="M21 15l-5-5L5 21" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'journal': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" 
                      stroke="{color}" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 7h8M8 11h8M8 15h5" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'activity': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'alert_circle': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="{color}" stroke-width="2"/>
                <path d="M12 8v4M12 16h.01" stroke="{color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        ''',
        
        'check_circle': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="{color}" stroke-width="2"/>
                <path d="M9 12l2 2 4-4" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'trending_up': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 6l-9.5 9.5-5-5L1 18" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 6h6v6" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'message_circle': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" 
                      stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        ''',
        
        'dove': f'''
            <svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 6 8.3c-2 1.2-3 3.2-3 5.7 0 3.3 2.7 6 6 6h6c3.3 0 6-2.7 6-6 0-2.5-1-4.5-3-5.7a3.6 3.6 0 0 0-3-3.6c-.6-1.1-1.8-1.7-3-1.7z" 
                      stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="9" cy="10" r="1" fill="{color}"/>
            </svg>
        '''
    }
    
    return icons.get(name, '')


def render_icon(name, size=24, color="currentColor", inline=True):
    """Render an icon with optional inline display"""
    icon_svg = get_icon(name, size, color)
    style = 'display: inline-block; vertical-align: middle;' if inline else ''
    return f'<span style="{style}">{icon_svg}</span>'
