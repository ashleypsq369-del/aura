"""
User Profile Router  --  Project Aura
GET/PUT own profile, notification preferences, session history, avatar upload.
Demographics (gender, dob, address, location, avatar_url) stored in UserExtended.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from pathlib import Path
import uuid

from src.db import get_db, User, UserProfile, UserExtended, AuditLog
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


def _get_or_create_extended(db: Session, user_id: int) -> UserExtended:
    ext = db.query(UserExtended).filter(UserExtended.user_id == user_id).first()
    if not ext:
        ext = UserExtended(user_id=user_id)
        db.add(ext)
        db.flush()
    return ext


@router.get("")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile  = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    extended = db.query(UserExtended).filter(UserExtended.user_id == current_user.id).first()

    names    = current_user.full_name.split()
    initials = "".join([n[0].upper() for n in names[:2]])

    logins = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action  == "login_success"
    ).order_by(AuditLog.created_at.desc()).limit(5).all()

    session_history = [{"date": log.created_at.isoformat(), "action": "Sign in"} for log in logins]

    return {
        "id":           current_user.id,
        "username":     current_user.username,
        "email":        current_user.email,
        "full_name":    current_user.full_name,
        "phone":        current_user.phone,
        "role":         current_user.role,
        "initials":     initials,
        "is_active":    current_user.is_active,
        "created_at":   current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login":   current_user.last_login.isoformat()  if current_user.last_login  else None,
        "consent_given": current_user.consent_given,
        # Extended demographic fields
        "avatar_url":   extended.avatar_url   if extended else None,
        "gender":       extended.gender       if extended else None,
        "date_of_birth": extended.date_of_birth.isoformat() if (extended and extended.date_of_birth) else None,
        "address":      extended.address      if extended else None,
        "location":     extended.location     if extended else None,
        # Profile preferences
        "profile": {
            "department":         profile.department        if profile else None,
            "specialisation":     profile.specialisation    if profile else None,
            "facility_name":      profile.facility_name     if profile else None,
            "region":             profile.region            if profile else None,
            "language_pref":      profile.language_pref     if profile else "en",
            "notification_email": profile.notification_email if profile else True,
            "notification_sms":   profile.notification_sms  if profile else False,
            "avatar_url":         extended.avatar_url       if extended else None,
        } if profile else {},
        "session_history": session_history,
    }


@router.put("")
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ── User fields ──
    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.phone is not None:
        current_user.phone = request.phone

    # ── UserExtended (demographic) ──
    ext = _get_or_create_extended(db, current_user.id)
    if request.gender is not None:
        ext.gender = request.gender
    if request.date_of_birth is not None:
        try:
            ext.date_of_birth = datetime.strptime(request.date_of_birth, "%Y-%m-%d")
        except ValueError:
            pass
    if request.address is not None:
        ext.address = request.address
    if request.location is not None:
        ext.location = request.location

    # ── UserProfile (professional + notification) ──
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if request.language_pref     is not None: profile.language_pref     = request.language_pref
    if request.notification_email is not None: profile.notification_email = request.notification_email
    if request.notification_sms  is not None: profile.notification_sms  = request.notification_sms
    if request.department        is not None: profile.department        = request.department
    if request.specialisation    is not None: profile.specialisation    = request.specialisation
    if request.facility_name     is not None: profile.facility_name     = request.facility_name
    if request.region            is not None: profile.region            = request.region

    db.add(AuditLog(user_id=current_user.id, user_role=current_user.role,
                    action="profile_updated", resource_type="user",
                    resource_id=current_user.id, success=True))
    db.commit()
    return {"message": "Profile updated successfully"}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are allowed")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 5MB")

    ext  = Path(file.filename).suffix.lower() if file.filename and "." in file.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".jpg"
    filename  = f"{uuid.uuid4()}{ext}"
    save_path = UPLOAD_DIR / filename
    save_path.write_bytes(content)

    extended = _get_or_create_extended(db, current_user.id)

    # Delete old avatar file if it exists
    old = extended.avatar_url
    if old and ("/uploads/profiles/" in old or "/static/uploads/profiles/" in old):
        old_path = UPLOAD_DIR / old.split("/")[-1]
        if old_path.exists():
            try: old_path.unlink()
            except Exception: pass

    extended.avatar_url = f"/uploads/profiles/{filename}"
    db.add(AuditLog(user_id=current_user.id, user_role=current_user.role,
                    action="avatar_uploaded", resource_type="user",
                    resource_id=current_user.id, success=True))
    db.commit()
    return {"avatar_url": extended.avatar_url, "message": "Profile photo updated"}
