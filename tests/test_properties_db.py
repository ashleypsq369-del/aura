"""
Property-Based Tests for Database Layer
Feature: project-aura
Tests Properties 7, 10, and 31 from design document
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from datetime import datetime, timedelta
import tempfile
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import db

# ============================================================================
# Custom Hypothesis Strategies
# ============================================================================

@st.composite
def user_data(draw):
    """Generate random user data"""
    username = draw(st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'))))
    password = draw(st.text(min_size=6, max_size=30))
    role = draw(st.sampled_from(['clinician', 'family']))
    email = f"{username}@example.com"
    return {
        'username': username,
        'password': password,
        'role': role,
        'email': email
    }

@st.composite
def patient_data(draw):
    """Generate random patient data"""
    patient_code = draw(st.text(min_size=5, max_size=15, alphabet=st.characters(whitelist_categories=('Lu', 'Nd'))))
    age = draw(st.integers(min_value=45, max_value=95))
    gender = draw(st.sampled_from(['M', 'F', 'Other']))
    ethnicity = draw(st.sampled_from(['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other']))
    return {
        'patient_code': patient_code,
        'age': age,
        'gender': gender,
        'ethnicity': ethnicity
    }

@st.composite
def vital_data(draw):
    """Generate random vital signs"""
    return {
        'heart_rate': draw(st.floats(min_value=40.0, max_value=180.0, allow_nan=False, allow_infinity=False)),
        'blood_pressure_sys': draw(st.floats(min_value=70.0, max_value=200.0, allow_nan=False, allow_infinity=False)),
        'blood_pressure_dia': draw(st.floats(min_value=40.0, max_value=130.0, allow_nan=False, allow_infinity=False)),
        'oxygen_saturation': draw(st.floats(min_value=70.0, max_value=100.0, allow_nan=False, allow_infinity=False)),
        'temperature': draw(st.floats(min_value=95.0, max_value=105.0, allow_nan=False, allow_infinity=False))
    }

@st.composite
def symptom_data(draw):
    """Generate random symptom data"""
    return {
        'pain_level': draw(st.integers(min_value=0, max_value=10)),
        'nausea': draw(st.booleans()),
        'fatigue': draw(st.booleans()),
        'anxiety': draw(st.booleans()),
        'notes': draw(st.text(max_size=200))
    }

@st.composite
def bereavement_data(draw):
    """Generate random bereavement entry data"""
    entry_type = draw(st.sampled_from(['journal', 'memory']))
    content = draw(st.text(min_size=10, max_size=500))
    return {
        'entry_type': entry_type,
        'content': content
    }


# ============================================================================
# Test Setup/Teardown Helpers
# ============================================================================

def setup_test_db():
    """Create a temporary test database"""
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
# Property 10: Data persistence with metadata
# Feature: project-aura, Property 10: Data persistence with metadata
# Validates: Requirements 3.2, 5.5, 6.4
# ============================================================================

@settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
@given(
    user=user_data(),
    patient=patient_data(),
    vital=vital_data()
)
def test_property_10_vital_persistence_with_metadata(user, patient, vital):
    """
    Property 10: Data persistence with metadata
    For any user-submitted vital reading, the system should persist the entry 
    to the database with complete metadata including timestamp, user attribution, 
    and patient association.
    """
    temp_db_name, original_url = setup_test_db()
    try:
        created_user = db.add_user(**user)
        assert created_user is not None
        
        created_patient = db.add_patient(**patient)
        assert created_patient is not None
        
        before_timestamp = datetime.utcnow()
        logged_vital = db.log_vital(
            patient_id=created_patient.id,
            recorded_by=created_user.id,
            **vital
        )
        after_timestamp = datetime.utcnow()
        
        assert logged_vital is not None
        assert logged_vital.patient_id == created_patient.id
        assert logged_vital.recorded_by == created_user.id
        assert logged_vital.timestamp is not None
        assert before_timestamp <= logged_vital.timestamp <= after_timestamp
    finally:
        teardown_test_db(temp_db_name, original_url)


# ============================================================================
# Property 7: Local storage verification
# Feature: project-aura, Property 7: Local storage verification
# Validates: Requirements 2.3, 9.2
# ============================================================================

@settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
@given(
    patient=patient_data(),
    vital=vital_data()
)
def test_property_7_local_storage_verification(patient, vital):
    """
    Property 7: Local storage verification
    For any data storage operation, the system should write to the local SQLite 
    database file without making network calls to cloud services.
    """
    temp_db_name, original_url = setup_test_db()
    try:
        user = db.add_user(username="testuser123", password="testpass", role="clinician", email="test@example.com")
        created_patient = db.add_patient(**patient)
        
        logged_vital = db.log_vital(
            patient_id=created_patient.id,
            recorded_by=user.id,
            **vital
        )
        
        assert logged_vital is not None
        
        retrieved_vitals = db.get_recent_vitals(created_patient.id, hours=24)
        assert len(retrieved_vitals) > 0
        
        assert os.path.exists(temp_db_name)
        assert 'sqlite' in db.engine.url.drivername
    finally:
        teardown_test_db(temp_db_name, original_url)


# ============================================================================
# Property 31: Cross-component data consistency
# Feature: project-aura, Property 31: Cross-component data consistency
# Validates: Requirements 10.2
# ============================================================================

@settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture], deadline=None)
@given(
    user=user_data(),
    patient=patient_data(),
    vital=vital_data(),
    symptom=symptom_data()
)
def test_property_31_cross_component_data_consistency(user, patient, vital, symptom):
    """
    Property 31: Cross-component data consistency
    For any data written to the database by one component, other components 
    reading that data should retrieve consistent values without corruption or loss.
    """
    temp_db_name, original_url = setup_test_db()
    try:
        created_user = db.add_user(**user)
        assert created_user is not None
        
        created_patient = db.add_patient(**patient)
        assert created_patient is not None
        
        logged_vital = db.log_vital(
            patient_id=created_patient.id,
            recorded_by=created_user.id,
            **vital
        )
        assert logged_vital is not None
        
        logged_symptom = db.log_symptom(
            patient_id=created_patient.id,
            recorded_by=created_user.id,
            **symptom
        )
        assert logged_symptom is not None
        
        # Cross-component reads
        retrieved_user = db.get_user(user['username'])
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        
        retrieved_patient = db.get_patient(created_patient.id)
        assert retrieved_patient is not None
        assert retrieved_patient.id == created_patient.id
        
        history = db.get_patient_history(created_patient.id)
        assert 'vitals' in history
        assert 'symptoms' in history
        assert len(history['vitals']) > 0
        assert len(history['symptoms']) > 0
        
        # Verify foreign key relationships
        assert history['vitals'][0].patient_id == created_patient.id
        assert history['vitals'][0].recorded_by == created_user.id
    finally:
        teardown_test_db(temp_db_name, original_url)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--hypothesis-show-statistics"])
