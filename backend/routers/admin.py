"""
Admin Router  --  Project Aura
User management and audit log (admin role only).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
import csv
import io

from src.db import get_db, User, UserProfile, AuditLog, PatientPreferences, hash_password
from routers.auth import get_current_user, require_role, validate_password_strength

router = APIRouter()


class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str
    phone: Optional[str] = None
    department: Optional[str] = None
    facility_name: Optional[str] = None
    linked_patient_id: Optional[int] = None


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    facility_name: Optional[str] = None
    # Professional verification
    is_professional: Optional[bool] = None
    professional_title: Optional[str] = None
    # Care setting (admin can change on request)
    care_setting: Optional[str] = None


# ─── User Management ──────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, le=100),
    _: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """List all users with optional filters. Admin only."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.username.ilike(f"%{search}%"))
        )

    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "phone": u.phone,
                "is_active": u.is_active,
                "is_verified": getattr(u, 'is_verified', False),
                "is_professional": getattr(u, 'is_professional', False),
                "professional_title": getattr(u, 'professional_title', None),
                "care_setting": getattr(u, 'care_setting', None),
                "care_setting_change_request": getattr(u, 'care_setting_change_request', None),
                "care_setting_change_reason": getattr(u, 'care_setting_change_reason', None),
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login": u.last_login.isoformat() if u.last_login else None,
            }
            for u in users
        ]
    }


@router.post("/users")
async def create_user(
    request: CreateUserRequest,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create a new user account. Admin only."""
    valid, error = validate_password_strength(request.password)
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    allowed_roles = ["patient", "family", "caregiver", "clinician", "admin"]
    if request.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {allowed_roles}")

    new_user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
        role=request.role,
        full_name=request.full_name,
        phone=request.phone,
        is_active=True,
        is_verified=True,  # Admin-created accounts are pre-verified
        consent_given=False,
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.flush()

    profile = UserProfile(
        user_id=new_user.id,
        department=request.department,
        facility_name=request.facility_name,
    )
    db.add(profile)

    # Create pending questionnaire record for patient/family
    if request.role in ["patient", "family"]:
        prefs = PatientPreferences(
            user_id=new_user.id,
            patient_id=request.linked_patient_id,
            questionnaire_complete=False,
        )
        db.add(prefs)

    audit = AuditLog(
        user_id=current_admin.id, user_role=current_admin.role,
        action="admin_create_user", resource_type="user",
        resource_id=new_user.id, success=True,
        details=f'{{"created_role": "{request.role}", "created_username": "{request.username}"}}'
    )
    db.add(audit)
    db.commit()

    return {
        "message": "User created successfully",
        "user_id": new_user.id,
        "username": new_user.username,
        "temp_password": request.password  # Return so admin can relay to user
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    request: UpdateUserRequest,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Edit user details. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.full_name is not None:
        user.full_name = request.full_name
    if request.email is not None:
        # Check uniqueness
        existing = db.query(User).filter(User.email == request.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = request.email
    if request.phone is not None:
        user.phone = request.phone
    if request.role is not None:
        user.role = request.role

    # Professional verification fields
    if request.is_professional is not None:
        try: user.is_professional = request.is_professional
        except Exception: pass
    if request.professional_title is not None:
        try: user.professional_title = request.professional_title
        except Exception: pass
    # When admin grants professional verification, also set is_verified
    if request.is_professional:
        try: user.is_verified = True
        except Exception: pass

    # Care setting change (admin approves request)
    if request.care_setting is not None:
        try:
            user.care_setting = request.care_setting
            # Clear any pending change request
            user.care_setting_change_request = None
            user.care_setting_change_reason = None
        except Exception: pass

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    if request.department is not None:
        profile.department = request.department
    if request.facility_name is not None:
        profile.facility_name = request.facility_name

    audit = AuditLog(user_id=current_admin.id, user_role=current_admin.role,
                     action="admin_update_user", resource_type="user",
                     resource_id=user_id, success=True)
    db.add(audit)
    db.commit()

    return {"message": "User updated successfully"}


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Toggle user active/inactive status. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = not user.is_active
    action = "admin_activate_user" if user.is_active else "admin_deactivate_user"

    audit = AuditLog(user_id=current_admin.id, user_role=current_admin.role,
                     action=action, resource_type="user", resource_id=user_id, success=True)
    db.add(audit)
    db.commit()

    status_msg = "activated" if user.is_active else "deactivated"
    return {"message": f"User {status_msg} successfully", "is_active": user.is_active}


@router.put("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: int,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin resets a user's password to a temporary value."""
    import secrets
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    temp_password = "Aura" + secrets.token_hex(4).upper()
    user.hashed_password = hash_password(temp_password)
    user.failed_logins = 0
    user.locked_until = None

    audit = AuditLog(user_id=current_admin.id, user_role=current_admin.role,
                     action="admin_reset_password", resource_type="user",
                     resource_id=user_id, success=True)
    db.add(audit)
    db.commit()

    return {"message": "Password reset", "temp_password": temp_password}


# ─── Audit Log ────────────────────────────────────────────────────────────────

@router.get("/audit-log")
async def get_audit_log(
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=200),
    _: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get audit log with filters. Admin only."""
    query = db.query(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id)

    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if date_from:
        query = query.filter(AuditLog.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(AuditLog.created_at <= datetime.fromisoformat(date_to))

    total = query.count()
    results = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": user.full_name if user else "System",
                "user_role": log.user_role,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "patient_id": log.patient_id,
                "details": log.details,
                "success": log.success,
                "created_at": log.created_at.isoformat(),
            }
            for log, user in results
        ]
    }
