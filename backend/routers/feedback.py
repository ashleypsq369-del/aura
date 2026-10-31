"""
Feedback & Bug Report Router
Receives feedback/bug reports from the FeedbackWidget and:
1. Stores them in the database
2. Sends an email notification to admin
Route: /api/feedback
"""
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from src.db import get_db
from routers.auth import get_current_user

# Optional auth — feedback works whether logged in or not
def get_current_user_optional(token: str = None, db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        from routers.auth import verify_token
        return verify_token(token, db)
    except Exception:
        return None

router = APIRouter()


class FeedbackCreate(BaseModel):
    type: str                    # rating | ux_feedback | bug_report
    page: str
    url: str
    user_id: Optional[int] = None
    user_role: Optional[str] = None
    email: Optional[str] = None
    browser: Optional[str] = None
    timestamp: Optional[str] = None
    # Rating fields
    rating: Optional[int] = None
    label: Optional[str] = None
    # UX fields
    what_works: Optional[str] = None
    what_doesnt: Optional[str] = None
    # Bug fields
    bug_type: Optional[str] = None
    description: Optional[str] = None


def send_feedback_email(data: FeedbackCreate):
    """Send feedback email to admin — non-blocking background task."""
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        import os

        admin_email = os.getenv("ADMIN_EMAIL", "ashersmithpsq44@gmail.com")
        from_email  = os.getenv("FROM_EMAIL", "noreply@projectaura.gh")

        # Build subject
        type_labels = {
            "rating":      f"⭐ Page Rating — {data.rating}/5 on {data.page}",
            "ux_feedback": f"💬 UX Feedback on {data.page}",
            "bug_report":  f"🐛 Bug Report [{data.bug_type or 'general'}] on {data.page}",
        }
        subject = type_labels.get(data.type, f"📝 Feedback — {data.page}")

        # Build body
        lines = [
            f"<h2>Project Aura Feedback</h2>",
            f"<p><strong>Type:</strong> {data.type}</p>",
            f"<p><strong>Page:</strong> {data.page} ({data.url})</p>",
            f"<p><strong>User:</strong> ID={data.user_id} Role={data.user_role} Email={data.email}</p>",
            f"<p><strong>Time:</strong> {data.timestamp}</p>",
            "<hr>",
        ]

        if data.type == "rating":
            lines += [
                f"<p><strong>Rating:</strong> {data.rating}/5 ({data.label})</p>",
                f"<p><strong>Comment:</strong> {data.what_works or 'None'}</p>",
            ]
        elif data.type == "ux_feedback":
            lines += [
                f"<p><strong>What works:</strong><br>{data.what_works or 'Not provided'}</p>",
                f"<p><strong>What to improve:</strong><br>{data.what_doesnt or 'Not provided'}</p>",
            ]
        elif data.type == "bug_report":
            lines += [
                f"<p><strong>Bug Type:</strong> {data.bug_type or 'Not specified'}</p>",
                f"<p><strong>Description:</strong><br>{data.description}</p>",
                f"<p><strong>Browser:</strong> {(data.browser or '')[:200]}</p>",
            ]

        body = "\n".join(lines)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = from_email
        msg["To"]      = admin_email
        msg.attach(MIMEText(body, "html"))

        # Try SMTP — falls back gracefully if not configured
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")

        if smtp_user and smtp_pass:
            with smtplib.SMTP(smtp_host, smtp_port) as s:
                s.starttls()
                s.login(smtp_user, smtp_pass)
                s.sendmail(from_email, admin_email, msg.as_string())
            print(f"[feedback] Email sent to {admin_email}: {subject}")
        else:
            print(f"[feedback] SMTP not configured — logged only: {subject}")

    except Exception as e:
        print(f"[feedback] Email error: {e}")


@router.post("/feedback", status_code=201)
async def submit_feedback(
    data: FeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Receive feedback from the FeedbackWidget.
    Stores to DB + sends email notification in background.
    No auth required — widget works for all users.
    """
    # Log to DB via AuditLog (reuse existing table — no new migration needed)
    from src.db import AuditLog
    import json

    log = AuditLog(
        user_id=data.user_id,
        user_role=data.user_role or "unknown",
        action=f"feedback_{data.type}",
        resource_type="feedback",
        resource_id=0,
        details=json.dumps({
            "page": data.page,
            "url": data.url,
            "rating": data.rating,
            "what_works": data.what_works,
            "what_doesnt": data.what_doesnt,
            "bug_type": data.bug_type,
            "description": data.description,
            "email": data.email,
        }),
        success=True,
        created_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()

    # Send email in background (non-blocking)
    background_tasks.add_task(send_feedback_email, data)

    return {
        "status": "received",
        "message": "Thank you for your feedback! It has been sent to the development team.",
    }


@router.get("/feedback/submissions")
async def get_feedback_submissions(
    db: Session = Depends(get_db),
):
    """Admin endpoint to view all feedback submissions."""
    from src.db import AuditLog
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.action.like("feedback_%"))
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )
    import json
    return [
        {
            "id": l.id,
            "type": l.action.replace("feedback_", ""),
            "user_id": l.user_id,
            "user_role": l.user_role,
            "created_at": l.created_at.isoformat() if l.created_at else None,
            **json.loads(l.details or "{}"),
        }
        for l in logs
    ]


@router.delete("/feedback/{feedback_id}", status_code=200)
async def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: "User" = Depends(get_current_user),
):
    """Delete a single feedback submission. Admin only."""
    from src.db import AuditLog
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(403, "Admin only")
    log = db.query(AuditLog).filter(
        AuditLog.id == feedback_id,
        AuditLog.action.like("feedback_%"),
    ).first()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(404, "Not found")
    db.delete(log)
    db.commit()
    return {"message": "Deleted"}
