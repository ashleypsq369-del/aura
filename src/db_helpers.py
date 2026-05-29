"""
Database Helper Functions - CRUD Operations for All Tables
Connects forms to database with full data persistence
"""

import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import json

DB_PATH = 'aura.db'

def get_connection():
    """Get database connection"""
    return sqlite3.connect(DB_PATH)

def dict_factory(cursor, row):
    """Convert database row to dictionary"""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

# ==================== BEREAVEMENT JOURNAL ====================

def save_bereavement_journal(user_id: int, date: str, title: str, content: str,
                             sentiment_data: Optional[Dict] = None) -> int:
    """Save grief journal entry with sentiment analysis"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO bereavement_journal 
        (user_id, date, title, content, sentiment_score, sentiment_classification, 
         grief_stage, vader_compound, textblob_polarity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id, date, title, content,
        sentiment_data.get('vader_compound') if sentiment_data else None,
        sentiment_data.get('classification') if sentiment_data else None,
        sentiment_data.get('dominant_grief_stage') if sentiment_data else None,
        sentiment_data.get('vader_compound') if sentiment_data else None,
        sentiment_data.get('textblob_polarity') if sentiment_data else None
    ))
    
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return entry_id

def get_bereavement_journals(user_id: int, limit: int = 50) -> List[Dict]:
    """Get grief journal entries for user"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM bereavement_journal 
        WHERE user_id = ? 
        ORDER BY date DESC, created_at DESC 
        LIMIT ?
    ''', (user_id, limit))
    
    entries = cursor.fetchall()
    conn.close()
    return entries

# ==================== FAMILY CONTACTS ====================

def save_family_contact(patient_id: int, name: str, relationship: str,
                       phone: str = None, email: str = None,
                       is_primary: bool = False, is_emergency: bool = False,
                       notes: str = None) -> int:
    """Save family/guardian contact"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO family_contacts 
        (patient_id, name, relationship, phone, email, is_primary, is_emergency_contact, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, name, relationship, phone, email, is_primary, is_emergency, notes))
    
    contact_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return contact_id

def get_family_contacts(patient_id: int) -> List[Dict]:
    """Get all family contacts for patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM family_contacts 
        WHERE patient_id = ? 
        ORDER BY is_primary DESC, is_emergency_contact DESC, name
    ''', (patient_id,))
    
    contacts = cursor.fetchall()
    conn.close()
    return contacts

def get_primary_contact(patient_id: int) -> Optional[Dict]:
    """Get primary contact for patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM family_contacts 
        WHERE patient_id = ? AND is_primary = 1 
        LIMIT 1
    ''', (patient_id,))
    
    contact = cursor.fetchone()
    conn.close()
    return contact

# ==================== APPOINTMENTS ====================

def save_appointment(patient_id: int, appointment_date: str, appointment_time: str,
                    appointment_type: str, provider_id: int = None,
                    location: str = None, duration_minutes: int = 30,
                    notes: str = None, created_by: int = None) -> int:
    """Save appointment"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO appointments 
        (patient_id, provider_id, appointment_date, appointment_time, appointment_type,
         location, duration_minutes, status, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    ''', (patient_id, provider_id, appointment_date, appointment_time, appointment_type,
          location, duration_minutes, notes, created_by))
    
    appt_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return appt_id

def get_appointments(patient_id: int = None, start_date: str = None) -> List[Dict]:
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
        return appointments

def update_appointment_status(appointment_id: int, status: str) -> bool:
    """Update appointment status"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE appointments 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ''', (status, appointment_id))
    
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

# ==================== CARE TASKS ====================

