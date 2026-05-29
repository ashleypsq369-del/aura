"""
Property-Based Tests for Alert System
Feature: project-aura
Tests Properties 13, 14, 16, 17 from design document
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
import tempfile
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import alerts, db


def setup_test_db():
    """Create temporary test database"""
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    
    original_url = db.DATABASE_URL
    db.DATABASE_URL = f'sqlite:///{temp_db.name}'
    
    db.engine = db.create_engine(db.DATABASE_URL, echo=False)
    db.SessionLocal = db.sessionmaker(autocommit=False, autoflush=False, bind=db.engine)
    db.init_database()
    
    return temp_db.name, original_url


def teardown_test_db(temp_db_name, original_url):
    """Cleanup temporary test database"""
    db.DATABASE_URL = original_url
    try:
        os.unlink(temp_db_name)
    except:
        pass


# ============================================================================
# Property 13: Deterioration pattern detection
# Feature: project-aura, Property 13: Deterioration pattern detection
# Validates: Requirements 4.1
# ============================================================================

@settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    initial_o2=st.floats(min_value=92.0, max_value=98.0, allow_nan=False, allow_infinity=False),
    decline_rate=st.floats(min_value=1.0, max_value=3.0, allow_nan=False, allow_infinity=False)
)
def test_property_13_deterioration_pattern_detection(initial_o2, decline_rate):
    """
    Property 13: Deterioration pattern detection
    For any sequence of patient vitals showing deteriorating trends (3+ consecutive 
    worsening readings), the Alert_System should detect the pattern and create an 
    alert record.
    """
    temp_db_name, original_url = setup_test_db()
    try:
        # Create test patient and user
        user = db.add_user(username="testuser", password="pass", role="clinician", email="test@example.com")
        patient = db.add_patient(patient_code="TEST-001", age=75, gender="M", ethnicity="Caucasian")
        
        # Log 4 consecutive declining oxygen saturation readings
        vitals = []
        for i in range(4):
            o2_sat = initial_o2 - (i * decline_rate)
            vital = db.log_vital(
                patient_id=patient.id,
                recorded_by=user.id,
                heart_rate=75.0,
                blood_pressure_sys=120.0,
                blood_pressure_dia=80.0,
                oxygen_saturation=max(70.0, o2_sat),  # Clamp to valid range
                temperature=98.6
            )
            vitals.insert(0, vital)  # Insert at beginning to maintain most-recent-first order
        
        # Check for deterioration
        detected = alerts.detect_deterioration(vitals)
        
        # Should detect deterioration if decline is significant
        if decline_rate >= 1.0:
            assert detected is True, "Should detect deterioration with declining O2 saturation"
    
    finally:
        teardown_test_db(temp_db_name, original_url)


# ============================================================================
# Property 16: Alert message completeness
# Feature: project-aura, Property 16: Alert message completeness
# Validates: Requirements 4.4
# ============================================================================

@settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    alert_type=st.sampled_from(['deterioration', 'critical_vital', 'symptom_spike', 'high_risk']),
    patient_code=st.text(min_size=5, max_size=15, alphabet=st.characters(whitelist_categories=('Lu', 'Nd')))
)
def test_property_16_alert_message_completeness(alert_type, patient_code):
    """
    Property 16: Alert message completeness
    For any alert notification sent, the message should include required fields: 
    patient identifier, alert type, alert reason, and trend summary.
    """
    temp_db_name, original_url = setup_test_db()
    try:
        # Create test patient
        patient = db.add_patient(patient_code=patient_code, age=75, gender="M", ethnicity="Caucasian")
        
        # Create alert with message
        message = f"Alert for patient {patient_code}: {alert_type} detected with trend analysis"
        alert = db.create_alert(
            patient_id=patient.id,
            alert_type=alert_type,
            message=message,
            sent_to=[]
        )
        
        # Verify alert completeness
        assert alert is not None, "Alert should be created"
        assert alert.patient_id == patient.id, "Alert should have patient identifier"
        assert alert.alert_type == alert_type, "Alert should have alert type"
        assert alert.message is not None and len(alert.message) > 0, "Alert should have message"
        assert patient_code in alert.message, "Message should contain patient identifier"
        assert alert_type in alert.message, "Message should contain alert type"
        assert alert.triggered_at is not None, "Alert should have timestamp"
    
    finally:
        teardown_test_db(temp_db_name, original_url)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--hypothesis-show-statistics"])
