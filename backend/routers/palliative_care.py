"""
Palliative Care Modules — ACP, MDT Meetings, Referrals, Spiritual Care
Endpoints for the four clinical modules (Tables 31–34).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
import json

from src.db import (
    get_db, User, Patient,
    AdvanceCarePlan, MDTMeeting, Referral, SpiritualCareNote,
)
from routers.auth import get_current_user
from services.journey_tracker import track_assessment
from services.audit_service import log_action

router = APIRouter(tags=["palliative-care"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class ACPCreate(BaseModel):
    patient_id: int
    # Goals
    primary_goal: Optional[str] = None        # comfort/function/cure_directed/unclear
    goals_detail: Optional[str] = None
    patient_understanding: Optional[str] = None
    # Place of death
    preferred_place_of_death: Optional[str] = None
    preferred_place_detail: Optional[str] = None
    # Resuscitation
    dnr_status: Optional[str] = None          # dnr/resuscitate/not_discussed
    cpr_wishes: Optional[str] = None
    mechanical_ventilation: Optional[str] = None
    artificial_nutrition: Optional[str] = None
    dialysis: Optional[str] = None
    hospital_admission: Optional[str] = None
    # Cultural/spiritual
    cultural_considerations: Optional[str] = None
    spiritual_wishes: Optional[str] = None
    language_preference: Optional[str] = None
    family_involvement_wishes: Optional[str] = None
    # Post-death
    organ_donation: Optional[str] = None
    post_death_wishes: Optional[str] = None
    # Legal
    has_lasting_power_of_attorney: bool = False
    attorney_name: Optional[str] = None
    attorney_contact: Optional[str] = None
    has_living_will: bool = False
    # Confirmation
    patient_confirmed: bool = False
    family_witnessed: bool = False
    next_review_date: Optional[datetime] = None
    review_notes: Optional[str] = None


class MDTCreate(BaseModel):
    patient_id: int
    meeting_date: datetime
    meeting_type: Optional[str] = "routine"
    chair_name: Optional[str] = None
    attendees: Optional[List[Dict[str, Any]]] = []
    clinical_summary: Optional[str] = None
    current_concerns: Optional[str] = None
    goals_of_care_discussed: bool = False
    acp_reviewed: bool = False
    care_plan_changes: Optional[str] = None
    medication_decisions: Optional[str] = None
    referrals_made: Optional[List[str]] = []
    action_items: Optional[List[Dict[str, Any]]] = []
    next_meeting_date: Optional[datetime] = None
    family_present: bool = False
    family_feedback: Optional[str] = None
    meeting_notes: Optional[str] = None


class ReferralCreate(BaseModel):
    patient_id: int
    referral_type: str
    referral_reason: str
    urgency: str = "routine"
    priority: Optional[str] = "medium"
    clinical_goals: Optional[str] = None
    specific_concerns: Optional[str] = None
    referred_to_name: Optional[str] = None
    referred_to_team: Optional[str] = None
    referred_to_contact: Optional[str] = None


class ReferralUpdate(BaseModel):
    status: str
    outcome_notes: Optional[str] = None
    follow_up_needed: bool = False
    follow_up_date: Optional[datetime] = None


class SpiritualCareCreate(BaseModel):
    patient_id: int
    visit_date: datetime
    faith_tradition: Optional[str] = None
    faith_tradition_detail: Optional[str] = None
    specific_denomination: Optional[str] = None
    care_provider_type: Optional[str] = None
    care_provider_name: Optional[str] = None
    visit_type: Optional[str] = None
    visit_duration_minutes: Optional[int] = None
    spiritual_distress_level: Optional[int] = None
    spiritual_needs: Optional[str] = None       # JSON list
    family_present: bool = False
    interventions_provided: Optional[str] = None
    sacred_items_needed: Optional[str] = None
    referral_to_community_leader: bool = False
    community_leader_name: Optional[str] = None
    patient_response: Optional[str] = None
    comfort_level_after: Optional[int] = None
    meaning_making_supported: bool = False
    reconciliation_facilitated: bool = False
    unresolved_concerns: Optional[str] = None
    patient_wishes_expressed: Optional[str] = None
    follow_up_needed: bool = False
    follow_up_date: Optional[datetime] = None
    confidential: bool = True
    notes: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────

def _require_patient(db: Session, patient_id: int) -> Patient:
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p


# ─────────────────────────────────────────────────────────────────────────────
# ACP — Advance Care Planning
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/acp")
def create_or_update_acp(
    data: ACPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or update the Advance Care Plan for a patient (upsert)."""
    _require_patient(db, data.patient_id)

    existing = (
        db.query(AdvanceCarePlan)
        .filter(AdvanceCarePlan.patient_id == data.patient_id)
        .filter(AdvanceCarePlan.is_current == True)
        .order_by(desc(AdvanceCarePlan.created_at))
        .first()
    )

    payload = data.dict(exclude={"patient_id"})

    if existing:
        for field, value in payload.items():
            if hasattr(existing, field):
                setattr(existing, field, value)
        existing.updated_at = datetime.utcnow()
        existing.is_current = True
        db.commit()
        db.refresh(existing)
        record = existing
        action = "updated"
    else:
        record = AdvanceCarePlan(
            patient_id=data.patient_id,
            created_by=current_user.id,
            is_current=True,
            **{k: v for k, v in payload.items() if hasattr(AdvanceCarePlan, k)},
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        action = "created"

    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="Advance Care Plan",
        notes=f"ACP {action} — Goal: {data.primary_goal or 'not set'}, DNR: {data.dnr_status or 'not set'}",
        created_by=current_user.id,
    )
    log_action(
        db=db,
        user_id=current_user.id,
        action=f"acp_{action}",
        resource_type="advance_care_plan",
        resource_id=record.id,
        details=f"ACP {action} for patient {data.patient_id}",
    )
    return {"success": True, "id": record.id}


