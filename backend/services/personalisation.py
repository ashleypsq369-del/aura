# backend/services/personalisation.py
"""
ADAPTIVE PERSONALISATION ENGINE
Drives the entire adaptive patient portal experience
"""

import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from src.db import (
    Patient, PatientPreferences, Resource, ResourceBookmark, ResourceFeedback,
    CommunityGroup, Prediction, User, CaregiverAssignment, Appointment,
    PatientJourneyEvent, CommunityMembership
)


# ============================================================================
# DIAGNOSIS CONDITION MAPPING
# ============================================================================

DIAGNOSIS_CONDITION_MAP = {
    "cancer": ["cancer", "carcinoma", "tumour", "tumor", "lymphoma", "leukaemia", "leukemia", "oncology", "malignant", "neoplasm"],
    "heart_failure": ["heart failure", "cardiac failure", "chf", "congestive", "heart disease", "cardiac disease"],
    "copd": ["copd", "chronic obstructive", "emphysema", "chronic bronchitis", "respiratory"],
    "renal_failure": ["renal failure", "kidney failure", "kidney disease", "ckd", "esrd", "end stage renal"],
    "liver_failure": ["liver failure", "hepatic", "cirrhosis", "liver disease", "hepatic failure"],
    "general": [],
}


def detect_condition_category(diagnosis: str) -> str:
    """Map free-text diagnosis to a condition category"""
    if not diagnosis:
        return "general"
    
    diagnosis_lower = diagnosis.lower()
    for category, keywords in DIAGNOSIS_CONDITION_MAP.items():
        if any(kw in diagnosis_lower for kw in keywords):
            return category
    return "general"


# ============================================================================
# RESOURCE RECOMMENDATION ENGINE
# ============================================================================

def get_recommended_resources(
    user_id: int, 
    patient_id: int, 
    db: Session, 
    limit: int = 6
) -> List[Resource]:
    """
    Returns personalised resource list based on:
    1. Patient's diagnosis category
    2. Questionnaire topic interests
    3. Previously marked as helpful
    4. Not already bookmarked or marked as not helpful
    """
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == user_id
    ).first()
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return []
    
    condition = detect_condition_category(patient.primary_diagnosis or "")
    topic_interests = json.loads(prefs.topic_interests) if prefs and prefs.topic_interests else []
    language = prefs.language_pref if prefs else "en"
    info_style = prefs.info_style if prefs else "mixed"
    
    # Map info_style to difficulty level
    difficulty_map = {
        "simple": ["simple"],
        "detailed": ["detailed", "standard"],
        "visual": ["simple", "standard"],
        "mixed": ["simple", "standard"],
    }
    difficulties = difficulty_map.get(info_style, ["simple", "standard"])
    
    # Get bookmarked and not-helpful resource IDs to exclude
    bookmarked = [
        b.resource_id for b in db.query(ResourceBookmark).filter(
            ResourceBookmark.user_id == user_id
        ).all()
    ]
    not_helpful = [
        f.resource_id for f in db.query(ResourceFeedback).filter(
            ResourceFeedback.user_id == user_id,
            ResourceFeedback.helpful == False
        ).all()
    ]
    exclude_ids = set(bookmarked + not_helpful)
    
    # Score all published resources
    all_resources = db.query(Resource).filter(Resource.is_published == True).all()
    scored = []
    
    for r in all_resources:
        if r.id in exclude_ids:
            continue
        
        score = 0
        r_conditions = json.loads(r.condition_tags) if r.condition_tags else []
        r_topics = json.loads(r.topic_tags) if r.topic_tags else []
        
        # +3 for matching condition
        if condition in r_conditions:
            score += 3
        
        # +2 for each matching topic interest
        for topic in topic_interests:
            if topic in r_topics:
                score += 2
        
        # +1 for matching language
        if r.language == language:
            score += 1
        
        # +1 for matching difficulty
        if r.difficulty_level in difficulties:
            score += 1
        
        # +1 for Ghana-specific (always good)
        if r.is_ghana_specific:
            score += 1
        
        # +0.1 per helpful vote (normalised)
        score += r.helpful_count * 0.1
        
        scored.append((score, r))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored[:limit]]


# ============================================================================
# JOURNEY PHASE DETERMINATION
# ============================================================================

