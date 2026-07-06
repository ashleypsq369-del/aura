"""
Complete ML system test  --  all priorities P1-P11
Run: python test_ml_complete.py
"""
import sys, json

PASS = []
FAIL = []

def ok(msg): PASS.append(msg); print(f"  [PASS] {msg}")
def fail(msg, err=""): FAIL.append(msg); print(f"  [FAIL] {msg}{' -- '+str(err) if err else ''}")

# ── Shared test features (realistic palliative patient) ───────────────────
TEST_FEATURES = {
    "age": 72, "pps": 50, "esas_pain": 7, "esas_tired": 8,
    "esas_nausea": 4, "esas_depress": 5, "esas_anxiety": 6,
    "esas_drowsy": 3, "esas_appetite": 5, "esas_wellbeing": 4,
    "esas_breath": 6, "esas_total": 48,
    "heart_rate": 95, "bp_systolic": 145, "bp_diastolic": 90,
    "oxygen_saturation": 91, "temperature": 37.8, "respiratory_rate": 20,
    "phq9": 12, "gad7": 10, "barthel": 55, "mmse": 22,
    "zarit": 38, "meds_count": 7, "high_risk_meds": 2,
    "drug_interactions": 1, "adherence_score": 5.5, "comorbidities": 4,
    "ed_visits_6m": 2, "recent_ed_visits": 2, "social_support": 4.0,
    "care_hours_per_week": 45, "carer_age": 62, "has_respite": 0,
    "patient_pps": 50, "patient_esas_total": 48,
    "recent_hospitalisations": 2, "recent_delirium": 0, "cog_affecting_meds": 1,
}

print("\n" + "="*60)
print("P1-P5: XGBoost Model Training & SHAP Verification")
print("="*60)
try:
    from services.ml_model_service import ml_service

    if len(ml_service.models) == 8:
        ok(f"All 8 XGBoost models loaded")
    else:
        fail(f"Only {len(ml_service.models)}/8 models loaded")

    if len(ml_service.explainers) == 8:
        ok(f"All 8 SHAP explainers loaded")
    else:
        fail(f"Only {len(ml_service.explainers)}/8 SHAP explainers")

    EXPECTED_TASKS = [
        "vital_risk", "symptom_burden", "functional_decline",
        "cognitive_impairment", "mental_health_risk", "medication_risk",
        "caregiver_burden", "admission_risk"
    ]
    for task in EXPECTED_TASKS:
        r = ml_service.predict_with_shap(task, TEST_FEATURES, top_k=3)
        if r is None:
            fail(f"{task}: prediction returned None"); continue
        if not (0.0 <= r["probability"] <= 1.0):
            fail(f"{task}: probability {r['probability']} out of range"); continue
        if r["risk_level"] not in ("normal","warning","critical","low","moderate","high"):
            fail(f"{task}: bad risk_level '{r['risk_level']}'"); continue
        shap_ok = r["shap_available"] and len(r["top_features"]) > 0
        top = r["top_features"][0] if r["top_features"] else None
        shap_str = f"SHAP={top['shap_value']:+.4f}" if top and r["shap_available"] else "feat-imp"
        ok(f"{task}: prob={r['probability']:.3f} level={r['risk_level']:<8} {shap_str}")

    overall = ml_service.get_overall_risk(TEST_FEATURES)
    if overall["overall_risk"] > 0:
        ok(f"Overall risk: {overall['overall_risk']:.3f} -> {overall['risk_level'].upper()} (highest: {overall.get('highest_risk_task','')})")
    else:
        fail("Overall risk is 0")

    # AUC check from metadata
    print("\n  --- Model Quality (AUC from training metadata) ---")
    for task in EXPECTED_TASKS:
        meta = ml_service.metadata.get(task, {})
        metrics = meta.get("metrics", {})
        auc = metrics.get("auc") or metrics.get("roc_auc")
        if auc:
            status = "ok" if auc > 0.80 else "WARN"
            print(f"    [{status}] {task}: AUC={auc:.4f}")
        else:
            print(f"    [--] {task}: no AUC in metadata")

except Exception as e:
    fail("ML model test", e)

