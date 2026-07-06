"""
Test Script for Trained Models
Tests a specific model with sample patient data
"""

import sys
import argparse
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.ml_model_service import get_ml_service


# Sample patient data for each task
SAMPLE_DATA = {
    "vital_risk": {
        "heart_rate": 95,
        "blood_pressure_sys": 145,
        "blood_pressure_dia": 88,
        "oxygen_saturation": 92,
        "temperature": 37.8,
        "respiratory_rate": 22,
        "age": 75,
        "weight": 68.5,
        "height": 165.0,
        "bmi": 25.2
    },
    
    "symptom_burden": {
        "esas_pain": 7,
        "esas_tiredness": 6,
        "esas_nausea": 3,
        "esas_depression": 5,
        "esas_anxiety": 4,
        "esas_drowsiness": 5,
        "esas_appetite": 6,
        "esas_wellbeing": 4,
        "esas_shortness_of_breath": 5,
        "age": 72,
        "primary_diagnosis": 0,  # 0=cancer
        "medications_count": 8
    },
    
    "functional_decline": {
        "pps_score": 40,
        "barthel_score": 35,
        "ecog_score": 3,
        "karnofsky_score": 40,
        "age": 78,
        "comorbidities_count": 4,
        "recent_hospitalizations": 2
    },
    
    "cognitive_impairment": {
        "mmse_score": 20,
        "moca_score": 18,
        "age": 82,
        "education_years": 10,
        "medications_affecting_cognition": 2,
        "recent_delirium": 1
    },
    
    "mental_health_risk": {
        "phq9_score": 18,
        "gad7_score": 15,
        "esas_depression": 7,
        "esas_anxiety": 6,
        "age": 68,
        "social_support_score": 3,
        "recent_life_events": 2
    },
    
    "medication_risk": {
        "medications_count": 12,
        "high_risk_medications": 3,
        "drug_interactions": 2,
        "mmas8_score": 4.5,
        "age": 76,
        "kidney_function": 35,  # eGFR
        "liver_function": 55  # ALT
    },
    
    "caregiver_burden": {
        "zarit_score": 52,
        "care_hours_per_week": 85,
        "caregiver_age": 68,
        "patient_functional_status": 30,
        "financial_strain": 7,
        "respite_care_access": 2
    },
    
    "admission_risk": {
        "recent_ed_visits": 2,
        "pps_score": 35,
        "esas_total": 52,
        "comorbidities_count": 5,
        "age": 74,
        "social_support_score": 2,
        "medications_count": 10
    }
}


def test_model(task: str):
    """Test a specific model with sample data"""
    
    logger.info("="*80)
    logger.info(f"TESTING MODEL: {task.upper()}")
    logger.info("="*80)
    
    # Get ML service
    ml_service = get_ml_service()
    
    if not ml_service.is_available():
        logger.error("❌ ML service not available")
        return
    
    if task not in ml_service.get_available_tasks():
        logger.error(f"❌ Task '{task}' not available")
        logger.info(f"Available tasks: {ml_service.get_available_tasks()}")
        return
    
    # Get model info
    logger.info("\n" + "="*80)
    logger.info("MODEL INFO")
    logger.info("="*80)
    
    model_info = ml_service.get_model_info(task)
    if model_info:
        logger.info(f"Task: {model_info['task_name']}")
        logger.info(f"Target: {model_info['target']}")
        logger.info(f"Number of features: {model_info['num_features']}")
        logger.info(f"Features: {', '.join(model_info['features'][:5])}...")
    
    # Get sample data
    if task not in SAMPLE_DATA:
        logger.error(f"❌ No sample data for task '{task}'")
        return
    
    patient_data = SAMPLE_DATA[task]
    
    logger.info("\n" + "="*80)
    logger.info("SAMPLE PATIENT DATA")
    logger.info("="*80)
    
    for key, value in patient_data.items():
        logger.info(f"  {key}: {value}")
    
    # Get prediction with SHAP
    logger.info("\n" + "="*80)
    logger.info("PREDICTION WITH SHAP EXPLANATION")
    logger.info("="*80)
    
    result = ml_service.predict_with_shap(task, patient_data, top_k=10)
    
    if result is None:
        logger.error("❌ Failed to get prediction")
        return
    
    # Display results
    logger.info(f"\n✅ Prediction: {result['prediction']}")
    logger.info(f"✅ Probability: {result['probability']:.4f}")
    logger.info(f"✅ Risk Level: {result['risk_level'].upper()}")
    logger.info(f"✅ Model Type: {result['model_type']}")
    
    logger.info("\n" + "-"*80)
    logger.info("TOP 10 SHAP FEATURES (Real ML-based explanations)")
    logger.info("-"*80)
    
    for i, feat in enumerate(result['top_features'], 1):
        impact = "↑ INCREASES" if feat['impact'] == 'increases_risk' else "↓ DECREASES"
        logger.info(f"\n{i}. {feat['display_name']}")
        logger.info(f"   Value: {feat['value']}")
        logger.info(f"   SHAP: {feat['shap_value']:.4f}")
        logger.info(f"   Impact: {impact} risk")
        logger.info(f"   Importance: {feat['importance']:.4f}")
    
    # Get overall feature importance
    logger.info("\n" + "="*80)
    logger.info("OVERALL FEATURE IMPORTANCE")
    logger.info("="*80)
    
    importance = ml_service.get_feature_importance(task)
    if importance:
        logger.info("\nTop 5 most important features across all patients:")
        for i, feat in enumerate(importance[:5], 1):
            logger.info(f"{i}. {feat['display_name']}: {feat['importance']:.4f}")
    
    logger.info("\n" + "="*80)
    logger.info("✅ TEST COMPLETE")
    logger.info("="*80)


def main():
    parser = argparse.ArgumentParser(description="Test trained ML models")
    parser.add_argument(
        "--task",
        type=str,
        required=True,
        choices=[
            "vital_risk",
            "symptom_burden",
            "functional_decline",
            "cognitive_impairment",
            "mental_health_risk",
            "medication_risk",
            "caregiver_burden",
            "admission_risk",
            "all"
        ],
        help="Task to test (or 'all' to test all tasks)"
    )
    
    args = parser.parse_args()
    
    if args.task == "all":
        # Test all tasks
        for task in SAMPLE_DATA.keys():
            test_model(task)
            print("\n\n")
    else:
        test_model(args.task)


if __name__ == "__main__":
    main()
