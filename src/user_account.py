"""
User Account Management Module
Handles profile updates, settings, notifications, and preferences
"""
import sqlite3
import hashlib
import json
from datetime import datetime

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect('aura.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Hash password for security"""
    return hashlib.sha256(password.encode()).hexdigest()

# ============= USER PROFILE =============

def get_user_profile(user_id):
    """Get user profile data"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, role, full_name, phone, date_of_birth, 
               gender, address, profile_picture, created_at
        FROM users WHERE id = ?
    """, (user_id,))
    profile = cursor.fetchone()
    conn.close()
    return dict(profile) if profile else None

def update_user_profile(user_id, full_name, email, phone, date_of_birth, gender, address):
    """Update user profile information"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users 
            SET full_name = ?, email = ?, phone = ?, date_of_birth = ?, 
                gender = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (full_name, email, phone, date_of_birth, gender, address, user_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating profile: {e}")
        return False

def update_profile_picture(user_id, picture_data):
    """Update user profile picture"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (picture_data, user_id))
        conn.commit()
        conn.close()
        return True
    except:
        return False

# ============= PASSWORD MANAGEMENT =============

def change_password(user_id, current_password, new_password):
    """Change user password"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Verify current password
        cursor.execute("SELECT password FROM users WHERE id = ?", (user_id,))
        result = cursor.fetchone()
        
        if not result or result[0] != hash_password(current_password):
            conn.close()
            return False, "Current password is incorrect"
        
        # Update to new password
        cursor.execute("""
            UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (hash_password(new_password), user_id))
        conn.commit()
        conn.close()
        return True, "Password updated successfully"
    except Exception as e:
        return False, f"Error: {str(e)}"

# ============= USER SETTINGS =============

def get_user_settings(user_id):
    """Get user settings/preferences"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT settings FROM user_settings WHERE user_id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    
    if result and result[0]:
        return json.loads(result[0])
    else:
        # Return default settings
        return {
            'theme': 'Light Mode',
            'color_scheme': 'Purple (Default)',
            'font_size': 14,
            'animations': True,
            'compact_mode': False,
            'email_notifications': True,
            'push_notifications': True,
            'sms_alerts': False,
            'notify_patient_alerts': True,
            'notify_appointments': True,
            'notify_medications': True,
            'notify_system_updates': False,
            'language': 'English',
            'timezone': 'UTC-5 (EST)',
            'date_format': 'MM/DD/YYYY',
            'time_format': '12-hour',
            'two_factor_enabled': False
        }

def save_user_settings(user_id, settings):
    """Save user settings/preferences"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        settings_json = json.dumps(settings)
        
        # Insert or update settings
        cursor.execute("""
            INSERT INTO user_settings (user_id, settings, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                settings = excluded.settings,
                updated_at = CURRENT_TIMESTAMP
        """, (user_id, settings_json))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False

# ============= NOTIFICATIONS =============

def get_user_notifications(user_id, unread_only=False):
    """Get user notifications"""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT id, user_id, type, title, message, priority, is_read, created_at
        FROM notifications
        WHERE user_id = ?
    """
    
    if unread_only:
        query += " AND is_read = 0"
    
    query += " ORDER BY created_at DESC LIMIT 50"
    
    cursor.execute(query, (user_id,))
    notifications = cursor.fetchall()
    conn.close()
    
    return [dict(n) for n in notifications]

def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (notification_id,))
        conn.commit()
        conn.close()
        return True
    except:
        return False

def mark_all_notifications_read(user_id):
    """Mark all notifications as read for a user"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND is_read = 0
        """, (user_id,))
        conn.commit()
        conn.close()
        return True
    except:
        return False

def create_notification(user_id, notification_type, title, message, priority='normal'):
    """Create a new notification"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO notifications (user_id, type, title, message, priority, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        """, (user_id, notification_type, title, message, priority))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating notification: {e}")
        return False

def get_notification_count(user_id, unread_only=True):
    """Get count of notifications"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if unread_only:
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,))
    else:
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ?", (user_id,))
    
    count = cursor.fetchone()[0]
    conn.close()
    return count

# ============= SESSION MANAGEMENT =============

def logout_all_sessions(user_id):
    """Logout user from all devices (clear all sessions)"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM user_sessions WHERE user_id = ?
        """, (user_id,))
        conn.commit()
        conn.close()
        return True
    except:
        return False

# ============= DATABASE INITIALIZATION =============

def init_user_tables():
    """Initialize user-related tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Add columns to users table if they don't exist
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN full_name TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN date_of_birth TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN gender TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN address TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN profile_picture TEXT")
    except:
        pass
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP")
    except:
        pass
    
    # Create user_settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            settings TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Create notifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            priority TEXT DEFAULT 'normal',
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Create user_sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_token TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    conn.commit()
    conn.close()
    print("✓ User account tables initialized")
