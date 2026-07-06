"""Appointments Router"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import get_db, Appointment, User
from routers.auth import get_current_user
from services.journey_tracker import track_appointment

router = APIRouter()

class AppointmentCreate(BaseModel):
    patient_id: int
    appointment_type: str
    scheduled_at: datetime
    location: str
    location_detail: str = ""
    notes: str = ""

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    appointment_type: str
    scheduled_at: datetime
    location: str
    location_detail: Optional[str] = ""
    status: str
    notes: Optional[str] = ""

    @field_validator('notes', 'location_detail', mode='before')
    @classmethod
    def coerce_none_to_empty(cls, v):
        return v or ""

    class Config:
        from_attributes = True

@router.get("/{patient_id}", response_model=List[AppointmentResponse])
async def get_appointments(patient_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.scheduled_at).all()

@router.post("", response_model=AppointmentResponse)
async def create_appointment(data: AppointmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appt = Appointment(**data.dict(), clinician_id=current_user.id, created_by=current_user.id)
    db.add(appt)
    db.commit()
    db.refresh(appt)
    
    # Track as journey event
    track_appointment(
        db=db,
        patient_id=data.patient_id,
        appointment_type=data.appointment_type,
        appointment_date=data.scheduled_at,
        location=data.location,
        created_by=current_user.id
    )
    
    return appt

class AppointmentUpdate(BaseModel):
    status: str

@router.put("/{appointment_id}")
async def update_appointment_status(
    appointment_id: int,
    data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update appointment status (complete / cancel)."""
    from fastapi import HTTPException
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = data.status
    db.commit()
    db.refresh(appt)
    return appt
