"""
Integration Tests for Project Aura
Tests end-to-end workflows across all four pillars
"""

import pytest
import tempfile
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import db, simulator, models, alerts


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
# Integration Test 1: Complete Patient Journey
# ============================================================================

def test_complete_patient_journey(test_db):
    """
    Test complete patient journey from admission to bereavement
    Validates integration of all four pillars
    """
    print("\n=== Integration Test: Complete Patient Journey ===")
    
    # Create clinician user
    clinician = db.add_user(
        username="dr_smith",
        password="secure123",
        role="clinician",
        email="dr.smith@hospital.com"
    )
    assert clinician is not None, "Failed to create clinician"
    print(f"✓ Created clinician: {clinician.username}")
    
    # Create family user
    family = db.add_user(
        username="john_doe",
        password="family123",
        role="family",
        email="john.doe@email.com"
    )
    assert family is not None, "Failed to create family user"
    print(f"✓ Created family user: {family.username}")
    
    # Generate synthetic patient (Pillar 4)
    patients = simulator.generate_synthetic_cohort(1)
    patient_data = patients[0]
    
    patient = db.add_patient(
        patient_code=patient_data['patient_code'],
        age=patient_data['age'],
        gender=patient_data['gender'],
        ethnicity=patient_data['ethnicity']
    )
    assert patient is not None, "Failed to create patient"
    print(f"✓ Created patient: {patient.patient_code} (age {patient.age}, {patient.gender}, {patient.ethnicity})")
    
    # Stage 1: Log stable vitals and symptoms
    print("\n--- Stage 1: Stable Monitoring ---")
    for day in range(3):
        vital_data = simulator.generate_vital_reading('stable')
        vital = db.log_vital(
            patient_id=patient.id,
            recorded_by=clinician.id,
            **vital_data
        )
        assert vital is not None
        
        symptom_data = simulator.generate_symptom_log('stable')
        symptom = db.log_symptom(
            patient_id=patient.id,
            recorded_by=family.id,
            **symptom_data
        )
        assert symptom is not None
    
    print(f"✓ Logged 3 days of stable vitals and symptoms")
    
    # Verify data retrieval
    history = db.get_patient_history(patient.id)
    assert len(history['vitals']) == 3
    assert len(history['symptoms']) == 3
    print(f"✓ Retrieved patient history: {len(history['vitals'])} vitals, {len(history['symptoms'])} symptoms")
    
    # Stage 2: Generate AI predictions (Pillar 1)
    print("\n--- Stage 2: AI Predictions ---")
    latest_vital = history['vitals'][0]
    latest_symptom = history['symptoms'][0]
    
    patient_data_for_ai = {
        'heart_rate': latest_vital.heart_rate,
        'blood_pressure_sys': latest_vital.blood_pressure_sys,
        'blood_pressure_dia': latest_vital.blood_pressure_dia,
        'oxygen_saturation': latest_vital.oxygen_saturation,
        'temperature': latest_vital.temperature,
        'pain_level': latest_symptom.pain_level,
        'nausea': latest_symptom.nausea,
        'fatigue': latest_symptom.fatigue,
        'anxiety': latest_symptom.anxiety
    }
    
    care_pathway = models.predict_care_pathway(patient_data_for_ai, patient.admission_date)
    assert care_pathway in models.CARE_PATHWAYS
    print(f"✓ Predicted care pathway: {care_pathway}")
    
    risk_score = models.predict_risk_score(patient_data_for_ai, patient.admission_date)
    assert 0.0 <= risk_score <= 1.0
    print(f"✓ Predicted risk score: {risk_score:.3f}")
    
    # Generate SHAP explanation
    explanation = models.explain_prediction(patient_data_for_ai, patient.admission_date)
    assert 'pathway_shap_values' in explanation
    assert 'risk_shap_values' in explanation
    print(f"✓ Generated SHAP explanations")
    
    # Save prediction to database
    prediction = db.save_prediction(
        patient_id=patient.id,
        care_pathway=care_pathway,
        risk_score=risk_score,
        model_version="1.0"
    )
    assert prediction is not None
    print(f"✓ Saved prediction to database")
    
    # Stage 3: Simulate deterioration and trigger alerts (Pillar 3)
    print("\n--- Stage 3: Deterioration & Alerts ---")
    deterioration_logs = simulator.simulate_deterioration(patient.id, clinician.id)
    assert len(deterioration_logs) > 0
    print(f"✓ Simulated deterioration: {len(deterioration_logs)} logs")
    
    # Check if alerts would be triggered
    recent_vitals = db.get_recent_vitals(patient.id, hours=24)
    recent_symptoms = db.get_recent_symptoms(patient.id, hours=24)
    
    deterioration_detected = alerts.detect_deterioration(recent_vitals)
    print(f"✓ Deterioration detection: {deterioration_detected}")
    
    pain_spike = alerts.detect_pain_spike(recent_symptoms)
    print(f"✓ Pain spike detection: {pain_spike}")
    
    # Create manual alert
    alert = db.create_alert(
        patient_id=patient.id,
        alert_type='deterioration',
        message='Test deterioration alert',
        sent_to=[clinician.id, family.id]
    )
    assert alert is not None
    print(f"✓ Created alert: {alert.alert_type}")
    
    # Stage 4: Death event and bereavement activation (Pillar 2)
    print("\n--- Stage 4: Death Event & Bereavement ---")
    death_success = simulator.simulate_death_event(patient.id)
    assert death_success is True
    print(f"✓ Recorded death event")
    
    # Verify patient status updated
    updated_patient = db.get_patient(patient.id)
    assert updated_patient.status == 'deceased'
    assert updated_patient.death_date is not None
    print(f"✓ Patient status: {updated_patient.status}")
    
    # Add bereavement entries
    journal_entry = db.save_bereavement_entry(
        patient_id=patient.id,
        user_id=family.id,
        entry_type='journal',
        content='Today I remembered our walks in the park together.'
    )
    assert journal_entry is not None
    print(f"✓ Created journal entry")
    
    memory_entry = db.save_bereavement_entry(
        patient_id=patient.id,
        user_id=family.id,
        entry_type='memory',
        content='Always had a smile and loved gardening.'
    )
    assert memory_entry is not None
    print(f"✓ Created memory entry")
    
    # Retrieve bereavement entries
    entries = db.get_bereavement_entries(patient.id)
    assert len(entries) == 2
    print(f"✓ Retrieved {len(entries)} bereavement entries")
    
    # Stage 5: System validation
    print("\n--- Stage 5: System Validation ---")
    validation = simulator.validate_system_response(patient.id)
    
    assert validation['data_logged'] is True
    assert validation['bereavement_activated'] is True
    assert validation['alerts_created'] is True
    
    print(f"✓ Data logged: {validation['vitals_count']} vitals, {validation['symptoms_count']} symptoms")
    print(f"✓ Alerts created: {validation['alert_count']}")
    print(f"✓ Bereavement activated: {validation['bereavement_activated']}")
    
    print("\n=== Integration Test PASSED ===\n")


