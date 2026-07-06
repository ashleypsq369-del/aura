"""
Database layer for Project Aura - COMPLETE KIRO SPECIFICATION
All 21 tables as specified
"""

import os
import enum
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import json
import hashlib

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///aura.db')
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False}, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============================================================================
# ALL 21 TABLES
# ============================================================================

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
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
    profiles = relationship('UserProfile', back_populates='user', uselist=False)
    audit_logs = relationship('AuditLog', back_populates='user')
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


class Patient(Base):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True)
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


class PatientFamilyLink(Base):
    __tablename__ = 'patient_family_links'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    family_user_id = Column(Integer, ForeignKey('users.id'))
    relationship = Column(String(50))
    is_primary_contact = Column(Boolean, default=False)
    emergency_contact = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CaregiverAssignment(Base):
    __tablename__ = 'caregiver_assignments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    caregiver_id = Column(Integer, ForeignKey('users.id'))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(Integer, ForeignKey('users.id'))
    active = Column(Boolean, default=True)
    notes = Column(Text)


class Vital(Base):
    __tablename__ = 'vitals'
    id = Column(Integer, primary_key=True)
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
    patient = relationship('Patient', back_populates='vitals')
    
    @property
    def timestamp(self):
        return self.recorded_at


class Symptom(Base):
    __tablename__ = 'symptoms'
    id = Column(Integer, primary_key=True)
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
    patient = relationship('Patient', back_populates='symptoms')
    
    @property
    def timestamp(self):
        return self.recorded_at


class Prediction(Base):
    __tablename__ = 'predictions'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    predicted_at = Column(DateTime, default=datetime.utcnow, index=True)
    care_pathway = Column(String(50))
    risk_score = Column(Float)
    risk_level = Column(String(20))
    confidence = Column(Float)
    shap_values = Column(Text)
    feature_values = Column(Text)
    plain_explanation = Column(Text)
    model_version = Column(String(20), default='xgboost_v1')
    triggered_by = Column(String(20))
    patient = relationship('Patient', back_populates='predictions')
    
    @property
    def timestamp(self):
        return self.predicted_at


class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    alert_type = Column(String(50))
    severity = Column(String(20))
    triggered_value = Column(String(100))
    threshold_value = Column(String(100))
    message = Column(Text)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey('users.id'))
    acknowledged_at = Column(DateTime)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    vital_id = Column(Integer, ForeignKey('vitals.id'))
    patient = relationship('Patient', back_populates='alerts')
    
    @property
    def triggered_at(self):
        return self.created_at
    @property
    def acknowledged(self):
        return self.is_acknowledged
    @property
    def sent_to(self):
        return []


class Medication(Base):
    __tablename__ = 'medications'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    prescribed_by = Column(Integer, ForeignKey('users.id'))
    name = Column(String(200), nullable=False)
    generic_name = Column(String(200))
    dose = Column(String(50))
    unit = Column(String(20))
    frequency = Column(String(50))
    route = Column(String(30))
    indication = Column(String(200))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_prn = Column(Boolean, default=False)
    prn_max_dose = Column(String(50))
    is_active = Column(Boolean, default=True)
    discontinued_at = Column(DateTime)
    discontinued_by = Column(Integer, ForeignKey('users.id'))
    discontinue_reason = Column(Text)
    special_instructions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    adherence_logs = relationship('MedicationAdherenceLog', back_populates='medication')
    patient = relationship('Patient', back_populates='medications')


class MedicationAdherenceLog(Base):
    __tablename__ = 'medication_adherence_logs'
    id = Column(Integer, primary_key=True)
    medication_id = Column(Integer, ForeignKey('medications.id'), index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    scheduled_at = Column(DateTime)
    taken_at = Column(DateTime)
    taken = Column(Boolean, default=False)
    skipped_reason = Column(String(200))
    logged_by = Column(Integer, ForeignKey('users.id'))
    medication = relationship('Medication', back_populates='adherence_logs')


class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    clinician_id = Column(Integer, ForeignKey('users.id'))
    created_by = Column(Integer, ForeignKey('users.id'))
    appointment_type = Column(String(50))
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=30)
    location = Column(String(50))
    location_detail = Column(String(200))
    status = Column(String(20), default='scheduled')
    notes = Column(Text)
    reminder_sent = Column(Boolean, default=False)
    cancelled_at = Column(DateTime)
    cancel_reason = Column(Text)
    completed_at = Column(DateTime)
    completion_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    patient = relationship('Patient', back_populates='appointments')


