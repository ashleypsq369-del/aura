"""
Messaging Router  --  Project Aura
Real-time messaging system for patient-physician communication,
alert notifications, and user-to-user messaging.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime

from src.db import (
    get_db, User, Patient, Alert,
    Conversation, ConversationParticipant, Message, MessageRead, MessageReaction,
    get_or_create_conversation, get_user_conversations, get_conversation_messages,
    send_message, mark_conversation_read, get_unread_message_count, AuditLog
)
from routers.auth import get_current_user
from services.notification_service import create_message_notification

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════
# Request/Response Models
# ═══════════════════════════════════════════════════════════════════════

class StartConversationRequest(BaseModel):
    recipient_id: Optional[int] = None
    initial_message: Optional[str] = None
    conversation_type: str = "private"  # private/support/group
    patient_id: Optional[int] = None  # For support conversations
    community_group_id: Optional[int] = None  # For group conversations
    participant_ids: Optional[List[int]] = None  # For group conversations


class SendMessageRequest(BaseModel):
    content: str
    message_type: str = "text"  # text/alert/system
    priority: str = "normal"  # normal/high/urgent
    alert_id: Optional[int] = None


class ConversationResponse(BaseModel):
    id: int
    type: str
    title: Optional[str]
    participants: List[dict]
    last_message: Optional[dict]
    unread_count: int
    updated_at: str
    patient_id: Optional[int]
    alert_id: Optional[int]


class MessageResponse(BaseModel):
    id: int
    content: str
    sender: dict
    message_type: str
    priority: str
    is_edited: bool
    created_at: str
    alert_id: Optional[int]


class AlertMessageRequest(BaseModel):
    alert_id: int
    recipient_ids: List[int]
    message: str
    priority: str = "urgent"


# ═══════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════

@router.get("/conversations")
async def get_my_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for the current user"""
    try:
        conversations = get_user_conversations(db, current_user.id)
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")


@router.post("/conversations/start")
async def start_conversation(
    request: StartConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new conversation (private, support, or group)."""
    try:
        # Handle group conversations
        if request.conversation_type == "group":
            if not request.participant_ids or len(request.participant_ids) < 2:
                raise HTTPException(status_code=400, detail="Group conversations require at least 2 participants")
            
            # Create group conversation
            conversation = Conversation(
                conversation_type="group",
                created_by=current_user.id,
                last_message_at=datetime.utcnow(),
                title=request.initial_message or "Group Chat"  # Use initial message as title or default
            )
            
            # Link to community group if provided
            if request.community_group_id:
                from src.db import CommunityGroup
                group = db.query(CommunityGroup).filter(CommunityGroup.id == request.community_group_id).first()
                if group:
                    conversation.title = f"{group.name} - Group Chat"
            
            db.add(conversation)
            db.flush()
            
            # Add creator as participant
            creator_participant = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=current_user.id,
                role="admin"
            )
            db.add(creator_participant)
            
            # Add other participants
            for participant_id in request.participant_ids:
                if participant_id != current_user.id:  # Don't add creator twice
                    participant = ConversationParticipant(
                        conversation_id=conversation.id,
                        user_id=participant_id,
                        role="participant"
                    )
                    db.add(participant)
            
            db.commit()
            db.refresh(conversation)
            
            # Send welcome message if provided
            if request.initial_message and request.initial_message != conversation.title:
                send_message(db, conversation.id, current_user.id, request.initial_message, "system")
            
            return {
                "conversation_id": conversation.id,
                "message": "Group conversation started successfully",
                "type": "group"
            }
        
        # Handle private/support conversations
        if not request.recipient_id:
            raise HTTPException(status_code=400, detail="Recipient required for private conversations")
            
        # Verify recipient exists
        recipient = db.query(User).filter(User.id == request.recipient_id).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # For support conversations, verify access to patient
        if request.conversation_type == "support" and request.patient_id:
            patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            
            # Check if user has access (clinician/caregiver/family)
            if current_user.role not in ['admin', 'clinician', 'caregiver', 'family', 'patient']:
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Get or create conversation
        conversation = get_or_create_conversation(
            db, current_user.id, request.recipient_id, request.conversation_type
        )
        
        # If support conversation, link to patient
        if request.conversation_type == "support" and request.patient_id:
            conversation.patient_id = request.patient_id
            db.commit()
        
        # Send initial message if provided
        if request.initial_message:
            send_message(db, conversation.id, current_user.id, request.initial_message)
            
            # Notify recipient about new message
            try:
                create_message_notification(
                    db=db,
                    recipient_id=request.recipient_id,
                    sender_name=current_user.full_name,
                    message_preview=request.initial_message,
                    conversation_id=conversation.id
                )
            except Exception as notif_error:
                print(f"Failed to create notification: {str(notif_error)}")
        
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_role=current_user.role,
            action="conversation_started",
            resource_type="conversation",
            resource_id=conversation.id,
            details=f'{{"recipient_id": {request.recipient_id}, "type": "{request.conversation_type}"}}'
        )
        db.add(audit)
        db.commit()
        
        return {
            "conversation_id": conversation.id,
            "message": "Conversation started successfully",
            "type": request.conversation_type
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start conversation: {str(e)}")


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a conversation"""
    try:
        # Verify user is participant
        participant = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
            ConversationParticipant.is_active == True
        ).first()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Not a participant in this conversation")
        
        # Get messages
        messages = get_conversation_messages(db, conversation_id, limit, offset)
        
        # Mark conversation as read
        mark_conversation_read(db, conversation_id, current_user.id)
        
        return {"messages": messages}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")


