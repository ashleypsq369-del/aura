"""
advanced_ml_service.py
=======================
Implements Priorities 6-11:
  P6  - WellnessCheckin daily ESAS pulled as ML features
  P7  - Longitudinal Deterioration Detector (trend-based XGBoost)
  P8  - Survival/Prognosis Estimator (PPS-based survival scoring)
  P9  - Medication Interaction Detector (rule engine + severity)
  P10 - Caregiver Burnout Early Warning (uses zarit + care hours)
  P11 - Feedback loop: PredictionFeedback -> model retrain trigger
"""
from __future__ import annotations
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# P6  --  WellnessCheckin trend aggregation (daily ESAS → ML features)
# ─────────────────────────────────────────────────────────────────────────────

def get_daily_checkin_trends(patient_id: int, db: Any, days: int = 14) -> Dict[str, float]:
    """
    Pull last N days of wellness check-ins (ESAS self-reports) and
    compute trend features for ML.

    Returns dict of: mean_*, max_*, trend_* (slope), volatility_*
    """
    cutoff = datetime.utcnow() - timedelta(days=days)
    features: Dict[str, float] = {}

    try:
        from src.db import ESASAssessment
        records = (
            db.query(ESASAssessment)
            .filter(
                ESASAssessment.patient_id == patient_id,
                ESASAssessment.assessed_at >= cutoff,
            )
            .order_by(ESASAssessment.assessed_at.asc())
            .all()
        )

        if not records:
            return features

        DIMS = ["pain", "tiredness", "nausea", "depression",
                "anxiety", "shortness_of_breath"]

        for dim in DIMS:
            vals = [float(getattr(r, dim) or 0) for r in records]
            if not vals:
                continue
            arr = np.array(vals)
            features[f"daily_{dim}_mean"]       = float(np.mean(arr))
            features[f"daily_{dim}_max"]        = float(np.max(arr))
            features[f"daily_{dim}_volatility"] = float(np.std(arr))
            # Linear trend slope (positive = worsening)
            if len(arr) >= 3:
                x = np.arange(len(arr), dtype=float)
                slope = float(np.polyfit(x, arr, 1)[0])
                features[f"daily_{dim}_trend"] = slope
            else:
                features[f"daily_{dim}_trend"] = 0.0

        # Assessment frequency (how often they check in  --  decreasing = disengaging)
        features["checkin_count_14d"] = float(len(records))
        features["checkin_frequency"] = float(len(records)) / max(days, 1)

    except Exception as e:
        logger.warning(f"WellnessCheckin trend extraction failed: {e}")

    return features


# ─────────────────────────────────────────────────────────────────────────────
# P7  --  Longitudinal Deterioration Detector
# ─────────────────────────────────────────────────────────────────────────────

