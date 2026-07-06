"""
Patient Journey Timeline Router  --  Project Aura
View patient journey events (admissions, milestones, alerts, changes)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from src.db import get_db, PatientJourneyEvent, User, Patient
from routers.auth import get_current_user

router = APIRouter()


class JourneyEventCreate(BaseModel):
    patient_id: int
    event_type: str
    event_title: str
    event_detail: Optional[str] = None
    clinical_note: Optional[str] = None
    is_milestone: bool = False


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/patients/{patient_id}")
async def get_patient_journey(
    patient_id: int,
    event_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all journey events for a patient.
    Optionally filter by event_type and date range.
    """
    # Check patient exists and user has access
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Authorization: clinicians/admin/caregiver see all; patient sees own; family sees linked patient
    if current_user.role not in ['admin', 'clinician', 'caregiver']:
        allowed = False

        if current_user.role == 'patient':
            # Match by patient record linked to this user account
            patient_record = db.query(Patient).filter(
                Patient.id == patient_id
            ).first()
            # Allow if user's full_name matches patient, or user has patient_id attribute
            if patient_record:
                linked = db.query(Patient).filter(
                    Patient.full_name == current_user.full_name,
                    Patient.id == patient_id
                ).first()
                if linked or getattr(current_user, 'patient_id', None) == patient_id:
                    allowed = True

        if current_user.role == 'family':
            from src.db import PatientFamilyLink
            link = db.query(PatientFamilyLink).filter(
                PatientFamilyLink.patient_id == patient_id,
                PatientFamilyLink.family_user_id == current_user.id
            ).first()
            if link:
                allowed = True

        if not allowed:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = db.query(PatientJourneyEvent).filter(
        PatientJourneyEvent.patient_id == patient_id
    )
    
    if event_type:
        query = query.filter(PatientJourneyEvent.event_type == event_type)
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(PatientJourneyEvent.created_at >= start_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(PatientJourneyEvent.created_at <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    events = query.order_by(PatientJourneyEvent.created_at.desc()).all()
    
    # Format response
    result = []
    for event in events:
        result.append({
            'id': event.id,
            'patient_id': event.patient_id,
            'event_type': event.event_type,
            'event_title': event.event_title,
            'event_detail': event.event_detail,
            'clinical_note': event.clinical_note if current_user.role in ['admin', 'clinician'] else None,
            'is_milestone': event.is_milestone,
            'created_at': event.created_at.isoformat() if event.created_at else None,
            'created_by': event.created_by
        })
    
    return result


@router.get("/my-journey")
async def get_my_journey(
    event_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get journey events for the logged-in patient/family member.
    If patient role, show their own journey.
    If family role, show linked patient's journey.
    """
    patient_id = None
    
    if current_user.role == 'patient':
        # Find patient record linked to this user
        patient = db.query(Patient).filter(Patient.patient_code == current_user.username).first()
        if patient:
            patient_id = patient.id
    elif current_user.role == 'family':
        # Find linked patient
        from src.db import PatientFamilyLink
        link = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.family_user_id == current_user.id
        ).first()
        if link:
            patient_id = link.patient_id
    
    if not patient_id:
        return []
    
    # Get events
    query = db.query(PatientJourneyEvent).filter(
        PatientJourneyEvent.patient_id == patient_id
    )
    
    if event_type:
        query = query.filter(PatientJourneyEvent.event_type == event_type)
    
    events = query.order_by(PatientJourneyEvent.created_at.desc()).all()
    
    # Format response (hide clinical notes for non-clinicians)
    result = []
    for event in events:
        result.append({
            'id': event.id,
            'patient_id': event.patient_id,
            'event_type': event.event_type,
            'event_title': event.event_title,
            'event_detail': event.event_detail,
            'is_milestone': event.is_milestone,
            'created_at': event.created_at.isoformat() if event.created_at else None
        })
    
    return result


@router.post("")
async def create_journey_event(
    event: JourneyEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new journey event.
    Only admin/clinician can create events.
    """
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Only clinicians can create journey events")
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == event.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create event
    new_event = PatientJourneyEvent(
        patient_id=event.patient_id,
        event_type=event.event_type,
        event_title=event.event_title,
        event_detail=event.event_detail,
        clinical_note=event.clinical_note,
        is_milestone=event.is_milestone,
        created_by=current_user.id
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return {
        'message': 'Journey event created',
        'event_id': new_event.id
    }
