"""
Feature Gates Router  --  ProjectAura
=======================================
Manages per-user feature overrides and user feature-access requests.

Endpoints:
  GET  /api/features/my-overrides          -- user: get own overrides
  GET  /api/features/effective/{user_id}   -- user/admin: effective feature state
  POST /api/features/request               -- user: request access to a hidden feature
  GET  /api/features/requests              -- admin: list all pending/all requests
  PUT  /api/features/requests/{id}/review  -- admin: approve/deny a request
  GET  /api/features/admin/users           -- admin: list all users + their overrides
  PUT  /api/features/admin/override        -- admin: set override for a user+feature
  DELETE /api/features/admin/override/{id} -- admin: remove an override
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from src.db import get_db, User, UserFeatureOverride, FeatureRequest
from routers.auth import get_current_user, require_role
from services.audit_service import log_action
from fastapi import Request

router = APIRouter()

# ── All known features (path → human label) ──────────────────────────────────
KNOWN_FEATURES = {
    "/memory-vault":        "Memory Vault",
    "/legacy-setup":        "Digital Legacy Setup",
    "/legacy-content":      "Legacy Content Creator",
    "/heir-management":     "Heir Management",
    "/journal":             "Personal Journal",
    "/community":           "Community Hub",
    "/bereavement-support": "Bereavement Support",
    "/pre-clinic":          "Pre-Clinic Checklist",
    "/appointments":        "Appointments",
    "/medications":         "Medications",
    "/wellness-checkin":    "Wellness Check-In",
    "/messages":            "Messages / Care Team Chat",
    "/my-journey":          "My Journey",
    "/care-settings":       "Care Settings",
    "/ai-insights":         "AI Insights",
    "/resources":           "Resources",
}


# ── Pydantic models ───────────────────────────────────────────────────────────

class FeatureRequestCreate(BaseModel):
    feature_path: str
    reason: str

class FeatureRequestReview(BaseModel):
    status: str          # 'approved' | 'denied'
    admin_note: Optional[str] = None

class AdminOverrideSet(BaseModel):
    user_id: int
    feature_path: str
    state: str           # 'enabled' | 'disabled' | 'locked'
    note: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _override_dict(o: UserFeatureOverride):
    return {
        "id":           o.id,
        "feature_path": o.feature_path,
        "feature_name": KNOWN_FEATURES.get(o.feature_path, o.feature_path),
        "state":        o.state,
        "source":       o.source,
        "note":         o.note,
        "updated_at":   o.updated_at.isoformat() if o.updated_at else None,
    }

def _request_dict(r: FeatureRequest, include_user=False):
    d = {
        "id":           r.id,
        "feature_path": r.feature_path,
        "feature_name": r.feature_name or KNOWN_FEATURES.get(r.feature_path, r.feature_path),
        "reason":       r.reason,
        "status":       r.status,
        "admin_note":   r.admin_note,
        "created_at":   r.created_at.isoformat() if r.created_at else None,
        "reviewed_at":  r.reviewed_at.isoformat() if r.reviewed_at else None,
    }
    if include_user and r.user:
        d["user"] = {"id": r.user.id, "name": r.user.full_name, "role": r.user.role}
    return d


# ── User endpoints ────────────────────────────────────────────────────────────

@router.get("/my-overrides")
async def get_my_overrides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all feature overrides that apply to the current user."""
    overrides = db.query(UserFeatureOverride).filter(
        UserFeatureOverride.user_id == current_user.id
    ).all()
    return {
        "user_id": current_user.id,
        "overrides": [_override_dict(o) for o in overrides],
        "known_features": KNOWN_FEATURES,
    }