@router.get("/acp/{patient_id}")
def get_acp(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current ACP for a patient."""
    _require_patient(db, patient_id)
    record = (
        db.query(AdvanceCarePlan)
        .filter(AdvanceCarePlan.patient_id == patient_id)
        .order_by(desc(AdvanceCarePlan.created_at))
        .first()
    )
    if not record:
        return None

    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "primary_goal": record.primary_goal,
        "goals_detail": record.goals_detail,
        "patient_understanding": record.patient_understanding,
        "preferred_place_of_death": record.preferred_place_of_death,
        "preferred_place_detail": record.preferred_place_detail,
        "dnr_status": record.dnr_status,
        "cpr_wishes": record.cpr_wishes,
        "mechanical_ventilation": record.mechanical_ventilation,
        "artificial_nutrition": record.artificial_nutrition,
        "dialysis": record.dialysis,
        "hospital_admission": record.hospital_admission,
        "cultural_considerations": record.cultural_considerations,
        "spiritual_wishes": record.spiritual_wishes,
        "language_preference": record.language_preference,
        "family_involvement_wishes": record.family_involvement_wishes,
        "organ_donation": record.organ_donation,
        "post_death_wishes": record.post_death_wishes,
        "has_lasting_power_of_attorney": record.has_lasting_power_of_attorney,
        "attorney_name": record.attorney_name,
        "attorney_contact": record.attorney_contact,
        "has_living_will": record.has_living_will,
        "patient_confirmed": record.patient_confirmed,
        "family_witnessed": record.family_witnessed,
        "next_review_date": record.next_review_date.isoformat() if record.next_review_date else None,
        "review_notes": record.review_notes,
        "created_at": record.created_at.isoformat(),
        "updated_at": record.updated_at.isoformat() if record.updated_at else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# MDT Meetings
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/mdt")
def create_mdt(
    data: MDTCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_patient(db, data.patient_id)

    record = MDTMeeting(
        patient_id=data.patient_id,
        created_by=current_user.id,
        meeting_date=data.meeting_date,
        meeting_type=data.meeting_type,
        chair_name=data.chair_name,
        attendees=json.dumps(data.attendees or []),
        clinical_summary=data.clinical_summary,
        current_concerns=data.current_concerns,
        goals_of_care_discussed=data.goals_of_care_discussed,
        acp_reviewed=data.acp_reviewed,
        care_plan_changes=data.care_plan_changes,
        medication_decisions=data.medication_decisions,
        referrals_made=json.dumps(data.referrals_made or []),
        action_items=json.dumps(data.action_items or []),
        next_meeting_date=data.next_meeting_date,
        family_present=data.family_present,
        family_feedback=data.family_feedback,
        meeting_notes=data.meeting_notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="MDT Meeting",
        notes=f"Type: {data.meeting_type}, Attendees: {len(data.attendees or [])}",
        created_by=current_user.id,
    )
    log_action(
        db=db,
        user_id=current_user.id,
        action="mdt_created",
        resource_type="mdt_meeting",
        resource_id=record.id,
        details=f"MDT meeting ({data.meeting_type}) created for patient {data.patient_id}",
    )
    return {"success": True, "id": record.id}


@router.get("/mdt/{patient_id}")
def list_mdt(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_patient(db, patient_id)
    meetings = (
        db.query(MDTMeeting)
        .filter(MDTMeeting.patient_id == patient_id)
        .order_by(desc(MDTMeeting.meeting_date))
        .all()
    )
    return [
        {
            "id": m.id,
            "meeting_date": m.meeting_date.isoformat(),
            "meeting_type": m.meeting_type,
            "chair_name": m.chair_name,
            "attendees": json.loads(m.attendees or "[]"),
            "clinical_summary": m.clinical_summary,
            "current_concerns": m.current_concerns,
            "goals_of_care_discussed": m.goals_of_care_discussed,
            "acp_reviewed": m.acp_reviewed,
            "care_plan_changes": m.care_plan_changes,
            "medication_decisions": m.medication_decisions,
            "referrals_made": json.loads(m.referrals_made or "[]"),
            "action_items": json.loads(m.action_items or "[]"),
            "next_meeting_date": m.next_meeting_date.isoformat() if m.next_meeting_date else None,
            "family_present": m.family_present,
            "family_feedback": m.family_feedback,
            "meeting_notes": m.meeting_notes,
            "created_at": m.created_at.isoformat(),
        }
        for m in meetings
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Referrals
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/referrals")
def create_referral(
    data: ReferralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_patient(db, data.patient_id)

    record = Referral(
        patient_id=data.patient_id,
        referred_by=current_user.id,
        referral_type=data.referral_type,
        referral_reason=data.referral_reason,
        urgency=data.urgency,
        priority=data.priority,
        clinical_goals=data.clinical_goals,
        specific_concerns=data.specific_concerns,
        referred_to_name=data.referred_to_name,
        referred_to_team=data.referred_to_team,
        referred_to_contact=data.referred_to_contact,
        status="pending",
        comfort_focused=True,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="Referral",
        notes=f"{data.referral_type} referral ({data.urgency}) — {data.referral_reason[:80] if data.referral_reason else ''}",
        created_by=current_user.id,
    )
    log_action(
        db=db,
        user_id=current_user.id,
        action="referral_created",
        resource_type="referral",
        resource_id=record.id,
        details=f"Referral ({data.referral_type}) for patient {data.patient_id}",
    )
    return {"success": True, "id": record.id}


@router.get("/referrals/{patient_id}")
def list_referrals(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_patient(db, patient_id)
    referrals = (
        db.query(Referral)
        .filter(Referral.patient_id == patient_id)
        .order_by(desc(Referral.created_at))
        .all()
    )
    return [
        {
            "id": r.id,
            "referral_type": r.referral_type,
            "referral_reason": r.referral_reason,
            "urgency": r.urgency,
            "priority": r.priority,
            "clinical_goals": r.clinical_goals,
            "specific_concerns": r.specific_concerns,
            "referred_to_name": r.referred_to_name,
            "referred_to_team": r.referred_to_team,
            "referred_to_contact": r.referred_to_contact,
            "status": r.status,
            "outcome_notes": r.outcome_notes,
            "follow_up_needed": r.follow_up_needed,
            "follow_up_date": r.follow_up_date.isoformat() if r.follow_up_date else None,
            "accepted_at": r.accepted_at.isoformat() if r.accepted_at else None,
            "first_seen_at": r.first_seen_at.isoformat() if r.first_seen_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "comfort_focused": r.comfort_focused,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in referrals
    ]


@router.put("/referrals/{referral_id}")
def update_referral(
    referral_id: int,
    data: ReferralUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(Referral).filter(Referral.id == referral_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Referral not found")

    record.status = data.status
    record.outcome_notes = data.outcome_notes
    record.follow_up_needed = data.follow_up_needed
    record.follow_up_date = data.follow_up_date
    record.updated_at = datetime.utcnow()

    if data.status == "accepted" and not record.accepted_at:
        record.accepted_at = datetime.utcnow()
    elif data.status == "in_progress" and not record.first_seen_at:
        record.first_seen_at = datetime.utcnow()
    elif data.status == "completed" and not record.completed_at:
        record.completed_at = datetime.utcnow()

    db.commit()
    log_action(
        db=db,
        user_id=current_user.id,
        action="referral_updated",
        resource_type="referral",
        resource_id=referral_id,
        details=f"Referral {referral_id} status → {data.status}",
    )
    return {"success": True}


# ─────────────────────────────────────────────────────────────────────────────
# Spiritual Care Notes (inclusive of all faiths)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/chaplain")
def create_spiritual_care_note(
    data: SpiritualCareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_patient(db, data.patient_id)

    record = SpiritualCareNote(
        patient_id=data.patient_id,
        care_provider_id=current_user.id,
        visit_date=data.visit_date,
        faith_tradition=data.faith_tradition,
        faith_tradition_detail=data.faith_tradition_detail,
        specific_denomination=data.specific_denomination,
        spiritual_distress_level=data.spiritual_distress_level,
        spiritual_needs=data.spiritual_needs,
        visit_type=data.visit_type,
        visit_duration_minutes=data.visit_duration_minutes,
        family_present=data.family_present,
        care_provider_type=data.care_provider_type,
        care_provider_name=data.care_provider_name,
        interventions_provided=data.interventions_provided,
        sacred_items_needed=data.sacred_items_needed,
        referral_to_community_leader=data.referral_to_community_leader,
        community_leader_name=data.community_leader_name,
        patient_response=data.patient_response,
        comfort_level_after=data.comfort_level_after,
        meaning_making_supported=data.meaning_making_supported,
        reconciliation_facilitated=data.reconciliation_facilitated,
        unresolved_concerns=data.unresolved_concerns,
        patient_wishes_expressed=data.patient_wishes_expressed,
        follow_up_needed=data.follow_up_needed,
        follow_up_date=data.follow_up_date,
        confidential=data.confidential,
        notes=data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    track_assessment(
        db=db,
        patient_id=data.patient_id,
        assessment_type="Spiritual Care Visit",
        score=data.spiritual_distress_level,
        notes=f"Visit: {data.visit_type or 'unspecified'} | Tradition: {data.faith_tradition or 'not stated'}",
        created_by=current_user.id,
    )
    log_action(
        db=db,
        user_id=current_user.id,
        action="spiritual_care_note_created",
        resource_type="spiritual_care_note",
        resource_id=record.id,
        details=f"Spiritual care note ({data.visit_type}) for patient {data.patient_id}",
    )
    return {"success": True, "id": record.id}


@router.get("/chaplain/{patient_id}")
def list_spiritual_care_notes(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_patient(db, patient_id)
    notes = (
        db.query(SpiritualCareNote)
        .filter(SpiritualCareNote.patient_id == patient_id)
        .order_by(desc(SpiritualCareNote.visit_date))
        .all()
    )
    return [
        {
            "id": n.id,
            "visit_date": n.visit_date.isoformat(),
            "faith_tradition": n.faith_tradition,
            "faith_tradition_detail": n.faith_tradition_detail,
            "specific_denomination": n.specific_denomination,
            "visit_type": n.visit_type,
            "visit_duration_minutes": n.visit_duration_minutes,
            "care_provider_type": n.care_provider_type,
            "care_provider_name": n.care_provider_name,
            "spiritual_distress_level": n.spiritual_distress_level,
            "spiritual_needs": n.spiritual_needs,
            "family_present": n.family_present,
            "interventions_provided": n.interventions_provided,
            "sacred_items_needed": n.sacred_items_needed,
            "referral_to_community_leader": n.referral_to_community_leader,
            "community_leader_name": n.community_leader_name,
            "patient_response": n.patient_response,
            "comfort_level_after": n.comfort_level_after,
            "meaning_making_supported": n.meaning_making_supported,
            "reconciliation_facilitated": n.reconciliation_facilitated,
            "unresolved_concerns": n.unresolved_concerns if not n.confidential else None,
            "patient_wishes_expressed": n.patient_wishes_expressed if not n.confidential else None,
            "follow_up_needed": n.follow_up_needed,
            "follow_up_date": n.follow_up_date.isoformat() if n.follow_up_date else None,
            "confidential": n.confidential,
            "notes": n.notes,
            "created_at": n.created_at.isoformat(),
        }
        for n in notes
    ]
