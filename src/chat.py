"""
Support Hub for Project Aura
Structured, menu-driven interface for symptom logging and resource access
"""

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

# Resource file path
RESOURCES_FILE = "data/resources.json"

# Default resources
DEFAULT_RESOURCES = {
    "pain_management": [
        {
            "title": "Managing Pain at Home",
            "description": "Practical tips for pain relief",
            "content": "Pain management strategies include proper positioning, heat/cold therapy, relaxation techniques, and medication adherence. Always consult your care team before making changes.",
            "external_links": []
        }
    ],
    "nausea_relief": [
        {
            "title": "Coping with Nausea",
            "description": "Strategies to reduce nausea",
            "content": "Try small, frequent meals, avoid strong odors, stay hydrated with clear fluids, and rest after eating. Ginger tea may help.",
            "external_links": []
        }
    ],
    "anxiety_coping": [
        {
            "title": "Managing Anxiety",
            "description": "Techniques for emotional well-being",
            "content": "Deep breathing exercises, meditation, gentle music, and talking with loved ones can help. Don't hesitate to ask for professional support.",
            "external_links": []
        }
    ],
    "breathing_techniques": [
        {
            "title": "Breathing Exercises",
            "description": "Techniques to ease breathing",
            "content": "Practice slow, deep breathing. Sit upright, use a fan for air circulation, and try pursed-lip breathing. Contact your care team if breathing worsens.",
            "external_links": []
        }
    ],
    "family_communication": [
        {
            "title": "Talking with Family",
            "description": "Communication guidance",
            "content": "Open, honest communication helps everyone. Share feelings, ask questions, and listen actively. It's okay to have difficult conversations.",
            "external_links": []
        }
    ],
    "emergency_contacts": [
        {
            "title": "Emergency Contacts",
            "description": "Important phone numbers",
            "content": "Hospice Nurse: [Contact your provider]\nEmergency: 911\nHospice 24/7 Line: [Contact your provider]",
            "external_links": []
        }
    ]
}


def load_resource_database() -> Dict[str, List[Dict[str, Any]]]:
    """
    Load JSON knowledge base
    
    Returns:
        Dictionary of resources by category
    """
    if os.path.exists(RESOURCES_FILE):
        try:
            with open(RESOURCES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading resources: {e}")
            return DEFAULT_RESOURCES
    else:
        # Create default resources file
        os.makedirs(os.path.dirname(RESOURCES_FILE), exist_ok=True)
        with open(RESOURCES_FILE, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_RESOURCES, f, indent=2)
        return DEFAULT_RESOURCES


def get_resource_categories() -> List[str]:
    """
    Get list of resource categories
    
    Returns:
        List of category names
    """
    resources = load_resource_database()
    return list(resources.keys())


def get_resources_by_category(category: str) -> List[Dict[str, Any]]:
    """
    Get resources for a specific category
    
    Args:
        category: Resource category
        
    Returns:
        List of resource dictionaries
    """
    resources = load_resource_database()
    return resources.get(category, [])


def validate_symptom_input(symptom_data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    Validate symptom input data
    
    Args:
        symptom_data: Dictionary with symptom information
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check pain level
    pain_level = symptom_data.get('pain_level')
    if pain_level is None:
        return False, "Pain level is required"
    
    if not isinstance(pain_level, int) or pain_level < 0 or pain_level > 10:
        return False, "Pain level must be between 0 and 10"
    
    # Check boolean fields
    for field in ['nausea', 'fatigue', 'anxiety']:
        value = symptom_data.get(field)
        if value is not None and not isinstance(value, bool):
            return False, f"{field} must be true or false"
    
    return True, None


def save_symptom_log(patient_id: int, user_id: int, symptom_data: Dict[str, Any]) -> Optional[Any]:
    """
    Save symptom log to database
    
    Args:
        patient_id: Patient ID
        user_id: User ID recording the symptom
        symptom_data: Dictionary with symptom information
        
    Returns:
        Symptom record or None
    """
    from src.db import log_symptom
    
    # Validate input
    is_valid, error = validate_symptom_input(symptom_data)
    if not is_valid:
        print(f"Validation error: {error}")
        return None
    
    # Log symptom
    symptom = log_symptom(
        patient_id=patient_id,
        recorded_by=user_id,
        pain_level=symptom_data.get('pain_level', 0),
        nausea=symptom_data.get('nausea', False),
        fatigue=symptom_data.get('fatigue', False),
        anxiety=symptom_data.get('anxiety', False),
        notes=symptom_data.get('notes', '')
    )
    
    return symptom


def get_recent_logs(patient_id: int, limit: int = 10) -> List[Any]:
    """
    Retrieve recent symptom logs
    
    Args:
        patient_id: Patient ID
        limit: Maximum number of logs to retrieve
        
    Returns:
        List of symptom records
    """
    from src.db import get_session
    from src.db import Symptom
    
    session = get_session()
    try:
        symptoms = session.query(Symptom).filter(
            Symptom.patient_id == patient_id
        ).order_by(Symptom.timestamp.desc()).limit(limit).all()
        return symptoms
    finally:
        session.close()


# Structured symptom logging prompts
SYMPTOM_PROMPTS = {
    "pain": {
        "questions": [
            "On a scale of 0-10, how would you rate your pain? (0 = no pain, 10 = worst pain)",
            "Where is the pain located?",
            "What does the pain feel like? (sharp, dull, burning, aching, etc.)",
            "What makes the pain better or worse?"
        ]
    },
    "physical": {
        "questions": [
            "Are you experiencing nausea?",
            "Are you feeling fatigued or tired?",
            "Are you having difficulty breathing?",
            "Are you experiencing any other physical symptoms?"
        ]
    },
    "emotional": {
        "questions": [
            "Are you feeling anxious or worried?",
            "Are you feeling sad or depressed?",
            "Are you having trouble sleeping?",
            "Is there anything specific causing you distress?"
        ]
    }
}


def get_symptom_prompts(category: str) -> List[str]:
    """
    Get structured questions for symptom category
    
    Args:
        category: Symptom category (pain, physical, emotional)
        
    Returns:
        List of question strings
    """
    return SYMPTOM_PROMPTS.get(category, {}).get('questions', [])
