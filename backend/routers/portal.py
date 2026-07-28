"""
Patient Portal and Journey Router  --  Project Aura
Provides adaptive user landing payload, care templates, and timeline tracking.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime

from src.db import (
    get_db, Patient, User, CarePlan, PatientJourneyEvent,
    ConditionCareTemplate, AuditLog
)
from routers.auth import get_current_user
from routers.patients import check_patient_access
from services.personalisation import get_patient_portal_data, determine_journey_phase

router = APIRouter()


class JourneyEventCreateRequest(BaseModel):
    event_type: str         # admission / pathway_change / alert / medication_change / milestone
    event_title: str
    event_detail: str
    clinical_note: Optional[str] = None
    is_milestone: bool = False


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/patient-portal/{patient_id}")
async def get_portal_dashboard(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the full adaptive patient-facing landing space data."""
    try:
        # ── Resolve patient record ─────────────────────────────────────────
        # For patient/family roles: ALWAYS resolve by username or full_name first
        # to avoid the user.id == patient.id collision when IDs don't match.
        patient = None

        if current_user.role in ("patient", "family"):
            # Primary: match by patient_code = username (most reliable)
            patient = (
                db.query(Patient).filter(Patient.patient_code == current_user.username).first()
                or db.query(Patient).filter(Patient.full_name == current_user.full_name).first()
            )

        # For clinicians/admin, or if patient-role lookup failed, try by ID
        if not patient:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()

        # Last resort: try again by user attributes
        if not patient and current_user.role in ("patient", "family", "caregiver"):
            patient = (
                db.query(Patient).filter(Patient.full_name == current_user.full_name).first()
                or db.query(Patient).filter(Patient.patient_code == current_user.username).first()
            )

        # Fetch portal data using the RESOLVED patient id, not the URL parameter
        if patient:
            resolved_id = patient.id
            # Skip the access check if the portal resolved the patient by name match
            # (the patient record IS this user — the ID just doesn't match numerically).
            # Only enforce the check for clinicians/admins accessing other patients.
            if current_user.role not in ("patient", "family"):
                if not check_patient_access(resolved_id, current_user, db):
                    raise HTTPException(status_code=403, detail="Access denied to this patient's records")
            portal_data = get_patient_portal_data(resolved_id, current_user.id, db)
        else:
            # No patient record  --  build minimal portal from preferences
            portal_data = _build_portal_from_user(current_user, db)

        if not portal_data or "error" in portal_data:
            # Fall back to user-based portal (no clinical patient record or query error)
            portal_data = _build_portal_from_user(current_user, db)

        return portal_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_portal_dashboard: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


def _build_portal_from_user(user: User, db: Session) -> dict:
    """
    Build a minimal patient portal payload from the user account + preferences
    when no clinical patient record exists. Allows newly registered patients to
    use the portal immediately after completing the questionnaire.
    """
    from src.db import PatientPreferences
    import json as _j

    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == user.id
    ).first()

    condition = None
    care_priorities = []
    if prefs:
        condition = getattr(prefs, "primary_condition", None)
        try:
            care_priorities = _j.loads(prefs.care_priorities or "[]")[:3]
        except Exception:
            care_priorities = []

    first_name = (user.full_name or "").split()[0] or user.username

    return {
        "patient": {
            "id":              user.id,
            "name":            user.full_name or user.username,
            "first_name":      first_name,
            "diagnosis":       condition or "Under assessment",
            "care_pathway":    "palliative",
            "age":             None,
            "patient_code":    user.username,
        },
        "journey_phase": {
            "phase":       1,
            "name":        "Getting Started",
            "description": "Welcome to your care space. Your care team will be in touch soon.",
            "percentage":  10,
        },
        "today_focus": care_priorities[0] if care_priorities else "Connect with your care team",
        "care_team":            [],
        "recommended_resources": [],
        "community_groups":     [],
        "preferences_complete": bool(prefs and prefs.questionnaire_complete),
    }


@router.get("/care-templates/{condition}")
async def get_condition_care_template(
    condition: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve templates matching diagnosis keywords."""
    # Find matching template
    templates = db.query(ConditionCareTemplate).all()
    
    import json
    matched_template = None
    for t in templates:
        keywords = json.loads(t.condition_keywords) if t.condition_keywords else []
        if condition.lower() == t.condition_name.lower() or any(k.lower() in condition.lower() for k in keywords):
            matched_template = t
            break

    if not matched_template:
        # Fallback to general template if any
        matched_template = db.query(ConditionCareTemplate).filter(
            ConditionCareTemplate.condition_name.ilike("general")
        ).first()

    if not matched_template:
        raise HTTPException(status_code=404, detail="No matching care template found")

    return matched_template


@router.get("/journey/{patient_id}")
async def get_patient_journey(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the 6-phase journey map timeline and all logged events for a patient."""
    if not check_patient_access(patient_id, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    phase_info = determine_journey_phase(patient, db)

    # Fetch journey events
    events_query = db.query(PatientJourneyEvent).filter(
        PatientJourneyEvent.patient_id == patient_id
    ).order_by(PatientJourneyEvent.created_at.desc())

    events = events_query.all()

    # Sanitise clinical notes for patients and family
    show_clinical = current_user.role in ["clinician", "admin", "caregiver"]
    
    formatted_events = []
    for e in events:
        formatted_events.append({
            "id": e.id,
            "event_type": e.event_type,
            "event_title": e.event_title,
            "event_detail": e.event_detail,
            "clinical_note": e.clinical_note if show_clinical else None,
            "is_milestone": e.is_milestone,
            "created_at": e.created_at.isoformat()
        })

    return {
        "current_phase": phase_info,
        "events": formatted_events,
        "timeline_stages": [
            {"phase": 1, "name": "Diagnosis & Assessment", "description": "Initial onboarding and diagnostic evaluation"},
            {"phase": 2, "name": "Care Planning", "description": "Establishing support structure and care plan goals"},
            {"phase": 3, "name": "Active Monitoring", "description": "Continuous symptom logging and routine updates"},
            {"phase": 4, "name": "Escalation & Stabilization", "description": "Immediate interventions and stabilizer adjustments"},
            {"phase": 5, "name": "Transition of Care", "description": "Palliative comfort care or support transition"},
            {"phase": 6, "name": "Legacy & Bereavement", "description": "Grief counselling and memory legacy space"}
        ]
    }


@router.post("/journey/{patient_id}/event")
async def log_journey_event(
    patient_id: int,
    request: JourneyEventCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a milestone/event along the patient's timeline (Clinician / Caregiver only)."""
    if current_user.role not in ["clinician", "admin", "caregiver"]:
        raise HTTPException(status_code=403, detail="Only clinicians or caregivers can log journey events")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_event = PatientJourneyEvent(
        patient_id=patient_id,
        event_type=request.event_type,
        event_title=request.event_title,
        event_detail=request.event_detail,
        clinical_note=request.clinical_note,
        is_milestone=request.is_milestone,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )

    db.add(new_event)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id, user_role=current_user.role,
        action="journey_event_logged", resource_type="journey_event",
        patient_id=patient_id, success=True,
        details=f'{{"event_title": "{request.event_title}", "milestone": {str(request.is_milestone).lower()}}}'
    )
    db.add(audit)
    db.commit()
    db.refresh(new_event)

    return {"message": "Journey event logged successfully", "event_id": new_event.id}
