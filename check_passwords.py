"""
Check user passwords in the database
"""
import sqlite3
import hashlib

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

conn = sqlite3.connect('aura.db')
cursor = conn.cursor()

# Get all users
cursor.execute("SELECT username, password FROM users")
users = cursor.fetchall()

print("Checking user passwords:\n")

test_passwords = ['clinician123', 'patient123', 'family123', 'admin123', 'caregiver123']

for username, stored_hash in users:
    print(f"User: {username}")
    print(f"  Stored hash: {stored_hash[:20]}...")
    
    # Try common passwords
    for test_pwd in test_passwords:
        if hash_password(test_pwd) == stored_hash:
            print(f"  ✓ Password is: {test_pwd}")
            break
    else:
        print(f"  ✗ Password not in common list")
    print()

conn.close()
