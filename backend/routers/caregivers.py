"""Caregivers Router  --  team directory, assignments, and caregiver patient access."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from src.db import (
    get_db, User, Patient, CaregiverAssignment, Vital, Medication, Alert, AuditLog
)
from routers.auth import get_current_user

router = APIRouter()


class CaregiverResponse(BaseModel):
    id: int
    full_name: str
    role: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class AssignCaregiverRequest(BaseModel):
    patient_id: int
    caregiver_id: int
    notes: Optional[str] = None


@router.get("", response_model=List[CaregiverResponse])
async def get_caregivers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of all caregivers and clinicians."""
    return db.query(User).filter(User.role.in_(['caregiver', 'clinician'])).all()


@router.get("/my-patients")
async def get_my_assigned_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Caregiver: full care snapshot for each assigned patient."""
    if current_user.role != 'caregiver':
        raise HTTPException(status_code=403, detail="Caregiver access only")

    assignments = db.query(CaregiverAssignment).filter(
        CaregiverAssignment.caregiver_id == current_user.id,
        CaregiverAssignment.active == True,
    ).all()

    patients = []
    for assignment in assignments:
        patient = db.query(Patient).filter(Patient.id == assignment.patient_id).first()
        if not patient:
            continue

        latest_vital = db.query(Vital).filter(
            Vital.patient_id == patient.id
        ).order_by(Vital.recorded_at.desc()).first()

        active_meds = db.query(Medication).filter(
            Medication.patient_id == patient.id,
            Medication.is_active == True,
        ).count()

        open_alerts = db.query(Alert).filter(
            Alert.patient_id == patient.id,
            Alert.is_acknowledged == False,
        ).count()

        patients.append({
            "assignment_id": assignment.id,
            "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
            "assignment_notes": assignment.notes,
            "patient": {
                "id": patient.id,
                "patient_code": patient.patient_code,
                "full_name": patient.full_name,
                "age": patient.age,
                "gender": patient.gender,
                "primary_diagnosis": patient.primary_diagnosis,
                "status": patient.status,
                "care_pathway": patient.care_pathway,
                "risk_score": patient.risk_score,
                "risk_level": patient.risk_level,
                "phone": patient.phone,
                "address": patient.address,
                "facility_name": patient.facility_name,
                "emergency_contact_name": patient.emergency_contact_name,
                "emergency_contact_phone": patient.emergency_contact_phone,
            },
            "care_summary": {
                "latest_vital": {
                    "blood_pressure": f"{int(latest_vital.blood_pressure_sys)}/{int(latest_vital.blood_pressure_dia)}" if latest_vital and latest_vital.blood_pressure_sys else None,
                    "heart_rate": latest_vital.heart_rate if latest_vital else None,
                    "temperature": latest_vital.temperature if latest_vital else None,
                    "oxygen_saturation": latest_vital.oxygen_saturation if latest_vital else None,
                    "recorded_at": latest_vital.recorded_at.isoformat() if latest_vital and latest_vital.recorded_at else None,
                } if latest_vital else None,
                "active_medications": active_meds,
                "open_alerts": open_alerts,
            },
        })

    return {"patients": patients, "total": len(patients)}


@router.get("/assignments")
async def list_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin/clinician: all active caregiver-patient assignments."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")

    rows = db.query(CaregiverAssignment, Patient, User).join(
        Patient, CaregiverAssignment.patient_id == Patient.id
    ).join(
        User, CaregiverAssignment.caregiver_id == User.id
    ).filter(
        CaregiverAssignment.active == True
    ).order_by(CaregiverAssignment.assigned_at.desc()).all()

    return {
        "assignments": [
            {
                "id": a.id,
                "patient_id": p.id,
                "patient_name": p.full_name,
                "patient_code": p.patient_code,
                "caregiver_id": u.id,
                "caregiver_name": u.full_name,
                "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
                "notes": a.notes,
            }
            for a, p, u in rows
        ]
    }


@router.post("/assign")
async def assign_caregiver(
    data: AssignCaregiverRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin/clinician: assign a caregiver to a patient."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")

    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    caregiver = db.query(User).filter(
        User.id == data.caregiver_id,
        User.role == 'caregiver',
    ).first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    existing = db.query(CaregiverAssignment).filter(
        CaregiverAssignment.patient_id == data.patient_id,
        CaregiverAssignment.caregiver_id == data.caregiver_id,
        CaregiverAssignment.active == True,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Caregiver already assigned to this patient")

    assignment = CaregiverAssignment(
        patient_id=data.patient_id,
        caregiver_id=data.caregiver_id,
        assigned_by=current_user.id,
        notes=data.notes,
        assigned_at=datetime.utcnow(),
        active=True,
    )
    db.add(assignment)

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="caregiver_assigned",
        resource_type="caregiver_assignment",
        patient_id=data.patient_id,
        details=f'{{"caregiver_id": {data.caregiver_id}}}',
    )
    db.add(audit)
    db.commit()
    db.refresh(assignment)

    return {
        "message": f"{caregiver.full_name} assigned to {patient.full_name}",
        "assignment_id": assignment.id,
    }


@router.delete("/assignments/{assignment_id}")
async def remove_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin/clinician: deactivate a caregiver assignment."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")

    assignment = db.query(CaregiverAssignment).filter(
        CaregiverAssignment.id == assignment_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.active = False

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="caregiver_unassigned",
        resource_type="caregiver_assignment",
        resource_id=assignment_id,
        patient_id=assignment.patient_id,
    )
    db.add(audit)
    db.commit()

    return {"message": "Assignment removed"}
