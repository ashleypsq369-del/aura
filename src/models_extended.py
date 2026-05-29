"""
Extended Database Models for Comprehensive Hospice Care
Adds 17 new tables to support medication management, scheduling, care plans, etc.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Date, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# ============================================================================
# Medication Management Models
# ============================================================================

class Medication(Base):
    """Medication master data"""
    __tablename__ = 'medications'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    generic_name = Column(String(200))
    drug_class = Column(String(100))
    common_dosages = Column(JSON)
    side_effects = Column(JSON)
    interactions = Column(JSON)
    contraindications = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    prescriptions = relationship("Prescription", back_populates="medication")


class Prescription(Base):
    """Patient medication prescriptions"""
    __tablename__ = 'prescriptions'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    medication_id = Column(Integer, ForeignKey('medications.id'), nullable=False)
    prescribed_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    route = Column(String(50))
    instructions = Column(Text)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    is_prn = Column(Boolean, default=False)
    prn_indication = Column(String(200))
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    medication = relationship("Medication", back_populates="prescriptions")
    administrations = relationship("MedicationAdministration", back_populates="prescription")


class MedicationAdministration(Base):
    """Medication administration records"""
    __tablename__ = 'medication_administrations'
    
    id = Column(Integer, primary_key=True)
    prescription_id = Column(Integer, ForeignKey('prescriptions.id'), nullable=False)
    administered_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    administered_at = Column(DateTime, nullable=False)
    dosage_given = Column(String(100))
    route_used = Column(String(50))
    
    was_effective = Column(Boolean)
    side_effects_noted = Column(Text)
    pain_before = Column(Integer)
    pain_after = Column(Integer)
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    prescription = relationship("Prescription", back_populates="administrations")


# ============================================================================
# Appointment & Scheduling Models
# ============================================================================

class Appointment(Base):
    """Patient appointments and visits"""
    __tablename__ = 'appointments'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    scheduled_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    assigned_to = Column(Integer, ForeignKey('users.id'))
    
    appointment_type = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=60)
    
    location = Column(String(200))
    is_virtual = Column(Boolean, default=False)
    meeting_link = Column(String(500))
    
    status = Column(String(50), default='scheduled')
    completion_notes = Column(Text)
    completed_at = Column(DateTime)
    
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CareTeamMember(Base):
    """Care team assignments"""
    __tablename__ = 'care_team_members'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    role = Column(String(100), nullable=False)
    is_primary = Column(Boolean, default=False)
    specialties = Column(JSON)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    is_active = Column(Boolean, default=True)
    
    contact_preference = Column(String(50))
    emergency_contact = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Caregiver & Communication Models
# ============================================================================

class Task(Base):
    """Care team tasks"""
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    assigned_to = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    task_type = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    
    priority = Column(String(50), default='medium')
    status = Column(String(50), default='pending')
    
    due_date = Column(DateTime)
    completed_at = Column(DateTime)
    completion_notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CommunicationLog(Base):
    """Communication tracking"""
    __tablename__ = 'communication_logs'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    from_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    to_user_id = Column(Integer, ForeignKey('users.id'))
    
    communication_type = Column(String(50), nullable=False)
    subject = Column(String(200))
    content = Column(Text, nullable=False)
    
    is_urgent = Column(Boolean, default=False)
    requires_response = Column(Boolean, default=False)
    response_by_date = Column(DateTime)
    
    status = Column(String(50), default='sent')
    
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# Memory Vault & Journal Models
# ============================================================================

class MemoryEntry(Base):
    """Digital memory preservation"""
    __tablename__ = 'memory_entries'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    entry_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    
    file_path = Column(String(500))
    file_type = Column(String(50))
    file_size = Column(Integer)
    
    tags = Column(JSON)
    is_private = Column(Boolean, default=False)
    shared_with = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JournalEntry(Base):
    """Personal journal entries"""
    __tablename__ = 'journal_entries'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    entry_date = Column(Date, nullable=False)
    mood_rating = Column(Integer)
    energy_level = Column(Integer)
    
    title = Column(String(200))
    content = Column(Text, nullable=False)
    
    is_private = Column(Boolean, default=True)
    shared_with_care_team = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# Care Plan Models
# ============================================================================

class CarePlan(Base):
    """Personalized care plans"""
    __tablename__ = 'care_plans'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    plan_name = Column(String(200), nullable=False)
    description = Column(Text)
    
    comfort_goals = Column(JSON)
    functional_goals = Column(JSON)
    psychosocial_goals = Column(JSON)
    spiritual_goals = Column(JSON)
    
    cultural_preferences = Column(JSON)
    religious_preferences = Column(JSON)
    communication_preferences = Column(JSON)
    
    advance_directives = Column(JSON)
    dnr_status = Column(String(50))
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    goals = relationship("CareGoal", back_populates="care_plan")
    interventions = relationship("CareIntervention", back_populates="care_plan")


class CareGoal(Base):
    """Individual care goals"""
    __tablename__ = 'care_goals'
    
    id = Column(Integer, primary_key=True)
    care_plan_id = Column(Integer, ForeignKey('care_plans.id'), nullable=False)
    
    goal_category = Column(String(100), nullable=False)
    goal_description = Column(Text, nullable=False)
    target_outcome = Column(Text)
    
    priority = Column(String(50), default='medium')
    status = Column(String(50), default='active')
    
    target_date = Column(Date)
    achieved_date = Column(Date)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    care_plan = relationship("CarePlan", back_populates="goals")
    interventions = relationship("CareIntervention", back_populates="goal")


class CareIntervention(Base):
    """Care interventions and actions"""
    __tablename__ = 'care_interventions'
    
    id = Column(Integer, primary_key=True)
    care_plan_id = Column(Integer, ForeignKey('care_plans.id'), nullable=False)
    goal_id = Column(Integer, ForeignKey('care_goals.id'))
    
    intervention_type = Column(String(100), nullable=False)
    intervention_description = Column(Text, nullable=False)
    
    frequency = Column(String(100))
    assigned_to_role = Column(String(100))
    
    is_active = Column(Boolean, default=True)
    effectiveness_rating = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    care_plan = relationship("CarePlan", back_populates="interventions")
    goal = relationship("CareGoal", back_populates="interventions")


# ============================================================================
# Enhanced Bereavement Models
# ============================================================================

class GriefAssessment(Base):
    """Grief assessment and tracking"""
    __tablename__ = 'grief_assessments'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    assessed_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    family_member_id = Column(Integer, ForeignKey('users.id'))
    
    assessment_date = Column(Date, nullable=False)
    
    sadness_level = Column(Integer)
    anger_level = Column(Integer)
    anxiety_level = Column(Integer)
    guilt_level = Column(Integer)
    loneliness_level = Column(Integer)
    
    coping_strategies = Column(JSON)
    support_system_strength = Column(Integer)
    
    risk_factors = Column(JSON)
    protective_factors = Column(JSON)
    
    recommended_interventions = Column(JSON)
    referrals_made = Column(JSON)
    
    follow_up_date = Column(Date)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class BereavementResource(Base):
    """Bereavement support resources"""
    __tablename__ = 'bereavement_resources'
    
    id = Column(Integer, primary_key=True)
    
    resource_type = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    
    content_url = Column(String(500))
    file_path = Column(String(500))
    
    target_audience = Column(JSON)
    grief_stage = Column(JSON)
    
    tags = Column(JSON)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BereavementPlan(Base):
    """Personalized bereavement support plans"""
    __tablename__ = 'bereavement_plans'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    plan_name = Column(String(200), nullable=False)
    
    primary_contacts = Column(JSON)
    children_info = Column(JSON)
    cultural_considerations = Column(JSON)
    
    immediate_support = Column(JSON)
    short_term_support = Column(JSON)
    long_term_support = Column(JSON)
    
    memorial_preferences = Column(JSON)
    anniversary_reminders = Column(JSON)
    
    is_active = Column(Boolean, default=True)
    activated_date = Column(Date)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================================
# Functional Status & Quality of Life Models
# ============================================================================

class FunctionalStatus(Base):
    """Functional status tracking"""
    __tablename__ = 'functional_status'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    assessed_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    assessment_date = Column(Date, nullable=False)
    
    bathing = Column(Integer)
    dressing = Column(Integer)
    toileting = Column(Integer)
    transferring = Column(Integer)
    continence = Column(Integer)
    feeding = Column(Integer)
    
    cooking = Column(Integer)
    housekeeping = Column(Integer)
    laundry = Column(Integer)
    transportation = Column(Integer)
    medication_management = Column(Integer)
    financial_management = Column(Integer)
    
    ambulation = Column(Integer)
    balance = Column(Integer)
    
    orientation = Column(Integer)
    memory = Column(Integer)
    decision_making = Column(Integer)
    
    total_adl_score = Column(Integer)
    total_iadl_score = Column(Integer)
    
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class QualityOfLifeAssessment(Base):
    """Quality of life tracking"""
    __tablename__ = 'qol_assessments'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False)
    assessed_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    assessment_date = Column(Date, nullable=False)
    
    pain_management = Column(Integer)
    energy_level = Column(Integer)
    sleep_quality = Column(Integer)
    appetite = Column(Integer)
    mobility = Column(Integer)
    
    mood = Column(Integer)
    anxiety_level = Column(Integer)
    depression_indicators = Column(Integer)
    
    family_relationships = Column(Integer)
    social_connections = Column(Integer)
    communication_satisfaction = Column(Integer)
    
    spiritual_comfort = Column(Integer)
    meaning_purpose = Column(Integer)
    peace_acceptance = Column(Integer)
    
    overall_qol = Column(Integer)
    most_important_concerns = Column(JSON)
    
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
