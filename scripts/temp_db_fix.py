
import sqlite3
import os

db_path = 'aura.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create medications table if not exists
cursor.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
""")

# Create alerts table if not exists
cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        resolved INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
""")

conn.commit()
conn.close()
print("  ✓ Database tables verified")
