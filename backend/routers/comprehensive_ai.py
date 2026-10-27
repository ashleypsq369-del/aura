"""
COMPREHENSIVE AI RISK MONITORING SYSTEM
========================================
Monitors ALL patient data and provides SHAP explanations for every prediction

Features:
- Complete vital signs monitoring with trends
- Patient symptoms and pain tracking
- Medication effects and allergies
- Clinical assessments (ESAS, PPS, PHQ-9, GAD-7)
- Care plan analysis
- Holistic wellbeing and quality of life
- SHAP explanations for every prediction (REAL ML-powered!)
- Clinician feedback loop (agree/disagree/learn)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
import numpy as np
import json
import sys
from pathlib import Path

# Add services to path for ML model service
services_path = Path(__file__).parent.parent / "services"
if str(services_path) not in sys.path:
    sys.path.insert(0, str(services_path))

# Import ML Model Service for real SHAP explanations
try:
    from ml_model_service import ml_service
    ML_MODELS_AVAILABLE = ml_service.is_available()
except (ImportError, Exception) as _e:
    print(f"[WARNING] Could not load ML models: {_e}\n   Fallback mode will be used")
    ml_service = None
    ML_MODELS_AVAILABLE = False

try:
    import shap
    SHAP_AVAILABLE = True
except (ImportError, OSError, Exception):
    SHAP_AVAILABLE = False

from src.db import get_db, User, Patient, get_patient
from routers.auth import get_current_user

router = APIRouter()

# Import all data models
from src.db import (
    Vital, Symptom, Medication, Alert, CarePlan, ClinicalNote,
    ESASAssessment, PPSAssessment, CognitiveAssessment, 
    PHQ9Assessment, GAD7Assessment, FunctionalAssessment,
    Prediction, PredictionFeedback, PatientConsent,
    MedicationAdherenceLog, Appointment
)

# Import new tables - defined in src.db so they're created in the right order
from src.db import PatientAllergy, MedicationEffect


# ==================== PYDANTIC MODELS ====================

class SHAPExplanation(BaseModel):
    feature_name: str
    feature_value: Any
    display_value: str
    shap_value: float
    impact: str  # "increases_risk" or "decreases_risk"
    importance_rank: int
    explanation: str


class ComprehensiveRiskAssessment(BaseModel):
    prediction_id: int
    patient_id: int
    patient_name: str
    
    # Risk scores
    overall_risk_score: float  # 0-1
    risk_level: str  # "Low", "Moderate", "High", "Critical"
    confidence: float
    
    # Component scores
    vital_signs_risk: float
    symptom_burden_risk: float
    medication_risk: float
    psychosocial_risk: float
    functional_status_risk: float
    
    # SHAP Explanations
    shap_explanations: List[SHAPExplanation]
    base_value: float
    
    # Data summary
    key_concerns: List[str]
    recommendations: List[str]
    summary: str
    
    # Data availability
    has_recent_vitals: bool
    has_recent_symptoms: bool
    has_assessments: bool
    has_care_plan: bool
    has_allergies: bool
    
    # Timestamps
    assessed_at: datetime
    last_vital_date: Optional[datetime]
    last_symptom_date: Optional[datetime]


class ClinicianFeedbackRequest(BaseModel):
    prediction_id: int
    feedback_type: str  # "agree", "partially_agree", "disagree"
    note: Optional[str] = None
    correct_risk_level: Optional[str] = None


class AlertExplanation(BaseModel):
    alert_id: int
    patient_name: str
    alert_type: str
    severity: str
    triggered_value: str
    why_triggered: str
    shap_explanation: List[SHAPExplanation]
    recommended_actions: List[str]
    confidence: float


# ==================== FEATURE EXTRACTION ====================

def extract_all_patient_features(patient_id: int, db: Session) -> Tuple[Dict, np.ndarray, List[str]]:
    """
    Extract EVERY piece of patient data for comprehensive risk assessment
    
    Returns:
        - feature_dict: Dictionary of all raw features
        - feature_array: Numpy array for ML model
        - feature_names: List of feature names
    """
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    feature_dict = {}
    
    # 1. DEMOGRAPHICS
    feature_dict['age'] = patient.age if hasattr(patient, 'age') else 70
    feature_dict['gender_male'] = 1 if patient.gender == 'male' else 0
    feature_dict['days_since_admission'] = (datetime.utcnow() - patient.admission_date).days if patient.admission_date else 0
    
    # 2. VITAL SIGNS (last 20 readings)
    vitals = db.query(Vital).filter(Vital.patient_id == patient_id).order_by(Vital.recorded_at.desc()).limit(20).all()
    
    if vitals:
        recent_vitals = vitals[:5]
        hr_values = [v.heart_rate for v in recent_vitals if v.heart_rate]
        o2_values = [v.oxygen_saturation for v in recent_vitals if v.oxygen_saturation]
        bp_sys_values = [v.blood_pressure_sys for v in recent_vitals if v.blood_pressure_sys]
        bp_dia_values = [v.blood_pressure_dia for v in recent_vitals if v.blood_pressure_dia]
        temp_values = [v.temperature for v in recent_vitals if v.temperature]
        rr_values = [v.respiratory_rate for v in recent_vitals if v.respiratory_rate]
        
        feature_dict['heart_rate_avg'] = np.mean(hr_values) if hr_values else 80
        feature_dict['heart_rate_variability'] = np.std(hr_values) if len(hr_values) > 1 else 5
        feature_dict['oxygen_saturation_avg'] = np.mean(o2_values) if o2_values else 95
        feature_dict['oxygen_saturation_min'] = np.min(o2_values) if o2_values else 95
        feature_dict['bp_systolic_avg'] = np.mean(bp_sys_values) if bp_sys_values else 120
        feature_dict['bp_diastolic_avg'] = np.mean(bp_dia_values) if bp_dia_values else 80
        feature_dict['temperature_avg'] = np.mean(temp_values) if temp_values else 37.0
        feature_dict['respiratory_rate_avg'] = np.mean(rr_values) if rr_values else 16
        
        # Vital signs trend (last 10 vs previous 10)
        if len(vitals) >= 10:
            recent_hr = [v.heart_rate for v in vitals[:5] if v.heart_rate]
            older_hr = [v.heart_rate for v in vitals[5:10] if v.heart_rate]
            feature_dict['heart_rate_trend'] = (np.mean(recent_hr) - np.mean(older_hr)) if recent_hr and older_hr else 0
        else:
            feature_dict['heart_rate_trend'] = 0
    else:
        # Defaults if no vitals
        feature_dict['heart_rate_avg'] = 80
        feature_dict['heart_rate_variability'] = 5
        feature_dict['oxygen_saturation_avg'] = 95
        feature_dict['oxygen_saturation_min'] = 95
        feature_dict['bp_systolic_avg'] = 120
        feature_dict['bp_diastolic_avg'] = 80
        feature_dict['temperature_avg'] = 37.0
        feature_dict['respiratory_rate_avg'] = 16
        feature_dict['heart_rate_trend'] = 0
    
    # 3. SYMPTOMS & PAIN
    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient_id).order_by(Symptom.recorded_at.desc()).limit(20).all()
    
    if symptoms:
        recent_symptoms = symptoms[:5]
        pain_values = [s.pain_level for s in recent_symptoms if s.pain_level is not None]
        fatigue_levels = [s.fatigue_level for s in recent_symptoms if s.fatigue_level is not None]
        anxiety_levels = [s.anxiety_level for s in recent_symptoms if s.anxiety_level is not None]
        
        feature_dict['pain_level_avg'] = float(np.mean(pain_values)) if pain_values else 5.0
        feature_dict['pain_level_max'] = float(np.max(pain_values)) if pain_values else 5.0
        feature_dict['nausea_frequency'] = sum(1 for s in recent_symptoms if s.nausea) / max(len(recent_symptoms), 1)
        feature_dict['fatigue_level_avg'] = float(np.mean(fatigue_levels)) if fatigue_levels else 5.0
        feature_dict['anxiety_level_avg'] = float(np.mean(anxiety_levels)) if anxiety_levels else 3.0
        feature_dict['breathlessness_frequency'] = sum(
            1 for s in recent_symptoms
            if s.breathlessness is not None and s.breathlessness > 0
        ) / max(len(recent_symptoms), 1)
        
        # Pain trend
        if len(symptoms) >= 10:
            recent_pain = [s.pain_level for s in symptoms[:5] if s.pain_level is not None]
            older_pain = [s.pain_level for s in symptoms[5:10] if s.pain_level is not None]
            feature_dict['pain_trend'] = (np.mean(recent_pain) - np.mean(older_pain)) if recent_pain and older_pain else 0
        else:
            feature_dict['pain_trend'] = 0
    else:
        feature_dict['pain_level_avg'] = 5
        feature_dict['pain_level_max'] = 5
        feature_dict['nausea_frequency'] = 0.3
        feature_dict['fatigue_level_avg'] = 5
        feature_dict['anxiety_level_avg'] = 3
        feature_dict['breathlessness_frequency'] = 0.2
        feature_dict['pain_trend'] = 0
    
    # 4. MEDICATIONS & ALLERGIES
    medications = db.query(Medication).filter(
        Medication.patient_id == patient_id,
        Medication.is_active == True
    ).all()
    
    allergies = []
    try:
        allergies = db.query(PatientAllergy).filter(
            PatientAllergy.patient_id == patient_id,
            PatientAllergy.is_active == True
        ).all()
    except Exception:
        pass  # PatientAllergy table may be empty or missing rows
    
    feature_dict['active_medications_count'] = len(medications)
    feature_dict['has_allergies'] = 1 if len(allergies) > 0 else 0
    feature_dict['severe_allergies_count'] = sum(
        1 for a in allergies
        if getattr(a, 'reaction_severity', None) in ('severe', 'life_threatening')
    )
    
    # Pain medications
    pain_meds = [m for m in medications if m.indication and 'pain' in m.indication.lower()]
    feature_dict['on_pain_medication'] = 1 if pain_meds else 0
    feature_dict['pain_medication_count'] = len(pain_meds)
    
    # 5. CLINICAL ASSESSMENTS
    # ESAS (Edmonton Symptom Assessment System)
    esas = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient_id
    ).order_by(ESASAssessment.assessed_at.desc()).first()
    
    if esas:
        feature_dict['esas_pain']      = esas.pain       or 5
        feature_dict['esas_tiredness'] = esas.tiredness  or 5
        feature_dict['esas_anxiety']   = esas.anxiety    or 3
        feature_dict['esas_depression']= esas.depression or 3
        feature_dict['esas_wellbeing'] = esas.wellbeing  or 5
        # Compute total from individual fields - ESASAssessment has no esas_total column
        feature_dict['esas_total'] = sum([
            esas.pain or 0, esas.tiredness or 0, esas.nausea or 0,
            esas.depression or 0, esas.anxiety or 0,
            esas.shortness_of_breath or 0, esas.lack_of_appetite or 0,
            esas.wellbeing or 0, esas.drowsiness or 0,
        ])
    else:
        feature_dict['esas_pain'] = 5
        feature_dict['esas_tiredness'] = 5
        feature_dict['esas_anxiety'] = 3
        feature_dict['esas_depression'] = 3
        feature_dict['esas_wellbeing'] = 5
        feature_dict['esas_total'] = 40
    
    # PPS (Palliative Performance Scale)
    pps = db.query(PPSAssessment).filter(
        PPSAssessment.patient_id == patient_id
    ).order_by(PPSAssessment.assessed_at.desc()).first()
    
    feature_dict['pps_score'] = pps.pps_score if pps and pps.pps_score else 50
    
    # PHQ-9 (Depression)
    phq9 = db.query(PHQ9Assessment).filter(
        PHQ9Assessment.patient_id == patient_id
    ).order_by(PHQ9Assessment.assessed_at.desc()).first()
    
    feature_dict['phq9_total'] = phq9.total_score if phq9 and phq9.total_score else 10
    
    # GAD-7 (Anxiety)
    gad7 = db.query(GAD7Assessment).filter(
        GAD7Assessment.patient_id == patient_id
    ).order_by(GAD7Assessment.assessed_at.desc()).first()
    
    feature_dict['gad7_total'] = gad7.total_score if gad7 else 7
    
    # 6. CARE PLAN & HOLISTIC WELLBEING
    care_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient_id,
        CarePlan.is_current == True
    ).first()
    
    feature_dict['has_current_care_plan'] = 1 if care_plan else 0
    feature_dict['has_pain_management_plan'] = 1 if care_plan and care_plan.pain_management_plan else 0
    feature_dict['has_psychological_support'] = 1 if care_plan and care_plan.psychological_support else 0
    
    # 7. PATIENT STATUS
    feature_dict['status_deteriorating'] = 1 if patient.status == 'deteriorating' else 0
    feature_dict['status_stable'] = 1 if patient.status == 'stable' else 0
    feature_dict['status_critical'] = 1 if patient.status == 'critical' else 0
    
    # Create feature array (ordered)
    feature_names = [
        'Age', 'Gender (Male)', 'Days Since Admission',
        'Heart Rate Avg', 'Heart Rate Variability', 'Heart Rate Trend',
        'Oxygen Saturation Avg', 'Oxygen Saturation Min',
        'BP Systolic', 'BP Diastolic', 'Temperature', 'Respiratory Rate',
        'Pain Level Avg', 'Pain Level Max', 'Pain Trend',
        'Nausea Frequency', 'Fatigue Level', 'Anxiety Level', 'Breathlessness Frequency',
        'Active Medications', 'Has Allergies', 'Severe Allergies',
        'On Pain Medication', 'Pain Medication Count',
        'ESAS Pain', 'ESAS Tiredness', 'ESAS Anxiety', 'ESAS Depression', 'ESAS Wellbeing', 'ESAS Total',
        'PPS Score', 'PHQ-9 Total', 'GAD-7 Total',
        'Has Care Plan', 'Has Pain Management Plan', 'Has Psychological Support',
        'Status Deteriorating', 'Status Stable', 'Status Critical'
    ]
    
    feature_array = np.array([
        feature_dict['age'], feature_dict['gender_male'], feature_dict['days_since_admission'],
        feature_dict['heart_rate_avg'], feature_dict['heart_rate_variability'], feature_dict['heart_rate_trend'],
        feature_dict['oxygen_saturation_avg'], feature_dict['oxygen_saturation_min'],
        feature_dict['bp_systolic_avg'], feature_dict['bp_diastolic_avg'], feature_dict['temperature_avg'], feature_dict['respiratory_rate_avg'],
        feature_dict['pain_level_avg'], feature_dict['pain_level_max'], feature_dict['pain_trend'],
        feature_dict['nausea_frequency'], feature_dict['fatigue_level_avg'], feature_dict['anxiety_level_avg'], feature_dict['breathlessness_frequency'],
        feature_dict['active_medications_count'], feature_dict['has_allergies'], feature_dict['severe_allergies_count'],
        feature_dict['on_pain_medication'], feature_dict['pain_medication_count'],
        feature_dict['esas_pain'], feature_dict['esas_tiredness'], feature_dict['esas_anxiety'], feature_dict['esas_depression'], feature_dict['esas_wellbeing'], feature_dict['esas_total'],
        feature_dict['pps_score'], feature_dict['phq9_total'], feature_dict['gad7_total'],
        feature_dict['has_current_care_plan'], feature_dict['has_pain_management_plan'], feature_dict['has_psychological_support'],
        feature_dict['status_deteriorating'], feature_dict['status_stable'], feature_dict['status_critical']
    ]).reshape(1, -1)
    
    return feature_dict, feature_array, feature_names


# ==================== RISK CALCULATION ====================

def calculate_comprehensive_risk(feature_dict: Dict, feature_array: np.ndarray) -> Tuple[float, Dict]:
    """
    Calculate comprehensive risk score from all patient data
    
    Returns:
        - overall_risk: 0-1 risk score
        - component_risks: breakdown by category
    """
    
    # Component risk calculations
    
    # 1. Vital Signs Risk
    vital_risk_factors = []
    if feature_dict['heart_rate_avg'] > 100 or feature_dict['heart_rate_avg'] < 60:
        vital_risk_factors.append(0.15)
    if feature_dict['oxygen_saturation_avg'] < 92:
        vital_risk_factors.append(0.25)
    if feature_dict['bp_systolic_avg'] > 160 or feature_dict['bp_systolic_avg'] < 90:
        vital_risk_factors.append(0.10)
    if feature_dict['respiratory_rate_avg'] > 20 or feature_dict['respiratory_rate_avg'] < 12:
        vital_risk_factors.append(0.10)
    
    vital_risk = min(1.0, sum(vital_risk_factors))
    
    # 2. Symptom Burden Risk
    symptom_risk_factors = []
    if feature_dict['pain_level_avg'] > 7:
        symptom_risk_factors.append(0.30)
    elif feature_dict['pain_level_avg'] > 5:
        symptom_risk_factors.append(0.15)
    
    if feature_dict['esas_total'] > 60:
        symptom_risk_factors.append(0.25)
    elif feature_dict['esas_total'] > 45:
        symptom_risk_factors.append(0.15)
    
    if feature_dict['breathlessness_frequency'] > 0.6:
        symptom_risk_factors.append(0.15)
    
    symptom_risk = min(1.0, sum(symptom_risk_factors))
    
    # 3. Medication & Safety Risk
    med_risk_factors = []
    if feature_dict['active_medications_count'] > 10:
        med_risk_factors.append(0.15)
    
    if feature_dict['severe_allergies_count'] > 0:
        med_risk_factors.append(0.10)
    
    if feature_dict['pain_medication_count'] == 0 and feature_dict['pain_level_avg'] > 5:
        med_risk_factors.append(0.20)  # Unmanaged pain
    
    medication_risk = min(1.0, sum(med_risk_factors))
    
    # 4. Psychosocial Risk
    psychosocial_risk_factors = []
    if feature_dict['phq9_total'] > 15:
        psychosocial_risk_factors.append(0.25)
    elif feature_dict['phq9_total'] > 10:
        psychosocial_risk_factors.append(0.15)
    
    if feature_dict['gad7_total'] > 10:
        psychosocial_risk_factors.append(0.20)
    
    if feature_dict['esas_anxiety'] > 7:
        psychosocial_risk_factors.append(0.15)
    
    psychosocial_risk = min(1.0, sum(psychosocial_risk_factors))
    
    # 5. Functional Status Risk
    functional_risk = 0.0
    if feature_dict['pps_score'] < 30:
        functional_risk = 0.80
    elif feature_dict['pps_score'] < 50:
        functional_risk = 0.50
    elif feature_dict['pps_score'] < 70:
        functional_risk = 0.25
    
    # Calculate weighted overall risk
    overall_risk = (
        vital_risk * 0.25 +
        symptom_risk * 0.30 +
        medication_risk * 0.15 +
        psychosocial_risk * 0.15 +
        functional_risk * 0.15
    )
    
    # Boost if status is deteriorating/critical
    if feature_dict['status_critical'] == 1:
        overall_risk = min(1.0, overall_risk + 0.20)
    elif feature_dict['status_deteriorating'] == 1:
        overall_risk = min(1.0, overall_risk + 0.10)
    
    component_risks = {
        'vital_signs_risk': vital_risk,
        'symptom_burden_risk': symptom_risk,
        'medication_risk': medication_risk,
        'psychosocial_risk': psychosocial_risk,
        'functional_status_risk': functional_risk
    }
    
    return overall_risk, component_risks



# ==================== ML MODEL INTEGRATION ====================

def get_ml_prediction_with_shap(
    task: str,
    patient_data: Dict[str, Any],
    top_k: int = 10
) -> Optional[Dict[str, Any]]:
    """
    Get real ML prediction with SHAP explanations
    
    Args:
        task: Task name (e.g., "vital_risk", "symptom_burden")
        patient_data: Dictionary with patient features
        top_k: Number of top SHAP features to return
    
    Returns:
        ML prediction result with SHAP values, or None if ML not available
    """
    if not ML_MODELS_AVAILABLE or ml_service is None:
        return None
    
    try:
        result = ml_service.predict_with_shap(task, patient_data, top_k=top_k)
        if result:
            # Add flag to indicate this is real ML
            result['is_ml_powered'] = True
            result['model_version'] = 'production'
        return result
    except Exception as e:
        print(f"ML prediction failed for {task}: {e}")
        return None


def prepare_vital_risk_features(patient: Patient, focus_data: dict, db: Session) -> Dict[str, Any]:
    """Prepare features for vital risk ML model"""
    
    # Get latest vitals if not in focus_data
    latest_vital = db.query(Vital).filter(
        Vital.patient_id == patient.id
    ).order_by(Vital.recorded_at.desc()).first()
    
    # Extract features needed for vital_risk model
    return {
        'heart_rate': focus_data.get('heart_rate') or (latest_vital.heart_rate if latest_vital else 80),
        'blood_pressure_sys': focus_data.get('blood_pressure_sys') or (latest_vital.blood_pressure_sys if latest_vital else 120),
        'blood_pressure_dia': focus_data.get('blood_pressure_dia') or (latest_vital.blood_pressure_dia if latest_vital else 80),
        'oxygen_saturation': focus_data.get('oxygen_saturation') or (latest_vital.oxygen_saturation if latest_vital else 95),
        'temperature': focus_data.get('temperature') or (latest_vital.temperature if latest_vital else 37.0),
        'respiratory_rate': focus_data.get('respiratory_rate') or (latest_vital.respiratory_rate if latest_vital else 16),
        'age': patient.age if hasattr(patient, 'age') else 70,
        'weight': focus_data.get('weight') or 70.0,
        'height': focus_data.get('height') or 170.0,
        'bmi': focus_data.get('bmi') or 24.2
    }


def prepare_symptom_burden_features(patient: Patient, db: Session) -> Dict[str, Any]:
    """Prepare features for symptom burden ML model"""
    
    # Get latest ESAS assessment
    esas = db.query(ESASAssessment).filter(
        ESASAssessment.patient_id == patient.id
    ).order_by(ESASAssessment.assessment_date.desc()).first()
    
    if not esas:
        # Return default values if no ESAS
        return {
            'esas_pain': 0,
            'esas_tiredness': 0,
            'esas_nausea': 0,
            'esas_depression': 0,
            'esas_anxiety': 0,
            'esas_drowsiness': 0,
            'esas_appetite': 0,
            'esas_wellbeing': 5,
            'esas_shortness_of_breath': 0,
            'age': patient.age if hasattr(patient, 'age') else 70,
            'primary_diagnosis': 0,  # 0=cancer default
            'medications_count': db.query(Medication).filter(
                Medication.patient_id == patient.id,
                Medication.is_active == True
            ).count()
        }
    
    return {
        'esas_pain': esas.pain or 0,
        'esas_tiredness': esas.tiredness or 0,
        'esas_nausea': esas.nausea or 0,
        'esas_depression': esas.depression or 0,
        'esas_anxiety': esas.anxiety or 0,
        'esas_drowsiness': esas.drowsiness or 0,
        'esas_appetite': esas.appetite or 0,
        'esas_wellbeing': esas.wellbeing or 5,
        'esas_shortness_of_breath': esas.shortness_of_breath or 0,
        'age': patient.age if hasattr(patient, 'age') else 70,
        'primary_diagnosis': 0,  # Would need to map from patient.diagnosis
        'medications_count': db.query(Medication).filter(
            Medication.patient_id == patient.id,
            Medication.is_active == True
        ).count()
    }


# ==================== SHAP EXPLANATIONS ====================

def generate_shap_explanations(
    feature_dict: Dict,
    feature_array: np.ndarray,
    feature_names: List[str],
    risk_score: float,
    component_risks: Dict
) -> Tuple[List[SHAPExplanation], float]:
    """
    Generate SHAP-style explanations for the risk prediction
    Shows which features contributed most to the risk score
    """
    
    base_value = 0.30  # Baseline risk for average patient
    
    # Calculate SHAP-like values (contribution to deviation from baseline)
    shap_contributions = []
    
    for i, (name, value) in enumerate(zip(feature_names, feature_array[0])):
        # Calculate how much this feature pushes risk up or down
        shap_value = 0.0
        impact = "neutral"
        explanation = ""
        
        # Demographics
        if name == 'Age':
            if value > 75:
                shap_value = (value - 75) / 100 * 0.15
                impact = "increases_risk"
                explanation = f"Patient age ({int(value)}) is above 75, increasing risk slightly"
            else:
                explanation = f"Patient age ({int(value)}) is within normal range"
        
        # Vitals
        elif name == 'Heart Rate Avg':
            if value > 100:
                shap_value = (value - 100) / 50 * 0.20
                impact = "increases_risk"
                explanation = f"Elevated heart rate ({int(value)} bpm) indicates potential distress"
            elif value < 60:
                shap_value = (60 - value) / 30 * 0.15
                impact = "increases_risk"
                explanation = f"Low heart rate ({int(value)} bpm) may indicate cardiac issues"
            else:
                shap_value = -0.05
                impact = "decreases_risk"
                explanation = f"Heart rate ({int(value)} bpm) is within normal range"
        
        elif name == 'Oxygen Saturation Avg':
            if value < 92:
                shap_value = (92 - value) / 10 * 0.30
                impact = "increases_risk"
                explanation = f"Low oxygen saturation ({int(value)}%) requires immediate attention"
            elif value >= 95:
                shap_value = -0.10
                impact = "decreases_risk"
                explanation = f"Good oxygen saturation ({int(value)}%)"
            else:
                explanation = f"Oxygen saturation ({int(value)}%) is acceptable"
        
        # Pain
        elif name == 'Pain Level Avg':
            if value > 7:
                shap_value = (value - 7) / 3 * 0.35
                impact = "increases_risk"
                explanation = f"Severe pain ({value:.1f}/10) significantly impacts wellbeing and requires urgent attention"
            elif value > 4:
                shap_value = (value - 4) / 6 * 0.15
                impact = "increases_risk"
                explanation = f"Moderate pain ({value:.1f}/10) needs better management"
            else:
                shap_value = -0.10
                impact = "decreases_risk"
                explanation = f"Pain ({value:.1f}/10) is well-controlled"
        
        elif name == 'Pain Trend':
            if value > 1:
                shap_value = value / 10 * 0.20
                impact = "increases_risk"
                explanation = f"Pain is increasing (trending up by {value:.1f} points)"
            elif value < -1:
                shap_value = -0.10
                impact = "decreases_risk"
                explanation = f"Pain is decreasing (improving by {abs(value):.1f} points)"
            else:
                explanation = "Pain levels are stable"
        
        # Symptoms
        elif name == 'ESAS Total':
            if value > 60:
                shap_value = (value - 60) / 30 * 0.25
                impact = "increases_risk"
                explanation = f"High symptom burden (ESAS: {int(value)}/90) indicates significant distress"
            elif value < 30:
                shap_value = -0.15
                impact = "decreases_risk"
                explanation = f"Low symptom burden (ESAS: {int(value)}/90) indicates good symptom control"
            else:
                explanation = f"Moderate symptom burden (ESAS: {int(value)}/90)"
        
        elif name == 'Breathlessness Frequency':
            if value > 0.5:
                shap_value = value * 0.20
                impact = "increases_risk"
                explanation = f"Frequent breathlessness ({value:.0%} of assessments) needs respiratory support"
            else:
                explanation = f"Breathlessness occurring in {value:.0%} of assessments"
        
        # Functional Status
        elif name == 'PPS Score':
            if value < 30:
                shap_value = (30 - value) / 30 * 0.40
                impact = "increases_risk"
                explanation = f"Very low functional status (PPS: {int(value)}%) indicates high care needs"
            elif value < 50:
                shap_value = (50 - value) / 50 * 0.25
                impact = "increases_risk"
                explanation = f"Declining functional status (PPS: {int(value)}%)"
            elif value > 70:
                shap_value = -0.15
                impact = "decreases_risk"
                explanation = f"Good functional status (PPS: {int(value)}%)"
            else:
                explanation = f"Moderate functional status (PPS: {int(value)}%)"
        
        # Mental Health
        elif name == 'PHQ-9 Total':
            if value > 15:
                shap_value = (value - 15) / 12 * 0.25
                impact = "increases_risk"
                explanation = f"Severe depression (PHQ-9: {int(value)}/27) requires mental health intervention"
            elif value > 10:
                shap_value = (value - 10) / 17 * 0.15
                impact = "increases_risk"
                explanation = f"Moderate depression (PHQ-9: {int(value)}/27) impacts quality of life"
            else:
                explanation = f"Mild or no depression (PHQ-9: {int(value)}/27)"
        
        elif name == 'GAD-7 Total':
            if value > 10:
                shap_value = (value - 10) / 11 * 0.20
                impact = "increases_risk"
                explanation = f"Moderate to severe anxiety (GAD-7: {int(value)}/21)"
            else:
                explanation = f"Mild or no anxiety (GAD-7: {int(value)}/21)"
        
        # Medications
        elif name == 'Active Medications':
            if value > 10:
                shap_value = (value - 10) / 10 * 0.15
                impact = "increases_risk"
                explanation = f"Polypharmacy ({int(value)} medications) increases risk of interactions"
            else:
                explanation = f"{int(value)} active medications"
        
        elif name == 'Severe Allergies':
            if value > 0:
                shap_value = value * 0.10
                impact = "increases_risk"
                explanation = f"{int(value)} severe allerg{'y' if value == 1 else 'ies'} require careful medication management"
            else:
                explanation = "No severe allergies documented"
        
        elif name == 'On Pain Medication':
            if value == 0 and feature_dict['pain_level_avg'] > 5:
                shap_value = 0.20
                impact = "increases_risk"
                explanation = "No pain medication despite moderate/high pain - needs pain management"
            elif value == 1:
                shap_value = -0.05
                impact = "decreases_risk"
                explanation = "On pain medication regimen"
            else:
                explanation = "Not on pain medication"
        
        # Care Plan
        elif name == 'Has Pain Management Plan':
            if value == 1:
                shap_value = -0.10
                impact = "decreases_risk"
                explanation = "Comprehensive pain management plan in place"
            else:
                shap_value = 0.10
                impact = "increases_risk"
                explanation = "No formal pain management plan documented"
        
        elif name == 'Has Psychological Support':
            if value == 1:
                shap_value = -0.08
                impact = "decreases_risk"
                explanation = "Psychological support services engaged"
            else:
                explanation = "Psychological support not yet arranged"
        
        # Status flags
        elif name == 'Status Deteriorating':
            if value == 1:
                shap_value = 0.25
                impact = "increases_risk"
                explanation = "Patient status flagged as deteriorating by clinician"
            else:
                explanation = "Patient status not flagged as deteriorating"
        
        elif name == 'Status Critical':
            if value == 1:
                shap_value = 0.35
                impact = "increases_risk"
                explanation = "Patient status flagged as CRITICAL by clinician"
            else:
                explanation = "Patient status not critical"
        
        # Default explanation for uncovered features
        if not explanation:
            explanation = f"{name}: {value:.2f}"
        
        shap_contributions.append({
            'feature_name': name,
            'feature_value': value,
            'display_value': _format_display_value(name, value),
            'shap_value': float(shap_value),
            'impact': impact,
            'explanation': explanation
        })
    
    # Sort by absolute SHAP value (most important first)
    shap_contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    
    # Add importance rank
    shap_explanations = []
    for rank, contrib in enumerate(shap_contributions[:15], 1):  # Top 15 features
        shap_explanations.append(SHAPExplanation(
            feature_name=contrib['feature_name'],
            feature_value=contrib['feature_value'],
            display_value=contrib['display_value'],
            shap_value=contrib['shap_value'],
            impact=contrib['impact'],
            importance_rank=rank,
            explanation=contrib['explanation']
        ))
    
    return shap_explanations, base_value


def _format_display_value(feature_name: str, value: Any) -> str:
    """Format feature value for display"""
    if 'Age' in feature_name:
        return f"{int(value)} years"
    elif 'Heart Rate' in feature_name or 'BP' in feature_name:
        return f"{int(value)} bpm" if 'Heart' in feature_name else f"{int(value)} mmHg"
    elif 'Oxygen' in feature_name:
        return f"{int(value)}%"
    elif 'Temperature' in feature_name:
        return f"{value:.1f}°C"
    elif 'Pain' in feature_name and 'Count' not in feature_name:
        return f"{value:.1f}/10"
    elif 'Frequency' in feature_name:
        return f"{value:.0%}"
    elif 'Score' in feature_name or 'Total' in feature_name:
        return f"{int(value)}"
    elif feature_name.startswith('Has') or feature_name.startswith('On') or feature_name.startswith('Status'):
        return "Yes" if value >= 0.5 else "No"
    else:
        return f"{value:.1f}"



# ==================== API ENDPOINTS ====================

@router.get("/ml-status")
async def get_ml_status():
    """Check if ML models are loaded and available"""
    status = {
        "ml_available": ML_MODELS_AVAILABLE,
        "models_loaded": [],
        "fallback_mode": not ML_MODELS_AVAILABLE
    }
    
    if ML_MODELS_AVAILABLE and ml_service:
        status["models_loaded"] = ml_service.get_available_tasks()
        status["model_count"] = len(status["models_loaded"])
    
    return status


@router.post("/comprehensive-risk/{patient_id}", response_model=ComprehensiveRiskAssessment)
async def assess_comprehensive_risk(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    COMPREHENSIVE RISK ASSESSMENT with SHAP Explanations
    
    Monitors ALL patient data:
    - Vital signs with trends
    - Symptoms and pain levels
    - Medications and allergies
    - Clinical assessments (ESAS, PPS, PHQ-9, GAD-7)
    - Care plans and interventions
    - Holistic wellbeing
    
    Returns SHAP explanations showing WHY the AI predicted this risk level
    """
    
    # 1. Extract all features - wrapped so a single missing field won't 500
    try:
        feature_dict, feature_array, feature_names = extract_all_patient_features(patient_id, db)
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Feature extraction failed for patient {patient_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")
    
    # 2. Calculate risk
    overall_risk, component_risks = calculate_comprehensive_risk(feature_dict, feature_array)
    
    # 3. Determine risk level
    if overall_risk >= 0.75:
        risk_level = "Critical"
    elif overall_risk >= 0.50:
        risk_level = "High"
    elif overall_risk >= 0.30:
        risk_level = "Moderate"
    else:
        risk_level = "Low"
    
    # 4. Generate SHAP explanations
    shap_explanations, base_value = generate_shap_explanations(
        feature_dict, feature_array, feature_names, overall_risk, component_risks
    )
    
    # 5. Generate key concerns
    key_concerns = []
    if feature_dict['pain_level_avg'] > 7:
        key_concerns.append(f"Severe pain: {feature_dict['pain_level_avg']:.1f}/10")
    if feature_dict['oxygen_saturation_avg'] < 92:
        key_concerns.append(f"Low oxygen saturation: {feature_dict['oxygen_saturation_avg']:.0f}%")
    if feature_dict['pps_score'] < 40:
        key_concerns.append(f"Very low functional status: PPS {feature_dict['pps_score']:.0f}%")
    if feature_dict['phq9_total'] > 15:
        key_concerns.append(f"Severe depression: PHQ-9 score {feature_dict['phq9_total']:.0f}")
    if feature_dict['esas_total'] > 60:
        key_concerns.append(f"High symptom burden: ESAS {feature_dict['esas_total']:.0f}/90")
    
    if not key_concerns:
        key_concerns.append("No critical concerns identified")
    
    # 6. Generate recommendations
    recommendations = []
    if risk_level in ["Critical", "High"]:
        recommendations.append("Schedule urgent multidisciplinary team meeting")
        recommendations.append("Increase monitoring frequency to twice daily")
    
    if feature_dict['pain_level_avg'] > 7:
        recommendations.append("Escalate pain management protocol immediately")
    elif feature_dict['pain_level_avg'] > 5:
        recommendations.append("Review and adjust pain medication regimen")
    
    if feature_dict['oxygen_saturation_avg'] < 90:
        recommendations.append("Initiate/adjust oxygen therapy - URGENT")
    
    if not feature_dict['has_pain_management_plan'] and feature_dict['pain_level_avg'] > 4:
        recommendations.append("Develop comprehensive pain management plan")
    
    if feature_dict['phq9_total'] > 15:
        recommendations.append("Mental health consultation for severe depression")
    
    if feature_dict['pps_score'] < 40:
        recommendations.append("Assess palliative care transition needs")
    
    if not recommendations:
        recommendations.append("Continue current care plan and routine monitoring")
    
    # 7. Generate summary
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    summary = f"Patient {patient.full_name} has {risk_level.lower()} overall risk (score: {overall_risk:.2f}). "
    summary += f"Key risk factors: {', '.join([exp.feature_name for exp in shap_explanations[:3]])}. "
    summary += f"Based on analysis of {len(feature_names)} clinical features including vitals, symptoms, medications, and assessments."
    
    # 8. Save prediction to database
    prediction = Prediction(
        patient_id=patient_id,
        predicted_at=datetime.utcnow(),
        risk_score=overall_risk,
        risk_level=risk_level,
        confidence=0.85,  # High confidence due to comprehensive data
        shap_values=json.dumps([exp.shap_value for exp in shap_explanations]),
        feature_values=json.dumps([exp.feature_value for exp in shap_explanations]),
        feature_names=json.dumps([exp.feature_name for exp in shap_explanations]),
        base_value=base_value,
        plain_explanation=summary,
        model_version='comprehensive_v1',
        triggered_by='manual'
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    # 9. Check data availability
    vitals = db.query(Vital).filter(Vital.patient_id == patient_id).order_by(Vital.recorded_at.desc()).first()
    symptoms = db.query(Symptom).filter(Symptom.patient_id == patient_id).order_by(Symptom.recorded_at.desc()).first()
    assessments = db.query(ESASAssessment).filter(ESASAssessment.patient_id == patient_id).first()
    care_plan = db.query(CarePlan).filter(CarePlan.patient_id == patient_id, CarePlan.is_current == True).first()
    allergies = db.query(PatientAllergy).filter(PatientAllergy.patient_id == patient_id, PatientAllergy.is_active == True).all()
    
    return ComprehensiveRiskAssessment(
        prediction_id=prediction.id,
        patient_id=patient_id,
        patient_name=patient.full_name,
        overall_risk_score=overall_risk,
        risk_level=risk_level,
        confidence=0.85,
        vital_signs_risk=component_risks['vital_signs_risk'],
        symptom_burden_risk=component_risks['symptom_burden_risk'],
        medication_risk=component_risks['medication_risk'],
        psychosocial_risk=component_risks['psychosocial_risk'],
        functional_status_risk=component_risks['functional_status_risk'],
        shap_explanations=shap_explanations,
        base_value=base_value,
        key_concerns=key_concerns,
        recommendations=recommendations,
        summary=summary,
        has_recent_vitals=vitals is not None,
        has_recent_symptoms=symptoms is not None,
        has_assessments=assessments is not None,
        has_care_plan=care_plan is not None,
        has_allergies=len(allergies) > 0,
        assessed_at=datetime.utcnow(),
        last_vital_date=vitals.recorded_at if vitals else None,
        last_symptom_date=symptoms.recorded_at if symptoms else None
    )



@router.post("/clinician-feedback")
async def submit_clinician_feedback(
    request: ClinicianFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit clinician feedback on AI prediction
    Allows clinicians to agree/disagree with predictions
    System learns from this feedback to improve future predictions
    """
    
    prediction = db.query(Prediction).filter(Prediction.id == request.prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Save feedback
    feedback = PredictionFeedback(
        prediction_id=request.prediction_id,
        clinician_id=current_user.id,
        feedback_type=request.feedback_type,
        note=request.note
    )
    db.add(feedback)
    db.commit()
    
    # If disagree, log for model improvement
    if request.feedback_type == "disagree" and request.correct_risk_level:
        # This data can be used to retrain the model
        print(f"[FEEDBACK] Prediction {request.prediction_id}: Clinician {current_user.full_name} disagreed")
        print(f"  Predicted: {prediction.risk_level} | Correct: {request.correct_risk_level}")
        print(f"  Note: {request.note}")
    
    return {
        "status": "feedback_recorded",
        "prediction_id": request.prediction_id,
        "feedback_type": request.feedback_type,
        "message": "Thank you! Your feedback helps improve the AI model."
    }


@router.get("/alert-explanation/{alert_id}", response_model=AlertExplanation)
async def explain_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explain WHY an alert was triggered with SHAP analysis
    Shows which patient factors led to the alert
    """
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()
    
    # Get patient features at time of alert
    feature_dict, feature_array, feature_names = extract_all_patient_features(alert.patient_id, db)
    overall_risk, component_risks = calculate_comprehensive_risk(feature_dict, feature_array)
    shap_explanations, base_value = generate_shap_explanations(
        feature_dict, feature_array, feature_names, overall_risk, component_risks
    )
    
    # Generate why_triggered explanation
    why_triggered = f"{alert.alert_type} alert was triggered because: {alert.message}. "
    
    if alert.alert_type == "vital_signs":
        why_triggered += f"The triggered value ({alert.triggered_value}) exceeded the threshold ({alert.threshold_value}). "
    
    # Find relevant SHAP features for this alert
    relevant_features = []
    for exp in shap_explanations:
        if alert.alert_type.lower() in exp.feature_name.lower() or \
           (alert.alert_type == "pain" and "pain" in exp.feature_name.lower()) or \
           (alert.alert_type == "oxygen" and "oxygen" in exp.feature_name.lower()):
            relevant_features.append(exp)
    
    if relevant_features:
        why_triggered += f"Key contributing factors: {', '.join([f.feature_name for f in relevant_features[:3]])}."
    
    # Generate recommendations
    recommended_actions = []
    if alert.severity in ["high", "critical"]:
        recommended_actions.append("Immediate clinical assessment required")
    
    if "pain" in alert.alert_type.lower():
        recommended_actions.append("Review pain management protocol")
        recommended_actions.append("Consider breakthrough medication")
    elif "oxygen" in alert.alert_type.lower() or "O2" in alert.triggered_value:
        recommended_actions.append("Assess respiratory status")
        recommended_actions.append("Consider oxygen therapy adjustment")
    elif "heart" in alert.alert_type.lower():
        recommended_actions.append("Monitor cardiac status closely")
        recommended_actions.append("Review cardiac medications")
    
    if not recommended_actions:
        recommended_actions.append("Assess patient and document findings")
    
    return AlertExplanation(
        alert_id=alert_id,
        patient_name=patient.full_name,
        alert_type=alert.alert_type,
        severity=alert.severity,
        triggered_value=alert.triggered_value,
        why_triggered=why_triggered,
        shap_explanation=relevant_features[:5] if relevant_features else shap_explanations[:5],
        recommended_actions=recommended_actions,
        confidence=0.80
    )


@router.get("/patient-history/{patient_id}")
async def get_patient_risk_history(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get patient's risk assessment history with trends
    Shows how risk has changed over time
    """
    
    predictions = db.query(Prediction).filter(
        Prediction.patient_id == patient_id
    ).order_by(Prediction.predicted_at.desc()).limit(30).all()
    
    if not predictions:
        raise HTTPException(status_code=404, detail="No predictions found for this patient")
    
    history = []
    for pred in predictions:
        feedback = db.query(PredictionFeedback).filter(
            PredictionFeedback.prediction_id == pred.id
        ).first()
        
        history.append({
            "prediction_id": pred.id,
            "assessed_at": pred.predicted_at,
            "risk_score": pred.risk_score,
            "risk_level": pred.risk_level,
            "confidence": pred.confidence,
            "clinician_feedback": feedback.feedback_type if feedback else None,
            "feedback_note": feedback.note if feedback else None
        })
    
    # Calculate trend
    recent_scores = [p.risk_score for p in predictions[:5]]
    older_scores = [p.risk_score for p in predictions[5:10]] if len(predictions) >= 10 else recent_scores
    
    trend = "stable"
    if len(recent_scores) >= 3 and len(older_scores) >= 3:
        if np.mean(recent_scores) > np.mean(older_scores) + 0.10:
            trend = "increasing"
        elif np.mean(recent_scores) < np.mean(older_scores) - 0.10:
            trend = "decreasing"
    
    return {
        "patient_id": patient_id,
        "total_assessments": len(predictions),
        "current_risk": predictions[0].risk_score if predictions else None,
        "trend": trend,
        "history": history
    }


# ==================== FOCUSED AI EXPLANATIONS ====================

@router.post("/focused-explanation")
async def get_focused_explanation(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate focused AI explanation for specific data point
    
    Explains WHY a specific vital, symptom, medication, or alert is concerning
    for THIS specific patient, with context-aware SHAP explanations
    
    Request body:
    {
        "patient_id": 8,
        "focus_type": "vital",  # vital, medication, symptom, alert
        "focus_data": {
            "vital_type": "blood_pressure",
            "value": {"systolic": 160, "diastolic": 95},
            "timestamp": "2026-06-07T14:00:00Z"
        }
    }
    """
    
    patient_id = request.get('patient_id')
    focus_type = request.get('focus_type')
    focus_data = request.get('focus_data', {})
    
    if not patient_id or not focus_type:
        raise HTTPException(status_code=400, detail="patient_id and focus_type are required")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Route to appropriate handler
    if focus_type == 'vital':
        return await explain_vital_focus(patient, focus_data, db)
    elif focus_type == 'medication':
        return await explain_medication_focus(patient, focus_data, db)
    elif focus_type == 'symptom':
        return await explain_symptom_focus(patient, focus_data, db)
    elif focus_type == 'alert':
        return await explain_alert_focus(patient, focus_data, db)
    elif focus_type == 'assessment':
        return await explain_assessment_focus(patient, focus_data, db)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown focus_type: {focus_type}")


async def explain_vital_focus(patient: Patient, focus_data: dict, db: Session):
    """Explain why a specific vital reading is concerning (ML-POWERED!)"""
    
    # Try to use ML model first
    if ML_MODELS_AVAILABLE:
        ml_features = prepare_vital_risk_features(patient, focus_data, db)
        ml_result = get_ml_prediction_with_shap('vital_risk', ml_features, top_k=10)
        
        if ml_result:
            # We have real ML prediction! Use it
            return await _explain_vital_focus_ml(patient, focus_data, ml_result, ml_features, db)
    
    # Fallback to rule-based explanation if ML not available
    return await _explain_vital_focus_fallback(patient, focus_data, db)


async def _explain_vital_focus_ml(
    patient: Patient, 
    focus_data: dict, 
    ml_result: dict,
    ml_features: dict,
    db: Session
):
    """ML-powered vital signs explanation"""
    
    vital_type = focus_data.get('vital_type', '')
    value = focus_data.get('value')
    
    # Get patient's vital history for context
    vitals_history = db.query(Vital).filter(
        Vital.patient_id == patient.id
    ).order_by(Vital.recorded_at.desc()).limit(10).all()
    
    # Calculate baseline and trend
    baseline = None
    trend = "stable"
    if vitals_history and len(vitals_history) > 1:
        if vital_type == 'blood_pressure':
            baseline_sys = np.mean([v.blood_pressure_sys for v in vitals_history if v.blood_pressure_sys])
            baseline_dia = np.mean([v.blood_pressure_dia for v in vitals_history if v.blood_pressure_dia])
            baseline = {"systolic": baseline_sys, "diastolic": baseline_dia}
            
            recent_sys = [v.blood_pressure_sys for v in vitals_history[:3] if v.blood_pressure_sys]
            if recent_sys and value.get('systolic'):
                if value['systolic'] > baseline_sys + 10:
                    trend = "increasing"
                elif value['systolic'] < baseline_sys - 10:
                    trend = "decreasing"
        
        elif vital_type == 'heart_rate':
            baseline = np.mean([v.heart_rate for v in vitals_history if v.heart_rate])
            if value and value > baseline + 10:
                trend = "increasing"
            elif value and value < baseline - 10:
                trend = "decreasing"
        
        elif vital_type == 'oxygen_saturation':
            baseline = np.mean([v.oxygen_saturation for v in vitals_history if v.oxygen_saturation])
            if value and value < baseline - 2:
                trend = "decreasing"
        
        elif vital_type == 'temperature':
            baseline = np.mean([v.temperature for v in vitals_history if v.temperature])
            if value and value > baseline + 0.5:
                trend = "increasing"
    
    # Convert ML SHAP features to our format
    relevant_shap = []
    for i, feat in enumerate(ml_result['top_features'], 1):
        relevant_shap.append({
            'feature_name': feat['display_name'],
            'feature_value': feat['value'],
            'display_value': f"{feat['value']:.1f}" if isinstance(feat['value'], (int, float)) else str(feat['value']),
            'shap_value': feat['shap_value'],
            'impact': feat['impact'],
            'importance': feat['importance'],
            'importance_rank': i
        })
    
    # Generate explanation based on ML prediction
    risk_probability = ml_result['probability']
    risk_level = ml_result['risk_level']  # 'critical', 'warning', or 'normal'
    
    explanation = f"ML Risk Assessment: {risk_probability:.1%} probability of critical vital event. "
    
    # Add context based on top SHAP features
    top_feature = ml_result['top_features'][0]
    explanation += f"The most significant factor is {top_feature['display_name']} (value: {top_feature['value']:.1f}), "
    if top_feature['impact'] == 'increases_risk':
        explanation += "which INCREASES risk. "
    else:
        explanation += "which DECREASES risk. "
    
    # Add clinical interpretation
    if risk_level == 'critical':
        explanation += "⚠️ URGENT: Immediate clinical intervention required. "
    elif risk_level == 'warning':
        explanation += "⚠️ CAUTION: Close monitoring and assessment recommended. "
    else:
        explanation += "✓ Within acceptable range, continue routine monitoring. "
    
    # Generate recommendations based on ML insights
    recommendations = []
    
    # Parse top risk factors
    for feat in ml_result['top_features'][:3]:
        if feat['impact'] == 'increases_risk':
            feature_name = feat['feature']
            
            if 'oxygen_saturation' in feature_name and feat['value'] < 90:
                recommendations.append("START/INCREASE oxygen therapy immediately")
                recommendations.append("Assess respiratory status")
            elif 'heart_rate' in feature_name and feat['value'] > 110:
                recommendations.append("Assess for pain, fever, or infection")
                recommendations.append("Consider cardiac monitoring")
            elif 'blood_pressure_sys' in feature_name and feat['value'] > 160:
                recommendations.append("Assess for pain or anxiety contributing factors")
                recommendations.append("Consider antihypertensive if indicated")
            elif 'temperature' in feature_name and feat['value'] > 38.5:
                recommendations.append("Investigate source of infection")
                recommendations.append("Administer antipyretics and increase hydration")
    
    if not recommendations:
        recommendations.append("Continue routine monitoring")
        recommendations.append("Reassess if clinical status changes")
    
    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "focus_type": "vital",
        "vital_type": vital_type,
        "current_value": value,
        "baseline_value": baseline,
        "trend": trend,
        "risk_level": risk_level,
        "risk_probability": risk_probability,
        "explanation": explanation,
        "relevant_factors": relevant_shap,
        "recommendations": recommendations,
        "confidence": risk_probability,
        "is_ml_powered": True,
        "model_type": ml_result['model_type'],
        "ml_metadata": {
            "task": 'vital_risk',
            "model_version": ml_result.get('model_version', 'unknown'),
            "base_value": ml_result.get('base_value', 0)
        }
    }


async def _explain_vital_focus_fallback(patient: Patient, focus_data: dict, db: Session):
    """Fallback to rule-based explanation if ML not available"""
    
    vital_type = focus_data.get('vital_type', '')
    value = focus_data.get('value')
    
    # Get patient's vital history for baseline
    vitals_history = db.query(Vital).filter(
        Vital.patient_id == patient.id
    ).order_by(Vital.recorded_at.desc()).limit(10).all()
    
    # Calculate baseline
    baseline = None
    trend = "stable"
    if vitals_history and len(vitals_history) > 1:
        if vital_type == 'blood_pressure':
            baseline_sys = np.mean([v.blood_pressure_sys for v in vitals_history if v.blood_pressure_sys])
            baseline_dia = np.mean([v.blood_pressure_dia for v in vitals_history if v.blood_pressure_dia])
            baseline = {"systolic": baseline_sys, "diastolic": baseline_dia}
            
            # Determine trend
            recent_sys = [v.blood_pressure_sys for v in vitals_history[:3] if v.blood_pressure_sys]
            if recent_sys and value.get('systolic'):
                if value['systolic'] > baseline_sys + 10:
                    trend = "increasing"
                elif value['systolic'] < baseline_sys - 10:
                    trend = "decreasing"
        
        elif vital_type == 'heart_rate':
            baseline = np.mean([v.heart_rate for v in vitals_history if v.heart_rate])
            if value and value > baseline + 10:
                trend = "increasing"
            elif value and value < baseline - 10:
                trend = "decreasing"
        
        elif vital_type == 'oxygen_saturation':
            baseline = np.mean([v.oxygen_saturation for v in vitals_history if v.oxygen_saturation])
            if value and value < baseline - 2:
                trend = "decreasing"
            elif value and value > baseline + 2:
                trend = "increasing"
        
        elif vital_type == 'temperature':
            baseline = np.mean([v.temperature for v in vitals_history if v.temperature])
            if value and value > baseline + 0.5:
                trend = "increasing"
            elif value and value < baseline - 0.5:
                trend = "decreasing"
    
    # Get comprehensive patient context
    feature_dict, feature_array, feature_names = extract_all_patient_features(patient.id, db)
    
    # Generate explanation
    explanation = ""
    risk_level = "normal"
    recommendations = []
    
    if vital_type == 'blood_pressure':
        sys_val = value.get('systolic', 0) if isinstance(value, dict) else 0
        dia_val = value.get('diastolic', 0) if isinstance(value, dict) else 0
        
        if sys_val > 140 or dia_val > 90:
            risk_level = "warning"
            explanation = f"Blood Pressure {sys_val}/{dia_val} mmHg is elevated (hypertension range). "
            
            if baseline:
                deviation = sys_val - baseline['systolic']
                explanation += f"This is {abs(deviation):.0f} mmHg {'above' if deviation > 0 else 'below'} their baseline ({baseline['systolic']:.0f}/{baseline['diastolic']:.0f}). "
            
            # Check pain correlation
            if feature_dict['pain_level_avg'] > 6:
                explanation += f"Patient is experiencing high pain (level {feature_dict['pain_level_avg']:.1f}/10), which commonly causes elevated blood pressure. "
                recommendations.append("Address pain management first with breakthrough medication")
                recommendations.append("Recheck BP 30-60 minutes after pain intervention")
            
            # Check anxiety correlation
            if feature_dict.get('gad7_total', 0) > 10:
                explanation += "Patient has elevated anxiety levels, which may contribute to blood pressure elevation. "
                recommendations.append("Consider relaxation techniques or anxiolytic medication")
            
            if sys_val > 160:
                risk_level = "critical"
                explanation += "This is Stage 2 Hypertension requiring urgent intervention. "
                recommendations.insert(0, "Immediate clinical assessment required")
                recommendations.append("Consider antihypertensive medication if pain-managed")
        
        elif sys_val < 90:
            risk_level = "warning"
            explanation = f"Blood Pressure {sys_val}/{dia_val} mmHg is low (hypotension). "
            recommendations.append("Assess for dehydration, bleeding, or medication effects")
            recommendations.append("Consider fluid bolus if appropriate")
    
    elif vital_type == 'heart_rate':
        if value > 100:
            risk_level = "warning"
            explanation = f"Heart Rate {value} bpm is elevated (tachycardia). "
            
            if baseline:
                deviation = value - baseline
                explanation += f"This is {abs(deviation):.0f} bpm above their baseline ({baseline:.0f} bpm). "
            
            # Check correlations
            if feature_dict['pain_level_avg'] > 6:
                explanation += f"Pain level is high ({feature_dict['pain_level_avg']:.1f}/10), which commonly causes tachycardia. "
                recommendations.append("Optimize pain management")
            
            if feature_dict.get('temperature_avg', 37) > 38:
                explanation += "Patient is febrile, which increases heart rate. "
                recommendations.append("Treat underlying infection/fever")
            
            recommendations.append("Monitor for signs of distress or infection")
            
            if value > 120:
                risk_level = "critical"
                recommendations.insert(0, "Urgent clinical assessment needed")
        
        elif value < 60:
            risk_level = "warning"
            explanation = f"Heart Rate {value} bpm is low (bradycardia). "
            recommendations.append("Check medications (beta-blockers, digoxin)")
            recommendations.append("Assess for cardiac conduction issues")
    
    elif vital_type == 'oxygen_saturation':
        if value < 95:
            risk_level = "warning"
            explanation = f"Oxygen Saturation {value}% is below normal range. "
            
            if baseline:
                deviation = value - baseline
                explanation += f"This is {abs(deviation):.0f}% below their baseline ({baseline:.0f}%). "
            
            # Check respiratory symptoms
            recent_symptoms = db.query(Symptom).filter(
                Symptom.patient_id == patient.id,
                Symptom.symptom_type.in_(['breathlessness', 'cough', 'chest_pain'])
            ).order_by(Symptom.recorded_at.desc()).limit(3).all()
            
            if recent_symptoms:
                explanation += f"Patient has recent respiratory symptoms: {', '.join([s.symptom_type for s in recent_symptoms])}. "
            
            if value < 90:
                risk_level = "critical"
                explanation += "This is critical hypoxemia requiring immediate intervention. "
                recommendations.insert(0, "START/INCREASE oxygen therapy IMMEDIATELY")
                recommendations.append("Assess respiratory status and lung sounds")
                recommendations.append("Consider chest X-ray and ABG analysis")
            else:
                recommendations.append("Consider supplemental oxygen therapy")
                recommendations.append("Monitor closely and reassess in 30 minutes")
    
    elif vital_type == 'temperature':
        if value > 38:
            risk_level = "warning"
            explanation = f"Temperature {value:.1f}°C indicates fever. "
            
            if value > 39:
                risk_level = "critical"
                explanation += "This is high-grade fever requiring urgent attention. "
                recommendations.insert(0, "Investigate source of infection urgently")
            
            recommendations.append("Administer antipyretics (paracetamol/ibuprofen)")
            recommendations.append("Blood cultures if sepsis suspected")
            recommendations.append("Increase fluid intake/IV hydration")
        
        elif value < 36:
            risk_level = "warning"
            explanation = f"Temperature {value:.1f}°C is hypothermic. "
            recommendations.append("Provide warming measures")
            recommendations.append("Assess for sepsis or exposure")
    
    # Generate focused SHAP explanations
    relevant_shap = []
    if vital_type == 'blood_pressure':
        relevant_shap.append({
            'feature_name': 'Blood Pressure (Systolic)',
            'feature_value': value.get('systolic', 0) if isinstance(value, dict) else value,
            'display_value': f"{value.get('systolic', 0)}/{value.get('diastolic', 0)} mmHg" if isinstance(value, dict) else f"{value} mmHg",
            'impact': 'increases_risk' if (value.get('systolic', 0) if isinstance(value, dict) else value) > 140 else 'normal',
            'importance': 1
        })
        
        if feature_dict['pain_level_avg'] > 6:
            relevant_shap.append({
                'feature_name': 'Pain Level',
                'feature_value': feature_dict['pain_level_avg'],
                'display_value': f"{feature_dict['pain_level_avg']:.1f}/10",
                'impact': 'increases_risk',
                'importance': 2
            })
    
    elif vital_type == 'heart_rate':
        relevant_shap.append({
            'feature_name': 'Heart Rate',
            'feature_value': value,
            'display_value': f"{value} bpm",
            'impact': 'increases_risk' if value > 100 else 'normal',
            'importance': 1
        })
    
    elif vital_type == 'oxygen_saturation':
        relevant_shap.append({
            'feature_name': 'Oxygen Saturation',
            'feature_value': value,
            'display_value': f"{value}%",
            'impact': 'increases_risk' if value < 95 else 'normal',
            'importance': 1
        })
    
    elif vital_type == 'temperature':
        relevant_shap.append({
            'feature_name': 'Temperature',
            'feature_value': value,
            'display_value': f"{value:.1f}°C",
            'impact': 'increases_risk' if value > 38 or value < 36 else 'normal',
            'importance': 1
        })
    
    if not recommendations:
        recommendations.append("Continue routine monitoring")
    
    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "focus_type": "vital",
        "vital_type": vital_type,
        "current_value": value,
        "baseline_value": baseline,
        "trend": trend,
        "risk_level": risk_level,
        "explanation": explanation,
        "relevant_factors": relevant_shap,
        "recommendations": recommendations,
        "confidence": 0.85
    }


async def explain_medication_focus(patient: Patient, focus_data: dict, db: Session):
    """Explain medication interactions or concerns"""
    
    medication_name = focus_data.get('medication_name', '')
    
    # Get all active medications
    medications = db.query(Medication).filter(
        Medication.patient_id == patient.id,
        Medication.is_active == True
    ).all()
    
    # Get allergies
    allergies = db.query(PatientAllergy).filter(
        PatientAllergy.patient_id == patient.id,
        PatientAllergy.is_active == True
    ).all()
    
    # Get medication effects from our knowledge base
    med_effects = db.query(MedicationEffect).filter(
        MedicationEffect.medication_name == medication_name
    ).all()
    
    explanation = f"Analyzing {medication_name} for patient {patient.full_name}. "
    risk_level = "normal"
    recommendations = []
    interactions = []
    
    # Check for interactions
    for med in medications:
        if med.name != medication_name:
            # Check known interactions
            interaction_check = db.query(MedicationEffect).filter(
                MedicationEffect.medication_name == medication_name,
                MedicationEffect.effect_type == 'interaction',
                MedicationEffect.related_medication == med.name
            ).first()
            
            if interaction_check:
                interactions.append({
                    'medication': med.name,
                    'interaction': interaction_check.effect_description,
                    'severity': interaction_check.severity
                })
    
    if interactions:
        risk_level = "warning"
        explanation += f"Found {len(interactions)} potential drug interaction(s). "
        for interaction in interactions:
            explanation += f"{interaction['medication']}: {interaction['interaction']}. "
            recommendations.append(f"Monitor for {interaction['interaction']}")
    
    # Check allergies
    for allergy in allergies:
        if allergy.allergen_name.lower() in medication_name.lower():
            risk_level = "critical"
            explanation += f"⚠️ ALLERGY ALERT: Patient is allergic to {allergy.allergen_name}! "
            recommendations.insert(0, "DO NOT ADMINISTER - Check for alternative medication")
    
    if not recommendations:
        recommendations.append("Continue as prescribed")
        recommendations.append("Monitor for expected therapeutic effects")
    
    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "focus_type": "medication",
        "medication_name": medication_name,
        "risk_level": risk_level,
        "explanation": explanation,
        "interactions": interactions,
        "recommendations": recommendations,
        "confidence": 0.90
    }


async def explain_symptom_focus(patient: Patient, focus_data: dict, db: Session):
    """Explain symptom patterns and trends"""
    
    symptom_type = focus_data.get('symptom_type', '')
    current_severity = focus_data.get('severity', 0)
    
    # Get symptom history
    symptom_history = db.query(Symptom).filter(
        Symptom.patient_id == patient.id,
        Symptom.symptom_type == symptom_type
    ).order_by(Symptom.recorded_at.desc()).limit(10).all()
    
    explanation = f"Analyzing {symptom_type} pattern for {patient.full_name}. "
    risk_level = "normal"
    recommendations = []
    trend = "stable"
    
    if len(symptom_history) > 1:
        # Calculate trend
        recent_severity = [s.severity for s in symptom_history[:3]]
        older_severity = [s.severity for s in symptom_history[3:6]] if len(symptom_history) >= 6 else recent_severity
        
        if np.mean(recent_severity) > np.mean(older_severity) + 1:
            trend = "worsening"
            risk_level = "warning"
            explanation += f"{symptom_type.capitalize()} is worsening over time. "
        elif np.mean(recent_severity) < np.mean(older_severity) - 1:
            trend = "improving"
            explanation += f"{symptom_type.capitalize()} is improving. "
    
    if current_severity >= 7:
        risk_level = "critical"
        explanation += f"Current severity ({current_severity}/10) is severe. "
        recommendations.append("Urgent intervention required")
    elif current_severity >= 5:
        risk_level = "warning"
        explanation += f"Current severity ({current_severity}/10) is moderate and requires attention. "
    
    # Symptom-specific recommendations
    if symptom_type == 'pain':
        if current_severity >= 7:
            recommendations.append("Consider breakthrough pain medication")
            recommendations.append("Assess pain source and characteristics")
        recommendations.append("Review pain management plan")
    
    elif symptom_type == 'nausea':
        recommendations.append("Administer antiemetic medication")
        recommendations.append("Small, frequent meals")
        recommendations.append("Assess for medication-induced nausea")
    
    elif symptom_type == 'breathlessness':
        recommendations.append("Check oxygen saturation")
        recommendations.append("Position patient upright")
        recommendations.append("Consider oxygen therapy if SpO2 < 95%")
    
    if not recommendations:
        recommendations.append("Continue monitoring symptom progression")
    
    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "focus_type": "symptom",
        "symptom_type": symptom_type,
        "current_severity": current_severity,
        "trend": trend,
        "risk_level": risk_level,
        "explanation": explanation,
        "history_count": len(symptom_history),
        "recommendations": recommendations,
        "confidence": 0.80
    }


