"""
llm_chatbot.py
==============
True LLM ChatBot router for Project Aura.
Provides:
  POST /api/llm-chatbot/chat                        -- Standard chat (JSON)
  GET  /api/llm-chatbot/stream                      -- Server-Sent Events streaming
  GET  /api/llm-chatbot/status                      -- LLM provider status
  GET  /api/llm-chatbot/conversations               -- Conversation list
  GET  /api/llm-chatbot/conversations/{id}/messages -- Message history
  DELETE /api/llm-chatbot/conversations/{id}        -- Delete conversation
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db import (
    get_db, User, Patient, Vital, Symptom, Appointment, Medication,
    ESASAssessment, ChatbotSession, ChatbotMessage, CrisisAlert,
    Alert, NotificationQueue,
)
from routers.auth import get_current_user
from services.true_llm_engine import stream_llm_response, generate_llm_response, get_llm_status, detect_medical_flags

router = APIRouter()

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "want to die", "end my life", "not worth living",
    "can't go on", "overdose", "hurt myself", "self harm", "no reason to live",
    "better off dead", "final goodbye", "giving up",
]

HIGH_RISK_KEYWORDS = [
    "chest pain", "can't breathe", "difficulty breathing", "severe pain",
    "unconscious", "not waking", "emergency", "call ambulance", "hospital now",
    "heart attack", "stroke", "choking", "seizure", "collapsed",
]


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    patient_context_id: Optional[int] = None


class ChatResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    message: str
    conversation_id: Optional[int] = None
    model_used: Optional[str] = None
    provider: Optional[str] = None
    is_crisis: bool = False
    is_flagged: bool = False
    is_real_llm: bool = False


def _is_crisis(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in CRISIS_KEYWORDS)


def _dispatch_flag_alerts(
    user: User,
    message: str,
    flags: List[str],
    session_id: int,
    db: Session,
) -> None:
    """Log crisis/high-risk flags and notify clinical team."""
    try:
        is_crisis_flag = any(k in flags for k in ["crisis", "suicide", "self_harm"])
        is_critical = is_crisis_flag or any(k in flags for k in ["emergency", "urgent"])

        severity = "critical" if is_crisis_flag else "high"
        alert_type = "crisis" if is_crisis_flag else "high_risk_flag"

        user_display = user.full_name or user.username
        short_msg = message[:120] + ("..." if len(message) > 120 else "")

        if is_crisis_flag:
            title = "[ALERT] CRISIS ALERT -- " + user_display
            body = (
                "Patient " + user_display + " may be in crisis via Aura Chat. "
                "Message: \"" + short_msg + "\". Immediate follow-up required."
            )
            notif_type = "crisis_alert"
        elif is_critical:
            title = "[ALERT] High-Risk Message -- " + user_display
            body = (
                "High-risk message from " + user_display + " in chat. "
                "Message: \"" + short_msg + "\". Review required."
            )
            notif_type = "high_risk_flag"
        else:
            title = "Flagged Message -- " + user_display
            body = "Flagged keywords detected in chat from " + user_display + "."
            notif_type = "chat_flag"

        # Log CrisisAlert
        try:
            ca = CrisisAlert(
                user_id=user.id,
                patient_id=getattr(user, "patient_id", None),
                crisis_type=",".join(flags),
                message_content=message[:500],
                source="llm_chatbot",
                detected_keywords=",".join(flags),
                confidence_score=1.0 if is_crisis_flag else 0.7,
                created_at=datetime.utcnow(),
                acknowledged=False,
                careteam_notified=False,
            )
            db.add(ca)
        except Exception as e:
            print("[FlagAlert] CrisisAlert log error: " + str(e))

        # Notify clinicians
        clinicians = db.query(User).filter(
            User.role.in_(["clinician", "admin"]),
            User.is_active == True,
        ).all()

        for c in clinicians:
            notif = NotificationQueue(
                recipient_id=c.id,
                notification_type=notif_type,
                title=title,
                body=body,
            )
            db.add(notif)

        # Create system Alert visible in Alerts page
        if is_critical:
            sys_alert = Alert(
                patient_id=getattr(user, "patient_id", None),
                alert_type=alert_type,
                severity=severity,
                message=body,
                is_acknowledged=False,
            )
            db.add(sys_alert)

        db.commit()

    except Exception as e:
        print("[FlagAlert] Error dispatching flag alerts: " + str(e))
        try:
            db.rollback()
        except Exception:
            pass


def _build_patient_context(
    user: User,
    db: Session,
    patient_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Build rich clinical context dict injected into every LLM prompt."""
    ctx: Dict[str, Any] = {
        "role":     user.role,
        "user_id":  user.id,
    }

    # -- Resolve patient record --
    target_patient_id = patient_id
    if not target_patient_id and user.role == "patient":
        patient = (
            db.query(Patient).filter(Patient.patient_code == user.username).first()
            or db.query(Patient).filter(Patient.full_name == user.full_name).first()
        )
        if patient:
            target_patient_id = patient.id

    if not target_patient_id and user.role in ("clinician", "caregiver", "admin"):
        # No specific patient -- provide system-level context
        from src.db import PatientPreferences
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == user.id
        ).first()
        if prefs:
            condition = getattr(prefs, "primary_condition", None)
            if condition:
                ctx["diagnosis"] = condition
        return ctx

    if not target_patient_id:
        return ctx

    # -- Patient data --
    try:
        patient = db.query(Patient).filter(Patient.id == target_patient_id).first()
        if not patient:
            return ctx

        ctx["patient_id"]     = patient.id
        ctx["patient_name"]   = patient.full_name or patient.patient_code
        ctx["patient_status"] = getattr(patient, "status", None)
        ctx["diagnosis"]      = patient.primary_diagnosis
        ctx["age"]            = patient.age

        # -- Vitals --
        try:
            v = (
                db.query(Vital)
                .filter(Vital.patient_id == target_patient_id)
                .order_by(Vital.recorded_at.desc())
                .first()
            )
            if v:
                ctx["vitals"] = {
                    "heart_rate":        v.heart_rate,
                    "blood_pressure":    (
                        str(int(v.blood_pressure_sys or 0)) + "/" + str(int(v.blood_pressure_dia or 0))
                        if v.blood_pressure_sys else None
                    ),
                    "oxygen_saturation": v.oxygen_saturation,
                    "temperature":       v.temperature,
                    "respiratory_rate":  v.respiratory_rate,
                }
        except Exception:
            pass

        # -- ESAS --
        try:
            esas = (
                db.query(ESASAssessment)
                .filter(ESASAssessment.patient_id == target_patient_id)
                .order_by(ESASAssessment.assessed_at.desc())
                .first()
            )
            if esas:
                for field in ["pain","tiredness","nausea","depression","anxiety","shortness_of_breath","wellbeing"]:
                    val = getattr(esas, field, None)
                    if val is not None:
                        ctx["esas_" + field] = int(val)
        except Exception:
            pass

        # -- Medications --
        try:
            meds = db.query(Medication).filter(
                Medication.patient_id == target_patient_id,
                Medication.is_active == True,
            ).all()
            if meds:
                ctx["medications"] = [{"name": m.name, "dose": m.dose, "frequency": m.frequency} for m in meds]
                ctx["medication_count"] = len(meds)
        except Exception:
            pass

        # -- Alerts --
        try:
            alerts = db.query(Alert).filter(
                Alert.patient_id == target_patient_id,
                Alert.is_acknowledged == False,
            ).limit(3).all()
            if alerts:
                ctx["active_alerts"] = [
                    {"type": a.alert_type, "severity": a.severity, "message": a.message[:80]}
                    for a in alerts
                ]
        except Exception:
            pass

        # -- Appointments --
        try:
            appts = db.query(Appointment).filter(
                Appointment.patient_id == target_patient_id,
                Appointment.status == "scheduled",
            ).order_by(Appointment.appointment_date.asc()).limit(2).all()
            if appts:
                ctx["appointments"] = [
                    {"type": a.appointment_type, "date": str(a.appointment_date)[:10], "location": a.location}
                    for a in appts
                ]
        except Exception:
            pass

        # -- Care setting --
        try:
            from src.db import PatientCareSetting, CareSettingTemplate
            cs_rec = db.query(PatientCareSetting).filter(
                PatientCareSetting.patient_id == target_patient_id,
                PatientCareSetting.is_current == True,
            ).first()
            if cs_rec:
                tmpl = db.query(CareSettingTemplate).filter(
                    CareSettingTemplate.setting_key == cs_rec.setting_key
                ).first()
                ctx["care_setting"] = {
                    "key":           cs_rec.setting_key,
                    "label":         tmpl.setting_label if tmpl else cs_rec.setting_key,
                    "facility":      cs_rec.facility_name,
                    "focus":         tmpl.core_focus if tmpl else None,
                    "visit_frequency": cs_rec.visit_frequency,
                }
        except Exception:
            pass

        # -- ML risk scores (XGBoost + real SHAP) --
        try:
            from services.ml_model_service import ml_service
            if ml_service.is_available():
                features = {
                    "age": ctx.get("age", 70),
                    "pps": 60.0,
                    "esas_pain":      ctx.get("esas_pain", 3),
                    "esas_tired":     ctx.get("esas_tiredness", 4),
                    "esas_nausea":    3.0,
                    "esas_depress":   ctx.get("esas_depression", 3),
                    "esas_anxiety":   ctx.get("esas_anxiety", 3),
                    "esas_drowsy":    2.0,
                    "esas_appetite":  3.0,
                    "esas_wellbeing": 3.0,
                    "esas_breath":    ctx.get("esas_shortness_of_breath", 2),
                    "esas_total":     sum([
                        ctx.get("esas_pain", 3), ctx.get("esas_tiredness", 4),
                        3, ctx.get("esas_depression", 3), ctx.get("esas_anxiety", 3),
                        2, 3, 3, ctx.get("esas_shortness_of_breath", 2),
                    ]),
                    "phq9":  float(ctx.get("esas_depression", 3)) * 2.5,
                    "gad7":  float(ctx.get("esas_anxiety", 3)) * 2.0,
                    "barthel": 65.0, "mmse": 24.0, "zarit": 30.0,
                    "meds_count": float(ctx.get("medication_count", 5)),
                    "high_risk_meds": 0.0, "drug_interactions": 0.0,
                    "adherence_score": 6.0, "comorbidities": 3.0,
                    "ed_visits_6m": 1.0, "recent_ed_visits": 1.0,
                    "social_support": 5.0,
                    "care_hours_per_week": 40.0, "carer_age": 58.0,
                    "has_respite": 0.0, "patient_pps": 60.0,
                    "patient_esas_total": 25.0,
                    "recent_hospitalisations": 1.0,
                    "recent_delirium": 0.0, "cog_affecting_meds": 0.0,
                }
                vitals = ctx.get("vitals", {})
                if vitals:
                    features.update({
                        "heart_rate":        float(vitals.get("heart_rate") or 80),
                        "bp_systolic":       float((vitals.get("blood_pressure") or "120/80").split("/")[0] if isinstance(vitals.get("blood_pressure"), str) else 120),
                        "bp_diastolic":      80.0,
                        "oxygen_saturation": float(vitals.get("oxygen_saturation") or 95),
                        "temperature":       float(vitals.get("temperature") or 37.0),
                        "respiratory_rate":  float(vitals.get("respiratory_rate") or 16),
                    })
                overall = ml_service.get_overall_risk(features)
                ctx["ml_risk"] = overall
        except Exception:
            pass  # ML risk is enrichment only

        # -- Advanced ML: deterioration + drug interactions + prognosis --
        if target_patient_id:
            try:
                from services.advanced_ml_service import (
                    detect_longitudinal_deterioration,
                    detect_drug_interactions,
                    estimate_prognosis,
                )
                det = detect_longitudinal_deterioration(target_patient_id, db, window_days=14)
                if det.get("level") not in ("stable", None):
                    ctx["deterioration"] = {
                        "level":  det["level"],
                        "score":  det["deterioration_score"],
                        "drivers": [d["reason"] for d in det.get("top_drivers", [])[:2]],
                        "days_to_threshold": det.get("days_to_threshold"),
                    }

                meds_q = db.query(Medication).filter(
                    Medication.patient_id == target_patient_id,
                    Medication.is_active == True,
                ).all()
                med_list = [{"name": m.name} for m in meds_q if m.name]
                if med_list:
                    interactions = detect_drug_interactions(med_list)
                    severe = [ix for ix in interactions if ix["severity"] == "SEVERE"]
                    if interactions:
                        ctx["drug_interactions"] = {
                            "total": len(interactions),
                            "severe_count": len(severe),
                            "severe": [ix["effect"] for ix in severe[:2]],
                        }

                try:
                    prog = estimate_prognosis(target_patient_id, db)
                    if prog.get("median_weeks"):
                        ctx["prognosis"] = {
                            "months_display": prog["months_display"],
                            "risk_category":  prog["risk_category"],
                            "confidence":     prog["confidence"],
                        }
                except Exception:
                    pass
            except Exception:
                pass

    except Exception as e:
        print("[Context] Error building patient context: " + str(e))

    return ctx


