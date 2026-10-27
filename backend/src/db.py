"""
Database layer for Project Aura - COMPLETE KIRO SPECIFICATION
All 21 tables - SIMPLIFIED (no circular relationships)
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import json
import hashlib

from passlib.context import CryptContext
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///aura.db')

# Auto-fallback: if PostgreSQL is configured but unreachable, use SQLite
# This makes the app work on any machine regardless of PostgreSQL availability
_effective_url = DATABASE_URL
if DATABASE_URL.startswith('postgresql'):
    try:
        import sqlalchemy
        _test_engine = sqlalchemy.create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3},
        )
        with _test_engine.connect() as _conn:
            _conn.execute(sqlalchemy.text("SELECT 1"))
        _test_engine.dispose()
        print(f"[DB] Connected to PostgreSQL")
    except Exception as _pg_err:
        print(f"[DB] PostgreSQL unavailable ({_pg_err.__class__.__name__}) - falling back to SQLite")
        _effective_url = 'sqlite:///aura.db'

DATABASE_URL = _effective_url

# connect_args is SQLite-specific - PostgreSQL doesn't accept check_same_thread
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
_pool_kwargs   = {} if DATABASE_URL.startswith("sqlite") else {"pool_size": 5, "max_overflow": 10}
engine = create_engine(DATABASE_URL, echo=False, connect_args=_connect_args, **_pool_kwargs)
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
    gender = Column(String(20), nullable=True)           # male/female/other/prefer_not_to_say
    date_of_birth = Column(DateTime, nullable=True)
    address = Column(Text, nullable=True)                # home/work address
    location = Column(String(200), nullable=True)        # city/district display string
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    consent_given = Column(Boolean, default=False)
    consent_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    failed_logins = Column(Integer, default=0)
    locked_until = Column(DateTime)
    # Care setting chosen at registration (patient/family) or assigned by admin
    care_setting = Column(String(50), nullable=True)
    # Professional verification badge (admin-granted for clinicians/caregivers)
    is_professional = Column(Boolean, default=False)
    professional_title = Column(String(100), nullable=True)   # e.g., "Verified Palliative Care Clinician"
    # Care setting change request fields (pending admin approval)
    care_setting_change_request = Column(String(50), nullable=True)
    care_setting_change_reason = Column(Text, nullable=True)

    # Feature gate relationships
    feature_overrides = relationship('UserFeatureOverride', foreign_keys='UserFeatureOverride.user_id', back_populates='user', lazy='dynamic')
    feature_requests  = relationship('FeatureRequest',      foreign_keys='FeatureRequest.user_id',      back_populates='user', lazy='dynamic')
    
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
    avatar_url = Column(String(500), nullable=True)      # uploaded photo path
    department = Column(String(100))
    license_number = Column(String(50))
    specialisation = Column(String(100))
    facility_name = Column(String(200))
    region = Column(String(50))
    address = Column(Text, nullable=True)                # street address
    language_pref = Column(String(20), default='en')
    notification_email = Column(Boolean, default=True)
    notification_sms = Column(Boolean, default=False)


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
    
    @property
    def age(self):
        """Calculate age from date of birth"""
        if self.date_of_birth:
            today = datetime.utcnow()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return 70  # default
    emergency_contact_name = Column(String(100))
    emergency_contact_relationship = Column(String(50))
    emergency_contact_phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    shap_values = Column(Text)  # JSON string of SHAP values
    feature_values = Column(Text)  # JSON string of feature values
    feature_names = Column(Text)  # JSON string of feature names
    base_value = Column(Float)  # SHAP base value
    plain_explanation = Column(Text)
    model_version = Column(String(20), default='xgboost_v1')
    triggered_by = Column(String(20))
    clinical_action_taken = Column(Boolean, default=False)
    # Priority 4: Clinical Override fields
    overridden_by = Column(Integer, ForeignKey('users.id'))
    override_justification = Column(Text)
    
    @property
    def timestamp(self):
        return self.predicted_at


class PredictionFeedback(Base):
    """Clinician feedback on AI predictions for trust and model improvement"""
    __tablename__ = 'prediction_feedback'
    id = Column(Integer, primary_key=True)
    prediction_id = Column(Integer, ForeignKey('predictions.id'), nullable=False, index=True)
    clinician_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    feedback_type = Column(String(20), nullable=False)  # agree, partial, disagree
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientConsent(Base):
    """Patient consent for AI analysis and data usage"""
    __tablename__ = 'patient_consents'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    consent_type = Column(String(50), nullable=False)  # ai_analysis, data_processing, research_use, community
    consent_given = Column(Boolean, default=False)
    consented_at = Column(DateTime)
    revoked_at = Column(DateTime)
    witnessed_by = Column(Integer, ForeignKey('users.id'))
    notes = Column(Text)


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
    # AI generation metadata
    ai_generated = Column(Boolean, default=False)
    ai_generated_at = Column(DateTime)
    ai_confidence = Column(Float, default=0.0)
    disease_profile = Column(String(100))       # e.g. "cancer", "heart_failure"
    care_phase = Column(String(30), default='stable')  # stable/unstable/deteriorating/terminal/end_of_life
    overall_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CarePlanGoal(Base):
    """Individual goals within a care plan  --  with checklist tracking"""
    __tablename__ = 'care_plan_goals'
    id = Column(Integer, primary_key=True)
    care_plan_id = Column(Integer, ForeignKey('care_plans.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    category = Column(String(50))   # pain | symptom | functional | psychological | spiritual | family | medication | nutrition | safety
    priority = Column(String(20), default='medium')   # critical | high | medium | low
    status = Column(String(20), default='pending')    # pending | in_progress | achieved | discontinued
    progress = Column(Integer, default=0)             # 0-100
    target_date = Column(DateTime)
    achieved_date = Column(DateTime)
    ai_suggested = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey('users.id'))
    last_reviewed_by = Column(Integer, ForeignKey('users.id'))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CarePlanChecklistItem(Base):
    """Daily/weekly checklist tasks for a specific goal"""
    __tablename__ = 'care_plan_checklist_items'
    id = Column(Integer, primary_key=True)
    goal_id = Column(Integer, ForeignKey('care_plan_goals.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    task = Column(String(500), nullable=False)
    frequency = Column(String(30), default='daily')   # daily | weekly | as_needed | once
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    completed_by = Column(Integer, ForeignKey('users.id'))
    due_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class CarePlanIntervention(Base):
    """Clinical interventions / treatments within a care plan"""
    __tablename__ = 'care_plan_interventions'
    id = Column(Integer, primary_key=True)
    care_plan_id = Column(Integer, ForeignKey('care_plans.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    name = Column(String(300), nullable=False)
    category = Column(String(50))   # medication | therapy | monitoring | referral | education | procedure
    description = Column(Text)
    frequency = Column(String(100))
    responsible_role = Column(String(50))   # clinician | nurse | caregiver | patient | family
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    status = Column(String(20), default='active')   # active | completed | discontinued | on_hold
    ai_suggested = Column(Boolean, default=False)
    outcome = Column(Text)
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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


class LegacyHeir(Base):
    """Table: Digital Legacy Heirs - Who can access patient's memories after death"""
    __tablename__ = 'legacy_heirs'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    heir_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    heir_type = Column(String(30), default='family')  # family/friend/other
    relationship = Column(String(100))  # "daughter", "son", "spouse", "friend"
    access_level = Column(String(20), default='full')  # full/memories_only/messages_only
    can_access_private = Column(Boolean, default=True)  # Can see private entries
    designated_at = Column(DateTime, default=datetime.utcnow)
    activated_at = Column(DateTime, nullable=True)  # When patient died and access granted
    is_active = Column(Boolean, default=True)
    notes_from_patient = Column(Text)  # Personal message from patient to heir


