"""
Create New Database Tables for All Modules
Phase 2: Database Schema Implementation
"""

import sqlite3
from datetime import datetime

def create_all_tables():
    """Create all new database tables"""
    
    conn = sqlite3.connect('aura.db')
    cursor = conn.cursor()
    
    print("Creating new database tables...")
    
    # 1. Bereavement Journal Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bereavement_journal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        sentiment_score REAL,
        sentiment_classification TEXT,
        grief_stage TEXT,
        vader_compound REAL,
        textblob_polarity REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    print("✓ Created bereavement_journal table")
    
    # 2. Family Contacts Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS family_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        is_primary BOOLEAN DEFAULT 0,
        is_emergency_contact BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
    ''')
    print("✓ Created family_contacts table")
    
    # 3. Appointments Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        provider_id INTEGER,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        appointment_type TEXT NOT NULL,
        location TEXT,
        duration_minutes INTEGER DEFAULT 30,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        reminder_sent BOOLEAN DEFAULT 0,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (provider_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created appointments table")
    
    # 4. Care Tasks Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS care_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        assigned_to INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE,
        due_time TIME,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        completed_at TIMESTAMP,
        completed_by INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (completed_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created care_tasks table")
    
    # 5. Care Goals Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS care_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        goal TEXT NOT NULL,
        category TEXT,
        target_date DATE,
        status TEXT DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        notes TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created care_goals table")
    
    # 6. Memory Items Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS memory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        uploaded_by INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        file_path TEXT,
        caption TEXT,
        memory_date DATE,
        tags TEXT,
        is_shared BOOLEAN DEFAULT 1,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created memory_items table")
    
    # 7. Journal Entries Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        entry_date DATE NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        mood TEXT,
        tags TEXT,
        is_private BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    print("✓ Created journal_entries table")
    
    # 8. Functional Assessments Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS functional_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        assessed_by INTEGER NOT NULL,
        assessment_date DATE NOT NULL,
        mobility TEXT,
        eating TEXT,
        bathing TEXT,
        dressing TEXT,
        toileting TEXT,
        transferring TEXT,
        orientation TEXT,
        memory TEXT,
        communication TEXT,
        independence_score INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (assessed_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created functional_assessments table")
    
    # 9. Medication Schedules Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS medication_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        frequency TEXT NOT NULL,
        route TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        is_prn BOOLEAN DEFAULT 0,
        prn_indication TEXT,
        instructions TEXT,
        prescribed_by INTEGER,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (prescribed_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created medication_schedules table")
    
    # 10. Medication Administration Records Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS medication_administration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        administered_by INTEGER NOT NULL,
        administered_at TIMESTAMP NOT NULL,
        dosage_given TEXT,
        route TEXT,
        notes TEXT,
        effectiveness_rating INTEGER,
        side_effects TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id),
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (administered_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created medication_administration table")
    
    # 11. Care Team Members Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS care_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT 0,
        schedule_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    print("✓ Created care_team_members table")
    
    # 12. Team Messages Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS team_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER,
        message_type TEXT DEFAULT 'general',
        subject TEXT,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (to_user_id) REFERENCES users(id)
    )
    ''')
    print("✓ Created team_messages table")
    
    # 13. Training Scenarios Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS training_scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        difficulty TEXT NOT NULL,
        category TEXT,
        duration_minutes INTEGER,
        objectives TEXT,
        steps TEXT,
        max_attempts INTEGER DEFAULT 3,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created training_scenarios table")
    
    # 14. Simulation Results Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS simulation_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        score INTEGER,
        time_taken_minutes INTEGER,
        passed BOOLEAN,
        feedback TEXT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scenario_id) REFERENCES training_scenarios(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    print("✓ Created simulation_results table")
    
    # 15. Care Plan Documents Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS care_plan_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        file_path TEXT,
        description TEXT,
        uploaded_by INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
    ''')
    print("✓ Created care_plan_documents table")
    
    # Create indexes for better performance
    print("\nCreating indexes...")
    
    try:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bereavement_user ON bereavement_journal(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_patient ON care_tasks(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON care_tasks(assigned_to)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_goals_patient ON care_goals(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_memory_patient ON memory_items(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_functional_patient ON functional_assessments(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_med_schedule_patient ON medication_schedules(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_med_admin_patient ON medication_administration(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_team_patient ON care_team_members(patient_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_patient ON team_messages(patient_id)')
    except Exception as e:
        print(f"Note: Some indexes may already exist: {e}")
    
    print("✓ Created all indexes")
    
    conn.commit()
    conn.close()
    
    print("\n✅ All database tables created successfully!")
    print("\nTables created:")
    print("  1. bereavement_journal")
    print("  2. family_contacts")
    print("  3. appointments")
    print("  4. care_tasks")
    print("  5. care_goals")
    print("  6. memory_items")
    print("  7. journal_entries")
    print("  8. functional_assessments")
    print("  9. medication_schedules")
    print(" 10. medication_administration")
    print(" 11. care_team_members")
    print(" 12. team_messages")
    print(" 13. training_scenarios")
    print(" 14. simulation_results")
    print(" 15. care_plan_documents")

if __name__ == "__main__":
    create_all_tables()
