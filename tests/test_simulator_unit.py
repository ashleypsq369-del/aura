"""
Unit Tests for Synthetic Data Generator
Tests specific examples, edge cases, and SDV integration
"""

import pytest
import tempfile
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import simulator, db


@pytest.fixture(scope='function')
def test_db():
    """Create temporary test database"""
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    
    original_url = db.DATABASE_URL
    db.DATABASE_URL = f'sqlite:///{temp_db.name}'
    
    db.engine = db.create_engine(db.DATABASE_URL, echo=False)
    db.SessionLocal = db.sessionmaker(autocommit=False, autoflush=False, bind=db.engine)
    db.init_database()
    
    yield
    
    db.DATABASE_URL = original_url
    try:
        os.unlink(temp_db.name)
    except:
        pass


# ============================================================================
# SDV Data Generation Tests
# ============================================================================

def test_generate_synthetic_cohort_basic():
    """Test basic synthetic cohort generation"""
    n_patients = 10
    patients = simulator.generate_synthetic_cohort(n_patients)
    
    assert len(patients) == n_patients
    assert all('patient_code' in p for p in patients)
    assert all('age' in p for p in patients)
    assert all('gender' in p for p in patients)
    assert all('ethnicity' in p for p in patients)


def test_generate_synthetic_cohort_unique_codes():
    """Test that patient codes are unique"""
    patients = simulator.generate_synthetic_cohort(50)
    
    codes = [p['patient_code'] for p in patients]
    assert len(codes) == len(set(codes)), "Duplicate patient codes found"


def test_diversity_constraint_enforcement():
    """Test that diversity constraints are approximately enforced"""
    n_patients = 200
    patients = simulator.generate_synthetic_cohort(n_patients)
    
    # Count ethnicities
    ethnicity_counts = {}
    for p in patients:
        eth = p['ethnicity']
        ethnicity_counts[eth] = ethnicity_counts.get(eth, 0) + 1
    
    # Verify all expected ethnicities are present
    expected_ethnicities = ['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other']
    for eth in expected_ethnicities:
        assert eth in ethnicity_counts, f"Missing ethnicity: {eth}"
    
    # Verify reasonable distribution (within 20% of expected)
    for eth, expected_pct in simulator.ETHNICITY_DISTRIBUTION.items():
        actual_pct = ethnicity_counts[eth] / n_patients
        assert abs(actual_pct - expected_pct) < 0.20, \
            f"Ethnicity {eth}: expected ~{expected_pct*100}%, got {actual_pct*100:.1f}%"


def test_data_schema_compliance():
    """Test that generated data complies with expected schema"""
    patients = simulator.generate_synthetic_cohort(20)
    
    for patient in patients:
        # Check data types
        assert isinstance(patient['patient_code'], str)
        assert isinstance(patient['age'], int)
        assert isinstance(patient['gender'], str)
        assert isinstance(patient['ethnicity'], str)
        
        # Check value ranges
        assert 45 <= patient['age'] <= 95
        assert patient['gender'] in ['M', 'F', 'Other']
        assert patient['ethnicity'] in ['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other']


# ============================================================================
# Vital Generation Tests
# ============================================================================

def test_vital_generation_stable_stage():
    """Test vital generation for stable stage"""
    vital = simulator.generate_vital_reading('stable')
    
    assert 60 <= vital['heart_rate'] <= 90
    assert 110 <= vital['blood_pressure_sys'] <= 140
    assert 70 <= vital['blood_pressure_dia'] <= 90
    assert 92 <= vital['oxygen_saturation'] <= 98
    assert 97.5 <= vital['temperature'] <= 99.0


def test_vital_generation_deterioration_stage():
    """Test vital generation for deterioration stage"""
    vital = simulator.generate_vital_reading('deterioration')
    
    assert 85 <= vital['heart_rate'] <= 115
    assert 95 <= vital['blood_pressure_sys'] <= 125
    assert 60 <= vital['blood_pressure_dia'] <= 85
    assert 88 <= vital['oxygen_saturation'] <= 94
    assert 97.0 <= vital['temperature'] <= 100.5


