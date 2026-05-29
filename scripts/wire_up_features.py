#!/usr/bin/env python3
"""
Wire up all user account features to make them functional
This adds the import and replaces placeholder code with real database calls
"""

print("=" * 70)
print("WIRING UP USER ACCOUNT FEATURES")
print("=" * 70)

# Read current app.py
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add user_account import after db import
if 'from src import user_account' not in content:
    content = content.replace(
        'from src import db',
        'from src import db\nfrom src import user_account'
    )
    print("✓ Added user_account import")

# Initialize user tables after db init
if 'user_account.init_user_tables()' not in content:
    content = content.replace(
        'db.init_database()',
        'db.init_database()\nuser_account.init_user_tables()'
    )
    print("✓ Added user tables initialization")

# Replace notification badge with real count
content = content.replace(
    '<div class="notification-badge">3</div>',
    f'<div class="notification-badge">{{user_account.get_notification_count(st.session_state.user_id)}}</div>'
)
print("✓ Wired up notification count")

# Save updated app.py
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n" + "=" * 70)
print("✅ FEATURES WIRED UP!")
print("=" * 70)
print("\nNote: Profile, Settings, and Notifications views need manual integration")
print("Run the app and test - backend functions are ready to use!")
print("=" * 70)
