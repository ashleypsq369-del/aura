"""
Database layer for Project Aura
Implements SQLAlchemy ORM models and database operations
"""

import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import hashlib

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///aura.db')

# Create engine and session
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============================================================================
# SQLAlchemy Models
# ============================================================================

class User(Base):
    """User model for authentication and role management"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False)  # 'clinician' or 'family'
    email = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vitals_recorded = relationship('Vital', back_populates='recorder', foreign_keys='Vital.recorded_by')
    symptoms_recorded = relationship('Symptom', back_populates='recorder', foreign_keys='Symptom.recorded_by')
    bereavement_entries = relationship('BereavementEntry', back_populates='user')


class Patient(Base):
    """Patient model for synthetic patient records"""
    __tablename__ = 'patients'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_code = Column(String(50), unique=True, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    ethnicity = Column(String(50), nullable=False)
    admission_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='active')  # 'active' or 'deceased'
    death_date = Column(DateTime, nullable=True)
    
    # Relationships
    vitals = relationship('Vital', back_populates='patient', cascade='all, delete-orphan')
    symptoms = relationship('Symptom', back_populates='patient', cascade='all, delete-orphan')
    predictions = relationship('Prediction', back_populates='patient', cascade='all, delete-orphan')
    alerts = relationship('Alert', back_populates='patient', cascade='all, delete-orphan')
    bereavement_entries = relationship('BereavementEntry', back_populates='patient', cascade='all, delete-orphan')


class Vital(Base):
    """Vital signs records"""
    __tablename__ = 'vitals'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    heart_rate = Column(Float, nullable=False)
    blood_pressure_sys = Column(Float, nullable=False)
    blood_pressure_dia = Column(Float, nullable=False)
    oxygen_saturation = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    
    # Relationships
    patient = relationship('Patient', back_populates='vitals')
    recorder = relationship('User', back_populates='vitals_recorded', foreign_keys=[recorded_by])


class Symptom(Base):
    """Symptom logs"""
    __tablename__ = 'symptoms'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey('patients.id'), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    pain_level = Column(Integer, nullable=False)  # 0-10 scale
    nausea = Column(Boolean, default=False)
    fatigue = Column(Boolean, default=False)
    anxiety = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    patient = relationship('Patient', back_populates='symptoms')
    recorder = relationship('User', back_populates='symptoms_recorded', foreign_keys=[recorded_by])


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
            password_hash=password_hash,
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
            User.password_hash == password_hash
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


# Import timedelta for time calculations
from datetime import timedelta


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



# ============================================================================
# Authentication Functions (for direct SQLite access)
# ============================================================================

import sqlite3
def get_connection():
    """Get database connection"""
    import sqlite3
    conn = sqlite3.connect('aura.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def authenticate_user(username: str, password: str):
    """
    Authenticate user with username and password
    Returns user object if successful, None otherwise
    """
    # Hash the password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # Connect to database
    conn = sqlite3.connect('aura.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Query user
    cursor.execute('''
        SELECT user_id as id, username, name, role, email
        FROM User
        WHERE username = ? AND password = ?
    ''', (username, password_hash))
    
    user_row = cursor.fetchone()
    conn.close()
    
    if user_row:
        # Create a simple user object
        class SimpleUser:
            def __init__(self, row):
                self.id = row['id']
                self.username = row['username']
                self.name = row['name']
                self.role = row['role']
                self.email = row['email']
        
        return SimpleUser(user_row)
    
    return None


def get_user_by_id(user_id: int):
    """Get user by ID"""
    conn = sqlite3.connect('aura.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT user_id as id, username, name, role, email
        FROM User
        WHERE user_id = ?
    ''', (user_id,))
    
    user_row = cursor.fetchone()
    conn.close()
    
    if user_row:
        class SimpleUser:
            def __init__(self, row):
                self.id = row['id']
                self.username = row['username']
                self.name = row['name']
                self.role = row['role']
                self.email = row['email']
        
        return SimpleUser(user_row)
    
    return None