def test_vital_generation_crisis_stage():
    """Test vital generation for crisis stage"""
    vital = simulator.generate_vital_reading('crisis')
    
    assert 100 <= vital['heart_rate'] <= 140
    assert 80 <= vital['blood_pressure_sys'] <= 110
    assert 50 <= vital['blood_pressure_dia'] <= 75
    assert 80 <= vital['oxygen_saturation'] <= 90
    assert 96.0 <= vital['temperature'] <= 101.5


# ============================================================================
# Symptom Generation Tests
# ============================================================================

def test_symptom_generation_stable_stage():
    """Test symptom generation for stable stage"""
    symptom = simulator.generate_symptom_log('stable')
    
    assert 0 <= symptom['pain_level'] <= 4
    assert isinstance(symptom['nausea'], bool)
    assert isinstance(symptom['fatigue'], bool)
    assert isinstance(symptom['anxiety'], bool)
    assert isinstance(symptom['notes'], str)


def test_symptom_generation_deterioration_stage():
    """Test symptom generation for deterioration stage"""
    symptom = simulator.generate_symptom_log('deterioration')
    
    assert 3 <= symptom['pain_level'] <= 7


def test_symptom_generation_crisis_stage():
    """Test symptom generation for crisis stage"""
    symptom = simulator.generate_symptom_log('crisis')
    
    assert 6 <= symptom['pain_level'] <= 10


# ============================================================================
# Journey Simulation Tests
# ============================================================================

def test_simulate_deterioration(test_db):
    """Test deterioration simulation"""
    user = db.add_user(username="testuser", password="pass", role="clinician", email="test@example.com")
    patient = db.add_patient(patient_code="TEST-001", age=75, gender="M", ethnicity="Caucasian")
    
    logs = simulator.simulate_deterioration(patient.id, user.id)
    
    # Should generate 4 readings (4 vitals + 4 symptoms = 8 logs)
    assert len(logs) == 8
    
    # Verify progression
    vital_logs = [log for log in logs if log['type'] == 'vital']
    assert len(vital_logs) == 4
    
    # Verify worsening trend
    heart_rates = [log['record'].heart_rate for log in vital_logs]
    assert heart_rates[0] < heart_rates[-1], "Heart rate should increase"


def test_simulate_death_event(test_db):
    """Test death event simulation"""
    patient = db.add_patient(patient_code="TEST-002", age=80, gender="F", ethnicity="Asian")
    
    success = simulator.simulate_death_event(patient.id)
    assert success is True
    
    # Verify patient status updated
    updated_patient = db.get_patient(patient.id)
    assert updated_patient.status == 'deceased'
    assert updated_patient.death_date is not None


def test_validate_system_response(test_db):
    """Test system response validation"""
    user = db.add_user(username="testuser2", password="pass", role="clinician", email="test2@example.com")
    patient = db.add_patient(patient_code="TEST-003", age=78, gender="M", ethnicity="Hispanic")
    
    # Log some data
    db.log_vital(patient.id, user.id, 75.0, 120.0, 80.0, 98.0, 98.6)
    db.log_symptom(patient.id, user.id, 5, False, True, False, "Test")
    
    # Create an alert
    db.create_alert(patient.id, "deterioration", "Test alert", [user.id])
    
    # Update to deceased
    db.update_patient_status(patient.id, 'deceased')
    
    # Validate
    results = simulator.validate_system_response(patient.id)
    
    assert results['alerts_created'] is True
    assert results['bereavement_activated'] is True
    assert results['data_logged'] is True
    assert results['alert_count'] > 0
    assert results['vitals_count'] > 0
    assert results['symptoms_count'] > 0


# ============================================================================
# Report Generation Tests
# ============================================================================

def test_generate_simulation_report():
    """Test simulation report generation"""
    journey_logs = [
        {
            'patient_code': 'SYN-00001',
            'vitals_logged': 20,
            'symptoms_logged': 20,
            'stages': [{'stage': 'stable'}, {'stage': 'deterioration'}]
        }
    ]
    
    validation_results = [
        {
            'alerts_created': True,
            'bereavement_activated': True,
            'data_logged': True,
            'alert_count': 3
        }
    ]
    
    report = simulator.generate_simulation_report(journey_logs, validation_results)
    
    assert 'PROJECT AURA' in report
    assert 'SIMULATION REPORT' in report
    assert 'SYN-00001' in report
    assert 'Vitals Logged: 20' in report


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