# ============================================================================
# Integration Test 2: Multi-Patient Simulation
# ============================================================================

def test_multi_patient_simulation(test_db):
    """
    Test simulation with multiple patients
    Validates scalability and data consistency
    """
    print("\n=== Integration Test: Multi-Patient Simulation ===")
    
    # Create users
    clinician = db.add_user("dr_jones", "pass", "clinician", "jones@hospital.com")
    
    # Generate multiple synthetic patients
    n_patients = 5
    patients = simulator.generate_synthetic_cohort(n_patients)
    print(f"✓ Generated {n_patients} synthetic patients")
    
    created_patients = []
    for patient_data in patients:
        patient = db.add_patient(
            patient_code=patient_data['patient_code'],
            age=patient_data['age'],
            gender=patient_data['gender'],
            ethnicity=patient_data['ethnicity']
        )
        assert patient is not None
        created_patients.append(patient)
    
    print(f"✓ Created {len(created_patients)} patients in database")
    
    # Log data for each patient
    for patient in created_patients:
        vital_data = simulator.generate_vital_reading('stable')
        db.log_vital(patient.id, clinician.id, **vital_data)
        
        symptom_data = simulator.generate_symptom_log('stable')
        db.log_symptom(patient.id, clinician.id, **symptom_data)
    
    print(f"✓ Logged vitals and symptoms for all patients")
    
    # Verify all patients have data
    all_patients = db.get_all_patients()
    assert len(all_patients) >= n_patients
    
    for patient in created_patients:
        history = db.get_patient_history(patient.id)
        assert len(history['vitals']) > 0
        assert len(history['symptoms']) > 0
    
    print(f"✓ Verified data for all {n_patients} patients")
    print("\n=== Integration Test PASSED ===\n")


