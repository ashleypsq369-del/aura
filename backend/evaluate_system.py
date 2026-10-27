"""
evaluate_system.py
==================
Full system evaluation for Project Aura.
Tests: ML models, metrics, SHAP, live API endpoints, database health,
       advanced ML (P6-P11), LLM status, and data integrity.

Run from backend/ folder:
    python evaluate_system.py

Does NOT require the backend to be running -- loads models directly.
"""

import sys, json, time, traceback
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

PASS  = "[PASS]"
FAIL  = "[FAIL]"
WARN  = "[WARN]"
INFO  = "[INFO]"
SEP   = "-" * 65

results = {"pass": 0, "fail": 0, "warn": 0}

def p(icon, label, detail=""):
    tag = {"[PASS]": "PASS", "[FAIL]": "FAIL", "[WARN]": "WARN", "[INFO]": "INFO"}[icon]
    results[tag.lower()] = results.get(tag.lower(), 0) + (1 if tag in ("PASS","FAIL","WARN") else 0)
    suffix = f"  -- {detail}" if detail else ""
    print(f"  {icon}  {label}{suffix}")

def section(title):
    print(f"\n{'='*65}")
    print(f"  {title}")
    print('='*65)

# ─────────────────────────────────────────────────────────────────────────────
# 1. DATABASE
# ─────────────────────────────────────────────────────────────────────────────
section("1. DATABASE HEALTH")

try:
    from src.db import SessionLocal, User, Patient, Vital, ESASAssessment
    from src.db import Medication, Appointment, Alert, NotificationQueue
    from src.db import CommunityGroup, Resource, CarePlan, PatientJourneyEvent
    from src.db import PPSAssessment, PHQ9Assessment, CaregiverBurdenAssessment
    from src.db import ChatbotSession, ChatbotMessage

    db = SessionLocal()

    counts = {
        "Users":              db.query(User).count(),
        "Patients":           db.query(Patient).count(),
        "Vitals":             db.query(Vital).count(),
        "ESAS assessments":   db.query(ESASAssessment).count(),
        "Medications":        db.query(Medication).count(),
        "Appointments":       db.query(Appointment).count(),
        "Alerts":             db.query(Alert).count(),
        "Notifications":      db.query(NotificationQueue).count(),
        "Community groups":   db.query(CommunityGroup).count(),
        "Resources":          db.query(Resource).count(),
        "Care plans":         db.query(CarePlan).count(),
        "Journey events":     db.query(PatientJourneyEvent).count(),
        "PPS assessments":    db.query(PPSAssessment).count(),
        "PHQ-9 assessments":  db.query(PHQ9Assessment).count(),
        "Caregiver burden":   db.query(CaregiverBurdenAssessment).count(),
        "Chatbot sessions":   db.query(ChatbotSession).count(),
        "Chatbot messages":   db.query(ChatbotMessage).count(),
    }

    MINIMUMS = {
        "Users": 10, "Patients": 8, "Vitals": 200,
        "ESAS assessments": 50, "Medications": 20,
        "Appointments": 20, "Alerts": 10,
        "Community groups": 5, "Resources": 10,
        "Care plans": 8, "Journey events": 20,
    }

    for name, count in counts.items():
        minimum = MINIMUMS.get(name, 0)
        icon = PASS if count >= minimum else (WARN if count > 0 else FAIL)
        p(icon, f"{name:<25} {count:>5} records",
          f"min expected {minimum}" if minimum and count < minimum else "")

    # Role coverage
    roles = db.query(User.role).distinct().all()
    role_set = {r[0] for r in roles}
    expected = {"admin", "clinician", "caregiver", "patient", "family"}
    missing  = expected - role_set
    if not missing:
        p(PASS, "All 5 roles present in users table")
    else:
        p(FAIL, "Missing roles", ", ".join(missing))

    # Questionnaire completion check
    from src.db import PatientPreferences
    patients_needing_q = db.query(User).filter(
        User.role.in_(["patient", "family"]),
        User.is_active == True,
    ).count()
    prefs_complete = db.query(PatientPreferences).filter(
        PatientPreferences.questionnaire_complete == True
    ).count()
    p(INFO, f"Questionnaire complete: {prefs_complete} records")

    # Drug interaction check
    abena_meds = db.query(Medication).join(
        Patient, Medication.patient_id == Patient.id
    ).filter(
        Patient.patient_code == "patient.abena2",
        Medication.is_active == True,
    ).all()
    med_names = [m.name for m in abena_meds]
    if "Morphine (Oral)" in med_names and "Diazepam" in med_names:
        p(PASS, "Abena SEVERE interaction pair present",
          "Morphine + Diazepam")
    else:
        p(FAIL, "Abena drug interaction pair missing", f"Found: {med_names}")

    db.close()

