"""
XAI Engine for Project Aura
Implements explainable ML models using XGBoost and SHAP
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple, List
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

# ML imports
try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.metrics import accuracy_score, mean_squared_error, classification_report
    import shap
except ImportError:
    print("Warning: ML libraries not installed. Install requirements.txt")

# Model paths
MODEL_DIR = "models"
PATHWAY_MODEL_PATH = os.path.join(MODEL_DIR, "care_pathway_model.joblib")
RISK_MODEL_PATH = os.path.join(MODEL_DIR, "risk_score_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "feature_scaler.joblib")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.joblib")

# Care pathway options
CARE_PATHWAYS = ["comfort_care", "symptom_management", "intensive_monitoring", "crisis_intervention"]

# Feature names
FEATURE_NAMES = [
    "pain_level", "heart_rate", "blood_pressure_sys", "blood_pressure_dia",
    "oxygen_saturation", "temperature", "fatigue", "nausea", "anxiety", "days_since_admission"
]


def engineer_features(patient_data: Dict[str, Any], admission_date: Optional[Any] = None) -> np.ndarray:
    """
    Engineer features from patient data
    
    Args:
        patient_data: Dictionary with patient vitals and symptoms
        admission_date: Patient admission date for calculating days since admission
        
    Returns:
        Feature array
    """
    from datetime import datetime
    
    features = []
    
    # Symptoms
    features.append(patient_data.get("pain_level", 0))
    
    # Vitals
    features.append(patient_data.get("heart_rate", 75))
    features.append(patient_data.get("blood_pressure_sys", 120))
    features.append(patient_data.get("blood_pressure_dia", 80))
    features.append(patient_data.get("oxygen_saturation", 95))
    features.append(patient_data.get("temperature", 98.6))
    
    # Boolean symptoms (convert to int)
    features.append(int(patient_data.get("fatigue", False)))
    features.append(int(patient_data.get("nausea", False)))
    features.append(int(patient_data.get("anxiety", False)))
    
    # Days since admission
    if admission_date:
        days = (datetime.utcnow() - admission_date).days
        features.append(days)
    else:
        features.append(0)
    
    return np.array(features).reshape(1, -1)


def train_models(training_data: pd.DataFrame) -> Dict[str, Any]:
    """
    Train XGBoost models on synthetic data
    
    Args:
        training_data: DataFrame with features and targets
        
    Returns:
        Dictionary with training results
    """
    print("Training XAI models...")
    
    # Ensure model directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Prepare features
    X = training_data[FEATURE_NAMES].values
    
    # Prepare targets
    y_pathway = training_data["care_pathway"].values
    y_risk = training_data["risk_score"].values
    
    # Encode care pathways
    label_encoder = LabelEncoder()
    y_pathway_encoded = label_encoder.fit_transform(y_pathway)
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split data
    X_train, X_test, y_path_train, y_path_test, y_risk_train, y_risk_test = train_test_split(
        X_scaled, y_pathway_encoded, y_risk, test_size=0.2, random_state=42
    )
    
    # Train care pathway classifier
    print("Training care pathway classifier...")
    pathway_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    pathway_model.fit(X_train, y_path_train)
    
    # Train risk score regressor
    print("Training risk score regressor...")
    risk_model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    risk_model.fit(X_train, y_risk_train)
    
    # Evaluate models
    y_path_pred = pathway_model.predict(X_test)
    y_risk_pred = risk_model.predict(X_test)
    
    pathway_accuracy = accuracy_score(y_path_test, y_path_pred)
    risk_mse = mean_squared_error(y_risk_test, y_risk_pred)
    
    print(f"Care Pathway Accuracy: {pathway_accuracy:.3f}")
    print(f"Risk Score MSE: {risk_mse:.3f}")
    
    # Save models
    joblib.dump(pathway_model, PATHWAY_MODEL_PATH)
    joblib.dump(risk_model, RISK_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)
    
    print("Models saved successfully")
    
    return {
        "pathway_accuracy": pathway_accuracy,
        "risk_mse": risk_mse,
        "pathway_model": pathway_model,
        "risk_model": risk_model,
        "scaler": scaler,
        "label_encoder": label_encoder
    }


def load_models() -> Tuple[Any, Any, Any, Any]:
    """
    Load pre-trained models from disk
    
    Returns:
        Tuple of (pathway_model, risk_model, scaler, label_encoder)
    """
    try:
        pathway_model = joblib.load(PATHWAY_MODEL_PATH)
        risk_model = joblib.load(RISK_MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        return pathway_model, risk_model, scaler, label_encoder
    except FileNotFoundError:
        print("Models not found. Please train models first.")
        return None, None, None, None


def predict_care_pathway(patient_data: Dict[str, Any], admission_date: Optional[Any] = None) -> str:
    """
    Predict care pathway for patient
    
    Args:
        patient_data: Dictionary with patient vitals and symptoms
        admission_date: Patient admission date
        
    Returns:
        Care pathway string
    """
    pathway_model, _, scaler, label_encoder = load_models()
    
    if pathway_model is None:
        return "comfort_care"  # Default fallback
    
    # Engineer features
    features = engineer_features(patient_data, admission_date)
    features_scaled = scaler.transform(features)
    
    # Predict
    prediction = pathway_model.predict(features_scaled)[0]
    care_pathway = label_encoder.inverse_transform([prediction])[0]
    
    return care_pathway


def predict_risk_score(patient_data: Dict[str, Any], admission_date: Optional[Any] = None) -> float:
    """
    Predict deterioration risk score
    
    Args:
        patient_data: Dictionary with patient vitals and symptoms
        admission_date: Patient admission date
        
    Returns:
        Risk score (0.0-1.0)
    """
    _, risk_model, scaler, _ = load_models()
    
    if risk_model is None:
        return 0.5  # Default fallback
    
    # Engineer features
    features = engineer_features(patient_data, admission_date)
    features_scaled = scaler.transform(features)
    
    # Predict
    risk_score = risk_model.predict(features_scaled)[0]
    
    # Clamp to valid range
    risk_score = max(0.0, min(1.0, risk_score))
    
    return risk_score


def explain_prediction(patient_data: Dict[str, Any], admission_date: Optional[Any] = None) -> Dict[str, Any]:
    """
    Generate SHAP values for prediction
    
    Args:
        patient_data: Dictionary with patient vitals and symptoms
        admission_date: Patient admission date
        
    Returns:
        Dictionary with SHAP values and explanations
    """
    pathway_model, risk_model, scaler, _ = load_models()
    
    if pathway_model is None or risk_model is None:
        return {}
    
    # Engineer features
    features = engineer_features(patient_data, admission_date)
    features_scaled = scaler.transform(features)
    
    # Create SHAP explainers
    pathway_explainer = shap.TreeExplainer(pathway_model)
    risk_explainer = shap.TreeExplainer(risk_model)
    
    # Calculate SHAP values
    pathway_shap_values = pathway_explainer.shap_values(features_scaled)
    risk_shap_values = risk_explainer.shap_values(features_scaled)
    
    # Get base values
    pathway_base_value = pathway_explainer.expected_value
    risk_base_value = risk_explainer.expected_value
    
    explanation = {
        "pathway_shap_values": pathway_shap_values,
        "risk_shap_values": risk_shap_values,
        "pathway_base_value": pathway_base_value,
        "risk_base_value": risk_base_value,
        "features": features_scaled[0],
        "feature_names": FEATURE_NAMES
    }
    
    return explanation


def plot_shap_summary(shap_values: np.ndarray, features: np.ndarray, 
                     feature_names: List[str], save_path: Optional[str] = None):
    """
    Create SHAP summary plot
    
    Args:
        shap_values: SHAP values array
        features: Feature values array
        feature_names: List of feature names
        save_path: Optional path to save plot
    """
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, features, feature_names=feature_names, show=False)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches="tight")
    
    return plt.gcf()


def plot_shap_waterfall(explanation: Dict[str, Any], prediction_type: str = "risk",
                       save_path: Optional[str] = None):
    """
    Create SHAP waterfall plot for single prediction
    
    Args:
        explanation: Explanation dictionary from explain_prediction
        prediction_type: "risk" or "pathway"
        save_path: Optional path to save plot
    """
    if prediction_type == "risk":
        shap_values = explanation["risk_shap_values"]
        base_value = explanation["risk_base_value"]
    else:
        shap_values = explanation["pathway_shap_values"]
        base_value = explanation["pathway_base_value"]
    
    features = explanation["features"]
    feature_names = explanation["feature_names"]
    
    # Create explanation object for waterfall plot
    if isinstance(shap_values, list):
        shap_values = shap_values[0]
    
    exp = shap.Explanation(
        values=shap_values[0] if len(shap_values.shape) > 1 else shap_values,
        base_values=base_value if isinstance(base_value, float) else base_value[0],
        data=features,
        feature_names=feature_names
    )
    
    plt.figure(figsize=(10, 6))
    shap.waterfall_plot(exp, show=False)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches="tight")
    
    return plt.gcf()


def generate_training_data(n_samples: int = 1000) -> pd.DataFrame:
    """
    Generate synthetic training data
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        DataFrame with training data
    """
    from src.simulator import generate_vital_reading, generate_symptom_log
    import random
    
    data = []
    
    for i in range(n_samples):
        # Randomly select stage
        stage = random.choice(["stable", "deterioration", "crisis"])
        
        # Generate vitals and symptoms
        vital = generate_vital_reading(stage)
        symptom = generate_symptom_log(stage)
        
        # Assign care pathway based on stage
        if stage == "stable":
            care_pathway = random.choice(["comfort_care", "symptom_management"])
            risk_score = random.uniform(0.0, 0.3)
        elif stage == "deterioration":
            care_pathway = random.choice(["symptom_management", "intensive_monitoring"])
            risk_score = random.uniform(0.3, 0.7)
        else:  # crisis
            care_pathway = random.choice(["intensive_monitoring", "crisis_intervention"])
            risk_score = random.uniform(0.7, 1.0)
        
        # Combine into record
        record = {
            **vital,
            **symptom,
            "days_since_admission": random.randint(0, 30),
            "care_pathway": care_pathway,
            "risk_score": risk_score
        }
        
        data.append(record)
    
    return pd.DataFrame(data)