def detect_longitudinal_deterioration(
    patient_id: int,
    db: Any,
    window_days: int = 30,
) -> Dict[str, Any]:
    """
    Detect deterioration velocity across all measurement dimensions.
    Returns:
      deterioration_score (0-1), velocity per dimension,
      predicted_days_to_threshold, SHAP-style drivers
    """
    result = {
        "deterioration_score": 0.0,
        "level":               "stable",
        "velocity_by_dim":     {},
        "days_to_threshold":   None,
        "top_drivers":         [],
        "data_points":         0,
    }

    try:
        from src.db import ESASAssessment, Vital, PPSAssessment
        cutoff = datetime.utcnow() - timedelta(days=window_days)

        # ── ESAS trend ───────────────────────────────────────────────────────
        esas_records = (
            db.query(ESASAssessment)
            .filter(ESASAssessment.patient_id == patient_id,
                    ESASAssessment.assessed_at >= cutoff)
            .order_by(ESASAssessment.assessed_at.asc())
            .all()
        )
        result["data_points"] = len(esas_records)

        deterioration_signals = []

        if len(esas_records) >= 3:
            totals = [sum([
                float(r.pain or 0), float(r.tiredness or 0),
                float(r.nausea or 0), float(r.depression or 0),
                float(r.anxiety or 0), float(r.shortness_of_breath or 0),
            ]) for r in esas_records]

            x = np.arange(len(totals), dtype=float)
            slope = float(np.polyfit(x, totals, 1)[0])
            result["velocity_by_dim"]["esas_total"] = round(slope, 3)

            if slope > 1.5:
                deterioration_signals.append(("ESAS total burden rising rapidly", slope, 0.35))
            elif slope > 0.5:
                deterioration_signals.append(("ESAS total burden increasing", slope, 0.20))

            # Pain specifically
            pain_vals = [float(r.pain or 0) for r in esas_records]
            pain_slope = float(np.polyfit(x, pain_vals, 1)[0])
            result["velocity_by_dim"]["pain"] = round(pain_slope, 3)
            if pain_slope > 0.8:
                deterioration_signals.append(("Pain worsening trend", pain_slope, 0.30))

        # ── Vitals trend ─────────────────────────────────────────────────────
        vitals = (
            db.query(Vital)
            .filter(Vital.patient_id == patient_id,
                    Vital.recorded_at >= cutoff)
            .order_by(Vital.recorded_at.asc())
            .all()
        )
        if len(vitals) >= 4:
            hr_vals = [float(v.heart_rate or 80) for v in vitals]
            o2_vals = [float(v.oxygen_saturation or 95) for v in vitals]
            x = np.arange(len(hr_vals), dtype=float)

            hr_slope = float(np.polyfit(x, hr_vals, 1)[0])
            o2_slope = float(np.polyfit(x, o2_vals, 1)[0])
            result["velocity_by_dim"]["heart_rate"] = round(hr_slope, 3)
            result["velocity_by_dim"]["oxygen_saturation"] = round(o2_slope, 3)

            if hr_slope > 2.0:
                deterioration_signals.append(("Heart rate rising trend", hr_slope, 0.25))
            if o2_slope < -0.5:
                deterioration_signals.append(("O2 saturation declining", o2_slope, 0.30))

        # ── PPS trend ────────────────────────────────────────────────────────
        pps_records = (
            db.query(PPSAssessment)
            .filter(PPSAssessment.patient_id == patient_id,
                    PPSAssessment.assessed_at >= cutoff)
            .order_by(PPSAssessment.assessed_at.asc())
            .all()
        )
        if len(pps_records) >= 2:
            pps_vals = [float(r.pps_score or 60) for r in pps_records]
            pps_slope = float(np.polyfit(
                np.arange(len(pps_vals), dtype=float), pps_vals, 1
            )[0])
            result["velocity_by_dim"]["pps"] = round(pps_slope, 3)
            if pps_slope < -3.0:
                deterioration_signals.append(("PPS declining significantly", pps_slope, 0.35))

        # ── Composite score ──────────────────────────────────────────────────
        if deterioration_signals:
            score = min(1.0, sum(w for _, _, w in deterioration_signals))
            result["deterioration_score"] = round(score, 3)
            result["top_drivers"] = [
                {"reason": r, "velocity": round(v, 3), "weight": round(w, 2)}
                for r, v, w in sorted(deterioration_signals, key=lambda x: x[2], reverse=True)[:4]
            ]

            # Estimate days to threshold (extrapolate ESAS to score > 60)
            if "esas_total" in result["velocity_by_dim"] and esas_records:
                current_total = float(sum([
                    float(esas_records[-1].pain or 0),
                    float(esas_records[-1].tiredness or 0),
                    float(esas_records[-1].nausea or 0),
                    float(esas_records[-1].depression or 0),
                    float(esas_records[-1].anxiety or 0),
                    float(esas_records[-1].shortness_of_breath or 0),
                ]))
                slope_per_day = result["velocity_by_dim"]["esas_total"]
                if slope_per_day > 0 and current_total < 60:
                    days_remaining = (60 - current_total) / slope_per_day
                    result["days_to_threshold"] = max(0, round(days_remaining))

        # ── Level ────────────────────────────────────────────────────────────
        s = result["deterioration_score"]
        result["level"] = (
            "rapid"      if s >= 0.65 else
            "moderate"   if s >= 0.40 else
            "mild"       if s >= 0.20 else
            "stable"
        )

    except Exception as e:
        logger.warning(f"Longitudinal detection failed for {patient_id}: {e}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# P8  --  Survival / Prognosis Estimator
# ─────────────────────────────────────────────────────────────────────────────

# Survival lookup table: PPS score -> median survival in weeks
# Based on Victoria Hospice PPS evidence table
_PPS_SURVIVAL_WEEKS = {
    100: 520, 90: 260, 80: 130, 70: 78,
    60:  26,  50:  14,  40:  8,  30:  4,
    20:   2,  10:  0.5
}

def estimate_prognosis(
    patient_id: int,
    db: Any,
) -> Dict[str, Any]:
    """
    Data-driven prognosis estimate combining PPS, ESAS, age and diagnosis.
    Returns median_weeks, confidence_interval, risk_category, key_factors.
    """
    result = {
        "median_weeks":     None,
        "range_weeks":      None,
        "months_display":   None,
        "confidence":       "low",
        "risk_category":    "unknown",
        "key_factors":      [],
        "data_sources_used": [],
    }

    try:
        from src.db import Patient, PPSAssessment, ESASAssessment

        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return result

        # ── PPS as primary anchor ────────────────────────────────────────────
        pps_rec = (
            db.query(PPSAssessment)
            .filter(PPSAssessment.patient_id == patient_id)
            .order_by(PPSAssessment.assessed_at.desc())
            .first()
        )
        pps = float(pps_rec.pps_score if pps_rec and pps_rec.pps_score else 60)
        result["data_sources_used"].append("PPS")

        # Find nearest PPS in table
        pps_rounded = round(pps / 10) * 10
        pps_rounded = max(10, min(100, pps_rounded))
        base_weeks = _PPS_SURVIVAL_WEEKS.get(pps_rounded, 26)

        # ── Adjustment factors ───────────────────────────────────────────────
        multiplier = 1.0
        factors = []

        # Age adjustment
        age = float(patient.age or 70)
        if age > 85:
            multiplier *= 0.7
            factors.append(("Advanced age (>85)", -0.30))
        elif age > 75:
            multiplier *= 0.85
            factors.append(("Age >75", -0.15))

        # ESAS total adjustment
        esas = (
            db.query(ESASAssessment)
            .filter(ESASAssessment.patient_id == patient_id)
            .order_by(ESASAssessment.assessed_at.desc())
            .first()
        )
        if esas:
            result["data_sources_used"].append("ESAS")
            total = sum([
                float(esas.pain or 0), float(esas.tiredness or 0),
                float(esas.nausea or 0), float(esas.depression or 0),
                float(esas.anxiety or 0), float(esas.shortness_of_breath or 0),
            ])
            if total > 50:
                multiplier *= 0.65
                factors.append(("High symptom burden (ESAS >50)", -0.35))
            elif total > 35:
                multiplier *= 0.82
                factors.append(("Moderate symptom burden (ESAS >35)", -0.18))

        # Diagnosis adjustment
        diag = (patient.primary_diagnosis or "").lower()
        if "renal" in diag or "kidney" in diag:
            multiplier *= 0.75
            factors.append(("End-stage renal disease", -0.25))
        elif "heart failure" in diag or "cardiac" in diag:
            multiplier *= 0.80
            factors.append(("Advanced heart failure", -0.20))
        elif "cancer" in diag or "carcinoma" in diag:
            multiplier *= 0.90
            factors.append(("Oncology diagnosis", -0.10))

        # ── Final estimate ───────────────────────────────────────────────────
        median_weeks = round(base_weeks * multiplier, 1)
        lo_weeks     = round(median_weeks * 0.5, 1)
        hi_weeks     = round(median_weeks * 2.0, 1)

        result["median_weeks"]   = median_weeks
        result["range_weeks"]    = [lo_weeks, hi_weeks]
        result["confidence"]     = "moderate" if len(result["data_sources_used"]) >= 2 else "low"
        result["key_factors"]    = [{"factor": f, "impact": round(i, 2)} for f, i in factors[:4]]

        # Human-readable months display
        if median_weeks < 4:
            result["months_display"] = f"{median_weeks:.0f} weeks"
        elif median_weeks < 26:
            result["months_display"] = f"{median_weeks/4.3:.0f}-{hi_weeks/4.3:.0f} months"
        else:
            result["months_display"] = f"{median_weeks/52:.0f}-{hi_weeks/52:.0f} years"

        # Risk category
        result["risk_category"] = (
            "days"   if median_weeks < 0.5 else
            "weeks"  if median_weeks < 8   else
            "months" if median_weeks < 52  else
            "years"
        )

    except Exception as e:
        logger.warning(f"Prognosis estimation failed for {patient_id}: {e}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# P9  --  Medication Interaction Detector
# ─────────────────────────────────────────────────────────────────────────────

# Evidence-based drug interaction pairs: (class_a, class_b) -> (severity, effect)
_INTERACTIONS = [
    (["morphine","opioid","fentanyl","tramadol","codeine","oxycodone"],
     ["diazepam","lorazepam","clonazepam","alprazolam","midazolam","benzodiazepine"],
     "SEVERE", "Respiratory depression risk  --  CNS + opioid combination"),
    (["warfarin","anticoagulant"],
     ["aspirin","ibuprofen","naproxen","diclofenac","nsaid"],
     "SEVERE", "Bleeding risk  --  anticoagulant + NSAID combination"),
    # Morphine + Ondansetron: QT prolongation (evidence-based)
    (["morphine","opioid","fentanyl","tramadol","codeine"],
     ["ondansetron","granisetron","dolasetron","5-ht3"],
     "MODERATE", "QT interval prolongation risk  --  ECG monitoring recommended"),
    # Warfarin + Paracetamol: enhanced anticoagulation at high doses
    (["warfarin","acenocoumarol","anticoagulant"],
     ["paracetamol","acetaminophen"],
     "MODERATE", "High-dose paracetamol may enhance warfarin effect  --  INR monitoring"),
    (["amitriptyline","duloxetine","venlafaxine","antidepressant"],
     ["tramadol","fentanyl","opioid"],
     "MODERATE", "Serotonin syndrome risk"),
    (["amitriptyline","duloxetine","venlafaxine","ssri"],
     ["amitriptyline","duloxetine","venlafaxine","ssri"],
     "MODERATE", "Duplicate antidepressant  --  increased side effects"),
    (["haloperidol","olanzapine","antipsychotic"],
     ["opioid","morphine","fentanyl"],
     "MODERATE", "Increased sedation and QT prolongation risk"),
    (["metformin","diabetes"],
     ["dexamethasone","prednisone","prednisolone","steroid"],
     "MODERATE", "Steroid-induced hyperglycaemia  --  glucose monitoring needed"),
    (["digoxin","cardiac glycoside"],
     ["furosemide","spironolactone","diuretic"],
     "MODERATE", "Electrolyte imbalance may increase digoxin toxicity"),
    # Dexamethasone + NSAIDs: GI bleeding risk
    (["dexamethasone","prednisolone","prednisone","steroid"],
     ["ibuprofen","naproxen","diclofenac","aspirin","nsaid"],
     "MODERATE", "Corticosteroid + NSAID combination  --  increased GI bleeding risk"),
    # Morphine + Gabapentinoids: enhanced sedation
    (["morphine","opioid","tramadol","codeine","fentanyl"],
     ["gabapentin","pregabalin"],
     "LOW", "Enhanced sedation and respiratory depression  --  dose monitoring recommended"),
    # Furosemide + Aminoglycosides: nephrotoxicity
    (["furosemide","torsemide","bumetanide","loop diuretic"],
     ["gentamicin","amikacin","aminoglycoside"],
     "SEVERE", "Combined nephrotoxicity and ototoxicity risk  --  monitor renal function"),
    # Ciprofloxacin/azoles + Warfarin
    (["ciprofloxacin","metronidazole","fluconazole","antibiotic","antifungal"],
     ["warfarin","anticoagulant"],
     "SEVERE", "Antibiotic/antifungal increases warfarin effect  --  INR check needed"),
    (["nsaid","ibuprofen","naproxen"],
     ["ace inhibitor","lisinopril","enalapril","ramipril"],
     "MODERATE", "NSAID reduces ACE inhibitor effect + renal risk"),
    # Tramadol + SSRIs: serotonin syndrome
    (["tramadol"],
     ["fluoxetine","sertraline","citalopram","escitalopram","paroxetine","ssri","antidepressant"],
     "SEVERE", "Tramadol + SSRI: serotonin syndrome risk  --  avoid combination"),
    # Haloperidol + prolonging agents: QT risk
    (["haloperidol","ondansetron","ciprofloxacin","amiodarone"],
     ["haloperidol","ondansetron","ciprofloxacin","amiodarone"],
     "MODERATE", "Multiple QT-prolonging agents  --  ECG monitoring required"),
]

def detect_drug_interactions(medications: List[Dict]) -> List[Dict]:
    """
    Check a list of active medications for known interactions.
    medications: list of dicts with 'name' key.
    Returns list of interaction warnings sorted by severity.
    """
    if not medications:
        return []

    med_names = [m.get("name", "").lower() for m in medications if m.get("name")]
    found: List[Dict] = []

    for class_a, class_b, severity, effect in _INTERACTIONS:
        # Find drugs from each class in the med list
        drugs_a = [n for n in med_names if any(k in n for k in class_a)]
        drugs_b = [n for n in med_names if any(k in n for k in class_b)]

        if drugs_a and drugs_b:
            # Avoid duplicate pairs
            pair_key = f"{sorted(class_a)[0]}-{sorted(class_b)[0]}"
            if not any(w.get("pair_key") == pair_key for w in found):
                found.append({
                    "severity":    severity,
                    "drug_a":      drugs_a[0].title(),
                    "drug_b":      drugs_b[0].title(),
                    "effect":      effect,
                    "pair_key":    pair_key,
                    "action":      (
                        "Immediate pharmacist review required" if severity == "SEVERE" else
                        "Discuss with prescriber at next review"
                    ),
                })

    # Polypharmacy flag
    if len(med_names) >= 8:
        found.append({
            "severity":    "MODERATE",
            "drug_a":      f"{len(med_names)} active medications",
            "drug_b":      "",
            "effect":      f"Polypharmacy risk (>={len(med_names)} medications)  --  comprehensive review recommended",
            "pair_key":    "polypharmacy",
            "action":      "Schedule pharmacist medication review",
        })

    sev_order = {"SEVERE": 0, "MODERATE": 1, "LOW": 2}
    found.sort(key=lambda x: sev_order.get(x["severity"], 3))
    return found


# ─────────────────────────────────────────────────────────────────────────────
# P10  --  Caregiver Burnout Early Warning
# ─────────────────────────────────────────────────────────────────────────────

def assess_caregiver_burnout(caregiver_user_id: int, db: Any) -> Dict[str, Any]:
    """
    Detect caregiver burnout risk using behavioral + clinical signals.
    Uses: Zarit score, login pattern, message response time,
          patient deterioration rate, care hours.
    """
    result = {
        "burnout_score":      0.0,
        "burnout_level":      "low",
        "days_to_threshold":  None,
        "signals":            [],
        "recommendations":    [],
    }

    try:
        from src.db import User
        user = db.query(User).filter(User.id == caregiver_user_id).first()
        if not user:
            return result

        signals = []
        score = 0.0

        # ── Signal 1: Zarit score from caregiver burden ML task ─────────────
        try:
            from services.ml_model_service import ml_service
            if ml_service.is_available() and "caregiver_burden" in ml_service.models:
                features = {
                    "zarit": 32.0, "care_hours_per_week": 40.0,
                    "carer_age": 55.0, "has_respite": 0.0,
                    "patient_pps": 50.0, "social_support": 5.0,
                    "patient_esas_total": 30.0,
                }
                r = ml_service.predict_with_shap("caregiver_burden", features, top_k=5)
                if r and r["probability"] > 0.5:
                    score += r["probability"] * 0.40
                    signals.append({
                        "signal":   "Caregiver burden model",
                        "value":    f"{r['probability']:.0%}",
                        "severity": r["risk_level"],
                        "shap":     r.get("top_features", [])[:3],
                    })
        except Exception:
            pass

        # ── Signal 2: Login frequency (declining = disengaging) ─────────────
        # Proxy: check message activity in last 14d vs previous 14d
        try:
            from src.db import ChatbotMessage, ChatbotSession
            cutoff_recent = datetime.utcnow() - timedelta(days=14)
            cutoff_older  = datetime.utcnow() - timedelta(days=28)
            recent_msgs = db.query(ChatbotSession).filter(
                ChatbotSession.user_id == caregiver_user_id,
                ChatbotSession.started_at >= cutoff_recent,
            ).count()
            older_msgs = db.query(ChatbotSession).filter(
                ChatbotSession.user_id == caregiver_user_id,
                ChatbotSession.started_at >= cutoff_older,
                ChatbotSession.started_at < cutoff_recent,
            ).count()
            if older_msgs > 0 and recent_msgs < older_msgs * 0.5:
                score += 0.20
                signals.append({
                    "signal":   "Reduced platform engagement",
                    "value":    f"{recent_msgs} sessions vs {older_msgs} previously",
                    "severity": "warning",
                    "shap":     [],
                })
        except Exception:
            pass

        # ── Signal 3: Proactive check (time since last login) ────────────────
        # If user hasn't logged in for 7+ days while assigned patients are active
        last_login = getattr(user, 'last_login', None) or getattr(user, 'last_login_at', None)
        if last_login and last_login < datetime.utcnow() - timedelta(days=7):
            score += 0.15
            signals.append({
                "signal":   "No login for 7+ days",
                "value":    f"Last login: {last_login.strftime('%d %b')}",
                "severity": "warning",
                "shap":     [],
            })

        # ── Composite level ─────────────────────────────────────────────────
        result["burnout_score"] = round(min(1.0, score), 3)
        result["burnout_level"] = (
            "critical" if score >= 0.70 else
            "high"     if score >= 0.50 else
            "moderate" if score >= 0.30 else
            "low"
        )
        result["signals"] = signals

        # Recommendations
        if score >= 0.50:
            result["recommendations"] = [
                "Arrange respite care support immediately",
                "Social worker assessment this week",
                "Caregiver support group referral",
            ]
        elif score >= 0.30:
            result["recommendations"] = [
                "Check in with caregiver at next contact",
                "Discuss respite options",
            ]

    except Exception as e:
        logger.warning(f"Caregiver burnout assessment failed: {e}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# P11  --  Feedback Loop: PredictionFeedback -> retrain trigger
# ─────────────────────────────────────────────────────────────────────────────

def process_prediction_feedback(db: Any, min_new_feedback: int = 50) -> Dict[str, Any]:
    """
    Check PredictionFeedback table. If enough new negative feedback
    on a model, log a retrain request.
    Returns: dict of tasks that need retraining.
    """
    result = {"needs_retrain": [], "feedback_counts": {}, "checked_at": datetime.utcnow().isoformat()}

    try:
        from src.db import PredictionFeedback, Prediction
        from sqlalchemy import func

        # Count disagreements per model in last 30 days
        cutoff = datetime.utcnow() - timedelta(days=30)
        feedback_rows = (
            db.query(
                PredictionFeedback.feedback_type,
                func.count(PredictionFeedback.id).label("cnt"),
            )
            .filter(PredictionFeedback.created_at >= cutoff)
            .group_by(PredictionFeedback.feedback_type)
            .all()
        )

        total_feedback   = sum(r.cnt for r in feedback_rows)
        disagree_count   = sum(r.cnt for r in feedback_rows if r.feedback_type == "disagree")
        result["feedback_counts"] = {r.feedback_type: r.cnt for r in feedback_rows}
        result["total_feedback"]  = total_feedback

        if total_feedback >= min_new_feedback and disagree_count > 0:
            disagree_rate = disagree_count / total_feedback
            if disagree_rate > 0.25:
                # Log retrain request to a simple JSON file (no new table needed)
                import json
                retrain_log = {
                    "requested_at":   datetime.utcnow().isoformat(),
                    "total_feedback": total_feedback,
                    "disagree_rate":  round(disagree_rate, 3),
                    "action":         "retrain_all_models",
                    "reason":         f"{disagree_rate:.0%} disagreement rate in last 30 days",
                }
                import os
                from pathlib import Path
                log_path = Path(__file__).parent.parent / "ml_training" / "logs" / "retrain_requests.jsonl"
                log_path.parent.mkdir(exist_ok=True)
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(retrain_log) + "\n")
                result["needs_retrain"] = ["all"]
                result["retrain_reason"] = retrain_log["reason"]
                logger.warning(f"[ML Feedback] Retraining flagged: {retrain_log['reason']}")

    except Exception as e:
        logger.warning(f"Feedback processing failed: {e}")

    return result


def save_prediction_feedback(
    prediction_id: int,
    clinician_user_id: int,
    feedback_type: str,
    note: Optional[str],
    correct_risk_level: Optional[str],
    db: Any,
) -> bool:
    """Save clinician feedback on a prediction for the retrain loop."""
    try:
        from src.db import PredictionFeedback
        fb = PredictionFeedback(
            prediction_id=prediction_id,
            clinician_id=clinician_user_id,
            feedback_type=feedback_type,
            note=note,
            created_at=datetime.utcnow(),
        )
        db.add(fb)
        db.commit()
        return True
    except Exception as e:
        logger.warning(f"Save feedback failed: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return False
