"""
advanced_ml.py â€" Router for Priorities 6-11 advanced ML endpoints.
Prefix: /api/advanced-ml
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.db import get_db, User, Medication
from routers.auth import get_current_user
from services.advanced_ml_service import (
    get_daily_checkin_trends,
    detect_longitudinal_deterioration,
    estimate_prognosis,
    detect_drug_interactions,
    assess_caregiver_burnout,
    process_prediction_feedback,
    save_prediction_feedback,
)

router = APIRouter()


# â"€â"€ P6 + P7: Patient full advanced analysis â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
@router.get("/patient/{patient_id}/full-analysis")
async def get_patient_full_analysis(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Combined endpoint:
    - P6: Daily wellness check-in trend features
    - P7: Longitudinal deterioration detection
    - P8: Survival/prognosis estimate
    - P9: Drug interaction screening
    """
    # P6 â€" check-in trends
    checkin_trends = get_daily_checkin_trends(patient_id, db, days=14)

    # P7 â€" deterioration
    deterioration = detect_longitudinal_deterioration(patient_id, db, window_days=30)

    # P8 â€" prognosis
    prognosis = estimate_prognosis(patient_id, db)

    # P9 â€" drug interactions (pull active meds)
    meds = (
        db.query(Medication)
        .filter(Medication.patient_id == patient_id, Medication.is_active == True)
        .all()
    )
    med_list = [{"name": m.name} for m in meds if m.name]
    interactions = detect_drug_interactions(med_list)

    return {
        "patient_id":       patient_id,
        "assessed_at":      datetime.utcnow().isoformat(),
        "checkin_trends":   checkin_trends,
        "deterioration":    deterioration,
        "prognosis":        prognosis,
        "drug_interactions": interactions,
        "interaction_count": len(interactions),
        "severe_interactions": [i for i in interactions if i["severity"] == "SEVERE"],
    }


@router.get("/patient/{patient_id}/deterioration")
async def get_deterioration(
    patient_id: int,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """P7 â€" Longitudinal deterioration detector only."""
    return detect_longitudinal_deterioration(patient_id, db, window_days=days)


@router.get("/patient/{patient_id}/prognosis")
async def get_prognosis(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """P8 â€" Survival/prognosis estimate."""
    return estimate_prognosis(patient_id, db)


@router.get("/patient/{patient_id}/drug-interactions")
async def get_drug_interactions(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """P9 â€" Drug interaction screening for a patient's active medications."""
    meds = (
        db.query(Medication)
        .filter(Medication.patient_id == patient_id, Medication.is_active == True)
        .all()
    )
    med_list = [{"name": m.name} for m in meds if m.name]
    interactions = detect_drug_interactions(med_list)
    return {
        "patient_id":        patient_id,
        "medication_count":  len(med_list),
        "medications":       [m["name"] for m in med_list],
        "interactions":      interactions,
        "severe_count":      sum(1 for i in interactions if i["severity"] == "SEVERE"),
        "moderate_count":    sum(1 for i in interactions if i["severity"] == "MODERATE"),
    }


# â"€â"€ P10: Caregiver burnout â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
@router.get("/caregiver/{user_id}/burnout")
async def get_caregiver_burnout(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """P10 â€" Caregiver burnout early warning."""
    if current_user.role not in ("admin", "clinician") and current_user.id != user_id:
        raise HTTPException(403, "Access denied")
    return assess_caregiver_burnout(user_id, db)


@router.get("/caregivers/burnout-overview")
async def get_all_caregiver_burnout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """P10 â€" Burnout risk for all caregivers (admin/clinician only)."""
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Clinical role required")

    caregivers = (
        db.query(User)
        .filter(User.role == "caregiver", User.is_active == True)
        .all()
    )
    results = []
    for cg in caregivers:
        risk = assess_caregiver_burnout(cg.id, db)
        results.append({
            "user_id":     cg.id,
            "name":        cg.full_name or cg.username,
            "burnout_level": risk["burnout_level"],
            "burnout_score": risk["burnout_score"],
            "signal_count":  len(risk["signals"]),
        })
    results.sort(key=lambda x: -x["burnout_score"])
    return {"caregivers": results, "total": len(results)}


# â"€â"€ P11: Feedback loop â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
from pydantic import BaseModel

class FeedbackRequest(BaseModel):
    prediction_id:      int
    feedback_type:      str   # agree | disagree | partially_agree
    note:               Optional[str] = None
    correct_risk_level: Optional[str] = None


@router.post("/feedback")
async def submit_prediction_feedback(
    payload: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """P11 â€" Submit clinician feedback on an ML prediction."""
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Clinical role required")

    ok = save_prediction_feedback(
        prediction_id=payload.prediction_id,
        clinician_user_id=current_user.id,
        feedback_type=payload.feedback_type,
        note=payload.note,
        correct_risk_level=payload.correct_risk_level,
        db=db,
    )
    if not ok:
        raise HTTPException(500, "Failed to save feedback")
    return {"status": "saved", "message": "Feedback recorded for model improvement"}


@router.get("/feedback/retrain-status")
async def get_retrain_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """P11 â€" Check if feedback loop has triggered a retrain request."""
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    return process_prediction_feedback(db, min_new_feedback=20)


# â"€â"€ Patients batch: drug interactions for all patients â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
@router.get("/patients/drug-interactions")
async def get_all_drug_interactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Batch drug interaction check across all active patients."""
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Clinical role required")

    from src.db import Patient
    patients = db.query(Patient).filter(
        Patient.status.in_(["active", "stable", "deteriorating"])
    ).limit(30).all()

    results = []
    for p in patients:
        meds = db.query(Medication).filter(
            Medication.patient_id == p.id, Medication.is_active == True
        ).all()
        med_list = [{"name": m.name} for m in meds if m.name]
        interactions = detect_drug_interactions(med_list)
        severe = [i for i in interactions if i["severity"] == "SEVERE"]
        if interactions:
            results.append({
                "patient_id":   p.id,
                "patient_name": p.full_name or "",
                "patient_code": p.patient_code or "",
                "med_count":    len(med_list),
                "total":        len(interactions),
                "severe":       len(severe),
                "top_warning":  interactions[0]["effect"] if interactions else None,
                "needs_review": len(severe) > 0,
            })

    results.sort(key=lambda x: (-x["severe"], -x["total"]))
    return {"patients": results, "with_severe_interactions": sum(1 for r in results if r["severe"] > 0)}

