"""
Unit Tests for XAI Engine
Tests specific examples, edge cases, and model operations
"""

import pytest
import sys
import os
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import models


# ============================================================================
# Feature Engineering Tests
# ============================================================================

def test_engineer_features_basic():
    """Test basic feature engineering"""
    patient_data = {
        "pain_level": 5,
        "heart_rate": 75.0,
        "blood_pressure_sys": 120.0,
        "blood_pressure_dia": 80.0,
        "oxygen_saturation": 95.0,
        "temperature": 98.6,
        "fatigue": True,
        "nausea": False,
        "anxiety": True
    }
    
    features = models.engineer_features(patient_data)
    
    assert features.shape == (1, 10), "Should have 10 features"
    assert features[0][0] == 5, "Pain level should be 5"
    assert features[0][6] == 1, "Fatigue should be 1 (True)"
    assert features[0][7] == 0, "Nausea should be 0 (False)"


def test_engineer_features_with_defaults():
    """Test feature engineering with missing values"""
    patient_data = {
        "pain_level": 3
    }
    
    features = models.engineer_features(patient_data)
    
    assert features.shape == (1, 10)
    assert features[0][0] == 3
    assert features[0][1] == 75  # Default heart rate


def test_engineer_features_with_admission_date():
    """Test feature engineering with admission date"""
    from datetime import datetime, timedelta
    
    patient_data = {
        "pain_level": 5,
        "heart_rate": 80.0,
        "blood_pressure_sys": 125.0,
        "blood_pressure_dia": 82.0,
        "oxygen_saturation": 94.0,
        "temperature": 98.8,
        "fatigue": False,
        "nausea": False,
        "anxiety": False
    }
    
    admission_date = datetime.utcnow() - timedelta(days=7)
    features = models.engineer_features(patient_data, admission_date)
    
    assert features[0][9] == 7, "Days since admission should be 7"


# ============================================================================
# Model Loading Tests
# ============================================================================

def test_load_models():
    """Test loading pre-trained models"""
    pathway_model, risk_model, scaler, label_encoder = models.load_models()
    
    assert pathway_model is not None, "Pathway model should load"
    assert risk_model is not None, "Risk model should load"
    assert scaler is not None, "Scaler should load"
    assert label_encoder is not None, "Label encoder should load"


# ============================================================================
# Prediction Tests
# ============================================================================

def test_predict_care_pathway_stable():
    """Test care pathway prediction for stable patient"""
    patient_data = {
        "pain_level": 2,
        "heart_rate": 70.0,
        "blood_pressure_sys": 120.0,
        "blood_pressure_dia": 80.0,
        "oxygen_saturation": 97.0,
        "temperature": 98.6,
        "fatigue": False,
        "nausea": False,
        "anxiety": False
    }
    
    pathway = models.predict_care_pathway(patient_data)
    
    assert pathway in models.CARE_PATHWAYS
    assert isinstance(pathway, str)


def test_predict_care_pathway_crisis():
    """Test care pathway prediction for crisis patient"""
    patient_data = {
        "pain_level": 9,
        "heart_rate": 130.0,
        "blood_pressure_sys": 90.0,
        "blood_pressure_dia": 55.0,
        "oxygen_saturation": 82.0,
        "temperature": 101.0,
        "fatigue": True,
        "nausea": True,
        "anxiety": True
    }
    
    pathway = models.predict_care_pathway(patient_data)
    
    assert pathway in models.CARE_PATHWAYS


def test_predict_risk_score_stable():
    """Test risk score prediction for stable patient"""
    patient_data = {
        "pain_level": 1,
        "heart_rate": 68.0,
        "blood_pressure_sys": 118.0,
        "blood_pressure_dia": 78.0,
        "oxygen_saturation": 98.0,
        "temperature": 98.4,
        "fatigue": False,
        "nausea": False,
        "anxiety": False
    }
    
    risk_score = models.predict_risk_score(patient_data)
    
    assert 0.0 <= risk_score <= 1.0
    assert isinstance(risk_score, (int, float))


def test_predict_risk_score_crisis():
    """Test risk score prediction for crisis patient"""
    patient_data = {
        "pain_level": 10,
        "heart_rate": 140.0,
        "blood_pressure_sys": 85.0,
        "blood_pressure_dia": 50.0,
        "oxygen_saturation": 80.0,
        "temperature": 102.0,
        "fatigue": True,
        "nausea": True,
        "anxiety": True
    }
    
    risk_score = models.predict_risk_score(patient_data)
    
    assert 0.0 <= risk_score <= 1.0
    # Crisis patient should have higher risk
    assert risk_score > 0.3


