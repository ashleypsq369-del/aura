#!/usr/bin/env python3
"""Setup user account features - tables and sample data"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.user_account import init_user_tables, create_notification

print("=" * 70)
print("SETTING UP USER ACCOUNT FEATURES")
print("=" * 70)

# Initialize tables
print("\n[1/2] Creating user account tables...")
init_user_tables()

# Create sample notifications for demo users
print("\n[2/2] Creating sample notifications...")

sample_notifications = [
    (1, 'alert', 'Critical Alert', 'Patient John Doe requires immediate attention', 'critical'),
    (1, 'appointment', 'Appointment Reminder', 'Upcoming appointment with Dr. Smith at 2:00 PM', 'high'),
    (1, 'medication', 'Medication Update', 'New prescription added for Patient Jane Smith', 'normal'),
    (1, 'system', 'System Update', 'New features available in the dashboard', 'low'),
    (2, 'alert', 'Health Check', 'Time for your daily health assessment', 'normal'),
    (2, 'appointment', 'Doctor Visit', 'Your appointment is tomorrow at 10:00 AM', 'high'),
]

for user_id, ntype, title, message, priority in sample_notifications:
    if create_notification(user_id, ntype, title, message, priority):
        print(f"  ✓ Created notification for user {user_id}: {title}")

print("\n" + "=" * 70)
print("✅ USER ACCOUNT FEATURES READY!")
print("=" * 70)

print("\n🎯 Features now functional:")
print("  • Profile updates (save to database)")
print("  • Password changes (with verification)")
print("  • Settings persistence (theme, notifications, etc.)")
print("  • Real notifications from database")
print("  • Session management")

print("\n🚀 Restart Streamlit to use all features!")
print("=" * 70)
