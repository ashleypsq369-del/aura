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
    from services.access_control import assert_patient_access
    assert_patient_access(patient_id, current_user, db)
    return db.query(Medication).filter(Medication.patient_id == patient_id, Medication.is_active == True).all()

@router.post("", response_model=MedicationResponse)
async def create_medication(data: MedicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from services.access_control import assert_patient_access
    from fastapi import HTTPException
    assert_patient_access(data.patient_id, current_user, db)
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Only clinicians and admins can prescribe medications")
    med = Medication(**data.dict(), prescribed_by=current_user.id, start_date=datetime.utcnow())
    db.add(med)
    db.commit()
    db.refresh(med)
    track_medication_change(db=db, patient_id=data.patient_id, medication_name=data.name, dosage=data.dose, action='added', created_by=current_user.id)
    return med

@router.put("/{medication_id}", response_model=MedicationResponse)
async def update_medication(medication_id: int, data: MedicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update medication details"""
    from services.access_control import assert_patient_access
    from fastapi import HTTPException
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Only clinicians and admins can update medications")
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    assert_patient_access(med.patient_id, current_user, db)
    med.name = data.name
    med.dose = data.dose
    med.frequency = data.frequency
    med.route = data.route
    med.indication = data.indication
    db.commit()
    db.refresh(med)
    track_medication_change(db=db, patient_id=data.patient_id, medication_name=data.name, dosage=data.dose, action='changed', created_by=current_user.id)
    return med

@router.delete("/{medication_id}")
async def delete_medication(medication_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Discontinue a medication"""
    from services.access_control import assert_patient_access
    from fastapi import HTTPException
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Only clinicians and admins can discontinue medications")
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    assert_patient_access(med.patient_id, current_user, db)
    patient_id = med.patient_id
    med_name = med.name
    med_dose = med.dose
    med.is_active = False
    db.commit()
    track_medication_change(db=db, patient_id=patient_id, medication_name=med_name, dosage=med_dose, action='discontinued', created_by=current_user.id)
    return {"message": "Medication discontinued successfully"}
