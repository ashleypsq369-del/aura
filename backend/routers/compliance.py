"""
Compliance Router  --  ProjectAura
====================================
Endpoints for care task compliance tracking, daily checklists,
and reminder management.

Endpoints:
  GET  /api/compliance/my-tasks          -- patient: today's task checklist
  GET  /api/compliance/patient/{id}      -- clinician/admin: patient's task status
  POST /api/compliance/run-scan          -- admin: manual compliance scan
  GET  /api/compliance/schedule          -- all: task schedule definitions
  PUT  /api/compliance/acknowledge       -- patient: mark optional task done (log it)
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from src.db import get_db, User, Patient, PatientPreferences
from routers.auth import get_current_user, require_role
from services.compliance_engine import (
    get_patient_compliance_status,
    run_compliance_scan,
    DAILY_TASKS,
    PERIODIC_TASKS,
)

router = APIRouter()


@router.get("/my-tasks")
async def get_my_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns today's care task checklist for the logged-in patient/family.
    Shows which compulsory tasks are done, which are pending, and upcoming appointments.
    """
    if current_user.role not in ("patient", "family", "caregiver"):
        return {"tasks": [], "message": "Task tracking is for patients, family and caregivers."}

    # Resolve patient ID
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == current_user.id
    ).first()
    patient_id = prefs.patient_id if prefs else None

    if not patient_id:
        # Fallback: find patient by name
        p = db.query(Patient).filter(Patient.full_name == current_user.full_name).first()
        patient_id = p.id if p else None

    if not patient_id:
        return {
            "tasks": [],
            "required_total": 0,
            "required_completed": 0,
            "completion_pct": 0,
            "all_required_done": True,
            "message": "No patient record linked to your account yet.",
        }

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    care_setting = getattr(patient, "care_setting", None) if patient else None

    return get_patient_compliance_status(db, patient_id, care_setting)


@router.get("/patient/{patient_id}")
async def get_patient_tasks(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clinician/admin view: compliance status for a specific patient."""
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(403, "Access denied")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")

    care_setting = getattr(patient, "care_setting", None)
    status = get_patient_compliance_status(db, patient_id, care_setting)
    status["patient_name"] = patient.full_name
    status["patient_id"]   = patient_id
    return status


@router.post("/run-scan")
async def trigger_compliance_scan(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Admin: manually trigger the compliance scan for all active patients."""
    background_tasks.add_task(_run_scan_task, db)
    return {"message": "Compliance scan started in background", "status": "running"}


def _run_scan_task(db: Session):
    try:
        result = run_compliance_scan(db)
        print(f"[Compliance scan] {result}")
    except Exception as e:
        print(f"[Compliance scan] Error: {e}")


@router.get("/schedule")
async def get_task_schedule(current_user: User = Depends(get_current_user)):
    """
    Returns the full definition of all care tasks — compulsory and optional,
    their frequency, role requirements, and reminder settings.
    """
    return {
        "daily_tasks":    DAILY_TASKS,
        "periodic_tasks": PERIODIC_TASKS,
        "categories": {
            "compulsory_daily": "Must be completed every calendar day. Failure triggers clinician alert.",
            "compulsory_periodic": "Must be completed within a defined time window (e.g. every 8h or 30 days).",
            "optional_daily": "Encouraged daily. Gentle reminder only. User can dismiss.",
            "appointment": "System-generated reminder for upcoming scheduled appointments.",
        },
    }


class TaskAcknowledgeRequest(BaseModel):
    task_id: str
    notes: Optional[str] = None


@router.put("/acknowledge")
async def acknowledge_task(
    body: TaskAcknowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Patient acknowledges completing an optional task (e.g. journal, community check-in).
    Logs to AuditLog so compliance reports can count it.
    """
    from services.audit_service import log_action
    from fastapi import Request
    log_action(db, user=current_user, action=f"TASK_ACKNOWLEDGED_{body.task_id.upper()}",
               resource_type="compliance_task",
               details={"task_id": body.task_id, "notes": body.notes})
    db.commit()
    return {"message": f"Task '{body.task_id}' acknowledged", "timestamp": datetime.utcnow().isoformat()}