# ---- Session helpers -------------------------------------------------------

def _get_or_create_session(
    user_id: int,
    conversation_id: Optional[int],
    db: Session,
) -> ChatbotSession:
    if conversation_id:
        sess = db.query(ChatbotSession).filter(
            ChatbotSession.id == conversation_id,
            ChatbotSession.user_id == user_id,
        ).first()
        if sess:
            return sess
    sess = ChatbotSession(user_id=user_id)
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess


def _load_history(session_id: int, db: Session) -> List[Dict]:
    messages = (
        db.query(ChatbotMessage)
        .filter(ChatbotMessage.session_id == session_id)
        .order_by(ChatbotMessage.id.asc())
        .limit(20)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in messages]


# ---- Endpoints -------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def llm_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Standard non-streaming chat endpoint."""
    session = _get_or_create_session(current_user.id, request.conversation_id, db)
    history = _load_history(session.id, db)

    db.add(ChatbotMessage(session_id=session.id, role="user", content=request.message))
    db.commit()

    patient_ctx = _build_patient_context(
        current_user, db, patient_id=request.patient_context_id
    )

    flags = detect_medical_flags(request.message)
    is_crisis_msg = _is_crisis(request.message)

    if flags and current_user.role in ("patient", "family", "caregiver"):
        _dispatch_flag_alerts(current_user, request.message, flags, session.id, db)

    try:
        resp = generate_llm_response(
            message=request.message,
            history=history,
            user_name=(current_user.full_name or "").split()[0] or None,
            user_role=current_user.role,
            patient_context=patient_ctx,
        )
        reply = resp.get("message", "I am here to help. Could you tell me more?")
        model_used = resp.get("model", "aura-local")
        is_real = resp.get("is_real_llm", False)
    except Exception as e:
        print("[Chat] LLM error: " + str(e))
        reply = "I am here with you. Could you share a little more about how you are feeling?"
        model_used = "aura-local"
        is_real = False

    db.add(ChatbotMessage(
        session_id=session.id,
        role="assistant",
        content=reply,
        crisis_flagged=is_crisis_msg or bool(flags),
    ))
    sess = db.query(ChatbotSession).filter(ChatbotSession.id == session.id).first()
    if sess:
        sess.message_count = (sess.message_count or 0) + 2
    db.commit()

    return ChatResponse(
        message=reply,
        conversation_id=session.id,
        model_used=model_used,
        is_crisis=is_crisis_msg,
        is_flagged=bool(flags),
        is_real_llm=is_real,
    )


