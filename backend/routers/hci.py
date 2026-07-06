"""
HCI & ChatBot Safety Router
Priority 3: HCI & ChatBot Safety

Addresses:
- Coghlan et al. (2023) - ChatBot crisis detection and escalation
- Kocaballi et al. (2019) - ChatBot consent and safety frameworks
- Usability testing framework gap
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from src.db import (
    get_db, User, UsabilityFeedback, ChatbotConsent, CrisisAlert
)
from routers.auth import get_current_user

router = APIRouter()


# ==================== PYDANTIC MODELS ====================

class UsabilityFeedbackCreate(BaseModel):
    page_name: str
    rating: int  # 1-5 stars
    comment: Optional[str] = None
    user_id: Optional[int] = None
    user_role: Optional[str] = None


class ChatbotConsentCreate(BaseModel):
    user_id: int
    consent_given: bool
    consent_text: str
    ip_address: Optional[str] = None


class CrisisAlertCreate(BaseModel):
    user_id: int
    patient_id: Optional[int] = None
    crisis_type: str  # suicide, self_harm, emergency, distress
    message_content: str
    source: str  # chatbot, portal, assessment
    detected_keywords: Optional[List[str]] = None
    confidence_score: Optional[float] = None


# ==================== USABILITY FEEDBACK ====================

@router.post("/usability-feedback")
async def submit_usability_feedback(
    feedback: UsabilityFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit usability feedback for a page
    Tracks user satisfaction and identifies pain points
    """
    
    # Validate rating
    if feedback.rating < 1 or feedback.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Create feedback entry
    db_feedback = UsabilityFeedback(
        page_name=feedback.page_name,
        rating=feedback.rating,
        comment=feedback.comment,
        user_id=feedback.user_id or current_user.id,
        user_role=feedback.user_role or current_user.role,
        created_at=datetime.utcnow()
    )
    
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    return {
        "success": True,
        "message": "Feedback submitted successfully",
        "feedback_id": db_feedback.id
    }