class LegacyContent(Base):
    """Table: Legacy Content - Messages, notes, audio/video left by patient for heirs"""
    __tablename__ = 'legacy_content'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    content_type = Column(String(30), nullable=False)  # final_message/letter/audio/video/note
    title = Column(String(200))
    content = Column(Text)  # Text content or instructions
    media_path = Column(String(500))  # Path to audio/video file
    media_type = Column(String(50))  # audio/mpeg, video/mp4, etc
    recipient_type = Column(String(30), default='all_heirs')  # all_heirs/specific_heir/specific_person
    recipient_heir_id = Column(Integer, ForeignKey('legacy_heirs.id'), nullable=True)  # Specific heir
    recipient_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Specific person
    delivery_trigger = Column(String(50), default='after_death')  # after_death/specific_date/milestone
    delivery_date = Column(DateTime, nullable=True)  # Scheduled delivery date
    is_delivered = Column(Boolean, default=False)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LegacyConsent(Base):
    """Table: Legacy Consent & Advance Directive - Legal documentation of patient's wishes"""
    __tablename__ = 'legacy_consents'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, unique=True, index=True)
    consent_given = Column(Boolean, default=False)  # Patient consents to digital legacy
    consent_date = Column(DateTime, nullable=True)
    witnessed_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Clinician witness
    witness_signature = Column(String(200))  # Digital signature
    
    # Sharing permissions
    share_medical_records = Column(Boolean, default=False)
    share_memories = Column(Boolean, default=True)
    share_journal = Column(Boolean, default=False)
    share_messages = Column(Boolean, default=False)
    share_photos = Column(Boolean, default=True)
    
    # Legal compliance
    follows_hipaa = Column(Boolean, default=True)
    follows_gdpr = Column(Boolean, default=True)
    follows_local_law = Column(Boolean, default=True)
    legal_document_path = Column(String(500))  # Scanned advance directive
    
    # Revocation
    can_be_revoked = Column(Boolean, default=True)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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


class BreachIncident(Base):
    """HIPAA Breach Incident Logging - Gap Analysis Priority 2"""
    __tablename__ = 'breach_incidents'
    id = Column(Integer, primary_key=True)
    breach_type = Column(String(100), nullable=False)  # unauthorized_access, data_loss, ransomware, etc.
    discovered_at = Column(DateTime, nullable=False)
    affected_patient_ids = Column(Text)  # JSON array of patient IDs
    affected_count = Column(Integer, default=0)
    description = Column(Text)
    severity = Column(String(20))  # low, medium, high, critical
    reported_to_authorities = Column(Boolean, default=False)
    reported_at = Column(DateTime)
    notification_sent = Column(Boolean, default=False)
    notification_sent_at = Column(DateTime)
    resolution_notes = Column(Text)
    resolved_at = Column(DateTime)
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# HCI & CHATBOT SAFETY TABLES - Gap Analysis Priority 3
# ============================================================================

class UsabilityFeedback(Base):
    """
    Usability Feedback Collection
    Priority 3: HCI & ChatBot Safety
    Tracks page-level user satisfaction and usability issues
    """
    __tablename__ = 'usability_feedback'
    id = Column(Integer, primary_key=True)
    page_name = Column(String(100), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text)
    user_id = Column(Integer, ForeignKey('users.id'))
    user_role = Column(String(20))  # patient, clinician, admin, caregiver, family
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ChatbotConsent(Base):
    """
    ChatBot Consent Tracking
    Priority 3: HCI & ChatBot Safety
    Addresses Kocaballi et al. (2019) - ChatBot consent frameworks
    HIPAA-compliant consent documentation
    """
    __tablename__ = 'chatbot_consent'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    consent_given = Column(Boolean, nullable=False)
    consent_text = Column(Text, nullable=False)  # Full text of consent shown
    consented_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime)
    ip_address = Column(String(50))
    user_agent = Column(String(200))


class CrisisAlert(Base):
    """
    Crisis Detection and Management
    Priority 3: HCI & ChatBot Safety
    Addresses Coghlan et al. (2023) - ChatBot crisis detection and escalation
    
    Logs crisis situations detected by chatbot for immediate follow-up
    """
    __tablename__ = 'crisis_alerts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    crisis_type = Column(String(50), nullable=False)  # suicide, self_harm, emergency, distress
    message_content = Column(Text, nullable=False)  # Original message that triggered alert
    source = Column(String(50))  # chatbot, portal, assessment
    detected_keywords = Column(Text)  # Comma-separated keywords
    confidence_score = Column(Float)  # 0.0-1.0
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey('users.id'))
    acknowledged_at = Column(DateTime)
    careteam_notified = Column(Boolean, default=False)
    notified_at = Column(DateTime)
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ClinicalOverride(Base):
    """
    Clinical Override Tracking
    Priority 4: Biomedical Ethics
    Addresses Tilala et al. (2024) - Autonomy and Non-maleficence
    
    Tracks when clinicians override AI predictions
    Helps identify model biases and improve predictions
    """
    __tablename__ = 'clinical_overrides'
    id = Column(Integer, primary_key=True)
    prediction_id = Column(Integer, ForeignKey('predictions.id'), nullable=False, index=True)
    clinician_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    original_risk_score = Column(Float, nullable=False)
    overridden_risk_score = Column(Float, nullable=False)
    override_reason = Column(String(100))  # disagree_with_model, additional_clinical_info, patient_context, other
    justification = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# ============================================================================
# CLINICAL ASSESSMENT TABLES - VALIDATED TOOLS
# ============================================================================

class ESASAssessment(Base):
    """Edmonton Symptom Assessment System - Most widely used symptom assessment"""
    __tablename__ = 'esas_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 9 core symptoms (0-10 scale)
    pain = Column(Integer)  # 0=no pain, 10=worst possible
    tiredness = Column(Integer)
    drowsiness = Column(Integer)
    nausea = Column(Integer)
    lack_of_appetite = Column(Integer)
    depression = Column(Integer)
    anxiety = Column(Integer)
    shortness_of_breath = Column(Integer)
    wellbeing = Column(Integer)  # 0=best, 10=worst
    
    # Optional 10th symptom
    other_symptom_name = Column(String(100))
    other_symptom_score = Column(Integer)
    
    # Assessment metadata
    completed_by_proxy = Column(Boolean, default=False)
    proxy_relationship = Column(String(50))
    notes = Column(Text)


class PPSAssessment(Base):
    """Palliative Performance Scale - Functional status assessment"""
    __tablename__ = 'pps_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    pps_score = Column(Integer, nullable=False)  # 0-100 in 10% increments
    ambulation = Column(String(50))
    activity_disease = Column(String(50))
    self_care = Column(String(50))
    oral_intake = Column(String(50))
    consciousness = Column(String(50))
    notes = Column(Text)


class CognitiveAssessment(Base):
    """MMSE and MoCA cognitive assessments"""
    __tablename__ = 'cognitive_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    assessment_type = Column(String(20))  # "MMSE" or "MoCA"
    
    # MMSE Scores
    mmse_orientation_time = Column(Integer)
    mmse_orientation_place = Column(Integer)
    mmse_registration = Column(Integer)
    mmse_attention_calculation = Column(Integer)
    mmse_recall = Column(Integer)
    mmse_language = Column(Integer)
    mmse_visual_construction = Column(Integer)
    mmse_total = Column(Integer)
    
    # MoCA Scores
    moca_visuospatial_executive = Column(Integer)
    moca_naming = Column(Integer)
    moca_attention = Column(Integer)
    moca_language = Column(Integer)
    moca_abstraction = Column(Integer)
    moca_delayed_recall = Column(Integer)
    moca_orientation = Column(Integer)
    moca_education_adjustment = Column(Integer)
    moca_total = Column(Integer)
    
    interpretation = Column(String(50))
    patient_education_years = Column(Integer)
    notes = Column(Text)


class PHQ9Assessment(Base):
    """Patient Health Questionnaire-9 - Depression screening"""
    __tablename__ = 'phq9_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 9 questions (0-3 scale)
    little_interest = Column(Integer)
    feeling_down = Column(Integer)
    sleep_trouble = Column(Integer)
    feeling_tired = Column(Integer)
    appetite_change = Column(Integer)
    feeling_bad_about_self = Column(Integer)
    trouble_concentrating = Column(Integer)
    moving_slowly_or_fidgety = Column(Integer)
    thoughts_of_harm = Column(Integer)
    
    total_score = Column(Integer)
    severity = Column(String(20))
    difficulty_level = Column(String(20))
    notes = Column(Text)


class GAD7Assessment(Base):
    """Generalized Anxiety Disorder-7 - Anxiety screening"""
    __tablename__ = 'gad7_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 7 questions (0-3 scale)
    feeling_nervous = Column(Integer)
    not_stop_worrying = Column(Integer)
    worrying_too_much = Column(Integer)
    trouble_relaxing = Column(Integer)
    being_restless = Column(Integer)
    easily_annoyed = Column(Integer)
    feeling_afraid = Column(Integer)
    
    total_score = Column(Integer)
    severity = Column(String(20))
    difficulty_level = Column(String(20))
    notes = Column(Text)


class BarthelIndexAssessment(Base):
    """Barthel Index - Activities of Daily Living"""
    __tablename__ = 'barthel_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 10 ADL items
    feeding = Column(Integer)
    bathing = Column(Integer)
    grooming = Column(Integer)
    dressing = Column(Integer)
    bowel_control = Column(Integer)
    bladder_control = Column(Integer)
    toilet_use = Column(Integer)
    transfers = Column(Integer)
    mobility = Column(Integer)
    stairs = Column(Integer)
    
    total_score = Column(Integer)
    independence_level = Column(String(30))
    notes = Column(Text)


