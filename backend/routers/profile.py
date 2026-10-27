"""
User Profile Router  --  Project Aura
GET/PUT own profile, notification preferences, session history, avatar upload.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from pathlib import Path
import uuid

from src.db import get_db, User, UserProfile, AuditLog
from routers.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = Path("uploads/profiles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
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
            "address": getattr(profile, 'address', None),
            "language_pref": profile.language_pref if profile else "en",
            "notification_email": profile.notification_email if profile else True,
            "notification_sms": profile.notification_sms if profile else False,
            "avatar_url": getattr(profile, 'avatar_url', None),
        } if profile else {},
        "avatar_url": getattr(profile, 'avatar_url', None),
        "gender": getattr(current_user, 'gender', None),
        "date_of_birth": current_user.date_of_birth.isoformat() if getattr(current_user, 'date_of_birth', None) else None,
        "address": getattr(current_user, 'address', None),
        "location": getattr(current_user, 'location', None),
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
    try:
        if request.gender is not None:
            current_user.gender = request.gender
        if request.date_of_birth is not None:
            try:
                current_user.date_of_birth = datetime.strptime(request.date_of_birth, "%Y-%m-%d")
            except ValueError:
                pass
        if request.address is not None:
            current_user.address = request.address
        if request.location is not None:
            current_user.location = request.location
    except Exception:
        pass

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
    try:
        if request.address is not None:
            profile.address = request.address
    except Exception:
        pass

    audit = AuditLog(user_id=current_user.id, user_role=current_user.role,
                     action="profile_updated", resource_type="user",
                     resource_id=current_user.id, success=True)
    db.add(audit)
    db.commit()

    return {"message": "Profile updated successfully"}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a profile photo. Max 5MB, JPEG/PNG/WebP only."""
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are allowed")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 5MB")

    ext = Path(file.filename).suffix.lower() if file.filename and "." in file.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".jpg"

    filename = f"{uuid.uuid4()}{ext}"
    save_path = UPLOAD_DIR / filename
    save_path.write_bytes(content)

    # Get or create profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    # Delete old avatar file
    old_url = getattr(profile, "avatar_url", None)
    if old_url and "/uploads/profiles/" in old_url:
        old_filename = old_url.split("/")[-1]
        old_path = UPLOAD_DIR / old_filename
        if old_path.exists():
            try:
                old_path.unlink()
            except Exception:
                pass

    avatar_url = f"/static/uploads/profiles/{filename}"
    try:
        profile.avatar_url = avatar_url
    except Exception:
        pass

    db.add(AuditLog(user_id=current_user.id, user_role=current_user.role,
                    action="avatar_uploaded", resource_type="user",
                    resource_id=current_user.id, success=True))
    db.commit()

    return {"avatar_url": avatar_url, "message": "Profile photo updated"}
