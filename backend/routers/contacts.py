"""
Contacts Router  --  Project Aura
WhatsApp-style contacts management for healthcare communication
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime

from src.db import get_db, User, Contact, Conversation, ConversationParticipant, Message, AuditLog
from routers.auth import get_current_user

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════
# Request/Response Models
# ═══════════════════════════════════════════════════════════════════════

class AddContactRequest(BaseModel):
    contact_user_id: int
    nickname: Optional[str] = None
    notes: Optional[str] = None


class UpdateContactRequest(BaseModel):
    nickname: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_blocked: Optional[bool] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: int
    contact_user_id: int
    name: str  # Full name from User table
    nickname: Optional[str]
    role: str
    phone: Optional[str]
    is_favorite: bool
    is_blocked: bool
    is_online: bool  # Based on last_login
    last_seen: Optional[str]
    last_message_at: Optional[str]
    message_count: int
    unread_count: int
    avatar_initials: str
    added_at: str


class SearchUserResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    phone: Optional[str]
    is_contact: bool  # Whether already in contacts
    avatar_initials: str


# ═══════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════

@router.get("/contacts")
async def get_my_contacts(
    favorites_only: bool = False,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's contact list (WhatsApp-style)"""
    try:
        query = db.query(Contact, User).join(
            User, Contact.contact_user_id == User.id
        ).filter(
            Contact.user_id == current_user.id,
            Contact.is_blocked == False,
            User.is_active == True
        )
        
        if favorites_only:
            query = query.filter(Contact.is_favorite == True)
        
        if search:
            query = query.filter(
                or_(
                    User.full_name.ilike(f"%{search}%"),
                    User.username.ilike(f"%{search}%"),
                    Contact.nickname.ilike(f"%{search}%")
                )
            )
        
        # Order by: favorites first, then by last message time, then by name
        contacts_data = query.order_by(
            Contact.is_favorite.desc(),
            Contact.last_message_at.desc().nullslast(),
            User.full_name
        ).all()
        
        result = []
        for contact, user in contacts_data:
            # Get unread count
            unread_count = 0
            conversation = db.query(Conversation).join(ConversationParticipant).filter(
                and_(
                    ConversationParticipant.user_id.in_([current_user.id, user.id]),
                    ConversationParticipant.is_active == True
                )
            ).first()
            
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
            
            # Check if online (last login within 5 minutes)
            is_online = False
            if user.last_login:
                time_diff = datetime.utcnow() - user.last_login
                is_online = time_diff.total_seconds() < 300  # 5 minutes
            
            result.append({
                'id': contact.id,
                'contact_user_id': user.id,
                'name': user.full_name,
                'nickname': contact.nickname,
                'role': user.role,
                'phone': user.phone,
                'is_favorite': contact.is_favorite,
                'is_blocked': contact.is_blocked,
                'is_online': is_online,
                'last_seen': user.last_login.isoformat() if user.last_login else None,
                'last_message_at': contact.last_message_at.isoformat() if contact.last_message_at else None,
                'message_count': contact.message_count,
                'unread_count': unread_count,
                'avatar_initials': user.full_name[:2].upper() if user.full_name else '?',
                'added_at': contact.added_at.isoformat() if contact.added_at else None
            })
        
        return {"contacts": result, "total": len(result)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch contacts: {str(e)}")


@router.post("/contacts")
async def add_contact(
    request: AddContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new contact"""
    try:
        # Verify contact user exists
        contact_user = db.query(User).filter(
            User.id == request.contact_user_id,
            User.is_active == True
        ).first()
        
        if not contact_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Can't add yourself
        if request.contact_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")
        
        # Check if already exists
        existing = db.query(Contact).filter(
            Contact.user_id == current_user.id,
            Contact.contact_user_id == request.contact_user_id
        ).first()
        
        if existing:
            if existing.is_blocked:
                # Unblock and reactivate
                existing.is_blocked = False
                db.commit()
                return {"message": "Contact unblocked", "contact_id": existing.id}
            else:
                raise HTTPException(status_code=400, detail="Contact already exists")
        
        # Create new contact
        contact = Contact(
            user_id=current_user.id,
            contact_user_id=request.contact_user_id,
            nickname=request.nickname,
            notes=request.notes
        )
        
        db.add(contact)
        db.flush()
        
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_role=current_user.role,
            action="contact_added",
            resource_type="contact",
            resource_id=contact.id,
            details=f'{{"contact_user_id": {request.contact_user_id}}}'
        )
        db.add(audit)
        db.commit()
        
        return {
            "message": "Contact added successfully",
            "contact_id": contact.id,
            "contact": {
                'id': contact.id,
                'name': contact_user.full_name,
                'role': contact_user.role
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add contact: {str(e)}")


@router.put("/contacts/{contact_id}")
async def update_contact(
    contact_id: int,
    request: UpdateContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update contact details (nickname, favorite status, etc.)"""
    try:
        contact = db.query(Contact).filter(
            Contact.id == contact_id,
            Contact.user_id == current_user.id
        ).first()
        
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        # Update fields
        if request.nickname is not None:
            contact.nickname = request.nickname
        if request.is_favorite is not None:
            contact.is_favorite = request.is_favorite
        if request.is_blocked is not None:
            contact.is_blocked = request.is_blocked
        if request.notes is not None:
            contact.notes = request.notes
        
        db.commit()
        
        return {"message": "Contact updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update contact: {str(e)}")


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a contact"""
    try:
        contact = db.query(Contact).filter(
            Contact.id == contact_id,
            Contact.user_id == current_user.id
        ).first()
        
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        contact_user_id = contact.contact_user_id
        db.delete(contact)
        
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            user_role=current_user.role,
            action="contact_deleted",
            resource_type="contact",
            resource_id=contact_id,
            details=f'{{"contact_user_id": {contact_user_id}}}'
        )
        db.add(audit)
        db.commit()
        
        return {"message": "Contact removed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove contact: {str(e)}")


@router.get("/search")
async def search_users(
    query: str,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for users to add as contacts (WhatsApp-style search)"""
    try:
        if len(query) < 2:
            return {"users": [], "message": "Query too short"}
        
        # Get user's existing contacts
        existing_contacts = db.query(Contact.contact_user_id).filter(
            Contact.user_id == current_user.id
        ).subquery()
        
        # Search users based on role
        if current_user.role == 'patient':
            role_filter = User.role.in_(['clinician', 'admin', 'caregiver', 'family'])
        elif current_user.role in ['clinician', 'admin']:
            role_filter = User.is_active == True  # Can search all
        elif current_user.role == 'family':
            role_filter = User.role.in_(['clinician', 'admin', 'caregiver', 'family', 'patient'])
        elif current_user.role == 'caregiver':
            role_filter = User.is_active == True  # Can search all
        else:
            role_filter = User.role.in_(['clinician', 'admin'])
        
        users = db.query(User).filter(
            and_(
                User.id != current_user.id,
                User.is_active == True,
                role_filter,
                or_(
                    User.full_name.ilike(f"%{query}%"),
                    User.username.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%")
                )
            )
        ).limit(limit).all()
        
        result = []
        for user in users:
            # Check if already a contact
            is_contact = db.query(Contact).filter(
                Contact.user_id == current_user.id,
                Contact.contact_user_id == user.id
            ).first() is not None
            
            result.append({
                'id': user.id,
                'name': user.full_name,
                'username': user.username,
                'role': user.role,
                'phone': user.phone,
                'is_contact': is_contact,
                'avatar_initials': user.full_name[:2].upper() if user.full_name else '?'
            })
        
        return {"users": result, "total": len(result)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search users: {str(e)}")


@router.get("/frequent")
async def get_frequent_contacts(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get frequently messaged contacts (for quick access)"""
    try:
        contacts = db.query(Contact, User).join(
            User, Contact.contact_user_id == User.id
        ).filter(
            Contact.user_id == current_user.id,
            Contact.is_blocked == False,
            Contact.message_count > 0,
            User.is_active == True
        ).order_by(
            Contact.message_count.desc(),
            Contact.last_message_at.desc()
        ).limit(limit).all()
        
        result = []
        for contact, user in contacts:
            result.append({
                'id': contact.id,
                'contact_user_id': user.id,
                'name': contact.nickname if contact.nickname else user.full_name,
                'role': user.role,
                'message_count': contact.message_count,
                'avatar_initials': user.full_name[:2].upper() if user.full_name else '?'
            })
        
        return {"contacts": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch frequent contacts: {str(e)}")
