"""Fix user tables - copy from User to users"""
import sqlite3

conn = sqlite3.connect('aura.db')
cursor = conn.cursor()

# Delete old users from 'users' table
print("🗑️  Deleting old users from 'users' table...")
cursor.execute("DELETE FROM users")
print(f"   Deleted {cursor.rowcount} old users")

# Copy users from 'User' to 'users'
print("\n📋 Copying users from 'User' to 'users'...")
cursor.execute("""
    INSERT INTO users (id, username, password_hash, role, email, created_at)
    SELECT id, username, password_hash, role, email, created_at
    FROM User
""")
print(f"   Copied {cursor.rowcount} users")

conn.commit()

# Verify
print("\n✅ Verification:")
cursor.execute("SELECT username, role FROM users")
users = cursor.fetchall()
for user in users:
    print(f"   - {user[0]} ({user[1]})")

conn.close()
print("\n✅ Users fixed! Try logging in now.")
