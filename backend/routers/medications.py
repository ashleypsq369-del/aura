"""Medications Router"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import get_db, Medication, User
from routers.auth import get_current_user
from services.journey_tracker import track_medication_change

router = APIRouter()

class MedicationCreate(BaseModel):
    patient_id: int
    name: str
    dose: str
    frequency: str
    route: str = "Oral"
    indication: str = ""

class MedicationResponse(BaseModel):
    id: int
    patient_id: int
    name: str
    dose: str
    frequency: str
    route: str
    indication: str
    is_active: bool
    start_date: Optional[datetime]
    class Config:
        from_attributes = True

@router.get("/{patient_id}", response_model=List[MedicationResponse])
async def get_medications(patient_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Medication).filter(Medication.patient_id == patient_id, Medication.is_active == True).all()

@router.post("", response_model=MedicationResponse)
async def create_medication(data: MedicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    med = Medication(**data.dict(), prescribed_by=current_user.id, start_date=datetime.utcnow())
    db.add(med)
    db.commit()
    db.refresh(med)
    
    # Track as journey event
    track_medication_change(
        db=db,
        patient_id=data.patient_id,
        medication_name=data.name,
        dosage=data.dose,
        action='added',
        created_by=current_user.id
    )
    
    return med

@router.put("/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: int, 
    data: MedicationCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update medication details"""
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Update fields
    med.name = data.name
    med.dose = data.dose
    med.frequency = data.frequency
    med.route = data.route
    med.indication = data.indication
    
    db.commit()
    db.refresh(med)
    
    # Track as journey event
    track_medication_change(
        db=db,
        patient_id=data.patient_id,
        medication_name=data.name,
        dosage=data.dose,
        action='changed',
        created_by=current_user.id
    )
    
    return med

@router.delete("/{medication_id}")
async def delete_medication(
    medication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Discontinue a medication"""
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Store info before marking inactive
    patient_id = med.patient_id
    med_name = med.name
    med_dose = med.dose
    
    # Mark as inactive instead of deleting
    med.is_active = False
    db.commit()
    
    # Track as journey event
    track_medication_change(
        db=db,
        patient_id=patient_id,
        medication_name=med_name,
        dosage=med_dose,
        action='discontinued',
        created_by=current_user.id
    )
    
    return {"message": "Medication discontinued successfully"}