@router.get("/effective/{user_id}")
async def get_effective_features(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return effective feature state for a user.
    Users can only query themselves; admin can query anyone.
    """
    if current_user.id != user_id and current_user.role not in ("admin", "clinician"):
        raise HTTPException(status_code=403, detail="Access denied")

    overrides = db.query(UserFeatureOverride).filter(
        UserFeatureOverride.user_id == user_id
    ).all()

    result = {}
    for path, name in KNOWN_FEATURES.items():
        override = next((o for o in overrides if o.feature_path == path), None)
        result[path] = {
            "feature_name": name,
            "override_state": override.state if override else None,
            "override_source": override.source if override else None,
            "override_id": override.id if override else None,
        }
    return {"user_id": user_id, "features": result}


@router.post("/request")
async def request_feature_access(
    body: FeatureRequestCreate,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User requests access to a feature that is hidden for their care setting."""
    if body.feature_path not in KNOWN_FEATURES:
        raise HTTPException(status_code=400, detail="Unknown feature path")

    # Check for existing pending request
    existing = db.query(FeatureRequest).filter(
        FeatureRequest.user_id == current_user.id,
        FeatureRequest.feature_path == body.feature_path,
        FeatureRequest.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="A pending request for this feature already exists")

    # Check if feature is locked (admin-locked, cannot be requested)
    locked = db.query(UserFeatureOverride).filter(
        UserFeatureOverride.user_id == current_user.id,
        UserFeatureOverride.feature_path == body.feature_path,
        UserFeatureOverride.state == "locked"
    ).first()
    if locked:
        raise HTTPException(status_code=403, detail="This feature has been locked by your care administrator and cannot be requested")

    req = FeatureRequest(
        user_id=current_user.id,
        feature_path=body.feature_path,
        feature_name=KNOWN_FEATURES.get(body.feature_path),
        reason=body.reason,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(req)
    log_action(db, user=current_user, action="FEATURE_REQUEST_SUBMITTED",
               resource_type="feature_request", request=http_request,
               details={"feature_path": body.feature_path, "reason": body.reason[:100]})
    db.commit()
    db.refresh(req)

    return {"message": "Request submitted successfully. An administrator will review it shortly.",
            "request_id": req.id, "status": "pending"}


@router.get("/my-requests")
async def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all feature requests by the current user."""
    requests = db.query(FeatureRequest).filter(
        FeatureRequest.user_id == current_user.id
    ).order_by(FeatureRequest.created_at.desc()).all()
    return {"requests": [_request_dict(r) for r in requests]}


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/requests")
async def admin_list_requests(
    status: Optional[str] = Query(None),
    _: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: list feature access requests, optionally filtered by status."""
    q = db.query(FeatureRequest)
    if status:
        q = q.filter(FeatureRequest.status == status)
    requests = q.order_by(FeatureRequest.created_at.desc()).all()
    return {
        "total": len(requests),
        "requests": [_request_dict(r, include_user=True) for r in requests]
    }


@router.put("/admin/requests/{request_id}/review")
async def admin_review_request(
    request_id: int,
    body: FeatureRequestReview,
    http_request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: approve or deny a feature access request."""
    if body.status not in ("approved", "denied"):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'denied'")

    req = db.query(FeatureRequest).filter(FeatureRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=409, detail="Request has already been reviewed")

    req.status = body.status
    req.admin_note = body.admin_note
    req.reviewed_by = current_user.id
    req.reviewed_at = datetime.utcnow()

    if body.status == "approved":
        # Create or update override to 'enabled'
        override = db.query(UserFeatureOverride).filter(
            UserFeatureOverride.user_id == req.user_id,
            UserFeatureOverride.feature_path == req.feature_path
        ).first()
        if override:
            override.state = "enabled"
            override.source = "request_approved"
            override.note = f"Approved by {current_user.full_name}: {body.admin_note or ''}"
            override.updated_at = datetime.utcnow()
            override.created_by = current_user.id
        else:
            db.add(UserFeatureOverride(
                user_id=req.user_id,
                feature_path=req.feature_path,
                state="enabled",
                source="request_approved",
                note=f"Approved by {current_user.full_name}: {body.admin_note or ''}",
                created_by=current_user.id,
            ))

    log_action(db, user=current_user, action=f"FEATURE_REQUEST_{body.status.upper()}",
               resource_type="feature_request", resource_id=request_id,
               request=http_request,
               details={"user_id": req.user_id, "feature_path": req.feature_path})
    db.commit()

    return {"message": f"Request {body.status}", "request_id": request_id}


@router.get("/admin/users")
async def admin_list_users_features(
    _: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: list all non-admin users with their feature override counts."""
    users = db.query(User).filter(
        User.role.in_(["patient", "family", "caregiver"]),
        User.is_active == True
    ).order_by(User.full_name).all()

    result = []
    for u in users:
        overrides = db.query(UserFeatureOverride).filter(
            UserFeatureOverride.user_id == u.id
        ).all()
        pending = db.query(FeatureRequest).filter(
            FeatureRequest.user_id == u.id,
            FeatureRequest.status == "pending"
        ).count()
        result.append({
            "id": u.id,
            "name": u.full_name,
            "role": u.role,
            "care_setting": u.care_setting,
            "is_active": u.is_active,
            "override_count": len(overrides),
            "pending_requests": pending,
            "overrides": [_override_dict(o) for o in overrides],
        })
    return {"users": result, "total": len(result)}


@router.put("/admin/override")
async def admin_set_override(
    body: AdminOverrideSet,
    http_request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: enable, disable, or lock a feature for a specific user."""
    if body.state not in ("enabled", "disabled", "locked"):
        raise HTTPException(status_code=400, detail="state must be 'enabled', 'disabled', or 'locked'")
    if body.feature_path not in KNOWN_FEATURES:
        raise HTTPException(status_code=400, detail="Unknown feature path")

    target_user = db.query(User).filter(User.id == body.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    override = db.query(UserFeatureOverride).filter(
        UserFeatureOverride.user_id == body.user_id,
        UserFeatureOverride.feature_path == body.feature_path
    ).first()

    if override:
        override.state = body.state
        override.note = body.note
        override.source = "admin"
        override.updated_at = datetime.utcnow()
        override.created_by = current_user.id
    else:
        override = UserFeatureOverride(
            user_id=body.user_id,
            feature_path=body.feature_path,
            state=body.state,
            source="admin",
            note=body.note,
            created_by=current_user.id,
        )
        db.add(override)

    log_action(db, user=current_user, action=f"FEATURE_OVERRIDE_SET",
               resource_type="feature_override", request=http_request,
               details={"target_user_id": body.user_id, "feature_path": body.feature_path, "state": body.state})
    db.commit()
    db.refresh(override)

    return {"message": f"Feature {body.feature_path} set to '{body.state}' for user {body.user_id}",
            "override": _override_dict(override)}


@router.delete("/admin/override/{override_id}")
async def admin_delete_override(
    override_id: int,
    http_request: Request,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: remove a specific feature override (reverts to care-setting default)."""
    override = db.query(UserFeatureOverride).filter(UserFeatureOverride.id == override_id).first()
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")

    log_action(db, user=current_user, action="FEATURE_OVERRIDE_REMOVED",
               resource_type="feature_override", resource_id=override_id,
               request=http_request,
               details={"user_id": override.user_id, "feature_path": override.feature_path})
    db.delete(override)
    db.commit()

    return {"message": "Override removed - feature reverts to care-setting default"}


# ── Questionnaire-driven gate persistence ─────────────────────────────────────

@router.post("/questionnaire-gates")
async def save_questionnaire_gates(
    body: dict,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Called by the personalisation questionnaire on completion.
    Saves 'disabled' overrides for features hidden by the chosen care setting.
    Source is marked 'questionnaire' so admin can distinguish from manual overrides.
    """
    care_setting   = body.get("care_setting", "")
    hidden_paths   = body.get("hidden_features", [])
    enabled_paths  = body.get("enabled_features", [])

    saved = []

    # Disable hidden features
    for path in hidden_paths:
        if path not in KNOWN_FEATURES:
            continue
        existing = db.query(UserFeatureOverride).filter(
            UserFeatureOverride.user_id == current_user.id,
            UserFeatureOverride.feature_path == path
        ).first()
        if existing:
            if existing.source == "admin":
                continue   # never overwrite admin overrides
            existing.state = "disabled"
            existing.source = "questionnaire"
            existing.updated_at = datetime.utcnow()
        else:
            db.add(UserFeatureOverride(
                user_id=current_user.id,
                feature_path=path,
                state="disabled",
                source="questionnaire",
                note=f"Auto-set from care_setting={care_setting}",
            ))
        saved.append(path)

    # Explicitly enable features the user said yes to
    for path in enabled_paths:
        if path not in KNOWN_FEATURES:
            continue
        existing = db.query(UserFeatureOverride).filter(
            UserFeatureOverride.user_id == current_user.id,
            UserFeatureOverride.feature_path == path
        ).first()
        if existing:
            if existing.source == "admin":
                continue
            existing.state = "enabled"
            existing.source = "questionnaire"
            existing.updated_at = datetime.utcnow()
        else:
            db.add(UserFeatureOverride(
                user_id=current_user.id,
                feature_path=path,
                state="enabled",
                source="questionnaire",
            ))

    log_action(db, user=current_user, action="QUESTIONNAIRE_GATES_SAVED",
               resource_type="feature_override", request=http_request,
               details={"care_setting": care_setting, "hidden_count": len(saved)})
    db.commit()

    return {"message": "Gates saved", "saved_count": len(saved), "care_setting": care_setting}
