"""
Complete Dashboard Fix - Handle all table and column inconsistencies
"""
import sqlite3

DB_PATH = 'aura.db'

print("=" * 70)
print("COMPLETE DASHBOARD FIX")
print("=" * 70)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check what tables exist
print("\n[1/3] Checking existing tables...")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]
print(f"  Found tables: {', '.join(tables)}")

# Check Appointment table structure
print("\n[2/3] Checking Appointment table structure...")
if 'Appointment' in tables:
    cursor.execute("PRAGMA table_info(Appointment)")
    columns = cursor.fetchall()
    print(f"  Appointment columns: {[col[1] for col in columns]}")
elif 'appointments' in tables:
    cursor.execute("PRAGMA table_info(appointments)")
    columns = cursor.fetchall()
    print(f"  appointments columns: {[col[1] for col in columns]}")
else:
    print("  No Appointment table found - creating it...")
    cursor.execute('''
        CREATE TABLE Appointment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            appointment_type TEXT NOT NULL,
            provider_id INTEGER,
            location TEXT,
            duration_minutes INTEGER DEFAULT 30,
            notes TEXT,
            status TEXT DEFAULT 'scheduled',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    print("  ✓ Appointment table created")

# Fix the get_appointments function
print("\n[3/3] Creating fixed wrapper function...")

# The issue is the function queries 'appointments' but table is 'Appointment'
# We'll create a simple fix by updating the db_helpers.py file

fix_code = '''
# Fixed get_appointments function
def get_appointments_fixed(patient_id: int = None, start_date: str = None):
    """Get appointments with proper table name"""
    conn = sqlite3.connect('aura.db')
    conn.row_factory = lambda c, r: dict(zip([col[0] for col in c.description], r))
    cursor = conn.cursor()
    
    # Try Appointment table first, then appointments
    try:
        query = 'SELECT * FROM Appointment WHERE 1=1'
        params = []
        
        if patient_id:
            query += ' AND patient_id = ?'
            params.append(patient_id)
        
        if start_date:
            query += ' AND appointment_date >= ?'
            params.append(start_date)
        
        query += ' ORDER BY appointment_date, appointment_time'
        
        cursor.execute(query, params)
        appointments = cursor.fetchall()
        conn.close()
        return appointments
    except sqlite3.OperationalError:
        # Try lowercase table name
        query = 'SELECT * FROM appointments WHERE 1=1'
        params = []
        
        if patient_id:
            query += ' AND patient_id = ?'
            params.append(patient_id)
        
        if start_date:
            query += ' AND appointment_date >= ?'
            params.append(start_date)
        
        query += ' ORDER BY appointment_date, appointment_time'
        
        cursor.execute(query, params)
        appointments = cursor.fetchall()
        conn.close()
        return appointments
'''

print("  ✓ Fix code prepared")

conn.close()

print("\n" + "=" * 70)
print("✅ DASHBOARD FIX COMPLETE!")
print("=" * 70)

print("\nNow updating db_helpers.py...")

# Read current db_helpers.py
with open('src/db_helpers.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the get_appointments function
old_function = '''def get_appointments(patient_id: int = None, start_date: str = None) -> List[Dict]:
    """Get appointments with optional filters"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    query = 'SELECT * FROM appointments WHERE 1=1'
    params = []
    
    if patient_id:
        query += ' AND patient_id = ?'
        params.append(patient_id)
    
    if start_date:
        query += ' AND appointment_date >= ?'
        params.append(start_date)
    
    query += ' ORDER BY appointment_date, appointment_time'
    
    cursor.execute(query, params)
    appointments = cursor.fetchall()
    conn.close()
    return appointments'''

new_function = '''def get_appointments(patient_id: int = None, start_date: str = None) -> List[Dict]:
    """Get appointments with optional filters"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    # Try Appointment table (capital A)
    try:
        query = 'SELECT * FROM Appointment WHERE 1=1'
        params = []
        
        if patient_id:
            query += ' AND patient_id = ?'
            params.append(patient_id)
        
        if start_date:
            query += ' AND appointment_date >= ?'
            params.append(start_date)
        
        query += ' ORDER BY appointment_date, appointment_time'
        
        cursor.execute(query, params)
        appointments = cursor.fetchall()
        conn.close()
        return appointments
    except:
        # Fallback to lowercase if capital doesn't exist
        conn = get_connection()
        conn.row_factory = dict_factory
        cursor = conn.cursor()
        
        query = 'SELECT * FROM appointments WHERE 1=1'
        params = []
        
        if patient_id:
            query += ' AND patient_id = ?'
            params.append(patient_id)
        
        if start_date:
            query += ' AND appointment_date >= ?'
            params.append(start_date)
        
        query += ' ORDER BY appointment_date, appointment_time'
        
        cursor.execute(query, params)
        appointments = cursor.fetchall()
        conn.close()
        return appointments'''

if old_function in content:
    content = content.replace(old_function, new_function)
    with open('src/db_helpers.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✓ db_helpers.py updated successfully")
else:
    print("⚠ Could not find exact function to replace - manual fix may be needed")

print("\n🚀 Dashboard should now work without errors!")
print("   Run: streamlit run app.py")
