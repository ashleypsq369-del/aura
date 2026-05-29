"""
Bereavement Bridge for Project Aura
Post-death support module for family members
"""

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

BEREAVEMENT_RESOURCES_FILE = "data/bereavement_resources.json"

DEFAULT_BEREAVEMENT_RESOURCES = {
    "grief_stages": {
        "shock": [
            {"title": "Understanding Initial Grief", "content": "The first days after loss can feel surreal. This is normal. Allow yourself to feel whatever comes."}
        ],
        "anger": [
            {"title": "Processing Difficult Emotions", "content": "Anger is a natural part of grief. Find healthy ways to express it."}
        ],
        "acceptance": [
            {"title": "Moving Forward", "content": "Acceptance doesn't mean forgetting. It means learning to live with the loss."}
        ]
    },
    "support_types": {
        "hotlines": [
            {"title": "National Grief Hotline", "content": "1-800-XXX-XXXX (24/7)"}
        ]
    }
}

JOURNAL_PROMPTS = [
    "Share a favorite memory of your loved one",
    "What are you feeling today?",
    "What would you like to say to your loved one?",
    "How are you taking care of yourself?",
    "What brings you comfort right now?"
]

def load_bereavement_resources() -> Dict[str, Any]:
    if os.path.exists(BEREAVEMENT_RESOURCES_FILE):
        with open(BEREAVEMENT_RESOURCES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        os.makedirs(os.path.dirname(BEREAVEMENT_RESOURCES_FILE), exist_ok=True)
        with open(BEREAVEMENT_RESOURCES_FILE, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_BEREAVEMENT_RESOURCES, f, indent=2)
        return DEFAULT_BEREAVEMENT_RESOURCES

def activate_bereavement_bridge(patient_id: int) -> bool:
    from src.db import get_patient
    patient = get_patient(patient_id)
    return patient and patient.status == 'deceased'

def save_journal_entry(user_id: int, patient_id: int, content: str) -> Optional[Any]:
    from src.db import save_bereavement_entry
    return save_bereavement_entry(patient_id, user_id, 'journal', content)

def save_memory(user_id: int, patient_id: int, content: str) -> Optional[Any]:
    from src.db import save_bereavement_entry
    return save_bereavement_entry(patient_id, user_id, 'memory', content)

def get_user_entries(user_id: int, patient_id: int) -> Dict[str, List[Any]]:
    from src.db import get_bereavement_entries
    journals = get_bereavement_entries(patient_id, user_id, 'journal')
    memories = get_bereavement_entries(patient_id, user_id, 'memory')
    return {'journals': journals, 'memories': memories}
