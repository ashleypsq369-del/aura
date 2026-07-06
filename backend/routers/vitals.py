"""Vitals Router"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import get_db, Vital, User, get_recent_vitals
from routers.auth import get_current_user

router = APIRouter()

class VitalCreate(BaseModel):
    patient_id: int
    heart_rate: float
    blood_pressure_sys: float
    blood_pressure_dia: float
    oxygen_saturation: float
    temperature: float

def _vital_to_dict(v: Vital) -> dict:
    """Safely convert Vital ORM object to dict. Exposes both field name variants
    so both PatientMonitor (blood_pressure_systolic) and PatientDetail
    (blood_pressure_sys) work correctly."""
    sys_val = getattr(v, 'blood_pressure_sys', None)
    dia_val = getattr(v, 'blood_pressure_dia', None)
    return {
        "id":                      v.id,
        "patient_id":              v.patient_id,
        "recorded_at":             v.recorded_at.isoformat() if v.recorded_at else None,
        "heart_rate":              v.heart_rate,
        # Both naming conventions supported
        "blood_pressure_sys":      sys_val,
        "blood_pressure_dia":      dia_val,
        "blood_pressure_systolic": sys_val,
        "blood_pressure_diastolic":dia_val,
        "oxygen_saturation":       v.oxygen_saturation,
        "temperature":             v.temperature,
        "respiratory_rate":        getattr(v, 'respiratory_rate', None),
        "notes":                   getattr(v, 'notes', None) or "",
        "source":                  getattr(v, 'source', 'manual'),
    }

@router.post("")
async def log_vital(
    data: VitalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vital = Vital(**data.dict(), recorded_by=current_user.id)
    db.add(vital)
    db.commit()
    db.refresh(vital)
    return _vital_to_dict(vital)

@router.get("/{patient_id}")
async def get_vitals(
    patient_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vitals = get_recent_vitals(db, patient_id, limit)
    return [_vital_to_dict(v) for v in vitals]
