"""Create missing database tables for Phase 3"""
import sqlite3

DB_PATH = 'aura.db'

print("Creating missing database tables...\n")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Caregiver Notes table
cursor.execute('''
CREATE TABLE IF NOT EXISTS caregiver_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    caregiver_id INTEGER,
    note_type TEXT,
    note_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
)
''')
print("✓ Created caregiver_notes table")

# Memories table
cursor.execute('''
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    memory_date TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
)
''')
print("✓ Created memories table")

# Journal Entries table
cursor.execute('''
CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    entry_text TEXT NOT NULL,
    mood TEXT,
    sentiment_score REAL,
    entry_date TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
)
''')
print("✓ Created journal_entries table")

# Care Plan Goals table
cursor.execute('''
CREATE TABLE IF NOT EXISTS care_plan_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    goal_text TEXT NOT NULL,
    category TEXT,
    target_date TEXT,
    priority TEXT,
    status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
)
''')
print("✓ Created care_plan_goals table")

# Care Plan Interventions table
cursor.execute('''
CREATE TABLE IF NOT EXISTS care_plan_interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    intervention_text TEXT NOT NULL,
    frequency TEXT,
    status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
)
''')
print("✓ Created care_plan_interventions table")

# Functional Assessments table
cursor.execute('''
CREATE TABLE IF NOT EXISTS functional_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    mobility TEXT,
    self_care TEXT,
    eating TEXT,
    orientation TEXT,
    communication TEXT,
    pain_level INTEGER,
    comfort_level TEXT,
    notes TEXT,
    assessment_date TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
)
''')
print("✓ Created functional_assessments table")

conn.commit()
conn.close()

print("\n✅ All missing tables created successfully!")
print("\nDatabase now includes:")
print("  • caregiver_notes - Daily care logs")
print("  • memories - Memory vault entries")
print("  • journal_entries - Personal journal")
print("  • care_plan_goals - Care plan goals")
print("  • care_plan_interventions - Care interventions")
print("  • functional_assessments - Functional status tracking")