class PainAssessment(Base):
    """Brief Pain Inventory - Comprehensive pain assessment"""
    __tablename__ = 'pain_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Pain Severity
    pain_worst = Column(Integer)
    pain_least = Column(Integer)
    pain_average = Column(Integer)
    pain_current = Column(Integer)
    
    # Pain characteristics
    pain_location = Column(Text)
    pain_type = Column(String(100))
    
    # Pain Interference
    interference_activity = Column(Integer)
    interference_mood = Column(Integer)
    interference_walking = Column(Integer)
    interference_work = Column(Integer)
    interference_relations = Column(Integer)
    interference_sleep = Column(Integer)
    interference_enjoyment = Column(Integer)
    
    # Management
    current_medications = Column(Text)
    medication_effectiveness = Column(Integer)
    notes = Column(Text)


class QualityOfLifeAssessment(Base):
    """Quality of Life Assessment (FACT-G style)"""
    __tablename__ = 'qol_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Physical Wellbeing (0-4 scale each)
    physical_lack_of_energy = Column(Integer)
    physical_nausea = Column(Integer)
    physical_meeting_needs = Column(Integer)
    physical_side_effects = Column(Integer)
    physical_feel_ill = Column(Integer)
    physical_bed_time = Column(Integer)
    physical_pain = Column(Integer)
    
    # Social/Family Wellbeing
    social_close_to_friends = Column(Integer)
    social_emotional_support = Column(Integer)
    social_support_from_family = Column(Integer)
    social_acceptance_of_illness = Column(Integer)
    social_family_communication = Column(Integer)
    social_close_to_partner = Column(Integer)
    social_satisfaction_sex_life = Column(Integer)
    
    # Emotional Wellbeing
    emotional_feel_sad = Column(Integer)
    emotional_coping_with_illness = Column(Integer)
    emotional_losing_hope = Column(Integer)
    emotional_feel_nervous = Column(Integer)
    emotional_worry_about_dying = Column(Integer)
    emotional_worry_about_condition = Column(Integer)
    
    # Functional Wellbeing
    functional_able_to_work = Column(Integer)
    functional_work_fulfilling = Column(Integer)
    functional_enjoy_life = Column(Integer)
    functional_accepted_illness = Column(Integer)
    functional_sleeping_well = Column(Integer)
    functional_enjoying_hobbies = Column(Integer)
    functional_content_with_qol = Column(Integer)
    
    # Total scores
    physical_score = Column(Integer)
    social_score = Column(Integer)
    emotional_score = Column(Integer)
    functional_score = Column(Integer)
    total_score = Column(Integer)
    notes = Column(Text)


class CaregiverBurdenAssessment(Base):
    """Zarit Burden Interview (short form)"""
    __tablename__ = 'caregiver_burden_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    caregiver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # 12 questions (0-4 scale)
    q1_more_time = Column(Integer)
    q2_stressed = Column(Integer)
    q3_angry = Column(Integer)
    q4_affect_relationship = Column(Integer)
    q5_strained = Column(Integer)
    q6_health_suffered = Column(Integer)
    q7_lack_privacy = Column(Integer)
    q8_social_life_suffered = Column(Integer)
    q9_lost_control = Column(Integer)
    q10_uncertain = Column(Integer)
    q11_do_more = Column(Integer)
    q12_do_better = Column(Integer)
    
    total_score = Column(Integer)
    burden_level = Column(String(30))
    
    # Support needs
    needs_respite_care = Column(Boolean, default=False)
    needs_support_group = Column(Boolean, default=False)
    needs_counseling = Column(Boolean, default=False)
    notes = Column(Text)


class MotorSkillsAssessment(Base):
    """Motor Skills and Physical Function Tests"""
    __tablename__ = 'motor_skills_assessments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey('users.id'))
    assessed_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Grip Strength
    grip_strength_right = Column(Float)
    grip_strength_left = Column(Float)
    grip_strength_interpretation = Column(String(30))
    
    # Timed Up and Go
    tug_time_seconds = Column(Float)
    tug_assistance_used = Column(String(50))
    tug_fall_risk = Column(String(20))
    
    # 6-Minute Walk Test
    walk_distance_meters = Column(Float)
    walk_dyspnea_before = Column(Integer)
    walk_dyspnea_after = Column(Integer)
    walk_oxygen_sat_before = Column(Integer)
    walk_oxygen_sat_after = Column(Integer)
    
    # Balance and Coordination
    balance_score = Column(Integer)
    coordination_score = Column(Integer)
    notes = Column(Text)


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


class PushSubscription(Base):
    """Stores browser Web Push subscriptions per user device."""
    __tablename__ = 'push_subscriptions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    endpoint = Column(Text, nullable=False, unique=True)
    p256dh = Column(Text, nullable=False)    # auth key
    auth = Column(Text, nullable=False)      # p256dh key
    user_agent = Column(String(300))         # browser/device info
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# TABLES 22-30 + HELPERS (Extension)
# ============================================================================

class PasswordResetToken(Base):
    """Temporary tokens for forgot-password flow"""
    __tablename__ = 'password_reset_tokens'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token = Column(String(200), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientPreferences(Base):
    """Table 22: Questionnaire answers driving adaptive personalisation"""
    __tablename__ = 'patient_preferences'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    # Step 1  --  About You
    language_pref = Column(String(20), default='en')
    info_style = Column(String(50))        # simple / detailed / visual / mixed
    tech_comfort = Column(String(30))      # high / medium / low / basic
    # Step 2  --  Illness Journey
    primary_condition = Column(String(200))
    diagnosis_duration = Column(String(30))
    emotional_states = Column(Text)        # JSON array: ["scared","hopeful"]
    care_priorities = Column(Text)         # JSON array ranked
    # Step 3  --  Physical Wellbeing
    physical_symptoms = Column(Text)       # JSON array
    activity_level = Column(String(30))
    mobility_aid = Column(String(30))
    self_care_level = Column(String(30))
    # Step 4  --  Mental & Emotional
    mood_score = Column(Integer)           # 1-10
    coping_strategies = Column(Text)       # JSON array
    current_psych_support = Column(String(50))
    future_worry_level = Column(String(30))
    # Step 5  --  Spiritual & Cultural
    religious_background = Column(String(50))
    spiritual_importance = Column(String(30))
    cultural_practices = Column(Text)
    wants_spiritual_care = Column(Boolean, default=False)
    # Step 6  --  Social & Family
    main_support_person = Column(String(30))
    social_connectedness = Column(String(30))
    wants_peer_connection = Column(Boolean, default=False)
    has_dependants = Column(Boolean, default=False)
    family_involvement_pref = Column(String(30))
    # Step 7  --  Content Preferences
    content_preferences = Column(Text)     # JSON array
    info_frequency = Column(String(20))
    wants_community = Column(Boolean, default=False)
    topic_interests = Column(Text)         # JSON array
    # ESAS Symptom Scores from questionnaire (0-10)
    esas_pain = Column(Integer, default=0)
    esas_tiredness = Column(Integer, default=0)
    esas_nausea = Column(Integer, default=0)
    esas_shortness_of_breath = Column(Integer, default=0)
    esas_depression = Column(Integer, default=0)
    esas_anxiety = Column(Integer, default=0)
    esas_wellbeing = Column(Integer, default=0)
    esas_appetite = Column(Integer, default=0)
    # Additional health fields
    weight_change = Column(String(50))
    swallowing_difficulty = Column(String(50))
    # Consent fields
    ai_analysis_consent = Column(String(20), default='yes')
    ai_data_sharing_consent = Column(String(20), default='no')
    care_team_sharing = Column(String(20), default='yes')
    # UI Adaptation - stored in localStorage on the client; DB columns
    # added via migration when DB owner permissions are available.
    # age_group = Column(String(20))   # pending migration
    # ui_needs  = Column(Text)          # pending migration
    # Meta
    questionnaire_complete = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    last_updated = Column(DateTime, default=datetime.utcnow)


class UserFeatureOverride(Base):
    """
    Admin-controlled per-user feature gates.
    Overrides the care-setting defaults from SETTING_FEATURE_GATES.
    state: 'enabled' | 'disabled' | 'locked'
      enabled  → force-show this feature even if care setting hides it
      disabled → force-hide this feature regardless of care setting
      locked   → hidden AND the user cannot request access
    source: 'admin' | 'questionnaire' | 'request_approved'
    """
    __tablename__ = 'user_feature_overrides'
    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    feature_path = Column(String(100), nullable=False)   # e.g. '/memory-vault'
    state        = Column(String(20), nullable=False, default='disabled')
    source       = Column(String(30), default='admin')   # admin/questionnaire/request_approved
    note         = Column(String(500))                   # admin note/reason
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by   = Column(Integer, ForeignKey('users.id'), nullable=True)

    user         = relationship('User', foreign_keys=[user_id],      back_populates='feature_overrides')
    admin        = relationship('User', foreign_keys=[created_by])


class FeatureRequest(Base):
    """
    Users can request access to a feature that is hidden for their care setting.
    Admin approves/denies, which creates/updates a UserFeatureOverride.
    status: 'pending' | 'approved' | 'denied'
    """
    __tablename__ = 'feature_requests'
    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    feature_path = Column(String(100), nullable=False)
    feature_name = Column(String(100))                   # human label, e.g. 'Memory Vault'
    reason       = Column(String(1000))                  # user's stated reason
    status       = Column(String(20), default='pending', index=True)
    admin_note   = Column(String(500))
    reviewed_by  = Column(Integer, ForeignKey('users.id'), nullable=True)
    reviewed_at  = Column(DateTime)
    created_at   = Column(DateTime, default=datetime.utcnow)

    user         = relationship('User', foreign_keys=[user_id],    back_populates='feature_requests')
    reviewer     = relationship('User', foreign_keys=[reviewed_by])


class Resource(Base):
    """Table 23: Educational resources tagged by condition/topic"""
    __tablename__ = 'resources'
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    summary = Column(String(500))
    content = Column(Text)
    category = Column(String(50))
    condition_tags = Column(Text)          # JSON array: ["cancer","heart_failure"]
    topic_tags = Column(Text)             # JSON array: ["pain","sleep"]
    format = Column(String(20), default='article')  # article/video/audio/pdf/hotline
    language = Column(String(10), default='en')
    source = Column(String(200))
    url = Column(String(500))
    pdf_path = Column(Text)               # local path: /static/pdfs/filename.pdf
    external_url = Column(Text)           # external download / view link
    is_ghana_specific = Column(Boolean, default=False)
    difficulty_level = Column(String(20), default='standard')  # simple/standard/detailed
    is_published = Column(Boolean, default=True)
    helpful_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class ResourceBookmark(Base):
    """Table 24: User-saved resources"""
    __tablename__ = 'resource_bookmarks'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    resource_id = Column(Integer, ForeignKey('resources.id'), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)


class ResourceFeedback(Base):
    """Table 25: Helpful / not helpful feedback on resources"""
    __tablename__ = 'resource_feedback'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    resource_id = Column(Integer, ForeignKey('resources.id'), nullable=False)
    helpful = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommunityGroup(Base):
    """Table 26: Condition-based peer support groups"""
    __tablename__ = 'community_groups'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    condition_tags = Column(Text)          # JSON: ["cancer","general"]
    is_active = Column(Boolean, default=True)
    member_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    image_url = Column(String(500), nullable=True)   # optional group avatar/cover
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)  # user who created it


