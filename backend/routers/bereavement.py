"""
Bereavement Support Router
Priority 5: Bereavement Support

Addresses Finucane et al. (2024) - Bereavement support evidence-based components

Features:
- Grief progress tracking
- PG-13 grief screening
- Journal entries
- Post-death support schedule
- Resource access
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.db import (
    get_db, User, Patient, BereavementScreening, GriefJournal, PostDeathSchedule,
    BereavementEntry, PatientFamilyLink, CaregiverAssignment, LegacyHeir, AuditLog
)
from routers.auth import get_current_user

router = APIRouter()


# ==================== PYDANTIC MODELS ====================

class GriefScreeningSubmit(BaseModel):
    responses: Dict[str, int]  # question_id -> score (1-5)


class JournalEntryCreate(BaseModel):
    content: str


class BereavementEntryCreate(BaseModel):
    patient_id: int
    entry_type: str  # memory | journal
    content: str
    is_private: bool = True
    prompt_used: Optional[str] = None


# ==================== GRIEF SCREENING (PG-13) ====================

@router.post("/grief-screening")
async def submit_grief_screening(
    screening: GriefScreeningSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit PG-13 (Prolonged Grief-13) screening responses
    
    Scoring:
    - 13 questions, each scored 1-5
    - Total score range: 13-65
    - Threshold for complicated grief: 30+ (indicates need for professional support)
    
    Addresses Finucane et al. (2024) - Evidence-based grief assessment
    """
    
    # Calculate total score
    responses = screening.responses
    if len(responses) != 13:
        raise HTTPException(status_code=400, detail="All 13 questions must be answered")
    
    total_score = sum(responses.values())
    
    # Interpret score
    # PG-13 threshold: score >= 30 indicates prolonged grief disorder
    flagged = total_score >= 30
    
    if flagged:
        interpretation = "Your responses suggest you may be experiencing complicated or prolonged grief."
        recommendation = "We recommend speaking with a grief counselor or mental health professional. Support groups and therapy can be very helpful."
    elif total_score >= 20:
        interpretation = "Your grief responses are within a moderate range."
        recommendation = "Continue using self-care strategies and consider joining a support group. Monitor your grief over time."
    else:
        interpretation = "Your grief responses suggest you are coping relatively well."
        recommendation = "Continue your current coping strategies. Remember that grief can change over time - check in with yourself regularly."
    
    # Save to database
    db_screening = BereavementScreening(
        user_id=current_user.id,
        patient_id=None,  # Will be set if linked to specific patient
        responses=responses,
        score=total_score,
        flagged=flagged,
        completed_at=datetime.utcnow()
    )
    
    db.add(db_screening)
    db.commit()
    db.refresh(db_screening)
    
    return {
        "success": True,
        "screening_id": db_screening.id,
        "score": total_score,
        "flagged": flagged,
        "interpretation": interpretation,
        "recommendation": recommendation,
        "completed_at": db_screening.completed_at.isoformat()
    }


@router.get("/grief-screening/status")
async def get_screening_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get latest grief screening status for current user
    """
    
    latest_screening = db.query(BereavementScreening).filter(
        BereavementScreening.user_id == current_user.id
    ).order_by(desc(BereavementScreening.completed_at)).first()
    
    if not latest_screening:
        return {
            "completed_recently": False,
            "last_completed": None,
            "flagged": False
        }
    
    # Check if screening was completed within last 3 months
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    completed_recently = latest_screening.completed_at >= three_months_ago
    
    return {
        "completed_recently": completed_recently,
        "last_completed": latest_screening.completed_at.isoformat(),
        "flagged": latest_screening.flagged,
        "score": latest_screening.score
    }


@router.get("/grief-screening/history")
async def get_screening_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get screening history to track grief over time
    """
    
    screenings = db.query(BereavementScreening).filter(
        BereavementScreening.user_id == current_user.id
    ).order_by(desc(BereavementScreening.completed_at)).limit(limit).all()
    
    return {
        "total_screenings": len(screenings),
        "screenings": [
            {
                "id": s.id,
                "score": s.score,
                "flagged": s.flagged,
                "completed_at": s.completed_at.isoformat()
            }
            for s in screenings
        ]
    }


# ==================== GRIEF JOURNEY & PROGRESS ====================

