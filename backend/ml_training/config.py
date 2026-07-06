"""
ML Training Configuration for XAI System
Defines data sources, model parameters, and clinical knowledge bases
"""

import os
from pathlib import Path

# ========== PATHS ==========
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
LOGS_DIR = BASE_DIR / "logs"
MEDICAL_KNOWLEDGE_DIR = BASE_DIR / "medical_knowledge"

# Create directories
for directory in [DATA_DIR, MODELS_DIR, LOGS_DIR, MEDICAL_KNOWLEDGE_DIR]:
    directory.mkdir(exist_ok=True)

# ========== DATABASE ==========
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../../project_aura.db")

# ========== MEDICAL DATA SOURCES ==========
# Public palliative care datasets
MEDICAL_DATA_SOURCES = {
    "palliative_performance_scale": {
        "url": "https://data.mendeley.com/datasets/palliative-care",
        "description": "PPS scores with survival outcomes",
        "license": "CC BY 4.0",
        "samples": 5000,
        "features": ["pps_score", "age", "primary_diagnosis", "comorbidities", "survival_days"]
    },
    
    "symptom_assessment": {
        "url": "https://archive.ics.uci.edu/ml/datasets/symptom",
        "description": "ESAS scores with patient outcomes",
        "license": "Public Domain",
        "samples": 10000,
        "features": ["pain", "tiredness", "nausea", "depression", "anxiety", 
                     "drowsiness", "appetite", "wellbeing", "shortness_of_breath"]
    },
    
    "cognitive_assessment": {
        "url": "https://www.oasis-brains.org/",
        "description": "MMSE/MoCA scores with cognitive outcomes",
        "license": "Public Domain",
        "samples": 3000,
        "features": ["mmse_score", "moca_score", "age", "education", "cognitive_decline"]
    },
    
    "medication_adherence": {
        "url": "https://physionet.org/content/medication-adherence/",
        "description": "MMAS-8 with treatment outcomes",
        "license": "PhysioNet Credentialed Health Data License",
        "samples": 2000,
        "features": ["mmas_score", "medications_count", "side_effects", "outcomes"]
    },
    
    "functional_status": {
        "url": "https://data.world/health/barthel-index",
        "description": "Barthel Index with ADL outcomes",
        "license": "Open Data Commons",
        "samples": 4000,
        "features": ["barthel_score", "age", "diagnosis", "independence_level"]
    },
    
    "caregiver_burden": {
        "url": "https://dataverse.harvard.edu/dataset.xhtml?persistentId=caregiver",
        "description": "Zarit Burden Interview with caregiver outcomes",
        "license": "CC0 1.0",
        "samples": 1500,
        "features": ["zarit_score", "caregiver_age", "relationship", "support_hours"]
    },
    
    "vital_signs": {
        "url": "https://mimic.mit.edu/",
        "description": "MIMIC-III vital signs with patient outcomes",
        "license": "PhysioNet Credentialed",
        "samples": 50000,
        "features": ["heart_rate", "blood_pressure_sys", "blood_pressure_dia", 
                     "oxygen_saturation", "temperature", "respiratory_rate"]
    },
    
    "mental_health": {
        "url": "https://www.nimh.nih.gov/research/research-conducted-at-nimh/datasets",
        "description": "PHQ-9 and GAD-7 scores with mental health outcomes",
        "license": "Public Domain",
        "samples": 8000,
        "features": ["phq9_score", "gad7_score", "age", "gender", "treatment_response"]
    },
    
    "admission_risk": {
        "url": "synthetic",
        "description": "Combined dataset for hospital admission risk prediction",
        "license": "Generated",
        "samples": 50000,
        "features": ["recent_ed_visits", "pps_score", "esas_total", "comorbidities_count",
                     "age", "social_support_score", "medications_count", "hospital_admission_7day"]
    }
}

