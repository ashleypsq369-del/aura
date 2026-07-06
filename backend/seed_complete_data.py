#!/usr/bin/env python3
"""
QUICK SEED SCRIPT  --  Project Aura Extension Data
Seeds resources, templates, groups, preferences
Run: python seed_complete_data.py
"""

import sys
import json
from datetime import datetime, timedelta
sys.path.insert(0, '.')

from src.db import (
    init_database, get_session,
    Resource, ConditionCareTemplate, CommunityGroup,
    PatientPreferences, PatientJourneyEvent, User, Patient
)

# Simplified resource dataset (10 key resources covering all conditions)
RESOURCES = [
    {"title": "Understanding Palliative Care", "summary": "What palliative care means and how it helps", 
     "content": "Palliative care improves quality of life for people with serious illness. It manages pain, symptoms, and emotional distress while supporting families.", 
     "category": "Education", "condition_tags": ["cancer", "heart_failure", "copd", "general"], 
     "topic_tags": ["general_info"], "format": "article", "difficulty": "simple", "ghana": True},
    
    {"title": "Managing Pain at Home", "summary": "Tips for controlling pain between hospital visits",
     "content": "Take pain medication on schedule. Use WHO pain ladder. Keep pain diary. Report new pain immediately.",
     "category": "Symptom Management", "condition_tags": ["cancer", "general"],
     "topic_tags": ["pain_management"], "format": "article", "difficulty": "standard", "ghana": True},
    
    {"title": "Breathing Techniques for COPD", "summary": "Pursed lip breathing helps manage breathlessness",
     "content": "Breathe in through nose for 2 counts, breathe out through pursed lips for 4 counts. Practice daily.",
     "category": "Symptom Management", "condition_tags": ["copd", "heart_failure"],
     "topic_tags": ["breathing"], "format": "article", "difficulty": "simple", "ghana": False},
    
    {"title": "Nutrition During Cancer Treatment", "summary": "Eating well when appetite is poor",
     "content": "Small frequent meals. High protein. Stay hydrated. Avoid strong smells if nauseous.",
     "category": "Symptom Management", "condition_tags": ["cancer"],
     "topic_tags": ["nutrition"], "format": "article", "difficulty": "simple", "ghana": False},
    
    {"title": "Coping with Anxiety and Fear", "summary": "Mental health support for serious illness",
     "content": "It's normal to feel anxious. Talk to your care team. Join support groups. Practice relaxation.",
     "category": "Mental Health", "condition_tags": ["general"],
     "topic_tags": ["mental_health", "anxiety"], "format": "article", "difficulty": "simple", "ghana": False},
    
    {"title": "Talking to Your Family", "summary": "How to have difficult conversations",
     "content": "Choose the right time. Be honest. Listen to their concerns. Decide together.",
     "category": "Family Support", "condition_tags": ["general"],
     "topic_tags": ["family_communication"], "format": "article", "difficulty": "simple", "ghana": False},
    
    {"title": "Ghana Cancer Foundation Helpline", "summary": "Free cancer support hotline",
     "content": "Call 0302-231-915 for cancer information and support. Open Mon-Fri 9am-5pm.",
     "category": "Support Services", "condition_tags": ["cancer"],
     "topic_tags": ["support"], "format": "hotline", "difficulty": "simple", "ghana": True},
    
    {"title": "Managing Heart Failure Symptoms", "summary": "Daily monitoring and when to seek help",
     "content": "Weigh yourself daily. Limit salt and fluids. Watch for swelling. Call doctor if weight increases suddenly.",
     "category": "Symptom Management", "condition_tags": ["heart_failure"],
     "topic_tags": ["daily_care"], "format": "article", "difficulty": "standard", "ghana": False},
    
    {"title": "Understanding Grief", "summary": "It's okay to grieve before a loss",
     "content": "Anticipatory grief is normal. No right way to grieve. Seek support when needed.",
     "category": "Bereavement", "condition_tags": ["general"],
     "topic_tags": ["grief", "mental_health"], "format": "article", "difficulty": "simple", "ghana": False},
    
    {"title": "Spiritual Care in Ghana", "summary": "Faith-based support services",
     "content": "CHAG hospitals provide spiritual care. Most facilities have chaplains. Faith is central to Ghanaian palliative care.",
     "category": "Spiritual", "condition_tags": ["general"],
     "topic_tags": ["spiritual_peace"], "format": "article", "difficulty": "simple", "ghana": True},
]


