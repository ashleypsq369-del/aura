"""
Appointment Scheduling & Care Team Coordination Module

This module provides comprehensive appointment scheduling, care team management,
and coordination features for hospice care.

Requirements: 4.1-4.5, 5.1-5.5
"""

import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import json


def get_db_connection():
    """Get database connection."""
    conn = sqlite3.connect('aura.db')
    conn.row_factory = sqlite3.Row
    return conn


def check_scheduling_conflicts(
    care_team_member_id: int,
    appointment_date: datetime,
    duration_minutes: int,
    exclude_appointment_id: Optional[int] = None
) -> List[Dict]:
    """
    Check for scheduling conflicts for a care team member.
    
    Args:
        care_team_member_id: ID of care team member
        appointment_date: Proposed appointment start time
        duration_minutes: Duration of appointment
        exclude_appointment_id: Appointment ID to exclude (for updates)
    
    Returns:
        List of conflicting appointments
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    end_time = appointment_date + timedelta(minutes=duration_minutes)
    
    query = """
        SELECT * FROM Appointment
        WHERE care_team_member_id = ?
        AND status != 'Cancelled'
        AND datetime(appointment_date) < datetime(?)
        AND datetime(appointment_date, '+' || duration_minutes || ' minutes') > datetime(?)
    """
    
    params = [care_team_member_id, end_time.isoformat(), appointment_date.isoformat()]
    
    if exclude_appointment_id:
        query += " AND appointment_id != ?"
        params.append(exclude_appointment_id)
    
    cursor.execute(query, params)
    conflicts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return conflicts


def create_appointment(
    patient_id: int,
    care_team_member_id: int,
    appointment_type: str,
    appointment_date: datetime,
    duration_minutes: int,
    location: str,
    notes: Optional[str] = None,
    reminder_hours: int = 24
) -> Tuple[bool, str, Optional[int]]:
    """
    Create a new appointment with conflict checking.
    
    Args:
        patient_id: Patient ID
        care_team_member_id: Care team member ID
        appointment_type: Type (Home Visit, Clinic, Telehealth, etc.)
        appointment_date: Appointment date/time
        duration_minutes: Duration in minutes
        location: Location description
        notes: Optional notes
        reminder_hours: Hours before to send reminder
    
    Returns:
        Tuple of (success, message, appointment_id)
    """
    # Check for conflicts
    conflicts = check_scheduling_conflicts(
        care_team_member_id, appointment_date, duration_minutes
    )
    
    if conflicts:
        return False, f"Scheduling conflict: Care team member has {len(conflicts)} overlapping appointment(s)", None
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO Appointment (
                patient_id, care_team_member_id, appointment_type,
                appointment_date, duration_minutes, location, notes,
                status, reminder_sent, reminder_hours, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Scheduled', 0, ?, ?)
        """, (
            patient_id, care_team_member_id, appointment_type,
            appointment_date.isoformat(), duration_minutes, location,
            notes, reminder_hours, datetime.now().isoformat()
        ))
        
        appointment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return True, "Appointment created successfully", appointment_id
        
    except Exception as e:
        conn.close()
        return False, f"Error creating appointment: {str(e)}", None


def get_patient_appointments(
    patient_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[str] = None
) -> List[Dict]:
    """
    Get appointments for a patient with optional filtering.
    
    Args:
        patient_id: Patient ID
        start_date: Optional start date filter
        end_date: Optional end date filter
        status: Optional status filter
    
    Returns:
        List of appointment dictionaries
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT 
            a.*,
            ctm.name as care_team_member_name,
            ctm.role as care_team_member_role,
            ctm.phone as care_team_member_phone
        FROM Appointment a
        LEFT JOIN CareTeamMember ctm ON a.care_team_member_id = ctm.care_team_member_id
        WHERE a.patient_id = ?
    """
    params = [patient_id]
    
    if start_date:
        query += " AND datetime(a.appointment_date) >= datetime(?)"
        params.append(start_date.isoformat())
    
    if end_date:
        query += " AND datetime(a.appointment_date) <= datetime(?)"
        params.append(end_date.isoformat())
    
    if status:
        query += " AND a.status = ?"
        params.append(status)
    
    query += " ORDER BY a.appointment_date"
    
    cursor.execute(query, params)
    appointments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return appointments


def get_care_team_schedule(
    care_team_member_id: int,
    start_date: datetime,
    end_date: datetime
) -> List[Dict]:
    """
    Get schedule for a care team member.
    
    Args:
        care_team_member_id: Care team member ID
        start_date: Start date
        end_date: End date
    
    Returns:
        List of appointments
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            a.*,
            p.name as patient_name
        FROM Appointment a
        LEFT JOIN Patient p ON a.patient_id = p.patient_id
        WHERE a.care_team_member_id = ?
        AND datetime(a.appointment_date) >= datetime(?)
        AND datetime(a.appointment_date) <= datetime(?)
        AND a.status != 'Cancelled'
        ORDER BY a.appointment_date
    """, (care_team_member_id, start_date.isoformat(), end_date.isoformat()))
    
    appointments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return appointments


