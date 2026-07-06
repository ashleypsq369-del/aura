"""
Migration: Add care_setting and professional verification fields to users table.
Run once: python migrate_care_setting.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'aura.db')
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

migrations = [
    # Care setting chosen at registration (patient/family)
    "ALTER TABLE users ADD COLUMN care_setting VARCHAR(50)",
    # Professional verification badge
    "ALTER TABLE users ADD COLUMN is_professional BOOLEAN DEFAULT 0",
    # Professional badge label (e.g. 'Verified Clinician', 'Registered Nurse')
    "ALTER TABLE users ADD COLUMN professional_title VARCHAR(100)",
    # Care setting change request (pending admin approval)
    "ALTER TABLE users ADD COLUMN care_setting_change_request VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN care_setting_change_reason TEXT",
]

for sql in migrations:
    try:
        cur.execute(sql)
        col = sql.split('ADD COLUMN')[1].strip().split()[0]
        print(f'✅ Added column: {col}')
    except sqlite3.OperationalError as e:
        if 'duplicate column' in str(e).lower():
            col = sql.split('ADD COLUMN')[1].strip().split()[0]
            print(f'⏭️  Already exists: {col}')
        else:
            print(f'❌ Error: {e}')

conn.commit()
conn.close()
print('\nMigration complete.')
