"""
User Profile Router  --  Project Aura
GET/PUT own profile, notification preferences, session history.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session

from src.db import get_db, User, UserProfile, AuditLog
from routers.auth import get_current_user

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    language_pref: Optional[str] = None
    notification_email: Optional[bool] = None
    notification_sms: Optional[bool] = None
    department: Optional[str] = None
    specialisation: Optional[str] = None
    facility_name: Optional[str] = None
    region: Optional[str] = None


@router.get("")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's full profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    # Build initials avatar
    names = current_user.full_name.split()
    initials = "".join([n[0].upper() for n in names[:2]])

    # Last 5 audit log logins
    logins = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action == "login_success"
    ).order_by(AuditLog.created_at.desc()).limit(5).all()

    session_history = [
        {
            "date": log.created_at.isoformat(),
            "action": "Sign in",
        }
        for log in logins
    ]

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "role": current_user.role,
        "initials": initials,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "consent_given": current_user.consent_given,
        "profile": {
            "department": profile.department if profile else None,
            "specialisation": profile.specialisation if profile else None,
            "facility_name": profile.facility_name if profile else None,
            "region": profile.region if profile else None,
            "language_pref": profile.language_pref if profile else "en",
            "notification_email": profile.notification_email if profile else True,
            "notification_sms": profile.notification_sms if profile else False,
        } if profile else {},
        "session_history": session_history,
    }


@router.put("")
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update own profile information."""
    # Update User fields
    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.phone is not None:
        current_user.phone = request.phone

    # Upsert UserProfile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if request.language_pref is not None:
        profile.language_pref = request.language_pref
    if request.notification_email is not None:
        profile.notification_email = request.notification_email
    if request.notification_sms is not None:
        profile.notification_sms = request.notification_sms
    if request.department is not None:
        profile.department = request.department
    if request.specialisation is not None:
        profile.specialisation = request.specialisation
    if request.facility_name is not None:
        profile.facility_name = request.facility_name
    if request.region is not None:
        profile.region = request.region

    audit = AuditLog(user_id=current_user.id, user_role=current_user.role,
                     action="profile_updated", resource_type="user",
                     resource_id=current_user.id, success=True)
    db.add(audit)
    db.commit()

    return {"message": "Profile updated successfully"}
