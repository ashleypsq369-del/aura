"""
Fix Login Issues - Create Demo Users and Verify Database
"""
import sqlite3
import hashlib
from datetime import datetime

DB_PATH = 'aura.db'

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_users_table():
    """Create or recreate users table"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create User table if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS User (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            email TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✓ User table created/verified")

def clear_existing_users():
    """Clear existing users"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM User')
    
    conn.commit()
    conn.close()
    print("✓ Cleared existing users")

def create_demo_users():
    """Create demo users with known credentials"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    demo_users = [
        ('admin', 'admin123', 'Admin User', 'admin', 'admin@projectaura.com'),
        ('doctor', 'doctor123', 'Dr. Smith', 'doctor', 'doctor@projectaura.com'),
        ('nurse', 'nurse123', 'Nurse Johnson', 'nurse', 'nurse@projectaura.com'),
        ('caregiver', 'caregiver123', 'Caregiver Brown', 'caregiver', 'caregiver@projectaura.com'),
        ('family', 'family123', 'Family Member', 'family', 'family@projectaura.com'),
        ('patient', 'patient123', 'Patient Doe', 'patient', 'patient@projectaura.com'),
    ]
    
    for username, password, name, role, email in demo_users:
        hashed_password = hash_password(password)
        
        try:
            cursor.execute('''
                INSERT INTO User (username, password, name, role, email, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (username, hashed_password, name, role, email, datetime.now().isoformat()))
            
            print(f"✓ Created user: {username} / {password} ({role})")
        except sqlite3.IntegrityError:
            print(f"⚠ User {username} already exists")
    
    conn.commit()
    conn.close()

def verify_users():
    """Verify users were created"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT username, name, role FROM User')
    users = cursor.fetchall()
    
    print("\n📋 Current Users in Database:")
    print("-" * 60)
    for username, name, role in users:
        print(f"  {username:15} | {name:20} | {role}")
    print("-" * 60)
    print(f"Total users: {len(users)}")
    
    conn.close()

def test_login(username, password):
    """Test login with credentials"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    hashed_password = hash_password(password)
    
    cursor.execute('''
        SELECT user_id, username, name, role 
        FROM User 
        WHERE username = ? AND password = ?
    ''', (username, hashed_password))
    
    user = cursor.fetchone()
    conn.close()
    
    if user:
        print(f"✓ Login successful: {username}")
        return True
    else:
        print(f"✗ Login failed: {username}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("FIXING LOGIN ISSUES")
    print("=" * 60)
    
    print("\n1. Creating/verifying User table...")
    create_users_table()
    
    print("\n2. Clearing existing users...")
    clear_existing_users()
    
    print("\n3. Creating demo users...")
    create_demo_users()
    
    print("\n4. Verifying users...")
    verify_users()
    
    print("\n5. Testing logins...")
    print("-" * 60)
    test_login('admin', 'admin123')
    test_login('doctor', 'doctor123')
    test_login('caregiver', 'caregiver123')
    test_login('family', 'family123')
    test_login('patient', 'patient123')
    
    print("\n" + "=" * 60)
    print("✅ LOGIN FIX COMPLETE!")
    print("=" * 60)
    
    print("\n🔑 Demo Credentials:")
    print("-" * 60)
    print("  admin      / admin123      (Administrator)")
    print("  doctor     / doctor123     (Doctor)")
    print("  nurse      / nurse123      (Nurse)")
    print("  caregiver  / caregiver123  (Caregiver)")
    print("  family     / family123     (Family Member)")
    print("  patient    / patient123    (Patient)")
    print("-" * 60)
    
    print("\n🚀 Now run: streamlit run app.py")
    print("   Then login with any of the credentials above")
