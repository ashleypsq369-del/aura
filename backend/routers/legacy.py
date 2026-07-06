"""
Legacy & Heir Management Router  --  Project Aura
Digital legacy planning, heir designation, and posthumous content delivery.

LEGAL COMPLIANCE:
- Follows HIPAA (USA healthcare privacy)
- Follows GDPR (EU data protection)
- Supports advance directives
- Requires informed consent
- Allows revocation at any time

FEATURES:
- Patient designates heirs (family, friends, anyone)
- Patient creates legacy content (final messages, notes, audio/video)
- Scheduled or triggered delivery
- Privacy controls (what heirs can access)
- Legal witness/consent tracking
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import (
    get_db, User, Patient,
    LegacyHeir, LegacyContent, LegacyConsent,
    BereavementEntry, AuditLog
)
from routers.auth import get_current_user

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════
# Request/Response Models
# ═══════════════════════════════════════════════════════════════════════

class ConsentRequest(BaseModel):
    patient_id: int
    consent_given: bool
    share_medical_records: bool = False
    share_memories: bool = True
    share_journal: bool = False
    share_messages: bool = False
    share_photos: bool = True
    witnessed_by_user_id: Optional[int] = None


class HeirDesignationRequest(BaseModel):
    patient_id: int
    heir_user_id: int
    relationship: str
    access_level: str = "full"  # full/memories_only/messages_only
    can_access_private: bool = True
    notes_from_patient: Optional[str] = None


class LegacyContentRequest(BaseModel):
    patient_id: int
    content_type: str  # final_message/letter/audio/video/note
    title: str
    content: Optional[str] = None
    recipient_type: str = "all_heirs"  # all_heirs/specific_heir/specific_person
    recipient_heir_id: Optional[int] = None
    recipient_user_id: Optional[int] = None
    delivery_trigger: str = "after_death"  # after_death/specific_date
    delivery_date: Optional[datetime] = None


class HeirResponse(BaseModel):
    id: int
    heir_user_id: int
    heir_name: str
    relationship: str
    access_level: str
    can_access_private: bool
    designated_at: datetime
    activated_at: Optional[datetime]
    is_active: bool
    notes_from_patient: Optional[str]


class LegacyContentResponse(BaseModel):
    id: int
    content_type: str
    title: str
    content: Optional[str]
    media_path: Optional[str]
    recipient_type: str
    recipient_name: Optional[str]
    delivery_trigger: str
    delivery_date: Optional[datetime]
    is_delivered: bool
    delivered_at: Optional[datetime]
    created_at: datetime


# ═══════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════

def is_patient_or_clinician(user: User, patient_id: int, db: Session) -> bool:
    """Check if user is the patient or a clinician/admin"""
    if user.role in ['admin', 'clinician']:
        return True
    
    # Check if user is the patient
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.full_name == user.full_name
    ).first()
    
    return patient is not None


def is_designated_heir(user: User, patient_id: int, db: Session) -> bool:
    """Check if user is a designated heir for this patient"""
    heir = db.query(LegacyHeir).filter(
        LegacyHeir.patient_id == patient_id,
        LegacyHeir.heir_user_id == user.id,
        LegacyHeir.is_active == True
    ).first()
    
    return heir is not None


def activate_heirs_access(patient_id: int, db: Session):
    """Activate all heirs' access when patient dies"""
    heirs = db.query(LegacyHeir).filter(
        LegacyHeir.patient_id == patient_id,
        LegacyHeir.is_active == True,
        LegacyHeir.activated_at == None
    ).all()
    
    for heir in heirs:
        heir.activated_at = datetime.utcnow()
    
    db.commit()


def deliver_legacy_content(patient_id: int, db: Session):
    """Deliver legacy content to heirs after patient's death"""
    content_items = db.query(LegacyContent).filter(
        LegacyContent.patient_id == patient_id,
        LegacyContent.delivery_trigger == 'after_death',
        LegacyContent.is_delivered == False
    ).all()
    
    for item in content_items:
        item.is_delivered = True
        item.delivered_at = datetime.utcnow()
    
    db.commit()
    return len(content_items)


