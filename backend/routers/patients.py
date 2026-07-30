"""
Patients Router  --  Project Aura
CRUD operations for patient records with full intake validation and RBAC.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import re
from sqlalchemy.orm import Session

from src.db import (
    get_db, Patient, User, PatientFamilyLink, AuditLog,
    get_all_patients, get_patient, Vital, Medication
)
from routers.auth import get_current_user
from services.audit_service import log_action

router = APIRouter()


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class PatientResponse(BaseModel):
    id: int
    patient_code: str
    full_name: str
    age: int
    gender: Optional[str]
    primary_diagnosis: Optional[str]
    secondary_diagnoses: Optional[str]
    admission_date: Optional[datetime]
    status: str
    care_pathway: Optional[str]
    risk_score: float
    risk_level: Optional[str]
    last_assessment: Optional[datetime]
    region: Optional[str]
    district: Optional[str]
    facility_name: Optional[str]
    ghana_card_number: Optional[str]
    nhis_number: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    preferred_language: Optional[str]
    religious_preference: Optional[str]
    advance_directive: Optional[bool]
    dnr_status: Optional[bool]
    emergency_contact_name: Optional[str]
    emergency_contact_relationship: Optional[str]
    emergency_contact_phone: Optional[str]
    primary_clinician_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PatientCreate(BaseModel):
    patient_code: str
    full_name: str
    date_of_birth: datetime
    gender: str
    ghana_card_number: Optional[str] = None
    nhis_number: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    region: str
    district: str
    facility_name: str
    primary_diagnosis: str
    secondary_diagnoses: Optional[str] = None
    admission_date: Optional[datetime] = None
    preferred_language: Optional[str] = "en"
    religious_preference: Optional[str] = None
    advance_directive: Optional[bool] = False
    dnr_status: Optional[bool] = False
    emergency_contact_name: str
    emergency_contact_relationship: str
    emergency_contact_phone: str
    primary_clinician_id: Optional[int] = None
    care_pathway: Optional[str] = "standard"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def check_patient_access(patient_id: int, user: User, db: Session) -> bool:
    """Check if user has access to patient"""
    # Admin and clinician have access to all
    if user.role in ['admin', 'clinician']:
        return True
    
    # Caregiver: check assignment
    if user.role == 'caregiver':
        from src.db import CaregiverAssignment
        assignment = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.patient_id == patient_id,
            CaregiverAssignment.caregiver_id == user.id,
            CaregiverAssignment.active == True
        ).first()
        return assignment is not None
    
    # Patient: check if this is their own record
    # Allow access if patient_id matches user.id OR if their preferences link to this patient
    if user.role == 'patient':
        # Direct match: user.id == patient_id (most common case)
        if user.id == patient_id:
            return True
        
        # Check preferences table for linked patient_id
        from src.db import PatientPreferences
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == user.id,
            PatientPreferences.patient_id == patient_id
        ).first()
        if prefs:
            return True
        
        # Fallback: check by full_name match
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        return patient and patient.full_name == user.full_name
    
    # Family: check family link
    if user.role == 'family':
        link = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.patient_id == patient_id,
            PatientFamilyLink.family_user_id == user.id
        ).first()
        return link is not None
    
    return False


def validate_intake_data(data: PatientCreate):
    """Perform validation checks on critical demographic and health fields."""
    # Ghana Card validation (GHA-XXXXXXXXX-X)
    if data.ghana_card_number:
        if not re.match(r"^GHA-\d{9}-\d$", data.ghana_card_number):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ghana Card number must match format: GHA-XXXXXXXXX-X"
            )
            
    # NHIS card validation (8 digits)
    if data.nhis_number:
        if not re.match(r"^\d{8}$", data.nhis_number):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="NHIS number must be exactly 8 digits"
            )
            
    # Phone number validation (at least 9 digits)
    if data.phone:
        digits = "".join(filter(str.isdigit, data.phone))
        if len(digits) < 9:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must contain at least 9 digits"
            )
            
    # Emergency contact phone validation (at least 9 digits)
    if data.emergency_contact_phone:
        digits = "".join(filter(str.isdigit, data.emergency_contact_phone))
        if len(digits) < 9:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Emergency contact phone must contain at least 9 digits"
            )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[PatientResponse])
async def list_patients(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all patients (filtered by role)."""
    # Admin and clinician see all
    if current_user.role in ['admin', 'clinician']:
        patients = get_all_patients(db, status)
        return patients
    
    # Caregiver: only assigned patients
    if current_user.role == 'caregiver':
        from src.db import CaregiverAssignment
        assignments = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.caregiver_id == current_user.id,
            CaregiverAssignment.active == True
        ).all()
        patient_ids = [a.patient_id for a in assignments]
        query = db.query(Patient).filter(Patient.id.in_(patient_ids))
        if status:
            query = query.filter(Patient.status == status)
        return query.all()
    
    # Patient: only own record
    if current_user.role == 'patient':
        patient = db.query(Patient).filter(
            Patient.full_name == current_user.full_name
        ).first()
        return [patient] if patient else []
    
    # Family: linked patients
    if current_user.role == 'family':
        links = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.family_user_id == current_user.id
        ).all()
        patient_ids = [link.patient_id for link in links]
        query = db.query(Patient).filter(Patient.id.in_(patient_ids))
        if status:
            query = query.filter(Patient.status == status)
        return query.all()
    
    return []


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient_by_id(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single patient by ID."""
    if not check_patient_access(patient_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient"
        )
    
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new patient (admin/clinician only)."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and clinicians can create patients"
        )
    
    # Validation
    validate_intake_data(patient_data)
    
    # Check if patient code exists
    existing = db.query(Patient).filter(Patient.patient_code == patient_data.patient_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient code already exists"
        )
    
    clinician_id = patient_data.primary_clinician_id or current_user.id

    # Create patient record
    patient = Patient(
        patient_code=patient_data.patient_code,
        full_name=patient_data.full_name,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        ghana_card_number=patient_data.ghana_card_number,
        nhis_number=patient_data.nhis_number,
        phone=patient_data.phone,
        address=patient_data.address,
        region=patient_data.region,
        district=patient_data.district,
        facility_name=patient_data.facility_name,
        primary_diagnosis=patient_data.primary_diagnosis,
        secondary_diagnoses=patient_data.secondary_diagnoses,
        admission_date=patient_data.admission_date or datetime.utcnow(),
        preferred_language=patient_data.preferred_language,
        religious_preference=patient_data.religious_preference,
        advance_directive=patient_data.advance_directive,
        dnr_status=patient_data.dnr_status,
        emergency_contact_name=patient_data.emergency_contact_name,
        emergency_contact_relationship=patient_data.emergency_contact_relationship,
        emergency_contact_phone=patient_data.emergency_contact_phone,
        primary_clinician_id=clinician_id,
        care_pathway=patient_data.care_pathway,
        status='active'
    )
    
    db.add(patient)
    db.flush() # get ID

    # Log creation (with IP + user-agent)
    log_action(db, user=current_user, action="CREATE_PATIENT",
               resource_type="patient", resource_id=patient.id,
               patient_id=patient.id, request=request,
               details={"patient_code": patient_data.patient_code,
                        "diagnosis": patient_data.primary_diagnosis})
    db.commit()
    db.refresh(patient)
    
    # Track admission as journey event
    from services.journey_tracker import track_admission
    track_admission(
        db=db,
        patient_id=patient.id,
        admission_date=patient.admission_date or datetime.utcnow(),
        diagnosis=patient.primary_diagnosis,
        created_by=current_user.id
    )
    
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit patient details (clinician/admin only)."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and clinicians can edit patient records"
        )
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Validation
    validate_intake_data(patient_data)

    # Check if patient code changed and is already taken
    if patient.patient_code != patient_data.patient_code:
        existing = db.query(Patient).filter(Patient.patient_code == patient_data.patient_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient code already exists"
            )

    # Update fields
    patient.patient_code = patient_data.patient_code
    patient.full_name = patient_data.full_name
    patient.date_of_birth = patient_data.date_of_birth
    patient.gender = patient_data.gender
    patient.ghana_card_number = patient_data.ghana_card_number
    patient.nhis_number = patient_data.nhis_number
    patient.phone = patient_data.phone
    patient.address = patient_data.address
    patient.region = patient_data.region
    patient.district = patient_data.district
    patient.facility_name = patient_data.facility_name
    patient.primary_diagnosis = patient_data.primary_diagnosis
    patient.secondary_diagnoses = patient_data.secondary_diagnoses
    patient.admission_date = patient_data.admission_date or patient.admission_date
    patient.preferred_language = patient_data.preferred_language
    patient.religious_preference = patient_data.religious_preference
    patient.advance_directive = patient_data.advance_directive
    patient.dnr_status = patient_data.dnr_status
    patient.emergency_contact_name = patient_data.emergency_contact_name
    patient.emergency_contact_relationship = patient_data.emergency_contact_relationship
    patient.emergency_contact_phone = patient_data.emergency_contact_phone
    patient.care_pathway = patient_data.care_pathway
    if patient_data.primary_clinician_id:
        patient.primary_clinician_id = patient_data.primary_clinician_id

    # Log update (with IP + user-agent)
    log_action(db, user=current_user, action="UPDATE_PATIENT",
               resource_type="patient", resource_id=patient.id,
               patient_id=patient.id, request=request,
               details={"diagnosis": patient_data.primary_diagnosis,
                        "care_pathway": patient_data.care_pathway})
    db.commit()
    db.refresh(patient)

    return patient


@router.patch("/{patient_id}")
async def patch_patient(
    patient_id: int,
    update_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Partial update of patient record — used by onboarding questionnaire and self-service.
    Patients can update their own record; clinicians/admins can update any."""
    from services.access_control import assert_patient_access
    assert_patient_access(patient_id, current_user, db)

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Allowed fields for partial update
    PATCHABLE = {
        "date_of_birth", "gender", "primary_diagnosis", "secondary_diagnoses",
        "preferred_language", "religious_preference", "phone", "address",
        "region", "district", "advance_directive", "dnr_status",
        "emergency_contact_name", "emergency_contact_phone",
        "emergency_contact_relationship", "care_pathway",
    }

    updated = []
    for field, value in update_data.items():
        if field in PATCHABLE and hasattr(patient, field):
            # Parse date string if needed
            if field == "date_of_birth" and isinstance(value, str):
                try:
                    from datetime import datetime as dt
                    value = dt.strptime(value[:10], "%Y-%m-%d")
                except Exception:
                    continue
            setattr(patient, field, value)
            updated.append(field)

    if updated:
        db.commit()
        db.refresh(patient)

    return {"message": "Patient updated", "updated_fields": updated, "patient_id": patient_id}


@router.put("/{patient_id}/status")
async def update_patient_status(
    patient_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update patient status (clinician/admin only)."""
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and clinicians can update patient status"
        )
    
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    status_value = status_data.get('status')
    if not status_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status value is required"
        )
    
    old_status = patient.status
    patient.status = status_value
    if status_value == 'deceased':
        patient.deceased_at = datetime.utcnow()
    
    db.commit()
    
    # Track as journey event
    from services.journey_tracker import track_status_change
    track_status_change(
        db=db,
        patient_id=patient_id,
        old_status=old_status,
        new_status=status_value,
        created_by=current_user.id
    )
    
    return {"message": "Status updated", "status": status_value}


@router.get("/{patient_id}/vitals")
async def get_patient_vitals(
    patient_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient vitals history."""
    if not check_patient_access(patient_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient"
        )
    
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Fetch vitals ordered by most recent first
    vitals = db.query(Vital).filter(
        Vital.patient_id == patient_id
    ).order_by(Vital.recorded_at.desc()).limit(limit).all()
    
    # Transform to match frontend expectations
    vitals_list = []
    for vital in vitals:
        vitals_list.append({
            "id": vital.id,
            "patient_id": vital.patient_id,
            "recorded_at": vital.recorded_at.isoformat() if vital.recorded_at else None,
            "heart_rate": vital.heart_rate,
            # Both naming variants — PatientDetail uses _sys/_dia, other pages use _systolic/_diastolic
            "blood_pressure_sys":       vital.blood_pressure_sys,
            "blood_pressure_dia":       vital.blood_pressure_dia,
            "blood_pressure_systolic":  vital.blood_pressure_sys,
            "blood_pressure_diastolic": vital.blood_pressure_dia,
            "oxygen_saturation": vital.oxygen_saturation,
            "temperature": vital.temperature,
            "respiratory_rate": vital.respiratory_rate,
            "weight_kg": vital.weight_kg,
            "blood_glucose": vital.blood_glucose,
            "recorded_by": vital.recorded_by,
            "notes": vital.notes,
            "is_flagged": vital.is_flagged,
            "flag_reason": vital.flag_reason
        })
    
    return {
        "patient_id": patient_id,
        "vitals": vitals_list,
        "total": len(vitals_list)
    }


@router.get("/{patient_id}/medications")
async def get_patient_medications(
    patient_id: int,
    active_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient medications list."""
    if not check_patient_access(patient_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient"
        )
    
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Build query
    query = db.query(Medication).filter(Medication.patient_id == patient_id)
    
    if active_only:
        query = query.filter(Medication.is_active == True)
    
    medications = query.order_by(Medication.created_at.desc()).all()
    
    # Transform to match frontend expectations
    meds_list = []
    for med in medications:
        meds_list.append({
            "id": med.id,
            "patient_id": med.patient_id,
            "name": med.name,
            "generic_name": med.generic_name,
            "dosage": f"{med.dose} {med.unit}" if med.dose and med.unit else med.dose,
            "dose": med.dose,
            "unit": med.unit,
            "frequency": med.frequency,
            "route": med.route,
            "indication": med.indication,
            "type": med.indication or "Medication",
            "start_date": med.start_date.isoformat() if med.start_date else None,
            "end_date": med.end_date.isoformat() if med.end_date else None,
            "is_active": med.is_active,
            "is_prn": med.is_prn,
            "prn_max_dose": med.prn_max_dose,
            "instructions": med.special_instructions,
            "discontinued_at": med.discontinued_at.isoformat() if med.discontinued_at else None,
            "discontinued_by": med.discontinued_by,
            "discontinue_reason": med.discontinue_reason,
            "prescribed_by": med.prescribed_by,
            "created_at": med.created_at.isoformat() if med.created_at else None
        })
    
    return {
        "patient_id": patient_id,
        "medications": meds_list,
        "total": len(meds_list),
        "active_count": len([m for m in meds_list if m["is_active"]])
    }