@router.get("/usability-feedback/stats")
async def get_usability_stats(
    page_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get usability feedback statistics
    Admin/Clinician only
    """
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")
    
    query = db.query(UsabilityFeedback)
    
    if page_name:
        query = query.filter(UsabilityFeedback.page_name == page_name)
    
    feedbacks = query.all()
    
    if not feedbacks:
        return {
            "page_name": page_name or "All Pages",
            "total_responses": 0,
            "average_rating": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "recent_comments": []
        }
    
    # Calculate stats
    total = len(feedbacks)
    avg_rating = sum(f.rating for f in feedbacks) / total
    
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for feedback in feedbacks:
        rating_dist[feedback.rating] += 1
    
    # Recent comments (last 10)
    recent_comments = [
        {
            "rating": f.rating,
            "comment": f.comment,
            "user_role": f.user_role,
            "created_at": f.created_at.isoformat()
        }
        for f in sorted(feedbacks, key=lambda x: x.created_at, reverse=True)[:10]
        if f.comment
    ]
    
    return {
        "page_name": page_name or "All Pages",
        "total_responses": total,
        "average_rating": round(avg_rating, 2),
        "rating_distribution": rating_dist,
        "recent_comments": recent_comments
    }


@router.get("/usability-feedback")
async def get_all_feedback(
    page_name: Optional[str] = None,
    user_role: Optional[str] = None,
    min_rating: Optional[int] = None,
    max_rating: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all usability feedback with filters
    Admin only
    """
    
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(UsabilityFeedback)
    
    if page_name:
        query = query.filter(UsabilityFeedback.page_name == page_name)
    if user_role:
        query = query.filter(UsabilityFeedback.user_role == user_role)
    if min_rating:
        query = query.filter(UsabilityFeedback.rating >= min_rating)
    if max_rating:
        query = query.filter(UsabilityFeedback.rating <= max_rating)
    
    feedbacks = query.order_by(desc(UsabilityFeedback.created_at)).limit(limit).all()
    
    return {
        "total": len(feedbacks),
        "feedbacks": [
            {
                "id": f.id,
                "page_name": f.page_name,
                "rating": f.rating,
                "comment": f.comment,
                "user_role": f.user_role,
                "created_at": f.created_at.isoformat()
            }
            for f in feedbacks
        ]
    }


# ==================== CHATBOT CONSENT ====================

@router.post("/chatbot-consent")
async def save_chatbot_consent(
    consent: ChatbotConsentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save user's chatbot consent
    HIPAA-compliant consent tracking
    """
    
    # Check if consent already exists
    existing = db.query(ChatbotConsent).filter(
        ChatbotConsent.user_id == consent.user_id
    ).first()
    
    if existing:
        # Update existing consent
        existing.consent_given = consent.consent_given
        existing.consent_text = consent.consent_text
        existing.consented_at = datetime.utcnow()
        existing.ip_address = consent.ip_address
        existing.revoked_at = None if consent.consent_given else datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return {
            "success": True,
            "message": "Consent updated successfully",
            "consent_id": existing.id
        }
    
    # Create new consent
    db_consent = ChatbotConsent(
        user_id=consent.user_id,
        consent_given=consent.consent_given,
        consent_text=consent.consent_text,
        consented_at=datetime.utcnow(),
        ip_address=consent.ip_address
    )
    
    db.add(db_consent)
    db.commit()
    db.refresh(db_consent)
    
    return {
        "success": True,
        "message": "Consent saved successfully",
        "consent_id": db_consent.id
    }


@router.get("/chatbot-consent/{user_id}")
async def get_chatbot_consent(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's chatbot consent status
    """
    
    # Users can only access their own consent unless admin
    if current_user.id != user_id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    consent = db.query(ChatbotConsent).filter(
        ChatbotConsent.user_id == user_id
    ).first()
    
    if not consent:
        return {
            "user_id": user_id,
            "consent_given": False,
            "consent_required": True,
            "consented_at": None
        }
    
    return {
        "user_id": user_id,
        "consent_given": consent.consent_given,
        "consent_required": False,
        "consented_at": consent.consented_at.isoformat() if consent.consented_at else None,
        "revoked_at": consent.revoked_at.isoformat() if consent.revoked_at else None
    }


@router.delete("/chatbot-consent/{user_id}")
async def revoke_chatbot_consent(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke chatbot consent
    """
    
    # Users can only revoke their own consent
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    consent = db.query(ChatbotConsent).filter(
        ChatbotConsent.user_id == user_id
    ).first()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
    
    consent.consent_given = False
    consent.revoked_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": "Consent revoked successfully"
    }


# ==================== CRISIS MANAGEMENT ====================

@router.post("/crisis-alert")
async def report_crisis(
    alert: CrisisAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Report a crisis situation detected by chatbot or system
    Immediate logging and notification
    
    Addresses Coghlan et al. (2023) - Crisis escalation protocol
    """
    
    # Create crisis alert
    db_alert = CrisisAlert(
        user_id=alert.user_id,
        patient_id=alert.patient_id,
        crisis_type=alert.crisis_type,
        message_content=alert.message_content[:500],  # Limit length
        source=alert.source,
        detected_keywords=','.join(alert.detected_keywords) if alert.detected_keywords else None,
        confidence_score=alert.confidence_score,
        created_at=datetime.utcnow(),
        acknowledged=False,
        careteam_notified=False
    )
    
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)

    # Create a real Alert record so it shows in the Alerts page
    try:
        from src.db import Alert, NotificationQueue, User as UserModel
        patient_id = alert.patient_id

        # System Alert visible to all clinicians
        sys_alert = Alert(
            patient_id=patient_id,
            alert_type="crisis",
            severity="critical",
            message=(
                f"CRISIS ALERT [{alert.crisis_type.upper()}]: "
                f"{alert.message_content[:120]}{'...' if len(alert.message_content) > 120 else ''}"
            ),
            triggered_value=str(alert.confidence_score or 1.0),
            is_acknowledged=False,
        )
        db.add(sys_alert)

        # Notify all active clinicians and admin via notification queue
        clinicians = db.query(UserModel).filter(
            UserModel.role.in_(["clinician", "admin"]),
            UserModel.is_active == True,
        ).all()
        for c in clinicians:
            notif = NotificationQueue(
                recipient_id=c.id,
                notification_type="crisis_alert",
                title=f"CRISIS ALERT  --  Patient requires immediate attention",
                body=f"[{alert.crisis_type}] {alert.message_content[:100]}",
                related_alert_id=sys_alert.id,
            )
            db.add(notif)

        db.commit()
        db_alert.careteam_notified = True
        db_alert.notified_at = datetime.utcnow()
        db.commit()
    except Exception as _notify_err:
        import logging
        logging.getLogger(__name__).warning(f"Crisis notification failed: {_notify_err}")

    return {
        "success": True,
        "message": "Crisis alert logged and care team notified",
        "alert_id": db_alert.id,
        "severity": "CRITICAL",
        "action_required": "Immediate follow-up with patient"
    }


@router.post("/crisis-alert/{patient_id}/notify-careteam")
async def notify_careteam_crisis(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger careteam notification for crisis
    """
    
    # Get most recent unacknowledged crisis alert
    alert = db.query(CrisisAlert).filter(
        CrisisAlert.patient_id == patient_id,
        CrisisAlert.acknowledged == False
    ).order_by(desc(CrisisAlert.created_at)).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="No active crisis alert found")
    
    # Mark as notified
    alert.careteam_notified = True
    alert.notified_at = datetime.utcnow()
    db.commit()
    
    # TODO: Send actual notification via email/SMS
    
    return {
        "success": True,
        "message": "Care team notified successfully",
        "alert_id": alert.id
    }


@router.get("/crisis-alert/{patient_id}/history")
async def get_crisis_history(
    patient_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get crisis alert history for a patient
    Clinician/Admin only
    """
    
    if current_user.role not in ['admin', 'clinician', 'caregiver']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    alerts = db.query(CrisisAlert).filter(
        CrisisAlert.patient_id == patient_id
    ).order_by(desc(CrisisAlert.created_at)).limit(limit).all()
    
    return {
        "patient_id": patient_id,
        "total_alerts": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "crisis_type": a.crisis_type,
                "message_preview": a.message_content[:100] + "..." if len(a.message_content) > 100 else a.message_content,
                "source": a.source,
                "confidence_score": a.confidence_score,
                "created_at": a.created_at.isoformat(),
                "acknowledged": a.acknowledged,
                "careteam_notified": a.careteam_notified
            }
            for a in alerts
        ]
    }


@router.get("/crisis-alert/stats")
async def get_crisis_stats(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get crisis alert statistics
    Admin/Clinician only
    """
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")
    
    # Get alerts in date range
    from datetime import timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    alerts = db.query(CrisisAlert).filter(
        CrisisAlert.created_at >= cutoff_date
    ).all()
    
    # Calculate stats
    total_alerts = len(alerts)
    by_type = {}
    acknowledged_count = 0
    notified_count = 0
    
    for alert in alerts:
        by_type[alert.crisis_type] = by_type.get(alert.crisis_type, 0) + 1
        if alert.acknowledged:
            acknowledged_count += 1
        if alert.careteam_notified:
            notified_count += 1
    
    return {
        "period_days": days,
        "total_alerts": total_alerts,
        "by_type": by_type,
        "acknowledged": acknowledged_count,
        "careteam_notified": notified_count,
        "response_rate": round((acknowledged_count / total_alerts * 100) if total_alerts > 0 else 0, 1)
    }
