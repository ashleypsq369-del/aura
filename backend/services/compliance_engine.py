"""
Care Task Compliance Engine  --  ProjectAura
=============================================
Tracks whether recurring clinical tasks are completed on schedule,
raises reminders for overdue compulsory tasks, and provides
completion status for display on the patient dashboard.

Task categories:
  COMPULSORY_DAILY     -- Must be done every day. If missed: alert clinician + notify patient.
                          Examples: ESAS wellness check-in, medication dose acknowledgement.
  COMPULSORY_PERIODIC  -- Must be done within a defined window (e.g. vitals every 4h, PPS monthly).
                          Examples: Vital signs, PPSAssessment.
  OPTIONAL_DAILY       -- Encouraged daily but not enforced. Shown as suggestion.
                          Examples: journal entry, community check-in.
  APPOINTMENT          -- System-generated reminders for upcoming appointments.

Reminder behaviour:
  Compulsory + overdue:  -> creates Notification (in-app) + marks as MISSED in compliance log
  Optional + not done:   -> creates gentle Notification (optional, can be dismissed)
  Appointment:           -> fires 24h and 1h before

Called from:
  - Background scheduler (APScheduler or FastAPI startup + asyncio.sleep loop)
  - Manually via POST /api/compliance/run-check
"""

from __future__ import annotations
from datetime import datetime, timedelta, time as dtime
from typing import Optional, List, Dict, Any
import logging

from sqlalchemy.orm import Session
from src.db import (
    get_db, Patient, User, ESASAssessment, Vital, PPSAssessment,
    Medication, Appointment, AuditLog,
    PHQ9Assessment, GAD7Assessment, BarthelIndexAssessment,
)

logger = logging.getLogger(__name__)


# ── Task definitions ─────────────────────────────────────────────────────────

DAILY_TASKS = [
    {
        "id":          "esas_daily",
        "name":        "Daily Wellness Check-In (ESAS)",
        "description": "Rate your 8 symptoms today — pain, tiredness, anxiety and more.",
        "type":        "compulsory_daily",
        "roles":       ["patient"],
        "link":        "/wellness-checkin",
        "icon":        "heart",
        "check_fn":    "has_esas_today",
        "reminder_msg":"Your daily wellness check-in is due. Please rate your symptoms.",
        "overdue_msg": "MISSED: Daily wellness check-in not completed today.",
        "clinician_alert_if_missed": True,
    },
    {
        "id":          "medication_acknowledge",
        "name":        "Medication Dose Acknowledgement",
        "description": "Confirm you have taken your scheduled medications today.",
        "type":        "compulsory_daily",
        "roles":       ["patient", "caregiver"],
        "link":        "/medications",
        "icon":        "pill",
        "check_fn":    "has_medication_log_today",
        "reminder_msg":"Please confirm your scheduled medications have been taken.",
        "overdue_msg": "MISSED: Medication acknowledgement not recorded today.",
        "clinician_alert_if_missed": True,
    },
    {
        "id":          "journal_daily",
        "name":        "Daily Journal Entry",
        "description": "Write a short journal entry — your feelings, reflections, anything.",
        "type":        "optional_daily",
        "roles":       ["patient", "family"],
        "link":        "/journal",
        "icon":        "book",
        "check_fn":    None,   # No automated check — user-driven
        "reminder_msg":"Take a moment to write in your journal today.",
        "clinician_alert_if_missed": False,
    },
]

PERIODIC_TASKS = [
    {
        "id":             "vitals_inpatient",
        "name":           "Vital Signs Recording",
        "description":    "Record heart rate, blood pressure, SpO2, and temperature.",
        "type":           "compulsory_periodic",
        "roles":          ["clinician", "caregiver"],
        "link":           "/patients/{patient_id}/vitals",
        "icon":           "activity",
        "interval_hours": 8,   # every 8 hours for inpatient
        "check_fn":       "has_vitals_within_hours",
        "reminder_msg":   "Vital signs recording is due for {patient_name}.",
        "overdue_msg":    "OVERDUE: Vital signs not recorded in {hours}h for {patient_name}.",
        "clinician_alert_if_missed": True,
        "care_settings":  ["hospital_based"],
    },
    {
        "id":             "vitals_outpatient",
        "name":           "Vital Signs Recording",
        "type":           "compulsory_periodic",
        "roles":          ["clinician", "caregiver"],
        "link":           "/patients/{patient_id}/vitals",
        "icon":           "activity",
        "interval_hours": 24,
        "check_fn":       "has_vitals_within_hours",
        "reminder_msg":   "Daily vital signs recording is due for {patient_name}.",
        "clinician_alert_if_missed": True,
        "care_settings":  ["home_based", "hospice", "outpatient_clinic", "long_term_residential"],
    },
    {
        "id":             "pps_monthly",
        "name":           "Palliative Performance Scale (PPS) Assessment",
        "description":    "Monthly functional status assessment.",
        "type":           "compulsory_periodic",
        "roles":          ["clinician", "caregiver"],
        "link":           "/assessments/{patient_id}/pps",
        "icon":           "clipboard",
        "interval_hours": 720,  # 30 days
        "check_fn":       "has_pps_within_days",
        "reminder_msg":   "Monthly PPS assessment is due for {patient_name}.",
        "clinician_alert_if_missed": True,
    },
    {
        "id":             "phq9_biweekly",
        "name":           "Depression Screening (PHQ-9)",
        "description":    "Fortnightly mental health screening.",
        "type":           "compulsory_periodic",
        "roles":          ["clinician"],
        "link":           "/assessments/{patient_id}/mental-health",
        "icon":           "brain",
        "interval_hours": 336,  # 14 days
        "check_fn":       "has_phq9_within_days",
        "reminder_msg":   "PHQ-9 depression screening is due for {patient_name}.",
        "clinician_alert_if_missed": False,
    },
]