@router.get("/grief-journey")
async def get_grief_journey(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's grief journey data including stage, journal entries, progress
    """
    
    # Get latest screening to determine current stage
    latest_screening = db.query(BereavementScreening).filter(
        BereavementScreening.user_id == current_user.id
    ).order_by(desc(BereavementScreening.completed_at)).first()
    
    # Infer grief stage from screening responses (simplified logic)
    current_stage = "acceptance"  # default
    if latest_screening:
        # This is simplified - in production, use validated stage assessment
        if latest_screening.score >= 40:
            current_stage = "depression"
        elif latest_screening.score >= 30:
            current_stage = "bargaining"
        elif latest_screening.score >= 20:
            current_stage = "anger"
        else:
            current_stage = "acceptance"
    
    # Get recent journal entries
    recent_entries = db.query(GriefJournal).filter(
        GriefJournal.user_id == current_user.id
    ).order_by(desc(GriefJournal.created_at)).limit(5).all()
    
    return {
        "current_stage": current_stage,
        "recent_entries": [
            {
                "id": entry.id,
                "content": entry.content,
                "created_at": entry.created_at.isoformat()
            }
            for entry in recent_entries
        ],
        "total_journal_entries": db.query(GriefJournal).filter(
            GriefJournal.user_id == current_user.id
        ).count()
    }


# ==================== JOURNAL ENTRIES ====================

@router.post("/journal")
async def save_journal_entry(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save a grief journal entry
    
    Journaling is a validated grief coping strategy
    """
    
    if not entry.content.strip():
        raise HTTPException(status_code=400, detail="Journal entry cannot be empty")
    
    if len(entry.content) > 5000:
        raise HTTPException(status_code=400, detail="Journal entry too long (max 5000 characters)")
    
    db_entry = GriefJournal(
        user_id=current_user.id,
        content=entry.content.strip(),
        created_at=datetime.utcnow()
    )
    
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return {
        "success": True,
        "entry_id": db_entry.id,
        "created_at": db_entry.created_at.isoformat()
    }


@router.get("/journal/entries")
async def get_journal_entries(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's journal entries
    """
    
    entries = db.query(GriefJournal).filter(
        GriefJournal.user_id == current_user.id
    ).order_by(desc(GriefJournal.created_at)).limit(limit).offset(offset).all()
    
    total = db.query(GriefJournal).filter(
        GriefJournal.user_id == current_user.id
    ).count()
    
    return {
        "total": total,
        "entries": [
            {
                "id": entry.id,
                "content": entry.content,
                "created_at": entry.created_at.isoformat()
            }
            for entry in entries
        ]
    }


# ==================== SUPPORT DATA & RESOURCES ====================

@router.get("/support-data")
async def get_support_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get bereavement support data overview
    """
    
    # Check if user has upcoming support schedule
    upcoming_support = db.query(PostDeathSchedule).filter(
        PostDeathSchedule.family_user_id == current_user.id,
        PostDeathSchedule.sent == False,
        PostDeathSchedule.scheduled_at >= datetime.utcnow()
    ).order_by(PostDeathSchedule.scheduled_at).first()
    
    # Get screening status
    latest_screening = db.query(BereavementScreening).filter(
        BereavementScreening.user_id == current_user.id
    ).order_by(desc(BereavementScreening.completed_at)).first()
    
    return {
        "has_upcoming_support": upcoming_support is not None,
        "next_support_date": upcoming_support.scheduled_at.isoformat() if upcoming_support else None,
        "screening_completed": latest_screening is not None,
        "screening_flagged": latest_screening.flagged if latest_screening else False
    }


# ==================== MEMORY VAULT & BEREAVEMENT ENTRIES ====================

def check_access_to_patient(user: User, patient_id: int, db: Session) -> bool:
    """Return True if user may access this patient's bereavement entries."""
    if user.role in ('admin', 'clinician'):
        return True

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return False

    if user.role == 'patient':
        if patient.full_name == user.full_name or patient.patient_code == user.username:
            return True

    if user.role == 'family':
        link = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.patient_id == patient_id,
            PatientFamilyLink.family_user_id == user.id,
        ).first()
        if link:
            return True

    if user.role == 'caregiver':
        assignment = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.patient_id == patient_id,
            CaregiverAssignment.caregiver_id == user.id,
            CaregiverAssignment.active == True,
        ).first()
        if assignment:
            return True

    heir = db.query(LegacyHeir).filter(
        LegacyHeir.patient_id == patient_id,
        LegacyHeir.heir_user_id == user.id,
        LegacyHeir.is_active == True,
        LegacyHeir.activated_at.isnot(None),
    ).first()
    return heir is not None


