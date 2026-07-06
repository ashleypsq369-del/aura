"""
Conversational ChatBot Router
================================
True LLM-powered AI companion for ProjectAura.
Supports: Groq (free), Ollama, OpenAI, Anthropic, rule-based NLP fallback.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from src.db import (
    get_db, User, ChatbotSession, ChatbotMessage,
    Patient, Vital, Symptom, ESASAssessment
)
from routers.auth import get_current_user
from services.llm_engine import generate_response, get_provider_status, nlp

router = APIRouter()


# ─────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    iv: Optional[str] = None           # Base64 IV when encrypted=True
    encrypted: Optional[bool] = False  # True = message is AES-GCM ciphertext
    patient_context_id: Optional[int] = None


class ChatResponse(BaseModel):
    message: str
    conversation_id: int
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    is_crisis: bool = False
    confidence: float = 0.8
    intents: List[str] = []
    sentiment: Optional[Dict[str, Any]] = None
    encrypted: bool = False   # Server always returns plaintext (client encrypts display layer)


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def get_patient_context(user: User, db: Session) -> str:
    """Build personalised patient context string using patient record AND questionnaire preferences."""
    lines = []

    # ── 1. From PatientPreferences (questionnaire answers) ────────────────
    try:
        from src.db import PatientPreferences
        import json as _j
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == user.id
        ).first()
        if prefs and prefs.questionnaire_complete:
            if getattr(prefs, 'primary_condition', None):
                lines.append(f"Diagnosis (self-reported): {prefs.primary_condition}")
            if getattr(prefs, 'diagnosis_duration', None):
                lines.append(f"How long diagnosed: {prefs.diagnosis_duration}")
            # ESAS scores from questionnaire
            esas_flags = []
            for field, label in [
                ('esas_pain', 'pain'), ('esas_tiredness', 'tiredness'),
                ('esas_nausea', 'nausea'), ('esas_shortness_of_breath', 'breathlessness'),
                ('esas_depression', 'depression'), ('esas_anxiety', 'anxiety'),
                ('esas_wellbeing', 'wellbeing'), ('esas_appetite', 'appetite'),
            ]:
                val = getattr(prefs, field, None)
                if val is not None and val >= 4:
                    esas_flags.append(f"{label}: {val}/10")
            if esas_flags:
                lines.append(f"Reported symptoms (≥4/10): {', '.join(esas_flags)}")
            if prefs.spiritual_importance in ('very', 'important'):
                lines.append(f"Spiritual care important: {prefs.spiritual_importance}")
            if getattr(prefs, 'care_priorities', None):
                try:
                    prios = _j.loads(prefs.care_priorities)
                    if prios:
                        lines.append(f"Care priorities: {', '.join(prios[:3])}")
                except Exception:
                    pass
            if getattr(prefs, 'emotional_states', None):
                try:
                    emo = _j.loads(prefs.emotional_states)
                    if emo:
                        lines.append(f"Current emotional state: {', '.join(emo[:4])}")
                except Exception:
                    pass
    except Exception as e:
        pass

    # ── 2. From Patient record (clinical data) ────────────────────────────
    if user.role in ("patient", "family", "caregiver"):
        try:
            patient = (
                db.query(Patient).filter(Patient.full_name == user.full_name).first()
                or db.query(Patient).filter(Patient.patient_code == user.username).first()
            )
            if patient:
                if patient.primary_diagnosis:
                    lines.append(f"Clinical diagnosis: {patient.primary_diagnosis}")
                lines.append(f"Age: {patient.age}")

                vital = (
                    db.query(Vital)
                    .filter(Vital.patient_id == patient.id)
                    .order_by(Vital.recorded_at.desc())
                    .first()
                )
                if vital:
                    concerns = []
                    if vital.oxygen_saturation and vital.oxygen_saturation < 90:
                        concerns.append(f"low O₂ ({vital.oxygen_saturation}%)")
                    if vital.heart_rate and vital.heart_rate > 110:
                        concerns.append(f"high HR ({vital.heart_rate}bpm)")
                    if vital.temperature and vital.temperature > 38.5:
                        concerns.append(f"fever ({vital.temperature}°C)")
                    if concerns:
                        lines.append(f"Vital concerns: {', '.join(concerns)}")

                esas = (
                    db.query(ESASAssessment)
                    .filter(ESASAssessment.patient_id == patient.id)
                    .order_by(ESASAssessment.assessed_at.desc())
                    .first()
                )
                if esas:
                    flags = []
                    if esas.pain and esas.pain >= 7:
                        flags.append(f"pain {esas.pain}/10")
                    if esas.anxiety and esas.anxiety >= 7:
                        flags.append(f"anxiety {esas.anxiety}/10")
                    if esas.depression and esas.depression >= 7:
                        flags.append(f"depression {esas.depression}/10")
                    if esas.shortness_of_breath and esas.shortness_of_breath >= 7:
                        flags.append(f"breathlessness {esas.shortness_of_breath}/10")
                    if flags:
                        lines.append(f"Clinical ESAS concerns: {', '.join(flags)}")
        except Exception:
            pass

    return "\n".join(lines) if lines else ""


def get_patient_context_dict(user: User, db: Session) -> dict:
    """
    Build a structured patient context dict for the AI engine.
    Includes care_setting so the chatbot can answer care setting questions.
    """
    ctx: dict = {}

    # Basic role / name
    ctx["first_name"] = user.full_name.split()[0] if user.full_name else None

    # From PatientPreferences
    try:
        from src.db import PatientPreferences
        import json as _j
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == user.id
        ).first()
        if prefs and prefs.questionnaire_complete:
            if getattr(prefs, "primary_condition", None):
                ctx["diagnosis"] = prefs.primary_condition
            for field, key in [
                ("esas_pain", "esas_pain"), ("esas_tiredness", "esas_tiredness"),
                ("esas_nausea", "esas_nausea"), ("esas_depression", "esas_depression"),
                ("esas_anxiety", "esas_anxiety"),
                ("esas_shortness_of_breath", "esas_shortness_of_breath"),
                ("esas_wellbeing", "esas_wellbeing"), ("esas_appetite", "esas_appetite"),
            ]:
                val = getattr(prefs, field, None)
                if val is not None:
                    ctx[key] = val
    except Exception:
        pass

    # From Patient record
    try:
        patient = (
            db.query(Patient).filter(Patient.full_name == user.full_name).first()
            or db.query(Patient).filter(Patient.patient_code == user.username).first()
        )
        if patient:
            if patient.primary_diagnosis:
                ctx["diagnosis"] = patient.primary_diagnosis
            ctx["age"] = patient.age

            # ESAS clinical
            esas = (
                db.query(ESASAssessment)
                .filter(ESASAssessment.patient_id == patient.id)
                .order_by(ESASAssessment.assessed_at.desc())
                .first()
            )
            if esas:
                for attr, key in [
                    ("pain", "esas_pain"), ("anxiety", "esas_anxiety"),
                    ("depression", "esas_depression"),
                    ("shortness_of_breath", "esas_shortness_of_breath"),
                    ("tiredness", "esas_tiredness"),
                ]:
                    val = getattr(esas, attr, None)
                    if val is not None:
                        ctx[key] = val

            # ── Care setting ──────────────────────────────────────────────
            try:
                from src.db import PatientCareSetting, CareSettingTemplate
                assignment = db.query(PatientCareSetting).filter(
                    PatientCareSetting.patient_id == patient.id,
                    PatientCareSetting.is_current == True,
                ).first()
                if assignment:
                    template = db.query(CareSettingTemplate).filter(
                        CareSettingTemplate.setting_key == assignment.setting_key
                    ).first()
                    ctx["care_setting"] = {
                        "key":             assignment.setting_key,
                        "label":           template.label if template else assignment.setting_key,
                        "focus":           (template.focus or "") if template else "",
                        "facility":        assignment.facility_name or "",
                        "visit_frequency": assignment.visit_frequency or "",
                        "outcome_focus":   (template.outcome_focus or "") if template else "",
                    }
            except Exception:
                pass
    except Exception:
        pass

    return ctx


def get_or_create_session(user_id: int, conversation_id: Optional[int], db: Session) -> ChatbotSession:
    """Return existing session or create a new one."""
    if conversation_id:
        session = db.query(ChatbotSession).filter(
            ChatbotSession.id == conversation_id,
            ChatbotSession.user_id == user_id
        ).first()
        if session:
            return session

    session = ChatbotSession(user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def maybe_log_crisis(user: User, message: str, confidence: float, db: Session):
    """Silently log crisis alerts to the database."""
    try:
        from src.db import CrisisAlert
        alert = CrisisAlert(
            user_id=user.id,
            crisis_type="chatbot_detected",
            message_content=message[:500],
            source="chatbot",
            confidence_score=confidence,
        )
        db.add(alert)
        db.commit()
    except Exception as e:
        print(f"Crisis log error (non-fatal): {e}")


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def conversational_chat(
    request: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    LLM-powered conversational chat endpoint.
    Supports Groq, Ollama, OpenAI, Anthropic, or rule-based NLP fallback.
    """
    # ── Get / create session ──────────────────
    session = get_or_create_session(current_user.id, request.conversation_id, db)

    # ── Determine the actual message text ─────
    # If message is encrypted, we store the ciphertext in DB (audit trail)
    # but we use a sanitised version for AI processing.
    # The AI responds in plaintext; the client encrypts its own display.
    is_encrypted = bool(request.encrypted)
    if is_encrypted:
        # Store ciphertext in DB  --  server cannot read content (true E2E)
        stored_content = f"[ENCRYPTED:{request.iv or ''}:{request.message[:200]}]"
        # We cannot process encrypted content for AI  --  ask user to resend plaintext
        # (In a real deployment the session key exchange would enable this;
        #  for now we acknowledge receipt and respond generically)
        ai_message = request.message  # pass through  --  frontend handles decrypt fallback
    else:
        stored_content = request.message
        ai_message     = request.message

    # ── Persist user message ──────────────────
    user_msg = ChatbotMessage(
        session_id=session.id,
        role="user",
        content=stored_content,
    )
    db.add(user_msg)
    db.commit()

    # ── Fetch conversation history ────────────
    history_rows = (
        db.query(ChatbotMessage)
        .filter(ChatbotMessage.session_id == session.id)
        .order_by(ChatbotMessage.created_at.asc())
        .all()
    )
    history = [
        {"role": row.role, "content": row.content}
        for row in history_rows[:-1]   # exclude the message we just added
    ]

    # ── Build context ─────────────────────────
    patient_context_str  = get_patient_context(current_user, db)
    patient_context_dict = get_patient_context_dict(current_user, db)
    user_name = current_user.full_name.split()[0] if current_user.full_name else None

    # ── Generate response ─────────────────────
    result = generate_response(
        message=ai_message,
        history=history,
        user_name=user_name,
        patient_context=patient_context_str,
        patient_context_dict=patient_context_dict,
    )

    # ── Persist assistant response ────────────
    assistant_msg = ChatbotMessage(
        session_id=session.id,
        role="assistant",
        content=result["message"],
        intent_detected=",".join(result["intents"][:3]),
        sentiment_score=result["sentiment"]["score"],
        crisis_flagged=result["is_crisis"],
    )
    db.add(assistant_msg)

    # Increment session message count
    session.message_count = (session.message_count or 0) + 2

    db.commit()

    # ── Log crisis if detected ────────────────
    if result["is_crisis"]:
        maybe_log_crisis(current_user, ai_message, result["confidence"], db)

    return ChatResponse(
        message=result["message"],
        conversation_id=session.id,
        model_used=result["model_used"],
        tokens_used=result["tokens_used"],
        is_crisis=result["is_crisis"],
        confidence=result["confidence"],
        intents=result["intents"],
        sentiment=result["sentiment"],
        encrypted=False,   # Server always returns plaintext; client encrypts its own messages
    )


