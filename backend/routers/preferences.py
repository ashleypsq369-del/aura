# backend/routers/preferences.py
"""
API routes for patient personalisation preferences (questionnaire)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, Optional
import json

from src.db import get_db, PatientPreferences, User, Patient, AuditLog
from routers.auth import get_current_user

router = APIRouter(tags=["preferences"])

JSON_LIST_FIELDS = {
    "emotional_states", "care_priorities", "physical_symptoms",
    "coping_strategies", "content_preferences", "topic_interests",
    "cultural_practices",
}

# Columns stored as Boolean in DB
BOOL_FIELDS = {
    "has_dependants", "wants_spiritual_care", "wants_peer_connection", "wants_community",
    # These three consent fields are also Boolean in the actual DB
    "ai_analysis_consent", "ai_data_sharing_consent", "care_team_sharing",
}

# (legacy  --  no longer used; kept so old imports don't break)
STR_FIELDS: set = set()


def _normalize_pref_value(key, value):
    if key in JSON_LIST_FIELDS and isinstance(value, list):
        return json.dumps(value)
    if key in BOOL_FIELDS:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ("yes", "true", "1")
        return bool(value)
    # ESAS fields  --  store as integer
    if key.startswith('esas_') and value is not None:
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0
    return value


def _to_bool(value, default=False):
    """Helper: safely convert yes/no/bool/None → Python bool."""
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("yes", "true", "1")
    return bool(value)


@router.post("")
async def save_preferences(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save or update questionnaire preferences (upsert)"""

    # ── Pre-sanitize EVERY field before touching the DB ───────────────────
    # All Boolean columns  --  any "yes"/"no"/"true"/"false" string → proper bool
    ALL_BOOL_COLS = {
        "has_dependants", "wants_spiritual_care", "wants_peer_connection",
        "wants_community", "ai_analysis_consent", "ai_data_sharing_consent",
        "care_team_sharing", "questionnaire_complete",
    }
    # All list columns → JSON string
    ALL_JSON_COLS = {
        "emotional_states", "care_priorities", "physical_symptoms",
        "coping_strategies", "content_preferences", "topic_interests",
        "cultural_practices",
    }
    for col in ALL_BOOL_COLS:
        if col in data:
            data[col] = _to_bool(data[col], default=False)
    for col in ALL_JSON_COLS:
        if col in data and isinstance(data[col], list):
            data[col] = json.dumps(data[col])
    # ESAS integer columns
    for key in list(data.keys()):
        if key.startswith("esas_") and data[key] is not None:
            try:
                data[key] = int(data[key])
            except (ValueError, TypeError):
                data[key] = 0
    # ── End sanitize ──────────────────────────────────────────────────────

    user_id = data.get("user_id", current_user.id)
    patient_id = data.get("patient_id")
    
    # Check if preferences exist
    existing = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == user_id
    ).first()
    
    if existing:
        # Update existing
        for key, value in data.items():
            if hasattr(existing, key) and key not in ["id", "user_id", "patient_id"]:
                setattr(existing, key, _normalize_pref_value(key, value))
        existing.last_updated = datetime.utcnow()
        if data.get("questionnaire_complete"):
            existing.questionnaire_complete = True
            existing.completed_at = datetime.utcnow()
    else:
        # Create new  --  use _normalize_pref_value for ALL fields so booleans/ints are always correct
        d = data  # shorthand
        prefs = PatientPreferences(
            user_id=user_id,
            patient_id=patient_id,
            # Step 1
            language_pref=d.get("language_pref", "en"),
            info_style=d.get("info_style"),
            tech_comfort=d.get("tech_comfort"),
            # Step 2
            primary_condition=d.get("primary_condition"),
            diagnosis_duration=d.get("diagnosis_duration"),
            emotional_states=json.dumps(d.get("emotional_states", [])),
            care_priorities=json.dumps(d.get("care_priorities", [])),
            # Step 3  --  ESAS (all integers)
            esas_pain=int(d.get("esas_pain", 0)),
            esas_tiredness=int(d.get("esas_tiredness", 0)),
            esas_nausea=int(d.get("esas_nausea", 0)),
            esas_shortness_of_breath=int(d.get("esas_shortness_of_breath", 0)),
            esas_depression=int(d.get("esas_depression", 0)),
            esas_anxiety=int(d.get("esas_anxiety", 0)),
            esas_wellbeing=int(d.get("esas_wellbeing", 0)),
            esas_appetite=int(d.get("esas_appetite", 0)),
            # Physical
            physical_symptoms=json.dumps(d.get("physical_symptoms", [])),
            activity_level=d.get("activity_level"),
            mobility_aid=d.get("mobility_aid"),
            self_care_level=d.get("self_care_level"),
            weight_change=d.get("weight_change"),
            swallowing_difficulty=d.get("swallowing_difficulty"),
            # Emotional
            mood_score=d.get("mood_score"),
            coping_strategies=json.dumps(d.get("coping_strategies", [])),
            current_psych_support=d.get("current_psych_support"),
            future_worry_level=d.get("future_worry_level"),
            # Spiritual / cultural
            religious_background=d.get("religious_background"),
            spiritual_importance=d.get("spiritual_importance"),
            cultural_practices=d.get("cultural_practices"),
            wants_spiritual_care=_to_bool(d.get("wants_spiritual_care")),
            # Family / social
            main_support_person=d.get("main_support_person"),
            social_connectedness=d.get("social_connectedness"),
            wants_peer_connection=_to_bool(d.get("wants_peer_connection")),
            has_dependants=_to_bool(d.get("has_dependants")),
            family_involvement_pref=d.get("family_involvement_pref"),
            # Content preferences
            content_preferences=json.dumps(d.get("content_preferences", [])),
            info_frequency=d.get("info_frequency"),
            wants_community=_to_bool(d.get("wants_community")),
            topic_interests=json.dumps(d.get("topic_interests", [])),
            # Consent  --  Boolean in DB, sent as "yes"/"no" from frontend
            ai_analysis_consent=_to_bool(d.get("ai_analysis_consent"), default=True),
            ai_data_sharing_consent=_to_bool(d.get("ai_data_sharing_consent"), default=False),
            care_team_sharing=_to_bool(d.get("care_team_sharing"), default=True),
            # Meta
            questionnaire_complete=bool(d.get("questionnaire_complete", False)),
            completed_at=datetime.utcnow() if d.get("questionnaire_complete") else None,
            last_updated=datetime.utcnow()
        )
        db.add(prefs)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="save_preferences",
        resource_type="patient_preferences",
        resource_id=user_id,
        details=f"Saved preferences for user {user_id}",
        success=True
    )
    db.add(audit)
    
    db.commit()
    
    return {"message": "Preferences saved successfully", "user_id": user_id}