# ============================================================================
# Integration Test 3: AI Prediction Pipeline
# ============================================================================

def test_ai_prediction_pipeline(test_db):
    """
    Test complete AI prediction pipeline
    Validates Pillar 1 (XAI) integration with database
    """
    print("\n=== Integration Test: AI Prediction Pipeline ===")
    
    # Create test data
    user = db.add_user("ai_tester", "pass", "clinician", "ai@test.com")
    patient = db.add_patient("AI-TEST-001", 75, "M", "Caucasian")
    
    # Test different patient states
    test_scenarios = [
        ("Stable", "stable"),
        ("Deteriorating", "deterioration"),
        ("Crisis", "crisis")
    ]
    
    for scenario_name, stage in test_scenarios:
        print(f"\n--- Testing {scenario_name} Patient ---")
        
        # Generate and log data
        vital_data = simulator.generate_vital_reading(stage)
        vital = db.log_vital(patient.id, user.id, **vital_data)
        
        symptom_data = simulator.generate_symptom_log(stage)
        symptom = db.log_symptom(patient.id, user.id, **symptom_data)
        
        # Prepare data for AI
        ai_input = {
            'heart_rate': vital.heart_rate,
            'blood_pressure_sys': vital.blood_pressure_sys,
            'blood_pressure_dia': vital.blood_pressure_dia,
            'oxygen_saturation': vital.oxygen_saturation,
            'temperature': vital.temperature,
            'pain_level': symptom.pain_level,
            'nausea': symptom.nausea,
            'fatigue': symptom.fatigue,
            'anxiety': symptom.anxiety
        }
        
        # Generate predictions
        pathway = models.predict_care_pathway(ai_input)
        risk = models.predict_risk_score(ai_input)
        explanation = models.explain_prediction(ai_input)
        
        # Verify predictions
        assert pathway in models.CARE_PATHWAYS
        assert 0.0 <= risk <= 1.0
        assert explanation is not None
        
        # Save to database
        prediction = db.save_prediction(
            patient_id=patient.id,
            care_pathway=pathway,
            risk_score=risk,
            model_version="1.0"
        )
        assert prediction is not None
        
        print(f"  ✓ Pathway: {pathway}, Risk: {risk:.3f}")
    
    # Verify prediction history
    predictions = db.get_predictions(patient.id)
    assert len(predictions) == len(test_scenarios)
    print(f"\n✓ Saved {len(predictions)} predictions to database")
    
    print("\n=== Integration Test PASSED ===\n")


# ============================================================================
# Integration Test 4: Alert System Integration
# ============================================================================