def save_care_task(patient_id: int, title: str, description: str = None,
                  assigned_to: int = None, due_date: str = None,
                  due_time: str = None, priority: str = 'medium') -> int:
    """Save care task"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO care_tasks 
        (patient_id, assigned_to, title, description, due_date, due_time, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    ''', (patient_id, assigned_to, title, description, due_date, due_time, priority))
    
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_id

def get_care_tasks(patient_id: int = None, assigned_to: int = None,
                  status: str = None) -> List[Dict]:
    """Get care tasks with optional filters"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    query = 'SELECT * FROM care_tasks WHERE 1=1'
    params = []
    
    if patient_id:
        query += ' AND patient_id = ?'
        params.append(patient_id)
    
    if assigned_to:
        query += ' AND assigned_to = ?'
        params.append(assigned_to)
    
    if status:
        query += ' AND status = ?'
        params.append(status)
    
    query += ' ORDER BY priority DESC, due_date, due_time'
    
    cursor.execute(query, params)
    tasks = cursor.fetchall()
    conn.close()
    return tasks

def complete_care_task(task_id: int, completed_by: int, notes: str = None) -> bool:
    """Mark task as complete"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE care_tasks 
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
            completed_by = ?, notes = ? 
        WHERE id = ?
    ''', (completed_by, notes, task_id))
    
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

# ==================== CARE GOALS ====================

def save_care_goal(patient_id: int, goal: str, category: str = None,
                  target_date: str = None, priority: str = 'medium',
                  created_by: int = None) -> int:
    """Save care goal"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO care_goals 
        (patient_id, goal, category, target_date, priority, status, progress, created_by)
        VALUES (?, ?, ?, ?, ?, 'active', 0, ?)
    ''', (patient_id, goal, category, target_date, priority, created_by))
    
    goal_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return goal_id

def update_goal_progress(goal_id: int, progress: int, notes: str = None) -> bool:
    """Update goal progress"""
    conn = get_connection()
    cursor = conn.cursor()
    
    status = 'completed' if progress >= 100 else 'active'
    
    cursor.execute('''
        UPDATE care_goals 
        SET progress = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ''', (progress, status, notes, goal_id))
    
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

def get_care_goals(patient_id: int, status: str = None) -> List[Dict]:
    """Get care goals for patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    query = 'SELECT * FROM care_goals WHERE patient_id = ?'
    params = [patient_id]
    
    if status:
        query += ' AND status = ?'
        params.append(status)
    
    query += ' ORDER BY priority DESC, target_date'
    
    cursor.execute(query, params)
    goals = cursor.fetchall()
    conn.close()
    return goals

# ==================== MEMORY ITEMS ====================

def save_memory_item(patient_id: int, uploaded_by: int, item_type: str,
                    file_path: str, caption: str = None, memory_date: str = None,
                    tags: str = None, is_shared: bool = True) -> int:
    """Save memory item"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO memory_items 
        (patient_id, uploaded_by, item_type, file_path, caption, memory_date, tags, is_shared)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, uploaded_by, item_type, file_path, caption, memory_date, tags, is_shared))
    
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return item_id

def get_memory_items(patient_id: int, item_type: str = None) -> List[Dict]:
    """Get memory items for patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    query = 'SELECT * FROM memory_items WHERE patient_id = ?'
    params = [patient_id]
    
    if item_type:
        query += ' AND item_type = ?'
        params.append(item_type)
    
    query += ' ORDER BY memory_date DESC, created_at DESC'
    
    cursor.execute(query, params)
    items = cursor.fetchall()
    conn.close()
    return items

# ==================== JOURNAL ENTRIES ====================

def save_journal_entry(user_id: int, entry_date: str, title: str, content: str,
                      mood: str = None, tags: str = None, is_private: bool = False) -> int:
    """Save personal journal entry"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO journal_entries 
        (user_id, entry_date, title, content, mood, tags, is_private)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, entry_date, title, content, mood, tags, is_private))
    
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return entry_id

def get_journal_entries(user_id: int, limit: int = 50) -> List[Dict]:
    """Get journal entries for user"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM journal_entries 
        WHERE user_id = ? 
        ORDER BY entry_date DESC, created_at DESC 
        LIMIT ?
    ''', (user_id, limit))
    
    entries = cursor.fetchall()
    conn.close()
    return entries

