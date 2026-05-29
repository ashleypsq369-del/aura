"""
Unit Tests for Database Layer
Tests specific examples, edge cases, and integration points
"""

import pytest
import tempfile
import os
import sys
from datetime import datetime, timedelta

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src import db


@pytest.fixture(scope='function')
def test_db():
    """Create a temporary test database for each test"""
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
# User Authentication Tests
# ============================================================================

def test_user_authentication_valid_credentials(test_db):
    """Test authentication with valid credentials"""
    username = "testuser"
    password = "testpass123"
    
    # Create user
    user = db.add_user(username=username, password=password, role="clinician", email="test@example.com")
    assert user is not None
    
    # Authenticate with correct credentials
    auth_user = db.authenticate_user(username, password)
    assert auth_user is not None
    assert auth_user.username == username
    assert auth_user.role == "clinician"


def test_user_authentication_invalid_password(test_db):
    """Test authentication with invalid password"""
    username = "testuser"
    password = "testpass123"
    
    # Create user
    db.add_user(username=username, password=password, role="clinician", email="test@example.com")
    
    # Authenticate with wrong password
    auth_user = db.authenticate_user(username, "wrongpassword")
    assert auth_user is None


def test_user_authentication_nonexistent_user(test_db):
    """Test authentication with nonexistent user"""
    auth_user = db.authenticate_user("nonexistent", "password")
    assert auth_user is None


def test_duplicate_username_rejected(test_db):
    """Test that duplicate usernames are rejected"""
    username = "testuser"
    
    # Create first user
    user1 = db.add_user(username=username, password="pass1", role="clinician", email="test1@example.com")
    assert user1 is not None
    
    # Try to create second user with same username
    user2 = db.add_user(username=username, password="pass2", role="family", email="test2@example.com")
    assert user2 is None


# ============================================================================
# Patient CRUD Tests
# ============================================================================

def test_patient_creation(test_db):
    """Test basic patient creation"""
    patient = db.add_patient(
        patient_code="P001",
        age=75,
        gender="M",
        ethnicity="Caucasian"
    )
    
    assert patient is not None
    assert patient.patient_code == "P001"
    assert patient.age == 75
    assert patient.status == "active"


def test_patient_retrieval_by_id(test_db):
    """Test retrieving patient by ID"""
    created_patient = db.add_patient(
        patient_code="P002",
        age=80,
        gender="F",
        ethnicity="Asian"
    )
    
    retrieved_patient = db.get_patient(created_patient.id)
    assert retrieved_patient is not None
    assert retrieved_patient.id == created_patient.id
    assert retrieved_patient.patient_code == "P002"


def test_patient_retrieval_by_code(test_db):
    """Test retrieving patient by patient code"""
    db.add_patient(patient_code="P003", age=70, gender="M", ethnicity="Hispanic")
    
    patient = db.get_patient_by_code("P003")
    assert patient is not None
    assert patient.patient_code == "P003"


def test_patient_status_update(test_db):
    """Test updating patient status"""
    patient = db.add_patient(patient_code="P004", age=85, gender="F", ethnicity="African American")
    
    death_date = datetime.utcnow()
    success = db.update_patient_status(patient.id, "deceased", death_date)
    assert success is True
    
    updated_patient = db.get_patient(patient.id)
    assert updated_patient.status == "deceased"
    assert updated_patient.death_date is not None


# ============================================================================
# Vital and Symptom Logging Tests
# ============================================================================

def test_vital_logging(test_db):
    """Test logging vital signs"""
    user = db.add_user(username="clinician1", password="pass", role="clinician", email="c@example.com")
    patient = db.add_patient(patient_code="P005", age=75, gender="M", ethnicity="Caucasian")
    
    vital = db.log_vital(
        patient_id=patient.id,
        recorded_by=user.id,
        heart_rate=75.0,
        blood_pressure_sys=120.0,
        blood_pressure_dia=80.0,
        oxygen_saturation=98.0,
        temperature=98.6
    )
    
    assert vital is not None
    assert vital.patient_id == patient.id
    assert vital.recorded_by == user.id
    assert vital.heart_rate == 75.0


