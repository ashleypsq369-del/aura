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

