#!/usr/bin/env python3
"""Fix users table structure"""
import sqlite3
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

conn = sqlite3.connect('aura.db')
cursor = conn.cursor()

# Check current table structure
cursor.execute("PRAGMA table_info(users)")
columns = cursor.fetchall()
print("Current users table structure:")
for col in columns:
    print(f"  {col}")

# Drop and recreate users table with correct structure
cursor.execute("DROP TABLE IF EXISTS users")
cursor.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("\n✓ Recreated users table with correct structure")

# Create demo users
demo_users = [
    ('doctor', 'doctor123', 'doctor@projectaura.com', 'provider'),
    ('patient', 'patient123', 'patient@projectaura.com', 'patient'),
    ('caregiver', 'caregiver123', 'caregiver@projectaura.com', 'caregiver'),
    ('admin', 'admin123', 'admin@projectaura.com', 'admin')
]

for username, password, email, role in demo_users:
    cursor.execute(
        "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
        (username, hash_password(password), email, role)
    )
    print(f"✓ Created demo user: {username}")

conn.commit()
conn.close()

print("\n✅ Users table fixed and demo users created!")
