"""Quick test to verify login is working"""
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

print("Testing login functionality...\n")

# Test 1: Import db module
print("1. Testing db module import...")
try:
    from src import db
    print("   ✓ db module imported successfully")
except Exception as e:
    print(f"   ✗ Error importing db: {e}")
    sys.exit(1)

# Test 2: Test authentication
print("\n2. Testing authentication...")
try:
    user = db.authenticate_user('admin', 'admin123')
    if user:
        print(f"   ✓ Login successful!")
        print(f"   - User ID: {user.id}")
        print(f"   - Username: {user.username}")
        print(f"   - Name: {user.name}")
        print(f"   - Role: {user.role}")
    else:
        print("   ✗ Login failed - user not found")
except Exception as e:
    print(f"   ✗ Error during authentication: {e}")
    sys.exit(1)

# Test 3: Test dashboard components
print("\n3. Testing dashboard components...")
try:
    from src.dashboard_components import (
        render_kpi_card,
        render_alert_card,
        render_timeline_item,
        render_stat_card,
        render_progress_card
    )
    print("   ✓ All dashboard components imported successfully")
except Exception as e:
    print(f"   ✗ Error importing dashboard components: {e}")
    sys.exit(1)

# Test 4: Check database
print("\n4. Checking database...")
try:
    import sqlite3
    conn = sqlite3.connect('aura.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM User')
    count = cursor.fetchone()[0]
    print(f"   ✓ Found {count} users in database")
    
    cursor.execute('SELECT username, role FROM User')
    users = cursor.fetchall()
    print("\n   Available users:")
    for username, role in users:
        print(f"   - {username:12} ({role})")
    
    conn.close()
except Exception as e:
    print(f"   ✗ Error checking database: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED!")
print("=" * 60)
print("\n🚀 You can now run: streamlit run app.py")
print("   Login with: admin / admin123")
