"""Check all tables in database"""
import sqlite3

conn = sqlite3.connect('aura.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()

print("📋 All tables in database:")
for table in tables:
    print(f"  - {table[0]}")
    
    # Check if it's a user-related table
    if 'user' in table[0].lower():
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"    ({count} rows)")
        
        if count > 0:
            cursor.execute(f"SELECT * FROM {table[0]} LIMIT 1")
            sample = cursor.fetchone()
            print(f"    Sample: {sample}")

conn.close()