# ==================== FUNCTIONAL ASSESSMENTS ====================

def save_functional_assessment(patient_id: int, assessed_by: int, assessment_date: str,
                              mobility: str, eating: str, bathing: str, dressing: str,
                              toileting: str, transferring: str, orientation: str,
                              memory: str, communication: str, notes: str = None) -> int:
    """Save functional status assessment"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Calculate independence score (simple average)
    levels = {'Independent': 4, 'Supervision': 3, 'Partial Assist': 2, 'Total Assist': 1, 'Bedbound': 0, 'Chair-bound': 1}
    scores = [levels.get(x, 2) for x in [mobility, eating, bathing, dressing, toileting, transferring]]
    independence_score = int(sum(scores) / len(scores) * 25)  # Convert to 0-100 scale
    
    cursor.execute('''
        INSERT INTO functional_assessments 
        (patient_id, assessed_by, assessment_date, mobility, eating, bathing, dressing,
         toileting, transferring, orientation, memory, communication, independence_score, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (patient_id, assessed_by, assessment_date, mobility, eating, bathing, dressing,
          toileting, transferring, orientation, memory, communication, independence_score, notes))
    
    assessment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return assessment_id

def get_functional_assessments(patient_id: int, limit: int = 10) -> List[Dict]:
    """Get functional assessments for patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM functional_assessments 
        WHERE patient_id = ? 
        ORDER BY assessment_date DESC 
        LIMIT ?
    ''', (patient_id, limit))
    
    assessments = cursor.fetchall()
    conn.close()
    return assessments

# ==================== MEDICATION SCHEDULES ====================

def save_medication_schedule(patient_id: int, medication_name: str, dosage: str,
                            frequency: str, route: str, start_date: str,
                            end_date: str = None, is_prn: bool = False,
                            prn_indication: str = None, instructions: str = None,
                            prescribed_by: int = None) -> int:
    """Save medication schedule"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO medication_schedules 
        (patient_id, medication_name, dosage, frequency, route, start_date, end_date,
         is_prn, prn_indication, instructions, prescribed_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    ''', (patient_id, medication_name, dosage, frequency, route, start_date, end_date,
          is_prn, prn_indication, instructions, prescribed_by))
    
    schedule_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return schedule_id

def get_medication_schedules(patient_id: int, status: str = 'active') -> List[Dict]:
    """Get medication schedules for patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM medication_schedules 
        WHERE patient_id = ? AND status = ? 
        ORDER BY is_prn, medication_name
    ''', (patient_id, status))
    
    schedules = cursor.fetchall()
    conn.close()
    return schedules

def record_medication_administration(schedule_id: int, patient_id: int,
                                    administered_by: int, administered_at: str,
                                    dosage_given: str, route: str,
                                    notes: str = None, effectiveness_rating: int = None) -> int:
    """Record medication administration"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO medication_administration 
        (schedule_id, patient_id, administered_by, administered_at, dosage_given, route, notes, effectiveness_rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (schedule_id, patient_id, administered_by, administered_at, dosage_given, route, notes, effectiveness_rating))
    
    admin_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return admin_id

# ==================== TEAM MESSAGES ====================

def save_team_message(from_user_id: int, message: str, patient_id: int = None,
                     to_user_id: int = None, subject: str = None,
                     message_type: str = 'general') -> int:
    """Save team message"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO team_messages 
        (patient_id, from_user_id, to_user_id, message_type, subject, message)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (patient_id, from_user_id, to_user_id, message_type, subject, message))
    
    message_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return message_id

def get_team_messages(user_id: int = None, patient_id: int = None, limit: int = 50) -> List[Dict]:
    """Get team messages"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    query = 'SELECT * FROM team_messages WHERE 1=1'
    params = []
    
    if user_id:
        query += ' AND (to_user_id = ? OR to_user_id IS NULL OR from_user_id = ?)'
        params.extend([user_id, user_id])
    
    if patient_id:
        query += ' AND patient_id = ?'
        params.append(patient_id)
    
    query += ' ORDER BY created_at DESC LIMIT ?'
    params.append(limit)
    
    cursor.execute(query, params)
    messages = cursor.fetchall()
    conn.close()
    return messages

