"""Check what users exist in the database"""
import sqlite3
import hashlib

conn = sqlite3.connect('aura.db')
cursor = conn.cursor()

# Check table structure
print("📋 User table structure:")
cursor.execute("PRAGMA table_info(User)")
columns = cursor.fetchall()
for col in columns:
    print(f"   {col[1]} ({col[2]})")

print("\n👥 All users in database:")
cursor.execute("SELECT * FROM User")
users = cursor.fetchall()

if not users:
    print("   ⚠️  No users found!")
else:
    for user in users:
        print(f"\n   User ID: {user[0]}")
        print(f"   Username: {user[1]}")
        print(f"   Password Hash: {user[2][:20]}...")
        print(f"   Name: {user[3]}")
        print(f"   Role: {user[4]}")

# Test password hash
test_password = "admin123"
test_hash = hashlib.sha256(test_password.encode()).hexdigest()
print(f"\n🔐 Test hash for 'admin123': {test_hash[:20]}...")

# Check if admin exists with correct hash
cursor.execute("SELECT * FROM User WHERE username = 'admin'")
admin = cursor.fetchone()
if admin:
    print(f"\n✅ Admin user found!")
    print(f"   Stored hash: {admin[2][:20]}...")
    print(f"   Test hash:   {test_hash[:20]}...")
    print(f"   Match: {admin[2] == test_hash}")
else:
    print("\n❌ Admin user NOT found!")

conn.close()