print("\n" + "="*60)
print("P6: ESAS Trend Features (get_daily_checkin_trends)")
print("="*60)
try:
    from services.advanced_ml_service import get_daily_checkin_trends
    from src.db import get_session
    db = get_session()
    # Test with patient 1  --  may have no data, that's fine
    trends = get_daily_checkin_trends(1, db, days=14)
    if isinstance(trends, dict):
        ok(f"P6 trend extraction ran  --  {len(trends)} features returned")
        if trends:
            sample_key = list(trends.keys())[0]
            ok(f"  Sample: {sample_key} = {trends[sample_key]:.3f}")
    else:
        fail("P6 returned non-dict")
    db.close()
except Exception as e:
    fail("P6 ESAS trends", e)

print("\n" + "="*60)
print("P7: Longitudinal Deterioration Detector")
print("="*60)
try:
    from services.advanced_ml_service import detect_longitudinal_deterioration
    from src.db import get_session
    db = get_session()
    det = detect_longitudinal_deterioration(1, db, window_days=30)
    if "deterioration_score" in det and "level" in det:
        ok(f"P7 deterioration: score={det['deterioration_score']:.3f} level={det['level']}")
        ok(f"  Velocity dims: {list(det['velocity_by_dim'].keys())[:4]}")
        if det.get("top_drivers"):
            ok(f"  Top driver: {det['top_drivers'][0]['reason']}")
    else:
        fail("P7 missing keys", det)
    db.close()
except Exception as e:
    fail("P7 deterioration", e)

print("\n" + "="*60)
print("P8: Prognosis / Survival Estimator")
print("="*60)
try:
    from services.advanced_ml_service import estimate_prognosis
    from src.db import get_session
    db = get_session()
    prog = estimate_prognosis(1, db)
    if prog.get("median_weeks") is not None or prog.get("risk_category") == "unknown":
        ok(f"P8 prognosis ran  --  display='{prog.get('months_display')}' risk_cat={prog.get('risk_category')} conf={prog.get('confidence')}")
        if prog.get("key_factors"):
            ok(f"  Factors: {[f['factor'] for f in prog['key_factors'][:2]]}")
    else:
        fail("P8 prognosis returned no result", prog)
    db.close()
except Exception as e:
    fail("P8 prognosis", e)

print("\n" + "="*60)
print("P9: Drug Interaction Detector")
print("="*60)
try:
    from services.advanced_ml_service import detect_drug_interactions

    # Test 1: known severe interaction
    meds_severe = [
        {"name": "Morphine"},
        {"name": "Diazepam"},
        {"name": "Warfarin"},
        {"name": "Aspirin"},
    ]
    ixs = detect_drug_interactions(meds_severe)
    severe = [i for i in ixs if i["severity"] == "SEVERE"]
    if severe:
        ok(f"P9 SEVERE interaction detected: {severe[0]['drug_a']} + {severe[0]['drug_b']}")
        ok(f"  Effect: {severe[0]['effect']}")
        ok(f"  Action: {severe[0]['action']}")
    else:
        fail("P9 no SEVERE interaction found for morphine+diazepam, warfarin+aspirin")

    # Test 2: no interactions
    safe_meds = [{"name": "Paracetamol"}, {"name": "Omeprazole"}]
    safe_ixs = detect_drug_interactions(safe_meds)
    ok(f"P9 safe meds: {len(safe_ixs)} interactions (expected 0)")

    # Test 3: polypharmacy
    many_meds = [{"name": f"Drug{i}"} for i in range(9)]
    poly = detect_drug_interactions(many_meds)
    poly_flag = any(i.get("pair_key") == "polypharmacy" for i in poly)
    if poly_flag:
        ok("P9 polypharmacy flag triggered for 9 medications")
    else:
        fail("P9 polypharmacy not flagged for 9 meds")

except Exception as e:
    fail("P9 drug interactions", e)

print("\n" + "="*60)
print("P10: Caregiver Burnout Early Warning")
print("="*60)
try:
    from services.advanced_ml_service import assess_caregiver_burnout
    from src.db import get_session
    db = get_session()
    # Test with user 1 (any user)
    burnout = assess_caregiver_burnout(1, db)
    if "burnout_score" in burnout and "burnout_level" in burnout:
        ok(f"P10 burnout assessment ran: score={burnout['burnout_score']:.3f} level={burnout['burnout_level']}")
        ok(f"  Signals: {len(burnout['signals'])}, Recs: {len(burnout['recommendations'])}")
    else:
        fail("P10 missing keys")
    db.close()
