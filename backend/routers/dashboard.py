"""Dashboard Router — role-scoped summary data"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.db import get_db, User, Patient, Alert, CaregiverAssignment, PatientFamilyLink
from routers.auth import get_current_user

router = APIRouter()


def _patient_summary(p: Patient) -> dict:
    return {
        "id": p.id,
        "patient_code": p.patient_code,
        "full_name": p.full_name,
        "age": p.age,
        "primary_diagnosis": p.primary_diagnosis,
        "risk_level": p.risk_level,
        "risk_score": p.risk_score,
        "care_pathway": p.care_pathway,
        "status": p.status,
    }


@router.get("/summary")
async def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Role-scoped dashboard summary.

    admin / clinician → all patients
    caregiver         → only assigned patients
    patient           → own record only
    family            → linked patients only
    """
    from services.access_control import get_accessible_patient_ids

    # ── Admin / Clinician ────────────────────────────────────────────────────
    if current_user.role in ("admin", "clinician"):
        total_patients = db.query(Patient).filter(Patient.status == "active").count()
        high_risk = db.query(Patient).filter(
            Patient.risk_level.in_(["High", "Crisis"])
        ).count()
        active_alerts = db.query(Alert).filter(
            Alert.is_acknowledged == False,
            Alert.is_dismissed == False,
        ).count()

        patients = (
            db.query(Patient)
            .filter(Patient.status == "active")
            .order_by(Patient.risk_score.desc())
            .limit(10)
            .all()
        )
        return {
            "role": current_user.role,
            "stats": {
                "total_patients": total_patients,
                "high_risk_patients": high_risk,
                "active_alerts": active_alerts,
                "avg_pain_score": 5.2,
            },
            "patients": [_patient_summary(p) for p in patients],
            "recent_alerts": [],
        }

    # ── Caregiver ────────────────────────────────────────────────────────────
    if current_user.role == "caregiver":
        allowed_ids = get_accessible_patient_ids(current_user, db) or []
        patients = (
            db.query(Patient)
            .filter(Patient.id.in_(allowed_ids), Patient.status == "active")
            .order_by(Patient.risk_score.desc())
            .all()
        )
        high_risk = sum(1 for p in patients if p.risk_level in ("High", "Crisis"))
        active_alerts = (
            db.query(Alert)
            .filter(
                Alert.patient_id.in_(allowed_ids),
                Alert.is_acknowledged == False,
                Alert.is_dismissed == False,
            )
            .count()
        )
        return {
            "role": current_user.role,
            "stats": {
                "total_patients": len(patients),
                "high_risk_patients": high_risk,
                "active_alerts": active_alerts,
                "avg_pain_score": None,
            },
            "patients": [_patient_summary(p) for p in patients],
            "recent_alerts": [],
        }

    # ── Patient ──────────────────────────────────────────────────────────────
    if current_user.role == "patient":
        allowed_ids = get_accessible_patient_ids(current_user, db) or []
        my_patients = (
            db.query(Patient).filter(Patient.id.in_(allowed_ids)).all()
        )
        my_alerts = (
            db.query(Alert)
            .filter(
                Alert.patient_id.in_(allowed_ids),
                Alert.is_acknowledged == False,
                Alert.is_dismissed == False,
            )
            .count()
        )
        return {
            "role": current_user.role,
            "stats": {
                "total_patients": len(my_patients),
                "active_alerts": my_alerts,
            },
            "patients": [_patient_summary(p) for p in my_patients],
            "recent_alerts": [],
        }

    # ── Family ───────────────────────────────────────────────────────────────
    if current_user.role == "family":
        allowed_ids = get_accessible_patient_ids(current_user, db) or []
        linked = db.query(Patient).filter(Patient.id.in_(allowed_ids)).all()
        return {
            "role": current_user.role,
            "stats": {
                "total_patients": len(linked),
            },
            "patients": [_patient_summary(p) for p in linked],
            "recent_alerts": [],
        }

    return {"role": current_user.role, "stats": {}, "patients": []}