CARE_TEMPLATES = [
    {"name": "cancer", "keywords": ["cancer", "carcinoma", "tumor", "malignant"], 
     "goals": "Manage symptoms, maintain quality of life, support family",
     "pain_plan": "WHO pain ladder, regular assessment, breakthrough medication",
     "psych": "Counseling available, support groups, family meetings",
     "spiritual": "Chaplain visits, religious support as requested",
     "family": "Regular updates, caregiver support, bereavement planning",
     "plain": "Focus on keeping you comfortable while living as fully as possible",
     "symptoms": ["pain", "fatigue", "nausea", "loss_of_appetite"],
     "red_flags": ["severe_uncontrolled_pain", "difficulty_breathing", "confusion"]},
    
    {"name": "heart_failure", "keywords": ["heart failure", "cardiac", "chf"],
     "goals": "Manage fluid balance, reduce breathlessness, optimize medications",
     "pain_plan": "Chest pain management, breathlessness protocols",
     "psych": "Anxiety management, adjustment support",
     "spiritual": "As requested by patient and family",
     "family": "Education on daily monitoring, emergency signs",
     "plain": "Help your heart work better and keep you breathing comfortably",
     "symptoms": ["breathlessness", "swelling", "fatigue", "chest_discomfort"],
     "red_flags": ["sudden_weight_gain", "severe_breathlessness", "chest_pain"]},
    
    {"name": "copd", "keywords": ["copd", "emphysema", "chronic bronchitis"],
     "goals": "Optimize breathing, prevent exacerbations, maintain independence",
     "pain_plan": "Breathlessness management, anxiety control",
     "psych": "Breathing retraining, panic management",
     "spiritual": "As requested",
     "family": "Teach breathing techniques, recognize warning signs",
     "plain": "Help you breathe easier and stay as active as possible",
     "symptoms": ["breathlessness", "cough", "fatigue", "anxiety"],
     "red_flags": ["severe_breathlessness", "blue_lips", "confusion"]},
    
    {"name": "general", "keywords": [],
     "goals": "Symptom control, quality of life, family support",
     "pain_plan": "Individualized pain management",
     "psych": "Counseling and support as needed",
     "spiritual": "Spiritual care available on request",
     "family": "Family meetings, caregiver education",
     "plain": "We're here to support you through your illness",
     "symptoms": ["pain", "fatigue", "anxiety"],
     "red_flags": ["severe_pain", "inability_to_eat_drink", "confusion"]},
]

COMMUNITY_GROUPS = [
    {"name": "Living with Cancer in Ghana", "desc": "Support for cancer patients and families", 
     "tags": ["cancer"]},
    {"name": "Heart & Breath Support Circle", "desc": "For heart failure and COPD patients",
     "tags": ["heart_failure", "copd"]},
    {"name": "Family Carers Together", "desc": "Support for family caregivers",
     "tags": ["general"]},
    {"name": "Bereavement Support Group", "desc": "Grief support after loss",
     "tags": ["general"]},
    {"name": "Faith & Healing Circle", "desc": "Spiritual support for all faiths",
     "tags": ["general"]},
]


def main():
    print("="*60)
    print("PROJECT AURA  --  COMPLETE DATA SEEDING")
    print("="*60)
    
    init_database()
    db = get_session()
    
    try:
        # Seed Resources
        print("\n[1/3] Seeding Resources...")
        existing_resources = db.query(Resource).count()
        if existing_resources > 0:
            print(f"  → {existing_resources} resources already exist, skipping...")
        else:
            for r in RESOURCES:
                resource = Resource(
                    title=r["title"],
                    summary=r["summary"],
                    content=r["content"],
                    category=r["category"],
                    condition_tags=json.dumps(r["condition_tags"]),
                    topic_tags=json.dumps(r["topic_tags"]),
                    format=r["format"],
                    language="en",
                    difficulty_level=r["difficulty"],
                    is_ghana_specific=r["ghana"],
                    is_published=True,
                    helpful_count=0,
                    view_count=0
                )
                db.add(resource)
            db.commit()
            print(f"  ✓ Seeded {len(RESOURCES)} resources")
        
        # Seed Care Templates
        print("\n[2/3] Seeding Care Templates...")
        existing_templates = db.query(ConditionCareTemplate).count()
        if existing_templates > 0:
            print(f"  → {existing_templates} templates already exist, skipping...")
        else:
            for t in CARE_TEMPLATES:
                template = ConditionCareTemplate(
                    condition_name=t["name"],
                    condition_keywords=json.dumps(t["keywords"]),
                    goals_of_care=t["goals"],
                    pain_management_plan=t["pain_plan"],
                    psychological_support=t["psych"],
                    spiritual_care=t["spiritual"],
                    family_support_plan=t["family"],
                    plain_language_summary=t["plain"],
                    key_symptoms_to_monitor=json.dumps(t["symptoms"]),
                    red_flag_symptoms=json.dumps(t["red_flags"])
                )
                db.add(template)
            db.commit()
            print(f"  ✓ Seeded {len(CARE_TEMPLATES)} care templates")
        
        # Seed Community Groups
        print("\n[3/3] Seeding Community Groups...")
        existing_groups = db.query(CommunityGroup).count()
        if existing_groups > 0:
            print(f"  → {existing_groups} groups already exist, skipping...")
        else:
            for g in COMMUNITY_GROUPS:
                group = CommunityGroup(
                    name=g["name"],
                    description=g["desc"],
                    condition_tags=json.dumps(g["tags"]),
                    is_active=True,
                    member_count=0
                )
                db.add(group)
            db.commit()
            print(f"  ✓ Seeded {len(COMMUNITY_GROUPS)} community groups")
        
        print("\n" + "="*60)
        print("✅ SEEDING COMPLETE!")
        print("="*60)
        print(f"Resources: {db.query(Resource).count()}")
        print(f"Templates: {db.query(ConditionCareTemplate).count()}")
        print(f"Groups: {db.query(CommunityGroup).count()}")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
