"""
Script to check and fix the database structure for Project Aura
"""
import sqlite3
import hashlib
import os

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def check_and_fix_database():
    """Check and fix database structure"""
    db_path = 'aura.db'
    
    print(f"Checking database: {db_path}")
    
    if not os.path.exists(db_path):
        print("Database file not found!")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
    """)
    
    if cursor.fetchone():
        print("✓ Users table exists")
        
        # Check table structure
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print(f"  Current columns: {', '.join(column_names)}")
        
        # Check if we need to migrate
        if 'password_hash' in column_names and 'password' not in column_names:
            print("\n⚠ Old schema detected. Migrating...")
            
            # Create new table with correct schema
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    full_name TEXT,
                    role TEXT NOT NULL,
                    email TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Copy data from old table
            cursor.execute("""
                INSERT INTO users_new (id, username, password, full_name, role, email, created_at)
                SELECT id, username, password_hash, name, role, email, created_at
                FROM users
            """)
            
            # Drop old table and rename new one
            cursor.execute("DROP TABLE users")
            cursor.execute("ALTER TABLE users_new RENAME TO users")
            
            print("✓ Migration complete!")
        
        elif 'password' in column_names:
            print("✓ Schema is correct")
        
        # Check if demo users exist
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"\n✓ Found {user_count} users in database")
        
        if user_count == 0:
            print("\n⚠ No users found. Creating demo users...")
            
            demo_users = [
                ('clinician', 'clinician123', 'Dr. Sarah Chen', 'clinician', 'clinician@aura.demo'),
                ('patient', 'patient123', 'John Smith', 'patient', 'patient@aura.demo'),
                ('family', 'family123', 'Mary Smith', 'family', 'family@aura.demo'),
                ('admin', 'admin123', 'Admin User', 'admin', 'admin@aura.demo'),
            ]
            
            for username, password, full_name, role, email in demo_users:
                password_hash = hash_password(password)
                cursor.execute("""
                    INSERT INTO users (username, password, full_name, role, email)
                    VALUES (?, ?, ?, ?, ?)
                """, (username, password_hash, full_name, role, email))
                print(f"  ✓ Created user: {username}")
        
        # Show existing users
        cursor.execute("SELECT username, role FROM users")
        users = cursor.fetchall()
        print("\n✓ Available users:")
        for user in users:
            print(f"  - {user[0]} ({user[1]})")
    
    else:
        print("✗ Users table does not exist!")
        print("\nCreating users table...")
        
        cursor.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                role TEXT NOT NULL,
                email TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("✓ Users table created")
        
        # Create demo users
        print("\nCreating demo users...")
        demo_users = [
            ('clinician', 'clinician123', 'Dr. Sarah Chen', 'clinician', 'clinician@aura.demo'),
            ('patient', 'patient123', 'John Smith', 'patient', 'patient@aura.demo'),
            ('family', 'family123', 'Mary Smith', 'family', 'family@aura.demo'),
            ('admin', 'admin123', 'Admin User', 'admin', 'admin@aura.demo'),
        ]
        
        for username, password, full_name, role, email in demo_users:
            password_hash = hash_password(password)
            cursor.execute("""
                INSERT INTO users (username, password, full_name, role, email)
                VALUES (?, ?, ?, ?, ?)
            """, (username, password_hash, full_name, role, email))
            print(f"  ✓ Created user: {username}")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Database check complete!")
    return True

if __name__ == '__main__':
    check_and_fix_database()