# ── Completion check functions ────────────────────────────────────────────────

def has_esas_today(db: Session, patient_id: int) -> bool:
    today = datetime.utcnow().date()
    result = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient_id,
        ESASAssessment.assessed_at >= datetime.combine(today, dtime.min),
        ESASAssessment.assessed_at <= datetime.combine(today, dtime.max),
    ).first()
    return result is not None


def has_vitals_within_hours(db: Session, patient_id: int, hours: int = 8) -> bool:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    result = db.query(Vital).filter(
        Vital.patient_id == patient_id,
        Vital.recorded_at >= cutoff,
    ).first()
    return result is not None


def has_pps_within_days(db: Session, patient_id: int, days: int = 30) -> bool:
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == patient_id,
        PPSAssessment.assessed_at >= cutoff,
    ).first()
    return result is not None


def has_phq9_within_days(db: Session, patient_id: int, days: int = 14) -> bool:
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = db.query(PHQ9Assessment).filter(
        PHQ9Assessment.patient_id == patient_id,
        PHQ9Assessment.assessed_at >= cutoff,
    ).first()
    return result is not None


def has_medication_log_today(db: Session, patient_id: int) -> bool:
    """
    Check if there's a MedicationAdherenceLog or at least one audit entry
    showing medication activity today. Falls back to checking if the patient
    has active medications (if so, acknowledgement is needed).
    """
    try:
        from src.db import MedicationAdherenceLog
        today = datetime.utcnow().date()
        result = db.query(MedicationAdherenceLog).filter(
            MedicationAdherenceLog.patient_id == patient_id,
            MedicationAdherenceLog.logged_at >= datetime.combine(today, dtime.min),
        ).first()
        return result is not None
    except Exception:
        # Table may not exist — fallback: treat as incomplete if patient has active meds
        active_meds = db.query(Medication).filter(
            Medication.patient_id == patient_id,
            Medication.is_active == True,
        ).count()
        return active_meds == 0  # No meds = nothing to acknowledge


def get_upcoming_appointments(db: Session, patient_id: int) -> list:
    """Get appointments in the next 25 hours."""
    now = datetime.utcnow()
    window_end = now + timedelta(hours=25)
    return db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.scheduled_at >= now,
        Appointment.scheduled_at <= window_end,
        Appointment.status == 'scheduled',
    ).all()


# ── Compliance status for a patient ──────────────────────────────────────────

