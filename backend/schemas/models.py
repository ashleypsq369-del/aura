"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class UserRole(str, Enum):
    admin = "admin"
    clinician = "clinician"
    caregiver = "caregiver"
    patient = "patient"
    family = "family"


class PatientStatus(str, Enum):
    active = "active"
    deceased = "deceased"


class AlertType(str, Enum):
    deterioration = "deterioration"
    critical_vital = "critical_vital"
    symptom_spike = "symptom_spike"
    medication = "medication"


# ============================================================================
# Auth Schemas
# ============================================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    email: str
    name: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# Patient Schemas
# ============================================================================

class PatientCreate(BaseModel):
    patient_code: str
    age: int
    gender: str
    ethnicity: str
    admission_date: Optional[datetime] = None


class PatientResponse(BaseModel):
    id: int
    patient_code: str
    age: int
    gender: str
    ethnicity: str
    admission_date: datetime
    status: PatientStatus
    death_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    patients: List[PatientResponse]
    total: int


# ============================================================================
# Vitals Schemas
# ============================================================================

class VitalCreate(BaseModel):
    patient_id: int
    heart_rate: float = Field(..., ge=0, le=300)
    blood_pressure_sys: float = Field(..., ge=0, le=300)
    blood_pressure_dia: float = Field(..., ge=0, le=200)
    oxygen_saturation: float = Field(..., ge=0, le=100)
    temperature: float = Field(..., ge=90, le=110)


class VitalResponse(BaseModel):
    id: int
    patient_id: int
    recorded_by: int
    timestamp: datetime
    heart_rate: float
    blood_pressure_sys: float
    blood_pressure_dia: float
    oxygen_saturation: float
    temperature: float

    class Config:
        from_attributes = True


# ============================================================================
# Symptom Schemas
# ============================================================================

class SymptomCreate(BaseModel):
    patient_id: int
    pain_level: int = Field(..., ge=0, le=10)
    nausea: bool = False
    fatigue: bool = False
    anxiety: bool = False
    notes: Optional[str] = None


class SymptomResponse(BaseModel):
    id: int
    patient_id: int
    recorded_by: int
    timestamp: datetime
    pain_level: int
    nausea: bool
    fatigue: bool
    anxiety: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# AI Prediction Schemas
# ============================================================================

class PredictionRequest(BaseModel):
    patient_id: int


class PredictionResponse(BaseModel):
    care_pathway: str
    risk_score: float
    confidence: float
    shap_values: Optional[Dict[str, float]] = None
    explanation: str
    timestamp: datetime


class WhatIfRequest(BaseModel):
    patient_id: int
    modified_features: Dict[str, float]


class WhatIfResponse(BaseModel):
    original_prediction: PredictionResponse
    new_prediction: PredictionResponse
    feature_changes: Dict[str, Dict[str, float]]


# ============================================================================
# Alert Schemas
# ============================================================================

class AlertResponse(BaseModel):
    id: int
    patient_id: int
    triggered_at: datetime
    alert_type: str
    message: str
    sent_to: List[int]
    acknowledged: bool

    class Config:
        from_attributes = True


class AlertAcknowledge(BaseModel):
    alert_id: int


# ============================================================================
# Medication Schemas
# ============================================================================

class MedicationCreate(BaseModel):
    patient_id: int
    medication_name: str
    dosage: str
    frequency: str
    route: str
    start_date: datetime
    end_date: Optional[datetime] = None
    instructions: Optional[str] = None


class MedicationResponse(BaseModel):
    id: int
    patient_id: int
    medication_name: str
    dosage: str
    frequency: str
    route: str
    start_date: datetime
    end_date: Optional[datetime]
    instructions: Optional[str]
    active: bool

    class Config:
        from_attributes = True


class MedicationAdministration(BaseModel):
    medication_id: int
    administered_at: datetime
    administered_by: int
    notes: Optional[str] = None


# ============================================================================
# Appointment Schemas
# ============================================================================

class AppointmentCreate(BaseModel):
    patient_id: int
    appointment_type: str
    scheduled_at: datetime
    duration_minutes: int = 30
    provider: str
    location: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    appointment_type: str
    scheduled_at: datetime
    duration_minutes: int
    provider: str
    location: Optional[str]
    notes: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Bereavement Schemas
# ============================================================================

class BereavementEntryCreate(BaseModel):
    patient_id: int
    entry_type: str  # 'journal' or 'memory'
    content: str


class BereavementEntryResponse(BaseModel):
    id: int
    patient_id: int
    user_id: int
    entry_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class BereavementActivate(BaseModel):
    patient_id: int


# ============================================================================
# Dashboard Schemas
# ============================================================================

class DashboardSummary(BaseModel):
    role: UserRole
    total_patients: int
    high_risk_patients: int
    alerts_today: int
    avg_pain_score: float
    recent_alerts: List[AlertResponse]
    role_specific_data: Dict[str, Any]


# ============================================================================
# Caregiver Schemas
# ============================================================================

class CaregiverCreate(BaseModel):
    patient_id: int
    name: str
    relationship: str
    phone: str
    email: Optional[EmailStr] = None
    is_primary: bool = False


class CaregiverResponse(BaseModel):
    id: int
    patient_id: int
    name: str
    relationship: str
    phone: str
    email: Optional[str]
    is_primary: bool

    class Config:
        from_attributes = True