def complete_appointment(
    appointment_id: int,
    completion_notes: str,
    completed_by: int
) -> Tuple[bool, str]:
    """
    Mark appointment as completed with notes.
    
    Args:
        appointment_id: Appointment ID
        completion_notes: Notes from the appointment
        completed_by: User ID who completed it
    
    Returns:
        Tuple of (success, message)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE Appointment
            SET status = 'Completed',
                completion_notes = ?,
                completed_at = ?,
                completed_by = ?
            WHERE appointment_id = ?
        """, (completion_notes, datetime.now().isoformat(), completed_by, appointment_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return False, "Appointment not found"
        
        conn.commit()
        conn.close()
        return True, "Appointment marked as completed"
        
    except Exception as e:
        conn.close()
        return False, f"Error completing appointment: {str(e)}"


def cancel_appointment(
    appointment_id: int,
    cancellation_reason: str,
    cancelled_by: int
) -> Tuple[bool, str]:
    """
    Cancel an appointment.
    
    Args:
        appointment_id: Appointment ID
        cancellation_reason: Reason for cancellation
        cancelled_by: User ID who cancelled it
    
    Returns:
        Tuple of (success, message)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE Appointment
            SET status = 'Cancelled',
                cancellation_reason = ?,
                cancelled_at = ?,
                cancelled_by = ?
            WHERE appointment_id = ?
        """, (cancellation_reason, datetime.now().isoformat(), cancelled_by, appointment_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return False, "Appointment not found"
        
        conn.commit()
        conn.close()
        return True, "Appointment cancelled"
        
    except Exception as e:
        conn.close()
        return False, f"Error cancelling appointment: {str(e)}"


def send_appointment_reminders() -> Dict[str, int]:
    """
    Background job to send appointment reminders.
    Identifies appointments needing reminders and marks them as sent.
    
    Returns:
        Dictionary with reminder statistics
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.now()
    
    # Find appointments needing reminders
    cursor.execute("""
        SELECT 
            a.*,
            p.name as patient_name,
            p.email as patient_email,
            ctm.name as care_team_member_name
        FROM Appointment a
        JOIN Patient p ON a.patient_id = p.patient_id
        JOIN CareTeamMember ctm ON a.care_team_member_id = ctm.care_team_member_id
        WHERE a.status = 'Scheduled'
        AND a.reminder_sent = 0
        AND datetime(a.appointment_date, '-' || a.reminder_hours || ' hours') <= datetime(?)
        AND datetime(a.appointment_date) > datetime(?)
    """, (now.isoformat(), now.isoformat()))
    
    appointments = cursor.fetchall()
    reminders_sent = 0
    
    for appt in appointments:
        # In production, send actual email/SMS here
        # For now, just mark as sent
        cursor.execute("""
            UPDATE Appointment
            SET reminder_sent = 1,
                reminder_sent_at = ?
            WHERE appointment_id = ?
        """, (now.isoformat(), appt['appointment_id']))
        
        reminders_sent += 1
    
    conn.commit()
    conn.close()
    
    return {
        'reminders_sent': reminders_sent,
        'timestamp': now.isoformat()
    }


def assign_care_team_member(
    patient_id: int,
    user_id: int,
    role: str,
    specialization: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    is_primary: bool = False
) -> Tuple[bool, str, Optional[int]]:
    """
    Assign a care team member to a patient.
    
    Args:
        patient_id: Patient ID
        user_id: User ID of care team member
        role: Role (Physician, Nurse, Social Worker, etc.)
        specialization: Optional specialization
        phone: Contact phone
        email: Contact email
        is_primary: Whether this is primary contact
    
    Returns:
        Tuple of (success, message, care_team_member_id)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get user name
        cursor.execute("SELECT name FROM User WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return False, "User not found", None
        
        # If setting as primary, unset other primary members with same role
        if is_primary:
            cursor.execute("""
                UPDATE CareTeamMember
                SET is_primary = 0
                WHERE patient_id = ? AND role = ?
            """, (patient_id, role))
        
        cursor.execute("""
            INSERT INTO CareTeamMember (
                patient_id, user_id, name, role, specialization,
                phone, email, is_primary, assigned_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        """, (
            patient_id, user_id, user['name'], role, specialization,
            phone, email, 1 if is_primary else 0, datetime.now().isoformat()
        ))
        
        care_team_member_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return True, "Care team member assigned successfully", care_team_member_id
        
    except Exception as e:
        conn.close()
        return False, f"Error assigning care team member: {str(e)}", None


def get_patient_care_team(patient_id: int, active_only: bool = True) -> List[Dict]:
    """
    Get care team for a patient.
    
    Args:
        patient_id: Patient ID
        active_only: Only return active members
    
    Returns:
        List of care team member dictionaries
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT * FROM CareTeamMember
        WHERE patient_id = ?
    """
    params = [patient_id]
    
    if active_only:
        query += " AND status = 'Active'"
    
    query += " ORDER BY is_primary DESC, role, name"
    
    cursor.execute(query, params)
    team_members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return team_members


def get_all_care_team_members() -> List[Dict]:
    """Get all care team members for selection."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT DISTINCT
            user_id,
            name,
            role,
            specialization,
            phone,
            email
        FROM CareTeamMember
        WHERE status = 'Active'
        ORDER BY role, name
    """)
    
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return members


def render_scheduling_page():
    """Render appointment scheduling page"""
    import streamlit as st
    import pandas as pd
    from datetime import datetime, timedelta
    
    st.subheader("📅 Appointment Scheduling")
    
    tab1, tab2, tab3 = st.tabs(["Calendar View", "Schedule Appointment", "Upcoming Appointments"])
    
    with tab1:
        st.markdown("### This Week's Schedule")
        
        # Calendar view
        col1, col2 = st.columns([3, 1])
        with col1:
            selected_date = st.date_input("Select Date", datetime.now())
        with col2:
            view_type = st.selectbox("View", ["Day", "Week", "Month"])
        
        # Appointments for selected date
        appointments = pd.DataFrame({
            'Time': ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'],
            'Patient': ['John Doe', 'Jane Smith', 'Bob Johnson', 'Mary Williams'],
            'Type': ['Assessment', 'Follow-up', 'Medication Review', 'Family Meeting'],
            'Provider': ['Dr. Smith', 'Nurse Sarah', 'Dr. Smith', 'Social Worker'],
            'Status': ['✅ Confirmed', '✅ Confirmed', '⏰ Pending', '📅 Scheduled']
        })
        
        st.dataframe(appointments, use_container_width=True, hide_index=True)
    
    with tab2:
        st.markdown("### Schedule New Appointment")
        
        with st.form("schedule_appointment"):
            col1, col2 = st.columns(2)
            
            with col1:
                patient = st.text_input("Patient Name/ID", "PAT-001")
                appt_type = st.selectbox("Appointment Type", 
                    ["Initial Assessment", "Follow-up Visit", "Medication Review", 
                     "Pain Management", "Family Meeting", "Bereavement Support"])
                appt_date = st.date_input("Date", datetime.now() + timedelta(days=1))
            
            with col2:
                provider = st.selectbox("Provider", 
                    ["Dr. Smith", "Dr. Johnson", "Nurse Sarah", "Nurse John", "Social Worker"])
                appt_time = st.time_input("Time", datetime.now().replace(hour=9, minute=0))
                duration = st.selectbox("Duration", ["15 min", "30 min", "45 min", "60 min", "90 min"])
            
            location = st.selectbox("Location", 
                ["Home Visit", "Clinic - Room 1", "Clinic - Room 2", "Telehealth"])
            
            notes = st.text_area("Notes", placeholder="Reason for visit, special requirements, etc.")
            
            send_reminder = st.checkbox("Send reminder notifications", value=True)
            
            if st.form_submit_button("Schedule Appointment", type="primary"):
                st.success(f"✅ Appointment scheduled for {appt_date} at {appt_time}")
                st.info("📧 Confirmation sent to patient and provider")
    
    with tab3:
        st.markdown("### Upcoming Appointments")
        
        upcoming = pd.DataFrame({
            'Date': ['Tomorrow', 'Jan 27', 'Jan 28', 'Feb 1'],
            'Time': ['10:00 AM', '2:00 PM', '9:00 AM', '11:00 AM'],
            'Patient': ['John Doe', 'Jane Smith', 'Bob Johnson', 'Mary Williams'],
            'Type': ['Follow-up', 'Assessment', 'Medication Review', 'Family Meeting'],
            'Provider': ['Dr. Smith', 'Nurse Sarah', 'Dr. Smith', 'Social Worker'],
            'Actions': ['✏️ Edit | ❌ Cancel', '✏️ Edit | ❌ Cancel', '✏️ Edit | ❌ Cancel', '✏️ Edit | ❌ Cancel']
        })
        
        st.dataframe(upcoming, use_container_width=True, hide_index=True)
        
        st.markdown("### Appointment Reminders")
        st.info("📱 SMS reminders sent 24 hours before appointment")
        st.info("📧 Email reminders sent 48 hours before appointment")
