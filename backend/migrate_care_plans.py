"""Migrate care_plans table to add new columns."""
import sqlite3

conn = sqlite3.connect('aura.db')
cur  = conn.cursor()

cur.execute('PRAGMA table_info(care_plans)')
cols = [row[1] for row in cur.fetchall()]
print('Existing columns:', cols)

migrations = [
    ('ai_generated',    'BOOLEAN DEFAULT 0'),
    ('ai_generated_at', 'DATETIME'),
    ('ai_confidence',   'FLOAT DEFAULT 0.0'),
    ('disease_profile', 'VARCHAR(100)'),
    ('care_phase',      'VARCHAR(30) DEFAULT "stable"'),
    ('overall_notes',   'TEXT'),
]

for col, coldef in migrations:
    if col not in cols:
        sql = f'ALTER TABLE care_plans ADD COLUMN {col} {coldef}'
        cur.execute(sql)
        print(f'  Added: {col}')
    else:
        print(f'  Already exists: {col}')

# Also ensure extended tables exist
extended = [
    ('care_plan_goals', '''
        CREATE TABLE IF NOT EXISTS care_plan_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            care_plan_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            title VARCHAR(300) NOT NULL,
            description TEXT,
            category VARCHAR(50) DEFAULT "symptom",
            priority VARCHAR(20) DEFAULT "medium",
            status VARCHAR(20) DEFAULT "pending",
            progress INTEGER DEFAULT 0,
            target_date DATETIME,
            achieved_date DATETIME,
            ai_suggested BOOLEAN DEFAULT 0,
            created_by INTEGER,
            last_reviewed_by INTEGER,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    '''),
    ('care_plan_checklist_items', '''
        CREATE TABLE IF NOT EXISTS care_plan_checklist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            task VARCHAR(500) NOT NULL,
            frequency VARCHAR(30) DEFAULT "daily",
            is_completed BOOLEAN DEFAULT 0,
            completed_at DATETIME,
            completed_by INTEGER,
            due_date DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    '''),
    ('care_plan_interventions', '''
        CREATE TABLE IF NOT EXISTS care_plan_interventions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            care_plan_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            name VARCHAR(300) NOT NULL,
            category VARCHAR(50) DEFAULT "therapy",
            description TEXT,
            frequency VARCHAR(100),
            responsible_role VARCHAR(50) DEFAULT "clinician",
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_date DATETIME,
            status VARCHAR(20) DEFAULT "active",
            ai_suggested BOOLEAN DEFAULT 0,
            outcome TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    '''),
]

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
existing_tables = [r[0] for r in cur.fetchall()]

for table_name, create_sql in extended:
    if table_name not in existing_tables:
        cur.execute(create_sql)
        print(f'  Created table: {table_name}')
    else:
        print(f'  Table exists: {table_name}')

conn.commit()
conn.close()
print('Migration complete!')