@router.get("/stream")
async def llm_stream(
    message: str,
    conversation_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Server-Sent Events streaming endpoint with medical flag detection."""
    session = _get_or_create_session(current_user.id, conversation_id, db)
    history = _load_history(session.id, db)

    db.add(ChatbotMessage(session_id=session.id, role="user", content=message))
    db.commit()

    patient_ctx = _build_patient_context(current_user, db, patient_id=patient_id)
    user_name   = (current_user.full_name or "").split()[0] or None
    user_role   = getattr(current_user, "role", "patient")
    session_id  = session.id

    flags         = detect_medical_flags(message)
    is_crisis_msg = _is_crisis(message)

    if flags and user_role in ("patient", "family", "caregiver"):
        _dispatch_flag_alerts(current_user, message, flags, session_id, db)

    def _persisting_generator():
        import json as _j
        full_text = []

        try:
            for sse_line in stream_llm_response(
                message=message,
                history=history,
                user_name=user_name,
                user_role=user_role,
                patient_context=patient_ctx,
            ):
                if sse_line.startswith("data: "):
                    try:
                        payload = _j.loads(sse_line[6:])
                        if payload.get("type") == "chunk":
                            full_text.append(payload.get("text", ""))
                    except Exception:
                        pass
                yield sse_line

            yield "data: " + _j.dumps({
                "type": "meta",
                "conversation_id": session_id,
                "flags": flags,
                "is_crisis": is_crisis_msg,
            }) + "\n\n"

        except Exception as exc:
            import traceback
            print("[LLM Stream] Error: " + str(exc) + "\n" + traceback.format_exc())
            yield "data: " + _j.dumps({"type": "error", "message": str(exc)}) + "\n\n"

        # Persist full AI response
        if full_text:
            full_message = "".join(full_text)
            try:
                _db = next(get_db())
                _db.add(ChatbotMessage(
                    session_id=session_id,
                    role="assistant",
                    content=full_message,
                    crisis_flagged=is_crisis_msg or bool(flags),
                ))
                _sess = _db.query(ChatbotSession).filter(ChatbotSession.id == session_id).first()
                if _sess:
                    _sess.message_count = (_sess.message_count or 0) + 2
                _db.commit()
                _db.close()
            except Exception as e:
                print("[LLM Stream] DB persist error: " + str(e))

    return StreamingResponse(
        _persisting_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/status")
async def llm_status(current_user: User = Depends(get_current_user)):
    """Return current LLM provider status. Requires authentication."""
    return get_llm_status()


@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of user's chat conversations."""
    sessions = (
        db.query(ChatbotSession)
        .filter(ChatbotSession.user_id == current_user.id)
        .order_by(ChatbotSession.started_at.desc())
        .limit(20)
        .all()
    )
    result = []
    for s in sessions:
        last_msg = (
            db.query(ChatbotMessage)
            .filter(ChatbotMessage.session_id == s.id, ChatbotMessage.role == "assistant")
            .order_by(ChatbotMessage.id.desc())
            .first()
        )
        result.append({
            "id":             s.id,
            "started_at":     s.started_at.isoformat() if s.started_at else None,
            "message_count":  s.message_count or 0,
            "last_message":   (last_msg.content[:60] + "...") if last_msg and len(last_msg.content) > 60 else (last_msg.content if last_msg else None),
            "has_crisis_flag": any(
                m.crisis_flagged for m in
                db.query(ChatbotMessage).filter(ChatbotMessage.session_id == s.id).all()
            ),
        })
    return {"conversations": result, "total": len(result)}


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get messages for a specific conversation."""
    sess = db.query(ChatbotSession).filter(
        ChatbotSession.id == conversation_id,
        ChatbotSession.user_id == current_user.id,
    ).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(ChatbotMessage)
        .filter(ChatbotMessage.session_id == conversation_id)
        .order_by(ChatbotMessage.id.asc())
        .all()
    )
    return {
        "conversation_id": conversation_id,
        "messages": [
            {
                "id":            m.id,
                "role":          m.role,
                "content":       m.content,
                "crisis_flagged": m.crisis_flagged,
                "created_at":    m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
        "total": len(messages),
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    sess = db.query(ChatbotSession).filter(
        ChatbotSession.id == conversation_id,
        ChatbotSession.user_id == current_user.id,
    ).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.query(ChatbotMessage).filter(ChatbotMessage.session_id == conversation_id).delete()
    db.delete(sess)
    db.commit()
    return {"message": "Conversation deleted", "id": conversation_id}