@router.get("/entries/{patient_id}")
async def get_bereavement_entries(
    patient_id: int,
    entry_type: Optional[str] = None,
    include_private: bool = False,
    author_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List memory/journal entries for a patient with privacy filtering.

    author_filter:
      - patient: entries authored by the linked patient (legacy/heir view)
      - me: entries authored by the current user (personal grief journal)
    """
    if not check_access_to_patient(current_user, patient_id, db):
        raise HTTPException(status_code=403, detail="Access denied")

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    query = db.query(BereavementEntry).filter(
        BereavementEntry.patient_id == patient_id
    )

    if entry_type:
        query = query.filter(BereavementEntry.entry_type == entry_type)

    if author_filter == "me":
        query = query.filter(BereavementEntry.user_id == current_user.id)
    elif author_filter == "patient":
        patient_user = db.query(User).filter(
            User.role == 'patient',
            User.full_name == patient.full_name,
        ).first()
        if not patient_user:
            patient_user = db.query(User).filter(
                User.role == 'patient',
                User.username == patient.patient_code,
            ).first()
        if patient_user:
            query = query.filter(BereavementEntry.user_id == patient_user.id)
        else:
            query = query.filter(BereavementEntry.user_id == -1)
    elif include_private:
        query = query.filter(
            (BereavementEntry.is_private == False) |
            (BereavementEntry.user_id == current_user.id)
        )
    else:
        query = query.filter(BereavementEntry.is_private == False)

    entries = query.order_by(desc(BereavementEntry.created_at)).all()

    result = []
    for entry in entries:
        author = db.query(User).filter(User.id == entry.user_id).first()
        result.append({
            "id": entry.id,
            "patient_id": entry.patient_id,
            "user_id": entry.user_id,
            "author_name": author.full_name if author else "Unknown",
            "entry_type": entry.entry_type,
            "content": entry.content,
            "prompt_used": entry.prompt_used,
            "is_private": entry.is_private,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
        })

    return {"entries": result}


@router.post("/entry")
async def create_bereavement_entry(
    data: BereavementEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a memory or journal entry for a linked patient."""
    if data.entry_type not in ("memory", "journal"):
        raise HTTPException(status_code=400, detail="entry_type must be 'memory' or 'journal'")

    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    if not check_access_to_patient(current_user, data.patient_id, db):
        raise HTTPException(status_code=403, detail="Access denied")

    entry = BereavementEntry(
        patient_id=data.patient_id,
        user_id=current_user.id,
        entry_type=data.entry_type,
        content=data.content.strip(),
        prompt_used=data.prompt_used,
        is_private=data.is_private,
        created_at=datetime.utcnow(),
    )
    db.add(entry)

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="bereavement_entry_created",
        resource_type="bereavement_entry",
        patient_id=data.patient_id,
        details=f'{{"entry_type": "{data.entry_type}", "is_private": {data.is_private}}}',
    )
    db.add(audit)
    db.commit()
    db.refresh(entry)

    return {
        "message": "Entry created",
        "entry_id": entry.id,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
    }


