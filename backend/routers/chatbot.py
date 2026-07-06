"""
Chatbot Router - Aura AI Assistant
Uses Anthropic Claude API with fallback to rule-based responses
Full database access for real patient data queries
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import os

from src.db import (
    get_db, User, ChatbotSession, ChatbotMessage, Alert,
    Patient, Vital, Symptom, Medication, Appointment, CarePlan
)
from routers.auth import get_current_user
from services.journey_tracker import track_critical_alert

router = APIRouter()

# Check if Anthropic API is available
ANTHROPIC_AVAILABLE = bool(os.getenv("ANTHROPIC_API_KEY"))

if ANTHROPIC_AVAILABLE:
    try:
        from anthropic import Anthropic
        anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    except ImportError:
        ANTHROPIC_AVAILABLE = False
        print("⚠️  Anthropic library not installed - using fallback mode")


# Pydantic Models
class ChatRequest(BaseModel):
    message: str
    patient_context_id: Optional[int] = None


class ChatResponse(BaseModel):
    message: str
    intent: str
    is_crisis: bool
    session_id: int
    structured_data: Optional[Dict[str, Any]] = None
    thinking_process: Optional[List[str]] = None  # NEW: Show AI reasoning steps
    confidence: Optional[float] = None  # NEW: How confident the AI is


# Crisis keywords
CRISIS_KEYWORDS = [
    "kill myself", "end it", "don't want to live", "suicide", "hurt myself",
    "can't go on", "want to die", "no point living", "give up on life"
]

# Enhanced Intent Map with Navigation and Intelligent Understanding
INTENT_MAP = {
    "patient_list": ["show patients", "list patients", "all patients", "how many patients", "patient list", "view patients"],
    "vitals_query": ["show vitals", "latest vitals", "vital signs", "heart rate", "blood pressure", "oxygen", "temperature"],
    "symptoms_query": ["show symptoms", "symptom log", "pain levels", "recent symptoms"],
    "medication_query": ["medication", "drug", "medicine", "dose", "tablet", "pill", "show medications", "list meds"],
    "appointment_query": ["appointment", "schedule", "visit", "when is", "upcoming appointments", "next appointment"],
    "alerts_query": ["alerts", "show alerts", "critical alerts", "warnings", "notifications"],
    "statistics": ["stats", "statistics", "overview", "dashboard", "how many", "system status"],
    "symptom_query": ["pain", "nausea", "tired", "breathless", "anxiety"],
    "emotional_support": ["scared", "worried", "afraid", "overwhelmed", "sad", "depressed", "anxious"],
    
    # ENHANCED: Navigation intents - AI acts as master navigator
    "navigation": [
        "help", "how do i", "where", "navigate", "find", "go to", "take me to", "open", 
        "show me", "access", "get to", "visit", "page", "section", "menu", "where is", 
        "how to find", "how can i", "direct me", "guide me"
    ],
    
    # ENHANCED: Specific page navigation
    "navigate_dashboard": ["dashboard", "home", "main page", "overview", "homepage"],
    "navigate_patients": ["patients page", "patient list", "view patients", "see patients"],
    "navigate_messages": ["messages", "inbox", "chat", "communications"],
    "navigate_alerts": ["alerts page", "notifications", "warnings page"],
    "navigate_medications": ["medications page", "drugs page", "medicine list"],
    "navigate_appointments": ["appointments page", "calendar", "schedule"],
    "navigate_caregivers": ["caregivers page", "care team", "staff"],
    "navigate_community": ["community", "forum", "support group", "community hub"],
    "navigate_journal": ["journal", "my journal", "diary"],
    "navigate_resources": ["resources", "library", "resource library"],
    "navigate_profile": ["profile", "my profile", "account", "settings"],
    "navigate_assessments": ["assessments", "clinical assessments", "forms"],
    "navigate_memory_vault": ["memory vault", "memories", "legacy"],
    "navigate_care_guide": ["care guide", "guidance", "care instructions"],
    
    # ENHANCED: Task-based understanding
    "add_patient": ["add patient", "new patient", "create patient", "register patient"],
    "record_vitals": ["record vitals", "enter vitals", "add vital signs", "log vitals"],
    "send_message": ["send message", "write message", "compose message"],
    "create_appointment": ["create appointment", "new appointment", "schedule appointment", "book appointment"],
    
    # ENHANCED: Information seeking (conversational)
    "what_is": ["what is", "what are", "what's", "define", "explain", "tell me about"],
    "how_to": ["how to", "how do i", "how can i", "steps to", "guide me to"],
    "why": ["why", "reason", "purpose", "benefit"],
    
    "general": []
}

# Page Navigation Map - Knows every route in the system
PAGE_ROUTES = {
    "dashboard": {"path": "/dashboard", "name": "Dashboard", "description": "Main overview with patient statistics"},
    "home": {"path": "/dashboard", "name": "Home", "description": "Main dashboard"},
    "patients": {"path": "/patients", "name": "Patients", "description": "View and manage all patients"},
    "messages": {"path": "/messages", "name": "Messages", "description": "Communication center"},
    "alerts": {"path": "/alerts", "name": "Alerts", "description": "Active alerts and notifications"},
    "medications": {"path": "/medications", "name": "Medications", "description": "Medication management"},
    "appointments": {"path": "/appointments", "name": "Appointments", "description": "Schedule and appointments"},
    "caregivers": {"path": "/caregivers", "name": "Caregivers", "description": "Caregiver management"},
    "care guide": {"path": "/care-guide", "name": "Care Guide", "description": "Adaptive care guidance"},
    "assessments": {"path": "/assessments", "name": "Assessments", "description": "Clinical assessment forms"},
    "community": {"path": "/community", "name": "Community Hub", "description": "Community support and forums"},
    "journal": {"path": "/journal", "name": "My Journal", "description": "Personal journaling"},
    "memory vault": {"path": "/memory-vault", "name": "Memory Vault", "description": "Digital memories"},
    "legacy": {"path": "/legacy-setup", "name": "Digital Legacy", "description": "Legacy content management"},
    "resources": {"path": "/resources", "name": "Resources", "description": "Resource library"},
    "profile": {"path": "/profile", "name": "My Profile", "description": "User profile and settings"},
    "my journey": {"path": "/my-journey", "name": "My Journey", "description": "Patient journey map"},
    "ai insights": {"path": "/ai-insights", "name": "AI Insights", "description": "AI-powered analytics"},
    "continuity bridge": {"path": "/continuity-bridge", "name": "Continuity Bridge", "description": "Bereavement support"},
    "admin": {"path": "/admin/users", "name": "Administration", "description": "User management"},
}


def detect_intent(message: str) -> str:
    """
    Enhanced intelligent intent detection
    Now understands navigation, tasks, and questions
    """
    msg_lower = message.lower()
    
    # Priority 1: Check for specific page navigation
    for intent_name, keywords in INTENT_MAP.items():
        if intent_name.startswith("navigate_"):
            if any(kw in msg_lower for kw in keywords):
                return intent_name
    
    # Priority 2: Check for task-based intents
    task_intents = ["add_patient", "record_vitals", "send_message", "create_appointment"]
    for intent in task_intents:
        if any(kw in msg_lower for kw in INTENT_MAP.get(intent, [])):
            return intent
    
    # Priority 3: Check for information seeking patterns
    info_intents = ["what_is", "how_to", "why"]
    for intent in info_intents:
        if any(kw in msg_lower for kw in INTENT_MAP.get(intent, [])):
            return intent
    
    # Priority 4: Check for data queries
    for intent, keywords in INTENT_MAP.items():
        if intent in ["patient_list", "vitals_query", "symptoms_query", "medication_query", 
                      "appointment_query", "alerts_query", "statistics"]:
            if any(kw in msg_lower for kw in keywords):
                return intent
    
    # Priority 5: Check for emotional support
    if any(kw in msg_lower for kw in INTENT_MAP.get("emotional_support", [])):
        return "emotional_support"
    
    # Priority 6: General navigation
    if any(kw in msg_lower for kw in INTENT_MAP.get("navigation", [])):
        return "navigation"
    
    return "general"


def detect_crisis(message: str) -> bool:
    """Detect crisis indicators"""
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in CRISIS_KEYWORDS)


def get_or_create_session(user_id: int, db: Session) -> ChatbotSession:
    """Get or create active chatbot session"""
    # Get most recent session
    session = db.query(ChatbotSession).filter(
        ChatbotSession.user_id == user_id,
        ChatbotSession.ended_at == None
    ).first()
    
    if not session:
        session = ChatbotSession(user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    
    return session


# ==================== DATA QUERY FUNCTIONS ====================

def query_patients(db: Session, limit: int = 10) -> Dict[str, Any]:
    """Query all patients with detailed information"""
    patients = db.query(Patient).order_by(Patient.created_at.desc()).limit(limit).all()
    
    patient_data = []
    for patient in patients:
        # Get latest vital
        latest_vital = db.query(Vital).filter(
            Vital.patient_id == patient.id
        ).order_by(Vital.recorded_at.desc()).first()
        
        # Get active medications count
        active_meds = db.query(Medication).filter(
            Medication.patient_id == patient.id,
            Medication.is_active == True
        ).count()
        
        patient_data.append({
            'id': patient.id,
            'name': patient.full_name,
            'code': patient.patient_code,
            'age': patient.age,
            'diagnosis': patient.primary_diagnosis,
            'status': patient.status,
            'active_medications': active_meds,
            'latest_hr': latest_vital.heart_rate if latest_vital else 'N/A',
            'latest_o2': latest_vital.oxygen_saturation if latest_vital else 'N/A'
        })
    
    return {
        'total_count': db.query(Patient).count(),
        'showing': len(patient_data),
        'patients': patient_data
    }


def query_vitals(db: Session, patient_id: Optional[int] = None, limit: int = 5) -> Dict[str, Any]:
    """Query latest vital signs"""
    query = db.query(Vital)
    
    if patient_id:
        query = query.filter(Vital.patient_id == patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        patient_name = patient.full_name if patient else 'Unknown'
    else:
        patient_name = 'All Patients'
    
    vitals = query.order_by(Vital.recorded_at.desc()).limit(limit).all()
    
    vitals_data = []
    for vital in vitals:
        patient = db.query(Patient).filter(Patient.id == vital.patient_id).first()
        vitals_data.append({
            'patient_name': patient.full_name if patient else 'Unknown',
            'patient_code': patient.patient_code if patient else 'N/A',
            'heart_rate': vital.heart_rate,
            'blood_pressure': f"{vital.blood_pressure_sys}/{vital.blood_pressure_dia}" if vital.blood_pressure_sys else 'N/A',
            'oxygen_saturation': vital.oxygen_saturation,
            'temperature': vital.temperature,
            'recorded_at': vital.recorded_at.strftime('%Y-%m-%d %H:%M')
        })
    
    return {
        'patient_context': patient_name,
        'count': len(vitals_data),
        'vitals': vitals_data
    }


def query_symptoms(db: Session, patient_id: Optional[int] = None, limit: int = 5) -> Dict[str, Any]:
    """Query recent symptoms"""
    query = db.query(Symptom)
    
    if patient_id:
        query = query.filter(Symptom.patient_id == patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        patient_name = patient.full_name if patient else 'Unknown'
    else:
        patient_name = 'All Patients'
    
    symptoms = query.order_by(Symptom.recorded_at.desc()).limit(limit).all()
    
    symptoms_data = []
    for symptom in symptoms:
        patient = db.query(Patient).filter(Patient.id == symptom.patient_id).first()
        active_symptoms = []
        if symptom.pain_level and symptom.pain_level > 0:
            active_symptoms.append(f"Pain: {symptom.pain_level}/10")
        if symptom.nausea:
            active_symptoms.append("Nausea")
        if symptom.fatigue:
            active_symptoms.append("Fatigue")
        if symptom.anxiety:
            active_symptoms.append("Anxiety")
        if symptom.dyspnea:
            active_symptoms.append("Breathlessness")
        
        symptoms_data.append({
            'patient_name': patient.full_name if patient else 'Unknown',
            'patient_code': patient.patient_code if patient else 'N/A',
            'symptoms': ', '.join(active_symptoms) if active_symptoms else 'None reported',
            'notes': symptom.notes or 'No notes',
            'recorded_at': symptom.recorded_at.strftime('%Y-%m-%d %H:%M')
        })
    
    return {
        'patient_context': patient_name,
        'count': len(symptoms_data),
        'symptoms': symptoms_data
    }


def query_medications(db: Session, patient_id: Optional[int] = None) -> Dict[str, Any]:
    """Query active medications"""
    query = db.query(Medication).filter(Medication.is_active == True)
    
    if patient_id:
        query = query.filter(Medication.patient_id == patient_id)
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        patient_name = patient.full_name if patient else 'Unknown'
    else:
        patient_name = 'All Patients'
    
    medications = query.all()
    
    meds_data = []
    for med in medications:
        patient = db.query(Patient).filter(Patient.id == med.patient_id).first()
        meds_data.append({
            'patient_name': patient.full_name if patient else 'Unknown',
            'patient_code': patient.patient_code if patient else 'N/A',
            'medication': med.name,
            'dose': med.dose,
            'frequency': med.frequency,
            'route': med.route,
            'purpose': med.purpose or 'Not specified'
        })
    
    return {
        'patient_context': patient_name,
        'count': len(meds_data),
        'medications': meds_data
    }


def query_appointments(db: Session, upcoming: bool = True, limit: int = 10) -> Dict[str, Any]:
    """Query appointments"""
    query = db.query(Appointment)
    
    if upcoming:
        query = query.filter(
            Appointment.scheduled_at >= datetime.utcnow(),
            Appointment.status.in_(['scheduled', 'confirmed'])
        ).order_by(Appointment.scheduled_at.asc())
    else:
        query = query.order_by(Appointment.scheduled_at.desc())
    
    appointments = query.limit(limit).all()
    
    appts_data = []
    for appt in appointments:
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        appts_data.append({
            'patient_name': patient.full_name if patient else 'Unknown',
            'patient_code': patient.patient_code if patient else 'N/A',
            'appointment_type': appt.appointment_type,
            'scheduled_at': appt.scheduled_at.strftime('%Y-%m-%d %H:%M'),
            'location': appt.location or 'Not specified',
            'status': appt.status,
            'notes': appt.notes or 'No notes'
        })
    
    return {
        'type': 'upcoming' if upcoming else 'all',
        'count': len(appts_data),
        'appointments': appts_data
    }


def query_alerts(db: Session, severity: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
    """Query active alerts"""
    query = db.query(Alert).filter(Alert.is_acknowledged == False)
    
    if severity:
        query = query.filter(Alert.severity == severity)
    
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    
    alerts_data = []
    for alert in alerts:
        patient = None
        if alert.patient_id:
            patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()
        
        alerts_data.append({
            'alert_type': alert.alert_type,
            'severity': alert.severity,
            'message': alert.message,
            'patient_name': patient.full_name if patient else 'System',
            'patient_code': patient.patient_code if patient else 'N/A',
            'triggered_value': alert.triggered_value or 'N/A',
            'created_at': alert.created_at.strftime('%Y-%m-%d %H:%M')
        })
    
    return {
        'severity_filter': severity or 'all',
        'count': len(alerts_data),
        'alerts': alerts_data
    }


def query_statistics(db: Session) -> Dict[str, Any]:
    """Get system statistics and overview"""
    # Patient stats
    total_patients = db.query(Patient).count()
    stable_patients = db.query(Patient).filter(Patient.status == 'stable').count()
    deteriorating_patients = db.query(Patient).filter(Patient.status == 'deteriorating').count()
    
    # Alerts stats
    total_alerts = db.query(Alert).filter(Alert.is_acknowledged == False).count()
    critical_alerts = db.query(Alert).filter(
        Alert.is_acknowledged == False,
        Alert.severity == 'critical'
    ).count()
    
    # Appointments today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    appointments_today = db.query(Appointment).filter(
        Appointment.scheduled_at >= today_start,
        Appointment.scheduled_at < today_end
    ).count()
    
    # Medications
    total_active_meds = db.query(Medication).filter(Medication.is_active == True).count()
    
    # Recent vitals (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_vitals = db.query(Vital).filter(Vital.recorded_at >= yesterday).count()
    
    return {
        'patients': {
            'total': total_patients,
            'stable': stable_patients,
            'deteriorating': deteriorating_patients
        },
        'alerts': {
            'total': total_alerts,
            'critical': critical_alerts
        },
        'appointments_today': appointments_today,
        'active_medications': total_active_meds,
        'vitals_last_24h': recent_vitals
    }


def format_data_for_chat(data: Dict[str, Any], intent: str) -> str:
    """Format database query results into readable chat messages"""
    
    if intent == "patient_list":
        msg = f"📋 **Patient Overview** (Showing {data['showing']} of {data['total_count']} total)\n\n"
        for patient in data['patients']:
            msg += f"**{patient['name']}** (Code: {patient['code']})\n"
            msg += f"  - Age: {patient['age']} | Diagnosis: {patient['diagnosis']}\n"
            msg += f"  - Status: {patient['status'].title()} | Active Meds: {patient['active_medications']}\n"
            msg += f"  - Latest HR: {patient['latest_hr']} | O2: {patient['latest_o2']}%\n\n"
        return msg.strip()
    
    elif intent == "vitals_query":
        msg = f"❤️ **Latest Vital Signs** - {data['patient_context']}\n\n"
        for vital in data['vitals']:
            msg += f"**{vital['patient_name']}** ({vital['patient_code']})\n"
            msg += f"  - HR: {vital['heart_rate']} bpm | BP: {vital['blood_pressure']}\n"
            msg += f"  - O2 Sat: {vital['oxygen_saturation']}% | Temp: {vital['temperature']}°C\n"
            msg += f"  - Recorded: {vital['recorded_at']}\n\n"
        return msg.strip()
    
    elif intent == "symptoms_query":
        msg = f"🩺 **Recent Symptoms** - {data['patient_context']}\n\n"
        for symptom in data['symptoms']:
            msg += f"**{symptom['patient_name']}** ({symptom['patient_code']})\n"
            msg += f"  - Symptoms: {symptom['symptoms']}\n"
            msg += f"  - Notes: {symptom['notes']}\n"
            msg += f"  - Recorded: {symptom['recorded_at']}\n\n"
        return msg.strip()
    
    elif intent == "medication_query":
        msg = f"💊 **Active Medications** - {data['patient_context']}\n\n"
        for med in data['medications']:
            msg += f"**{med['patient_name']}** ({med['patient_code']})\n"
            msg += f"  - {med['medication']} - {med['dose']}\n"
            msg += f"  - Frequency: {med['frequency']} | Route: {med['route']}\n"
            msg += f"  - Purpose: {med['purpose']}\n\n"
        return msg.strip()
    
    elif intent == "appointment_query":
        msg = f"📅 **{data['type'].title()} Appointments** ({data['count']} total)\n\n"
        for appt in data['appointments']:
            msg += f"**{appt['patient_name']}** ({appt['patient_code']})\n"
            msg += f"  - Type: {appt['appointment_type']}\n"
            msg += f"  - When: {appt['scheduled_at']}\n"
            msg += f"  - Location: {appt['location']}\n"
            msg += f"  - Status: {appt['status'].title()}\n\n"
        return msg.strip()
    
    elif intent == "alerts_query":
        msg = f"🚨 **Active Alerts** - {data['severity_filter'].title()} ({data['count']} total)\n\n"
        for alert in data['alerts']:
            severity_icon = "🔴" if alert['severity'] == 'critical' else "🟡" if alert['severity'] == 'warning' else "🟢"
            msg += f"{severity_icon} **{alert['alert_type'].replace('_', ' ').title()}**\n"
            msg += f"  - Patient: {alert['patient_name']} ({alert['patient_code']})\n"
            msg += f"  - Message: {alert['message']}\n"
            msg += f"  - Value: {alert['triggered_value']}\n"
            msg += f"  - Time: {alert['created_at']}\n\n"
        return msg.strip()
    
    elif intent == "statistics":
        msg = f"📊 **System Overview**\n\n"
        msg += f"**Patients:**\n"
        msg += f"  - Total: {data['patients']['total']}\n"
        msg += f"  - Stable: {data['patients']['stable']}\n"
        msg += f"  - Deteriorating: {data['patients']['deteriorating']}\n\n"
        msg += f"**Alerts:**\n"
        msg += f"  - Active: {data['alerts']['total']}\n"
        msg += f"  - Critical: {data['alerts']['critical']}\n\n"
        msg += f"**Today:**\n"
        msg += f"  - Appointments: {data['appointments_today']}\n"
        msg += f"  - Active Medications: {data['active_medications']}\n"
        msg += f"  - Vitals (24h): {data['vitals_last_24h']}\n"
        return msg.strip()
    
    return str(data)


def generate_thinking_process(intent: str, message: str, data: Optional[Dict] = None, user_role: str = "patient") -> List[str]:
    """
    Generate visible thinking steps to show AI reasoning process
    This makes the AI feel more intelligent and trustworthy
    """
    steps = []
    msg_lower = message.lower()
    
    # Step 1: Understanding the question
    steps.append(f"🔍 Analyzing your question: '{message[:50]}...'")
    
    # Step 2: Intent detection
    intent_descriptions = {
        "patient_list": "You're asking for patient information",
        "vitals_query": "You want to see vital signs data",
        "symptoms_query": "You're inquiring about symptoms",
        "medication_query": "You need medication information",
        "appointment_query": "You're asking about appointments",
        "alerts_query": "You want to check active alerts",
        "statistics": "You need system overview statistics",
        "emotional_support": "You're sharing feelings - I'm here to listen",
        "navigation": "You need help navigating the platform",
        "general": "Processing your general inquiry"
    }
    steps.append(f"🧠 Detected intent: {intent_descriptions.get(intent, 'Understanding your request')}")
    
    # Step 3: Data query process (if applicable)
    if intent in ["patient_list", "vitals_query", "symptoms_query", "medication_query", "appointment_query", "alerts_query", "statistics"]:
        steps.append(f"📊 Querying database for real-time data...")
        
        if data:
            # Show specific query details
            if intent == "patient_list" and data.get('patients'):
                count = len(data['patients'])
                steps.append(f"✓ Found {count} patients with current data")
            elif intent == "vitals_query" and data.get('vitals'):
                count = len(data['vitals'])
                steps.append(f"✓ Retrieved {count} latest vital sign readings")
            elif intent == "alerts_query" and data.get('alerts'):
                count = data.get('count', 0)
                severity = data.get('severity_filter', 'all')
                steps.append(f"✓ Found {count} {severity} alerts")
            elif intent == "statistics" and data.get('patients'):
                total = data['patients'].get('total', 0)
                steps.append(f"✓ Analyzed data for {total} patients")
            else:
                steps.append(f"✓ Data retrieved successfully")
    
    # Step 4: Analysis/thinking
    if user_role == "clinician":
        if intent in ["patient_list", "vitals_query", "alerts_query"]:
            steps.append("🔬 Analyzing clinical significance and priorities...")
        else:
            steps.append("💭 Preparing clinical-grade response...")
    elif intent == "emotional_support":
        steps.append("❤️ Considering compassionate response...")
    else:
        steps.append("💡 Formulating helpful response...")
    
    # Step 5: Response generation
    steps.append("✍️ Generating specific, actionable answer...")
    
    return steps


def calculate_response_confidence(intent: str, data: Optional[Dict], message: str) -> float:
    """
    Calculate confidence score for the response
    Shows users how reliable the answer is
    """
    confidence = 0.5  # Base confidence
    
    # High confidence for data-backed responses
    if data and intent in ["patient_list", "vitals_query", "symptoms_query", "medication_query", "appointment_query", "alerts_query", "statistics"]:
        confidence = 0.95  # Very high confidence when showing real data
    
    # Medium-high confidence for well-defined intents
    elif intent in ["navigation", "emotional_support"]:
        confidence = 0.85
    
    # Lower confidence for general queries
    elif intent == "general":
        # Check if message is very specific
        if len(message.split()) > 10:  # Longer, more specific questions
            confidence = 0.70
        else:
            confidence = 0.60
    
    return confidence


def query_patient_data(intent: str, message: str, db: Session) -> Optional[tuple[str, Dict[str, Any]]]:

    """
    Main data query dispatcher - routes intent to appropriate query function
    Returns (formatted_message, structured_data) or None
    """
    msg_lower = message.lower()
    
    # Extract patient context if mentioned
    patient_id = None
    # Simple patient ID extraction (could be enhanced with NLP)
    
    try:
        if intent == "patient_list":
            data = query_patients(db)
            formatted_msg = format_data_for_chat(data, intent)
            return (formatted_msg, data)
        
        elif intent == "vitals_query":
            data = query_vitals(db, patient_id)
            formatted_msg = format_data_for_chat(data, intent)
            return (formatted_msg, data)
        
        elif intent == "symptoms_query":
            data = query_symptoms(db, patient_id)
            formatted_msg = format_data_for_chat(data, intent)
            return (formatted_msg, data)
        
        elif intent == "medication_query":
            # Check if user wants to see medications
            if any(word in msg_lower for word in ['show', 'list', 'what', 'display']):
                data = query_medications(db, patient_id)
                formatted_msg = format_data_for_chat(data, intent)
                return (formatted_msg, data)
        
        elif intent == "appointment_query":
            data = query_appointments(db, upcoming=True)
            formatted_msg = format_data_for_chat(data, intent)
            return (formatted_msg, data)
        
        elif intent == "alerts_query":
            severity = None
            if 'critical' in msg_lower:
                severity = 'critical'
            elif 'warning' in msg_lower:
                severity = 'warning'
            data = query_alerts(db, severity)
            formatted_msg = format_data_for_chat(data, intent)
            return (formatted_msg, data)
        
        elif intent == "statistics":
            data = query_statistics(db)
            formatted_msg = format_data_for_chat(data, intent)
            return (formatted_msg, data)
        
    except Exception as e:
        print(f"Error querying patient data: {e}")
        return None
    
    return None


def get_fallback_response(intent: str, is_crisis: bool, message: str = "", db: Session = None, user_role: str = "patient") -> str:
    """
    ENHANCED: Super intelligent fallback responses
    Acts as master navigator, conversation expert, and helpful guide
    """
    if is_crisis:
        return (
            "I'm concerned about what you've shared. Please reach out immediately:\n"
            "- Mental Health Authority Ghana: 0800-111-011 (toll-free)\n"
            "- Befrienders Ghana: 0244-846-472\n"
            "Your care team has been notified. You are not alone."
        )
    
    msg_lower = message.lower()
    
    # ============ ENHANCED: Intelligent Navigation Responses ============
    
    # Handle specific page navigation requests
    if intent.startswith("navigate_"):
        page_key = intent.replace("navigate_", "").replace("_", " ")
        
        if page_key in PAGE_ROUTES:
            page_info = PAGE_ROUTES[page_key]
            return (
                f"🚀 **Navigation:** Taking you to **{page_info['name']}**\n\n"
                f"📝 {page_info['description']}\n\n"
                f"**Action Required:** Click this link → `{page_info['path']}`\n\n"
                f"💡 **Tip:** I can also help you:\n"
                f"- Understand what you'll find there\n"
                f"- Guide you through the page\n"
                f"- Answer questions about the features\n\n"
                f"Just ask me anything about {page_info['name']}!"
            )
    
    # General navigation help - shows all available pages
    if intent == "navigation" or any(word in msg_lower for word in ['where', 'find', 'navigate', 'go to', 'show me']):
        # Try to extract what they're looking for
        for page_key, page_info in PAGE_ROUTES.items():
            if page_key in msg_lower or page_info['name'].lower() in msg_lower:
                return (
                    f"🎯 **Found it!** You're looking for **{page_info['name']}**\n\n"
                    f"📍 **Location:** {page_info['path']}\n"
                    f"📝 **What it does:** {page_info['description']}\n\n"
                    f"**Quick Actions:**\n"
                    f"- Click the navigation menu and select '{page_info['name']}'\n"
                    f"- Or use the direct link: `{page_info['path']}`\n\n"
                    f"Need help using it? Just ask!"
                )
        
        # If they didn't specify, show all available pages
        if user_role == 'clinician' or user_role == 'admin':
            pages_list = "📋 **Dashboard** - Main overview\n- 👥 **Patients** - Patient management\n- 🚨 **Alerts** - Critical notifications\n- 🧠 **AI Insights** - Intelligent analytics\n- 💊 **Medications** - Medication management\n- 📅 **Appointments** - Scheduling\n- 👨‍⚕️ **Caregivers** - Team management\n- 📊 **Care Guide** - Clinical guidance"
        elif user_role == 'patient' or user_role == 'family':
            pages_list = "🏠 **My Space** - Your dashboard\n- 💬 **Messages** - Communications\n- 🗺️ **My Journey** - Journey map\n- 📚 **Resources** - Helpful resources\n- 👥 **Community** - Support group\n- 📔 **Journal** - Personal journal\n- 💖 **Memory Vault** - Digital memories"
        else:
            pages_list = "📋 **Dashboard**\n- 👥 **Patients**\n- 💬 **Messages**\n- 📅 **Appointments**\n- 💊 **Medications**\n- 👤 **Profile**"
        
        return (
            f"🗺️ **Platform Navigation Guide**\n\n"
            f"Here are all the pages available to you:\n\n"
            f"{pages_list}\n\n"
            f"**How to navigate:**\n"
            f"- Tell me where you want to go: \"Take me to messages\"\n"
            f"- Ask what something does: \"What is AI Insights?\"\n"
            f"- Get help with a feature: \"How do I add a patient?\"\n\n"
            f"Where would you like to go?"
        )
    
    # ============ ENHANCED: Task-Based Intelligent Responses ============
    
    if intent == "add_patient":
        return (
            "➕ **Adding a New Patient**\n\n"
            "**Step-by-step guide:**\n"
            "1. Go to the **Patients** page (left sidebar)\n"
            "2. Click the **\"+ Add Patient\"** button (top-right)\n"
            "3. Fill in the required information:\n"
            "   - Full name\n"
            "   - Date of birth\n"
            "   - Contact information\n"
            "   - Primary diagnosis\n"
            "   - Emergency contacts\n"
            "4. Click **\"Save Patient\"**\n\n"
            "**Pro tips:**\n"
            "- All fields marked with * are required\n"
            "- You can always edit details later\n"
            "- Patient code is auto-generated\n\n"
            "Need me to take you to the Patients page?"
        )
    
    if intent == "record_vitals":
        return (
            "📊 **Recording Vital Signs**\n\n"
            "**Two ways to record vitals:**\n\n"
            "**Method 1: From Patient Details**\n"
            "1. Go to **Patients** page\n"
            "2. Click on the patient's name\n"
            "3. Click **\"Vitals\"** tab\n"
            "4. Click **\"+ Add Vitals\"**\n\n"
            "**Method 2: Patient Monitor**\n"
            "1. Go to **Patient Monitor** page\n"
            "2. Select patient from dropdown\n"
            "3. Enter all vital signs\n"
            "4. Click **\"Record\"**\n\n"
            "**What to record:**\n"
            "- Heart Rate (bpm)\n"
            "- Blood Pressure (systolic/diastolic)\n"
            "- Oxygen Saturation (%)\n"
            "- Temperature (°C)\n"
            "- Respiratory Rate\n\n"
            "The AI will automatically analyze for alerts! 🚨\n\n"
            "Which method would you prefer?"
        )
    
    if intent == "send_message":
        return (
            "💬 **Sending Messages**\n\n"
            "**Quick guide:**\n"
            "1. Go to **Messages** page (left sidebar)\n"
            "2. Click **\"New Message\"** or **\"+ Compose\"**\n"
            "3. Select recipient(s)\n"
            "4. Type your message\n"
            "5. Click **\"Send\"**\n\n"
            "**Features:**\n"
            "- Send to individuals or groups\n"
            "- Attach files (documents, images)\n"
            "- Priority marking for urgent messages\n"
            "- Read receipts\n\n"
            "**Who can you message?**\n"
            "- Care team members\n"
            "- Patients (if you're a clinician)\n"
            "- Family members\n"
            "- Administration\n\n"
            "Ready to send a message? Let me take you there!"
        )
    
    if intent == "create_appointment":
        return (
            "📅 **Scheduling an Appointment**\n\n"
            "**Steps:**\n"
            "1. Go to **Appointments** page\n"
            "2. Click **\"+ New Appointment\"**\n"
            "3. Select patient (if applicable)\n"
            "4. Choose appointment type:\n"
            "   - Consultation\n"
            "   - Follow-up\n"
            "   - Assessment\n"
            "   - Home visit\n"
            "5. Set date and time\n"
            "6. Add location and notes\n"
            "7. Click **\"Schedule\"**\n\n"
            "**Automatic features:**\n"
            "✅ Patient gets notified\n"
            "✅ Reminder sent 24 hours before\n"
            "✅ Appears on team calendar\n\n"
            "Shall I take you to the Appointments page?"
        )
    
    # ============ ENHANCED: "What is" Questions - Explanatory Responses ============
    
    if intent == "what_is":
        # Extract what they're asking about
        if 'risk score' in msg_lower or 'risk' in msg_lower:
            return (
                "🎯 **What is a Risk Score?**\n\n"
                "Risk scores predict how likely a patient's condition may deteriorate.\n\n"
                "**How it's calculated:**\n"
                "- Vital signs (heart rate, BP, O2 sat)\n"
                "- Symptom burden (pain, nausea, etc.)\n"
                "- Disease trajectory\n"
                "- Recent changes/trends\n\n"
                "**Score meanings:**\n"
                "🟢 **0-30% (Low):** Stable, routine care\n"
                "🟡 **30-70% (Moderate):** Monitor closely\n"
                "🔴 **70-100% (High):** Urgent attention needed\n\n"
                "**Why it matters:**\n"
                "Helps prioritize care and catch problems early!\n\n"
                "Want to see risk scores for your patients?"
            )
        
        elif 'ai insights' in msg_lower or 'ai' in msg_lower:
            return (
                "🧠 **What is AI Insights?**\n\n"
                "AI Insights is your intelligent clinical assistant that:\n\n"
                "**Analyzes:**\n"
                "- All patient vitals in real-time\n"
                "- Symptom patterns over time\n"
                "- Medication effectiveness\n"
                "- Risk factors\n\n"
                "**Predicts:**\n"
                "- Which patients need urgent attention\n"
                "- Likely deterioration before it happens\n"
                "- Optimal intervention timing\n\n"
                "**Recommends:**\n"
                "- Specific actions for each patient\n"
                "- Care pathway adjustments\n"
                "- Resource allocation\n\n"
                "**Result:** Better outcomes, less reactive care!\n\n"
                "Available in your sidebar → **AI Insights**\n\n"
                "Want to see it in action?"
            )
        
        elif 'memory vault' in msg_lower or 'legacy' in msg_lower:
            return (
                "💖 **What is Memory Vault / Digital Legacy?**\n\n"
                "A compassionate space for patients to:\n\n"
                "**Preserve:**\n"
                "- Life stories and memories\n"
                "- Photos and videos\n"
                "- Voice recordings\n"
                "- Letters to loved ones\n\n"
                "**Share:**\n"
                "- Messages for future delivery\n"
                "- Wisdom and advice\n"
                "- Family history\n\n"
                "**Purpose:**\n"
                "Creating lasting connections that transcend physical presence. Helps with grief processing and keeps memories alive.\n\n"
                "**Privacy:** Patients control who sees what and when.\n\n"
                "This is a beautiful gift to loved ones. 💝\n\n"
                "Interested in exploring this feature?"
            )
        
        elif 'continuity bridge' in msg_lower or 'bereavement' in msg_lower:
            return (
                "🌉 **What is Continuity Bridge?**\n\n"
                "Support system for families after a patient passes:\n\n"
                "**Provides:**\n"
                "- Grief counseling resources\n"
                "- Bereavement support groups\n"
                "- Administrative guidance (paperwork, etc.)\n"
                "- Access to legacy content\n"
                "- Continued care team connection\n\n"
                "**Philosophy:**\n"
                "Care doesn't end at death. We support families through their grief journey.\n\n"
                "**Features:**\n"
                "- Gradual content delivery (messages released over time)\n"
                "- Community support\n"
                "- Professional counselor connections\n\n"
                "This is palliative care extending beyond the patient. ❤️"
            )
        
        else:
            # Generic what is response
            return (
                "🤔 **Let me help explain!**\n\n"
                "I can explain any feature in ProjectAura:\n\n"
                "**Clinical features:**\n"
                "- Risk scores and predictions\n"
                "- AI Insights and analytics\n"
                "- Patient monitoring\n"
                "- Alert systems\n\n"
                "**Patient/Family features:**\n"
                "- Memory Vault (digital legacy)\n"
                "- Continuity Bridge (bereavement)\n"
                "- Community support\n"
                "- Journey mapping\n\n"
                "What specifically would you like to understand?\n\n"
                "Try: \"What is [feature name]?\""
            )
    
    # ============ ENHANCED: "How to" Questions - Step-by-Step Guides ============
    
    if intent == "how_to":
        # Check what they want to know how to do
        if 'assess' in msg_lower or 'assessment' in msg_lower or 'form' in msg_lower:
            return (
                "📋 **How to Complete Clinical Assessments**\n\n"
                "**Step 1: Choose Assessment Type**\n"
                "Go to **Assessments** page and select:\n"
                "- ESAS (Edmonton Symptom Assessment)\n"
                "- PPS (Palliative Performance Scale)\n"
                "- Pain Assessment (Brief Pain Inventory)\n"
                "- Barthel Index (Activities of Daily Living)\n"
                "- Mental Health Screening\n"
                "- Quality of Life\n\n"
                "**Step 2: Fill Out Form**\n"
                "- Answer all required questions\n"
                "- Be as accurate as possible\n"
                "- Add notes for context\n\n"
                "**Step 3: Submit**\n"
                "- Review your answers\n"
                "- Click \"Submit Assessment\"\n"
                "- AI analyzes immediately!\n\n"
                "**What happens next:**\n"
                "✅ Score calculated automatically\n"
                "✅ Trends analyzed\n"
                "✅ Alerts triggered if needed\n"
                "✅ Recommendations generated\n\n"
                "Which assessment would you like to complete?"
            )
        
        elif 'view' in msg_lower or 'see' in msg_lower or 'check' in msg_lower:
            return (
                "👀 **How to View Patient Information**\n\n"
                "**Quick Method:**\n"
                "1. Click **Patients** in sidebar\n"
                "2. See list of all patients\n"
                "3. Click any patient's name\n\n"
                "**Patient Detail View Shows:**\n"
                "- **Overview** - Basic info, status\n"
                "- **Vitals** - All vital sign history\n"
                "- **Symptoms** - Symptom log\n"
                "- **Medications** - Current prescriptions\n"
                "- **Appointments** - Scheduled visits\n"
                "- **Care Plan** - Treatment plan\n"
                "- **Assessments** - All completed forms\n"
                "- **AI Analysis** - Risk scores and insights\n\n"
                "**Filters Available:**\n"
                "- By status (stable, deteriorating, critical)\n"
                "- By risk level\n"
                "- Search by name or code\n\n"
                "Ready to view patients now?"
            )
        
        else:
            return (
                "📖 **How-To Guides Available:**\n\n"
                "I can guide you through ANY task! Just ask:\n\n"
                "**Common questions:**\n"
                "- \"How to add a patient?\"\n"
                "- \"How to record vitals?\"\n"
                "- \"How to complete assessments?\"\n"
                "- \"How to send messages?\"\n"
                "- \"How to schedule appointments?\"\n"
                "- \"How to view patient history?\"\n"
                "- \"How to set up alerts?\"\n\n"
                "What would you like to learn?"
            )
    
    # ============ ENHANCED: Greeting Detection with Personalization ============
    
    if any(word in msg_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
        greeting_time = "Hello"
        
        if user_role == 'clinician' or user_role == 'admin':
            return (
                f"{greeting_time}! I'm **Aura**, your intelligent clinical AI assistant. 🧠\n\n"
                f"**I'm not just a chatbot** - I'm your master navigator and decision support tool!\n\n"
                f"**What I can do:**\n"
                f"✅ Show you real-time patient data\n"
                f"✅ Navigate you to any page instantly\n"
                f"✅ Explain clinical concepts\n"
                f"✅ Guide you through any task\n"
                f"✅ Answer questions conversationally\n\n"
                f"**Try me:**\n"
                f"- \"Show me critical patients\"\n"
                f"- \"Take me to AI Insights\"\n"
                f"- \"How do I record vitals?\"\n"
                f"- \"What does risk score mean?\"\n"
                f"- \"Explain this alert\"\n\n"
                f"What would you like to do first?"
            )
        elif user_role == 'caregiver':
            return (
                f"{greeting_time}! I'm **Aura**, here to support your caregiving. 💚\n\n"
                f"I can help you:\n"
                f"- Navigate the platform easily\n"
                f"- Understand patient symptoms\n"
                f"- Guide you through recording vitals\n"
                f"- Explain medical terms\n"
                f"- Connect you with resources\n\n"
                f"**Just ask me:**\n"
                f"- \"Where do I record symptoms?\"\n"
                f"- \"What does this vital sign mean?\"\n"
                f"- \"How to give medications?\"\n"
                f"- \"Take me to appointments\"\n\n"
                f"How can I help today?"
            )
        else:  # patient or family
            return (
                f"{greeting_time}! I'm **Aura**, your compassionate care companion. 💙\n\n"
                f"I'm here to:\n"
                f"- Help you navigate the platform\n"
                f"- Answer your care questions\n"
                f"- Guide you to resources\n"
                f"- Listen and support you\n"
                f"- Connect you with your care team\n\n"
                f"**You can ask me:**\n"
                f"- \"Where are my medications?\"\n"
                f"- \"Take me to my journal\"\n"
                f"- \"How do I message my nurse?\"\n"
                f"- \"What is memory vault?\"\n"
                f"- \"Show me support resources\"\n\n"
                f"What can I help you with?"
            )
    
    # ============ ENHANCED: Thank You / Positive Feedback ============
    
    if any(word in msg_lower for word in ['thank', 'thanks', 'appreciate', 'helpful', 'great']):
        return (
            "You're very welcome! 😊 I'm so glad I could help!\n\n"
            "Remember, I'm always here whenever you need:\n"
            "- Navigation help\n"
            "- Data and information\n"
            "- Step-by-step guides\n"
            "- Explanations\n"
            "- A listening ear\n\n"
            "Don't hesitate to ask me anything - no question is too small! 💙\n\n"
            "Is there anything else I can help you with?"
        )
    
    # ============ ENHANCED: Fallback for Unrecognized Queries ============
    
    # If we still don't know what they want, be intelligent about suggesting help
    return (
        "🤔 I want to make sure I understand you correctly!\n\n"
        "**I can help you with:**\n\n"
        "**🗺️ Navigation:**\n"
        "- \"Take me to [page name]\"\n"
        "- \"Where is [feature]?\"\n\n"
        "**📊 Information:**\n"
        "- \"Show me patients/vitals/alerts\"\n"
        "- \"What is [feature/concept]?\"\n\n"
        "**📖 Guidance:**\n"
        "- \"How do I [task]?\"\n"
        "- \"Guide me through [process]\"\n\n"
        "**🧠 Understanding:**\n"
        "- \"Explain [medical term]\"\n"
        "- \"Why is [something] important?\"\n\n"
        "**💬 If I still can't help directly**, I'll connect you with:\n"
        "- Your care team (for medical advice)\n"
        "- IT support (for technical issues)\n"
        "- Resources and documentation\n\n"
        "Could you rephrase your question, or tell me what you're trying to do?"
    )


def call_anthropic_api(messages: list, system_prompt: str) -> str:
    """Call Anthropic Claude API"""
    try:
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=400,
            system=system_prompt,
            messages=messages
        )
        return response.content[0].text
    except Exception as e:
        print(f"Anthropic API error: {e}")
        return None


SYSTEM_PROMPT = """You are Aura Assistant, a compassionate AI support tool for Project Aura, a palliative care platform in Ghana.

