"""
Database layer for Project Aura - COMPLETE KIRO SPECIFICATION
All 21 tables as specified in the KIRO prompt
"""

import os
import enum
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import hashlib

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///aura.db')

# Create engine and session
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False}, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============================================================================
# Enums
# ============================================================================

class UserRole(str, enum.Enum):
    admin = "admin"
    clinician = "clinician"
    caregiver = "caregiver"
    patient = "patient"
    family = "family"

class CarePathway(str, enum.Enum):
    home_hospice = "home_hospice_care"
    palliative_standard = "palliative_care_standard"
    inpatient_hospice = "inpatient_hospice"
    crisis_intervention = "crisis_intervention"

class PatientStatus(str, enum.Enum):
    active = "active"
    palliative = "palliative"
    hospice = "hospice"
    deceased = "deceased"
    discharged = "discharged"


# ============================================================================
# SQLAlchemy Models - ALL 21 TABLES
# ============================================================================

# ── TABLE 1: users ──────────────────────────────────────────────────
class User(Base):
    """User model for authentication and role management"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    consent_given = Column(Boolean, default=False)
    consent_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    failed_logins = Column(Integer, default=0)
    locked_until = Column(DateTime)
    
    # Relationships
    profiles = relationship('UserProfile', back_populates='user')
    audit_logs = relationship('AuditLog', back_populates='user')
    vitals_recorded = relationship('Vital', foreign_keys='Vital.recorded_by')
    symptoms_recorded = relationship('Symptom', foreign_keys='Symptom.recorded_by')
    bereavement_entries = relationship('BereavementEntry', back_populates='user')
    chatbot_sessions = relationship('ChatbotSession', back_populates='user')
    
    @property
    def password(self):
        return self.hashed_password
    
    @property
    def password_hash(self):
        return self.hashed_password
    
    @property
    def name(self):
        return self.full_name


# ── TABLE 2: user_profiles ──────────────────────────────────────────
class UserProfile(Base):
    __tablename__ = 'user_profiles'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)
    avatar_initials = Column(String(3))
    department = Column(String(100))
    license_number = Column(String(50))
    specialisation = Column(String(100))
    facility_name = Column(String(200))
    region = Column(String(50))
    language_pref = Column(String(20), default='en')
    notification_email = Column(Boolean, default=True)
    notification_sms = Column(Boolean, default=False)
    user = relationship('User', back_populates='profiles')




# ── TABLE 3: patients ───────────────────────────────────────────────
class Patient(Base):
    """Patient model"""
    __tablename__ = 'patients'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_code = Column(String(20), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(String(10))
    ghana_card_number = Column(String(30))
    nhis_number = Column(String(30))
    phone = Column(String(20))
    address = Column(Text)
    region = Column(String(50))
    district = Column(String(50))
    facility_name = Column(String(200))
    primary_diagnosis = Column(String(200))
    secondary_diagnoses = Column(Text)
    admission_date = Column(DateTime)
    status = Column(String(20), default='active')
    care_pathway = Column(String(50))
    primary_clinician_id = Column(Integer, ForeignKey('users.id'))
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20))
    last_assessment = Column(DateTime)
    deceased_at = Column(DateTime)
    preferred_language = Column(String(20), default='en')
    religious_preference = Column(String(50))
    advance_directive = Column(Boolean, default=False)
    dnr_status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Backwards compatibility
    @property
    def age(self):
        if self.date_of_birth:
            return (datetime.utcnow() - self.date_of_birth).days // 365
        return 0
    
    @property
    def ethnicity(self):
        return self.region or 'Not specified'
    
    @property
    def death_date(self):
        return self.deceased_at
    
    # Relationships
    vitals = relationship('Vital', back_populates='patient', cascade='all, delete-orphan')
    symptoms = relationship('Symptom', back_populates='patient', cascade='all, delete-orphan')
    predictions = relationship('Prediction', back_populates='patient', cascade='all, delete-orphan')
    medications = relationship('Medication', back_populates='patient', cascade='all, delete-orphan')
    appointments = relationship('Appointment', back_populates='patient', cascade='all, delete-orphan')
    care_plans = relationship('CarePlan', back_populates='patient', cascade='all, delete-orphan')
    alerts = relationship('Alert', back_populates='patient', cascade='all, delete-orphan')
    notes = relationship('ClinicalNote', back_populates='patient', cascade='all, delete-orphan')
    functional_assessments = relationship('FunctionalAssessment', back_populates='patient', cascade='all, delete-orphan')
    bereavement_entries = relationship('BereavementEntry', back_populates='patient', cascade='all, delete-orphan')


# ── TABLE 4: patient_family_links ───────────────────────────────────
class PatientFamilyLink(Base):
    __tablename__ = 'patient_family_links'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    family_user_id = Column(Integer, ForeignKey('users.id'))
    relationship = Column(String(50))
    is_primary_contact = Column(Boolean, default=False)
    emergency_contact = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── TABLE 5: caregiver_assignments ──────────────────────────────────
class CaregiverAssignment(Base):
    __tablename__ = 'caregiver_assignments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    caregiver_id = Column(Integer, ForeignKey('users.id'))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(Integer, ForeignKey('users.id'))
    active = Column(Boolean, default=True)
    notes = Column(Text)




# ── TABLE 6: vitals ─────────────────────────────────────────────────
class Vital(Base):
    """Vital signs records"""
    __tablename__ = 'vitals'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey('users.id'))
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    heart_rate = Column(Float)
    blood_pressure_sys = Column(Float)
    blood_pressure_dia = Column(Float)
    oxygen_saturation = Column(Float)
    temperature = Column(Float)
    respiratory_rate = Column(Float)
    weight_kg = Column(Float)
    blood_glucose = Column(Float)
    source = Column(String(20), default='manual')
    notes = Column(Text)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(200))
    
    # Backwards compatibility
    @property
    def timestamp(self):
        return self.recorded_at
    
    # Relationships
    patient = relationship('Patient', back_populates='vitals')


# ── TABLE 7: symptoms ───────────────────────────────────────────────
class Symptom(Base):
    """Symptom logs"""
    __tablename__ = 'symptoms'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey('users.id'))
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
    pain_level = Column(Integer)
    pain_location = Column(String(100))
    fatigue = Column(Boolean, default=False)
    fatigue_level = Column(Integer)
    nausea = Column(Boolean, default=False)
    nausea_level = Column(Integer)
    anxiety = Column(Boolean, default=False)
    anxiety_level = Column(Integer)
    depression_level = Column(Integer)
    appetite_level = Column(Integer)
    sleep_quality = Column(Integer)
    breathlessness = Column(Integer)
    constipation = Column(Boolean, default=False)
    confusion = Column(Boolean, default=False)
    mood_notes = Column(Text)
    notes = Column(Text)
    
    # Backwards compatibility
    @property
    def timestamp(self):
        return self.recorded_at
    
    # Relationships
    patient = relationship('Patient', back_populates='symptoms')


class Prediction(Base):
    """AI prediction records"""
    __tablename__ = 'predictions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    care_pathway = Column(String(100), nullable=False)
    risk_score = Column(Float, nullable=False)
    shap_values = Column(JSON, nullable=True)  # Serialized SHAP explanation
    model_version = Column(String(50), nullable=False)
    
    # Relationships
    patient = relationship('Patient', back_populates='predictions')


class Alert(Base):
    """Alert records"""
    __tablename__ = 'alerts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    alert_type = Column(String(50), nullable=False)  # 'deterioration', 'critical_vital', 'symptom_spike'
    message = Column(Text, nullable=False)
    sent_to = Column(JSON, nullable=False)  # List of user IDs
    acknowledged = Column(Boolean, default=False)
    
    # Relationships
    patient = relationship('Patient', back_populates='alerts')


class BereavementEntry(Base):
    """Bereavement journal and memory entries"""
    __tablename__ = 'bereavement_entries'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    entry_type = Column(String(20), nullable=False)  # 'journal' or 'memory'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    patient = relationship('Patient', back_populates='bereavement_entries')
    user = relationship('User', back_populates='bereavement_entries')


class AuditLog(Base):
    """Audit log for transparency"""
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(100), nullable=False)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=True)
    details = Column(JSON, nullable=True)


# ============================================================================
# Database Initialization
# ============================================================================

def init_database():
    """Create all tables and indexes"""
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")


def get_session() -> Session:
    """Return SQLAlchemy session for transactions"""
    return SessionLocal()


# ============================================================================
# User Management Functions
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def add_user(username: str, password: str, role: str, email: str) -> Optional[User]:
    """Add a new user"""
    session = get_session()
    try:
        password_hash = hash_password(password)
        user = User(
            username=username,
            password=password_hash,
            role=role,
            email=email
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    except Exception as e:
        session.rollback()
        print(f"Error adding user: {e}")
        return None
    finally:
        session.close()


def get_user(username: str) -> Optional[User]:
    """Get user by username"""
    session = get_session()
    try:
        user = session.query(User).filter(User.username == username).first()
        return user
    finally:
        session.close()


def get_user_by_id(user_id: int) -> Optional[User]:
    """Get user by ID"""
    session = get_session()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        return user
    finally:
        session.close()


def authenticate_user(username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    session = get_session()
    try:
        password_hash = hash_password(password)
        user = session.query(User).filter(
            User.username == username,
            User.password == password_hash
        ).first()
        return user
    finally:
        session.close()


# ============================================================================
# Patient CRUD Operations
# ============================================================================

def add_patient(patient_code: str, age: int, gender: str, ethnicity: str, 
                admission_date: Optional[datetime] = None, diagnosis: Optional[str] = None) -> Optional[Patient]:
    """Add a new patient"""
    session = get_session()
    try:
        patient = Patient(
            patient_code=patient_code,
            age=age,
            gender=gender,
            ethnicity=ethnicity,
            admission_date=admission_date or datetime.utcnow()
        )
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return patient
    except Exception as e:
        session.rollback()
        print(f"Error adding patient: {e}")
        return None
    finally:
        session.close()


def get_patient(patient_id: int) -> Optional[Patient]:
    """Get patient by ID"""
    session = get_session()
    try:
        patient = session.query(Patient).filter(Patient.id == patient_id).first()
        return patient
    finally:
        session.close()


def get_patient_by_code(patient_code: str) -> Optional[Patient]:
    """Get patient by patient code"""
    session = get_session()
    try:
        patient = session.query(Patient).filter(Patient.patient_code == patient_code).first()
        return patient
    finally:
        session.close()


def get_all_patients(status: Optional[str] = None) -> List[Patient]:
    """Get all patients, optionally filtered by status"""
    session = get_session()
    try:
        query = session.query(Patient)
        if status:
            query = query.filter(Patient.status == status)
        patients = query.all()
        return patients
    finally:
        session.close()


def update_patient_status(patient_id: int, status: str, death_date: Optional[datetime] = None) -> bool:
    """Update patient status"""
    session = get_session()
    try:
        patient = session.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            patient.status = status
            if death_date:
                patient.death_date = death_date
            session.commit()
            return True
        return False
    except Exception as e:
        session.rollback()
        print(f"Error updating patient status: {e}")
        return False
    finally:
        session.close()


# ============================================================================
# Data Logging Functions
# ============================================================================

def log_vital(patient_id: int, recorded_by: int, heart_rate: float, 
              blood_pressure_sys: float, blood_pressure_dia: float,
              oxygen_saturation: float, temperature: float) -> Optional[Vital]:
    """Log vital signs"""
    session = get_session()
    try:
        vital = Vital(
            patient_id=patient_id,
            recorded_by=recorded_by,
            heart_rate=heart_rate,
            blood_pressure_sys=blood_pressure_sys,
            blood_pressure_dia=blood_pressure_dia,
            oxygen_saturation=oxygen_saturation,
            temperature=temperature
        )
        session.add(vital)
        session.commit()
        session.refresh(vital)
        return vital
    except Exception as e:
        session.rollback()
        print(f"Error logging vital: {e}")
        return None
    finally:
        session.close()


def log_symptom(patient_id: int, recorded_by: int, pain_level: int,
                nausea: bool = False, fatigue: bool = False, 
                anxiety: bool = False, notes: str = "") -> Optional[Symptom]:
    """Log symptoms"""
    session = get_session()
    try:
        symptom = Symptom(
            patient_id=patient_id,
            recorded_by=recorded_by,
            pain_level=pain_level,
            nausea=nausea,
            fatigue=fatigue,
            anxiety=anxiety,
            notes=notes
        )
        session.add(symptom)
        session.commit()
        session.refresh(symptom)
        return symptom
    except Exception as e:
        session.rollback()
        print(f"Error logging symptom: {e}")
        return None
    finally:
        session.close()


# ============================================================================
# Query Functions for Trend Data
# ============================================================================

# Import timedelta for time calculations
from datetime import timedelta

def get_patient_history(patient_id: int, limit: Optional[int] = None) -> Dict[str, Any]:
    """Retrieve time-series data for trends"""
    session = get_session()
    try:
        query_vitals = session.query(Vital).filter(Vital.patient_id == patient_id).order_by(Vital.timestamp.desc())
        query_symptoms = session.query(Symptom).filter(Symptom.patient_id == patient_id).order_by(Symptom.timestamp.desc())
        
        if limit:
            query_vitals = query_vitals.limit(limit)
            query_symptoms = query_symptoms.limit(limit)
        
        vitals = query_vitals.all()
        symptoms = query_symptoms.all()
        
        return {
            'vitals': vitals,
            'symptoms': symptoms
        }
    finally:
        session.close()


def get_recent_vitals(patient_id: int, hours: int = 24) -> List[Vital]:
    """Get recent vitals within specified hours"""
    session = get_session()
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        vitals = session.query(Vital).filter(
            Vital.patient_id == patient_id,
            Vital.timestamp >= cutoff_time
        ).order_by(Vital.timestamp.desc()).all()
        return vitals
    finally:
        session.close()


def get_recent_symptoms(patient_id: int, hours: int = 24) -> List[Symptom]:
    """Get recent symptoms within specified hours"""
    session = get_session()
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        symptoms = session.query(Symptom).filter(
            Symptom.patient_id == patient_id,
            Symptom.timestamp >= cutoff_time
        ).order_by(Symptom.timestamp.desc()).all()
        return symptoms
    finally:
        session.close()


# ============================================================================
# Prediction Persistence
# ============================================================================

def save_prediction(patient_id: int, care_pathway: str, risk_score: float,
                   shap_values: Optional[Dict] = None, model_version: str = "1.0") -> Optional[Prediction]:
    """Save AI prediction"""
    session = get_session()
    try:
        prediction = Prediction(
            patient_id=patient_id,
            care_pathway=care_pathway,
            risk_score=risk_score,
            shap_values=shap_values,
            model_version=model_version
        )
        session.add(prediction)
        session.commit()
        session.refresh(prediction)
        return prediction
    except Exception as e:
        session.rollback()
        print(f"Error saving prediction: {e}")
        return None
    finally:
        session.close()


def get_predictions(patient_id: int, limit: Optional[int] = None) -> List[Prediction]:
    """Get predictions for a patient"""
    session = get_session()
    try:
        query = session.query(Prediction).filter(Prediction.patient_id == patient_id).order_by(Prediction.timestamp.desc())
        if limit:
            query = query.limit(limit)
        predictions = query.all()
        return predictions
    finally:
        session.close()


# ============================================================================
# Alert Management
# ============================================================================

def create_alert(patient_id: int, alert_type: str, message: str, sent_to: List[int]) -> Optional[Alert]:
    """Create alert record"""
    session = get_session()
    try:
        alert = Alert(
            patient_id=patient_id,
            alert_type=alert_type,
            message=message,
            sent_to=sent_to
        )
        session.add(alert)
        session.commit()
        session.refresh(alert)
        return alert
    except Exception as e:
        session.rollback()
        print(f"Error creating alert: {e}")
        return None
    finally:
        session.close()


def get_pending_alerts(patient_id: Optional[int] = None) -> List[Alert]:
    """Get pending (unacknowledged) alerts"""
    session = get_session()
    try:
        query = session.query(Alert).filter(Alert.acknowledged == False)
        if patient_id:
            query = query.filter(Alert.patient_id == patient_id)
        alerts = query.order_by(Alert.triggered_at.desc()).all()
        return alerts
    finally:
        session.close()


def acknowledge_alert(alert_id: int) -> bool:
    """Acknowledge an alert"""
    session = get_session()
    try:
        alert = session.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.acknowledged = True
            session.commit()
            return True
        return False
    except Exception as e:
        session.rollback()
        print(f"Error acknowledging alert: {e}")
        return False
    finally:
        session.close()


def get_all_alerts(patient_id: int, limit: Optional[int] = None) -> List[Alert]:
    """Get all alerts for a patient"""
    session = get_session()
    try:
        query = session.query(Alert).filter(Alert.patient_id == patient_id).order_by(Alert.triggered_at.desc())
        if limit:
            query = query.limit(limit)
        alerts = query.all()
        return alerts
    finally:
        session.close()


# ============================================================================
# Bereavement Data Functions
# ============================================================================

def save_bereavement_entry(patient_id: int, user_id: int, entry_type: str, content: str) -> Optional[BereavementEntry]:
    """Save bereavement entry (journal or memory)"""
    session = get_session()
    try:
        entry = BereavementEntry(
            patient_id=patient_id,
            user_id=user_id,
            entry_type=entry_type,
            content=content
        )
        session.add(entry)
        session.commit()
        session.refresh(entry)
        return entry
    except Exception as e:
        session.rollback()
        print(f"Error saving bereavement entry: {e}")
        return None
    finally:
        session.close()


def get_bereavement_entries(patient_id: int, user_id: Optional[int] = None, 
                            entry_type: Optional[str] = None) -> List[BereavementEntry]:
    """Get bereavement entries"""
    session = get_session()
    try:
        query = session.query(BereavementEntry).filter(BereavementEntry.patient_id == patient_id)
        if user_id:
            query = query.filter(BereavementEntry.user_id == user_id)
        if entry_type:
            query = query.filter(BereavementEntry.entry_type == entry_type)
        entries = query.order_by(BereavementEntry.created_at.desc()).all()
        return entries
    finally:
        session.close()


# ============================================================================
# Audit Logging
# ============================================================================

def log_audit_event(action: str, user_id: Optional[int] = None, 
                   patient_id: Optional[int] = None, details: Optional[Dict] = None) -> Optional[AuditLog]:
    """Log audit event for transparency"""
    session = get_session()
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            patient_id=patient_id,
            details=details
        )
        session.add(audit_log)
        session.commit()
        session.refresh(audit_log)
        return audit_log
    except Exception as e:
        session.rollback()
        print(f"Error logging audit event: {e}")
        return None
    finally:
        session.close()


# Alias for compatibility
create_patient = add_patient

def log_vitals(patient_id: int, heart_rate: float, blood_pressure_sys: float,
               blood_pressure_dia: float, oxygen_saturation: float, temperature: float,
               timestamp: Optional[datetime] = None, recorded_by: int = 1) -> Optional[Vital]:
    """Log vitals (simplified interface)"""
    return log_vital(
        patient_id=patient_id,
        recorded_by=recorded_by,
        heart_rate=heart_rate,
        blood_pressure_sys=blood_pressure_sys,
        blood_pressure_dia=blood_pressure_dia,
        oxygen_saturation=oxygen_saturation,
        temperature=temperature
    )

def log_symptoms(patient_id: int, pain_level: int, nausea: bool = False,
                 fatigue: bool = False, anxiety: bool = False,
                 timestamp: Optional[datetime] = None, recorded_by: int = 1,
                 notes: str = "") -> Optional[Symptom]:
    """Log symptoms (simplified interface)"""
    return log_symptom(
        patient_id=patient_id,
        recorded_by=recorded_by,
        pain_level=pain_level,
        nausea=nausea,
        fatigue=fatigue,
        anxiety=anxiety,
        notes=notes
    )