@router.get("/{user_id}")
async def get_preferences(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's preferences"""
    
    # Users can only get their own preferences unless admin/clinician
    if current_user.id != user_id and current_user.role not in ["admin", "clinician"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.user_id == user_id
    ).first()
    
    if not prefs:
        return {
            "exists": False,
            "questionnaire_complete": False
        }
    
    return {
        "exists": True,
        "questionnaire_complete": prefs.questionnaire_complete,
        "user_id": prefs.user_id,
        "patient_id": prefs.patient_id,
        # Step 1
        "language_pref": prefs.language_pref,
        "info_style": prefs.info_style,
        "tech_comfort": prefs.tech_comfort,
        # Step 2
        "primary_condition": getattr(prefs, "primary_condition", None),
        "diagnosis_duration": prefs.diagnosis_duration,
        "emotional_states": json.loads(prefs.emotional_states) if prefs.emotional_states else [],
        "care_priorities": json.loads(prefs.care_priorities) if prefs.care_priorities else [],
        # Step 3
        "physical_symptoms": json.loads(prefs.physical_symptoms) if prefs.physical_symptoms else [],
        "activity_level": prefs.activity_level,
        "mobility_aid": prefs.mobility_aid,
        "self_care_level": prefs.self_care_level,
        # Step 4
        "mood_score": prefs.mood_score,
        "coping_strategies": json.loads(prefs.coping_strategies) if prefs.coping_strategies else [],
        "current_psych_support": prefs.current_psych_support,
        "future_worry_level": prefs.future_worry_level,
        # Step 5
        "religious_background": prefs.religious_background,
        "spiritual_importance": prefs.spiritual_importance,
        "cultural_practices": prefs.cultural_practices,
        "wants_spiritual_care": prefs.wants_spiritual_care,
        # Step 6
        "main_support_person": prefs.main_support_person,
        "social_connectedness": prefs.social_connectedness,
        "wants_peer_connection": prefs.wants_peer_connection,
        "has_dependants": prefs.has_dependants,
        "family_involvement_pref": prefs.family_involvement_pref,
        # Step 7
        "content_preferences": json.loads(prefs.content_preferences) if prefs.content_preferences else [],
        "info_frequency": prefs.info_frequency,
        "wants_community": prefs.wants_community,
        "topic_interests": json.loads(prefs.topic_interests) if prefs.topic_interests else [],
        # ESAS symptom scores from questionnaire
        "esas_pain":               getattr(prefs, "esas_pain", 0) or 0,
        "esas_tiredness":          getattr(prefs, "esas_tiredness", 0) or 0,
        "esas_nausea":             getattr(prefs, "esas_nausea", 0) or 0,
        "esas_shortness_of_breath": getattr(prefs, "esas_shortness_of_breath", 0) or 0,
        "esas_depression":         getattr(prefs, "esas_depression", 0) or 0,
        "esas_anxiety":            getattr(prefs, "esas_anxiety", 0) or 0,
        "esas_wellbeing":          getattr(prefs, "esas_wellbeing", 0) or 0,
        "esas_appetite":           getattr(prefs, "esas_appetite", 0) or 0,
        # New fields
        "primary_condition":       getattr(prefs, "primary_condition", None),
        "weight_change":           getattr(prefs, "weight_change", None),
        "swallowing_difficulty":   getattr(prefs, "swallowing_difficulty", None),
        # Convert bool back to "yes"/"no" so the frontend radio buttons match
        "ai_analysis_consent":     "yes" if _to_bool(getattr(prefs, "ai_analysis_consent", True), default=True) else "no",
        "ai_data_sharing_consent": "yes" if _to_bool(getattr(prefs, "ai_data_sharing_consent", False)) else "no",
        "care_team_sharing":       "yes" if _to_bool(getattr(prefs, "care_team_sharing", True), default=True) else "no",
        # Meta
        "completed_at": prefs.completed_at.isoformat() if prefs.completed_at else None,
        "last_updated": prefs.last_updated.isoformat() if prefs.last_updated else None
    }


@router.put("/{user_id}")
async def update_preferences(
    user_id: int,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update existing preferences (same as POST)"""
    data["user_id"] = user_id
    return await save_preferences(data, current_user, db)