class CommunityMembership(Base):
    """Table 27: User memberships in community groups"""
    __tablename__ = 'community_memberships'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    group_id = Column(Integer, ForeignKey('community_groups.id'), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class CommunityPost(Base):
    """Table 28: Community group posts (max 280 chars, anonymised)"""
    __tablename__ = 'community_posts'
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey('community_groups.id'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    display_name = Column(String(100))     # e.g. "Kofi · Cancer Journey" (anonymised)
    content = Column(String(280), nullable=False)
    is_moderated = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)
    flag_count = Column(Integer, default=0)
    reactions = Column(Text, default='{"pray": 0, "heart": 0, "strong": 0}')  # JSON
    created_at = Column(DateTime, default=datetime.utcnow)


class ConditionCareTemplate(Base):
    """Table 29: Diagnosis-specific care plan templates"""
    __tablename__ = 'condition_care_templates'
    id = Column(Integer, primary_key=True)
    condition_name = Column(String(100), unique=True, nullable=False)
    condition_keywords = Column(Text)      # JSON: keywords to match diagnosis field
    goals_of_care = Column(Text)
    pain_management_plan = Column(Text)
    psychological_support = Column(Text)
    spiritual_care = Column(Text)
    family_support_plan = Column(Text)
    plain_language_summary = Column(Text)  # patient-facing version
    key_symptoms_to_monitor = Column(Text) # JSON array
    red_flag_symptoms = Column(Text)       # JSON array
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientFamilyConsent(Base):
    """Patient-controlled consent for family data access - stored separately to avoid ALTER TABLE on owned tables"""
    __tablename__ = 'patient_family_consent'
    id = Column(Integer, primary_key=True)
    patient_user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    consent_json = Column(Text, default='{}')   # {"vitals": true, "medications": false, ...}
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PatientJourneyEvent(Base):
    """Table 30: Human journey events (admissions, milestones, changes)"""
    __tablename__ = 'patient_journey_events'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    event_type = Column(String(50))
    event_title = Column(String(200))
    event_detail = Column(Text)
    clinical_note = Column(Text)
    is_milestone = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_by = Column(Integer, ForeignKey('users.id'))


# ============================================================================
# NEW PALLIATIVE CARE MODULES - Tables 31–34
# ============================================================================

class AdvanceCarePlan(Base):
    """Table 31: Advance Care Planning document - goals of care, end-of-life wishes"""
    __tablename__ = 'advance_care_plans'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_current = Column(Boolean, default=True)

    # Goals of care
    primary_goal = Column(String(100))   # comfort / function / cure_directed / unclear
    goals_detail = Column(Text)          # free-text elaboration
    patient_understanding = Column(Text) # what patient understands about diagnosis/prognosis

    # End-of-life wishes
    preferred_place_of_death = Column(String(100))  # home / hospice / hospital / care_home / other
    preferred_place_detail = Column(Text)

    # Resuscitation & life-sustaining treatment
    dnr_status = Column(String(20))        # dnr / resuscitate / not_discussed
    dnr_date = Column(DateTime)
    cpr_wishes = Column(String(50))        # do_not_attempt / attempt / not_decided
    mechanical_ventilation = Column(String(50))  # refuse / accept / trial_only / not_discussed
    artificial_nutrition = Column(String(50))    # refuse / accept / trial_only / not_discussed
    dialysis = Column(String(50))                # refuse / accept / not_applicable / not_discussed
    hospital_admission = Column(String(50))      # refuse / accept / if_needed / not_discussed

    # Cultural & spiritual wishes
    cultural_considerations = Column(Text)  # rituals, practices important to patient
    spiritual_wishes = Column(Text)         # prayers, blessings, sacraments, rites by faith
    language_preference = Column(String(100))
    family_involvement_wishes = Column(Text)

    # Post-death wishes (handled sensitively)
    organ_donation = Column(String(30))     # yes / no / not_discussed
    post_death_wishes = Column(Text)        # burial rites, body handling per religion/culture

    # Legal
    has_lasting_power_of_attorney = Column(Boolean, default=False)
    attorney_name = Column(String(200))
    attorney_contact = Column(String(200))
    has_living_will = Column(Boolean, default=False)

    # Review
    patient_confirmed = Column(Boolean, default=False)  # patient agreed this reflects wishes
    family_witnessed = Column(Boolean, default=False)
    next_review_date = Column(DateTime)
    review_notes = Column(Text)


class MDTMeeting(Base):
    """Table 32: Multi-Disciplinary Team meeting records"""
    __tablename__ = 'mdt_meetings'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    meeting_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Attendance
    attendees = Column(Text)  # JSON list: [{name, role}, ...]
    chair_name = Column(String(200))
    meeting_type = Column(String(50))  # routine / urgent / family_meeting / discharge_planning

    # Clinical summary at time of meeting
    clinical_summary = Column(Text)
    current_concerns = Column(Text)

    # Decisions made
    care_plan_changes = Column(Text)
    medication_decisions = Column(Text)
    goals_of_care_discussed = Column(Boolean, default=False)
    acp_reviewed = Column(Boolean, default=False)

    # Referrals agreed
    referrals_made = Column(Text)  # JSON list of referral types agreed

    # Follow-up
    action_items = Column(Text)  # JSON list: [{action, responsible, due_date}, ...]
    next_meeting_date = Column(DateTime)
    family_present = Column(Boolean, default=False)
    family_feedback = Column(Text)
    meeting_notes = Column(Text)


class Referral(Base):
    """Table 33: Allied health referral tracker"""
    __tablename__ = 'referrals'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    referred_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Referral details
    referral_type = Column(String(100))   # physiotherapy / occupational_therapy / social_work /
                                          # chaplaincy / dietitian / speech_therapy /
                                          # wound_care / psychology / palliative_specialist /
                                          # orthotics / other
    referral_reason = Column(Text, nullable=False)
    urgency = Column(String(20))          # routine / urgent / emergency
    priority = Column(String(20))         # low / medium / high / critical

    # Clinical need
    clinical_goals = Column(Text)         # what we want to achieve (comfort positioning, etc.)
    specific_concerns = Column(Text)

    # Status tracking
    status = Column(String(30))           # pending / accepted / in_progress / completed / declined / cancelled
    referred_to_name = Column(String(200))
    referred_to_team = Column(String(200))
    referred_to_contact = Column(String(200))

    # Outcomes
    accepted_at = Column(DateTime)
    first_seen_at = Column(DateTime)
    completed_at = Column(DateTime)
    outcome_notes = Column(Text)
    follow_up_needed = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)

    # Palliative-specific flag
    comfort_focused = Column(Boolean, default=True)  # goal is comfort, not cure


