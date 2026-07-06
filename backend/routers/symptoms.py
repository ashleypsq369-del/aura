"""Symptoms Router"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import get_db, Symptom, User, get_recent_symptoms
from routers.auth import get_current_user

router = APIRouter()

class SymptomCreate(BaseModel):
    patient_id: int
    pain_level: int
    nausea: bool = False
    fatigue: bool = False
    anxiety: bool = False
    notes: str = ""

def _symptom_to_dict(s: Symptom) -> dict:
    """Safely convert Symptom ORM object to dict, handling None fields."""
    return {
        "id":          s.id,
        "patient_id":  s.patient_id,
        "recorded_at": s.recorded_at.isoformat() if s.recorded_at else None,
        "pain_level":  s.pain_level or 0,
        "nausea":      bool(s.nausea)   if s.nausea   is not None else False,
        "fatigue":     bool(s.fatigue)  if s.fatigue  is not None else False,
        "anxiety":     bool(s.anxiety)  if s.anxiety  is not None else False,
        "dyspnea":     bool(s.breathlessness and s.breathlessness > 0),
        "notes":       s.notes or "",
    }

@router.post("")
async def log_symptom(
    data: SymptomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symptom = Symptom(**data.dict(), recorded_by=current_user.id)
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return _symptom_to_dict(symptom)

@router.get("/{patient_id}")
async def get_symptoms(
    patient_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    symptoms = get_recent_symptoms(db, patient_id, limit)
    return [_symptom_to_dict(s) for s in symptoms]