# ═══════════════════════════════════════════════════════════════════════
# CONSENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@router.post("/consent")
async def create_or_update_consent(
    data: ConsentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient gives consent for digital legacy and heir access
    LEGAL: This is an advance directive - requires informed consent
    """
    
    # Only patient or clinician (witness) can create consent
    if not is_patient_or_clinician(current_user, data.patient_id, db):
        raise HTTPException(status_code=403, detail="Only the patient or clinician can manage consent")
    
    # Check if consent already exists
    consent = db.query(LegacyConsent).filter(
        LegacyConsent.patient_id == data.patient_id
    ).first()
    
    if consent:
        # Update existing consent
        consent.consent_given = data.consent_given
        consent.consent_date = datetime.utcnow()
        consent.share_medical_records = data.share_medical_records
        consent.share_memories = data.share_memories
        consent.share_journal = data.share_journal
        consent.share_messages = data.share_messages
        consent.share_photos = data.share_photos
        if data.witnessed_by_user_id:
            consent.witnessed_by_user_id = data.witnessed_by_user_id
        consent.updated_at = datetime.utcnow()
    else:
        # Create new consent
        consent = LegacyConsent(
            patient_id=data.patient_id,
            consent_given=data.consent_given,
            consent_date=datetime.utcnow() if data.consent_given else None,
            witnessed_by_user_id=data.witnessed_by_user_id,
            share_medical_records=data.share_medical_records,
            share_memories=data.share_memories,
            share_journal=data.share_journal,
            share_messages=data.share_messages,
            share_photos=data.share_photos
        )
        db.add(consent)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="legacy_consent_updated",
        resource_type="legacy_consent",
        resource_id=None,
        patient_id=data.patient_id,
        details=f'{{"consent_given": {data.consent_given}, "witnessed": {data.witnessed_by_user_id is not None}}}'
    )
    db.add(audit)
    
    db.commit()
    db.refresh(consent)
    
    return {
        "message": "Consent recorded successfully",
        "consent_given": consent.consent_given,
        "consent_date": consent.consent_date.isoformat() if consent.consent_date else None
    }


@router.get("/consent/{patient_id}")
async def get_consent(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get legacy consent status for a patient"""
    
    # Only patient, clinician, or designated heir can view
    if not (is_patient_or_clinician(current_user, patient_id, db) or 
            is_designated_heir(current_user, patient_id, db)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    consent = db.query(LegacyConsent).filter(
        LegacyConsent.patient_id == patient_id
    ).first()
    
    if not consent:
        return {"consent_given": False, "message": "No consent recorded"}
    
    witness = None
    if consent.witnessed_by_user_id:
        witness_user = db.query(User).filter(User.id == consent.witnessed_by_user_id).first()
        witness = {
            "id": witness_user.id,
            "name": witness_user.full_name,
            "role": witness_user.role
        } if witness_user else None
    
    return {
        "consent_given": consent.consent_given,
        "consent_date": consent.consent_date.isoformat() if consent.consent_date else None,
        "witnessed_by": witness,
        "permissions": {
            "share_medical_records": consent.share_medical_records,
            "share_memories": consent.share_memories,
            "share_journal": consent.share_journal,
            "share_messages": consent.share_messages,
            "share_photos": consent.share_photos
        },
        "can_be_revoked": consent.can_be_revoked,
        "revoked_at": consent.revoked_at.isoformat() if consent.revoked_at else None
    }


@router.put("/consent/{patient_id}/revoke")
async def revoke_consent(
    patient_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient revokes consent for digital legacy
    LEGAL: Patient has right to revoke at any time
    """
    
    # Only patient can revoke
    if not is_patient_or_clinician(current_user, patient_id, db):
        raise HTTPException(status_code=403, detail="Only the patient can revoke consent")
    
    consent = db.query(LegacyConsent).filter(
        LegacyConsent.patient_id == patient_id
    ).first()
    
    if not consent:
        raise HTTPException(status_code=404, detail="No consent found")
    
    if not consent.can_be_revoked:
        raise HTTPException(status_code=400, detail="This consent cannot be revoked")
    
    consent.consent_given = False
    consent.revoked_at = datetime.utcnow()
    consent.revocation_reason = reason
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="legacy_consent_revoked",
        resource_type="legacy_consent",
        resource_id=consent.id,
        patient_id=patient_id,
        details=f'{{"reason": "{reason}"}}'
    )
    db.add(audit)
    
    db.commit()
    
    return {"message": "Consent revoked successfully"}


# ═══════════════════════════════════════════════════════════════════════
# HEIR DESIGNATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@router.post("/heirs")
async def designate_heir(
    data: HeirDesignationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient designates someone as an heir to access their digital legacy
    Anyone in the system can be designated (family, friends, caregivers, etc.)
    """
    
    # Only patient or clinician can designate heirs
    if not is_patient_or_clinician(current_user, data.patient_id, db):
        raise HTTPException(status_code=403, detail="Only the patient can designate heirs")
    
    # Check consent exists
    consent = db.query(LegacyConsent).filter(
        LegacyConsent.patient_id == data.patient_id,
        LegacyConsent.consent_given == True
    ).first()
    
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="Patient must give consent before designating heirs"
        )
    
    # Verify heir user exists
    heir_user = db.query(User).filter(User.id == data.heir_user_id).first()
    if not heir_user:
        raise HTTPException(status_code=404, detail="Heir user not found")
    
    # Check if already designated
    existing = db.query(LegacyHeir).filter(
        LegacyHeir.patient_id == data.patient_id,
        LegacyHeir.heir_user_id == data.heir_user_id
    ).first()
    
    if existing:
        # Update existing designation
        existing.relationship = data.relationship
        existing.access_level = data.access_level
        existing.can_access_private = data.can_access_private
        existing.notes_from_patient = data.notes_from_patient
        existing.is_active = True
        heir = existing
    else:
        # Create new heir designation
        heir = LegacyHeir(
            patient_id=data.patient_id,
            heir_user_id=data.heir_user_id,
            relationship=data.relationship,
            access_level=data.access_level,
            can_access_private=data.can_access_private,
            notes_from_patient=data.notes_from_patient
        )
        db.add(heir)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="legacy_heir_designated",
        resource_type="legacy_heir",
        resource_id=None,
        patient_id=data.patient_id,
        details=f'{{"heir_id": {data.heir_user_id}, "relationship": "{data.relationship}"}}'
    )
    db.add(audit)
    
    db.commit()
    db.refresh(heir)
    
    return {
        "message": f"{heir_user.full_name} designated as heir",
        "heir_id": heir.id,
        "heir_name": heir_user.full_name,
        "relationship": heir.relationship
    }


@router.get("/heirs/{patient_id}")
async def get_heirs(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of designated heirs for a patient"""
    
    # Only patient or clinician can view heirs list
    if not is_patient_or_clinician(current_user, patient_id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    heirs = db.query(LegacyHeir, User.full_name).join(
        User, LegacyHeir.heir_user_id == User.id
    ).filter(
        LegacyHeir.patient_id == patient_id,
        LegacyHeir.is_active == True
    ).all()
    
    result = []
    for heir, heir_name in heirs:
        result.append({
            "id": heir.id,
            "heir_user_id": heir.heir_user_id,
            "heir_name": heir_name,
            "relationship": heir.relationship,
            "access_level": heir.access_level,
            "can_access_private": heir.can_access_private,
            "designated_at": heir.designated_at.isoformat(),
            "activated_at": heir.activated_at.isoformat() if heir.activated_at else None,
            "notes_from_patient": heir.notes_from_patient
        })
    
    return {"heirs": result}


@router.delete("/heirs/{heir_id}")
async def remove_heir(
    heir_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Patient removes an heir designation"""
    
    heir = db.query(LegacyHeir).filter(LegacyHeir.id == heir_id).first()
    if not heir:
        raise HTTPException(status_code=404, detail="Heir not found")
    
    # Only patient or clinician can remove heirs
    if not is_patient_or_clinician(current_user, heir.patient_id, db):
        raise HTTPException(status_code=403, detail="Only the patient can remove heirs")
    
    heir.is_active = False
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="legacy_heir_removed",
        resource_type="legacy_heir",
        resource_id=heir_id,
        patient_id=heir.patient_id
    )
    db.add(audit)
    
    db.commit()
    
    return {"message": "Heir removed successfully"}


# ═══════════════════════════════════════════════════════════════════════
# LEGACY CONTENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@router.post("/content")
async def create_legacy_content(
    data: LegacyContentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient creates legacy content (final messages, notes, letters)
    to be delivered to heirs after death or at specific times
    """
    
    # Only patient can create legacy content
    if not is_patient_or_clinician(current_user, data.patient_id, db):
        raise HTTPException(status_code=403, detail="Only the patient can create legacy content")
    
    # Check consent
    consent = db.query(LegacyConsent).filter(
        LegacyConsent.patient_id == data.patient_id,
        LegacyConsent.consent_given == True
    ).first()
    
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="Patient must give consent before creating legacy content"
        )
    
    content = LegacyContent(
        patient_id=data.patient_id,
        content_type=data.content_type,
        title=data.title,
        content=data.content,
        recipient_type=data.recipient_type,
        recipient_heir_id=data.recipient_heir_id,
        recipient_user_id=data.recipient_user_id,
        delivery_trigger=data.delivery_trigger,
        delivery_date=data.delivery_date
    )
    db.add(content)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="legacy_content_created",
        resource_type="legacy_content",
        resource_id=None,
        patient_id=data.patient_id,
        details=f'{{"content_type": "{data.content_type}", "recipient_type": "{data.recipient_type}"}}'
    )
    db.add(audit)
    
    db.commit()
    db.refresh(content)
    
    return {
        "message": "Legacy content created",
        "content_id": content.id,
        "title": content.title,
        "delivery_trigger": content.delivery_trigger
    }


@router.get("/content/{patient_id}")
async def get_legacy_content(
    patient_id: int,
    include_undelivered: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get legacy content for a patient
    - Patient can see all their own content
    - Heirs can only see delivered content meant for them
    """
    
    is_patient = is_patient_or_clinician(current_user, patient_id, db)
    is_heir = is_designated_heir(current_user, patient_id, db)
    
    if not (is_patient or is_heir):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(LegacyContent).filter(
        LegacyContent.patient_id == patient_id
    )
    
    # Heirs can only see delivered content
    if is_heir and not is_patient:
        query = query.filter(LegacyContent.is_delivered == True)
        # Filter to content for this heir or all heirs
        query = query.filter(
            (LegacyContent.recipient_type == 'all_heirs') |
            (LegacyContent.recipient_user_id == current_user.id)
        )
    
    # Patient can filter undelivered
    if is_patient and not include_undelivered:
        query = query.filter(LegacyContent.is_delivered == False)
    
    content_items = query.order_by(LegacyContent.created_at.desc()).all()
    
    result = []
    for item in content_items:
        recipient_name = None
        if item.recipient_user_id:
            recipient_user = db.query(User).filter(User.id == item.recipient_user_id).first()
            recipient_name = recipient_user.full_name if recipient_user else None
        
        result.append({
            "id": item.id,
            "content_type": item.content_type,
            "title": item.title,
            "content": item.content,
            "media_path": item.media_path,
            "recipient_type": item.recipient_type,
            "recipient_name": recipient_name,
            "delivery_trigger": item.delivery_trigger,
            "delivery_date": item.delivery_date.isoformat() if item.delivery_date else None,
            "is_delivered": item.is_delivered,
            "delivered_at": item.delivered_at.isoformat() if item.delivered_at else None,
            "created_at": item.created_at.isoformat()
        })
    
    return {"content": result}


@router.delete("/content/{content_id}")
async def delete_legacy_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Patient deletes legacy content (only before delivery)"""
    
    content = db.query(LegacyContent).filter(LegacyContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Only patient can delete
    if not is_patient_or_clinician(current_user, content.patient_id, db):
        raise HTTPException(status_code=403, detail="Only the patient can delete legacy content")
    
    if content.is_delivered:
        raise HTTPException(status_code=400, detail="Cannot delete content that has been delivered")
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="legacy_content_deleted",
        resource_type="legacy_content",
        resource_id=content_id,
        patient_id=content.patient_id
    )
    db.add(audit)
    
    db.delete(content)
    db.commit()
    
    return {"message": "Legacy content deleted"}


# ═══════════════════════════════════════════════════════════════════════
# ACTIVATION ENDPOINT (When Patient Dies)
# ═══════════════════════════════════════════════════════════════════════

@router.put("/activate/{patient_id}")
async def activate_legacy(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activate legacy system when patient dies
    - Grants heirs access to designated content
    - Delivers posthumous messages
    - Updates patient status to 'deceased'
    
    Only clinicians/admins can activate
    """
    
    if current_user.role not in ['admin', 'clinician']:
        raise HTTPException(
            status_code=403,
            detail="Only clinicians can activate legacy system"
        )
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update patient status
    patient.status = 'deceased'
    patient.deceased_at = datetime.utcnow()
    
    # Activate heirs' access
    activate_heirs_access(patient_id, db)
    
    # Deliver legacy content
    content_count = deliver_legacy_content(patient_id, db)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role,
        action="legacy_activated",
        resource_type="patient",
        resource_id=patient_id,
        patient_id=patient_id,
        details=f'{{"deceased_at": "{patient.deceased_at.isoformat()}", "content_delivered": {content_count}}}'
    )
    db.add(audit)
    
    db.commit()
    
    return {
        "message": "Legacy system activated",
        "patient_id": patient_id,
        "deceased_at": patient.deceased_at.isoformat(),
        "heirs_activated": True,
        "content_delivered": content_count
    }


# ═══════════════════════════════════════════════════════════════════════
# HEIR ACCESS ENDPOINTS (For Designated Heirs)
# ═══════════════════════════════════════════════════════════════════════

@router.get("/my-legacy-access")
async def get_my_legacy_access(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of patients for whom current user is a designated heir.
    Includes pending designations (before legacy activation) and active access.
    """
    
    heirs = db.query(LegacyHeir, Patient).join(
        Patient, LegacyHeir.patient_id == Patient.id
    ).filter(
        LegacyHeir.heir_user_id == current_user.id,
        LegacyHeir.is_active == True,
    ).all()
    
    result = []
    for heir, patient in heirs:
        consent = db.query(LegacyConsent).filter(
            LegacyConsent.patient_id == patient.id
        ).first()
        
        is_activated = heir.activated_at is not None
        
        result.append({
            "patient_id": patient.id,
            "patient_name": patient.full_name,
            "relationship": heir.relationship,
            "access_level": heir.access_level,
            "can_access_private": heir.can_access_private,
            "designated_at": heir.designated_at.isoformat() if heir.designated_at else None,
            "activated_at": heir.activated_at.isoformat() if heir.activated_at else None,
            "is_activated": is_activated,
            "patient_status": patient.status,
            "deceased_at": patient.deceased_at.isoformat() if patient.deceased_at else None,
            "notes_from_patient": heir.notes_from_patient,
            "permissions": {
                "can_access_memories": consent.share_memories if consent else False,
                "can_access_journal": consent.share_journal if consent else False,
                "can_access_messages": consent.share_messages if consent else False,
                "can_access_photos": consent.share_photos if consent else False
            }
        })
    
    return {"legacy_access": result}