# ==================== UTILITY FUNCTIONS ====================

def get_patient_id_by_user(user_id: int) -> Optional[int]:
    """Get patient ID for a user (if they are a patient)"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Assuming patients table has user_id field
    cursor.execute('SELECT id FROM patients WHERE user_id = ? LIMIT 1', (user_id,))
    result = cursor.fetchone()
    conn.close()
    
    return result[0] if result else None

def get_user_info(user_id: int) -> Optional[Dict]:
    """Get user information"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, username, role FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user


# ==================== ADDITIONAL HELPER FUNCTIONS ====================

def create_bereavement_entry(data: Dict) -> int:
    """Create bereavement journal entry"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO bereavement_journal 
        (user_id, date, title, content, sentiment_score, sentiment_classification, grief_stage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('family_member_id', data.get('patient_id')),
        data.get('entry_date', datetime.now().isoformat()),
        data.get('title', 'Journal Entry'),
        data.get('entry_text', ''),
        data.get('sentiment_score', 0),
        data.get('sentiment_label', 'neutral'),
        data.get('grief_stage', 'unknown')
    ))
    
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return entry_id

def get_bereavement_entries_by_family(patient_id: int) -> List[Dict]:
    """Get bereavement entries for a family/patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM bereavement_journal 
        WHERE user_id = ? 
        ORDER BY date DESC
    ''', (patient_id,))
    
    entries = cursor.fetchall()
    conn.close()
    return entries

def create_caregiver_note(data: Dict) -> int:
    """Create caregiver note"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO caregiver_notes 
        (patient_id, caregiver_id, note_type, note_text, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['patient_id'],
        data.get('caregiver_id', 1),
        data.get('note_type', 'general'),
        data['note_text'],
        data.get('created_at', datetime.now().isoformat())
    ))
    
    note_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return note_id

def get_caregiver_notes_by_patient(patient_id: int) -> List[Dict]:
    """Get caregiver notes for a patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM caregiver_notes 
        WHERE patient_id = ? 
        ORDER BY created_at DESC
    ''', (patient_id,))
    
    notes = cursor.fetchall()
    conn.close()
    return notes

def create_memory(data: Dict) -> int:
    """Create memory entry"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO memories 
        (patient_id, title, description, memory_date, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data['patient_id'],
        data['title'],
        data['description'],
        data.get('memory_date', datetime.now().isoformat()),
        data.get('tags', ''),
        data.get('created_at', datetime.now().isoformat())
    ))
    
    memory_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return memory_id

def get_memories_by_patient(patient_id: int) -> List[Dict]:
    """Get memories for a patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM memories 
        WHERE patient_id = ? 
        ORDER BY memory_date DESC
    ''', (patient_id,))
    
    memories = cursor.fetchall()
    conn.close()
    return memories

def delete_memory(memory_id: int) -> bool:
    """Delete a memory"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM memories WHERE id = ?', (memory_id,))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def create_journal_entry(data: Dict) -> int:
    """Create journal entry"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO journal_entries 
        (patient_id, entry_text, mood, sentiment_score, entry_date)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['patient_id'],
        data['entry_text'],
        data.get('mood', '😐'),
        data.get('sentiment_score', 0),
        data.get('entry_date', datetime.now().isoformat())
    ))
    
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return entry_id

def get_journal_entries_by_patient(patient_id: int) -> List[Dict]:
    """Get journal entries for a patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM journal_entries 
        WHERE patient_id = ? 
        ORDER BY entry_date DESC
    ''', (patient_id,))
    
    entries = cursor.fetchall()
    conn.close()
    return entries

