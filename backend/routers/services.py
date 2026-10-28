"""
Services Provider Marketplace Router
Routes: /api/services/*

Endpoints:
  GET  /types                          - list all service types
  GET  /providers                      - paginated directory with filters
  GET  /providers/{id}                 - full provider profile
  GET  /providers/{id}/slots           - available slots for a date
  POST /apply                          - provider self-registration
  GET  /my-application                 - check own application status
  GET  /my-availability                - own weekly schedule
  POST /my-availability                - set weekly availability
  POST /bookings                       - create booking request
  GET  /bookings/mine                  - own bookings
  PUT  /bookings/{id}/confirm          - provider confirms
  PUT  /bookings/{id}/cancel           - cancel a booking
  GET  /providers/{id}/ratings         - public ratings for a provider
  POST /ratings                        - submit a rating
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from pathlib import Path
import uuid

from src.db import (
    get_db, User, UserProfile, UserExtended, Patient, Appointment,
    CaregiverRating, NotificationQueue, AuditLog,
    ServiceTypeConfig, ProviderApplication,
    ProviderAvailability, ProviderBooking,
    PatientFamilyLink, PatientPreferences,
)
from routers.auth import get_current_user, hash_password, validate_password_strength

router = APIRouter()

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _avg_rating(db: Session, provider_id: int):
    ratings = db.query(CaregiverRating).filter(
        CaregiverRating.caregiver_id == provider_id
    ).all()
    if not ratings:
        return None, 0
    return round(sum(r.rating for r in ratings) / len(ratings), 1), len(ratings)


def _provider_dict(user: User, profile: UserProfile, db: Session, include_sensitive=False):
    avg, count = _avg_rating(db, user.id)
    total_bookings = db.query(ProviderBooking).filter(
        ProviderBooking.provider_id == user.id
    ).count()
    app = db.query(ProviderApplication).filter(
        ProviderApplication.user_id == user.id
    ).order_by(ProviderApplication.id.desc()).first()
    # Read demographic fields from UserExtended
    ext = db.query(UserExtended).filter(UserExtended.user_id == user.id).first()

    d = {
        "id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "gender": ext.gender if ext else None,
        "professional_title": user.professional_title,
        "service_type": app.service_type if app else (profile.specialisation if profile else None),
        "specialisation": profile.specialisation if profile else None,
        "facility_name": profile.facility_name if profile else None,
        "region": profile.region if profile else None,
        "address": ext.address if ext else None,
        "location": ext.location if ext else None,
        "avatar_url": ext.avatar_url if ext else None,
        "is_professional": user.is_professional,
        "is_verified": user.is_verified,
        "nmc_pin": profile.license_number if profile else None,
        "bio": app.bio if app else None,
        "years_experience": app.years_experience if app else 0,
        "qualifications": app.qualifications if app else [],
        "average_rating": avg,
        "total_reviews": count,
        "total_bookings": total_bookings,
    }
    if include_sensitive:
        d["phone"] = user.phone
        d["email"] = user.email
    return d


def _notify(db: Session, user_id: int, title: str, body: str, ntype="system"):
    db.add(NotificationQueue(
        recipient_id=user_id,
        notification_type=ntype,
        title=title,
        body=body,
        is_read=False,
    ))


def _score_assessment(answers: dict, questions: list) -> float:
    """Compute assessment score 0-100."""
    if not questions:
        return 0.0
    max_score = 0
    earned = 0
    for q in questions:
        opts = q.get("options", [])
        max_q = max((o.get("score", 0) for o in opts), default=0)
        max_score += max_q
        selected = answers.get(str(q.get("id")))
        if selected is not None:
            try:
                earned += opts[int(selected)].get("score", 0)
            except (IndexError, TypeError):
                pass
    if max_score == 0:
        return 0.0
    return round(earned / max_score * 100, 1)


# ─── Service Types ─────────────────────────────────────────────────────────────

@router.get("/types")
def list_service_types(db: Session = Depends(get_db)):
    types = db.query(ServiceTypeConfig).filter(ServiceTypeConfig.is_active == True).all()
    return [
        {
            "key": t.key,
            "label": t.label,
            "description": t.description,
            "icon_name": t.icon_name,
            "color": t.color,
            "required_certifications": t.required_certifications or [],
            "assessment_questions": t.assessment_questions or [],
            "min_pass_score": t.min_pass_score,
        }
        for t in types
    ]


# ─── Provider Directory ────────────────────────────────────────────────────────

@router.get("/providers")
def list_providers(
    service_type: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(12, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(
        User.role == "provider",
        User.is_active == True,
        User.is_verified == True,
    )
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.professional_title.ilike(f"%{search}%"))
        )

    users = query.all()

    # Join profile data and filter
    results = []
    for u in users:
        profile = db.query(UserProfile).filter(UserProfile.user_id == u.id).first()
        if region and (not profile or profile.region != region):
            continue
        avg, cnt = _avg_rating(db, u.id)
        if min_rating and (avg is None or avg < min_rating):
            continue
        app = db.query(ProviderApplication).filter(
            ProviderApplication.user_id == u.id,
            ProviderApplication.approval_status == "approved",
        ).order_by(ProviderApplication.id.desc()).first()
        if service_type and (not app or app.service_type != service_type):
            continue
        results.append(_provider_dict(u, profile, db))

    total = len(results)
    paginated = results[(page - 1) * per_page: page * per_page]
    return {"total": total, "page": page, "per_page": per_page, "providers": paginated}


@router.get("/providers/{provider_id}")
def get_provider(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == provider_id, User.role == "provider").first()
    if not user:
        raise HTTPException(404, "Provider not found")
    profile = db.query(UserProfile).filter(UserProfile.user_id == provider_id).first()

    # Ratings
    ratings = db.query(CaregiverRating).filter(
        CaregiverRating.caregiver_id == provider_id
    ).order_by(CaregiverRating.created_at.desc()).limit(10).all()

    # Availability summary
    availability = db.query(ProviderAvailability).filter(
        ProviderAvailability.provider_id == provider_id,
        ProviderAvailability.is_active == True,
    ).all()

    d = _provider_dict(user, profile, db, include_sensitive=False)
    d["ratings"] = [
        {
            "rating": r.rating,
            "comment": r.comment,
            "category_scores": r.category_scores,
            "created_at": r.created_at.isoformat(),
        }
        for r in ratings
    ]
    d["availability"] = [
        {
            "day_of_week": a.day_of_week,
            "start_time": a.start_time,
            "end_time": a.end_time,
            "slot_duration_minutes": a.slot_duration_minutes,
        }
        for a in availability
    ]
    return d


@router.get("/providers/{provider_id}/slots")
def get_provider_slots(
    provider_id: int,
    date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Invalid date format — use YYYY-MM-DD")

    day_of_week = target_date.weekday()  # 0=Monday

    avail = db.query(ProviderAvailability).filter(
        ProviderAvailability.provider_id == provider_id,
        ProviderAvailability.day_of_week == day_of_week,
        ProviderAvailability.is_active == True,
    ).first()

    if not avail:
        return {"date": date, "slots": []}

    # Generate slots
    start_h, start_m = map(int, avail.start_time.split(":"))
    end_h, end_m = map(int, avail.end_time.split(":"))
    dur = avail.slot_duration_minutes
    start_mins = start_h * 60 + start_m
    end_mins = end_h * 60 + end_m
    all_slots = []
    t = start_mins
    while t + dur <= end_mins:
        all_slots.append(f"{t // 60:02d}:{t % 60:02d}")
        t += dur

    # Remove already booked slots
    booked = db.query(ProviderBooking).filter(
        ProviderBooking.provider_id == provider_id,
        ProviderBooking.requested_date >= datetime(target_date.year, target_date.month, target_date.day),
        ProviderBooking.requested_date < datetime(target_date.year, target_date.month, target_date.day) + timedelta(days=1),
        ProviderBooking.status.in_(["pending", "confirmed"]),
    ).all()
    booked_times = {b.start_time for b in booked if b.start_time}

    available = [s for s in all_slots if s not in booked_times]
    return {
        "date": date,
        "slots": available,
        "duration_minutes": dur,
    }


@router.get("/providers/{provider_id}/ratings")
def get_provider_ratings(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ratings = db.query(CaregiverRating).filter(
        CaregiverRating.caregiver_id == provider_id
    ).order_by(CaregiverRating.created_at.desc()).all()
    avg, cnt = _avg_rating(db, provider_id)
    return {
        "provider_id": provider_id,
        "average_rating": avg,
        "total_reviews": cnt,
        "ratings": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "category_scores": r.category_scores,
                "created_at": r.created_at.isoformat(),
            }
            for r in ratings
        ],
    }


# ─── Provider Application (self-registration) ─────────────────────────────────

class ProviderApplyRequest(BaseModel):
    # Account fields
    username: str
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    # Professional fields
    service_type: str
    bio: str = ""
    years_experience: int = 0
    qualifications: List[Dict[str, Any]] = []
    license_number: Optional[str] = None
    specialisation: Optional[str] = None
    facility_name: Optional[str] = None
    region: Optional[str] = None
    # Assessment
    assessment_answers: Dict[str, int] = {}


@router.post("/apply", status_code=201)
def apply_as_provider(
    data: ProviderApplyRequest,
    db: Session = Depends(get_db),
):
    # Validate password
    valid, err = validate_password_strength(data.password)
    if not valid:
        raise HTTPException(400, err)

    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Username already exists")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")

    # Validate service type exists
    stype = db.query(ServiceTypeConfig).filter(
        ServiceTypeConfig.key == data.service_type
    ).first()
    if not stype:
        raise HTTPException(400, f"Unknown service type: {data.service_type}")

    # Score assessment
    score = _score_assessment(
        {str(k): v for k, v in data.assessment_answers.items()},
        stype.assessment_questions or []
    )

    # Create user with is_active=False (pending approval)
    dob = None
    if data.date_of_birth:
        try:
            dob = datetime.strptime(data.date_of_birth, "%Y-%m-%d")
        except ValueError:
            pass

    new_user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        role="provider",
        full_name=data.full_name,
        phone=data.phone,
        is_active=False,        # pending approval
        is_verified=False,
        is_professional=False,
        created_at=datetime.utcnow(),
    )

    db.add(new_user)
    db.flush()

    # Create UserProfile (professional fields only)
    profile = UserProfile(
        user_id=new_user.id,
        license_number=data.license_number,
        specialisation=data.specialisation or data.service_type,
        facility_name=data.facility_name,
        region=data.region,
        language_pref="en",
    )
    db.add(profile)

    # Create UserExtended (demographic fields)
    dob = None
    if data.date_of_birth:
        try:
            dob = datetime.strptime(data.date_of_birth, "%Y-%m-%d")
        except ValueError:
            pass
    ext = UserExtended(
        user_id=new_user.id,
        gender=data.gender,
        date_of_birth=dob,
        address=data.address,
        location=data.location,
    )
    db.add(ext)

    # Create application
    app = ProviderApplication(
        user_id=new_user.id,
        service_type=data.service_type,
        bio=data.bio,
        years_experience=data.years_experience,
        qualifications=data.qualifications,
        assessment_answers=data.assessment_answers,
        assessment_score=score,
        approval_status="pending",
        submitted_at=datetime.utcnow(),
    )
    db.add(app)

    db.add(AuditLog(
        user_id=new_user.id, user_role="provider",
        action="provider_applied", resource_type="provider_application",
        success=True,
        details=f'{{"service_type":"{data.service_type}","score":{score}}}',
    ))

    db.commit()
    db.refresh(app)

    return {
        "message": "Application submitted successfully",
        "user_id": new_user.id,
        "application_id": app.id,
        "assessment_score": score,
        "min_pass_score": stype.min_pass_score,
        "passed": score >= stype.min_pass_score,
        "status": "pending",
    }


@router.get("/my-application")
def get_my_application(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = db.query(ProviderApplication).filter(
        ProviderApplication.user_id == current_user.id
    ).order_by(ProviderApplication.id.desc()).first()
    if not app:
        raise HTTPException(404, "No application found")
    stype = db.query(ServiceTypeConfig).filter(
        ServiceTypeConfig.key == app.service_type
    ).first()
    return {
        "id": app.id,
        "service_type": app.service_type,
        "service_label": stype.label if stype else app.service_type,
        "bio": app.bio,
        "years_experience": app.years_experience,
        "qualifications": app.qualifications,
        "assessment_score": app.assessment_score,
        "min_pass_score": stype.min_pass_score if stype else 70,
        "passed": app.assessment_score >= (stype.min_pass_score if stype else 70),
        "approval_status": app.approval_status,
        "admin_notes": app.admin_notes,
        "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
        "reviewed_at": app.reviewed_at.isoformat() if app.reviewed_at else None,
        "is_active": current_user.is_active,
    }


# ─── Provider Availability ─────────────────────────────────────────────────────

@router.get("/my-availability")
def get_my_availability(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slots = db.query(ProviderAvailability).filter(
        ProviderAvailability.provider_id == current_user.id
    ).all()
    return [
        {
            "id": s.id,
            "day_of_week": s.day_of_week,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "slot_duration_minutes": s.slot_duration_minutes,
            "is_active": s.is_active,
        }
        for s in slots
    ]


class AvailabilitySlot(BaseModel):
    day_of_week: int       # 0=Mon, 6=Sun
    start_time: str        # HH:MM
    end_time: str          # HH:MM
    slot_duration_minutes: int = 60
    is_active: bool = True


@router.post("/my-availability", status_code=201)
def set_my_availability(
    slots: List[AvailabilitySlot],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Replace all current availability
    db.query(ProviderAvailability).filter(
        ProviderAvailability.provider_id == current_user.id
    ).delete()

    for s in slots:
        db.add(ProviderAvailability(
            provider_id=current_user.id,
            day_of_week=s.day_of_week,
            start_time=s.start_time,
            end_time=s.end_time,
            slot_duration_minutes=s.slot_duration_minutes,
            is_active=s.is_active,
        ))
    db.commit()
    return {"message": f"Saved {len(slots)} availability slots"}


# ─── Bookings ─────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    provider_id: int
    patient_id: Optional[int] = None
    service_type: str
    requested_date: str      # YYYY-MM-DD
    start_time: Optional[str] = None   # HH:MM
    duration_minutes: int = 60
    notes: str = ""


@router.post("/bookings", status_code=201)
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = db.query(User).filter(
        User.id == data.provider_id, User.role == "provider", User.is_active == True
    ).first()
    if not provider:
        raise HTTPException(404, "Provider not found or not active")

    try:
        req_date = datetime.strptime(data.requested_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Invalid date format")

    booking = ProviderBooking(
        provider_id=data.provider_id,
        patient_id=data.patient_id,
        booked_by=current_user.id,
        service_type=data.service_type,
        requested_date=req_date,
        start_time=data.start_time,
        duration_minutes=data.duration_minutes,
        notes=data.notes,
        status="pending",
    )
    db.add(booking)
    db.flush()

    # Notify provider
    _notify(db, data.provider_id,
            title=f"New booking request from {current_user.full_name}",
            body=f"{current_user.full_name} has requested a {data.service_type} session on {data.requested_date}.",
            ntype="booking_request")

    db.add(AuditLog(
        user_id=current_user.id, user_role=current_user.role,
        action="provider_booking_created", resource_type="provider_booking",
        resource_id=booking.id, success=True,
    ))

    db.commit()
    db.refresh(booking)

    return {
        "id": booking.id,
        "status": "pending",
        "provider_id": data.provider_id,
        "requested_date": data.requested_date,
        "start_time": data.start_time,
        "message": "Booking request sent to provider",
    }


@router.get("/bookings/mine")
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "provider":
        bookings = db.query(ProviderBooking).filter(
            ProviderBooking.provider_id == current_user.id
        ).order_by(ProviderBooking.requested_date.desc()).all()
    else:
        bookings = db.query(ProviderBooking).filter(
            ProviderBooking.booked_by == current_user.id
        ).order_by(ProviderBooking.requested_date.desc()).all()

    result = []
    for b in bookings:
        provider = db.query(User).filter(User.id == b.provider_id).first()
        provider_profile = db.query(UserProfile).filter(UserProfile.user_id == b.provider_id).first()
        result.append({
            "id": b.id,
            "provider_id": b.provider_id,
            "provider_name": provider.full_name if provider else "Unknown",
            "provider_title": provider.professional_title if provider else None,
            "provider_avatar": provider_profile.avatar_url if provider_profile else None,
            "service_type": b.service_type,
            "requested_date": b.requested_date.isoformat(),
            "start_time": b.start_time,
            "duration_minutes": b.duration_minutes,
            "status": b.status,
            "notes": b.notes,
        })
    return {"bookings": result, "total": len(result)}


@router.put("/bookings/{booking_id}/confirm")
def confirm_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(ProviderBooking).filter(ProviderBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.provider_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Only the provider or admin can confirm this booking")

    booking.status = "confirmed"
    booking.updated_at = datetime.utcnow()

    # Create an Appointment record
    appt = Appointment(
        patient_id=booking.patient_id or booking.booked_by,
        clinician_id=booking.provider_id,
        created_by=booking.provider_id,
        appointment_type=booking.service_type,
        scheduled_at=booking.requested_date,
        duration_minutes=booking.duration_minutes,
        location="Home Visit",
        status="scheduled",
        notes=booking.notes,
    )
    db.add(appt)
    db.flush()
    booking.appointment_id = appt.id

    # Notify booker
    _notify(db, booking.booked_by,
            title="Booking confirmed",
            body=f"Your {booking.service_type} session on {booking.requested_date.strftime('%d %b %Y')} has been confirmed.",
            ntype="booking_confirmed")

    db.commit()
    return {"message": "Booking confirmed", "appointment_id": appt.id}


@router.put("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(ProviderBooking).filter(ProviderBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.booked_by != current_user.id and booking.provider_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorised to cancel this booking")

    booking.status = "cancelled"
    booking.updated_at = datetime.utcnow()

    notify_id = booking.provider_id if booking.booked_by == current_user.id else booking.booked_by
    _notify(db, notify_id, title="Booking cancelled",
            body=f"The {booking.service_type} booking for {booking.requested_date.strftime('%d %b %Y')} has been cancelled.",
            ntype="booking_cancelled")

    db.commit()
    return {"message": "Booking cancelled"}


# ─── Ratings ──────────────────────────────────────────────────────────────────

class RatingCreate(BaseModel):
    booking_id: int
    provider_id: int
    rating: int
    comment: str = ""
    category_scores: Dict[str, int] = {}


@router.post("/ratings", status_code=201)
def submit_rating(
    data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not 1 <= data.rating <= 5:
        raise HTTPException(400, "Rating must be between 1 and 5")

    booking = db.query(ProviderBooking).filter(ProviderBooking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")

    # Reuse CaregiverRating model — appointment_id maps to booking's appointment_id
    # Use patient_id=1 as placeholder if not a patient booking
    existing = db.query(CaregiverRating).filter(
        CaregiverRating.caregiver_id == data.provider_id,
        CaregiverRating.created_by == current_user.id,
        CaregiverRating.appointment_id == (booking.appointment_id or 1),
    ).first()

    if existing:
        raise HTTPException(409, "You have already rated this booking")

    r = CaregiverRating(
        caregiver_id=data.provider_id,
        patient_id=booking.patient_id or 1,
        appointment_id=booking.appointment_id or 1,
        rating=data.rating,
        comment=data.comment,
        category_scores=data.category_scores,
        created_by=current_user.id,
    )
    db.add(r)
    booking.status = "completed"
    db.commit()
    db.refresh(r)
    return {"id": r.id, "message": "Rating submitted - thank you!"}
