"""Verify ML models loaded with real SHAP values."""
import sys
sys.path.insert(0, '.')

from services.ml_model_service import ml_service

print("=== ML Service Status ===")
print(f"Available: {ml_service.is_available()}")
print(f"Tasks loaded: {ml_service.get_available_tasks()}")
print()

info = ml_service.get_model_info()
for task, v in info.items():
    if v['loaded']:
        auc = v['metrics'].get('auc', '?')
        f1  = v['metrics'].get('f1',  '?')
        shap = 'YES' if v['shap_available'] else 'NO'
        print(f"  {task:<28} AUC={auc}  F1={f1}  SHAP={shap}")

print()

# Test a real prediction with SHAP
test_patient = {
    "age": 78, "pps": 42, "esas_pain": 7, "esas_tired": 8,
    "esas_nausea": 4, "esas_depress": 6, "esas_anxiety": 5,
    "esas_drowsy": 4, "esas_appetite": 6, "esas_breath": 5,
    "esas_wellbeing": 7, "esas_total": 52,
    "phq9": 16, "gad7": 12, "barthel": 45, "mmse": 22, "zarit": 48,
    "meds_count": 9, "comorbidities": 4, "ed_visits_6m": 3,
    "social_support": 3, "heart_rate": 108, "bp_systolic": 145,
    "bp_diastolic": 88, "oxygen_saturation": 91, "temperature": 37.8,
    "respiratory_rate": 22, "high_risk_meds": 2, "drug_interactions": 1,
    "adherence_score": 4, "recent_delirium": 0, "cog_affecting_meds": 2,
    "care_hours_per_week": 65, "carer_age": 68, "has_respite": 0,
    "patient_pps": 42, "patient_esas_total": 52,
    "recent_hospitalisations": 2,
}

print("=== Test Prediction (high-risk patient) ===")
for task in ["vital_risk", "admission_risk", "symptom_burden"]:
    result = ml_service.predict_with_shap(task, test_patient, top_k=5)
    if result:
        print(f"\n[{task}]")
        print(f"  Probability: {result['probability']:.3f}  Risk: {result['risk_level']}")
        print(f"  SHAP available: {result['shap_available']}")
        print("  Top features:")
        for f in result['top_features'][:4]:
            arrow = "UP" if f['impact'] == 'increases_risk' else "DN"
            print(f"    [{arrow}] {f['display_name']:<30} val={f['value']:.1f}  shap={f['shap_value']:.4f}  {f['pct']:.0f}%")

print("\n=== Overall Risk ===")
overall = ml_service.get_overall_risk(test_patient)
print(f"Overall: {overall['overall_risk']:.3f}  Level: {overall['risk_level']}")
print(f"Highest risk task: {overall['highest_risk_task']}")
