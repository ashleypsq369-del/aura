"""
Ghana Homecare Features Router
Eight features inspired by GNA Healthcare, AgedCare Ghana, JASBEK,
Nurse 24/7 and CareEdge homecare sites.

Endpoints:
  POST   /api/appointments/{id}/complete-with-report
  GET    /api/appointments/{id}/visit-report
  GET    /api/wound-care/{patient_id}
  POST   /api/wound-care/{patient_id}
  GET    /api/caregiver-ratings/{caregiver_id}
  POST   /api/caregiver-ratings
  PUT    /api/patients/{id}/cultural-profile
  GET    /api/care-pathways/options
  POST   /api/care-pathways
  GET    /api/care-pathways/{patient_id}
  GET    /api/caregiver-trust/{user_id}
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import (
    get_db, Appointment, Patient, User, UserProfile, Vital, Symptom,
    VisitReport, WoundCareLog, CaregiverRating, CarePathwayPreference,
    CaregiverAssignment, NotificationQueue, PatientFamilyLink,
    PatientPreferences,
)
from routers.auth import get_current_user

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _require_clinician_or_admin(user: User):
    if user.role not in ("clinician", "admin"):
        raise HTTPException(status_code=403, detail="Only clinicians/admins may perform this action")


def _notify_family(db: Session, patient_id: int, title: str, body: str):
    """Push a notification to all family users linked to this patient."""
    from src.db import PatientFamilyLink
    links = db.query(PatientFamilyLink).filter(
        PatientFamilyLink.patient_id == patient_id
    ).all()
    for link in links:
        notif = NotificationQueue(
            recipient_id=link.family_user_id,
            notification_type="visit_report",
            title=title,
            body=body,
            is_read=False,
        )
        db.add(notif)


# ─────────────────────────────────────────────────────────────────────────────
# 1 & 2: Complete appointment + auto-generate visit report
# ─────────────────────────────────────────────────────────────────────────────

class CompleteVisitData(BaseModel):
    nurse_notes: str = ""
    wound_observations: str = ""
    pain_score: int = 5
    overall_condition: str = "stable"   # improving / stable / worsening
    next_visit_recommendations: str = ""
    medications_given: List[Dict[str, Any]] = []


@router.post("/appointments/{appointment_id}/complete-with-report")
def complete_with_report(
    appointment_id: int,
    data: CompleteVisitData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_clinician_or_admin(current_user)

    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Mark appointment completed
    appt.status = "completed"
    appt.completed_at = datetime.utcnow()
    appt.completion_notes = data.nurse_notes

    # Pull latest vitals for this patient
    latest_vital = (
        db.query(Vital)
        .filter(Vital.patient_id == appt.patient_id)
        .order_by(Vital.recorded_at.desc())
        .first()
    )
    vitals_summary = {}
    if latest_vital:
        vitals_summary = {
            "blood_pressure": f"{int(latest_vital.blood_pressure_sys or 0)}/{int(latest_vital.blood_pressure_dia or 0)}",
            "heart_rate": latest_vital.heart_rate,
            "temperature": latest_vital.temperature,
            "oxygen_saturation": latest_vital.oxygen_saturation,
            "recorded_at": latest_vital.recorded_at.isoformat() if latest_vital.recorded_at else None,
        }

    # Create visit report
    report = VisitReport(
        appointment_id=appointment_id,
        patient_id=appt.patient_id,
        nurse_id=current_user.id,
        vitals_summary=vitals_summary,
        medications_given=data.medications_given,
        nurse_notes=data.nurse_notes,
        wound_observations=data.wound_observations,
        pain_score=data.pain_score,
        overall_condition=data.overall_condition,
        next_visit_recommendations=data.next_visit_recommendations,
        sent_to_family=False,
    )
    db.add(report)

    # Notify family
    patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
    patient_name = patient.full_name if patient else "Your loved one"
    nurse_name = current_user.full_name

    _notify_family(
        db,
        appt.patient_id,
        title=f"Visit Complete — {patient_name}",
        body=f"{nurse_name} has completed a visit. Condition: {data.overall_condition.title()}. Tap to view the full report.",
    )
    report.sent_to_family = True
    report.sent_at = datetime.utcnow()

    db.commit()
    db.refresh(report)

    return {
        "message": "Appointment completed and visit report generated",
        "report_id": report.id,
        "appointment_id": appointment_id,
        "overall_condition": data.overall_condition,
        "sent_to_family": report.sent_to_family,
    }


@router.get("/appointments/{appointment_id}/visit-report")
def get_visit_report(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = (
        db.query(VisitReport)
        .filter(VisitReport.appointment_id == appointment_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="No visit report for this appointment")

    # Lookup nurse name
    nurse = db.query(User).filter(User.id == report.nurse_id).first()
    return {
        "id": report.id,
        "appointment_id": appointment_id,
        "patient_id": report.patient_id,
        "nurse_name": nurse.full_name if nurse else "Unknown",
        "vitals_summary": report.vitals_summary or {},
        "medications_given": report.medications_given or [],
        "nurse_notes": report.nurse_notes,
        "wound_observations": report.wound_observations,
        "pain_score": report.pain_score,
        "overall_condition": report.overall_condition,
        "next_visit_recommendations": report.next_visit_recommendations,
        "generated_at": report.generated_at.isoformat() if report.generated_at else None,
        "sent_to_family": report.sent_to_family,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5: Wound Care Module
# ─────────────────────────────────────────────────────────────────────────────

class WoundCareCreate(BaseModel):
    wound_site: str
    description: str = ""
    healing_stage: str = "stable"
    wound_type: str = "other"
    size_cm: str = ""
    depth: str = "superficial"
    exudate: str = "none"
    odour: bool = False
    treatment_applied: str = ""


@router.get("/wound-care/{patient_id}")
def list_wound_care(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(WoundCareLog)
        .filter(WoundCareLog.patient_id == patient_id)
        .order_by(WoundCareLog.created_at.desc())
        .all()
    )
    result = []
    for log in logs:
        recorder = db.query(User).filter(User.id == log.recorded_by).first()
        result.append({
            "id": log.id,
            "wound_site": log.wound_site,
            "description": log.description,
            "healing_stage": log.healing_stage,
            "wound_type": log.wound_type,
            "size_cm": log.size_cm,
            "depth": log.depth,
            "exudate": log.exudate,
            "odour": log.odour,
            "treatment_applied": log.treatment_applied,
            "photo_path": log.photo_path,
            "recorded_by": recorder.full_name if recorder else "Unknown",
            "created_at": log.created_at.isoformat(),
        })
    return result


@router.post("/wound-care/{patient_id}", status_code=201)
def create_wound_log(
    patient_id: int,
    data: WoundCareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_clinician_or_admin(current_user)
    log = WoundCareLog(
        patient_id=patient_id,
        recorded_by=current_user.id,
        **data.dict(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"id": log.id, "message": "Wound care log created"}


# ─────────────────────────────────────────────────────────────────────────────
# 6: Cultural Care Profile
# ─────────────────────────────────────────────────────────────────────────────

class CulturalProfileUpdate(BaseModel):
    preferred_language: Optional[str] = None    # en/tw/ga/ee/ha/dag
    religious_preference: Optional[str] = None
    dietary_notes: Optional[str] = None
    cultural_practices: Optional[str] = None
    wants_spiritual_care: Optional[bool] = None
    cultural_notes: Optional[str] = None


@router.put("/patients/{patient_id}/cultural-profile")
def update_cultural_profile(
    patient_id: int,
    data: CulturalProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if data.preferred_language is not None:
        patient.preferred_language = data.preferred_language
    if data.religious_preference is not None:
        patient.religious_preference = data.religious_preference

    # PatientPreferences for richer cultural data
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.patient_id == patient_id
    ).first()
    if not prefs:
        prefs = PatientPreferences(patient_id=patient_id, user_id=current_user.id)
        db.add(prefs)

    if data.cultural_practices is not None:
        prefs.cultural_practices = data.cultural_practices
    if data.wants_spiritual_care is not None:
        prefs.wants_spiritual_care = data.wants_spiritual_care
    if data.cultural_notes is not None:
        prefs.religious_background = data.cultural_notes

    db.commit()
    return {"message": "Cultural profile updated"}


@router.get("/patients/{patient_id}/cultural-profile")
def get_cultural_profile(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.patient_id == patient_id
    ).first()

    return {
        "preferred_language": patient.preferred_language,
        "religious_preference": patient.religious_preference,
        "cultural_practices": prefs.cultural_practices if prefs else None,
        "wants_spiritual_care": prefs.wants_spiritual_care if prefs else False,
        "cultural_notes": prefs.religious_background if prefs else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 7: Care Pathway Selector
# ─────────────────────────────────────────────────────────────────────────────

PATHWAY_OPTIONS = [
    {
        "key": "nursing",
        "title": "Nursing Care",
        "description": "Skilled nurse visits for wound care, injections, and clinical monitoring",
        "icon": "Stethoscope",
        "services": ["wound_care", "vitals_monitoring", "medication_management", "clinical_assessment"],
        "color": "#0d9488",
    },
    {
        "key": "clinical",
        "title": "Clinical Support",
        "description": "Doctor consultations, palliative assessments, and care planning",
        "icon": "ClipboardList",
        "services": ["doctor_visits", "palliative_assessment", "care_plan_review", "prescriptions"],
        "color": "#0891b2",
    },
    {
        "key": "family",
        "title": "Family Care Support",
        "description": "Training, guidance, and emotional support for family caregivers",
        "icon": "Heart",
        "services": ["caregiver_training", "emotional_support", "respite_care", "bereavement_prep"],
        "color": "#d97706",
    },
    {
        "key": "escort",
        "title": "Medical Escort",
        "description": "Accompanying patient to hospital appointments and specialist visits",
        "icon": "Navigation",
        "services": ["hospital_escort", "appointment_coordination", "transport_support"],
        "color": "#7c3aed",
    },
    {
        "key": "respite",
        "title": "Respite Care",
        "description": "Temporary relief for family caregivers — in-home or residential stay",
        "icon": "Coffee",
        "services": ["in_home_respite", "residential_respite", "overnight_care"],
        "color": "#059669",
    },
]


@router.get("/care-pathways/options")
def get_pathway_options(current_user: User = Depends(get_current_user)):
    return {"pathways": PATHWAY_OPTIONS}


class PathwaySelectData(BaseModel):
    patient_id: int
    pathway_type: str
    selected_services: List[str] = []
    primary_concern: str = ""
    support_level: str = "standard"


@router.post("/care-pathways", status_code=201)
def select_pathway(
    data: PathwaySelectData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Upsert
    existing = db.query(CarePathwayPreference).filter(
        CarePathwayPreference.patient_id == data.patient_id
    ).first()

    if existing:
        existing.pathway_type = data.pathway_type
        existing.selected_services = data.selected_services
        existing.primary_concern = data.primary_concern
        existing.support_level = data.support_level
        existing.updated_at = datetime.utcnow()
    else:
        pref = CarePathwayPreference(
            patient_id=data.patient_id,
            user_id=current_user.id,
            pathway_type=data.pathway_type,
            selected_services=data.selected_services,
            primary_concern=data.primary_concern,
            support_level=data.support_level,
        )
        db.add(pref)

    # Also update care_pathway on Patient table
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if patient:
        patient.care_pathway = data.pathway_type

    db.commit()
    return {"message": "Care pathway selected", "pathway_type": data.pathway_type}


@router.get("/care-pathways/{patient_id}")
def get_patient_pathway(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pref = db.query(CarePathwayPreference).filter(
        CarePathwayPreference.patient_id == patient_id
    ).first()
    if not pref:
        return {"pathway_type": None, "selected_services": [], "primary_concern": "", "support_level": "standard"}
    return {
        "pathway_type": pref.pathway_type,
        "selected_services": pref.selected_services or [],
        "primary_concern": pref.primary_concern,
        "support_level": pref.support_level,
        "selected_at": pref.selected_at.isoformat() if pref.selected_at else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8: Service Quality / Caregiver Ratings
# ─────────────────────────────────────────────────────────────────────────────

class RatingCreate(BaseModel):
    appointment_id: int
    caregiver_id: int
    patient_id: int
    rating: int   # 1-5
    comment: str = ""
    category_scores: Dict[str, int] = {}


@router.post("/caregiver-ratings", status_code=201)
def submit_rating(
    data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not 1 <= data.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    # Prevent duplicate rating for same appointment
    existing = db.query(CaregiverRating).filter(
        CaregiverRating.appointment_id == data.appointment_id,
        CaregiverRating.created_by == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already rated this visit")

    r = CaregiverRating(
        appointment_id=data.appointment_id,
        caregiver_id=data.caregiver_id,
        patient_id=data.patient_id,
        rating=data.rating,
        comment=data.comment,
        category_scores=data.category_scores,
        created_by=current_user.id,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"id": r.id, "message": "Thank you for your feedback"}


@router.get("/caregiver-ratings/{caregiver_id}")
def get_caregiver_ratings(
    caregiver_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ratings = (
        db.query(CaregiverRating)
        .filter(CaregiverRating.caregiver_id == caregiver_id)
        .order_by(CaregiverRating.created_at.desc())
        .all()
    )
    total = len(ratings)
    avg = round(sum(r.rating for r in ratings) / total, 1) if total > 0 else 0.0

    return {
        "caregiver_id": caregiver_id,
        "average_rating": avg,
        "total_reviews": total,
        "ratings": [
            {
                "id": r.id,
                "appointment_id": r.appointment_id,
                "rating": r.rating,
                "comment": r.comment,
                "category_scores": r.category_scores or {},
                "created_at": r.created_at.isoformat(),
            }
            for r in ratings
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3: Caregiver Trust Profile
# ─────────────────────────────────────────────────────────────────────────────

class TrustProfileUpdate(BaseModel):
    nmc_pin: Optional[str] = None
    ghana_card_verified: Optional[bool] = None
    is_professional: Optional[bool] = None
    professional_title: Optional[str] = None
    specialisation: Optional[str] = None


@router.get("/caregiver-trust/{user_id}")
def get_trust_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    # Compute average rating
    ratings_q = db.query(CaregiverRating).filter(CaregiverRating.caregiver_id == user_id).all()
    total = len(ratings_q)
    avg_rating = round(sum(r.rating for r in ratings_q) / total, 1) if total > 0 else None

    # Patient count
    patient_count = db.query(CaregiverAssignment).filter(
        CaregiverAssignment.caregiver_id == user_id,
        CaregiverAssignment.active == True,
    ).count()

    return {
        "user_id": user_id,
        "full_name": user.full_name,
        "role": user.role,
        "is_professional": user.is_professional,
        "professional_title": user.professional_title,
        "nmc_pin": profile.license_number if profile else None,
        "ghana_card_verified": user.is_verified,
        "specialisation": profile.specialisation if profile else None,
        "facility_name": profile.facility_name if profile else None,
        "region": profile.region if profile else None,
        "average_rating": avg_rating,
        "total_reviews": total,
        "active_patients": patient_count,
    }


@router.put("/caregiver-trust/{user_id}")
def update_trust_profile(
    user_id: int,
    data: TrustProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    if data.nmc_pin is not None:
        profile.license_number = data.nmc_pin
    if data.specialisation is not None:
        profile.specialisation = data.specialisation
    if data.ghana_card_verified is not None:
        user.is_verified = data.ghana_card_verified
    if data.is_professional is not None:
        user.is_professional = data.is_professional
    if data.professional_title is not None:
        user.professional_title = data.professional_title

    db.commit()
    return {"message": "Trust profile updated"}