class SpiritualCareNote(Base):
    """Table 34: Spiritual care / chaplaincy visit notes - inclusive of all faiths & beliefs"""
    __tablename__ = 'spiritual_care_notes'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    care_provider_id = Column(Integer, ForeignKey('users.id'))  # chaplain / counsellor / spiritual care worker
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    visit_date = Column(DateTime, nullable=False)

    # Faith/spiritual background (as identified BY PATIENT - never assumed)
    faith_tradition = Column(String(100))   # christian / muslim / traditional_african / hindu /
                                            # baha_i / no_religion / spiritual_not_religious /
                                            # other / prefer_not_to_say
    faith_tradition_detail = Column(String(200))  # e.g. "Catholic", "Sunni Muslim", "Akan tradition"
    specific_denomination = Column(String(200))   # further specification if relevant

    # Spiritual needs assessment
    spiritual_distress_level = Column(Integer)  # 0=none, 10=extreme
    spiritual_needs = Column(Text)  # JSON list: pain_of_meaning / forgiveness / hope /
                                    # connection / reconciliation / peace / ritual / prayer /
                                    # sacred_text / music / legacy / none

    # Visit details
    visit_type = Column(String(50))   # prayer / reading / listening / ritual / anointing /
                                      # communion / blessing / libation / ancestral_rites /
                                      # meditation / music / storytelling / counselling / other
    visit_duration_minutes = Column(Integer)
    family_present = Column(Boolean, default=False)
    care_provider_type = Column(String(100))    # chaplain / imam / pastor / traditional_elder / etc.
    care_provider_name = Column(String(200))    # name of the person providing care

    # Interventions provided (inclusive language)
    interventions_provided = Column(Text)  # what was done - described neutrally
    sacred_items_needed = Column(Text)     # e.g. prayer mat, rosary, libation bowl, etc.
    referral_to_community_leader = Column(Boolean, default=False)  # imam, pastor, traditional leader
    community_leader_name = Column(String(200))

    # Patient response & wellbeing
    patient_response = Column(Text)
    comfort_level_after = Column(Integer)  # 0=no comfort, 10=great comfort
    meaning_making_supported = Column(Boolean, default=False)
    reconciliation_facilitated = Column(Boolean, default=False)

    # Unfinished business / concerns
    unresolved_concerns = Column(Text)  # forgiveness issues, estranged family, regrets
    patient_wishes_expressed = Column(Text)  # any final wishes, messages, legacy desires

    # Follow-up
    follow_up_needed = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    confidential = Column(Boolean, default=True)  # spiritual notes are usually confidential
    notes = Column(Text)  # general clinician-visible summary only


# ============================================================================
# GHANA HOMECARE FEATURES - Feature Set 8 (GNA Healthcare / AgedCare Ghana)
# ============================================================================

class VisitReport(Base):
    """Auto-generated report after appointment completion - shared with family"""
    __tablename__ = 'visit_reports'
    id = Column(Integer, primary_key=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), unique=True, nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    nurse_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    vitals_summary = Column(JSON)          # {bp, hr, temp, spo2, pain_score}
    medications_given = Column(JSON)       # list of {name, dose, route, time}
    nurse_notes = Column(Text)
    wound_observations = Column(Text)
    pain_score = Column(Integer)           # 0-10
    overall_condition = Column(String(30), default='stable')  # improving/stable/worsening
    next_visit_recommendations = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)
    sent_to_family = Column(Boolean, default=False)
    sent_at = Column(DateTime)


class WoundCareLog(Base):
    """Per-wound photographic + descriptive healing progress log"""
    __tablename__ = 'wound_care_logs'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    wound_site = Column(String(100), nullable=False)   # e.g. "Left heel", "Sacrum"
    description = Column(Text)
    photo_path = Column(String(500))       # relative path under /static/wounds/
    healing_stage = Column(String(20), default='stable')  # improving/stable/worsening
    wound_type = Column(String(50))        # pressure_ulcer/surgical/diabetic/burn/other
    size_cm = Column(String(20))           # e.g. "3x2"
    depth = Column(String(30))             # superficial/partial/full/bone
    exudate = Column(String(30))           # none/minimal/moderate/heavy
    odour = Column(Boolean, default=False)
    treatment_applied = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class CaregiverRating(Base):
    """Patient/family 5-star rating after each completed visit"""
    __tablename__ = 'caregiver_ratings'
    id = Column(Integer, primary_key=True)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), nullable=False, index=True)
    caregiver_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    rating = Column(Integer, nullable=False)   # 1-5
    comment = Column(Text)
    category_scores = Column(JSON)  # {punctuality, communication, care_quality, cleanliness}
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CarePathwayPreference(Base):
    """Guided onboarding: patient/family selects their care pathway"""
    __tablename__ = 'care_pathway_preferences'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    pathway_type = Column(String(50), nullable=False)  # nursing/clinical/family/escort/respite
    selected_services = Column(JSON)   # list of service keys chosen
    primary_concern = Column(String(200))
    support_level = Column(String(20), default='standard')  # basic/standard/intensive
    selected_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# SERVICES PROVIDER MARKETPLACE MODELS
# ============================================================================

class ServiceTypeConfig(Base):
    """Service type definitions with role-specific MCQ assessment questions"""
    __tablename__ = 'service_type_configs'
    id = Column(Integer, primary_key=True)
    key = Column(String(50), unique=True, nullable=False, index=True)
    label = Column(String(100), nullable=False)
    description = Column(Text)
    icon_name = Column(String(50))
    color = Column(String(20))
    required_certifications = Column(JSON)
    assessment_questions = Column(JSON)
    min_pass_score = Column(Integer, default=70)
    is_active = Column(Boolean, default=True)


class ProviderApplication(Base):
    """Provider self-registration — pending admin review"""
    __tablename__ = 'provider_applications'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    service_type = Column(String(50), nullable=False)
    bio = Column(Text)
    years_experience = Column(Integer, default=0)
    qualifications = Column(JSON)
    document_paths = Column(JSON)
    assessment_answers = Column(JSON)
    assessment_score = Column(Float, default=0.0)
    approval_status = Column(String(20), default='pending')
    admin_notes = Column(Text)
    reviewed_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProviderAvailability(Base):
    """Weekly availability schedule for a provider"""
    __tablename__ = 'provider_availability'
    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    slot_duration_minutes = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)