def determine_journey_phase(patient: Patient, prediction: Optional[Prediction]) -> Dict[str, Any]:
    """
    Determine patient's current journey phase based on care pathway and risk score
    Returns phase data with plain language descriptions
    """
    risk = prediction.risk_score if prediction else 0.3
    pathway = patient.care_pathway or "home_hospice"
    status = patient.status
    
    if status == "deceased":
        return {
            "phase": 6,
            "name": "Bereavement",
            "description": "Your loved one's journey has ended. The Continuity Bridge is here for you.",
            "what_next": "Access bereavement support, your memory vault, and grief resources.",
            "support_available": ["Grief journal", "Memory vault", "Bereavement counselling resources"],
        }
    
    if risk > 0.78 or pathway == "crisis_intervention":
        return {
            "phase": 5,
            "name": "Comfort Focus",
            "description": "Your care team is focused on keeping you as comfortable as possible.",
            "what_next": "Your care team is with you. Let them know how you are feeling.",
            "support_available": ["Pain management review", "Family presence support", "Spiritual care"],
        }
    
    if pathway == "inpatient_hospice" or risk > 0.55:
        return {
            "phase": 4,
            "name": "Increased Support",
            "description": "Your needs have grown and your care team has increased their support.",
            "what_next": "More frequent check-ins and medication reviews are planned.",
            "support_available": ["Daily monitoring", "Family meetings", "Comfort care planning"],
        }
    
    if pathway == "palliative_care_standard" or risk > 0.30:
        return {
            "phase": 3,
            "name": "Living with Illness",
            "description": "You are managing your illness day by day with support from your care team.",
            "what_next": "Regular appointments and care plan reviews keep your care on track.",
            "support_available": ["Symptom management", "Peer community", "Educational resources"],
        }
    
    return {
        "phase": 2,
        "name": "Early Care",
        "description": "You are at the beginning of your care journey with your team.",
        "what_next": "Getting to know your care team and setting your care goals.",
        "support_available": ["Information resources", "Care plan setup", "Community connection"],
    }


# ============================================================================
# TODAY'S FOCUS CONTENT GENERATOR
# ============================================================================

def get_today_focus(
    prefs: Optional[PatientPreferences],
    condition: str,
    patient: Patient
) -> Dict[str, Any]:
    """Generate personalized 'Today's Focus' content based on top concern"""
    if not prefs or not prefs.topic_interests:
        return {
            "title": "Welcome to your care journey",
            "content": "Start by checking in with your care team and logging how you're feeling today.",
            "action": "Check In",
            "action_link": "/wellness-checkin"
        }
    
    topics = json.loads(prefs.topic_interests) if prefs.topic_interests else []
    if not topics:
        return {
            "title": "How are you today?",
            "content": "Your care team is here to support you. Let us know how you're feeling.",
            "action": "Log Symptoms",
            "action_link": "/symptoms"
        }
    
    # Focus on first selected topic
    top_topic = topics[0]
    
    focus_map = {
        "pain_management": {
            "title": "Managing Pain Today",
            "content": "Pain control is our priority. Have you taken your morning medication? Rate your pain level so we can adjust your care plan if needed.",
            "action": "Log Pain",
            "action_link": "/wellness-checkin"
        },
        "sleep": {
            "title": "Better Sleep Tonight",
            "content": "Good rest helps your body heal. Try keeping your room cool and dark. Avoid screens 1 hour before bed.",
            "action": "Log Sleep Quality",
            "action_link": "/symptoms"
        },
        "mental_health": {
            "title": "Your Emotional Wellbeing",
            "content": "It's normal to have difficult feelings. Taking a moment to check in with yourself helps you and your care team.",
            "action": "Mood Check-In",
            "action_link": "/wellness-checkin"
        },
        "nutrition": {
            "title": "Nourishing Your Body",
            "content": f"{'Small, frequent meals can help if eating is difficult. Focus on foods you enjoy and can keep down.' if condition == 'cancer' else 'Eating well gives you energy. Try to eat regularly even if portions are small.'}",
            "action": "View Nutrition Tips",
            "action_link": "/resources?topic=nutrition"
        },
        "spiritual_peace": {
            "title": "Finding Peace Today",
            "content": "Quiet moments of reflection can bring comfort. Would you like to connect with a spiritual care provider?",
            "action": "Request Spiritual Care",
            "action_link": "/profile"
        },
    }
    
    return focus_map.get(
        top_topic,
        {
            "title": "Your Care Today",
            "content": "Your care team is here to support you through every step of your journey.",
            "action": "Message Care Team",
            "action_link": "/chatbot"
        }
    )


