"""
Setup Demo Users Script
Creates test users for each role if they don't exist
"""

import sqlite3
import hashlib
from datetime import datetime

def hash_password(password):
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def setup_demo_users():
    """Create demo users for testing"""
    conn = sqlite3.connect('aura.db')
    cursor = conn.cursor()
    
    # Check if User table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='User'")
    if not cursor.fetchone():
        print("Creating User table...")
        cursor.execute("""
            CREATE TABLE User (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                email TEXT,
                created_at TEXT
            )
        """)
    
    # Demo users to create
    demo_users = [
        ('admin', 'admin123', 'Admin User', 'admin', 'admin@projectaura.com'),
        ('clinician', 'clinician123', 'Dr. Sarah Johnson', 'clinician', 'clinician@projectaura.com'),
        ('caregiver', 'caregiver123', 'Mary Smith', 'caregiver', 'caregiver@projectaura.com'),
        ('patient', 'patient123', 'John Doe', 'patient', 'patient@projectaura.com'),
        ('family', 'family123', 'Jane Doe', 'family', 'family@projectaura.com'),
    ]
    
    created_count = 0
    for username, password, name, role, email in demo_users:
        try:
            hashed_pw = hash_password(password)
            cursor.execute("""
                INSERT INTO User (username, password_hash, name, role, email, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (username, hashed_pw, name, role, email, datetime.now().isoformat()))
            created_count += 1
            print(f"✅ Created user: {username} (Role: {role})")
        except sqlite3.IntegrityError:
            print(f"⚠️  User already exists: {username}")
    
    conn.commit()
    
    # Display all users
    print("\n📋 All users in database:")
    cursor.execute("SELECT username, name, role FROM User")
    users = cursor.fetchall()
    for user in users:
        print(f"   Username: {user[0]:<15} Name: {user[1]:<20} Role: {user[2]}")
    
    conn.close()
    
    print(f"\n✅ Setup complete! Created {created_count} new users.")
    print("\n🔐 Login credentials:")
    print("   Username: admin      Password: admin123")
    print("   Username: clinician  Password: clinician123")
    print("   Username: caregiver  Password: caregiver123")
    print("   Username: patient    Password: patient123")
    print("   Username: family     Password: family123")

if __name__ == "__main__":
    setup_demo_users()
