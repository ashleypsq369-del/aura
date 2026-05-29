#!/usr/bin/env python3
"""Setup demo users for beautiful login page"""
import sqlite3
import hashlib

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

conn = sqlite3.connect('aura.db')
cursor = conn.cursor()

# Add email column if it doesn't exist
try:
    cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
    print("✓ Added email column to users table")
except:
    print("✓ Email column already exists")

# Create demo users
demo_users = [
    ('doctor', 'doctor123', 'doctor@projectaura.com', 'provider'),
    ('patient', 'patient123', 'patient@projectaura.com', 'patient'),
    ('caregiver', 'caregiver123', 'caregiver@projectaura.com', 'caregiver'),
    ('admin', 'admin123', 'admin@projectaura.com', 'admin')
]

for username, password, email, role in demo_users:
    try:
        cursor.execute(
            "INSERT OR REPLACE INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
            (username, hash_password(password), email, role)
        )
        print(f"✓ Created demo user: {username}")
    except Exception as e:
        print(f"✗ Error creating {username}: {e}")

conn.commit()
conn.close()

print("\n✅ Demo users ready!")
print("\nLogin credentials:")
print("  doctor / doctor123")
print("  patient / patient123")
print("  caregiver / caregiver123")
