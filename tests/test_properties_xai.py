"""
Property-Based Tests for XAI Engine
Feature: project-aura
Tests Properties 1 and 2 from design document
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import models


# ============================================================================
# Custom Hypothesis Strategies
# ============================================================================

@st.composite
def patient_data_strategy(draw):
    """Generate random patient data for XAI testing"""
    return {
        "pain_level": draw(st.integers(min_value=0, max_value=10)),
        "heart_rate": draw(st.floats(min_value=40.0, max_value=180.0, allow_nan=False, allow_infinity=False)),
        "blood_pressure_sys": draw(st.floats(min_value=70.0, max_value=200.0, allow_nan=False, allow_infinity=False)),
        "blood_pressure_dia": draw(st.floats(min_value=40.0, max_value=130.0, allow_nan=False, allow_infinity=False)),
        "oxygen_saturation": draw(st.floats(min_value=70.0, max_value=100.0, allow_nan=False, allow_infinity=False)),
        "temperature": draw(st.floats(min_value=95.0, max_value=105.0, allow_nan=False, allow_infinity=False)),
        "fatigue": draw(st.booleans()),
        "nausea": draw(st.booleans()),
        "anxiety": draw(st.booleans())
    }


# ============================================================================
# Property 1: Care pathway generation completeness
# Feature: project-aura, Property 1: Care pathway generation completeness
# Validates: Requirements 1.1, 1.5
# ============================================================================

@settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(patient_data=patient_data_strategy())
def test_property_1_care_pathway_generation_completeness(patient_data):
    """
    Property 1: Care pathway generation completeness
    For any valid patient data input (vitals, symptoms, pain levels), the XAI_Engine 
    should generate both a care pathway recommendation from the defined set and a 
    deterioration risk score between 0.0 and 1.0.
    """
    # Predict care pathway
    care_pathway = models.predict_care_pathway(patient_data)
    
    # Verify care pathway is from defined set
    assert care_pathway in models.CARE_PATHWAYS, \
        f"Invalid care pathway: {care_pathway}. Must be one of {models.CARE_PATHWAYS}"
    
    # Predict risk score
    risk_score = models.predict_risk_score(patient_data)
    
    # Verify risk score is in valid range
    assert isinstance(risk_score, (int, float)), "Risk score must be numeric"
    assert 0.0 <= risk_score <= 1.0, \
        f"Risk score {risk_score} out of range [0.0, 1.0]"


# ============================================================================
# Property 2: SHAP explanation presence
# Feature: project-aura, Property 2: SHAP explanation presence
# Validates: Requirements 1.2
# ============================================================================

@settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(patient_data=patient_data_strategy())
def test_property_2_shap_explanation_presence(patient_data):
    """
    Property 2: SHAP explanation presence
    For any prediction made by the XAI_Engine, SHAP-based explanations should be 
    generated containing feature importance values for all input features used in 
    the prediction.
    """
    # Generate explanation
    explanation = models.explain_prediction(patient_data)
    
    # Verify explanation is not empty
    assert explanation, "Explanation dictionary should not be empty"
    
    # Verify SHAP values are present
    assert "pathway_shap_values" in explanation, "Missing pathway SHAP values"
    assert "risk_shap_values" in explanation, "Missing risk SHAP values"
    
    # Verify base values are present
    assert "pathway_base_value" in explanation, "Missing pathway base value"
    assert "risk_base_value" in explanation, "Missing risk base value"
    
    # Verify features and feature names are present
    assert "features" in explanation, "Missing features"
    assert "feature_names" in explanation, "Missing feature names"
    
    # Verify SHAP values have correct dimensionality
    pathway_shap = explanation["pathway_shap_values"]
    risk_shap = explanation["risk_shap_values"]
    
    assert pathway_shap is not None, "Pathway SHAP values should not be None"
    assert risk_shap is not None, "Risk SHAP values should not be None"
    
    # Verify feature names match expected features
    assert explanation["feature_names"] == models.FEATURE_NAMES, \
        "Feature names don't match expected features"
    
    # Verify number of features matches
    assert len(explanation["features"]) == len(models.FEATURE_NAMES), \
        f"Expected {len(models.FEATURE_NAMES)} features, got {len(explanation['features'])}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--hypothesis-show-statistics"])