def create_care_plan_goal(data: Dict) -> int:
    """Create care plan goal"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO care_plan_goals 
        (patient_id, goal_text, category, target_date, priority, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data['patient_id'],
        data['goal_text'],
        data.get('category', 'general'),
        data.get('target_date', ''),
        data.get('priority', 'medium'),
        data.get('status', 'active')
    ))
    
    goal_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return goal_id

def get_care_plan_goals_by_patient(patient_id: int, status: Optional[str] = None) -> List[Dict]:
    """Get care plan goals for a patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    if status:
        cursor.execute('''
            SELECT * FROM care_plan_goals 
            WHERE patient_id = ? AND status = ?
            ORDER BY priority DESC, target_date
        ''', (patient_id, status))
    else:
        cursor.execute('''
            SELECT * FROM care_plan_goals 
            WHERE patient_id = ?
            ORDER BY priority DESC, target_date
        ''', (patient_id,))
    
    goals = cursor.fetchall()
    conn.close()
    return goals

def update_care_plan_goal(goal_id: int, data: Dict) -> bool:
    """Update care plan goal"""
    conn = get_connection()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    for key, value in data.items():
        updates.append(f"{key} = ?")
        values.append(value)
    
    values.append(goal_id)
    
    cursor.execute(f'''
        UPDATE care_plan_goals 
        SET {', '.join(updates)}
        WHERE id = ?
    ''', values)
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def create_care_plan_intervention(data: Dict) -> int:
    """Create care plan intervention"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO care_plan_interventions 
        (patient_id, intervention_text, frequency, status)
        VALUES (?, ?, ?, ?)
    ''', (
        data['patient_id'],
        data['intervention_text'],
        data.get('frequency', ''),
        data.get('status', 'active')
    ))
    
    intervention_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return intervention_id

def create_functional_assessment(data: Dict) -> int:
    """Create functional assessment"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO functional_assessments 
        (patient_id, mobility, self_care, eating, orientation, communication, 
         pain_level, comfort_level, notes, assessment_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['patient_id'],
        data.get('mobility', ''),
        data.get('self_care', ''),
        data.get('eating', ''),
        data.get('orientation', ''),
        data.get('communication', ''),
        data.get('pain_level', 0),
        data.get('comfort_level', ''),
        data.get('notes', ''),
        data.get('assessment_date', datetime.now().isoformat())
    ))
    
    assessment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return assessment_id

def get_functional_assessments_by_patient(patient_id: int) -> List[Dict]:
    """Get functional assessments for a patient"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM functional_assessments 
        WHERE patient_id = ? 
        ORDER BY assessment_date DESC
    ''', (patient_id,))
    
    assessments = cursor.fetchall()
    conn.close()
    return assessments



# ==================== WRAPPER FUNCTIONS FOR DASHBOARD ====================

def get_alerts_by_patient(patient_id: int, status: Optional[str] = None) -> List[Dict]:
    """Get alerts for a patient (wrapper for compatibility)"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    if status:
        cursor.execute('''
            SELECT * FROM Alert 
            WHERE patient_id = ? AND status = ?
            ORDER BY created_at DESC
        ''', (patient_id, status))
    else:
        cursor.execute('''
            SELECT * FROM Alert 
            WHERE patient_id = ?
            ORDER BY created_at DESC
        ''', (patient_id,))
    
    alerts = cursor.fetchall()
    conn.close()
    return alerts


def get_medications_by_patient(patient_id: int, status: Optional[str] = None) -> List[Dict]:
    """Get medications for a patient (wrapper for compatibility)"""
    return get_medication_schedules(patient_id, status if status else 'active')


def get_appointments_by_patient(patient_id: int, status: Optional[str] = None, 
                                start_date: Optional[str] = None) -> List[Dict]:
    """Get appointments for a patient (wrapper for compatibility)"""
    return get_appointments(patient_id, start_date)