@router.post("/conversations/{conversation_id}/messages")
async def send_message_endpoint(
    conversation_id: int,
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in a conversation"""
    try:
        # Verify user is participant
        participant = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
            ConversationParticipant.is_active == True
        ).first()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Not a participant in this conversation")
        
        # Send message
        message = send_message(
            db, conversation_id, current_user.id, request.content,
            request.message_type, request.priority, request.alert_id
        )
        
        # Get all other participants to notify
        other_participants = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id != current_user.id,
            ConversationParticipant.is_active == True
        ).all()
        
        # Create notification for each recipient
        for other_participant in other_participants:
            try:
                create_message_notification(
                    db=db,
                    recipient_id=other_participant.user_id,
                    sender_name=current_user.full_name,
                    message_preview=request.content,
                    conversation_id=conversation_id
                )
            except Exception as notif_error:
                # Log but don't fail message send if notification fails
                print(f"Failed to create notification for user {other_participant.user_id}: {str(notif_error)}")
        
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_role=current_user.role,
            action="message_sent",
            resource_type="message",
            resource_id=message.id,
            details=f'{{"conversation_id": {conversation_id}, "type": "{request.message_type}"}}'
        )
        db.add(audit)
        db.commit()

        # Push real-time message notification via WebSocket
        try:
            from routers.websocket import manager as ws_manager
            import asyncio
            msg_payload = {
                "conversation_id": conversation_id,
                "message": {
                    "id": message.id,
                    "content": request.content,
                    "sender_id": current_user.id,
                    "sender_name": current_user.full_name,
                    "created_at": message.created_at.isoformat(),
                    "message_type": request.message_type,
                }
            }
            for p in other_participants:
                asyncio.create_task(
                    ws_manager.send_to_user(p.user_id, "new_message", msg_payload)
                )
        except Exception:
            pass  # WS push is best-effort - don't fail the HTTP response

        return {
            "message_id": message.id,
            "created_at": message.created_at.isoformat(),
            "message": "Message sent successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.put("/conversations/{conversation_id}/read")
async def mark_as_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all messages in a conversation as read"""
    try:
        # Verify user is participant
        participant = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id
        ).first()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Not a participant in this conversation")
        
        mark_conversation_read(db, conversation_id, current_user.id)
        
        return {"message": "Conversation marked as read"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark as read: {str(e)}")


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total unread message count"""
    try:
        count = get_unread_message_count(db, current_user.id)
        return {"unread_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")


@router.post("/alert-message")
async def send_alert_message(
    request: AlertMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send alert notification message to multiple recipients
    Creates/updates conversations and sends urgent messages
    """
    try:
        # Verify alert exists
        alert = db.query(Alert).filter(Alert.id == request.alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Verify sender has access (clinician/admin only)
        if current_user.role not in ['admin', 'clinician']:
            raise HTTPException(status_code=403, detail="Only clinicians can send alert messages")
        
        sent_messages = []
        
        for recipient_id in request.recipient_ids:
            # Verify recipient exists
            recipient = db.query(User).filter(User.id == recipient_id).first()
            if not recipient:
                continue
            
            # Get or create conversation
            conversation = get_or_create_conversation(db, current_user.id, recipient_id, 'support')
            conversation.patient_id = alert.patient_id
            conversation.alert_id = request.alert_id
            db.commit()
            
            # Send urgent message
            message = send_message(
                db, conversation.id, current_user.id,
                f"🚨 ALERT: {request.message}",
                message_type='alert',
                priority=request.priority,
                alert_id=request.alert_id
            )
            
            sent_messages.append({
                'recipient_id': recipient_id,
                'message_id': message.id,
                'conversation_id': conversation.id
            })
        
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_role=current_user.role,
            action="alert_message_sent",
            resource_type="alert",
            resource_id=request.alert_id,
            patient_id=alert.patient_id,
            details=f'{{"recipient_count": {len(sent_messages)}}}'
        )
        db.add(audit)
        db.commit()
        
        return {
            "sent_count": len(sent_messages),
            "messages": sent_messages,
            "message": f"Alert sent to {len(sent_messages)} recipient(s)"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send alert message: {str(e)}")


@router.get("/my-care-team")
async def get_my_care_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the assigned care team for the current user.
    - Patient  → their primary clinician + assigned caregivers
    - Family   → linked patient's clinician + caregivers
    - Caregiver → clinicians overseeing their patients
    - Clinician → their assigned patients
    Each entry includes a ready-to-message flag and existing conversation_id if one exists.
    """
    from src.db import PatientPreferences, PatientFamilyLink, CaregiverAssignment

    care_team = []

    def _conv_id(user_a: int, user_b: int):
        """Return existing conversation id between two users, or None."""
        row = (
            db.query(Conversation.id)
            .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
            .filter(
                ConversationParticipant.user_id == user_a,
                Conversation.conversation_type == "private"
            )
            .filter(
                db.query(ConversationParticipant.conversation_id)
                .filter(
                    ConversationParticipant.conversation_id == Conversation.id,
                    ConversationParticipant.user_id == user_b
                )
                .correlate(Conversation)
                .exists()
            )
            .first()
        )
        return row[0] if row else None

    def _user_entry(u: User, relation: str, conv_id=None):
        initials = "".join(p[0].upper() for p in (u.full_name or u.username or "?").split()[:2])
        return {
            "user_id": u.id,
            "name": u.full_name or u.username,
            "role": u.role,
            "relation": relation,          # e.g. "Primary Clinician", "Caregiver", "Patient"
            "phone": u.phone,
            "is_online": False,            # extend later with last_seen
            "avatar_initials": initials,
            "existing_conversation_id": conv_id or _conv_id(current_user.id, u.id),
        }

    try:
        if current_user.role == "patient":
            # Find patient record
            prefs = db.query(PatientPreferences).filter(
                PatientPreferences.user_id == current_user.id
            ).first()
            patient = None
            if prefs and prefs.patient_id:
                from src.db import Patient as PatientModel
                patient = db.query(PatientModel).filter(PatientModel.id == prefs.patient_id).first()
            if not patient:
                from src.db import Patient as PatientModel
                patient = db.query(PatientModel).filter(
                    PatientModel.full_name == current_user.full_name
                ).first()

            if patient:
                # Primary clinician
                if patient.primary_clinician_id:
                    clinician = db.query(User).filter(User.id == patient.primary_clinician_id).first()
                    if clinician:
                        care_team.append(_user_entry(clinician, "Primary Clinician"))

                # Assigned caregivers
                assignments = db.query(CaregiverAssignment).filter(
                    CaregiverAssignment.patient_id == patient.id,
                    CaregiverAssignment.active == True
                ).all()
                for a in assignments:
                    cg = db.query(User).filter(User.id == a.caregiver_id).first()
                    if cg and cg.id != (patient.primary_clinician_id or -1):
                        care_team.append(_user_entry(cg, "Caregiver"))

            # Fallback: any active clinician if no assignment
            if not care_team:
                fallback = db.query(User).filter(
                    User.role.in_(["clinician", "admin"]),
                    User.is_active == True
                ).order_by(User.id.asc()).limit(3).all()
                for u in fallback:
                    care_team.append(_user_entry(u, "Clinician"))

        elif current_user.role == "family":
            link = db.query(PatientFamilyLink).filter(
                PatientFamilyLink.family_user_id == current_user.id
            ).first()
            if link:
                from src.db import Patient as PatientModel
                patient = db.query(PatientModel).filter(PatientModel.id == link.patient_id).first()
                if patient:
                    if patient.primary_clinician_id:
                        clinician = db.query(User).filter(User.id == patient.primary_clinician_id).first()
                        if clinician:
                            care_team.append(_user_entry(clinician, "Patient's Clinician"))
                    assignments = db.query(CaregiverAssignment).filter(
                        CaregiverAssignment.patient_id == patient.id,
                        CaregiverAssignment.active == True
                    ).all()
                    for a in assignments:
                        cg = db.query(User).filter(User.id == a.caregiver_id).first()
                        if cg:
                            care_team.append(_user_entry(cg, "Patient's Caregiver"))
                    # Also add the patient themselves
                    patient_user = db.query(User).filter(User.full_name == patient.full_name).first()
                    if patient_user and patient_user.id != current_user.id:
                        care_team.append(_user_entry(patient_user, "Patient"))

        elif current_user.role == "caregiver":
            # Get patients they're assigned to and those patients' clinicians
            assignments = db.query(CaregiverAssignment).filter(
                CaregiverAssignment.caregiver_id == current_user.id,
                CaregiverAssignment.active == True
            ).all()
            seen = set()
            for a in assignments:
                from src.db import Patient as PatientModel
                patient = db.query(PatientModel).filter(PatientModel.id == a.patient_id).first()
                if patient and patient.primary_clinician_id and patient.primary_clinician_id not in seen:
                    clinician = db.query(User).filter(User.id == patient.primary_clinician_id).first()
                    if clinician:
                        seen.add(clinician.id)
                        care_team.append(_user_entry(clinician, "Supervising Clinician"))

        elif current_user.role in ("clinician", "admin"):
            # Clinicians see their active patients
            from src.db import Patient as PatientModel
            patients = db.query(PatientModel).filter(
                PatientModel.primary_clinician_id == current_user.id,
                PatientModel.status == "active"
            ).limit(20).all()
            for p in patients:
                patient_user = db.query(User).filter(User.full_name == p.full_name).first()
                if patient_user:
                    care_team.append(_user_entry(patient_user, "Patient"))

        return {"care_team": care_team, "count": len(care_team)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch care team: {str(e)}")


@router.get("/physicians")
async def get_available_physicians(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users available for messaging based on role"""
    try:
        # Different logic based on user role
        if current_user.role == 'patient':
            # Patients can message: their clinician, caregivers, and family members
            users = db.query(User).filter(
                User.role.in_(['clinician', 'admin', 'caregiver', 'family']),
                User.is_active == True,
                User.id != current_user.id
            ).all()
            
        elif current_user.role in ['clinician', 'admin']:
            # Clinicians can message: patients, other clinicians, caregivers, family
            users = db.query(User).filter(
                User.is_active == True,
                User.id != current_user.id
            ).all()
            
        elif current_user.role == 'family':
            # Family can message: clinicians, caregivers, other family, and their linked patient
            users = db.query(User).filter(
                User.role.in_(['clinician', 'admin', 'caregiver', 'family', 'patient']),
                User.is_active == True,
                User.id != current_user.id
            ).all()
            
        elif current_user.role == 'caregiver':
            # Caregivers can message: clinicians, their assigned patients, family, other caregivers
            users = db.query(User).filter(
                User.is_active == True,
                User.id != current_user.id
            ).all()
            
        else:
            # Default: can message clinicians and admins
            users = db.query(User).filter(
                User.role.in_(['clinician', 'admin']),
                User.is_active == True,
                User.id != current_user.id
            ).all()
        
        result = []
        for user in users:
            # Get unread count for this user (if any conversation exists)
            conversation = db.query(Conversation).join(ConversationParticipant).filter(
                ConversationParticipant.user_id.in_([current_user.id, user.id])
            ).first()
            
            unread_count = 0
            if conversation:
                participant = db.query(ConversationParticipant).filter(
                    ConversationParticipant.conversation_id == conversation.id,
                    ConversationParticipant.user_id == current_user.id
                ).first()
                
                if participant and participant.last_read_at:
                    unread_count = db.query(Message).filter(
                        Message.conversation_id == conversation.id,
                        Message.created_at > participant.last_read_at,
                        Message.sender_id == user.id,
                        Message.is_deleted == False
                    ).count()
            
            result.append({
                'id': user.id,
                'name': user.full_name,
                'role': user.role,
                'username': user.username,
                'unread_count': unread_count
            })
        
        return {"physicians": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.get("/patients")
async def get_my_patients_for_messaging(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of patients for physician messaging"""
    try:
        # Only physicians/caregivers can access
        if current_user.role not in ['clinician', 'admin', 'caregiver']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if current_user.role == 'clinician':
            # Get patients assigned to this clinician
            patients = db.query(Patient).filter(
                Patient.primary_clinician_id == current_user.id,
                Patient.status == 'active'
            ).all()
        elif current_user.role == 'caregiver':
            # Caregivers only see their assigned patients
            from src.db import CaregiverAssignment
            from services.access_control import get_accessible_patient_ids
            allowed_ids = get_accessible_patient_ids(current_user, db) or []
            patients = db.query(Patient).filter(
                Patient.id.in_(allowed_ids),
                Patient.status == 'active'
            ).all()
        else:
            # Admin sees all active patients
            patients = db.query(Patient).filter(Patient.status == 'active').all()
        
        result = []
        for patient in patients:
            # Find patient's user account if exists
            patient_user = db.query(User).filter(
                User.role == 'patient',
                User.full_name == patient.full_name
            ).first()
            
            result.append({
                'patient_id': patient.id,
                'user_id': patient_user.id if patient_user else None,
                'name': patient.full_name,
                'patient_code': patient.patient_code,
                'diagnosis': patient.primary_diagnosis,
                'risk_level': patient.risk_level
            })
        
        return {"patients": result}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch patients: {str(e)}")


@router.get("/patient-user/{patient_id}")
async def get_patient_user_id(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Given a patient record ID, return the linked User account ID.
    Used by clinicians to start a direct message to a patient.
    Only accessible by clinicians, caregivers, and admins.
    """
    if current_user.role not in ("admin", "clinician", "caregiver"):
        raise HTTPException(status_code=403, detail="Access denied")

    from src.db import Patient as PatientModel, PatientPreferences
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # First try: PatientPreferences links a user_id to a patient_id
    prefs = db.query(PatientPreferences).filter(
        PatientPreferences.patient_id == patient_id
    ).first()
    if prefs and prefs.user_id:
        user = db.query(User).filter(User.id == prefs.user_id).first()
        if user:
            return {
                "patient_id": patient_id,
                "user_id": user.id,
                "name": user.full_name or user.username,
                "found": True,
            }

    # Fallback: match by full_name
    user = db.query(User).filter(
        User.full_name == patient.full_name,
        User.role == "patient",
        User.is_active == True,
    ).first()
    if user:
        return {
            "patient_id": patient_id,
            "user_id": user.id,
            "name": user.full_name,
            "found": True,
        }

    return {"patient_id": patient_id, "user_id": None, "found": False}


@router.get("/community-groups")
async def get_community_groups_for_messaging(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get community groups user is a member of, for group messaging"""
    try:
        from src.db import CommunityGroup, CommunityMembership
        
        # Get groups user is a member of
        memberships = db.query(CommunityMembership).filter(
            CommunityMembership.user_id == current_user.id,
            CommunityMembership.is_active == True
        ).all()
        
        result = []
        for membership in memberships:
            group = db.query(CommunityGroup).filter(
                CommunityGroup.id == membership.group_id,
                CommunityGroup.is_active == True
            ).first()
            
            if group:
                # Check if group already has a conversation
                existing_conversation = db.query(Conversation).filter(
                    Conversation.conversation_type == 'group',
                    Conversation.title.like(f"%{group.name}%")
                ).join(ConversationParticipant).filter(
                    ConversationParticipant.user_id == current_user.id,
                    ConversationParticipant.is_active == True
                ).first()
                
                result.append({
                    'group_id': group.id,
                    'name': group.name,
                    'description': group.description,
                    'member_count': group.member_count,
                    'has_conversation': existing_conversation is not None,
                    'conversation_id': existing_conversation.id if existing_conversation else None
                })
        
        return {"groups": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch community groups: {str(e)}")