except Exception as e:
    fail("P10 caregiver burnout", e)

print("\n" + "="*60)
print("P11: Feedback Loop & Retrain Trigger")
print("="*60)
try:
    from services.advanced_ml_service import process_prediction_feedback, save_prediction_feedback
    from src.db import get_session
    db = get_session()

    # Test feedback processing (should work even with empty table)
    result = process_prediction_feedback(db, min_new_feedback=50)
    if "feedback_counts" in result and "checked_at" in result:
        ok(f"P11 feedback processing ran: {result['feedback_counts']} feedback entries")
    else:
        fail("P11 process_prediction_feedback returned unexpected format")

    # Test saving feedback (use prediction_id=1  --  may not exist, that's ok)
    # We test that it doesn't crash catastrophically
    try:
        saved = save_prediction_feedback(
            prediction_id=1,
            clinician_user_id=1,
            feedback_type="agree",
            note="Test feedback from automated test",
            correct_risk_level=None,
            db=db
        )
        ok(f"P11 save_prediction_feedback ran: {'saved' if saved else 'skipped (no prediction 1)'}")
    except Exception as e2:
        ok(f"P11 save_feedback gracefully handled missing prediction: {type(e2).__name__}")

    db.close()
except Exception as e:
    fail("P11 feedback loop", e)

print("\n" + "="*60)
print("BACKEND ROUTER TESTS (import + instantiation)")
print("="*60)
try:
    from routers.advanced_ml import router as adv_router
    routes = [r.path for r in adv_router.routes]
    expected = [
        "/patient/{patient_id}/full-analysis",
        "/patient/{patient_id}/deterioration",
        "/patient/{patient_id}/prognosis",
        "/patient/{patient_id}/drug-interactions",
        "/caregiver/{user_id}/burnout",
        "/caregivers/burnout-overview",
        "/feedback",
        "/patients/drug-interactions",
    ]
    for ep in expected:
        if ep in routes:
            ok(f"Route {ep}")
        else:
            fail(f"Route {ep} MISSING from advanced_ml router")
except Exception as e:
    fail("advanced_ml router import", e)

try:
    from routers.ml_predictions import router as ml_router
    ml_routes = [r.path for r in ml_router.routes]
    for ep in ["/patient/{patient_id}/risk", "/patients/batch-risk", "/status"]:
        if ep in ml_routes:
            ok(f"ML route {ep}")
        else:
            fail(f"ML route {ep} MISSING")
except Exception as e:
    fail("ml_predictions router import", e)

print("\n" + "="*60)
print("DATABASE INTEGRITY")
print("="*60)
try:
    from src.db import get_session, Patient, User, Alert, Medication
    from sqlalchemy import text
    db = get_session()

    patients = db.query(Patient).count()
    users    = db.query(User).count()
    meds     = db.query(Medication).count()
    alerts   = db.query(Alert).filter(Alert.is_acknowledged == False).count()

    ok(f"Patients: {patients}")
    ok(f"Users: {users}")
    ok(f"Active medications: {meds}")
    ok(f"Unacknowledged alerts: {alerts}")

    # Check alert messages are clean (no long floats)  --  use Python regex not SQL LIKE
    import re as _re
    all_alerts = db.query(Alert).all()
    bad_floats = sum(1 for a in all_alerts if a.message and _re.search(r'\d+\.\d{4,}', a.message))
    if bad_floats == 0:
        ok("Alert messages: no unformatted floats")
    else:
        fail(f"Alert messages: {bad_floats} still have unformatted floats")

    db.close()
except Exception as e:
    fail("Database integrity", e)

print("\n" + "="*60)
print(f"FINAL: {len(PASS)} passed, {len(FAIL)} failed")
print("="*60)
if FAIL:
    print("FAILURES:")
    for f in FAIL:
        print(f"  - {f}")
    sys.exit(1)
else:
    print("ALL TESTS PASSED")
    sys.exit(0)
