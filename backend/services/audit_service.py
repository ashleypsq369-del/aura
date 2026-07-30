"""
Audit Service — ProjectAura
============================
Centralised helper for writing AuditLog entries.
Import `log_action` anywhere in the backend and call it after any
clinically significant create / update / delete / view operation.

Usage:
    from services.audit_service import log_action
    log_action(db, user=current_user, action="CREATE_VITAL",
               resource_type="vital", resource_id=vital.id,
               patient_id=vital.patient_id, request=request,
               details={"heart_rate": vital.heart_rate})
"""

from __future__ import annotations
import json
from datetime import datetime
from typing import Optional, Any, Dict

from sqlalchemy.orm import Session
from fastapi import Request

from src.db import AuditLog, User


def log_action(
    db: Session,
    user: User,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    request: Optional[Request] = None,
    details: Optional[Dict[str, Any]] = None,
    success: bool = True,
) -> AuditLog:
    """
    Write one AuditLog row.

    Parameters
    ----------
    db            SQLAlchemy session (caller must commit or this is part of
                  a transaction that gets committed after the main write).
    user          Authenticated User ORM object.
    action        Short uppercase verb, e.g. "CREATE_VITAL", "DELETE_MEDICATION".
    resource_type Lowercase noun, e.g. "vital", "medication", "patient".
    resource_id   PK of the affected row (optional).
    patient_id    Patient the action relates to (optional).
    request       FastAPI Request object — used to capture IP + User-Agent.
    details       Free-form dict serialised to JSON in the `details` column.
    success       False if the action was attempted but failed.
    """
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    if request is not None:
        # Prefer X-Forwarded-For (behind proxy/nginx) then fall back to direct IP
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        else:
            ip_address = getattr(request.client, "host", None)
        user_agent = request.headers.get("user-agent")

    entry = AuditLog(
        user_id=user.id,
        user_role=user.role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        patient_id=patient_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details=json.dumps(details) if details else None,
        success=success,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    # NOTE: caller is responsible for committing the session.
    # This keeps the audit entry in the same transaction as the main write,
    # so if the main write rolls back the audit entry rolls back too (atomic).
    return entry
