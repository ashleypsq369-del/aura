"""Alerts Router"""
from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from src.db import get_db, User, Patient, Alert
from routers.auth import get_current_user

router = APIRouter()

class AlertResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    triggered_value: Optional[str] = None
    created_at: datetime
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_name: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[AlertResponse])
async def get_alerts(
    patient_id: int = None, 
    severity: str = None,
    acknowledged: bool = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get alerts, optionally filtered by patient_id, severity, and acknowledgment status"""
    
    # Build query with join to get patient names
    query = db.query(
        Alert,
        Patient.full_name.label('patient_name')
    ).join(
        Patient, Alert.patient_id == Patient.id
    )
    
    # Apply filters  --  exclude dismissed alerts by default
    filters = [Alert.is_dismissed == False]
    
    if patient_id is not None:
        filters.append(Alert.patient_id == patient_id)
    
    if severity is not None:
        filters.append(Alert.severity == severity)
    
    if acknowledged is not None:
        filters.append(Alert.is_acknowledged == acknowledged)
    
    query = query.filter(and_(*filters))
    
    # Order by most recent first
    query = query.order_by(Alert.created_at.desc())
    
    results = query.all()
    
    # Build response with patient names
    alerts_with_names = []
    for alert, patient_name in results:
        ack_user = None
        if alert.acknowledged_by:
            ack_user = db.query(User).filter(User.id == alert.acknowledged_by).first()
        alert_dict = {
            "id": alert.id,
            "patient_id": alert.patient_id,
            "patient_name": patient_name,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "message": alert.message,
            "triggered_value": alert.triggered_value,
            "created_at": alert.created_at,
            "is_acknowledged": alert.is_acknowledged,
            "acknowledged_at": alert.acknowledged_at,
            "acknowledged_by_name": ack_user.full_name if ack_user else None,
        }
        alerts_with_names.append(alert_dict)
    
    return alerts_with_names

@router.get("/unread-count")
async def get_unread_alerts_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the count of unacknowledged alerts, filtered by user role access."""
    query = db.query(Alert).filter(
        Alert.is_acknowledged == False,
        Alert.is_dismissed == False,
    )
    
    if current_user.role in ["admin", "clinician"]:
        # See all
        pass
    elif current_user.role == "caregiver":
        from src.db import CaregiverAssignment
        assignments = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.caregiver_id == current_user.id,
            CaregiverAssignment.active == True
        ).all()
        patient_ids = [a.patient_id for a in assignments]
        query = query.filter(Alert.patient_id.in_(patient_ids))
    elif current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.full_name == current_user.full_name).first()
        if patient:
            query = query.filter(Alert.patient_id == patient.id)
        else:
            return {"count": 0}
    elif current_user.role == "family":
        from src.db import PatientFamilyLink
        links = db.query(PatientFamilyLink).filter(PatientFamilyLink.family_user_id == current_user.id).all()
        patient_ids = [link.patient_id for link in links]
        query = query.filter(Alert.patient_id.in_(patient_ids))
    else:
        return {"count": 0}

    return {"count": query.count()}

@router.put("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_acknowledged = True
        alert.acknowledged_by = current_user.id
        alert.acknowledged_at = datetime.utcnow()
        db.commit()
    return {"message": "Alert acknowledged"}

@router.delete("/{alert_id}")
async def dismiss_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Dismiss (soft delete) an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_dismissed = True
        alert.acknowledged_by = current_user.id
        alert.acknowledged_at = datetime.utcnow()
        db.commit()
    return {"message": "Alert dismissed"}