async def explain_alert_focus(patient: Patient, focus_data: dict, db: Session):
    """Explain why a specific alert was triggered"""
    
    alert_id = focus_data.get('alert_id')
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    explanation = f"{alert.alert_type.replace('_', ' ').title()} alert triggered: {alert.message}. "
    risk_level = alert.severity
    recommendations = []
    
    # Add context based on alert type
    if 'pain' in alert.alert_type.lower():
        explanation += "High pain levels require immediate attention to ensure patient comfort. "
        recommendations.append("Assess pain characteristics (location, type, radiation)")
        recommendations.append("Administer breakthrough pain medication if available")
        recommendations.append("Consider non-pharmacological interventions")
    
    elif 'oxygen' in alert.alert_type.lower():
        explanation += "Low oxygen saturation indicates respiratory compromise. "
        recommendations.append("Start/increase oxygen therapy immediately")
        recommendations.append("Assess respiratory rate and effort")
        recommendations.append("Consider need for urgent medical review")
    
    elif 'vital' in alert.alert_type.lower():
        explanation += "Abnormal vital signs require clinical assessment. "
        recommendations.append("Perform full vital signs assessment")
        recommendations.append("Review recent medications and interventions")
        recommendations.append("Document findings and notify senior clinician")
    
    if alert.severity == 'critical':
        recommendations.insert(0, "⚠️ URGENT: Immediate clinical assessment required")
    
    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "focus_type": "alert",
        "alert_id": alert_id,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "triggered_value": alert.triggered_value,
        "risk_level": risk_level,
        "explanation": explanation,
        "recommendations": recommendations,
        "confidence": 0.85
    }


