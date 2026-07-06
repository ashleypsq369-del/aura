"""
Journey Event Tracker Service
Automatically creates journey events when significant actions occur
"""

from sqlalchemy.orm import Session
from src.db import PatientJourneyEvent
from datetime import datetime
from typing import Optional


def create_journey_event(
    db: Session,
    patient_id: int,
    event_type: str,
    event_title: str,
    event_detail: Optional[str] = None,
    clinical_note: Optional[str] = None,
    is_milestone: bool = False,
    created_by: Optional[int] = None
) -> PatientJourneyEvent:
    """
    Create a journey event for tracking patient timeline.
    
    Args:
        db: Database session
        patient_id: Patient ID
        event_type: Type of event (admission, appointment, medication_change, etc.)
        event_title: Short title for the event
        event_detail: Detailed description
        clinical_note: Private clinical notes (clinician-only)
        is_milestone: Whether this is a significant milestone
        created_by: User ID who triggered the event
    
    Returns:
        PatientJourneyEvent object
    """
    try:
        event = PatientJourneyEvent(
            patient_id=patient_id,
            event_type=event_type,
            event_title=event_title,
            event_detail=event_detail,
            clinical_note=clinical_note,
            is_milestone=is_milestone,
            created_by=created_by,
            created_at=datetime.utcnow()
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return event
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to create journey event: {e}")
        return None


# Convenience functions for specific event types

def track_appointment(
    db: Session,
    patient_id: int,
    appointment_type: str,
    appointment_date: datetime,
    location: str,
    created_by: int
):
    """Track appointment scheduling as a journey event"""
    return create_journey_event(
        db=db,
        patient_id=patient_id,
        event_type='appointment',
        event_title=f'{appointment_type} Scheduled',
        event_detail=f'Appointment scheduled at {location} on {appointment_date.strftime("%B %d, %Y at %I:%M %p")}',
        created_by=created_by
    )


def track_medication_change(
    db: Session,
    patient_id: int,
    medication_name: str,
    dosage: str,
    action: str,  # 'added', 'changed', 'discontinued'
    created_by: int
):
    """Track medication changes as journey events"""
    action_titles = {
        'added': 'New Medication',
        'changed': 'Medication Updated',
        'discontinued': 'Medication Discontinued'
    }
    
    return create_journey_event(
        db=db,
        patient_id=patient_id,
        event_type='medication_change',
        event_title=action_titles.get(action, 'Medication Change'),
        event_detail=f'{medication_name} ({dosage}) - {action}',
        created_by=created_by
    )


def track_critical_alert(
    db: Session,
    patient_id: int,
    alert_type: str,
    severity: str,
    details: str,
    created_by: Optional[int] = None
):
    """Track high-priority alerts as journey events"""
    return create_journey_event(
        db=db,
        patient_id=patient_id,
        event_type='high_alert',
        event_title=f'Critical Alert: {alert_type}',
        event_detail=f'Severity: {severity} - {details}',
        is_milestone=True if severity in ['Critical', 'High'] else False,
        created_by=created_by
    )


def track_assessment(
    db: Session,
    patient_id: int,
    assessment_type: str,
    score: Optional[float] = None,
    notes: Optional[str] = None,
    created_by: int = None
):
    """Track patient assessments as journey events"""
    detail = f'{assessment_type} assessment completed'
    if score is not None:
        detail += f' (Score: {score})'
    if notes:
        detail += f' - {notes}'
    
    return create_journey_event(
        db=db,
        patient_id=patient_id,
        event_type='assessment',
        event_title=f'{assessment_type} Assessment',
        event_detail=detail,
        created_by=created_by
    )


def track_status_change(
    db: Session,
    patient_id: int,
    old_status: str,
    new_status: str,
    created_by: int
):
    """Track patient status changes as pathway changes"""
    is_major = new_status in ['deceased', 'critical', 'deteriorating']
    
    return create_journey_event(
        db=db,
        patient_id=patient_id,
        event_type='pathway_change',
        event_title='Care Status Updated',
        event_detail=f'Status changed from {old_status} to {new_status}',
        is_milestone=is_major,
        created_by=created_by
    )


def track_admission(
    db: Session,
    patient_id: int,
    admission_date: datetime,
    diagnosis: str,
    created_by: int
):
    """Track patient admission as a major milestone"""
    return create_journey_event(
        db=db,
        patient_id=patient_id,
        event_type='admission',
        event_title='Patient Admitted',
        event_detail=f'Admitted on {admission_date.strftime("%B %d, %Y")} with diagnosis: {diagnosis}',
        is_milestone=True,
        created_by=created_by
    )


def track_milestone(
    db: Session,
    patient_id: int,
    title: str,
    description: str,
    created_by: int
):
    """Track custom milestones"""
    return create_journey_event(
        db=db,
        patient_id=patient_id,
        event_type='milestone',
        event_title=title,
        event_detail=description,
        is_milestone=True,
        created_by=created_by
    )