# ========== SYNTHETIC DATA GENERATION ==========
# For features not available in public datasets
SYNTHETIC_DATA_CONFIG = {
    "enabled": True,
    "samples": 10000,
    "validation_split": 0.2,
    "test_split": 0.2,
    "random_seed": 42,
    
    # Clinical distributions based on literature
    "distributions": {
        "age": {"mean": 72, "std": 12, "min": 18, "max": 100},
        "pps_score": {"mean": 55, "std": 20, "min": 10, "max": 100},
        "esas_total": {"mean": 35, "std": 18, "min": 0, "max": 90},
        "phq9_score": {"mean": 12, "std": 7, "min": 0, "max": 27},
        "gad7_score": {"mean": 10, "std": 6, "min": 0, "max": 21},
        "barthel_score": {"mean": 65, "std": 25, "min": 0, "max": 100},
        "mmse_score": {"mean": 24, "std": 4, "min": 0, "max": 30},
        "zarit_score": {"mean": 32, "std": 15, "min": 0, "max": 88}
    }
}

# ========== MODEL CONFIGURATIONS ==========

# XGBoost Configuration
XGBOOST_CONFIG = {
    "n_estimators": 500,
    "max_depth": 6,
    "learning_rate": 0.05,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "gamma": 0.1,
    "min_child_weight": 3,
    "reg_alpha": 0.1,
    "reg_lambda": 1.0,
    "objective": "binary:logistic",  # or "reg:squarederror" for regression
    "eval_metric": "auc",
    "seed": 42,
    "tree_method": "hist",  # Faster training
    "predictor": "cpu_predictor"
}

# LightGBM Configuration
LIGHTGBM_CONFIG = {
    "n_estimators": 500,
    "max_depth": 6,
    "learning_rate": 0.05,
    "num_leaves": 31,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "min_child_samples": 20,
    "reg_alpha": 0.1,
    "reg_lambda": 1.0,
    "objective": "binary",
    "metric": "auc",
    "seed": 42,
    "verbose": -1
}

# Model Selection
SELECTED_MODEL = "xgboost"  # or "lightgbm"

# ========== FEATURE ENGINEERING ==========

# Feature groups for different prediction tasks
FEATURE_GROUPS = {
    "vital_risk": [
        "heart_rate", "blood_pressure_sys", "blood_pressure_dia",
        "oxygen_saturation", "temperature", "respiratory_rate",
        "age", "weight", "height", "bmi"
    ],
    
    "symptom_burden": [
        "esas_pain", "esas_tiredness", "esas_nausea", 
        "esas_depression", "esas_anxiety", "esas_drowsiness",
        "esas_appetite", "esas_wellbeing", "esas_shortness_of_breath",
        "age", "primary_diagnosis", "medications_count"
    ],
    
    "functional_decline": [
        "pps_score", "barthel_score", "ecog_score", "karnofsky_score",
        "age", "comorbidities_count", "recent_hospitalizations"
    ],
    
    "cognitive_impairment": [
        "mmse_score", "moca_score", "age", "education_years",
        "medications_affecting_cognition", "recent_delirium"
    ],
    
    "mental_health_risk": [
        "phq9_score", "gad7_score", "esas_depression", "esas_anxiety",
        "age", "social_support_score", "recent_life_events"
    ],
    
    "medication_risk": [
        "medications_count", "high_risk_medications", "drug_interactions",
        "mmas8_score", "age", "kidney_function", "liver_function"
    ],
    
    "caregiver_burden": [
        "zarit_score", "care_hours_per_week", "caregiver_age",
        "patient_functional_status", "financial_strain", "respite_care_access"
    ],
    
    "admission_risk": [
        "recent_ed_visits", "pps_score", "esas_total", "comorbidities_count",
        "age", "social_support_score", "medications_count"
    ]
}

# Target variables for each prediction task
TARGET_VARIABLES = {
    "vital_risk": "critical_vital_event_7day",
    "symptom_burden": "high_symptom_burden",
    "functional_decline": "significant_decline_30day",
    "cognitive_impairment": "cognitive_decline_detected",
    "mental_health_risk": "mental_health_intervention_needed",
    "medication_risk": "adverse_drug_event_30day",
    "caregiver_burden": "caregiver_burnout_risk",
    "admission_risk": "hospital_admission_7day"
}

# ========== SHAP CONFIGURATION ==========

