"""
Patient Family Data-Sharing Consent
Stored in patient_family_consent (new table aura_user owns).
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.db import get_db, User, PatientFamilyConsent
from routers.auth import get_current_user
from services.audit_service import log_action

router = APIRouter(prefix="/api/consent", tags=["consent"])

DEFAULT_CONSENT = {
    "vitals":        False,
    "medications":   False,
    "symptoms":      False,
    "appointments":  False,
    "care_plan":     False,
    "assessments":   False,
    "daily_notes":   False,
    "ai_insights":   False,
}


class ConsentUpdate(BaseModel):
    vitals:       Optional[bool] = None
    medications:  Optional[bool] = None
    symptoms:     Optional[bool] = None
    appointments: Optional[bool] = None
    care_plan:    Optional[bool] = None
    assessments:  Optional[bool] = None
    daily_notes:  Optional[bool] = None
    ai_insights:  Optional[bool] = None


def _load_consent(record: PatientFamilyConsent) -> dict:
    try:
        stored = json.loads(record.consent_json or '{}')
    except Exception:
        stored = {}
    return {**DEFAULT_CONSENT, **stored}


@router.get("/my")
def get_my_consent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can manage family consent")

    record = db.query(PatientFamilyConsent).filter(
        PatientFamilyConsent.patient_user_id == current_user.id
    ).first()

    if not record:
        return {"consent": DEFAULT_CONSENT, "patient_found": True}

    return {"consent": _load_consent(record), "patient_found": True}


@router.put("/my")
def update_my_consent(
    data: ConsentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can manage family consent")

    record = db.query(PatientFamilyConsent).filter(
        PatientFamilyConsent.patient_user_id == current_user.id
    ).first()

    if record:
        current = _load_consent(record)
    else:
        current = {**DEFAULT_CONSENT}
        record = PatientFamilyConsent(patient_user_id=current_user.id)
        db.add(record)

    updates = data.dict(exclude_none=True)
    current.update(updates)
    record.consent_json = json.dumps(current)
    db.commit()

    log_action(
        db=db,
        user_id=current_user.id,
        action="consent_updated",
        resource_type="patient_family_consent",
        resource_id=current_user.id,
        details=f"Family consent updated: {updates}",
    )
    return {"success": True, "consent": current}


@router.get("/patient/{patient_user_id}")
def get_patient_consent_for_family(
    patient_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Family/caregiver checks what consent a patient has granted."""
    if current_user.role not in ('family', 'caregiver', 'clinician', 'admin'):
        raise HTTPException(status_code=403, detail="Access denied")

    record = db.query(PatientFamilyConsent).filter(
        PatientFamilyConsent.patient_user_id == patient_user_id
    ).first()

    consent = _load_consent(record) if record else DEFAULT_CONSENT
    return {"consent": consent, "patient_user_id": patient_user_id}