class CarePlan(Base):
    __tablename__ = 'care_plans'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    version = Column(Integer, default=1)
    is_current = Column(Boolean, default=True)
    goals_of_care = Column(Text)
    pain_management_plan = Column(Text)
    psychological_support = Column(Text)
    spiritual_care = Column(Text)
    family_support_plan = Column(Text)
    advance_directives_notes = Column(Text)
    bereavement_plan = Column(Text)
    review_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    patient = relationship('Patient', back_populates='care_plans')


class ClinicalNote(Base):
    __tablename__ = 'clinical_notes'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    author_id = Column(Integer, ForeignKey('users.id'))
    note_type = Column(String(30))
    content = Column(Text, nullable=False)
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime)
    patient = relationship('Patient', back_populates='notes')


class FunctionalAssessment(Base):
    __tablename__ = 'functional_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow)
    pps_ambulation = Column(Integer)
    pps_activity = Column(Integer)
    pps_self_care = Column(Integer)
    pps_intake = Column(Integer)
    pps_consciousness = Column(Integer)
    pps_score = Column(Integer)
    esas_pain = Column(Integer)
    esas_tiredness = Column(Integer)
    esas_nausea = Column(Integer)
    esas_depression = Column(Integer)
    esas_anxiety = Column(Integer)
    esas_drowsiness = Column(Integer)
    esas_appetite = Column(Integer)
    esas_wellbeing = Column(Integer)
    esas_shortness_of_breath = Column(Integer)
    esas_total = Column(Integer)
    notes = Column(Text)
    patient = relationship('Patient', back_populates='functional_assessments')


class BereavementEntry(Base):
    __tablename__ = 'bereavement_entries'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    entry_type = Column(String(20))
    content = Column(Text)
    prompt_used = Column(Text)
    media_path = Column(String(500))
    sentiment_score = Column(Float)
    grief_stage_hint = Column(String(50))
    is_private = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    patient = relationship('Patient', back_populates='bereavement_entries')
    user = relationship('User', back_populates='bereavement_entries')


class ChatbotSession(Base):
    __tablename__ = 'chatbot_sessions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    patient_context_id = Column(Integer, ForeignKey('patients.id'))
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    message_count = Column(Integer, default=0)
    escalated = Column(Boolean, default=False)
    escalation_reason = Column(String(200))
    user = relationship('User', back_populates='chatbot_sessions')
    messages = relationship('ChatbotMessage', back_populates='session')


class ChatbotMessage(Base):
    __tablename__ = 'chatbot_messages'
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('chatbot_sessions.id'), index=True)
    role = Column(String(10))
    content = Column(Text)
    intent_detected = Column(String(50))
    sentiment_score = Column(Float)
    crisis_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship('ChatbotSession', back_populates='messages')


class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    user_role = Column(String(20))
    action = Column(String(100), index=True)
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    details = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    success = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    user = relationship('User', back_populates='audit_logs')
    
    @property
    def timestamp(self):
        return self.created_at


class AlertThreshold(Base):
    __tablename__ = 'alert_thresholds'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    vital_name = Column(String(50))
    threshold_value = Column(Float)
    severity = Column(String(20))
    is_active = Column(Boolean, default=True)
    updated_by = Column(Integer, ForeignKey('users.id'))
    updated_at = Column(DateTime, default=datetime.utcnow)


class NotificationQueue(Base):
    __tablename__ = 'notification_queue'
    id = Column(Integer, primary_key=True)
    recipient_id = Column(Integer, ForeignKey('users.id'), index=True)
    notification_type = Column(String(30))
    title = Column(String(200))
    body = Column(Text)
    related_alert_id = Column(Integer, ForeignKey('alerts.id'))
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Database Initialization
# ============================================================================

def init_database():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ All 21 tables created successfully")


def get_session() -> Session:
    """Return SQLAlchemy session"""
    return SessionLocal()


def get_db():
    """Dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# Helper Functions
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def authenticate_user(username: str, password: str, db: Session) -> Optional[User]:
    """Authenticate user"""
    password_hash = hash_password(password)
    user = db.query(User).filter(
        User.username == username,
        User.hashed_password == password_hash
    ).first()
    if user:
        user.last_login = datetime.utcnow()
        user.failed_logins = 0
        db.commit()
    return user