SHAP_CONFIG = {
    "explainer_type": "tree",  # TreeExplainer for XGBoost/LightGBM
    "nsamples": 1000,  # Number of samples for approximate SHAP
    "feature_perturbation": "interventional",
    "link": "logit",  # or "identity" for regression
    
    # Top K features to display
    "top_k_features": 10,
    
    # Thresholds for feature importance
    "high_importance_threshold": 0.1,
    "medium_importance_threshold": 0.05,
    
    # Clinical interpretation mappings
    "feature_display_names": {
        "heart_rate": "Heart Rate (bpm)",
        "blood_pressure_sys": "Systolic BP (mmHg)",
        "blood_pressure_dia": "Diastolic BP (mmHg)",
        "oxygen_saturation": "O2 Saturation (%)",
        "temperature": "Temperature (°C)",
        "esas_pain": "Pain Score (ESAS)",
        "esas_tiredness": "Fatigue Score (ESAS)",
        "pps_score": "Palliative Performance (%)",
        "phq9_score": "Depression Severity (PHQ-9)",
        "gad7_score": "Anxiety Severity (GAD-7)",
        "barthel_score": "ADL Independence (Barthel)",
        "mmse_score": "Cognitive Function (MMSE)",
        "zarit_score": "Caregiver Burden (Zarit)"
    }
}

# ========== MEDICAL KNOWLEDGE BASE ==========

# Clinical thresholds (evidence-based)
CLINICAL_THRESHOLDS = {
    # Vital Signs
    "heart_rate": {"critical_low": 40, "warning_low": 50, "warning_high": 100, "critical_high": 120},
    "blood_pressure_sys": {"critical_low": 80, "warning_low": 90, "warning_high": 140, "critical_high": 180},
    "oxygen_saturation": {"critical_low": 88, "warning_low": 92, "normal": 95},
    "temperature": {"critical_low": 35.0, "warning_low": 36.0, "warning_high": 38.0, "critical_high": 39.5},
    
    # Assessments
    "esas_total": {"normal": 30, "warning": 40, "critical": 60},
    "pps_score": {"critical": 30, "warning": 50, "normal": 70},
    "phq9_score": {"mild": 5, "moderate": 10, "moderately_severe": 15, "severe": 20},
    "gad7_score": {"mild": 5, "moderate": 10, "severe": 15},
    "barthel_score": {"severe_dependence": 20, "moderate_dependence": 60, "mild_dependence": 80},
    "mmse_score": {"severe_impairment": 18, "mild_moderate": 24, "normal": 27},
    "moca_score": {"impaired": 26, "normal": 27},
    "zarit_score": {"mild_moderate": 21, "moderate_severe": 41, "severe": 61}
}

# Disease-specific risk factors
DISEASE_RISK_FACTORS = {
    "cancer": {
        "high_risk_features": ["esas_pain", "pps_score", "barthel_score", "recent_chemotherapy"],
        "monitoring_frequency": "daily",
        "critical_symptoms": ["esas_pain > 7", "pps_score < 40", "esas_nausea > 5"]
    },
    
    "heart_failure": {
        "high_risk_features": ["blood_pressure_sys", "heart_rate", "oxygen_saturation", "esas_shortness_of_breath"],
        "monitoring_frequency": "twice_daily",
        "critical_symptoms": ["oxygen_saturation < 90", "heart_rate > 110", "blood_pressure_sys < 90"]
    },
    
    "copd": {
        "high_risk_features": ["oxygen_saturation", "respiratory_rate", "esas_shortness_of_breath", "esas_tiredness"],
        "monitoring_frequency": "daily",
        "critical_symptoms": ["oxygen_saturation < 88", "respiratory_rate > 25"]
    },
    
    "dementia": {
        "high_risk_features": ["mmse_score", "moca_score", "barthel_score", "caregiver_burden"],
        "monitoring_frequency": "weekly",
        "critical_symptoms": ["mmse_score < 18", "barthel_score < 40", "zarit_score > 60"]
    },
    
    "end_stage_renal_disease": {
        "high_risk_features": ["blood_pressure_sys", "medications_count", "esas_nausea", "esas_tiredness"],
        "monitoring_frequency": "daily",
        "critical_symptoms": ["blood_pressure_sys > 160", "esas_nausea > 5"]
    }
}