class ProviderBooking(Base):
    """Booking request from patient/family/clinician to a provider"""
    __tablename__ = 'provider_bookings'
    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=True, index=True)
    booked_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    service_type = Column(String(50), nullable=False)
    requested_date = Column(DateTime, nullable=False)
    start_time = Column(String(5))
    duration_minutes = Column(Integer, default=60)
    status = Column(String(20), default='pending')
    notes = Column(Text)
    appointment_id = Column(Integer, ForeignKey('appointments.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# Database Initialization
# ============================================================================

def init_database():
    """Create all tables (21 original + 9 extension + password reset token + 4 Ghana features)"""
    from sqlalchemy import inspect, text
    Base.metadata.create_all(bind=engine)
    # Lightweight migration for columns added after initial schema
    try:
        inspector = inspect(engine)
        if 'patient_preferences' in inspector.get_table_names():
            cols = {c['name'] for c in inspector.get_columns('patient_preferences')}
            if 'primary_condition' not in cols:
                with engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE patient_preferences ADD COLUMN primary_condition VARCHAR(200)"
                    ))
        # Add family_consent to patients if missing
        if 'patients' in inspector.get_table_names():
            patient_cols = {c['name'] for c in inspector.get_columns('patients')}
            if 'family_consent' not in patient_cols:
                with engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE patients ADD COLUMN family_consent TEXT DEFAULT '{}'"
                    ))
        # Add care_provider_type and care_provider_name to spiritual_care_notes if missing
        if 'spiritual_care_notes' in inspector.get_table_names():
            scn_cols = {c['name'] for c in inspector.get_columns('spiritual_care_notes')}
            with engine.begin() as conn:
                if 'care_provider_type' not in scn_cols:
                    conn.execute(text(
                        "ALTER TABLE spiritual_care_notes ADD COLUMN care_provider_type VARCHAR(100)"
                    ))
                if 'care_provider_name' not in scn_cols:
                    conn.execute(text(
                        "ALTER TABLE spiritual_care_notes ADD COLUMN care_provider_name VARCHAR(200)"
                    ))
    except Exception as e:
        print(f"Schema migration note: {e}")

    # ── Services marketplace column migrations ────────────────────────────────
    try:
        inspector2 = inspect(engine)
        with engine.begin() as conn:
            # UserProfile new columns
            up_cols = {c['name'] for c in inspector2.get_columns('user_profiles')}
            if 'avatar_url' not in up_cols:
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN avatar_url VARCHAR(500)"))
            if 'address' not in up_cols:
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN address TEXT"))
            # User new columns
            u_cols = {c['name'] for c in inspector2.get_columns('users')}
            if 'gender' not in u_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR(20)"))
            if 'date_of_birth' not in u_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN date_of_birth TIMESTAMP"))
            if 'address' not in u_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN address TEXT"))
            if 'location' not in u_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN location VARCHAR(200)"))
    except Exception as e2:
        print(f"Services migration note: {e2}")

    print("All tables created/verified successfully")


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
    """Hash password using bcrypt via passlib.
    
    bcrypt has a hard 72-byte limit - truncate silently to stay compatible
    with the underlying C library while keeping the passlib wrapper happy.
    """
    return _pwd_ctx.hash(password[:72])


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash.

    Backward-compatible: old SHA-256 hashes are exactly 64 lowercase hex chars.
    bcrypt: truncate to 72 bytes to match how we hash.
    """
    if len(hashed) == 64 and all(c in '0123456789abcdef' for c in hashed.lower()):
        return hashlib.sha256(plain.encode()).hexdigest() == hashed
    return _pwd_ctx.verify(plain[:72], hashed)


def authenticate_user(username: str, password: str, db: Session) -> Optional[User]:
    """Authenticate user - uses verify_password for bcrypt + SHA-256 compat."""
    user = db.query(User).filter(User.username == username).first()
    if user and verify_password(password, user.hashed_password):
        user.last_login = datetime.utcnow()
        user.failed_logins = 0
        db.commit()
        return user
    return None


def get_all_patients(db: Session, status: Optional[str] = None) -> List[Patient]:
    """Get all patients"""
    query = db.query(Patient)
    if status:
        query = query.filter(Patient.status == status)
    return query.all()


def get_patient(db: Session, patient_id: int) -> Optional[Patient]:
    """Get patient by ID"""
    return db.query(Patient).filter(Patient.id == patient_id).first()


def get_recent_vitals(db: Session, patient_id: int, limit: int = 50) -> List[Vital]:
    """Get recent vitals"""
    return db.query(Vital).filter(
        Vital.patient_id == patient_id
    ).order_by(Vital.recorded_at.desc()).limit(limit).all()


def get_recent_symptoms(db: Session, patient_id: int, limit: int = 50) -> List[Symptom]:
    """Get recent symptoms"""
    return db.query(Symptom).filter(
        Symptom.patient_id == patient_id
    ).order_by(Symptom.recorded_at.desc()).limit(limit).all()


def get_predictions(db: Session, patient_id: int, limit: int = 10) -> List[Prediction]:
    """Get predictions"""
    return db.query(Prediction).filter(
        Prediction.patient_id == patient_id
    ).order_by(Prediction.predicted_at.desc()).limit(limit).all()


def get_pending_alerts(db: Session, patient_id: Optional[int] = None) -> List[Alert]:
    """Get pending alerts"""
    query = db.query(Alert).filter(Alert.is_acknowledged == False)
    if patient_id:
        query = query.filter(Alert.patient_id == patient_id)
    return query.order_by(Alert.created_at.desc()).all()


# ============================================================================
# MESSAGING SYSTEM TABLES (New)
# ============================================================================

class Conversation(Base):
    """Table 31: Private conversations between users"""
    __tablename__ = 'conversations'
    id = Column(Integer, primary_key=True)
    conversation_type = Column(String(30), default='private')  # private/group/support
    title = Column(String(200))  # Optional title for group conversations
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    # For support conversations - link to patient
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)
    # For alert-related conversations
    alert_id = Column(Integer, ForeignKey('alerts.id'))


class ConversationParticipant(Base):
    """Table 32: Participants in conversations"""
    __tablename__ = 'conversation_participants'
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), default='participant')  # participant/moderator/admin
    notification_enabled = Column(Boolean, default=True)


class Message(Base):
    """Table 33: Messages within conversations"""
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id'), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(30), default='text')  # text/alert/system/file
    # For alert messages
    alert_id = Column(Integer, ForeignKey('alerts.id'))
    # For system messages
    system_event = Column(String(100))  # user_joined/user_left/alert_triggered
    # Message metadata
    is_read = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime)
    # Attachments (for future use)
    attachment_url = Column(String(500))
    attachment_type = Column(String(50))
    # Priority for alert messages
    priority = Column(String(20), default='normal')  # normal/high/urgent
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class MessageRead(Base):
    """Table 34: Track which messages have been read by which users"""
    __tablename__ = 'message_reads'
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('messages.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    read_at = Column(DateTime, default=datetime.utcnow)


class MessageReaction(Base):
    """Table 35: Reactions to messages (like, acknowledge, etc.)"""
    __tablename__ = 'message_reactions'
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('messages.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    reaction_type = Column(String(30), nullable=False)  # thumbsup/heart/check/important
    created_at = Column(DateTime, default=datetime.utcnow)


class Contact(Base):
    """Table 36: User contacts (WhatsApp-style saved contacts)"""
    __tablename__ = 'contacts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)  # Owner of the contact list
    contact_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)  # The contact
    nickname = Column(String(100))  # Optional custom name for the contact
    is_favorite = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)
    added_at = Column(DateTime, default=datetime.utcnow)
    last_message_at = Column(DateTime)  # For sorting by recency
    message_count = Column(Integer, default=0)  # Track frequency
    notes = Column(Text)  # Optional notes about the contact
    
    # Ensure unique constraint: user can't add same contact twice
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )


class FileAttachment(Base):
    """Table 37: File uploads (images, videos, audio, documents)"""
    __tablename__ = 'file_attachments'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    filepath = Column(String(500), nullable=False)  # Relative path: messages/uuid.jpg
    file_size = Column(Integer, nullable=False)  # Bytes
    mime_type = Column(String(100), nullable=False)  # image/jpeg, video/mp4, etc
    file_category = Column(String(30))  # image, video, audio, document
    upload_category = Column(String(50))  # messages, legacy, memories, community, profiles, documents
    related_id = Column(Integer)  # ID of related entity (message_id, post_id, etc)
    description = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime)


# ============================================================================
# Helper Functions for Messaging
# ============================================================================

def get_or_create_conversation(db: Session, user1_id: int, user2_id: int, conversation_type: str = 'private') -> Conversation:
    """Get existing private conversation or create new one"""
    try:
        # Find all conversations where user1 is a participant
        user1_conversations = db.query(ConversationParticipant.conversation_id).filter(
            ConversationParticipant.user_id == user1_id,
            ConversationParticipant.is_active == True
        ).subquery()
        
        # Find conversations where both users are participants
        existing_conversation = db.query(Conversation).filter(
            Conversation.id.in_(user1_conversations),
            Conversation.conversation_type == conversation_type,
            Conversation.is_active == True
        ).join(ConversationParticipant).filter(
            ConversationParticipant.user_id == user2_id,
            ConversationParticipant.is_active == True
        ).first()
        
        if existing_conversation:
            return existing_conversation
        
        # Create new conversation
        conversation = Conversation(
            conversation_type=conversation_type,
            created_by=user1_id,
            last_message_at=datetime.utcnow()
        )
        db.add(conversation)
        db.flush()
        
        # Add participants
        for user_id in [user1_id, user2_id]:
            participant = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=user_id
            )
            db.add(participant)
        
        db.commit()
        db.refresh(conversation)
        
        return conversation
        
    except Exception as e:
        db.rollback()
        print(f"Error in get_or_create_conversation: {str(e)}")
        raise


def get_user_conversations(db: Session, user_id: int) -> List[dict]:
    """Get all conversations for a user with unread count"""
    conversations = db.query(Conversation).join(ConversationParticipant).filter(
        ConversationParticipant.user_id == user_id,
        ConversationParticipant.is_active == True,
        Conversation.is_active == True
    ).order_by(Conversation.last_message_at.desc()).all()
    
    result = []
    for conv in conversations:
        # Get participants
        participants = db.query(ConversationParticipant, User).join(
            User, ConversationParticipant.user_id == User.id
        ).filter(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.is_active == True
        ).all()
        
        # Get last message
        last_message = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.is_deleted == False
        ).order_by(Message.created_at.desc()).first()
        
        # Count unread messages
        participant_record = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.user_id == user_id
        ).first()
        
        unread_count = 0
        if participant_record and participant_record.last_read_at:
            unread_count = db.query(Message).filter(
                Message.conversation_id == conv.id,
                Message.created_at > participant_record.last_read_at,
                Message.sender_id != user_id,
                Message.is_deleted == False
            ).count()
        
        # Get other participants (exclude current user)
        other_participants = [
            {
                'id': p.User.id,
                'name': p.User.full_name,
                'role': p.User.role,
                'username': p.User.username
            }
            for p in participants if p.User.id != user_id
        ]
        
        result.append({
            'id': conv.id,
            'type': conv.conversation_type,
            'title': conv.title,
            'participants': other_participants,
            'last_message': {
                'content': last_message.content if last_message else None,
                'sender_id': last_message.sender_id if last_message else None,
                'created_at': last_message.created_at.isoformat() if last_message else None
            } if last_message else None,
            'unread_count': unread_count,
            'updated_at': conv.updated_at.isoformat(),
            'patient_id': conv.patient_id,
            'alert_id': conv.alert_id
        })
    
    return result


def get_conversation_messages(db: Session, conversation_id: int, limit: int = 50, offset: int = 0) -> List[dict]:
    """Get messages from a conversation"""
    messages = db.query(Message, User).join(
        User, Message.sender_id == User.id
    ).filter(
        Message.conversation_id == conversation_id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).limit(limit).offset(offset).all()
    
    result = []
    for msg, user in reversed(messages):  # Reverse to get chronological order
        result.append({
            'id': msg.id,
            'content': msg.content,
            'sender': {
                'id': user.id,
                'name': user.full_name,
                'role': user.role
            },
            'message_type': msg.message_type,
            'priority': msg.priority,
            'is_edited': msg.is_edited,
            'created_at': msg.created_at.isoformat(),
            'alert_id': msg.alert_id
        })
    
    return result


def send_message(db: Session, conversation_id: int, sender_id: int, content: str, 
                 message_type: str = 'text', priority: str = 'normal', alert_id: int = None) -> Message:
    """Send a message in a conversation"""
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type,
        priority=priority,
        alert_id=alert_id
    )
    db.add(message)
    
    # Update conversation last_message_at
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation:
        conversation.last_message_at = datetime.utcnow()
        conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return message


def mark_conversation_read(db: Session, conversation_id: int, user_id: int):
    """Mark all messages in a conversation as read for a user"""
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == user_id
    ).first()
    
    if participant:
        participant.last_read_at = datetime.utcnow()
        db.commit()


def get_unread_message_count(db: Session, user_id: int) -> int:
    """Get total unread message count for a user"""
    # Get all conversations for user
    conversations = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == user_id,
        ConversationParticipant.is_active == True
    ).all()
    
    total_unread = 0
    for participant in conversations:
        if participant.last_read_at:
            unread = db.query(Message).filter(
                Message.conversation_id == participant.conversation_id,
                Message.created_at > participant.last_read_at,
                Message.sender_id != user_id,
                Message.is_deleted == False
            ).count()
            total_unread += unread
    
    return total_unread



# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("[OK] All database tables created successfully")


def reset_db():
    """Drop and recreate all tables (WARNING: Deletes all data)"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] Database reset complete")