def test_vital_logging_edge_case_extreme_values(test_db):
    """Test logging vitals with extreme but valid values"""
    user = db.add_user(username="clinician2", password="pass", role="clinician", email="c2@example.com")
    patient = db.add_patient(patient_code="P006", age=90, gender="F", ethnicity="Other")
    
    vital = db.log_vital(
        patient_id=patient.id,
        recorded_by=user.id,
        heart_rate=180.0,  # High
        blood_pressure_sys=200.0,  # High
        blood_pressure_dia=40.0,  # Low
        oxygen_saturation=70.0,  # Low
        temperature=105.0  # High fever
    )
    
    assert vital is not None
    assert vital.heart_rate == 180.0


def test_symptom_logging(test_db):
    """Test logging symptoms"""
    user = db.add_user(username="family1", password="pass", role="family", email="f@example.com")
    patient = db.add_patient(patient_code="P007", age=78, gender="M", ethnicity="Hispanic")
    
    symptom = db.log_symptom(
        patient_id=patient.id,
        recorded_by=user.id,
        pain_level=7,
        nausea=True,
        fatigue=True,
        anxiety=False,
        notes="Patient reports increased discomfort"
    )
    
    assert symptom is not None
    assert symptom.pain_level == 7
    assert symptom.nausea is True
    assert symptom.notes == "Patient reports increased discomfort"


def test_symptom_logging_edge_case_pain_boundaries(test_db):
    """Test symptom logging with boundary pain levels"""
    user = db.add_user(username="family2", password="pass", role="family", email="f2@example.com")
    patient = db.add_patient(patient_code="P008", age=82, gender="F", ethnicity="Asian")
    
    # Test minimum pain
    symptom_min = db.log_symptom(
        patient_id=patient.id,
        recorded_by=user.id,
        pain_level=0
    )
    assert symptom_min.pain_level == 0
    
    # Test maximum pain
    symptom_max = db.log_symptom(
        patient_id=patient.id,
        recorded_by=user.id,
        pain_level=10
    )
    assert symptom_max.pain_level == 10


# ============================================================================
# Foreign Key Constraint Tests
# ============================================================================

def test_foreign_key_patient_to_vital(test_db):
    """Test foreign key relationship between patient and vital"""
    user = db.add_user(username="clinician3", password="pass", role="clinician", email="c3@example.com")
    patient = db.add_patient(patient_code="P009", age=76, gender="M", ethnicity="Caucasian")
    
    vital = db.log_vital(
        patient_id=patient.id,
        recorded_by=user.id,
        heart_rate=70.0,
        blood_pressure_sys=115.0,
        blood_pressure_dia=75.0,
        oxygen_saturation=97.0,
        temperature=98.2
    )
    
    # Verify relationship
    retrieved_patient = db.get_patient(patient.id)
    assert len(retrieved_patient.vitals) > 0
    assert retrieved_patient.vitals[0].id == vital.id


def test_foreign_key_user_to_vital(test_db):
    """Test foreign key relationship between user and vital"""
    user = db.add_user(username="clinician4", password="pass", role="clinician", email="c4@example.com")
    patient = db.add_patient(patient_code="P010", age=79, gender="F", ethnicity="African American")
    
    vital = db.log_vital(
        patient_id=patient.id,
        recorded_by=user.id,
        heart_rate=72.0,
        blood_pressure_sys=118.0,
        blood_pressure_dia=78.0,
        oxygen_saturation=96.0,
        temperature=98.4
    )
    
    # Verify relationship
    retrieved_user = db.get_user_by_id(user.id)
    assert len(retrieved_user.vitals_recorded) > 0
    assert retrieved_user.vitals_recorded[0].id == vital.id


# ============================================================================
# Query and Retrieval Tests
# ============================================================================

def test_get_recent_vitals(test_db):
    """Test retrieving recent vitals within time window"""
    user = db.add_user(username="clinician5", password="pass", role="clinician", email="c5@example.com")
    patient = db.add_patient(patient_code="P011", age=77, gender="M", ethnicity="Hispanic")
    
    # Log multiple vitals
    for i in range(3):
        db.log_vital(
            patient_id=patient.id,
            recorded_by=user.id,
            heart_rate=70.0 + i,
            blood_pressure_sys=120.0,
            blood_pressure_dia=80.0,
            oxygen_saturation=98.0,
            temperature=98.6
        )
    
    recent_vitals = db.get_recent_vitals(patient.id, hours=24)
    assert len(recent_vitals) == 3