@router.delete("/entry/{entry_id}")
async def delete_bereavement_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a bereavement entry (author or admin/clinician only)."""
    entry = db.query(BereavementEntry).filter(BereavementEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    is_author = entry.user_id == current_user.id
    is_staff = current_user.role in ('admin', 'clinician')
    if not (is_author or is_staff):
        raise HTTPException(status_code=403, detail="Only the author can delete this entry")

    patient_id = entry.patient_id
    db.delete(entry)

    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="bereavement_entry_deleted",
        resource_type="bereavement_entry",
        resource_id=entry_id,
        patient_id=patient_id,
    )
    db.add(audit)
    db.commit()

    return {"message": "Entry deleted"}


# ==================== POST-DEATH SUPPORT SCHEDULE ====================

@router.get("/my-patient")
async def get_my_linked_patient(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the patient linked to this user  --  works for patient, family, and caregiver roles."""
    patient = None

    # If the user IS a patient  --  find their own record by name
    if current_user.role == 'patient':
        patient = db.query(Patient).filter(
            Patient.full_name == current_user.full_name
        ).first()
        if not patient:
            patient = db.query(Patient).filter(
                Patient.patient_code == current_user.username
            ).first()

    is_heir = False
    heir_relationship = None

    # If family user  --  find via PatientFamilyLink or LegacyHeir
    if not patient and current_user.role == 'family':
        link = db.query(PatientFamilyLink).filter(
            PatientFamilyLink.family_user_id == current_user.id
        ).first()
        if link:
            patient = db.query(Patient).filter(Patient.id == link.patient_id).first()

        heir = db.query(LegacyHeir).filter(
            LegacyHeir.heir_user_id == current_user.id,
            LegacyHeir.is_active == True,
        ).first()
        if heir:
            is_heir = True
            heir_relationship = heir.relationship
            if not patient:
                patient = db.query(Patient).filter(Patient.id == heir.patient_id).first()

    # If caregiver  --  find via CaregiverAssignment
    if not patient and current_user.role == 'caregiver':
        assignment = db.query(CaregiverAssignment).filter(
            CaregiverAssignment.caregiver_id == current_user.id,
            CaregiverAssignment.active == True,
        ).first()
        if assignment:
            patient = db.query(Patient).filter(Patient.id == assignment.patient_id).first()

    patient_user_id = None
    if patient:
        patient_user = db.query(User).filter(
            User.role == 'patient',
            User.full_name == patient.full_name,
        ).first()
        if not patient_user:
            patient_user = db.query(User).filter(
                User.role == 'patient',
                User.username == patient.patient_code,
            ).first()
        patient_user_id = patient_user.id if patient_user else None

        if not is_heir:
            heir = db.query(LegacyHeir).filter(
                LegacyHeir.patient_id == patient.id,
                LegacyHeir.heir_user_id == current_user.id,
                LegacyHeir.is_active == True,
            ).first()
            if heir:
                is_heir = True
                heir_relationship = heir.relationship

        return {
            "patient_id": patient.id,
            "patient_name": patient.full_name,
            "primary_diagnosis": patient.primary_diagnosis,
            "status": patient.status,
            "deceased": patient.status == "deceased",
            "deceased_at": patient.deceased_at.isoformat() if patient.deceased_at else None,
            "is_heir": is_heir,
            "heir_relationship": heir_relationship,
            "patient_user_id": patient_user_id,
        }

    # No patient found  --  safe empty response (not 404)
    return {
        "patient_id": None,
        "patient_name": None,
        "primary_diagnosis": None,
        "status": None,
        "deceased": False,
        "deceased_at": None,
        "is_heir": False,
        "heir_relationship": None,
        "patient_user_id": None,
    }


class SchedulePostDeathRequest(BaseModel):
    patient_id: int
    family_user_ids: List[int]


@router.post("/schedule-post-death-support")
async def schedule_post_death_support(
    request: SchedulePostDeathRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule post-death support for bereaved family members."""
    patient_id = request.patient_id
    family_user_ids = request.family_user_ids
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    now = datetime.utcnow()
    
    # Define support schedule
    schedule_items = [
        {
            "days_after": 1,
            "type": "condolences",
            "message": "Condolences and immediate grief resources"
        },
        {
            "days_after": 7,
            "type": "screening_invite",
            "message": "Invitation to complete grief screening"
        },
        {
            "days_after": 30,
            "type": "checkin",
            "message": "One-month check-in and support group invitation"
        },
        {
            "days_after": 90,
            "type": "complicated_grief_assessment",
            "message": "Three-month grief assessment"
        },
        {
            "days_after": 180,
            "type": "long_term_plan",
            "message": "Six-month long-term support planning"
        }
    ]
    
    created_schedules = []
    
    for family_user_id in family_user_ids:
        for item in schedule_items:
            scheduled_date = now + timedelta(days=item["days_after"])
            
            db_schedule = PostDeathSchedule(
                patient_id=patient_id,
                family_user_id=family_user_id,
                scheduled_at=scheduled_date,
                type=item["type"],
                sent=False,
                created_at=now
            )
            
            db.add(db_schedule)
            created_schedules.append({
                "type": item["type"],
                "scheduled_at": scheduled_date.isoformat()
            })
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Post-death support scheduled for {len(family_user_ids)} family member(s)",
        "total_items": len(created_schedules),
        "schedule": created_schedules
    }


@router.get("/post-death-schedule/{patient_id}")
async def get_post_death_schedule(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get post-death support schedule for a patient's family
    Admin/Clinician only
    """
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Admin or clinician access required")
    
    schedules = db.query(PostDeathSchedule).filter(
        PostDeathSchedule.patient_id == patient_id
    ).order_by(PostDeathSchedule.scheduled_at).all()
    
    return {
        "patient_id": patient_id,
        "total_items": len(schedules),
        "schedule": [
            {
                "id": s.id,
                "family_user_id": s.family_user_id,
                "type": s.type,
                "scheduled_at": s.scheduled_at.isoformat(),
                "sent": s.sent,
                "sent_at": s.sent_at.isoformat() if s.sent_at else None
            }
            for s in schedules
        ]
    }
