"""
Authentication Router  --  Project Aura
JWT auth + registration + password reset + change password
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os
import secrets
import re

from services.rate_limiter import limiter
from src.db import (
    get_db, User, AuditLog, UserProfile, PatientPreferences,
    PasswordResetToken, authenticate_user, hash_password, verify_password,
    Patient,
)
from services.audit_service import log_action

router = APIRouter()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "8"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "patient"
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    linked_patient_id: Optional[int] = None
    care_setting: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ConsentRequest(BaseModel):
    consent_given: bool


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Helpers ──────────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Returns (valid, error_message). Min 8 chars, 1 upper, 1 number."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    return True, ""


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked until {user.locked_until}"
        )
    return user


def require_role(*roles):
    """Dependency factory to restrict endpoint to specific roles."""
    def check_role(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(roles)}"
            )
        return current_user
    return check_role


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """Login  --  returns JWT token and user object."""
    user = authenticate_user(data.username, data.password, db)

    if not user:
        user_check = db.query(User).filter(User.username == data.username).first()
        if user_check:
            user_check.failed_logins = (user_check.failed_logins or 0) + 1
            if user_check.failed_logins >= 5:
                user_check.locked_until = datetime.utcnow() + timedelta(minutes=30)
            db.commit()

        audit = AuditLog(user_id=None, action="LOGIN_FAILED", resource_type="user",
                         user_role=None,
                         ip_address=(request.headers.get("x-forwarded-for") or "").split(",")[0].strip() or getattr(request.client, "host", None),
                         user_agent=request.headers.get("user-agent"),
                         success=False, details=f'{{"username": "{data.username}"}}')
        db.add(audit)
        db.commit()

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect username or password")

    # Check if user has completed the questionnaire
    prefs = db.query(PatientPreferences).filter(PatientPreferences.user_id == user.id).first()
    # Default to False (not complete) if no prefs exist -- forces questionnaire for new patient/family users
    questionnaire_complete = prefs.questionnaire_complete if prefs else False
    needs_questionnaire = (user.role in ["patient", "family"]) and not questionnaire_complete

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    log_action(db, user=user, action="LOGIN_SUCCESS",
               resource_type="user", resource_id=user.id,
               request=request)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
            "phone": user.phone,
            "consent_given": user.consent_given,
            "needs_questionnaire": needs_questionnaire,
            "care_setting": getattr(user, 'care_setting', None),
            "is_verified": getattr(user, 'is_verified', False),
            "is_professional": getattr(user, 'is_professional', False),
            "professional_title": getattr(user, 'professional_title', None),
        }
    }


@router.post("/register")
async def register(http_request: Request, request: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account (public endpoint for self-registration)."""
    # Validate password strength
    valid, error = validate_password_strength(request.password)
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    # Check uniqueness
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Limit roles via public registration
    allowed_roles = ["patient", "family"]
    if request.role not in allowed_roles:
        request.role = "patient"

    new_user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
        role=request.role,
        full_name=request.full_name,
        phone=request.phone,
        is_active=True,
        is_verified=False,
        consent_given=False,
        created_at=datetime.utcnow(),
    )
    # Save care_setting + new demographic fields
    try:
        if request.care_setting:
            new_user.care_setting = request.care_setting
        if request.gender:
            new_user.gender = request.gender
        if request.date_of_birth:
            try:
                new_user.date_of_birth = datetime.strptime(request.date_of_birth, "%Y-%m-%d")
            except ValueError:
                pass
        if request.address:
            new_user.address = request.address
        if request.location:
            new_user.location = request.location
    except Exception:
        pass
    db.add(new_user)
    db.flush()  # get new_user.id

    # ── Auto-create a Patient record for patient-role registrations ──────────
    auto_patient_id = request.linked_patient_id
    if request.role == "patient" and not auto_patient_id:
        try:
            new_patient = Patient(
                full_name=request.full_name,
                patient_code=f"PA{new_user.id:04d}",
                date_of_birth=datetime(1970, 1, 1),  # placeholder - updated after onboarding
                gender=None,
                primary_diagnosis="To be assessed",
                status="active",
                phone=request.phone,
                created_at=datetime.utcnow(),
            )
            db.add(new_patient)
            db.flush()
            auto_patient_id = new_patient.id

            # Auto-assign the first available clinician as primary care provider
            from src.db import CaregiverAssignment
            first_clinician = db.query(User).filter(
                User.role.in_(["clinician", "admin"]),
                User.is_active == True,
            ).order_by(User.id.asc()).first()
            if first_clinician:
                assignment = CaregiverAssignment(
                    patient_id=new_patient.id,
                    caregiver_id=first_clinician.id,
                    active=True,
                    assigned_at=datetime.utcnow(),
                )
                db.add(assignment)
                db.flush()
        except Exception as patient_err:
            import logging
            logging.getLogger(__name__).warning(
                f"Patient auto-creation failed for {request.username}: {patient_err}"
            )
            auto_patient_id = None

    # Create UserProfile
    profile = UserProfile(user_id=new_user.id, language_pref="en")
    db.add(profile)

    # Initialise preferences and link to patient record
    prefs = PatientPreferences(
        user_id=new_user.id,
        patient_id=auto_patient_id,
        questionnaire_complete=False,
    )
    db.add(prefs)

    log_action(db, user=new_user, action="USER_REGISTERED",
               resource_type="user", resource_id=new_user.id,
               request=http_request,
               details={"role": new_user.role})
    db.commit()

    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "full_name": new_user.full_name,
            "phone": new_user.phone,
            "consent_given": False,
            "needs_questionnaire": True,
            "care_setting": getattr(new_user, 'care_setting', None),
            "is_verified": False,
            "is_professional": False,
            "professional_title": None,
            "patient_id": auto_patient_id,
        }
    }


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password reset. Always returns generic message for security.
    If SENDGRID_API_KEY is set, emails the link. Otherwise returns temp token for admin relay.
    """
    user = db.query(User).filter(User.email == request.email).first()

    # Always return the same message  --  never reveal if email exists
    generic_response = {
        "message": "If this email exists in our system, a reset link has been sent.",
        "email_configured": bool(os.getenv("SENDGRID_API_KEY"))
    }

    if not user:
        return generic_response

    # Generate secure reset token (1 hour expiry)
    token_value = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token_value,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(reset_token)
    db.commit()

    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    smtp_host    = os.getenv("SMTP_HOST", "")
    smtp_user    = os.getenv("SMTP_USER", "")
    smtp_pass    = os.getenv("SMTP_PASS", "")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link   = f"{frontend_url}/reset-password?token={token_value}"

    if sendgrid_key:
        # Send email via SendGrid
        try:
            import httpx
            payload = {
                "personalizations": [{"to": [{"email": user.email}]}],
                "from": {"email": os.getenv("SENDGRID_FROM_EMAIL", "noreply@projectaura.health"), "name": "Project Aura"},
                "subject": "Project Aura  --  Password Reset",
                "content": [{
                    "type": "text/plain",
                    "value": (
                        f"Hello {user.full_name or user.username},\n\n"
                        f"A password reset was requested for your Project Aura account.\n\n"
                        f"Click the link below to reset your password (expires in 1 hour):\n{reset_link}\n\n"
                        f"If you did not request this, ignore this email.\n\nProject Aura Team"
                    )
                }]
            }
            resp = httpx.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={"Authorization": f"Bearer {sendgrid_key}", "Content-Type": "application/json"},
                json=payload,
                timeout=10,
            )
            if resp.status_code not in (200, 202):
                import logging
                logging.getLogger(__name__).warning(f"SendGrid returned {resp.status_code}: {resp.text}")
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"SendGrid email failed: {e}")
        return generic_response

    elif smtp_host and smtp_user and smtp_pass:
        # SMTP fallback (e.g. Gmail, Mailhog)
        try:
            import smtplib
            from email.mime.text import MIMEText
            msg = MIMEText(
                f"Hello {user.full_name or user.username},\n\n"
                f"Click the link below to reset your password (expires in 1 hour):\n{reset_link}\n\n"
                f"If you did not request this, ignore this email.\n\nProject Aura Team"
            )
            msg['Subject'] = 'Project Aura  --  Password Reset'
            msg['From']    = smtp_user
            msg['To']      = user.email
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as s:
                s.starttls()
                s.login(smtp_user, smtp_pass)
                s.send_message(msg)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"SMTP email failed: {e}")
        return generic_response

    else:
        # No email configured  --  return token for admin relay
        return {
            **generic_response,
            "no_email_mode": True,
            "temp_token": token_value,
            "reset_link": reset_link,
            "instruction": (
                "Email not configured. To enable email: set SENDGRID_API_KEY or "
                "SMTP_HOST + SMTP_USER + SMTP_PASS environment variables. "
                "Share the reset_link with the user directly."
            )
        }


@router.post("/reset-password")
async def reset_password(http_request: Request, request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Complete password reset using token from forgot-password flow."""
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    valid, error = validate_password_strength(request.new_password)
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(request.new_password)
    user.failed_logins = 0
    user.locked_until = None
    reset_token.used = True

    log_action(db, user=user, action="PASSWORD_RESET",
               resource_type="user", resource_id=user.id, request=http_request)
    db.commit()

    return {"message": "Password reset successfully. Please log in with your new password."}