def get_patient_compliance_status(
    db: Session,
    patient_id: int,
    patient_care_setting: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns today's task completion status for a patient.
    Called by the patient dashboard to show the daily checklist.
    """
    tasks = []

    # Daily tasks
    for task in DAILY_TASKS:
        if "patient" not in task["roles"]:
            continue
        done = False
        if task["check_fn"] == "has_esas_today":
            done = has_esas_today(db, patient_id)
        elif task["check_fn"] == "has_medication_log_today":
            done = has_medication_log_today(db, patient_id)

        tasks.append({
            "id":          task["id"],
            "name":        task["name"],
            "description": task.get("description", ""),
            "type":        task["type"],
            "icon":        task.get("icon", "activity"),
            "link":        task.get("link", "/my-space"),
            "done":        done,
            "required":    task["type"] == "compulsory_daily",
        })

    # Upcoming appointments
    appts = get_upcoming_appointments(db, patient_id)
    for appt in appts:
        hours_until = (appt.scheduled_at - datetime.utcnow()).total_seconds() / 3600
        tasks.append({
            "id":          f"appt_{appt.id}",
            "name":        f"Appointment: {appt.appointment_type}",
            "description": f"{appt.location} — in {int(hours_until)}h",
            "type":        "appointment",
            "icon":        "calendar",
            "link":        "/appointments",
            "done":        False,
            "required":    True,
        })

    total     = len([t for t in tasks if t["required"]])
    completed = len([t for t in tasks if t["done"] and t["required"]])

    return {
        "date":               datetime.utcnow().date().isoformat(),
        "tasks":              tasks,
        "required_total":     total,
        "required_completed": completed,
        "completion_pct":     round(completed / max(total, 1) * 100),
        "all_required_done":  completed == total,
    }


# ── Compliance scan for all patients ─────────────────────────────────────────

def run_compliance_scan(db: Session) -> Dict[str, int]:
    """
    Run the daily compliance scan across all active patients.
    Creates Notification records for overdue compulsory tasks.
    Called by the background scheduler once per day (e.g. 08:00 and 20:00).
    """
    patients = db.query(Patient).filter(
        Patient.status.in_(["active", "stable", "deteriorating"])
    ).all()

    reminders_created = 0
    overdue_flagged   = 0

    for patient in patients:
        care_setting = getattr(patient, "care_setting", None)

        # ── Daily ESAS check ──────────────────────────────────────────────
        if not has_esas_today(db, patient.id):
            _create_compliance_notification(
                db,
                patient_id=patient.id,
                task_id="esas_daily",
                message=f"Daily wellness check-in (ESAS) not yet completed today for {patient.full_name}.",
                priority="high",
                notify_patient=True,
                notify_clinician=True,
                link="/wellness-checkin",
            )
            overdue_flagged += 1

        # ── Vitals check ──────────────────────────────────────────────────
        interval = 8 if care_setting == "hospital_based" else 24
        if not has_vitals_within_hours(db, patient.id, interval):
            _create_compliance_notification(
                db,
                patient_id=patient.id,
                task_id="vitals_overdue",
                message=f"Vital signs not recorded in {interval}h for {patient.full_name}.",
                priority="high",
                notify_patient=False,
                notify_clinician=True,
                link=f"/patients/{patient.id}/vitals",
            )
            overdue_flagged += 1

        # ── Appointment reminders ─────────────────────────────────────────
        appts = get_upcoming_appointments(db, patient.id)
        for appt in appts:
            hours_until = (appt.scheduled_at - datetime.utcnow()).total_seconds() / 3600
            # Fire at ~24h and ~1h
            if 22 <= hours_until <= 26 or 0.5 <= hours_until <= 1.5:
                _create_compliance_notification(
                    db,
                    patient_id=patient.id,
                    task_id=f"appt_reminder_{appt.id}",
                    message=f"Reminder: {appt.appointment_type} at {appt.location} in {int(hours_until)} hour(s).",
                    priority="normal",
                    notify_patient=True,
                    notify_clinician=False,
                    link="/appointments",
                )
                reminders_created += 1

    db.commit()
    logger.info(f"[Compliance] Scan complete: {overdue_flagged} overdue, {reminders_created} reminders.")
    return {"overdue_flagged": overdue_flagged, "reminders_created": reminders_created}


def _create_compliance_notification(
    db: Session,
    patient_id: int,
    task_id: str,
    message: str,
    priority: str = "normal",
    notify_patient: bool = True,
    notify_clinician: bool = False,
    link: str = "",
) -> None:
    """Create a NotificationQueue record, deduplicated within the same calendar day."""
    from src.db import NotificationQueue, PatientPreferences

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return

    # Notify the patient's linked user account
    if notify_patient:
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.patient_id == patient_id
        ).first()
        if prefs and prefs.user_id:
            _dedup_notify(db, prefs.user_id, task_id, today_start, message, link)

    # Notify the primary clinician
    if notify_clinician and patient.primary_clinician_id:
        _dedup_notify(db, patient.primary_clinician_id, task_id, today_start,
                      message, link)


def _dedup_notify(
    db: Session,
    user_id: int,
    task_id: str,
    today_start: datetime,
    message: str,
    link: str,
) -> None:
    """Only create a notification if one with the same task_id hasn't been sent today."""
    from src.db import NotificationQueue

    existing = db.query(NotificationQueue).filter(
        NotificationQueue.recipient_id == user_id,
        NotificationQueue.created_at >= today_start,
        NotificationQueue.title == task_id,
    ).first()
    if existing:
        return

    n = NotificationQueue(
        recipient_id=user_id,
        title=task_id,
        body=message,
        notification_type="compliance_reminder",
        is_read=False,
        is_sent=False,
        created_at=datetime.utcnow(),
    )
    db.add(n)
