"""
Notifications Router - Project Aura
Handles routine notifications (medications, appointments, messages, etc.)
Different from Alerts (medical emergencies)
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from src.db import get_db, User, NotificationQueue, PushSubscription
from routers.auth import get_current_user
from services.delivery_service import VAPID_PUBLIC_KEY

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    notification_type: str
    title: str
    body: str
    related_alert_id: Optional[int] = None
    is_sent: bool
    sent_at: Optional[datetime] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    priority: Optional[str] = "medium"  # high, medium, low
    
    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    recipient_id: int
    notification_type: str
    title: str
    body: str
    related_alert_id: Optional[int] = None
    priority: Optional[str] = "medium"


class NotificationStats(BaseModel):
    total: int
    unread: int
    high_priority: int
    by_type: dict


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_priority_from_type(notification_type: str) -> str:
    """Determine priority based on notification type"""
    high_priority_types = [
        "medication_reminder",
        "appointment_soon",
        "new_message",
        "critical_update"
    ]
    
    low_priority_types = [
        "report_available",
        "special_day",
        "system_update"
    ]
    
    if notification_type in high_priority_types:
        return "high"
    elif notification_type in low_priority_types:
        return "low"
    else:
        return "medium"


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notifications for current user"""
    
    query = db.query(NotificationQueue).filter(
        NotificationQueue.recipient_id == current_user.id
    )
    
    # Filter by read status
    if unread_only:
        query = query.filter(NotificationQueue.is_read == False)
    
    # Filter by type
    if notification_type:
        query = query.filter(NotificationQueue.notification_type == notification_type)
    
    # Order by most recent first
    query = query.order_by(desc(NotificationQueue.created_at)).limit(limit)
    
    notifications = query.all()
    
    # Add priority field
    result = []
    for notif in notifications:
        notif_dict = {
            "id": notif.id,
            "recipient_id": notif.recipient_id,
            "notification_type": notif.notification_type,
            "title": notif.title,
            "body": notif.body,
            "related_alert_id": notif.related_alert_id,
            "is_sent": notif.is_sent,
            "sent_at": notif.sent_at,
            "is_read": notif.is_read,
            "read_at": notif.read_at,
            "created_at": notif.created_at,
            "priority": get_priority_from_type(notif.notification_type)
        }
        result.append(notif_dict)
    
    return result


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications for badge"""
    
    count = db.query(NotificationQueue).filter(
        NotificationQueue.recipient_id == current_user.id,
        NotificationQueue.is_read == False
    ).count()
    
    return {"count": count}


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification statistics"""
    
    all_notifs = db.query(NotificationQueue).filter(
        NotificationQueue.recipient_id == current_user.id
    ).all()
    
    unread = sum(1 for n in all_notifs if not n.is_read)
    high_priority = sum(1 for n in all_notifs 
                       if not n.is_read and get_priority_from_type(n.notification_type) == "high")
    
    # Count by type
    by_type = {}
    for notif in all_notifs:
        if not notif.is_read:
            by_type[notif.notification_type] = by_type.get(notif.notification_type, 0) + 1
    
    return {
        "total": len(all_notifs),
        "unread": unread,
        "high_priority": high_priority,
        "by_type": by_type
    }


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification_by_id(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single notification by ID"""
    
    notification = db.query(NotificationQueue).filter(
        NotificationQueue.id == notification_id,
        NotificationQueue.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif_dict = {
        "id": notification.id,
        "recipient_id": notification.recipient_id,
        "notification_type": notification.notification_type,
        "title": notification.title,
        "body": notification.body,
        "related_alert_id": notification.related_alert_id,
        "is_sent": notification.is_sent,
        "sent_at": notification.sent_at,
        "is_read": notification.is_read,
        "read_at": notification.read_at,
        "created_at": notification.created_at,
        "priority": get_priority_from_type(notification.notification_type)
    }
    
    return notif_dict


@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    
    notification = db.query(NotificationQueue).filter(
        NotificationQueue.id == notification_id,
        NotificationQueue.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()
    
    return {"message": "Notification marked as read"}


@router.put("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    
    notifications = db.query(NotificationQueue).filter(
        NotificationQueue.recipient_id == current_user.id,
        NotificationQueue.is_read == False
    ).all()
    
    count = 0
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        count += 1
    
    db.commit()
    
    return {"message": f"Marked {count} notifications as read"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""
    
    notification = db.query(NotificationQueue).filter(
        NotificationQueue.id == notification_id,
        NotificationQueue.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}


@router.delete("/clear-read")
async def clear_read_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all read notifications"""
    
    notifications = db.query(NotificationQueue).filter(
        NotificationQueue.recipient_id == current_user.id,
        NotificationQueue.is_read == True
    ).all()
    
    count = len(notifications)
    
    for notification in notifications:
        db.delete(notification)
    
    db.commit()
    
    return {"message": f"Deleted {count} read notifications"}


@router.post("/create")
async def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new notification (internal use)
    Typically called by other services, not directly by users
    """
    
    # Only admins or system can create notifications for others
    if data.recipient_id != current_user.id and current_user.role not in ["admin", "clinician"]:
        raise HTTPException(status_code=403, detail="Not authorized to create notifications for others")
    
    notification = NotificationQueue(
        recipient_id=data.recipient_id,
        notification_type=data.notification_type,
        title=data.title,
        body=data.body,
        related_alert_id=data.related_alert_id,
        is_sent=True,
        sent_at=datetime.utcnow(),
        is_read=False
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)

    # Push real-time via WebSocket
    try:
        from routers.websocket import manager as ws_manager
        import asyncio
        asyncio.create_task(ws_manager.send_to_user(
            data.user_id, "new_notification",
            {"id": notification.id, "type": data.notification_type, "title": data.title, "message": data.message}
        ))
    except Exception:
        pass

    return {
        "message": "Notification created",
        "notification_id": notification.id
    }


@router.post("/test-notification")
async def create_test_notification(
    notification_type: str = "new_message",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a test notification for current user (for testing purposes)
    Available types: appointment_reminder_24h, appointment_reminder_1h, 
                    medication_reminder, medication_missed, critical_vitals, 
                    new_message, report_available
    """
    
    titles = {
        "appointment_reminder_24h": "Appointment Tomorrow",
        "appointment_reminder_1h": "Appointment Starting Soon!",
        "medication_reminder": "Medication Due Soon",
        "medication_missed": "Missed Medication",
        "critical_vitals": "🚨 CRITICAL VITALS",
        "new_message": "New Message",
        "report_available": "Report Available"
    }
    
    bodies = {
        "appointment_reminder_24h": "You have an appointment tomorrow at 2:00 PM at Main Clinic",
        "appointment_reminder_1h": "Your appointment starts in less than 1 hour!",
        "medication_reminder": "Time to take Aspirin (100mg) in 15 minutes",
        "medication_missed": "You missed your medication dose scheduled for 2:00 PM",
        "critical_vitals": "Critical vital signs detected. Blood pressure is dangerously high (185/110)",
        "new_message": "Dr. Smith sent you a message: 'Hello, how are you feeling today?'",
        "report_available": "Your lab results are now available for review"
    }
    
    notification = NotificationQueue(
        recipient_id=current_user.id,
        notification_type=notification_type,
        title=titles.get(notification_type, "Test Notification"),
        body=bodies.get(notification_type, "This is a test notification"),
        is_sent=True,
        sent_at=datetime.utcnow(),
        is_read=False
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {
        "message": f"Test notification created: {notification_type}",
        "notification_id": notification.id,
        "title": notification.title,
        "body": notification.body
    }


# ============================================================================
# WEB PUSH SUBSCRIPTION ENDPOINTS
# ============================================================================

class PushSubscribeRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
    user_agent: Optional[str] = None


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Return VAPID public key for browser subscription."""
    return {"public_key": VAPID_PUBLIC_KEY or ""}


@router.post("/push-subscribe")
async def subscribe_push(
    data: PushSubscribeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register a browser push subscription for this user."""
    # Upsert - update if endpoint exists, create if not
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint
    ).first()

    if existing:
        existing.user_id = current_user.id
        existing.p256dh = data.p256dh
        existing.auth = data.auth
        existing.last_used = datetime.utcnow()
        existing.user_agent = data.user_agent or request.headers.get("user-agent", "")
    else:
        sub = PushSubscription(
            user_id=current_user.id,
            endpoint=data.endpoint,
            p256dh=data.p256dh,
            auth=data.auth,
            user_agent=data.user_agent or request.headers.get("user-agent", ""),
        )
        db.add(sub)

    db.commit()
    return {"message": "Push subscription saved", "user_id": current_user.id}


@router.delete("/push-unsubscribe")
async def unsubscribe_push(
    endpoint: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a push subscription."""
    sub = db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint,
        PushSubscription.user_id == current_user.id,
    ).first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"message": "Unsubscribed"}


@router.post("/push-test")
async def test_push(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a test push notification to all user's subscribed devices."""
    from services.delivery_service import send_web_push
    subs = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id
    ).all()
    if not subs:
        raise HTTPException(404, "No push subscriptions found for this user. Enable notifications in your browser first.")

    results = []
    for s in subs:
        ok = send_web_push(
            {"endpoint": s.endpoint, "keys": {"p256dh": s.p256dh, "auth": s.auth}},
            "ProjectAura - Push Enabled ✓",
            "You'll now receive real-time alerts on this device.",
            url="/notifications",
        )
        results.append(ok)

    return {
        "sent": sum(1 for r in results if r),
        "failed": sum(1 for r in results if not r),
        "devices": len(subs),
    }