def test_alert_system_integration(test_db):
    """
    Test alert system integration with monitoring
    Validates Pillar 3 (Alert System) with database
    """
    print("\n=== Integration Test: Alert System ===")
    
    # Create test data
    user = db.add_user("alert_tester", "pass", "clinician", "alert@test.com")
    patient = db.add_patient("ALERT-TEST-001", 80, "F", "Asian")
    
    # Log deteriorating vitals
    print("\n--- Logging Deteriorating Vitals ---")
    for i in range(4):
        vital_data = {
            'heart_rate': 90 + (i * 10),
            'blood_pressure_sys': 120 - (i * 10),
            'blood_pressure_dia': 80 - (i * 5),
            'oxygen_saturation': 94 - (i * 2),
            'temperature': 98.6 + (i * 0.5)
        }
        db.log_vital(patient.id, user.id, **vital_data)
        print(f"  Reading {i+1}: O2={vital_data['oxygen_saturation']:.1f}%, HR={vital_data['heart_rate']:.0f}")
    
    # Check deterioration detection
    recent_vitals = db.get_recent_vitals(patient.id, hours=24)
    deterioration = alerts.detect_deterioration(recent_vitals)
    print(f"\n✓ Deterioration detected: {deterioration}")
    
    # Check critical vital detection
    critical = alerts.any_critical_vital(recent_vitals)
    if critical:
        print(f"✓ Critical vital: {critical['vital']} = {critical['value']}")
    
    # Log pain spike
    print("\n--- Logging Pain Spike ---")
    db.log_symptom(patient.id, user.id, 3, False, False, False, "Initial")
    db.log_symptom(patient.id, user.id, 7, True, True, True, "Increased")
    
    recent_symptoms = db.get_recent_symptoms(patient.id, hours=24)
    pain_spike = alerts.detect_pain_spike(recent_symptoms)
    print(f"✓ Pain spike detected: {pain_spike}")
    
    # Create alerts
    if deterioration:
        alert = db.create_alert(
            patient.id,
            'deterioration',
            'Deterioration pattern detected',
            [user.id]
        )
        assert alert is not None
        print(f"✓ Created deterioration alert")
    
    if pain_spike:
        alert = db.create_alert(
            patient.id,
            'symptom_spike',
            'Significant pain increase',
            [user.id]
        )
        assert alert is not None
        print(f"✓ Created pain spike alert")
    
    # Verify alerts
    all_alerts = db.get_all_alerts(patient.id)
    print(f"\n✓ Total alerts created: {len(all_alerts)}")
    
    print("\n=== Integration Test PASSED ===\n")


# ============================================================================
# Integration Test 5: Data Consistency Across Components
# ============================================================================

def test_data_consistency_across_components(test_db):
    """
    Test data consistency when accessed by different components
    Validates cross-pillar data integrity
    """
    print("\n=== Integration Test: Data Consistency ===")
    
    # Create test entities
    user = db.add_user("consistency_test", "pass", "clinician", "test@test.com")
    patient = db.add_patient("CONSISTENCY-001", 70, "M", "Hispanic")
    
    # Component 1: Simulator writes data
    vital_data = simulator.generate_vital_reading('stable')
    symptom_data = simulator.generate_symptom_log('stable')
    
    vital = db.log_vital(patient.id, user.id, **vital_data)
    symptom = db.log_symptom(patient.id, user.id, **symptom_data)
    
    print("✓ Simulator wrote data")
    
    # Component 2: Database reads data
    retrieved_vital = db.get_recent_vitals(patient.id, hours=24)[0]
    retrieved_symptom = db.get_recent_symptoms(patient.id, hours=24)[0]
    
    assert retrieved_vital.heart_rate == vital_data['heart_rate']
    assert retrieved_symptom.pain_level == symptom_data['pain_level']
    print("✓ Database read consistent data")
    
    # Component 3: AI Engine uses data
    ai_input = {
        'heart_rate': retrieved_vital.heart_rate,
        'blood_pressure_sys': retrieved_vital.blood_pressure_sys,
        'blood_pressure_dia': retrieved_vital.blood_pressure_dia,
        'oxygen_saturation': retrieved_vital.oxygen_saturation,
        'temperature': retrieved_vital.temperature,
        'pain_level': retrieved_symptom.pain_level,
        'nausea': retrieved_symptom.nausea,
        'fatigue': retrieved_symptom.fatigue,
        'anxiety': retrieved_symptom.anxiety
    }
    
    pathway = models.predict_care_pathway(ai_input)
    risk = models.predict_risk_score(ai_input)
    
    assert pathway in models.CARE_PATHWAYS
    assert 0.0 <= risk <= 1.0
    print("✓ AI Engine processed data successfully")
    
    # Component 4: Alert System monitors data
    recent_vitals = db.get_recent_vitals(patient.id, hours=24)
    recent_symptoms = db.get_recent_symptoms(patient.id, hours=24)
    
    assert len(recent_vitals) > 0
    assert len(recent_symptoms) > 0
    print("✓ Alert System accessed data successfully")
    
    # Verify all components see same data
    assert recent_vitals[0].id == vital.id
    assert recent_symptoms[0].id == symptom.id
    print("✓ All components see consistent data")
    
    print("\n=== Integration Test PASSED ===\n")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