# Medication-specific factors
MEDICATION_RISK_FACTORS = {
    "opioids": {
        "monitoring": ["esas_pain", "esas_nausea", "esas_drowsiness", "respiratory_rate"],
        "interactions": ["benzodiazepines", "muscle_relaxants"],
        "side_effects": ["constipation", "sedation", "respiratory_depression"]
    },
    
    "antidepressants": {
        "monitoring": ["phq9_score", "gad7_score", "blood_pressure"],
        "interactions": ["tramadol", "other_antidepressants"],
        "side_effects": ["serotonin_syndrome", "bleeding_risk", "hyponatremia"]
    },
    
    "anticoagulants": {
        "monitoring": ["bleeding_risk", "fall_risk", "drug_interactions"],
        "interactions": ["nsaids", "antibiotics", "antifungals"],
        "side_effects": ["bleeding", "bruising"]
    }
}

# ========== TRAINING CONFIGURATION ==========

TRAINING_CONFIG = {
    "batch_size": 1000,
    "validation_split": 0.2,
    "test_split": 0.1,
    "cross_validation_folds": 5,
    
    "early_stopping": {
        "enabled": True,
        "patience": 50,
        "min_delta": 0.001
    },
    
    "class_balancing": {
        "method": "smote",  # or "class_weight", "oversample", "undersample"
        "enabled": True
    },
    
    "feature_selection": {
        "enabled": True,
        "method": "shap_importance",
        "top_k_features": 30
    },
    
    "hyperparameter_tuning": {
        "enabled": False,  # Set to True for Optuna tuning
        "n_trials": 100,
        "timeout": 3600  # 1 hour
    }
}

# ========== EVALUATION METRICS ==========

EVALUATION_METRICS = [
    "accuracy",
    "precision",
    "recall",
    "f1_score",
    "roc_auc",
    "pr_auc",
    "specificity",
    "npv",  # Negative Predictive Value
    "confusion_matrix"
]

# ========== CLINICAL VALIDATION ==========

CLINICAL_VALIDATION_CONFIG = {
    "sensitivity_threshold": 0.85,  # Must detect 85%+ of high-risk cases
    "specificity_threshold": 0.70,  # 70%+ correct negative predictions
    "positive_predictive_value": 0.75,  # 75%+ of positive predictions correct
    
    "validation_cohorts": [
        "cancer_palliative",
        "heart_failure_advanced",
        "copd_severe",
        "dementia_advanced",
        "multi_morbidity"
    ]
}

# ========== MODEL DEPLOYMENT ==========

MODEL_DEPLOYMENT_CONFIG = {
    "model_registry": str(MODELS_DIR),
    "version_format": "v{major}.{minor}.{patch}",
    "auto_versioning": True,
    
    "performance_monitoring": {
        "enabled": True,
        "drift_detection": True,
        "retraining_threshold": 0.05  # Retrain if performance drops 5%
    },
    
    "a_b_testing": {
        "enabled": True,
        "traffic_split": 0.9  # 90% old model, 10% new model
    }
}

# ========== LOGGING ==========

LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "log_file": str(LOGS_DIR / "ml_training.log"),
    "log_predictions": True,
    "log_shap_values": True
}

# ========== API ENDPOINTS ==========

# External medical knowledge APIs
MEDICAL_APIS = {
    "pubmed": {
        "base_url": "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/",
        "api_key": os.getenv("PUBMED_API_KEY", ""),
        "rate_limit": 3  # requests per second
    },
    
    "rxnorm": {
        "base_url": "https://rxnav.nlm.nih.gov/REST/",
        "description": "Drug information and interactions"
    },
    
    "clinicaltrials": {
        "base_url": "https://clinicaltrials.gov/api/",
        "description": "Clinical trial data"
    }
}

# ========== EXPORT ==========

__all__ = [
    "DATA_DIR",
    "MODELS_DIR",
    "LOGS_DIR",
    "MEDICAL_KNOWLEDGE_DIR",
    "MEDICAL_DATA_SOURCES",
    "SYNTHETIC_DATA_CONFIG",
    "XGBOOST_CONFIG",
    "LIGHTGBM_CONFIG",
    "FEATURE_GROUPS",
    "TARGET_VARIABLES",
    "SHAP_CONFIG",
    "CLINICAL_THRESHOLDS",
    "DISEASE_RISK_FACTORS",
    "MEDICATION_RISK_FACTORS",
    "TRAINING_CONFIG",
    "EVALUATION_METRICS",
    "CLINICAL_VALIDATION_CONFIG",
    "MODEL_DEPLOYMENT_CONFIG"
]