@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all conversation sessions for current user."""
    sessions = (
        db.query(ChatbotSession)
        .filter(ChatbotSession.user_id == current_user.id)
        .order_by(ChatbotSession.started_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        msgs = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == s.id)
            .order_by(ChatbotMessage.created_at.asc())
            .all()
        )
        if msgs:
            title = msgs[0].content[:60] + ("..." if len(msgs[0].content) > 60 else "")
            result.append({
                "id":            s.id,
                "title":         title,
                "message_count": len(msgs),
                "created_at":    s.started_at.isoformat() if s.started_at else None,
                "updated_at":    msgs[-1].created_at.isoformat() if msgs else None,
            })

    return {"conversations": result, "total": len(result)}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    session = db.query(ChatbotSession).filter(
        ChatbotSession.id == conversation_id,
        ChatbotSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.query(ChatbotMessage).filter(ChatbotMessage.session_id == conversation_id).delete()
    db.delete(session)
    db.commit()
    return {"message": "Conversation deleted"}


@router.get("/status")
async def get_chatbot_status():
    """Return current LLM provider and feature status."""
    return get_provider_status()


@router.post("/analyze")
async def analyze_message(
    request: ChatMessage,
    current_user: User = Depends(get_current_user),
):
    """
    Analyze a message without sending it to the LLM.
    Returns NLP analysis: intents, entities, sentiment, crisis flag.
    Useful for frontend to show 'thinking' indicators.
    """
    intents  = nlp.detect_intents(request.message)
    entities = nlp.extract_entities(request.message)
    sentiment = nlp.analyze_sentiment(request.message)
    is_crisis, confidence = nlp.is_crisis(request.message)
    pain_scale = nlp.extract_pain_scale(request.message)

    return {
        "intents":    intents,
        "entities":   entities,
        "sentiment":  sentiment,
        "is_crisis":  is_crisis,
        "confidence": confidence,
        "pain_scale": pain_scale,
    }