# ============================================================================
# BEREAVEMENT SUPPORT TABLES - Gap Analysis Priority 5
# ============================================================================

class BereavementScreening(Base):
    """
    Bereavement Screening (PG-13)
    Priority 5: Bereavement Support
    Addresses Finucane et al. (2024) - Evidence-based grief assessment
    
    Implements Prolonged Grief-13 (PG-13) questionnaire
    Validated tool for assessing complicated grief
    """
    __tablename__ = 'bereavement_screening'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), index=True)  # Patient who died
    responses = Column(JSON, nullable=False)  # 13 question responses (1-5 scale)
    score = Column(Integer, nullable=False)  # Total score (13-65)
    flagged = Column(Boolean, default=False)  # True if score >= 30 (complicated grief threshold)
    completed_at = Column(DateTime, default=datetime.utcnow, index=True)


class GriefJournal(Base):
    """
    Grief Journal Entries
    Priority 5: Bereavement Support
    
    Private journaling for bereaved family members
    Validated coping strategy for grief processing
    """
    __tablename__ = 'grief_journal'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    content = Column(Text, nullable=False)
    prompt_used = Column(String(500))  # Optional journaling prompt
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class PostDeathSchedule(Base):
    """
    Post-Death Support Schedule
    Priority 5: Bereavement Support
    Addresses Finucane et al. (2024) - Structured bereavement support timeline
    
    Automated timeline:
    - Day 1: Condolences + immediate resources
    - Week 1: Grief screening invitation
    - Month 1: Check-in + support group invite
    - Month 3: Complicated grief assessment
    - Month 6: Long-term support plan
    """
    __tablename__ = 'post_death_schedule'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    family_user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    type = Column(String(50), nullable=False)  # condolences, screening_invite, checkin, etc.
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# XAI (EXPLAINABLE AI) FEEDBACK TABLES
# ============================================================================

class FocusedExplanationFeedback(Base):
    """
    Clinician Feedback on Focused AI Explanations
    XAI Enhancement: Tracks feedback on specific vital/symptom/medication explanations
    
    Addresses gap: No clinician feedback mechanism for focused AI (only comprehensive AI had feedback)
    Enables continuous improvement of XAI explanations based on clinical expertise
    """
    __tablename__ = 'focused_explanation_feedback'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    clinician_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # What was explained
    focus_type = Column(String(50), nullable=False)  # vital, medication, symptom, alert, assessment
    focus_identifier = Column(String(200), nullable=False)  # e.g., "blood_pressure", "morphine", "alert_123", "PHQ-9"
    focus_value = Column(String(100))  # e.g., "160/95", "severe", "7/10"
    
    # Feedback
    feedback_type = Column(String(50), nullable=False)  # helpful, partially_helpful, not_helpful
    feedback_note = Column(Text)  # Optional detailed feedback
    
    # What was shown in the explanation
    risk_level_shown = Column(String(20))  # critical, warning, normal
    explanation_shown = Column(Text)  # The AI explanation that was provided
    recommendations_shown = Column(JSON)  # List of recommendations provided
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    session_identifier = Column(String(100))  # To track multiple feedbacks in same session


class ExplanationOverride(Base):
    """
    Admin Custom Explanation Rules
    XAI Enhancement: Allows facility-specific protocols and institutional knowledge
    
    Addresses gap: No way to add custom explanations or override AI with local guidelines
    Enables admin/senior clinicians to add facility-specific protocols that take priority over AI
    """
    __tablename__ = 'explanation_overrides'
    id = Column(Integer, primary_key=True)
    
    # Scope
    focus_type = Column(String(50), nullable=False)  # vital, medication, symptom, alert, assessment
    condition_rule = Column(Text, nullable=False)  # e.g., "blood_pressure_sys > 180 AND pain_level > 7"
    
    # Custom explanation
    custom_explanation = Column(Text, nullable=False)  # Override explanation text
    custom_recommendations = Column(JSON, nullable=False)  # List of custom recommendations
    custom_risk_level = Column(String(20))  # Optional: override risk level (critical, warning, normal)
    
    # Priority & Matching
    priority = Column(Integer, default=0, index=True)  # Higher priority rules checked first
    applies_to_facility = Column(String(200))  # Null = all facilities, or specific facility name
    applies_to_region = Column(String(50))  # Optional: region-specific rules
    
    # Governance
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    approved_by = Column(Integer, ForeignKey('users.id'))  # Senior clinician approval
    active = Column(Boolean, default=True, index=True)
    
    # Audit trail
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deactivated_at = Column(DateTime)
    deactivation_reason = Column(Text)
    
    # Usage tracking
    times_applied = Column(Integer, default=0)
    last_applied_at = Column(DateTime)


# ============================================================================
# PALLIATIVE CARE SETTINGS  --  5 Care Delivery Models
# ============================================================================