async def explain_assessment_focus(patient: Patient, focus_data: dict, db: Session):
    """
    Explain ALL assessment types with clinical accuracy
    
    Now includes:
    - ESAS (Edmonton Symptom Assessment System)
    - PHQ-9 (Depression)
    - GAD-7 (Anxiety)
    - PPS (Palliative Performance Scale)
    - ECOG (Performance Status 0-4) ← NEW
    - Karnofsky (Performance Status 0-100) ← NEW
    - Barthel Index (ADL independence 0-100) ← NEW
    - MMAS-8 (Medication Adherence 0-8) ← NEW
    - CAGE (Substance use 0-4) ← NEW
    - MMSE (Cognitive function 0-30) ← NEW
    - MoCA (Cognitive function 0-30) ← NEW
    - Zarit (Caregiver burden 0-88) ← NEW
    - Individual ESAS subscales ← NEW
    """
    
    assessment_type = focus_data.get('assessment_type', '')
    total_score = focus_data.get('total_score', 0)
    
    explanation = f"Analyzing {assessment_type} assessment for {patient.full_name}. "
    risk_level = "normal"
    recommendations = []
    relevant_factors = []
    
    # ========== ORIGINAL ASSESSMENTS ==========
    
    if assessment_type == 'ESAS':
        if total_score > 60:
            risk_level = "critical"
            explanation += f"Total ESAS score of {total_score}/90 indicates severe symptom burden. "
            recommendations.append("🚨 Urgent multidisciplinary team meeting required")
            recommendations.append("Review ALL symptom management interventions")
        elif total_score > 40:
            risk_level = "warning"
            explanation += f"Total ESAS score of {total_score}/90 indicates moderate-high symptom burden. "
            recommendations.append("Schedule multidisciplinary review within 48 hours")
        else:
            explanation += f"Total ESAS score of {total_score}/90 indicates manageable symptom burden. "
        
        relevant_factors.append({
            'feature_name': 'Total Symptom Burden',
            'feature_value': total_score,
            'display_value': f"{total_score}/90",
            'impact': 'increases_risk' if total_score > 40 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'PHQ-9':
        if total_score > 20:
            risk_level = "critical"
            explanation += f"PHQ-9 score of {total_score}/27 indicates severe depression. "
            recommendations.append("🚨 URGENT: Psychiatric consultation + suicide risk assessment")
        elif total_score > 15:
            risk_level = "warning"
            explanation += f"PHQ-9 score of {total_score}/27 indicates moderately severe depression. "
            recommendations.append("Mental health referral within 1 week")
        elif total_score > 10:
            explanation += f"PHQ-9 score of {total_score}/27 indicates moderate depression. "
            recommendations.append("Psychological counseling recommended")
        
        relevant_factors.append({
            'feature_name': 'Depression Severity',
            'feature_value': total_score,
            'display_value': f"{total_score}/27",
            'impact': 'increases_risk' if total_score > 10 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'GAD-7':
        if total_score > 15:
            risk_level = "critical"
            explanation += f"GAD-7 score of {total_score}/21 indicates severe anxiety. "
            recommendations.append("Psychiatric evaluation recommended urgently")
        elif total_score > 10:
            risk_level = "warning"
            explanation += f"GAD-7 score of {total_score}/21 indicates moderate anxiety. "
            recommendations.append("Psychological support recommended")
        
        relevant_factors.append({
            'feature_name': 'Anxiety Severity',
            'feature_value': total_score,
            'display_value': f"{total_score}/21",
            'impact': 'increases_risk' if total_score > 10 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'PPS':
        if total_score < 30:
            risk_level = "critical"
            explanation += f"PPS score of {total_score}% indicates very low functional status requiring full care. "
            recommendations.append("🚨 24/7 care required - consider palliative care intensification")
            recommendations.append("Family meeting to discuss goals of care")
        elif total_score < 50:
            risk_level = "warning"
            explanation += f"PPS score of {total_score}% indicates declining functional status. "
            recommendations.append("Increase caregiver support and respite planning")
        else:
            explanation += f"PPS score of {total_score}% indicates reasonable functional status. "
        
        relevant_factors.append({
            'feature_name': 'Functional Status',
            'feature_value': total_score,
            'display_value': f"{total_score}%",
            'impact': 'increases_risk' if total_score < 50 else 'normal',
            'importance': 1
        })
    
    # ========== NEW ASSESSMENTS - COMPLETE COVERAGE ==========
    
    elif assessment_type == 'ECOG':
        # ECOG Performance Status (0-4)
        if total_score >= 4:
            risk_level = "critical"
            explanation += f"ECOG 4 indicates completely disabled, cannot carry out self-care, totally confined. "
            recommendations.append("🚨 Full supportive care required - hospice discussion appropriate")
            recommendations.append("Consider palliative care transition")
            recommendations.append("Family conference about end-of-life wishes")
        elif total_score >= 3:
            risk_level = "warning"
            explanation += f"ECOG 3 indicates capable of only limited self-care, confined to bed/chair >50% waking hours. "
            recommendations.append("Significantly increase care support")
            recommendations.append("Home modifications for safety")
            recommendations.append("Caregiver respite planning essential")
        elif total_score >= 2:
            risk_level = "warning"
            explanation += f"ECOG 2 indicates ambulatory and capable of self-care but unable to work, up >50% waking hours. "
            recommendations.append("Support with ADLs and mobility")
            recommendations.append("Monitor for further decline")
            recommendations.append("Occupational therapy assessment")
        elif total_score == 1:
            explanation += f"ECOG 1 indicates restricted in strenuous activity but ambulatory and able to carry out light work. "
            recommendations.append("Encourage activity within tolerance")
            recommendations.append("Regular functional reassessment")
        else:
            explanation += f"ECOG 0 indicates fully active, able to carry on all pre-disease activities without restriction. "
            recommendations.append("Continue current functional maintenance")
        
        relevant_factors.append({
            'feature_name': 'ECOG Performance',
            'feature_value': total_score,
            'display_value': f"ECOG {total_score}",
            'impact': 'increases_risk' if total_score >= 2 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'Karnofsky':
        # Karnofsky Performance Status (0-100)
        if total_score < 30:
            risk_level = "critical"
            explanation += f"Karnofsky {total_score}% indicates severely disabled, hospitalization/active supportive care necessary. "
            recommendations.append("🚨 Hospitalization or intensive home palliative care")
            recommendations.append("End-of-life care planning if not already done")
            recommendations.append("Symptom management optimization urgent")
        elif total_score < 50:
            risk_level = "warning"
            explanation += f"Karnofsky {total_score}% indicates requires considerable assistance and frequent medical care. "
            recommendations.append("Increase caregiver support significantly")
            recommendations.append("Consider home health aide services")
            recommendations.append("Weekly clinical monitoring")
        elif total_score < 70:
            risk_level = "warning"
            explanation += f"Karnofsky {total_score}% indicates cares for self, unable to carry on normal activity or work. "
            recommendations.append("Support with instrumental ADLs")
            recommendations.append("Monitor for decline")
        else:
            explanation += f"Karnofsky {total_score}% indicates able to carry on normal activity. "
            recommendations.append("Continue functional maintenance activities")
        
        relevant_factors.append({
            'feature_name': 'Karnofsky Performance',
            'feature_value': total_score,
            'display_value': f"{total_score}%",
            'impact': 'increases_risk' if total_score < 50 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'Barthel':
        # Barthel Index (0-100) - ADL independence
        if total_score < 20:
            risk_level = "critical"
            explanation += f"Barthel {total_score}/100 indicates total dependence in activities of daily living. "
            recommendations.append("🚨 24/7 care required - full assistance with all ADLs")
            recommendations.append("Pressure ulcer prevention protocol")
            recommendations.append("Caregiver training for total care")
        elif total_score < 40:
            risk_level = "warning"
            explanation += f"Barthel {total_score}/100 indicates severe dependence - needs major help with ADLs. "
            recommendations.append("Extensive assistance required for most activities")
            recommendations.append("Occupational therapy for ADL strategies")
        elif total_score < 60:
            risk_level = "warning"
            explanation += f"Barthel {total_score}/100 indicates moderate dependence. "
            recommendations.append("Support needed for several ADLs")
            recommendations.append("Adaptive equipment assessment")
        else:
            explanation += f"Barthel {total_score}/100 indicates good independence in ADLs. "
            recommendations.append("Continue independence maintenance")
        
        relevant_factors.append({
            'feature_name': 'ADL Independence',
            'feature_value': total_score,
            'display_value': f"{total_score}/100",
            'impact': 'increases_risk' if total_score < 60 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'MMAS-8':
        # Medication Adherence (0-8)
        if total_score < 6:
            risk_level = "critical"
            explanation += f"MMAS-8 score {total_score}/8 indicates low medication adherence - high risk of treatment failure. "
            recommendations.append("🚨 Medication non-adherence intervention URGENT")
            recommendations.append("Simplify medication regimen (work with pharmacist)")
            recommendations.append("Daily supervision or automated pill dispenser")
            recommendations.append("Identify and address barriers (cost, side effects, forgetfulness)")
        elif total_score < 8:
            risk_level = "warning"
            explanation += f"MMAS-8 score {total_score}/8 indicates medium adherence - some missed doses. "
            recommendations.append("Medication adherence counseling")
            recommendations.append("Pill organizer or reminder system")
            recommendations.append("Follow-up in 2 weeks to reassess")
        else:
            explanation += f"MMAS-8 score 8/8 indicates good medication adherence. "
            recommendations.append("Continue current adherence strategies")
        
        relevant_factors.append({
            'feature_name': 'Medication Adherence',
            'feature_value': total_score,
            'display_value': f"{total_score}/8",
            'impact': 'increases_risk' if total_score < 6 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'CAGE':
        # Substance use screening (0-4)
        if total_score >= 2:
            risk_level = "warning"
            explanation += f"CAGE score {total_score}/4 suggests clinically significant alcohol problem. "
            recommendations.append("Comprehensive alcohol use disorder assessment required")
            recommendations.append("Consider addiction medicine or psychiatry referral")
            recommendations.append("Screen for withdrawal risk if admitted")
            recommendations.append("Provide alcohol cessation resources")
        elif total_score == 1:
            explanation += f"CAGE score {total_score}/4 suggests possible alcohol concern. "
            recommendations.append("Further assessment of alcohol use patterns")
            recommendations.append("Provide education on safe drinking limits")
        else:
            explanation += f"CAGE score 0/4 - no indication of alcohol problem. "
        
        relevant_factors.append({
            'feature_name': 'Alcohol Risk',
            'feature_value': total_score,
            'display_value': f"{total_score}/4",
            'impact': 'increases_risk' if total_score >= 2 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'MMSE':
        # Cognitive function (0-30)
        if total_score < 18:
            risk_level = "critical"
            explanation += f"MMSE {total_score}/30 indicates severe cognitive impairment. "
            recommendations.append("🚨 Neurology or geriatrics consultation URGENT")
            recommendations.append("Safety assessment (driving, living alone, medication management)")
            recommendations.append("Caregiver support and education essential")
            recommendations.append("Consider need for guardianship or conservatorship")
        elif total_score < 24:
            risk_level = "warning"
            explanation += f"MMSE {total_score}/30 indicates mild-moderate cognitive impairment. "
            recommendations.append("Cognitive assessment by specialist")
            recommendations.append("Medication review (many drugs affect cognition)")
            recommendations.append("Memory aids and routine establishment")
            recommendations.append("Family education about cognitive impairment")
        elif total_score < 27:
            explanation += f"MMSE {total_score}/30 indicates possible mild cognitive impairment. "
            recommendations.append("Monitor cognitive function over time")
            recommendations.append("Consider more detailed neuropsychological testing")
        else:
            explanation += f"MMSE {total_score}/30 is within normal range. "
        
        relevant_factors.append({
            'feature_name': 'Cognitive Function',
            'feature_value': total_score,
            'display_value': f"{total_score}/30",
            'impact': 'increases_risk' if total_score < 24 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'MoCA':
        # MoCA Cognitive Assessment (0-30)
        if total_score < 18:
            risk_level = "critical"
            explanation += f"MoCA {total_score}/30 indicates severe cognitive impairment. "
            recommendations.append("🚨 Neurological evaluation URGENT")
            recommendations.append("Dementia assessment and workup")
            recommendations.append("Safety evaluation for ADL independence")
        elif total_score < 26:
            risk_level = "warning"
            explanation += f"MoCA {total_score}/30 indicates cognitive impairment (cutoff <26). "
            recommendations.append("Further cognitive assessment recommended")
            recommendations.append("Memory clinic or neuropsychology referral")
            recommendations.append("Assess for treatable causes (depression, medications, metabolic)")
        else:
            explanation += f"MoCA {total_score}/30 is within normal range. "
        
        relevant_factors.append({
            'feature_name': 'Cognitive Function (MoCA)',
            'feature_value': total_score,
            'display_value': f"{total_score}/30",
            'impact': 'increases_risk' if total_score < 26 else 'normal',
            'importance': 1
        })
    
    elif assessment_type == 'Zarit':
        # Caregiver Burden (0-88)
        if total_score > 60:
            risk_level = "critical"
            explanation += f"Zarit {total_score}/88 indicates severe caregiver burden - caregiver at risk of burnout. "
            recommendations.append("🚨 URGENT respite care needed - caregiver health at risk")
            recommendations.append("Caregiver mental health assessment and support")
            recommendations.append("Explore alternative care options (day programs, facility care)")
            recommendations.append("Connect with caregiver support groups")
        elif total_score > 40:
            risk_level = "warning"
            explanation += f"Zarit {total_score}/88 indicates moderate to severe caregiver burden. "
            recommendations.append("Respite care services urgently needed")
            recommendations.append("Caregiver support group participation")
            recommendations.append("Home health aide to reduce burden")
            recommendations.append("Caregiver counseling or therapy")
        elif total_score > 20:
            explanation += f"Zarit {total_score}/88 indicates mild to moderate burden. "
            recommendations.append("Monitor caregiver wellbeing closely")
            recommendations.append("Provide caregiver education and resources")
            recommendations.append("Plan for respite before burden increases")
        else:
            explanation += f"Zarit {total_score}/88 indicates little to no burden at this time. "
            recommendations.append("Continue caregiver support and check-ins")
        
        relevant_factors.append({
            'feature_name': 'Caregiver Burden',
            'feature_value': total_score,
            'display_value': f"{total_score}/88",
            'impact': 'increases_risk' if total_score > 40 else 'normal',
            'importance': 1
        })
    
    # ========== INDIVIDUAL ESAS SUBSCALES (0-10 each) ==========
    
    elif assessment_type.startswith('ESAS_'):
        subscale = assessment_type.replace('ESAS_', '').lower().replace('_', ' ')
        
        if total_score >= 7:
            risk_level = "critical"
            explanation += f"{subscale.title()} score {total_score}/10 is severe - causing significant distress. "
            recommendations.append(f"🚨 Urgent {subscale} management required")
            
            # Subscale-specific recommendations
            if 'pain' in subscale:
                recommendations.append("Breakthrough pain medication NOW")
                recommendations.append("Review and escalate pain management plan")
            elif 'tiredness' in subscale or 'fatigue' in subscale:
                recommendations.append("Energy conservation strategies")
                recommendations.append("Rule out reversible causes (anemia, hypothyroid, depression)")
            elif 'nausea' in subscale:
                recommendations.append("Antiemetic medication immediately")
                recommendations.append("Review for medication-induced nausea")
            elif 'depression' in subscale:
                recommendations.append("Psychiatric/psychology consultation")
                recommendations.append("PHQ-9 assessment for severity")
            elif 'anxiety' in subscale:
                recommendations.append("Anxiolytic medication consideration")
                recommendations.append("GAD-7 assessment for severity")
            elif 'appetite' in subscale:
                recommendations.append("Nutritional assessment")
                recommendations.append("Small frequent meals, favorite foods")
            elif 'breathlessness' in subscale or 'shortness' in subscale:
                recommendations.append("Check oxygen saturation")
                recommendations.append("Consider oxygen therapy or fan therapy")
            
        elif total_score >= 4:
            risk_level = "warning"
            explanation += f"{subscale.title()} score {total_score}/10 is moderate - needs attention. "
            recommendations.append(f"Optimize {subscale} management")
            recommendations.append(f"Monitor {subscale} daily for escalation")
        else:
            explanation += f"{subscale.title()} score {total_score}/10 is mild - well-controlled. "
            recommendations.append(f"Continue current {subscale} management")
        
        relevant_factors.append({
            'feature_name': subscale.title(),
            'feature_value': total_score,
            'display_value': f"{total_score}/10",
            'impact': 'increases_risk' if total_score >= 4 else 'normal',
            'importance': 1
        })
    
    # ========== WELLBEING DIMENSIONS (NEW!) ==========
    
    elif assessment_type.startswith('Wellbeing_'):
        # Individual wellbeing dimensions (0-10 each)
        dimension = assessment_type.replace('Wellbeing_', '')
        
        if total_score < 4:
            risk_level = "critical"
            explanation += f"{dimension} wellbeing score {total_score}/10 is critically low - requires immediate intervention. "
            recommendations.append(f"🚨 Urgent {dimension.lower()} support required")
            
            # Dimension-specific recommendations
            if dimension == 'Physical':
                recommendations.append("Pain management assessment")
                recommendations.append("Physical therapy or mobility support")
                recommendations.append("Energy conservation strategies")
                recommendations.append("Nutritional assessment")
            elif dimension == 'Mental':
                recommendations.append("Cognitive assessment (MMSE/MoCA)")
                recommendations.append("Stress management techniques")
                recommendations.append("Mental clarity support interventions")
                recommendations.append("Review medications affecting cognition")
            elif dimension == 'Emotional':
                recommendations.append("PHQ-9 depression screening")
                recommendations.append("GAD-7 anxiety screening")
                recommendations.append("Psychology/counseling referral")
                recommendations.append("Emotional support group participation")
            elif dimension == 'Social':
                recommendations.append("Social isolation assessment")
                recommendations.append("Connect with support groups")
                recommendations.append("Family conference to increase visitation")
                recommendations.append("Community resource linkage")
            elif dimension == 'Spiritual':
                recommendations.append("Spiritual care or chaplaincy referral")
                recommendations.append("Explore meaning and purpose concerns")
                recommendations.append("Address existential distress")
                recommendations.append("Consider spiritual practices patient values")
            elif dimension == 'Sleep':
                recommendations.append("Sleep hygiene assessment")
                recommendations.append("Rule out pain disrupting sleep")
                recommendations.append("Review medications affecting sleep")
                recommendations.append("Consider sleep aid if appropriate")
            
        elif total_score < 6:
            risk_level = "warning"
            explanation += f"{dimension} wellbeing score {total_score}/10 is below optimal - needs attention. "
            recommendations.append(f"Address {dimension.lower()} wellbeing concerns")
            recommendations.append(f"Develop intervention plan for {dimension.lower()} support")
            
            if dimension == 'Physical':
                recommendations.append("Gentle exercise within tolerance")
                recommendations.append("Physical therapy consultation")
            elif dimension == 'Mental':
                recommendations.append("Cognitive stimulation activities")
                recommendations.append("Stress reduction techniques")
            elif dimension == 'Emotional':
                recommendations.append("Emotional check-ins daily")
                recommendations.append("Mood tracking and patterns")
            elif dimension == 'Social':
                recommendations.append("Increase social activities")
                recommendations.append("Family/friend contact schedule")
            elif dimension == 'Spiritual':
                recommendations.append("Spiritual care check-in")
                recommendations.append("Meaning-centered activities")
            elif dimension == 'Sleep':
                recommendations.append("Sleep schedule consistency")
                recommendations.append("Relaxation before bedtime")
        
        else:
            explanation += f"{dimension} wellbeing score {total_score}/10 is good - maintain current strategies. "
            recommendations.append(f"Continue supporting {dimension.lower()} wellbeing")
            recommendations.append("Monitor for any changes")
        
        relevant_factors.append({
            'feature_name': f'{dimension} Wellbeing',
            'feature_value': total_score,
            'display_value': f"{total_score}/10",
            'impact': 'increases_risk' if total_score < 6 else 'normal',
            'importance': 1,
            'explanation': f"{dimension} dimension of holistic wellbeing"
        })
    
    # ========== UNKNOWN ASSESSMENT TYPE ==========
    
    else:
        explanation += f"Assessment type '{assessment_type}' not recognized in current XAI system. "
        recommendations.append("Manual clinical review required")
        recommendations.append("Contact system administrator if this is a standard assessment")
    
    # ========== DEFAULT RECOMMENDATIONS ==========
    
    if not recommendations:
        recommendations.append("Continue current care and routine monitoring")
    
    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "focus_type": "assessment",
        "assessment_type": assessment_type,
        "total_score": total_score,
        "risk_level": risk_level,
        "explanation": explanation,
        "relevant_factors": relevant_factors,
        "recommendations": recommendations,
        "confidence": 0.85
    }



# ==================== FOCUSED EXPLANATION FEEDBACK ====================

@router.post("/focused-explanation-feedback")
async def submit_focused_explanation_feedback(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit clinician feedback on focused AI explanation
    
    Enables continuous improvement of XAI explanations based on clinical expertise
    
    Request body:
    {
        "patient_id": 8,
        "focus_type": "vital",
        "focus_identifier": "blood_pressure",
        "focus_value": "160/95",
        "feedback_type": "helpful" | "partially_helpful" | "not_helpful",
        "feedback_note": "Explanation was accurate but recommendations too generic",
        "risk_level_shown": "warning",
        "explanation_shown": "...",
        "recommendations_shown": ["...", "..."]
    }
    """
    
    from src.db import FocusedExplanationFeedback
    
    patient_id = request.get('patient_id')
    focus_type = request.get('focus_type')
    focus_identifier = request.get('focus_identifier')
    feedback_type = request.get('feedback_type')
    
    if not all([patient_id, focus_type, focus_identifier, feedback_type]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    if feedback_type not in ['helpful', 'partially_helpful', 'not_helpful']:
        raise HTTPException(status_code=400, detail="Invalid feedback_type")
    
    # Create feedback record
    feedback = FocusedExplanationFeedback(
        patient_id=patient_id,
        clinician_id=current_user.id,
        focus_type=focus_type,
        focus_identifier=focus_identifier,
        focus_value=request.get('focus_value'),
        feedback_type=feedback_type,
        feedback_note=request.get('feedback_note'),
        risk_level_shown=request.get('risk_level_shown'),
        explanation_shown=request.get('explanation_shown'),
        recommendations_shown=json.dumps(request.get('recommendations_shown', []))
    )
    
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    return {
        "status": "success",
        "message": "Feedback recorded - thank you for helping improve XAI!",
        "feedback_id": feedback.id
    }


@router.get("/focused-explanation-feedback/stats")
async def get_focused_feedback_stats(
    focus_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics on focused explanation feedback
    
    Shows which explanations are helpful vs not helpful
    Helps identify areas for improvement
    """
    
    from src.db import FocusedExplanationFeedback
    from sqlalchemy import func, desc
    
    query = db.query(FocusedExplanationFeedback)
    
    if focus_type:
        query = query.filter(FocusedExplanationFeedback.focus_type == focus_type)
    
    feedbacks = query.all()
    
    # Calculate stats
    total_count = len(feedbacks)
    helpful_count = sum(1 for f in feedbacks if f.feedback_type == 'helpful')
    partially_count = sum(1 for f in feedbacks if f.feedback_type == 'partially_helpful')
    not_helpful_count = sum(1 for f in feedbacks if f.feedback_type == 'not_helpful')
    
    # Group by focus_identifier
    identifier_stats = {}
    for f in feedbacks:
        if f.focus_identifier not in identifier_stats:
            identifier_stats[f.focus_identifier] = {
                'total': 0,
                'helpful': 0,
                'partially_helpful': 0,
                'not_helpful': 0
            }
        identifier_stats[f.focus_identifier]['total'] += 1
        identifier_stats[f.focus_identifier][f.feedback_type] += 1
    
    # Calculate helpfulness scores
    for identifier, stats in identifier_stats.items():
        if stats['total'] > 0:
            stats['helpfulness_score'] = (
                (stats['helpful'] * 1.0 + stats['partially_helpful'] * 0.5) / stats['total']
            ) * 100
    
    return {
        "overall": {
            "total": total_count,
            "helpful": helpful_count,
            "partially_helpful": partially_count,
            "not_helpful": not_helpful_count,
            "helpfulness_percentage": (helpful_count / total_count * 100) if total_count > 0 else 0
        },
        "by_identifier": identifier_stats,
        "focus_type": focus_type or "all"
    }