def test_risk_score_clamping():
    """Test that risk scores are clamped to valid range"""
    # Test with extreme values
    patient_data = {
        "pain_level": 10,
        "heart_rate": 180.0,
        "blood_pressure_sys": 200.0,
        "blood_pressure_dia": 130.0,
        "oxygen_saturation": 70.0,
        "temperature": 105.0,
        "fatigue": True,
        "nausea": True,
        "anxiety": True
    }
    
    risk_score = models.predict_risk_score(patient_data)
    
    # Should be clamped to [0, 1]
    assert 0.0 <= risk_score <= 1.0


# ============================================================================
# SHAP Explanation Tests
# ============================================================================

def test_explain_prediction_structure():
    """Test SHAP explanation structure"""
    patient_data = {
        "pain_level": 5,
        "heart_rate": 85.0,
        "blood_pressure_sys": 115.0,
        "blood_pressure_dia": 75.0,
        "oxygen_saturation": 92.0,
        "temperature": 99.0,
        "fatigue": True,
        "nausea": False,
        "anxiety": True
    }
    
    explanation = models.explain_prediction(patient_data)
    
    assert "pathway_shap_values" in explanation
    assert "risk_shap_values" in explanation
    assert "pathway_base_value" in explanation
    assert "risk_base_value" in explanation
    assert "features" in explanation
    assert "feature_names" in explanation


def test_explain_prediction_feature_count():
    """Test that SHAP explanation has correct number of features"""
    patient_data = {
        "pain_level": 4,
        "heart_rate": 78.0,
        "blood_pressure_sys": 122.0,
        "blood_pressure_dia": 81.0,
        "oxygen_saturation": 95.0,
        "temperature": 98.7,
        "fatigue": False,
        "nausea": True,
        "anxiety": False
    }
    
    explanation = models.explain_prediction(patient_data)
    
    assert len(explanation["features"]) == len(models.FEATURE_NAMES)
    assert len(explanation["feature_names"]) == len(models.FEATURE_NAMES)


# ============================================================================
# Training Data Generation Tests
# ============================================================================

def test_generate_training_data():
    """Test synthetic training data generation"""
    n_samples = 100
    data = models.generate_training_data(n_samples)
    
    assert len(data) == n_samples
    assert "care_pathway" in data.columns
    assert "risk_score" in data.columns
    
    # Verify all features are present
    for feature in models.FEATURE_NAMES:
        assert feature in data.columns, f"Missing feature: {feature}"


def test_generate_training_data_care_pathways():
    """Test that generated data has valid care pathways"""
    data = models.generate_training_data(50)
    
    unique_pathways = data["care_pathway"].unique()
    
    for pathway in unique_pathways:
        assert pathway in models.CARE_PATHWAYS


def test_generate_training_data_risk_scores():
    """Test that generated data has valid risk scores"""
    data = models.generate_training_data(50)
    
    assert (data["risk_score"] >= 0.0).all()
    assert (data["risk_score"] <= 1.0).all()


# ============================================================================
# Edge Case Tests
# ============================================================================

def test_prediction_with_extreme_pain():
    """Test prediction with maximum pain level"""
    patient_data = {
        "pain_level": 10,
        "heart_rate": 75.0,
        "blood_pressure_sys": 120.0,
        "blood_pressure_dia": 80.0,
        "oxygen_saturation": 95.0,
        "temperature": 98.6,
        "fatigue": False,
        "nausea": False,
        "anxiety": False
    }
    
    pathway = models.predict_care_pathway(patient_data)
    risk_score = models.predict_risk_score(patient_data)
    
    assert pathway in models.CARE_PATHWAYS
    assert 0.0 <= risk_score <= 1.0


def test_prediction_with_no_pain():
    """Test prediction with zero pain level"""
    patient_data = {
        "pain_level": 0,
        "heart_rate": 70.0,
        "blood_pressure_sys": 118.0,
        "blood_pressure_dia": 78.0,
        "oxygen_saturation": 98.0,
        "temperature": 98.4,
        "fatigue": False,
        "nausea": False,
        "anxiety": False
    }
    
    pathway = models.predict_care_pathway(patient_data)
    risk_score = models.predict_risk_score(patient_data)
    
    assert pathway in models.CARE_PATHWAYS
    assert 0.0 <= risk_score <= 1.0


def test_prediction_with_all_symptoms():
    """Test prediction with all symptoms present"""
    patient_data = {
        "pain_level": 7,
        "heart_rate": 95.0,
        "blood_pressure_sys": 105.0,
        "blood_pressure_dia": 65.0,
        "oxygen_saturation": 88.0,
        "temperature": 100.0,
        "fatigue": True,
        "nausea": True,
        "anxiety": True
    }
    
    pathway = models.predict_care_pathway(patient_data)
    risk_score = models.predict_risk_score(patient_data)
    
    assert pathway in models.CARE_PATHWAYS
    assert 0.0 <= risk_score <= 1.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