CARE_SETTING_TYPES = {
    "hospital_based": {
        "label": "Hospital-Based Palliative Care",
        "icon": "Building2",
        "color": "blue",
        "description": "Consult teams or dedicated inpatient units within an acute care hospital. Specialists manage sudden, complex symptoms, relieve acute pain, and guide families through intense medical crises while standard treatments are still being administered.",
        "focus": "Acute symptom management & complex medical crisis support",
        "who_it_serves": ["Patients admitted to hospital with acute, complex symptoms", "Patients still receiving curative or life-prolonging treatment", "Families in acute medical crisis"],
        "care_team_roles": ["Palliative Consultant", "Inpatient Nurse", "Social Worker", "Chaplain"],
        "key_interventions": ["Pain and symptom crisis management", "Goals-of-care discussions", "Family meetings during hospitalisation", "Coordination with acute medical teams", "Transition planning to home or hospice"],
        "indicators": ["sudden_pain_crisis", "hospitalisation", "complex_symptom_burden", "treatment_decision_support"],
        "typical_duration": "Days to weeks per episode",
        "outcome_focus": "Stabilise, then transition to appropriate ongoing setting",
    },
    "hospice": {
        "label": "Hospice Care",
        "icon": "Heart",
        "color": "rose",
        "description": "Intensive, comfort-first care specifically tailored for patients in the final months of life who have decided to stop all curative or life-prolonging medical treatments. Focuses deeply on dignity, psychological peace, and spiritual comfort.",
        "focus": "Comfort, dignity, and peaceful end-of-life",
        "who_it_serves": ["Patients with prognosis of ≤6 months", "Patients who have elected to stop curative treatment", "Families preparing for end-of-life"],
        "care_team_roles": ["Hospice Nurse", "Hospice Physician", "Chaplain", "Bereavement Counsellor", "Social Worker"],
        "key_interventions": ["Comfort-only medication management", "24/7 symptom support", "Spiritual and existential care", "Family emotional and practical support", "Bereavement preparation and follow-up"],
        "indicators": ["pps_score_under_40", "curative_treatment_stopped", "end_of_life_prognosis", "patient_comfort_goals"],
        "typical_duration": "Weeks to months (final phase of life)",
        "outcome_focus": "Peaceful, dignified death; family supported through bereavement",
    },
    "home_based": {
        "label": "Home-Based Palliative Care",
        "icon": "Home",
        "color": "green",
        "description": "Brings medical care directly to the patient's private home via a mobile team of visiting nurses, doctors, and social workers. They manage ongoing pain medications, assess comfort levels, and support family caregivers so the patient can stay in a familiar environment.",
        "focus": "Care in the patient's own home environment",
        "who_it_serves": ["Patients who prefer to remain at home", "Patients with stable but complex needs", "Family caregivers needing professional support at home"],
        "care_team_roles": ["Visiting Nurse", "Community Physician", "Social Worker", "Home Health Aide", "Pharmacist"],
        "key_interventions": ["Regular home visits for symptom assessment", "Medication management and titration", "Caregiver education and training", "24-hour telephone support line", "Coordination with community pharmacy"],
        "indicators": ["patient_home_preference", "stable_complex_needs", "family_caregiver_present", "community_living"],
        "typical_duration": "Months to years (as long as home care is appropriate)",
        "outcome_focus": "Maintain quality of life at home for as long as safely possible",
    },
    "outpatient_clinic": {
        "label": "Outpatient (Clinic) Palliative Care",
        "icon": "Stethoscope",
        "color": "teal",
        "description": "Operates out of regular medical clinics or day hospice centres where patients schedule daytime appointments. Palliative specialists review symptoms, adjust prescription dosages, and provide therapeutic counselling before sending the patient back home the same day.",
        "focus": "Regular clinic-based review and adjustment",
        "who_it_serves": ["Patients well enough to travel to clinic", "Patients needing regular medication review", "Patients in early-to-middle stages of illness"],
        "care_team_roles": ["Outpatient Palliative Physician", "Clinic Nurse", "Physiotherapist", "Dietitian", "Counsellor"],
        "key_interventions": ["Scheduled symptom review consultations", "Medication dose adjustment", "Psychosocial counselling sessions", "Nutritional assessment", "Referral to specialist services"],
        "indicators": ["ambulatory_patient", "stable_condition", "regular_review_needed", "community_dwelling"],
        "typical_duration": "Ongoing clinic appointments (monthly or as needed)",
        "outcome_focus": "Maintain function and symptom control in the community",
    },
    "long_term_residential": {
        "label": "Long-Term / Residential Palliative Care",
        "icon": "BedDouble",
        "color": "purple",
        "description": "Integrates comfort care plans directly into residential facilities like nursing homes or assisted living facilities. Provides continuous monitoring, personal care assistance, and symptom relief for elderly or frail individuals living with progressive, long-term chronic conditions.",
        "focus": "Continuous care for frail or elderly residents",
        "who_it_serves": ["Elderly or frail patients in nursing homes", "Patients with progressive chronic conditions", "Patients who cannot safely live independently"],
        "care_team_roles": ["Residential Nurse", "Care Home Physician", "Personal Care Aide", "Activity Therapist", "Dietitian"],
        "key_interventions": ["Continuous nursing supervision", "Personal care assistance (ADLs)", "Integrated comfort care planning", "Activity and social engagement programmes", "Family communication and involvement"],
        "indicators": ["residential_facility", "frailty", "progressive_chronic_condition", "care_dependency"],
        "typical_duration": "Long-term (months to years)",
        "outcome_focus": "Maintain quality of life and dignity in residential setting",
    },
}


class CareSettingTemplate(Base):
    """
    Palliative Care Setting Templates
    Stores the 5 care delivery models as reference data:
      1. Hospital-Based Palliative Care
      2. Hospice Care
      3. Home-Based Palliative Care
      4. Outpatient (Clinic) Palliative Care
      5. Long-Term / Residential Palliative Care
    """
    __tablename__ = 'care_setting_templates'
    id = Column(Integer, primary_key=True)
    setting_key = Column(String(50), unique=True, nullable=False, index=True)
    label = Column(String(200), nullable=False)
    icon = Column(String(50))
    color = Column(String(30))
    description = Column(Text, nullable=False)
    focus = Column(String(300))
    who_it_serves = Column(JSON)       # list of strings
    care_team_roles = Column(JSON)     # list of roles
    key_interventions = Column(JSON)   # list of interventions
    indicators = Column(JSON)          # list of clinical indicators
    typical_duration = Column(String(200))
    outcome_focus = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PatientCareSetting(Base):
    """
    Patient assignment to a specific care setting.
    A patient can transition through multiple settings over time.
    """
    __tablename__ = 'patient_care_settings'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    setting_key = Column(String(50), ForeignKey('care_setting_templates.setting_key'), nullable=False)
    assigned_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_current = Column(Boolean, default=True, index=True)
    transition_reason = Column(Text)    # Why patient moved to this setting
    facility_name = Column(String(200)) # Specific facility within this setting
    visit_frequency = Column(String(100))  # e.g., "Twice weekly"
    primary_contact = Column(String(200))  # Care coordinator name/number
    notes = Column(Text)
    ended_at = Column(DateTime)         # When patient transitioned away
    ended_reason = Column(Text)         # Why this setting ended


class CareSettingInteraction(Base):
    """
    Logs every interaction type per role per care setting.
    Used to populate the database of how each user type interacts with the system
    in the context of each care setting.
    """
    __tablename__ = 'care_setting_interactions'
    id = Column(Integer, primary_key=True)
    setting_key = Column(String(50), ForeignKey('care_setting_templates.setting_key'), nullable=False, index=True)
    user_role = Column(String(30), nullable=False, index=True)  # admin/clinician/caregiver/patient/family
    interaction_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    system_features_used = Column(JSON)   # list of features/pages used for this interaction
    frequency = Column(String(50))        # daily/weekly/per-visit/as-needed
    priority = Column(String(20), default='medium')  # critical/high/medium/low
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Comprehensive AI Tables (moved from add_comprehensive_ai_tables.py) ──────

class PatientAllergy(Base):
    """Patient Allergies - Critical for medication safety"""
    __tablename__ = 'patient_allergies'
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    allergen_type = Column(String(50), nullable=False)
    allergen_name = Column(String(200), nullable=False)
    reaction_severity = Column(String(20))
    reaction_description = Column(Text)
    onset_date = Column(DateTime)
    verified_by = Column(Integer, ForeignKey('users.id'))
    verified_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class MedicationEffect(Base):
    """Track medication effects - both intended and adverse"""
    __tablename__ = 'medication_effects'
    id = Column(Integer, primary_key=True)
    medication_id = Column(Integer, ForeignKey('medications.id'), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    effect_type = Column(String(30), nullable=False)
    effect_description = Column(String(200), nullable=False)
    severity = Column(String(20))
    onset_date = Column(DateTime)
    resolution_date = Column(DateTime)
    reported_by_patient = Column(Boolean, default=False)
    reported_by_clinician_id = Column(Integer, ForeignKey('users.id'))
    action_taken = Column(Text)
    is_ongoing = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