def create_alert(data: Dict) -> int:
    """Create an alert"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO Alert 
        (patient_id, title, message, severity, alert_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['patient_id'],
        data.get('title', 'Alert'),
        data.get('message', ''),
        data.get('severity', 'medium'),
        data.get('alert_type', 'general'),
        data.get('status', 'active'),
        data.get('created_at', datetime.now().isoformat())
    ))
    
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id


def update_alert(alert_id: int, data: Dict) -> bool:
    """Update an alert"""
    conn = get_connection()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    for key, value in data.items():
        updates.append(f"{key} = ?")
        values.append(value)
    
    values.append(alert_id)
    
    cursor.execute(f'''
        UPDATE Alert 
        SET {', '.join(updates)}
        WHERE id = ?
    ''', values)
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def delete_alert(alert_id: int) -> bool:
    """Delete an alert"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM Alert WHERE id = ?', (alert_id,))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def get_alert_by_id(alert_id: int) -> Optional[Dict]:
    """Get alert by ID"""
    conn = get_connection()
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM Alert WHERE id = ?', (alert_id,))
    alert = cursor.fetchone()
    
    conn.close()
    return alert


def create_medication(data: Dict) -> int:
    """Create a medication schedule"""
    return save_medication_schedule(
        patient_id=data['patient_id'],
        medication_name=data['name'],
        dosage=data['dosage'],
        frequency=data['frequency'],
        route=data['route'],
        start_date=data.get('start_date', datetime.now().isoformat()),
        end_date=data.get('end_date'),
        is_prn=data.get('is_prn', False),
        instructions=data.get('instructions'),
        prescriber=data.get('prescriber'),
        status=data.get('status', 'active')
    )


def update_medication(medication_id: int, data: Dict) -> bool:
    """Update a medication"""
    conn = get_connection()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    for key, value in data.items():
        updates.append(f"{key} = ?")
        values.append(value)
    
    values.append(medication_id)
    
    cursor.execute(f'''
        UPDATE MedicationSchedule 
        SET {', '.join(updates)}
        WHERE id = ?
    ''', values)
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def delete_medication(medication_id: int) -> bool:
    """Delete a medication"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM MedicationSchedule WHERE id = ?', (medication_id,))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def create_appointment(data: Dict) -> int:
    """Create an appointment"""
    return save_appointment(
        patient_id=data['patient_id'],
        appointment_date=data.get('scheduled_date', datetime.now().date().isoformat()),
        appointment_time=data.get('scheduled_time', '09:00:00'),
        appointment_type=data.get('appointment_type', 'routine_visit'),
        provider_id=data.get('provider_id'),
        location=data.get('location'),
        duration_minutes=data.get('duration_minutes', 30),
        notes=data.get('notes'),
        status=data.get('status', 'scheduled')
    )


def update_appointment(appointment_id: int, data: Dict) -> bool:
    """Update an appointment"""
    if 'status' in data:
        return update_appointment_status(appointment_id, data['status'])
    return False


def delete_appointment(appointment_id: int) -> bool:
    """Delete an appointment"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM Appointment WHERE id = ?', (appointment_id,))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def create_family_contact(data: Dict) -> int:
    """Create a family contact"""
    return save_family_contact(
        patient_id=data['patient_id'],
        name=data['name'],
        relationship=data.get('relationship', ''),
        phone=data.get('phone'),
        email=data.get('email'),
        is_primary=data.get('is_primary_contact', False),
        is_emergency=data.get('is_emergency_contact', False),
        notes=data.get('notes')
    )


def get_family_contacts_by_patient(patient_id: int) -> List[Dict]:
    """Get family contacts for a patient"""
    return get_family_contacts(patient_id)


def create_medication_schedule(data: Dict) -> int:
    """Create medication schedule"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO MedicationSchedule 
        (medication_id, scheduled_time, status)
        VALUES (?, ?, ?)
    ''', (
        data['medication_id'],
        data['scheduled_time'],
        data.get('status', 'pending')
    ))
    
    schedule_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return schedule_id