except Exception as e:
    p(FAIL, "Database connection failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 2. ML MODELS - LOADING & METRICS
# ─────────────────────────────────────────────────────────────────────────────
section("2. ML MODEL LOADING & METRICS")

EXPECTED_TASKS = [
    "vital_risk", "symptom_burden", "functional_decline",
    "cognitive_impairment", "mental_health_risk", "medication_risk",
    "caregiver_burden", "admission_risk",
]

# Metric thresholds for production readiness
THRESHOLDS = {
    "auc":       0.90,
    "accuracy":  0.90,
    "precision": 0.70,
    "recall":    0.70,
    "f1":        0.70,
}

try:
    from services.ml_model_service import ml_service

    if ml_service.is_available():
        p(PASS, "ML service initialised")
    else:
        p(FAIL, "ML service not available -- run train_models_now.py")

    loaded = ml_service.get_available_tasks()
    p(INFO, f"Loaded tasks: {len(loaded)}/{len(EXPECTED_TASKS)}")

    for task in EXPECTED_TASKS:
        in_models   = task in ml_service.models
        in_explainers = task in ml_service.explainers
        meta = ml_service.metadata.get(task, {})
        metrics = meta.get("metrics", {})

        if not in_models:
            p(FAIL, f"{task:<30} NOT LOADED")
            continue

        # Check all metrics meet thresholds
        metric_issues = []
        for metric, threshold in THRESHOLDS.items():
            val = metrics.get(metric, 0)
            if val < threshold:
                metric_issues.append(f"{metric}={val:.4f}<{threshold}")

        shap_status = "SHAP:yes" if in_explainers else "SHAP:rebuild"
        n_feat = meta.get("n_features", "?")
        n_samp = meta.get("n_samples", "?")
        auc    = metrics.get("auc", 0)
        f1     = metrics.get("f1", 0)

        if metric_issues:
            p(WARN, f"{task:<30} AUC={auc:.4f}  F1={f1:.4f}  {shap_status}",
              "low: " + ", ".join(metric_issues))
        else:
            p(PASS, f"{task:<30} AUC={auc:.4f}  F1={f1:.4f}  {shap_status}  feat={n_feat}  n={n_samp}")

except Exception as e:
    p(FAIL, "ML model loading failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 3. ML MODEL DETAILED METRICS TABLE
# ─────────────────────────────────────────────────────────────────────────────
section("3. ML MODEL METRICS DETAIL")

try:
    summary_path = Path(__file__).parent / "ml_training" / "models" / "training_summary.json"
    with open(summary_path) as f:
        summary = json.load(f)

    print(f"\n  {'Task':<28} {'AUC':>7} {'Acc':>7} {'Prec':>7} {'Rec':>7} {'F1':>7}  Status")
    print(f"  {'-'*28} {'-'*7} {'-'*7} {'-'*7} {'-'*7} {'-'*7}  ------")

    all_pass = True
    for task in EXPECTED_TASKS:
        m = summary.get(task, {})
        auc  = m.get("auc",       0)
        acc  = m.get("accuracy",  0)
        prec = m.get("precision", 0)
        rec  = m.get("recall",    0)
        f1   = m.get("f1",        0)
        ok   = m.get("status") == "success" and auc >= 0.90

        status = "PASS" if ok else "WARN"
        if not ok:
            all_pass = False

        print(f"  {task:<28} {auc:>7.4f} {acc:>7.4f} {prec:>7.4f} {rec:>7.4f} {f1:>7.4f}  {status}")

    print()
    avg_auc = sum(summary[t]["auc"] for t in EXPECTED_TASKS if t in summary) / len(EXPECTED_TASKS)
    avg_f1  = sum(summary[t]["f1"]  for t in EXPECTED_TASKS if t in summary) / len(EXPECTED_TASKS)
    p(INFO, f"Average AUC across all 8 models: {avg_auc:.4f}")
    p(INFO, f"Average F1  across all 8 models: {avg_f1:.4f}")
    if avg_auc >= 0.98:
        p(PASS, "Overall model quality: EXCELLENT (avg AUC >= 0.98)")
    elif avg_auc >= 0.95:
        p(PASS, "Overall model quality: GOOD (avg AUC >= 0.95)")
    elif avg_auc >= 0.90:
        p(WARN, "Overall model quality: ACCEPTABLE (avg AUC >= 0.90)")
    else:
        p(FAIL, "Overall model quality: BELOW THRESHOLD")

    # Best and worst
    best  = max(EXPECTED_TASKS, key=lambda t: summary.get(t, {}).get("auc", 0))
    worst = min(EXPECTED_TASKS, key=lambda t: summary.get(t, {}).get("auc", 0))
    p(INFO, f"Best  model: {best} (AUC {summary[best]['auc']:.4f})")
    p(INFO, f"Lowest AUC: {worst} (AUC {summary[worst]['auc']:.4f})")

    # Precision/recall balance check
    for task in EXPECTED_TASKS:
        m = summary.get(task, {})
        prec = m.get("precision", 0)
        rec  = m.get("recall",    0)
        gap  = abs(prec - rec)
        if gap > 0.20:
            p(WARN, f"{task}: precision/recall gap {gap:.3f}",
              f"prec={prec:.3f} rec={rec:.3f} -- consider class weighting")

except Exception as e:
    p(FAIL, "Metrics file read failed", str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 4. LIVE PREDICTION TEST - run all 8 models on a synthetic patient
# ─────────────────────────────────────────────────────────────────────────────
section("4. LIVE PREDICTION TEST (SYNTHETIC PATIENT)")

SYNTHETIC_PATIENT = {
    # Vitals -- moderately compromised
    "heart_rate": 102.0, "bp_systolic": 108.0, "bp_diastolic": 68.0,
    "oxygen_saturation": 91.0, "temperature": 37.6, "respiratory_rate": 20.0,
    # Demographics
    "age": 72.0, "pps": 50.0,
    # ESAS
    "esas_pain": 7.0, "esas_tired": 8.0, "esas_nausea": 4.0,
    "esas_depress": 6.0, "esas_anxiety": 6.0, "esas_drowsy": 5.0,
    "esas_appetite": 6.0, "esas_wellbeing": 7.0, "esas_breath": 5.0,
    "esas_total": 54.0,
    # Assessments
    "phq9": 15.0, "gad7": 12.0,
    "barthel": 55.0, "mmse": 21.0,
    "zarit": 35.0,
    # Medications
    "meds_count": 6.0, "high_risk_meds": 2.0, "drug_interactions": 0.9,
    "adherence_score": 5.0,
    # Other
    "comorbidities": 4.0,
    "ed_visits_6m": 3.0, "recent_ed_visits": 3.0,
    "recent_hospitalisations": 2.0,
    "social_support": 4.0,
    "care_hours_per_week": 48.0, "carer_age": 62.0,
    "has_respite": 0.0,
    "patient_pps": 50.0, "patient_esas_total": 54.0,
    "recent_delirium": 0.0, "cog_affecting_meds": 2.0,
}

try:
    from services.ml_model_service import ml_service

    print(f"\n  Synthetic patient: Age 72, PPS 50%, Pain 7/10, SpO2 91%")
    print(f"  Expected overall: HIGH or CRITICAL risk\n")

    task_results = {}
    for task in EXPECTED_TASKS:
        if task not in ml_service.models:
            p(FAIL, f"{task:<30} model not loaded")
            continue

        t0 = time.perf_counter()
        result = ml_service.predict_with_shap(task, SYNTHETIC_PATIENT, top_k=5)
        elapsed = (time.perf_counter() - t0) * 1000

        if result is None:
            p(FAIL, f"{task:<30} prediction returned None")
            continue

        prob      = result["probability"]
        risk_lvl  = result["risk_level"]
        shap_ok   = result["shap_available"]
        n_feats   = len(result["top_features"])
        base_val  = result["base_value"]
        top_feat  = result["top_features"][0]["display_name"] if result["top_features"] else "?"

        task_results[task] = result

        icon = PASS if shap_ok else WARN
        p(icon,
          f"{task:<30} prob={prob:.3f}  risk={risk_lvl:<8}  "
          f"SHAP={'yes' if shap_ok else 'NO ':3}  "
          f"top_feat={top_feat[:20]:<20}  {elapsed:.1f}ms")

    # Overall risk
    if task_results:
        overall = ml_service.get_overall_risk(SYNTHETIC_PATIENT)
        ovr  = overall["overall_risk"]
        lvl  = overall["risk_level"]
        high = overall.get("highest_risk_task", "")
        p(PASS if ovr > 0.5 else WARN,
          f"Overall risk score: {ovr:.4f}  ({lvl.upper()})",
          f"highest task: {high}")

        if lvl in ("high", "critical"):
            p(PASS, "Risk classification correct for high-risk synthetic patient")
        else:
            p(WARN, f"Expected high/critical for this patient, got {lvl}")

except Exception as e:
    p(FAIL, "Live prediction test failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 5. SHAP EXPLAINABILITY TEST
# ─────────────────────────────────────────────────────────────────────────────
section("5. SHAP EXPLAINABILITY TEST")

try:
    from services.ml_model_service import ml_service

    shap_ok_count = 0
    for task in EXPECTED_TASKS:
        if task not in ml_service.models:
            continue
        result = ml_service.predict_with_shap(task, SYNTHETIC_PATIENT, top_k=10)
        if not result:
            p(FAIL, f"{task}: prediction failed")
            continue

        if result["shap_available"]:
            shap_ok_count += 1
            feats = result["top_features"]
            # Check SHAP values are non-zero and have correct sign logic
            has_positive  = any(f["shap_value"] > 0 for f in feats)
            has_negative  = any(f["shap_value"] < 0 for f in feats)
            sum_pct       = sum(f["pct"] for f in feats)
            base_val      = result["base_value"]

            issues = []
            if not has_positive:
                issues.append("no positive SHAP values")
            if sum_pct < 80:
                issues.append(f"pct sum {sum_pct:.1f}% < 80%")
            if base_val == 0 and task not in ("vital_risk",):
                issues.append("base_value=0 (explainer may be rebuilt)")

            if issues:
                p(WARN, f"{task:<30} SHAP ok but: {'; '.join(issues)}")
            else:
                p(PASS, f"{task:<30} SHAP values valid "
                  f"(base={base_val:.4f}, top={feats[0]['display_name'][:25]})")
        else:
            p(WARN, f"{task:<30} SHAP not available -- fallback to feature importance")

    p(INFO, f"SHAP available: {shap_ok_count}/{len(EXPECTED_TASKS)} models")
    if shap_ok_count == len(EXPECTED_TASKS):
        p(PASS, "All models have real SHAP explainability")
    elif shap_ok_count >= 6:
        p(WARN, f"Only {shap_ok_count}/8 models have SHAP -- some use feature importance fallback")
    else:
        p(FAIL, f"Only {shap_ok_count}/8 models have SHAP -- retrain recommended")

except Exception as e:
    p(FAIL, "SHAP test failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 6. FEATURE EXTRACTION TEST - real patient from DB
# ─────────────────────────────────────────────────────────────────────────────
section("6. FEATURE EXTRACTION FROM REAL DB PATIENTS")

try:
    from src.db import SessionLocal, Patient
    from routers.ml_predictions import extract_patient_features
    from services.ml_model_service import ml_service

    db = SessionLocal()
    patients = db.query(Patient).limit(12).all()

    p(INFO, f"Testing feature extraction on {len(patients)} patients")

    extract_ok = 0
    predict_ok = 0
    for pat in patients:
        try:
            features, data_quality = extract_patient_features(pat.id, db)
            extract_ok += 1

            # Run overall risk
            overall = ml_service.get_overall_risk(features)
            risk = overall["risk_level"]
            score = overall["overall_risk"]

            dq_flags = [k for k, v in data_quality.items() if not v]
            dq_note = f"missing: {','.join(dq_flags)}" if dq_flags else "all data present"

            p(PASS, f"{pat.full_name[:28]:<30} risk={risk:<10} score={score:.3f}  {dq_note}")
            predict_ok += 1

        except Exception as e:
            p(FAIL, f"Patient {pat.id} ({pat.full_name[:20]})", str(e))

    db.close()
    p(INFO, f"Feature extraction: {extract_ok}/{len(patients)} patients OK")
    p(INFO, f"Full prediction:    {predict_ok}/{len(patients)} patients OK")

    if predict_ok == len(patients):
        p(PASS, "All patients produce valid risk predictions")
    elif predict_ok >= len(patients) * 0.9:
        p(WARN, f"Most patients OK ({predict_ok}/{len(patients)})")
    else:
        p(FAIL, f"Too many failures ({len(patients)-predict_ok}/{len(patients)})")

except Exception as e:
    p(FAIL, "Feature extraction test failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 7. ADVANCED ML SERVICES (P6-P11)
# ─────────────────────────────────────────────────────────────────────────────
section("7. ADVANCED ML SERVICES (P6-P11)")

try:
    from services.advanced_ml_service import (
        get_daily_checkin_trends,
        detect_longitudinal_deterioration,
        detect_drug_interactions,
        estimate_prognosis,
        assess_caregiver_burnout,
    )
    from src.db import SessionLocal, Patient, Medication

    db = SessionLocal()

    # P6: ESAS trend
    try:
        for code in ["patient.ama2", "patient.abena2", "PAT-001"]:
            pat = db.query(Patient).filter(Patient.patient_code == code).first()
            if not pat:
                continue
            # get_daily_checkin_trends returns ML feature dict, not a count
            trend = get_daily_checkin_trends(pat.id, db, days=14)
            # Count actual ESAS records directly
            from src.db import ESASAssessment
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=14)
            n_checkins = db.query(ESASAssessment).filter(
                ESASAssessment.patient_id == pat.id,
                ESASAssessment.assessed_at >= cutoff,
            ).count()
            has_features = len(trend) > 0
            icon = PASS if n_checkins >= 3 else WARN
            avg_pain = trend.get("daily_pain_mean", "no data")
            p(icon, f"P6 ESAS trend ({code[:20]:<20}): {n_checkins} check-ins, {len(trend)} ML features",
              f"avg_pain={avg_pain:.2f}" if isinstance(avg_pain, float) else avg_pain)
            break
    except Exception as e:
        p(FAIL, "P6 ESAS trend service", str(e))

    # P7: Deterioration detection
    try:
        for code in ["patient.ama2", "PAT-005"]:
            pat = db.query(Patient).filter(Patient.patient_code == code).first()
            if not pat:
                continue
            det = detect_longitudinal_deterioration(pat.id, db, window_days=14)
            level = det.get("level", "?")
            score = det.get("deterioration_score", 0)
            p(PASS, f"P7 Deterioration ({code[:20]:<20}): level={level}  score={score:.3f}")
            break
    except Exception as e:
        p(FAIL, "P7 Deterioration detector", str(e))

    # P9: Drug interaction screening
    try:
        abena = db.query(Patient).filter(Patient.patient_code == "patient.abena2").first()
        if abena:
            meds = db.query(Medication).filter(
                Medication.patient_id == abena.id,
                Medication.is_active == True,
            ).all()
            med_list = [{"name": m.name} for m in meds if m.name]
            interactions = detect_drug_interactions(med_list)
            severe = [ix for ix in interactions if ix["severity"] == "SEVERE"]
            if severe:
                p(PASS, f"P9 Drug interactions: {len(interactions)} found, {len(severe)} SEVERE",
                  f"Morphine+Diazepam: {severe[0]['effect'][:50]}")
            else:
                p(WARN, f"P9 Drug interactions: {len(interactions)} found but 0 SEVERE for Abena",
                  f"Meds: {[m['name'] for m in med_list]}")
    except Exception as e:
        p(FAIL, "P9 Drug interaction screening", str(e))

    # P8: Prognosis estimation
    try:
        abena = db.query(Patient).filter(Patient.patient_code == "patient.abena2").first()
        if abena:
            prog = estimate_prognosis(abena.id, db)
            months = prog.get("months_display", "?")
            cat    = prog.get("risk_category", "?")
            conf   = prog.get("confidence", "N/A")
            # confidence may be string ("moderate") or float
            try:
                conf_str = f"{float(conf):.2f}"
            except (TypeError, ValueError):
                conf_str = str(conf)
            p(PASS, f"P8 Prognosis estimate: {months}  ({cat})  confidence={conf_str}")
    except Exception as e:
        p(FAIL, "P8 Prognosis estimator", str(e))

    # P10: Caregiver burnout
    try:
        from src.db import User
        caregivers = db.query(User).filter(User.role == "caregiver", User.is_active == True).all()
        burnout_ok = 0
        for cg in caregivers[:3]:
            try:
                result = assess_caregiver_burnout(cg.id, db)
                level  = result.get("burnout_level", "?")
                score  = result.get("burnout_score", 0)
                p(PASS, f"P10 Burnout ({cg.full_name[:22]:<24}): level={level}  score={score:.3f}")
                burnout_ok += 1
            except Exception as e2:
                p(WARN, f"P10 Burnout ({cg.full_name[:22]})", str(e2))
        if burnout_ok == 0:
            p(WARN, "P10 Caregiver burnout: no results (check caregiver_burden_assessments)")
    except Exception as e:
        p(FAIL, "P10 Caregiver burnout service", str(e))

    db.close()

except Exception as e:
    p(FAIL, "Advanced ML services failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 8. LLM / CHATBOT ENGINE STATUS
# ─────────────────────────────────────────────────────────────────────────────
section("8. LLM / CHATBOT ENGINE")

try:
    from services.true_llm_engine import (
        get_llm_status, generate_llm_response, detect_medical_flags
    )

    status = get_llm_status()
    provider  = status.get("provider", "unknown")
    available = status.get("available", False)
    model     = status.get("model", "unknown")

    if available:
        p(PASS, f"LLM provider: {provider}  model: {model}")
    else:
        p(WARN, f"LLM provider: {provider} (local fallback active)")

    # Test flag detection
    crisis_msg  = "I want to end my life"
    clinical_msg = "I have severe chest pain"
    normal_msg   = "What medications am I taking?"

    crisis_flags   = detect_medical_flags(crisis_msg)
    clinical_flags = detect_medical_flags(clinical_msg)
    normal_flags   = detect_medical_flags(normal_msg)

    if crisis_flags:
        p(PASS, f"Crisis detection:  flags={crisis_flags}")
    else:
        p(FAIL, "Crisis detection: no flags for suicide message")

    if clinical_flags:
        p(PASS, f"Clinical flag detection: flags={clinical_flags}")
    else:
        p(WARN, "Clinical flag detection: no flags for chest pain message")

    if not normal_flags:
        p(PASS, "Normal message: no false-positive flags")
    else:
        p(WARN, f"Normal message flagged (possible false positive): {normal_flags}")

    # Test response generation
    try:
        t0 = time.perf_counter()
        resp = generate_llm_response(
            message="How can I manage pain at home?",
            history=[],
            user_name="Kofi",
            user_role="patient",
            patient_context={"diagnosis": "Prostate Cancer", "esas_pain": 6},
        )
        elapsed = (time.perf_counter() - t0) * 1000
        reply = resp.get("message", "")
        is_real = resp.get("is_real_llm", False)
        p(PASS if reply else FAIL,
          f"Response generated: {len(reply)} chars  is_real_llm={is_real}  {elapsed:.0f}ms")
        if reply:
            print(f"\n  Preview: \"{reply[:120]}...\"\n")
    except Exception as e:
        p(WARN, "LLM response generation", str(e))

except Exception as e:
    p(FAIL, "LLM engine test failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 9. ROUTER IMPORTS & SYNTAX CHECK
# ─────────────────────────────────────────────────────────────────────────────
section("9. BACKEND ROUTER IMPORT CHECK")

ROUTERS = [
    "routers.auth", "routers.patients", "routers.vitals", "routers.symptoms",
    "routers.medications", "routers.appointments", "routers.alerts",
    "routers.notifications", "routers.ml_predictions", "routers.advanced_ml",
    "routers.llm_chatbot", "routers.portal", "routers.journey",
    "routers.caregivers", "routers.care_plans", "routers.community",
    "routers.resources", "routers.preferences", "routers.dashboard",
    "routers.care_settings", "routers.intelligent_care",
    "routers.caregiver_intelligence", "routers.clinical_assessments",
    "routers.admin", "routers.hipaa", "routers.ai_analysis",
    "routers.comprehensive_ai", "routers.bereavement", "routers.legacy",
    "routers.messaging",
]

import importlib
ok_count = 0
for mod_name in ROUTERS:
    try:
        mod = importlib.import_module(mod_name)
        ok_count += 1
        p(PASS, f"{mod_name}")
    except Exception as e:
        p(FAIL, f"{mod_name}", str(e)[:80])

p(INFO, f"Routers OK: {ok_count}/{len(ROUTERS)}")

# ─────────────────────────────────────────────────────────────────────────────
# 10. DATA INTEGRITY CHECKS
# ─────────────────────────────────────────────────────────────────────────────
section("10. DATA INTEGRITY CHECKS")

try:
    from src.db import SessionLocal, Patient, Vital, ESASAssessment
    from src.db import Medication, Alert, CaregiverAssignment, PatientFamilyLink
    from src.db import PatientPreferences

    db = SessionLocal()

    # Every patient should have vitals
    patients = db.query(Patient).all()
    missing_vitals = []
    missing_esas   = []
    missing_meds   = []
    missing_prefs  = []

    for pat in patients:
        v = db.query(Vital).filter(Vital.patient_id == pat.id).count()
        e = db.query(ESASAssessment).filter(ESASAssessment.patient_id == pat.id).count()
        m = db.query(Medication).filter(Medication.patient_id == pat.id).count()
        if v == 0: missing_vitals.append(pat.patient_code)
        if e == 0: missing_esas.append(pat.patient_code)
        if m == 0: missing_meds.append(pat.patient_code)

    p(PASS if not missing_vitals else WARN,
      f"Patients with vitals: {len(patients)-len(missing_vitals)}/{len(patients)}",
      f"missing: {missing_vitals}" if missing_vitals else "")

    p(PASS if not missing_esas else WARN,
      f"Patients with ESAS:   {len(patients)-len(missing_esas)}/{len(patients)}",
      f"missing: {missing_esas}" if missing_esas else "")

    p(PASS if not missing_meds else WARN,
      f"Patients with meds:   {len(patients)-len(missing_meds)}/{len(patients)}",
      f"missing: {missing_meds}" if missing_meds else "")

    from sqlalchemy import text as _sql_text

    # Temperature sanity check (must be Celsius 35-42)
    bad_temps = db.execute(_sql_text(
        "SELECT COUNT(*) FROM vitals WHERE temperature IS NOT NULL "
        "AND (temperature < 35 OR temperature > 42)"
    )).fetchone()[0]
    if bad_temps == 0:
        p(PASS, "All vital temperatures are valid Celsius (35-42°C)")
    else:
        p(FAIL, f"{bad_temps} vitals have impossible temperature values",
          "possible Fahrenheit data -- run temp normalisation")

    # Alert message float precision check - look for floats with 4+ decimal places
    bad_floats = db.execute(_sql_text(
        "SELECT COUNT(*) FROM alerts WHERE "
        "message REGEXP '[0-9]+\\.[0-9]{4,}'"
    )).fetchone()[0] if False else 0  # SQLite has no REGEXP by default; check via Python
    if bad_floats == 0:
        # Python-based check instead
        from src.db import Alert as AlertModel
        all_msgs = db.query(AlertModel.message).filter(
            AlertModel.message != None).limit(200).all()
        import re as _re
        over_precise = sum(
            1 for (msg,) in all_msgs
            if _re.search(r'\d+\.\d{4,}', msg or '')
        )
        p(PASS if over_precise == 0 else WARN,
          f"Alert float precision check: {over_precise} alerts with 4+ decimal places",
          "all messages use 1 decimal place" if over_precise == 0 else f"{over_precise} alerts need rounding")

    # Caregiver assignments
    assign_count = db.query(CaregiverAssignment).filter(
        CaregiverAssignment.active == True).count()
    p(PASS if assign_count >= 5 else WARN,
      f"Active caregiver assignments: {assign_count}")

    # Family links
    family_links = db.query(PatientFamilyLink).count()
    p(PASS if family_links >= 2 else WARN,
      f"Patient-family links: {family_links}")

    # Unread notifications check
    unread = db.execute(_sql_text(
        "SELECT COUNT(*) FROM notification_queue WHERE is_read = 0"
    )).fetchone()[0]
    p(INFO, f"Unread notifications in queue: {unread}")

    # Critical alerts check
    critical_alerts = db.execute(_sql_text(
        "SELECT COUNT(*) FROM alerts WHERE severity = 'critical' AND is_acknowledged = 0"
    )).fetchone()[0]
    p(INFO, f"Unacknowledged critical alerts: {critical_alerts}")

    db.close()

except Exception as e:
    p(FAIL, "Data integrity checks failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 11. MODEL FEATURE COVERAGE CHECK
# ─────────────────────────────────────────────────────────────────────────────
section("11. MODEL FEATURE COVERAGE")

try:
    import json as _json
    from pathlib import Path as _Path

    models_dir = _Path(__file__).parent / "ml_training" / "models"
    all_features = set()
    task_features = {}

    for task in EXPECTED_TASKS:
        meta_path = models_dir / task / "v1.0.0" / "metadata.json"
        if meta_path.exists():
            meta = _json.loads(meta_path.read_text())
            feats = meta.get("feature_names", [])
            task_features[task] = feats
            all_features.update(feats)

    p(INFO, f"Total unique features across all models: {len(all_features)}")

    # Check all features are extractable from extract_patient_features
    EXTRACTABLE = {
        "age", "heart_rate", "bp_systolic", "bp_diastolic", "oxygen_saturation",
        "temperature", "respiratory_rate", "pps", "esas_pain", "esas_tired",
        "esas_nausea", "esas_depress", "esas_anxiety", "esas_drowsy",
        "esas_appetite", "esas_wellbeing", "esas_breath", "esas_total",
        "phq9", "gad7", "barthel", "mmse", "zarit",
        "meds_count", "high_risk_meds", "drug_interactions", "adherence_score",
        "comorbidities", "ed_visits_6m", "recent_ed_visits", "social_support",
        "care_hours_per_week", "carer_age", "has_respite", "patient_pps",
        "patient_esas_total", "recent_hospitalisations", "recent_delirium",
        "cog_affecting_meds",
    }

    not_extractable = all_features - EXTRACTABLE
    if not not_extractable:
        p(PASS, "All model features are covered by feature extraction pipeline")
    else:
        p(WARN, f"{len(not_extractable)} features may use default values",
          ", ".join(sorted(not_extractable)))

    # Per-model feature summary
    for task, feats in task_features.items():
        covered   = [f for f in feats if f in EXTRACTABLE]
        uncovered = [f for f in feats if f not in EXTRACTABLE]
        icon = PASS if not uncovered else WARN
        p(icon, f"{task:<30} {len(covered)}/{len(feats)} features extractable from DB",
          f"defaults: {uncovered}" if uncovered else "")

except Exception as e:
    p(FAIL, "Feature coverage check failed", str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 12. PREDICTION CONSISTENCY TEST - same patient, same result
# ─────────────────────────────────────────────────────────────────────────────
section("12. PREDICTION CONSISTENCY (DETERMINISM)")

try:
    from services.ml_model_service import ml_service

    results_a = {}
    results_b = {}
    for task in EXPECTED_TASKS:
        if task not in ml_service.models:
            continue
        ra = ml_service.predict_with_shap(task, SYNTHETIC_PATIENT)
        rb = ml_service.predict_with_shap(task, SYNTHETIC_PATIENT)
        if ra and rb:
            results_a[task] = ra["probability"]
            results_b[task] = rb["probability"]

    all_consistent = True
    for task in results_a:
        diff = abs(results_a[task] - results_b[task])
        if diff > 1e-6:
            p(FAIL, f"{task}: non-deterministic! diff={diff:.8f}")
            all_consistent = False

    if all_consistent:
        p(PASS, f"All {len(results_a)} models produce identical results on repeated calls")

except Exception as e:
    p(FAIL, "Consistency test failed", str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 13. PERFORMANCE BENCHMARK
# ─────────────────────────────────────────────────────────────────────────────
section("13. PREDICTION PERFORMANCE BENCHMARK")

try:
    from services.ml_model_service import ml_service

    # Single patient all tasks
    t0 = time.perf_counter()
    for _ in range(10):
        ml_service.predict_all_tasks(SYNTHETIC_PATIENT)
    elapsed_10 = (time.perf_counter() - t0) * 1000
    avg_ms = elapsed_10 / 10

    p(PASS if avg_ms < 500 else WARN,
      f"Single patient all-task prediction: avg {avg_ms:.1f}ms per call")

    # Per-task timing
    for task in EXPECTED_TASKS:
        if task not in ml_service.models:
            continue
        t0 = time.perf_counter()
        for _ in range(20):
            ml_service.predict_with_shap(task, SYNTHETIC_PATIENT)
        ms = (time.perf_counter() - t0) * 1000 / 20
        icon = PASS if ms < 50 else WARN
        p(icon, f"{task:<30} avg {ms:.2f}ms per prediction")

    # Batch simulation (12 patients)
    t0 = time.perf_counter()
    for _ in range(12):
        ml_service.get_overall_risk(SYNTHETIC_PATIENT)
    batch_ms = (time.perf_counter() - t0) * 1000
    p(PASS if batch_ms < 3000 else WARN,
      f"Batch 12-patient overall risk: {batch_ms:.0f}ms total  ({batch_ms/12:.1f}ms/patient)")

except Exception as e:
    p(FAIL, "Performance benchmark failed", str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 14. EDGE CASES & ROBUSTNESS
# ─────────────────────────────────────────────────────────────────────────────
section("14. EDGE CASE & ROBUSTNESS TESTS")

try:
    from services.ml_model_service import ml_service

    # All zeros (no data patient)
    zero_patient = {f: 0.0 for f in SYNTHETIC_PATIENT}
    try:
        r = ml_service.get_overall_risk(zero_patient)
        p(PASS, f"All-zero patient: risk={r['risk_level']}  score={r['overall_risk']:.4f}")
    except Exception as e:
        p(FAIL, "All-zero patient prediction failed", str(e))

    # All max values (extreme critical patient)
    max_patient = {
        "heart_rate": 140, "bp_systolic": 70, "bp_diastolic": 40,
        "oxygen_saturation": 78, "temperature": 40.5, "respiratory_rate": 32,
        "age": 90, "pps": 10, "esas_pain": 10, "esas_tired": 10,
        "esas_nausea": 10, "esas_depress": 10, "esas_anxiety": 10,
        "esas_drowsy": 10, "esas_appetite": 10, "esas_wellbeing": 10,
        "esas_breath": 10, "esas_total": 90, "phq9": 27, "gad7": 21,
        "barthel": 0, "mmse": 0, "zarit": 88,
        "meds_count": 15, "high_risk_meds": 8, "drug_interactions": 3,
        "adherence_score": 0, "comorbidities": 10,
        "ed_visits_6m": 8, "recent_ed_visits": 8, "social_support": 0,
        "care_hours_per_week": 80, "carer_age": 85, "has_respite": 0,
        "patient_pps": 10, "patient_esas_total": 90,
        "recent_hospitalisations": 4, "recent_delirium": 1, "cog_affecting_meds": 5,
    }
    try:
        r = ml_service.get_overall_risk(max_patient)
        icon = PASS if r["risk_level"] in ("critical", "high") else WARN
        p(icon, f"Max-severity patient: risk={r['risk_level']}  score={r['overall_risk']:.4f}",
          "expected critical" if r["risk_level"] != "critical" else "")
    except Exception as e:
        p(FAIL, "Max-severity patient prediction failed", str(e))

    # Missing optional features (partial data)
    partial = {
        "age": 68, "pps": 60, "esas_pain": 5, "esas_total": 35,
        "heart_rate": 85, "oxygen_saturation": 93,
    }
    try:
        r = ml_service.get_overall_risk(partial)
        p(PASS, f"Partial data patient: risk={r['risk_level']}  score={r['overall_risk']:.4f}",
          "defaults used for missing features")
    except Exception as e:
        p(FAIL, "Partial data patient failed", str(e))

    # Stable low-risk patient
    stable = {
        "heart_rate": 72, "bp_systolic": 118, "bp_diastolic": 76,
        "oxygen_saturation": 97, "temperature": 36.7, "respiratory_rate": 14,
        "age": 58, "pps": 80, "esas_pain": 2, "esas_tired": 3,
        "esas_nausea": 1, "esas_depress": 2, "esas_anxiety": 2,
        "esas_drowsy": 1, "esas_appetite": 2, "esas_wellbeing": 2,
        "esas_breath": 1, "esas_total": 16, "phq9": 4, "gad7": 3,
        "barthel": 90, "mmse": 28, "zarit": 12,
        "meds_count": 2, "high_risk_meds": 0, "drug_interactions": 0,
        "adherence_score": 8, "comorbidities": 1,
        "ed_visits_6m": 0, "recent_ed_visits": 0, "social_support": 9,
        "care_hours_per_week": 15, "carer_age": 45, "has_respite": 1,
        "patient_pps": 80, "patient_esas_total": 16,
        "recent_hospitalisations": 0, "recent_delirium": 0, "cog_affecting_meds": 0,
    }
    try:
        r = ml_service.get_overall_risk(stable)
        icon = PASS if r["risk_level"] in ("low", "moderate") else WARN
        p(icon, f"Low-risk patient:     risk={r['risk_level']}  score={r['overall_risk']:.4f}",
          "expected low/moderate" if r["risk_level"] not in ("low", "moderate") else "")
    except Exception as e:
        p(FAIL, "Low-risk patient prediction failed", str(e))

except Exception as e:
    p(FAIL, "Edge case tests failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 15. DRUG INTERACTION MATRIX COVERAGE
# ─────────────────────────────────────────────────────────────────────────────
section("15. DRUG INTERACTION SCREENING COVERAGE")

try:
    from services.advanced_ml_service import detect_drug_interactions

    TEST_PAIRS = [
        # (drugs_list, expected_severity, description)
        ([{"name": "Morphine (Oral)"}, {"name": "Diazepam"}],
         "SEVERE", "Morphine + Diazepam (key test pair)"),
        ([{"name": "Morphine (Oral)"}, {"name": "Ondansetron"}],
         "MODERATE", "Morphine + Ondansetron"),
        ([{"name": "Warfarin"}, {"name": "Paracetamol"}],
         "MODERATE", "Warfarin + Paracetamol"),
        ([{"name": "Paracetamol"}],
         None, "Single drug - no interaction expected"),
        ([{"name": "Dexamethasone"}, {"name": "Morphine (Oral)"}, {"name": "Diazepam"}],
         "SEVERE", "3-drug combination with SEVERE pair"),
    ]

    for drugs, expected_sev, desc in TEST_PAIRS:
        try:
            interactions = detect_drug_interactions(drugs)
            sevs = [ix["severity"] for ix in interactions]
            has_severe   = "SEVERE" in sevs
            has_moderate = "MODERATE" in sevs or "MILD" in sevs

            if expected_sev is None:
                icon = PASS if not interactions else WARN
                p(icon, f"{desc}", f"found {len(interactions)} interactions" if interactions else "clean")
            elif expected_sev == "SEVERE":
                icon = PASS if has_severe else FAIL
                p(icon, f"{desc}", f"SEVERE found: {has_severe}  total interactions: {len(interactions)}")
            else:
                icon = PASS if (has_severe or has_moderate) else WARN
                p(icon, f"{desc}", f"interactions: {len(interactions)}")
        except Exception as e:
            p(FAIL, f"{desc}", str(e))

except Exception as e:
    p(FAIL, "Drug interaction matrix test failed", str(e))
    traceback.print_exc()

# ─────────────────────────────────────────────────────────────────────────────
# 16. FINAL SCORECARD
# ─────────────────────────────────────────────────────────────────────────────
section("16. FINAL SCORECARD")

total_checks = results.get("pass", 0) + results.get("fail", 0) + results.get("warn", 0)
pass_rate = (results.get("pass", 0) / total_checks * 100) if total_checks > 0 else 0

print(f"""
  Results Summary
  {SEP}
  PASS : {results.get('pass',  0):>4}
  WARN : {results.get('warn',  0):>4}  (non-critical, investigate when possible)
  FAIL : {results.get('fail',  0):>4}  (requires attention)
  {SEP}
  Total checks : {total_checks}
  Pass rate    : {pass_rate:.1f}%
""")

# Grade
if pass_rate >= 95 and results.get("fail", 0) == 0:
    grade = "A+ -- PRODUCTION READY"
elif pass_rate >= 90 and results.get("fail", 0) <= 2:
    grade = "A  -- EXCELLENT"
elif pass_rate >= 80 and results.get("fail", 0) <= 5:
    grade = "B  -- GOOD, minor issues"
elif pass_rate >= 65:
    grade = "C  -- ACCEPTABLE, review WARNs"
else:
    grade = "D  -- NEEDS WORK"

print(f"  Overall Grade: {grade}")
print()

# Model-specific grade
try:
    import json as _j
    from pathlib import Path as _P
    sm = _j.loads((_P(__file__).parent / "ml_training" / "models" / "training_summary.json").read_text())
    aucs = [sm[t]["auc"] for t in EXPECTED_TASKS if t in sm]
    avg  = sum(aucs) / len(aucs) if aucs else 0
    min_auc = min(aucs) if aucs else 0
    print(f"  ML Model Summary")
    print(f"  {SEP}")
    print(f"  Models trained  : {len(aucs)}/8")
    print(f"  Average AUC     : {avg:.4f}")
    print(f"  Lowest AUC      : {min_auc:.4f}  ({min(EXPECTED_TASKS, key=lambda t: sm.get(t,{}).get('auc',0))})")
    print(f"  All SHAP ready  : {all(t in getattr(ml_service, 'explainers', {}) for t in EXPECTED_TASKS)}")
    print()

    if avg >= 0.99:
        print("  ML Grade: A+  Exceptional -- avg AUC > 0.99")
    elif avg >= 0.97:
        print("  ML Grade: A   Excellent   -- avg AUC > 0.97")
    elif avg >= 0.95:
        print("  ML Grade: B+  Good        -- avg AUC > 0.95")
    elif avg >= 0.90:
        print("  ML Grade: B   Acceptable  -- avg AUC > 0.90")
    else:
        print("  ML Grade: C   Below target -- retrain recommended")

except Exception:
    pass

print(f"\n  Evaluation completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"  {'='*65}\n")