@router.put("/change-password")
async def change_password(
    http_request: Request,
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change own password (authenticated users only)."""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    valid, error = validate_password_strength(request.new_password)
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    current_user.hashed_password = hash_password(request.new_password)

    log_action(db, user=current_user, action="PASSWORD_CHANGED",
               resource_type="user", resource_id=current_user.id, request=http_request)
    db.commit()

    return {"message": "Password changed successfully"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info with care setting and verification status."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "consent_given": current_user.consent_given,
        "is_active": current_user.is_active,
        "care_setting": getattr(current_user, 'care_setting', None),
        "is_verified": getattr(current_user, 'is_verified', False),
        "is_professional": getattr(current_user, 'is_professional', False),
        "professional_title": getattr(current_user, 'professional_title', None),
    }


@router.post("/consent")
async def give_consent(
    http_request: Request,
    request: ConsentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record user consent."""
    current_user.consent_given = request.consent_given
    current_user.consent_at = datetime.utcnow()

    log_action(db, user=current_user, action="CONSENT_GIVEN",
               resource_type="user", resource_id=current_user.id,
               request=http_request,
               details={"consent_given": request.consent_given})
    db.commit()

    return {"message": "Consent recorded", "consent_given": request.consent_given}


@router.post("/logout")
async def logout(
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout  --  client should delete token."""
    log_action(db, user=current_user, action="LOGOUT",
               resource_type="user", resource_id=current_user.id,
               request=http_request)
    db.commit()
    return {"message": "Logged out successfully"}


@router.get("/users")
async def list_all_users(
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all active users (public to authenticated users).
    Used for heir designation, message recipients, etc.
    Returns basic user info only (no sensitive data).
    """
    query = db.query(User).filter(User.is_active == True)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    
    return {
        "users": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "username": u.username,
            }
            for u in users
        ]
    }
