"""
ml_predictions.py
==================
New ML prediction router using trained XGBoost models + real SHAP.
Replaces/augments comprehensive_ai.py with production-ready predictions.

Endpoints:
  GET  /api/ml/patient/{patient_id}/risk          -- full risk profile + SHAP
  GET  /api/ml/patient/{patient_id}/task/{task}   -- single task prediction
  GET  /api/ml/status                             -- model status
  GET  /api/ml/patients/batch-risk                -- all patients overview
  POST /api/ml/scheduler/trigger                  -- manual proactive scan
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import numpy as np

from src.db import (
    get_db, User, Patient, Vital, Symptom, Medication,
    ESASAssessment, PPSAssessment, Alert, Appointment,
    NotificationQueue,
)
from routers.auth import get_current_user
from services.ml_model_service import ml_service, get_ml_service
from services.evidence_based_scoring import (
    composite_palliative_risk, score_esas, score_ppi,
    score_pap, score_pps, score_phq9, score_gad7, score_barthel,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# â"â" Pydantic response models â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"

class FeatureContribution(BaseModel):
    feature:      str
    display_name: str
    value:        float
    shap_value:   float
    impact:       str   # increases_risk | decreases_risk | neutral
    importance:   float
    pct:          float


class TaskPrediction(BaseModel):
    task:          str
    probability:   float
    risk_level:    str   # normal | warning | critical
    shap_available:bool
    top_features:  List[FeatureContribution]
    base_value:    float
    metrics:       Dict[str, float]


class PatientRiskProfile(BaseModel):
    patient_id:       int
    patient_name:     str
    patient_code:     str
    assessed_at:      str
    overall_risk:     float
    overall_level:    str   # low | moderate | high | critical
    highest_task:     str
    tasks:            Dict[str, TaskPrediction]
    key_concerns:     List[str]
    recommended_actions: List[str]
    data_quality:     Dict[str, bool]   # which data sources were present
    models_available: int


class BatchRiskSummary(BaseModel):
    patient_id:   int
    patient_name: str
    patient_code: str
    overall_risk: float
    risk_level:   str
    top_concern:  str
    assessed_at:  str


# â"â" Patient feature extraction â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"

def extract_patient_features(patient_id: int, db: Session) -> Dict[str, Any]:
    """
    Pull all available patient data from DB and map to model feature names.
    Fills missing values with clinically appropriate defaults.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, f"Patient {patient_id} not found")

    f: Dict[str, Any] = {}
    data_quality: Dict[str, bool] = {}

    # â"â" Demographics â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    f["age"] = float(patient.age or 70)

    # â"â" Vital signs (last reading + trend) â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    vitals = (
        db.query(Vital)
        .filter(Vital.patient_id == patient_id)
        .order_by(Vital.recorded_at.desc())
        .limit(10)
        .all()
    )
    data_quality["vitals"] = bool(vitals)

    def safe_mean(vals): return float(np.mean(vals)) if vals else None

    if vitals:
        v = vitals[0]
        f["heart_rate"]          = float(v.heart_rate or 80)
        f["bp_systolic"]         = float(v.blood_pressure_systolic or v.blood_pressure_sys or 120) \
                                   if hasattr(v, "blood_pressure_systolic") else float(v.blood_pressure_sys or 120)
        f["bp_diastolic"]        = float(v.blood_pressure_diastolic or v.blood_pressure_dia or 78) \
                                   if hasattr(v, "blood_pressure_diastolic") else float(v.blood_pressure_dia or 78)
        f["oxygen_saturation"]   = float(v.oxygen_saturation or 95)
        f["temperature"]         = float(v.temperature or 37.0)
        f["respiratory_rate"]    = float(v.respiratory_rate or 16)
    else:
        f.update(heart_rate=80, bp_systolic=120, bp_diastolic=78,
                 oxygen_saturation=95, temperature=37.0, respiratory_rate=16)

    # â"â" ESAS assessments â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    esas = (
        db.query(ESASAssessment)
        .filter(ESASAssessment.patient_id == patient_id)
        .order_by(ESASAssessment.assessed_at.desc())
        .first()
    )
    data_quality["esas"] = bool(esas)

    if esas:
        f["esas_pain"]      = float(esas.pain or 0)
        f["esas_tired"]     = float(esas.tiredness or 0)
        f["esas_nausea"]    = float(esas.nausea or 0)
        f["esas_depress"]   = float(esas.depression or 0)
        f["esas_anxiety"]   = float(esas.anxiety or 0)
        f["esas_drowsy"]    = float(getattr(esas, "drowsiness", 0) or 0)
        f["esas_appetite"]  = float(getattr(esas, "lack_of_appetite", 0) or
                                     getattr(esas, "appetite", 0) or 0)
        f["esas_wellbeing"] = float(getattr(esas, "wellbeing", 0) or 0)
        f["esas_breath"]    = float(esas.shortness_of_breath or 0)
        f["esas_total"]     = sum([
            f["esas_pain"], f["esas_tired"], f["esas_nausea"],
            f["esas_depress"], f["esas_anxiety"], f["esas_drowsy"],
            f["esas_appetite"], f["esas_wellbeing"], f["esas_breath"],
        ])
    else:
        f.update(esas_pain=3, esas_tired=4, esas_nausea=2, esas_depress=3,
                 esas_anxiety=3, esas_drowsy=2, esas_appetite=3,
                 esas_wellbeing=3, esas_breath=2, esas_total=25)

    # â"â" PPS â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    pps_rec = (
        db.query(PPSAssessment)
        .filter(PPSAssessment.patient_id == patient_id)
        .order_by(PPSAssessment.assessed_at.desc())
        .first()
    )
    data_quality["pps"] = bool(pps_rec)
    f["pps"] = float(pps_rec.pps_score if pps_rec and pps_rec.pps_score else 60)

    # â"â" PHQ-9 / GAD-7 (try from mental health assessments) â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    # Look for them in various possible tables
    try:
        from src.db import PHQ9Assessment, GAD7Assessment
        phq = (db.query(PHQ9Assessment)
               .filter(PHQ9Assessment.patient_id == patient_id)
               .order_by(PHQ9Assessment.assessed_at.desc()).first())
        gad = (db.query(GAD7Assessment)
               .filter(GAD7Assessment.patient_id == patient_id)
               .order_by(GAD7Assessment.assessed_at.desc()).first())
        f["phq9"] = float(phq.total_score if phq else (f["esas_depress"] * 2.5))
        f["gad7"] = float(gad.total_score if gad else (f["esas_anxiety"] * 2.0))
    except Exception:
        f["phq9"] = float(f["esas_depress"] * 2.5)
        f["gad7"] = float(f["esas_anxiety"] * 2.0)

    # â"â" Barthel / MMSE (functional / cognitive) â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    try:
        from src.db import FunctionalAssessment, CognitiveAssessment
        ba = (db.query(FunctionalAssessment)
              .filter(FunctionalAssessment.patient_id == patient_id)
              .order_by(FunctionalAssessment.assessed_at.desc()).first())
        ca = (db.query(CognitiveAssessment)
              .filter(CognitiveAssessment.patient_id == patient_id)
              .order_by(CognitiveAssessment.assessed_at.desc()).first())
        f["barthel"] = float(ba.total_score if ba else 65)
        f["mmse"]    = float(ca.total_score if ca else 24)
    except Exception:
        f["barthel"] = 65.0
        f["mmse"]    = 24.0

    # â"â" Medications â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    meds = (db.query(Medication)
            .filter(Medication.patient_id == patient_id,
                    Medication.is_active == True)
            .all())
    data_quality["medications"] = bool(meds)

    HIGH_RISK_KEYWORDS = [
        "morphine","opioid","fentanyl","warfarin","digoxin","insulin",
        "methotrexate","lithium","phenytoin","amiodarone",
    ]
    f["meds_count"]      = float(len(meds))
    f["high_risk_meds"]  = float(sum(
        1 for m in meds
        if any(kw in (m.name or "").lower() for kw in HIGH_RISK_KEYWORDS)
    ))
    f["drug_interactions"] = max(0.0, float(len(meds)) - 5) * 0.3   # heuristic

    # â"â" Adherence proxy â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    try:
        from src.db import MedicationAdherenceLog
        adh = (db.query(MedicationAdherenceLog)
               .filter(MedicationAdherenceLog.patient_id == patient_id)
               .order_by(MedicationAdherenceLog.recorded_at.desc())
               .first())
        f["adherence_score"] = float(adh.mmas8_score if adh and adh.mmas8_score else 6)
    except Exception:
        f["adherence_score"] = 6.0

    # â"â" Comorbidities proxy (count distinct diagnoses in notes) â"â"â"â"â"â"â"â"â"â"â"
    comorbid_keywords = [
        "diabetes","hypertension","heart failure","copd","renal","liver",
        "cancer","dementia","depression","anxiety","stroke","af",
    ]
    diag_text = (patient.primary_diagnosis or "") + " " + (patient.secondary_diagnoses or "")
    f["comorbidities"] = float(sum(
        1 for kw in comorbid_keywords if kw in diag_text.lower()
    )) or 2.0

    # â"â" Recent ED visits (from alert history) â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    recent_alerts = (
        db.query(Alert)
        .filter(Alert.patient_id == patient_id,
                Alert.created_at >= datetime.utcnow() - timedelta(days=180))
        .count()
    )
    f["ed_visits_6m"]            = float(min(recent_alerts, 8))
    f["recent_ed_visits"]        = f["ed_visits_6m"]
    f["recent_hospitalisations"] = float(min(recent_alerts // 3, 4))

    # â"â" Social support (from questionnaire preferences if available) â"â"â"â"â"â"
    try:
        from src.db import PatientPreferences
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == patient_id
        ).first()
        f["social_support"] = 7.0 if prefs and prefs.questionnaire_complete else 5.0
    except Exception:
        f["social_support"] = 5.0

    # â"â" Zarit / caregiver burden â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    f["zarit"]                = 30.0
    f["care_hours_per_week"]  = 40.0
    f["carer_age"]            = 58.0
    f["has_respite"]          = 0.0
    f["patient_pps"]          = f["pps"]
    f["patient_esas_total"]   = f["esas_total"]

    # â"â" Cognitive risk extras â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
    f["recent_delirium"]     = 0.0
    f["cog_affecting_meds"]  = float(sum(
        1 for m in meds
        if any(kw in (m.name or "").lower()
               for kw in ["morphine","diazepam","haloperidol","prednisone","dexamethasone"])
    ))

    return f, data_quality


# â"â" Build key concerns and recommendations from predictions â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"

def _derive_clinical_output(
    patient: Patient,
    task_results: Dict[str, Any],
    features: Dict[str, Any],
) -> tuple[list, list]:
    """Derive plain-language concerns and recommendations from model outputs."""
    concerns, recs = [], []

    for task, r in task_results.items():
        if r["risk_level"] == "critical":
            if task == "vital_risk":
                hr = features.get("heart_rate", 80)
                spo2 = features.get("oxygen_saturation", 95)
                if hr > 110:
                    concerns.append(f"Elevated heart rate ({hr:.0f} bpm) -- monitor closely")
                if spo2 < 92:
                    concerns.append(f"Low O2 saturation ({spo2:.1f}%) -- immediate attention")
                recs.append("Review vital signs immediately and notify senior clinician")
            elif task == "symptom_burden":
                pain = features.get("esas_pain", 0)
                if pain >= 7:
                    concerns.append(f"Severe pain (ESAS {pain:.0f}/10) -- inadequate control")
                    recs.append("Escalate pain management per WHO analgesic ladder")
                total = features.get("esas_total", 0)
                if total > 50:
                    concerns.append(f"High total symptom burden (ESAS total {total:.0f}/90)")
            elif task == "admission_risk":
                concerns.append(f"High 7-day hospital admission risk ({r['probability']:.0%})")
                recs.append("Review social support and care plan to prevent readmission")
            elif task == "mental_health_risk":
                phq9 = features.get("phq9", 0)
                concerns.append(f"Significant mental health risk (PHQ-9 approx {phq9:.0f})")
                recs.append("Refer to psychological support team this week")
            elif task == "medication_risk":
                meds = int(features.get("meds_count", 0))
                concerns.append(f"Medication risk flagged ({meds} active medications)")
                recs.append("Pharmacist medication review -- check for interactions")
            elif task == "functional_decline":
                pps = features.get("pps", 60)
                concerns.append(f"Risk of functional decline (PPS {pps:.0f}%)")
                recs.append("Physiotherapy assessment -- focus on maintaining independence")
            elif task == "caregiver_burden":
                concerns.append("High caregiver burnout risk")
                recs.append("Social worker to assess caregiver support and respite options")

        elif r["risk_level"] == "warning":
            if task == "admission_risk":
                recs.append("Monitor closely -- consider care plan review to prevent hospitalisation")
            elif task == "symptom_burden":
                recs.append("Review symptom management at next clinical contact")

    if not concerns:
        concerns.append("No critical risk factors identified -- continue monitoring")
    if not recs:
        recs.append("Maintain current care plan and monitoring schedule")

    return concerns[:6], recs[:5]


# â"â" Endpoints â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"

@router.get("/patient/{patient_id}/risk", response_model=PatientRiskProfile)
async def get_patient_risk_profile(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full ML risk profile with real SHAP explanations for one patient."""
    if not ml_service.is_available():
        raise HTTPException(503, "ML models not loaded -- run train_models_now.py first")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, f"Patient {patient_id} not found")

    features, data_quality = extract_patient_features(patient_id, db)

    # Run all tasks
    raw_tasks = ml_service.predict_all_tasks(features)

    task_preds: Dict[str, TaskPrediction] = {}
    for task, r in raw_tasks.items():
        task_preds[task] = TaskPrediction(
            task=task,
            probability=r["probability"],
            risk_level=r["risk_level"],
            shap_available=r["shap_available"],
            top_features=[FeatureContribution(**f) for f in r["top_features"]],
            base_value=r["base_value"],
            metrics=r.get("metrics", {}),
        )

    overall = ml_service.get_overall_risk(features)
    concerns, recs = _derive_clinical_output(patient, raw_tasks, features)

    return PatientRiskProfile(
        patient_id=patient_id,
        patient_name=patient.full_name or "",
        patient_code=patient.patient_code or "",
        assessed_at=datetime.utcnow().isoformat(),
        overall_risk=overall["overall_risk"],
        overall_level=overall["risk_level"],
        highest_task=overall.get("highest_risk_task", ""),
        tasks=task_preds,
        key_concerns=concerns,
        recommended_actions=recs,
        data_quality=data_quality,
        models_available=len(raw_tasks),
    )


@router.get("/patient/{patient_id}/task/{task_name}", response_model=TaskPrediction)
async def get_single_task_prediction(
    patient_id: int,
    task_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Single task prediction with SHAP for one patient."""
    if task_name not in ml_service.get_available_tasks():
        raise HTTPException(404, f"Task '{task_name}' not available. "
                            f"Available: {ml_service.get_available_tasks()}")

    features, _ = extract_patient_features(patient_id, db)
    result = ml_service.predict_with_shap(task_name, features, top_k=10)
    if not result:
        raise HTTPException(503, f"Prediction failed for task {task_name}")

    return TaskPrediction(
        task=task_name,
        probability=result["probability"],
        risk_level=result["risk_level"],
        shap_available=result["shap_available"],
        top_features=[FeatureContribution(**f) for f in result["top_features"]],
        base_value=result["base_value"],
        metrics=result.get("metrics", {}),
    )


@router.get("/status")
async def get_ml_status(current_user: User = Depends(get_current_user)):
    """Return model service status including all loaded tasks."""
    svc = get_ml_service()
    info = svc.get_model_info()
    return {
        "available": svc.is_available(),
        "loaded_tasks": svc.get_available_tasks(),
        "total_tasks": 8,
        "models": info,
        "shap_enabled": any(v["shap_available"] for v in info.values()),
    }


@router.get("/patients/batch-risk")
async def get_all_patients_risk(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run ML risk assessment across all active patients.
    Returns sorted list (highest risk first) for dashboard/AI Insights.
    """
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(403, "Clinical role required")

    if not ml_service.is_available():
        return {"patients": [], "ml_available": False, "message": "Models not loaded"}

    patients = (
        db.query(Patient)
        .filter(Patient.status.in_(["active", "stable", "deteriorating"]))
        .limit(50)  # cap to avoid timeouts
        .all()
    )

    results = []
    for p in patients:
        try:
            features, _ = extract_patient_features(p.id, db)
            overall = ml_service.get_overall_risk(features)
            top_task = overall.get("highest_risk_task", "")
            results.append({
                "patient_id":   p.id,
                "patient_name": p.full_name or "",
                "patient_code": p.patient_code or "",
                "overall_risk": overall["overall_risk"],
                "risk_level":   overall["risk_level"],
                "top_concern":  top_task.replace("_", " ").title(),
                "assessed_at":  datetime.utcnow().isoformat(),
                "tasks":        overall.get("tasks", {}),
            })
        except Exception as e:
            logger.warning(f"Risk failed for patient {p.id}: {e}")

    # Sort: critical first, then by overall_risk desc
    order = {"critical": 0, "high": 1, "moderate": 2, "low": 3, "unknown": 4}
    results.sort(key=lambda x: (order.get(x["risk_level"], 4), -x["overall_risk"]))

    return {
        "patients":      results,
        "total":         len(results),
        "ml_available":  True,
        "assessed_at":   datetime.utcnow().isoformat(),
    }


# â"â" Proactive background scanner â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"

async def _proactive_scan(db: Session):
    """
    Background task: run ML on all active patients, create alerts for
    any who cross risk thresholds. Called on schedule or manually.
    """
    if not ml_service.is_available():
        return

    patients = (
        db.query(Patient)
        .filter(Patient.status.in_(["active", "stable", "deteriorating"]))
        .all()
    )

    alerts_created = 0
    for p in patients:
        try:
            features, _ = extract_patient_features(p.id, db)
            overall = ml_service.get_overall_risk(features)

            # Only alert if risk is high or critical
            if overall["risk_level"] not in ("high", "critical"):
                continue

            # Check we haven't already alerted recently (last 6h)
            recent = (
                db.query(Alert)
                .filter(
                    Alert.patient_id == p.id,
                    Alert.alert_type == "ml_risk",
                    Alert.created_at >= datetime.utcnow() - timedelta(hours=6),
                )
                .first()
            )
            if recent:
                continue

            # Find top risk task for alert message
            top_task = overall.get("highest_risk_task", "")
            top_prob = overall.get("tasks", {}).get(top_task, {}).get("probability", 0)

            alert = Alert(
                patient_id=p.id,
                alert_type="ml_risk",
                severity="critical" if overall["risk_level"] == "critical" else "high",
                message=(
                    f"ML risk model flagged {p.full_name}: "
                    f"overall risk {overall['overall_risk']:.0%}. "
                    f"Highest: {top_task.replace('_',' ')} ({top_prob:.0%})"
                ),
                is_acknowledged=False,
                created_at=datetime.utcnow(),
            )
            db.add(alert)
            db.flush()

            # Notify all active clinicians
            from src.db import User as UserModel
            clinicians = db.query(UserModel).filter(
                UserModel.role.in_(["clinician", "admin"]),
                UserModel.is_active == True,
            ).all()
            for c in clinicians:
                notif = NotificationQueue(
                    recipient_id=c.id,
                    notification_type="ml_risk_alert",
                    title=f"ML Risk Alert -- {p.full_name}",
                    body=alert.message,
                    related_alert_id=alert.id,
                )
                db.add(notif)

            alerts_created += 1

        except Exception as e:
            logger.warning(f"Proactive scan failed for {p.id}: {e}")

    if alerts_created:
        db.commit()
    logger.info(f"Proactive scan: {len(patients)} patients, {alerts_created} new alerts")


@router.post("/scheduler/trigger")
async def trigger_proactive_scan(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger the proactive ML risk scan across all patients."""
    if current_user.role not in ("admin", "clinician"):
        raise HTTPException(403, "Admin or clinician required")

    background_tasks.add_task(_proactive_scan, db)
    return {"message": "Proactive risk scan started", "status": "running"}


# ══════════════════════════════════════════════════════════════════════════════
# EVIDENCE-BASED SCORING ENDPOINTS
# These use validated published clinical models - NOT synthetic XGBoost.
# All scores derived from peer-reviewed literature with real patient data.
# ══════════════════════════════════════════════════════════════════════════════

class EvidenceRiskRequest(BaseModel):
    """Input for evidence-based composite risk scoring."""
    # ESAS items (0-10 each)
    esas_pain: int = 0
    esas_tiredness: int = 0
    esas_nausea: int = 0
    esas_depression: int = 0
    esas_anxiety: int = 0
    esas_drowsiness: int = 0
    esas_appetite: int = 0
    esas_breath: int = 0
    esas_wellbeing: int = 0
    # PPS / PPI inputs
    pps_score: Optional[int] = None       # 0-100 in 10% steps
    oral_intake: str = "normal"           # normal | reduced | minimal
    has_oedema: bool = False
    dyspnoea_at_rest: bool = False
    has_delirium: bool = False
    has_anorexia: bool = False
    kps_score: int = 50
    clinician_survival_estimate: str = ">12 weeks"
    wbc: Optional[float] = None           # 10^9/L
    lymph_pct: Optional[float] = None     # %
    # Assessment totals
    phq9_total: Optional[int] = None
    phq9_suicidal: int = 0
    gad7_total: Optional[int] = None
    barthel_total: Optional[int] = None


@router.post("/evidence-based/composite")
async def evidence_based_composite(
    body: EvidenceRiskRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Composite evidence-based palliative risk assessment.
    Uses PPI (Morita 1999), PaP (Maltoni 1999), ESAS-Risk (Seow 2011),
    PPS (Bischoff 2024), PHQ-9 (Kroenke 2002), GAD-7 (Spitzer 2006),
    Barthel (Mahoney 1965).
    Returns overall risk level, survival estimates, and clinical actions.
    No synthetic data - all models derived from real published patient cohorts.
    """
    result = composite_palliative_risk(
        esas_pain=body.esas_pain, esas_tiredness=body.esas_tiredness,
        esas_nausea=body.esas_nausea, esas_depression=body.esas_depression,
        esas_anxiety=body.esas_anxiety, esas_drowsiness=body.esas_drowsiness,
        esas_appetite=body.esas_appetite, esas_breath=body.esas_breath,
        esas_wellbeing=body.esas_wellbeing,
        pps_score=body.pps_score, oral_intake=body.oral_intake,
        has_oedema=body.has_oedema, dyspnoea_at_rest=body.dyspnoea_at_rest,
        has_delirium=body.has_delirium, has_anorexia=body.has_anorexia,
        kps_score=body.kps_score, clinician_survival_estimate=body.clinician_survival_estimate,
        wbc=body.wbc, lymph_pct=body.lymph_pct,
        phq9_total=body.phq9_total, phq9_suicidal=body.phq9_suicidal,
        gad7_total=body.gad7_total, barthel_total=body.barthel_total,
    )
    return result


@router.get("/evidence-based/patient/{patient_id}")
async def evidence_based_for_patient(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run evidence-based composite scoring for a specific patient
    by pulling their latest ESAS, PPS, PHQ-9, GAD-7 and Barthel data from the DB.
    """
    from src.db import (
        ESASAssessment, PPSAssessment, PHQ9Assessment,
        GAD7Assessment, BarthelIndexAssessment,
    )
    from services.access_control import assert_patient_access
    assert_patient_access(patient_id, current_user, db)

    # Fetch latest assessments
    esas = (db.query(ESASAssessment)
            .filter(ESASAssessment.patient_id == patient_id)
            .order_by(ESASAssessment.assessed_at.desc()).first())

    pps  = (db.query(PPSAssessment)
            .filter(PPSAssessment.patient_id == patient_id)
            .order_by(PPSAssessment.assessed_at.desc()).first())

    phq9 = (db.query(PHQ9Assessment)
            .filter(PHQ9Assessment.patient_id == patient_id)
            .order_by(PHQ9Assessment.assessed_at.desc()).first())

    gad7 = (db.query(GAD7Assessment)
            .filter(GAD7Assessment.patient_id == patient_id)
            .order_by(GAD7Assessment.assessed_at.desc()).first())

    barthel = (db.query(BarthelIndexAssessment)
               .filter(BarthelIndexAssessment.patient_id == patient_id)
               .order_by(BarthelIndexAssessment.assessed_at.desc()).first())

    # Build kwargs from latest records
    kwargs: dict = {}

    if esas:
        kwargs.update(
            esas_pain       =getattr(esas, "pain",               0),
            esas_tiredness  =getattr(esas, "tiredness",          0),
            esas_nausea     =getattr(esas, "nausea",             0),
            esas_depression =getattr(esas, "depression",         0),
            esas_anxiety    =getattr(esas, "anxiety",            0),
            esas_drowsiness =getattr(esas, "drowsiness",         0),
            esas_appetite   =getattr(esas, "lack_of_appetite",   0),
            esas_breath     =getattr(esas, "shortness_of_breath",0),
            esas_wellbeing  =getattr(esas, "wellbeing",          0),
        )

    if pps:
        kwargs["pps_score"]  = getattr(pps, "pps_score", None)
        # Map PPS oral intake field if present
        oral = getattr(pps, "oral_intake", "normal")
        kwargs["oral_intake"] = oral if oral in ("normal","reduced","minimal") else "reduced"

    if phq9:
        # PHQ-9 total = sum of 9 items (each 0-3)
        items = [
            "little_interest","feeling_down","sleep_trouble","feeling_tired",
            "appetite_change","feeling_bad_about_self","trouble_concentrating",
            "moving_slowly_or_fidgety","thoughts_of_harm",
        ]
        total = sum(getattr(phq9, k, 0) for k in items)
        kwargs["phq9_total"]    = total
        kwargs["phq9_suicidal"] = getattr(phq9, "thoughts_of_harm", 0)

    if gad7:
        items_g = [
            "feeling_nervous","not_stop_worrying","worrying_too_much",
            "trouble_relaxing","being_restless","easily_annoyed","feeling_afraid",
        ]
        kwargs["gad7_total"] = sum(getattr(gad7, k, 0) for k in items_g)

    if barthel:
        kwargs["barthel_total"] = getattr(barthel, "total_score",
                                   getattr(barthel, "barthel_score", None))

    result = composite_palliative_risk(**kwargs)

    # Attach metadata
    result["patient_id"]       = patient_id
    result["data_sources"]     = {
        "esas":    esas.assessed_at.isoformat() if esas else None,
        "pps":     pps.assessed_at.isoformat()  if pps  else None,
        "phq9":    phq9.assessed_at.isoformat()  if phq9 else None,
        "gad7":    gad7.assessed_at.isoformat()  if gad7 else None,
        "barthel": barthel.assessed_at.isoformat() if barthel else None,
    }
    result["assessment_completeness"] = sum([
        bool(esas), bool(pps), bool(phq9), bool(gad7), bool(barthel)
    ])

    return result


@router.get("/evidence-based/models")
async def list_evidence_models(current_user: User = Depends(get_current_user)):
    """List all implemented evidence-based clinical scoring models with references."""
    return {
        "models": [
            {
                "id":         "ppi",
                "name":       "Palliative Prognostic Index (PPI)",
                "predicts":   "Survival <3 weeks / <6 weeks / >6 weeks",
                "inputs":     ["PPS score", "oral intake", "oedema", "dyspnoea", "delirium"],
                "validated":  "245 terminally ill cancer patients (Japan, multi-centre)",
                "accuracy":   "Sensitivity 80%, specificity 85% for <3 weeks",
                "reference":  "Morita T et al. Support Care Cancer 1999;7(2):128-133",
            },
            {
                "id":         "pap",
                "name":       "Palliative Prognostic Score (PaP)",
                "predicts":   "30-day survival probability (Groups A/B/C)",
                "inputs":     ["dyspnoea", "anorexia", "KPS", "clinician estimate", "WBC", "lymphocyte %", "delirium"],
                "validated":  "518 terminally ill cancer patients (5 European centres)",
                "accuracy":   "AUC 0.79 for 30-day mortality",
                "reference":  "Maltoni M et al. J Clin Oncol 1999;17(9):2823-2830",
            },
            {
                "id":         "esas_risk",
                "name":       "ESAS Symptom Risk (TSDS model)",
                "predicts":   "Symptom burden severity + 30-day mortality signal",
                "inputs":     ["9 ESAS symptom scores (0-10 each)"],
                "validated":  "16,000+ palliative patients (Ontario Cancer Registry, Canada)",
                "accuracy":   "TSDS ≥40: 72% 30-day mortality sensitivity",
                "reference":  "Seow H et al. J Oncol Pract 2011; Watanabe SM et al. JPSM 2011",
            },
            {
                "id":         "pps_survival",
                "name":       "PPS Actuarial Survival Model",
                "predicts":   "1-month and 6-month mortality by PPS decile",
                "inputs":     ["PPS score (0-100, 10% steps)"],
                "validated":  "Real palliative inpatient + outpatient cohort, UCSF",
                "accuracy":   "Distinct Kaplan-Meier curves at each decile",
                "reference":  "Bischoff KE et al. JAMA Netw Open 2024. doi:10.1001/jamanetworkopen.2024.20472",
            },
            {
                "id":         "phq9",
                "name":       "PHQ-9 Depression Severity",
                "predicts":   "Depression severity and clinical action threshold",
                "inputs":     ["9 DSM-IV criteria scored 0-3 each"],
                "validated":  "6,000 primary care + OB/GYN patients",
                "accuracy":   "Sensitivity 88%, specificity 88% at score ≥10",
                "reference":  "Kroenke K, Spitzer RL. J Gen Intern Med 2002;16:606-613",
            },
            {
                "id":         "gad7",
                "name":       "GAD-7 Anxiety Severity",
                "predicts":   "Generalised anxiety severity and referral threshold",
                "inputs":     ["7 anxiety items scored 0-3 each"],
                "validated":  "2,740 primary care patients",
                "accuracy":   "Sensitivity 89%, specificity 82% at score ≥10",
                "reference":  "Spitzer RL et al. Arch Intern Med 2006;166(10):1092-7",
            },
            {
                "id":         "barthel",
                "name":       "Barthel Index Functional Risk",
                "predicts":   "Functional dependence level + mortality risk",
                "inputs":     ["ADL total score 0-100"],
                "validated":  "Post-stroke patients (Mahoney 1965); 5,000+ patients (Frontiers 2024)",
                "accuracy":   "High sensitivity/specificity for mortality at 60% score threshold",
                "reference":  "Mahoney FI, Barthel DW. MD State Med J 1965;14:61-65",
            },
        ],
        "note": (
            "All models use published coefficients and thresholds from peer-reviewed "
            "literature. No synthetic training data. "
            "These clinical decision support tools are validated on real patient cohorts. "
            "For clinical use, results should be interpreted by a qualified clinician."
        ),
    }