# ============================================================================
# FULL PATIENT PORTAL DATA BUILDER
# ============================================================================

def get_patient_portal_data(patient_id: int, user_id: int, db: Session) -> Dict[str, Any]:
    """
    Builds the full adaptive portal payload for a patient.
    Called by GET /api/patient-portal/{patient_id}
    """
    try:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            return {"error": "Patient not found"}
        
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == user_id
        ).first()
        
        condition = detect_condition_category(patient.primary_diagnosis or "")
        
        # Latest prediction
        prediction = db.query(Prediction).filter(
            Prediction.patient_id == patient_id
        ).order_by(Prediction.predicted_at.desc()).first()
        
        # Journey phase
        phase = determine_journey_phase(patient, prediction)
        
        # Care team
        clinician = None
        if patient.primary_clinician_id:
            clinician = db.query(User).filter(User.id == patient.primary_clinician_id).first()
        
        caregiver_assignment = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.patient_id == patient_id,
            CaregiverAssignment.active == True
        ).first()
        
        # Next appointment
        next_appt = db.query(Appointment).filter(
            Appointment.patient_id == patient_id,
            Appointment.scheduled_at > datetime.utcnow(),
            Appointment.status == "scheduled"
        ).order_by(Appointment.scheduled_at.asc()).first()
        
        # Today's focus content
        today_focus = get_today_focus(prefs, condition, patient)
        
        # Recommended resources
        resources = get_recommended_resources(user_id, patient_id, db, limit=3)
        
        # Community groups for this patient's condition
        try:
            community_groups = db.query(CommunityGroup).filter(
                CommunityGroup.is_active == True
            ).all()
            relevant_groups = [
                g for g in community_groups
                if condition in json.loads(g.condition_tags or "[]")
                or "general" in json.loads(g.condition_tags or "[]")
            ]
        except Exception:
            relevant_groups = []
        
        # Journey events (last 10)
        journey_events = db.query(PatientJourneyEvent).filter(
            PatientJourneyEvent.patient_id == patient_id
        ).order_by(PatientJourneyEvent.created_at.asc()).all()
        
        # Get first name only
        first_name = patient.full_name.split()[0] if patient.full_name else "Friend"
        
        # Build caregiver info safely
        caregiver_info = None
        if caregiver_assignment and caregiver_assignment.caregiver_id:
            caregiver_user = db.query(User).get(caregiver_assignment.caregiver_id)
            if caregiver_user:
                caregiver_info = {
                    "name": caregiver_user.full_name
                }
        
        return {
            "patient": {
                "name": first_name,
                "full_name": patient.full_name,
                "condition_category": condition,
                "care_pathway": patient.care_pathway,
                "risk_level": prediction.risk_level if prediction else "Low",
            },
            "preferences": {
                "language": prefs.language_pref if prefs else "en",
                "info_style": prefs.info_style if prefs else "mixed",
                "topic_interests": json.loads(prefs.topic_interests) if prefs and prefs.topic_interests else [],
                "wants_community": prefs.wants_community if prefs else False,
                "content_preferences": json.loads(prefs.content_preferences) if prefs and prefs.content_preferences else [],
            },
            "journey_phase": phase,
            "care_team": {
                "clinician": {
                    "name": clinician.full_name,
                    "role": "Clinician"
                } if clinician else None,
                "caregiver": caregiver_info,
                "next_appointment": {
                    "date": next_appt.scheduled_at.isoformat(),
                    "type": next_appt.appointment_type,
                    "with": clinician.full_name if clinician else "Care Team"
                } if next_appt else None,
            },
            "today_focus": today_focus,
            "recommended_resources": [
                {
                    "id": r.id,
                    "title": r.title,
                    "summary": r.summary,
                    "format": r.format,
                    "category": r.category,
                } for r in resources
            ],
            "community_groups": [
                {
                    "id": g.id,
                    "name": g.name,
                    "member_count": g.member_count
                }
                for g in relevant_groups[:3]
            ],
            "journey_events": [
                {
                    "type": e.event_type,
                    "title": e.event_title,
                    "detail": e.event_detail,
                    "is_milestone": e.is_milestone,
                    "date": e.created_at.isoformat(),
                } for e in journey_events[-10:]  # last 10 only
            ],
        }
    except Exception as e:
        print(f"Error in get_patient_portal_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to compile portal data: {str(e)}"}