def test_get_patient_history(test_db):
    """Test retrieving complete patient history"""
    user = db.add_user(username="clinician6", password="pass", role="clinician", email="c6@example.com")
    patient = db.add_patient(patient_code="P012", age=81, gender="F", ethnicity="Asian")
    
    # Log vitals and symptoms
    db.log_vital(
        patient_id=patient.id,
        recorded_by=user.id,
        heart_rate=75.0,
        blood_pressure_sys=120.0,
        blood_pressure_dia=80.0,
        oxygen_saturation=98.0,
        temperature=98.6
    )
    
    db.log_symptom(
        patient_id=patient.id,
        recorded_by=user.id,
        pain_level=5,
        nausea=False,
        fatigue=True
    )
    
    history = db.get_patient_history(patient.id)
    assert 'vitals' in history
    assert 'symptoms' in history
    assert len(history['vitals']) == 1
    assert len(history['symptoms']) == 1


# ============================================================================
# Alert Management Tests
# ============================================================================

def test_alert_creation(test_db):
    """Test creating an alert"""
    patient = db.add_patient(patient_code="P013", age=83, gender="M", ethnicity="Caucasian")
    user = db.add_user(username="clinician7", password="pass", role="clinician", email="c7@example.com")
    
    alert = db.create_alert(
        patient_id=patient.id,
        alert_type="deterioration",
        message="Patient vitals showing deterioration",
        sent_to=[user.id]
    )
    
    assert alert is not None
    assert alert.alert_type == "deterioration"
    assert alert.acknowledged is False


def test_alert_acknowledgment(test_db):
    """Test acknowledging an alert"""
    patient = db.add_patient(patient_code="P014", age=84, gender="F", ethnicity="Other")
    user = db.add_user(username="clinician8", password="pass", role="clinician", email="c8@example.com")
    
    alert = db.create_alert(
        patient_id=patient.id,
        alert_type="critical_vital",
        message="Critical oxygen saturation",
        sent_to=[user.id]
    )
    
    success = db.acknowledge_alert(alert.id)
    assert success is True
    
    # Verify acknowledgment
    alerts = db.get_all_alerts(patient.id)
    assert alerts[0].acknowledged is True


# ============================================================================
# Bereavement Entry Tests
# ============================================================================

def test_bereavement_entry_creation(test_db):
    """Test creating bereavement entries"""
    patient = db.add_patient(patient_code="P015", age=86, gender="M", ethnicity="Hispanic")
    user = db.add_user(username="family3", password="pass", role="family", email="f3@example.com")
    
    # Update patient to deceased
    db.update_patient_status(patient.id, "deceased", datetime.utcnow())
    
    # Create journal entry
    entry = db.save_bereavement_entry(
        patient_id=patient.id,
        user_id=user.id,
        entry_type="journal",
        content="Today I remembered when we used to walk in the park together."
    )
    
    assert entry is not None
    assert entry.entry_type == "journal"
    assert "park" in entry.content


def test_bereavement_entry_retrieval(test_db):
    """Test retrieving bereavement entries"""
    patient = db.add_patient(patient_code="P016", age=87, gender="F", ethnicity="African American")
    user = db.add_user(username="family4", password="pass", role="family", email="f4@example.com")
    
    db.update_patient_status(patient.id, "deceased", datetime.utcnow())
    
    # Create multiple entries
    db.save_bereavement_entry(patient.id, user.id, "journal", "Journal entry 1")
    db.save_bereavement_entry(patient.id, user.id, "memory", "Memory entry 1")
    
    # Retrieve all entries
    entries = db.get_bereavement_entries(patient.id)
    assert len(entries) == 2
    
    # Retrieve only journals
    journals = db.get_bereavement_entries(patient.id, entry_type="journal")
    assert len(journals) == 1
    assert journals[0].entry_type == "journal"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