Your role:
- Help caregivers and families understand care information
- Provide emotional support and validate feelings
- Guide users to the right section of the platform
- Be warm, gentle, and human

Strict rules:
- NEVER provide specific medical dosage advice
- NEVER tell users to stop or change medications
- NEVER diagnose conditions
- ALWAYS recommend speaking with the clinical team for medical decisions
- Keep responses under 200 words
- Be compassionate, not clinical"""


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ENHANCED Chat endpoint with Aura AI Assistant
    Features: Real database access, intelligent navigation, conversational AI, visible thinking
    """
    
    # Get or create session
    session = get_or_create_session(current_user.id, db)
    
    # Detect crisis immediately
    is_crisis = detect_crisis(request.message)
    
    # Detect intent
    intent = detect_intent(request.message)
    
    # Get user role for personalization
    user_role = current_user.role or "patient"
    
    # Initialize response variables
    response_message = None
    structured_data = None
    thinking_process = None
    confidence = None
    
    # Step 1: Try to query patient data (if intent matches data queries)
    if intent in ["patient_list", "vitals_query", "symptoms_query", "medication_query", 
                  "appointment_query", "alerts_query", "statistics"]:
        data_result = query_patient_data(intent, request.message, db)
        if data_result:
            response_message, structured_data = data_result
            # Generate thinking process to show AI reasoning
            thinking_process = generate_thinking_process(intent, request.message, structured_data, user_role)
            confidence = calculate_response_confidence(intent, structured_data, request.message)
    
    # Step 2: If no data query or no results, try Anthropic API (if available)
    if not response_message and ANTHROPIC_AVAILABLE and not is_crisis:
        try:
            # Build conversation history for context
            recent_messages = db.query(ChatbotMessage).filter(
                ChatbotMessage.session_id == session.id
            ).order_by(ChatbotMessage.created_at.desc()).limit(5).all()
            
            conversation = []
            for msg in reversed(recent_messages):
                conversation.append({
                    "role": msg.role,  # 'user' or 'assistant'
                    "content": msg.content
                })
            
            # Add current message
            conversation.append({
                "role": "user",
                "content": request.message
            })
            
            # Call Anthropic API
            api_response = call_anthropic_api(conversation, SYSTEM_PROMPT)
            if api_response:
                response_message = api_response
                thinking_process = [
                    "🤖 Using Claude AI for natural language understanding...",
                    "💭 Analyzing context from conversation history...",
                    "✍️ Generating compassionate, personalized response..."
                ]
                confidence = 0.88  # High confidence for AI responses
        except Exception as e:
            print(f"Error calling Anthropic API: {e}")
    
    # Step 3: Fall back to intelligent rule-based responses
    if not response_message:
        response_message = get_fallback_response(intent, is_crisis, request.message, db, user_role)
        if not thinking_process:
            thinking_process = generate_thinking_process(intent, request.message, structured_data, user_role)
        if not confidence:
            confidence = calculate_response_confidence(intent, structured_data, request.message)
    
    # Save messages to database
    # User message
    user_message = ChatbotMessage(
        session_id=session.id,
        role='user',
        content=request.message,
        intent_detected=intent,
        crisis_flagged=is_crisis
    )
    db.add(user_message)
    
    # Bot response
    bot_message = ChatbotMessage(
        session_id=session.id,
        role='assistant',
        content=response_message,
        intent_detected=intent,
        crisis_flagged=is_crisis
    )
    db.add(bot_message)
    
    db.commit()
    
    # If crisis detected, trigger alert
    if is_crisis:
        alert = Alert(
            alert_type="mental_health_crisis",
            severity="critical",
            message=f"Crisis keywords detected in chatbot conversation from {current_user.full_name}",
            triggered_by=current_user.id,
            triggered_value=request.message[:100]  # First 100 chars
        )
        db.add(alert)
        db.commit()
        
        # Track as journey event if alert is associated with a patient
        patient_id = request.patient_context_id or getattr(current_user, 'patient_id', None)
        if patient_id:
            track_critical_alert(
                db=db,
                patient_id=patient_id,
                alert_type="Mental Health Crisis",
                severity="Critical",
                details=f"Crisis keywords detected in chatbot: {request.message[:100]}",
                created_by=current_user.id
            )
    
    # Return enhanced response
    return ChatResponse(
        message=response_message,
        intent=intent,
        is_crisis=is_crisis,
        session_id=session.id,
        structured_data=structured_data,
        thinking_process=thinking_process,
        confidence=confidence
    )


@router.post("/session/end")
async def end_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End current chat session"""
    session = db.query(ChatbotSession).filter(
        ChatbotSession.user_id == current_user.id,
        ChatbotSession.ended_at == None
    ).first()
    
    if session:
        session.ended_at = datetime.utcnow()
        db.commit()
    
    return {"message": "Session ended"}
