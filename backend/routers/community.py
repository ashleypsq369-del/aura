"""
Community Hub Router  --  Project Aura
Anonymised support groups, 280-char posts, reactions, flagging, and moderation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, constr
from typing import Optional, List
from sqlalchemy.orm import Session
import json
from datetime import datetime

from src.db import (
    get_db, CommunityGroup, CommunityMembership, CommunityPost,
    User, Patient, PatientFamilyLink, AuditLog
)
from routers.auth import get_current_user
from services.personalisation import detect_condition_category

router = APIRouter()


class PostCreateRequest(BaseModel):
    group_id: int
    content: constr(max_length=280)


class ReactRequest(BaseModel):
    reaction_type: str  # "pray", "heart", "strong", "hug", "care", "grateful", "hope", "fire"


class GroupCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    condition_tags: Optional[List[str]] = []
    image_url: Optional[str] = None


class GroupUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    condition_tags: Optional[List[str]] = None
    image_url: Optional[str] = None

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_anonymised_name(user: User, db: Session) -> str:
    """Helper to anonymise the display name based on role and condition."""
    first_name = user.full_name.split()[0]
    
    if user.role == "patient":
        patient = db.query(Patient).filter(Patient.full_name == user.full_name).first()
        if patient:
            cat = detect_condition_category(patient.primary_diagnosis)
            return f"{first_name} · {cat.title()} Journey"
        return f"{first_name} · General Journey"
        
    elif user.role == "family":
        link = db.query(PatientFamilyLink).filter(PatientFamilyLink.family_user_id == user.id).first()
        if link:
            patient = db.query(Patient).filter(Patient.id == link.patient_id).first()
            if patient:
                p_first = patient.full_name.split()[0]
                cat = detect_condition_category(patient.primary_diagnosis)
                return f"Family of {p_first} · {cat.title()} Journey"
        return f"Family Member"
        
    elif user.role in ["clinician", "caregiver"]:
        return f"{user.full_name} (Care Team)"
        
    elif user.role == "admin":
        return f"{user.full_name} (Moderator)"
        
    return "Anonymous Participant"


# ─── Endpoints ────────────────────────────────────────────────────────────────

def _get_user_relevant_tags(user: User, db: Session) -> List[str]:
    """Get relevant tags for user based on their context (diagnosis, role, preferences)."""
    relevant_tags = ["general"]
    
    if user.role == "patient":
        patient = db.query(Patient).filter(Patient.full_name == user.full_name).first()
        if patient:
            # Add condition category
            cat = detect_condition_category(patient.primary_diagnosis)
            relevant_tags.append(cat)
            
            # Add specific symptoms/concerns from recent data
            if patient.primary_diagnosis:
                diag_lower = patient.primary_diagnosis.lower()
                if "cancer" in diag_lower:
                    relevant_tags.extend(["cancer", "oncology"])
                if "heart" in diag_lower:
                    relevant_tags.extend(["heart", "cardiac"])
                if "kidney" in diag_lower or "renal" in diag_lower:
                    relevant_tags.extend(["kidney", "renal"])
                if "lung" in diag_lower or "copd" in diag_lower:
                    relevant_tags.extend(["lung", "copd", "respiratory"])
                if "liver" in diag_lower:
                    relevant_tags.extend(["liver"])
                if "hiv" in diag_lower or "aids" in diag_lower:
                    relevant_tags.extend(["hiv", "aids"])
            
            # Add palliative care tags
            relevant_tags.extend(["palliative", "hospice", "living", "wellness"])
            
    elif user.role == "family":
        relevant_tags.extend(["caregiver", "family", "support"])
        # Get linked patient's condition
        link = db.query(PatientFamilyLink).filter(PatientFamilyLink.family_user_id == user.id).first()
        if link:
            patient = db.query(Patient).filter(Patient.id == link.patient_id).first()
            if patient:
                cat = detect_condition_category(patient.primary_diagnosis)
                relevant_tags.append(cat)
                
    elif user.role == "caregiver":
        relevant_tags.extend(["caregiver", "burnout", "self_care"])
        
    # Add universal support tags
    relevant_tags.extend(["mental_health", "spiritual", "hope", "ghana"])
    
    return list(set(relevant_tags))  # Remove duplicates


def _calculate_relevance_score(group: CommunityGroup, user_tags: List[str]) -> int:
    """Calculate how relevant a group is to the user (0-100)."""
    group_tags = json.loads(group.condition_tags) if group.condition_tags else []
    
    # Count matching tags
    matches = sum(1 for tag in group_tags if tag in user_tags)
    
    # Special priority groups
    if group.name in ["General Palliative Care Support", "New to Palliative Care", "Living Well Every Day"]:
        matches += 5  # Boost general support groups
    
    # Ghana-specific boost
    if "ghana" in group_tags and "ghana" in user_tags:
        matches += 3
    
    # Calculate score (0-100)
    if not group_tags:
        return 50  # Neutral for untagged groups
    
    score = min(100, int((matches / len(group_tags)) * 100) + (matches * 10))
    return max(0, score)


@router.get("/groups")
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    recommended_only: bool = Query(False)
):
    """List community groups, optionally filtered by relevance to user."""
    groups = db.query(CommunityGroup).filter(CommunityGroup.is_active == True).all()
    
    my_memberships = db.query(CommunityMembership).filter(
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.is_active == True
    ).all()
    
    joined_group_ids = {m.group_id for m in my_memberships}
    
    # Get user-relevant tags for personalization
    user_tags = _get_user_relevant_tags(current_user, db)
    
    result = []
    for g in groups:
        relevance_score = _calculate_relevance_score(g, user_tags)
        
        # Filter if recommended_only
        if recommended_only and relevance_score < 30:
            continue
        
        result.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "member_count": g.member_count,
            "condition_tags": json.loads(g.condition_tags) if g.condition_tags else [],
            "joined": g.id in joined_group_ids,
            "relevance_score": relevance_score,
            "is_recommended": relevance_score >= 60,
            "image_url": g.image_url,
            "created_by": g.created_by,
        })
    
    # Sort by relevance (recommended first), then by member count
    result.sort(key=lambda x: (x["joined"], -x["relevance_score"], -x["member_count"]))
    
    return result


@router.post("/groups")
async def create_group(
    data: GroupCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new community support group."""
    group = CommunityGroup(
        name=data.name,
        description=data.description,
        condition_tags=json.dumps(data.condition_tags or []),
        image_url=data.image_url,
        created_by=current_user.id,
        is_active=True,
        member_count=1,  # creator is first member
    )
    db.add(group)
    db.flush()  # get the id

    # Auto-join creator
    membership = CommunityMembership(
        user_id=current_user.id,
        group_id=group.id,
        is_active=True
    )
    db.add(membership)
    db.commit()
    db.refresh(group)

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "condition_tags": json.loads(group.condition_tags) if group.condition_tags else [],
        "image_url": group.image_url,
        "member_count": group.member_count,
        "joined": True,
        "is_recommended": False,
        "created_by": group.created_by,
    }


@router.put("/groups/{group_id}")
async def update_group(
    group_id: int,
    data: GroupUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update group info  --  only creator or admin can edit."""
    group = db.query(CommunityGroup).filter(
        CommunityGroup.id == group_id,
        CommunityGroup.is_active == True
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if group.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the group creator or admin can edit this group")

    if data.name is not None:
        group.name = data.name
    if data.description is not None:
        group.description = data.description
    if data.condition_tags is not None:
        group.condition_tags = json.dumps(data.condition_tags)
    if data.image_url is not None:
        group.image_url = data.image_url

    db.commit()
    db.refresh(group)

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "condition_tags": json.loads(group.condition_tags) if group.condition_tags else [],
        "image_url": group.image_url,
        "member_count": group.member_count,
        "created_by": group.created_by,
    }


@router.get("/groups/{group_id}/members")
async def get_group_members(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get anonymised member list for a group."""
    group = db.query(CommunityGroup).filter(CommunityGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    memberships = db.query(CommunityMembership).filter(
        CommunityMembership.group_id == group_id,
        CommunityMembership.is_active == True
    ).all()

    members = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            display = _get_anonymised_name(user, db)
            members.append({
                "display_name": display,
                "role": user.role,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
                "is_creator": user.id == group.created_by,
            })

    return {"members": members, "total": len(members)}


@router.post("/groups/{group_id}/join")
async def toggle_group_join(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join or leave a community group."""
    group = db.query(CommunityGroup).filter(
        CommunityGroup.id == group_id,
        CommunityGroup.is_active == True
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Community group not found")

    membership = db.query(CommunityMembership).filter(
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.group_id == group_id
    ).first()

    joined = False
    if membership:
        membership.is_active = not membership.is_active
        joined = membership.is_active
    else:
        membership = CommunityMembership(
            user_id=current_user.id,
            group_id=group_id,
            is_active=True
        )
        db.add(membership)
        joined = True

    # Update count
    if joined:
        group.member_count = (group.member_count or 0) + 1
    else:
        group.member_count = max(0, (group.member_count or 0) - 1)

    db.commit()

    return {"message": "Membership updated", "joined": joined, "member_count": group.member_count}


@router.get("/groups/{group_id}/posts")
async def get_group_posts(
    group_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get posts for a support group. Mod/Clinician see flagged/moderated grayed posts."""
    group = db.query(CommunityGroup).filter(CommunityGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    query = db.query(CommunityPost).filter(CommunityPost.group_id == group_id)

    # Regular users do not see moderated/hidden posts
    is_moderator = current_user.role in ["admin", "clinician"]
    if not is_moderator:
        query = query.filter(CommunityPost.is_hidden == False)

    total = query.count()
    posts = query.order_by(CommunityPost.created_at.asc()).offset((page - 1) * per_page).limit(per_page).all()

    formatted_posts = []
    for p in posts:
        # Check reactions JSON
        reacts = {"pray": 0, "heart": 0, "strong": 0}
        if p.reactions:
            try:
                reacts = json.loads(p.reactions)
            except Exception:
                pass
        
        formatted_posts.append({
            "id": p.id,
            "group_id": p.group_id,
            "display_name": p.display_name,
            "content": p.content,
            "reactions": reacts,
            "flag_count": p.flag_count if is_moderator else 0,
            "is_hidden": p.is_hidden,
            "is_moderated": p.is_moderated,
            "created_at": p.created_at.isoformat(),
            "can_moderate": is_moderator
        })

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "posts": formatted_posts
    }


@router.post("/posts")
async def create_post(
    request: PostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new post in a community group."""
    group = db.query(CommunityGroup).filter(
        CommunityGroup.id == request.group_id,
        CommunityGroup.is_active == True
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Community group not found")

    # Check membership
    membership = db.query(CommunityMembership).filter(
        CommunityMembership.user_id == current_user.id,
        CommunityMembership.group_id == request.group_id,
        CommunityMembership.is_active == True
    ).first()
    
    # Allow care team and mods to post even without membership
    if not membership and current_user.role not in ["admin", "clinician"]:
        raise HTTPException(status_code=403, detail="You must be a member of this group to post")

    display_name = _get_anonymised_name(current_user, db)

    new_post = CommunityPost(
        group_id=request.group_id,
        author_id=current_user.id,
        display_name=display_name,
        content=request.content,
        reactions='{}',
        created_at=datetime.utcnow()
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {"message": "Post created successfully", "post_id": new_post.id}


@router.post("/posts/{post_id}/react")
async def react_to_post(
    post_id: int,
    request: ReactRequest,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """React to a post using specific emojis (pray, heart, strong)."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if request.reaction_type not in ["pray", "heart", "strong", "hug", "care", "grateful", "hope", "fire", "sad", "wow"]:
        raise HTTPException(status_code=400, detail="Invalid reaction type")

    # Load reactions
    reacts = {"pray": 0, "heart": 0, "strong": 0, "hug": 0, "care": 0, "grateful": 0, "hope": 0, "fire": 0, "sad": 0, "wow": 0}
    if post.reactions:
        try:
            stored = json.loads(post.reactions)
            reacts.update(stored)
        except Exception:
            pass

    # Toggle: if already reacted (>0), decrement; else increment
    key = request.reaction_type
    reacts[key] = max(0, (reacts.get(key, 0) or 0) + 1)
    # Remove zero-count keys to keep storage lean
    reacts = {k: v for k, v in reacts.items() if v > 0}
    post.reactions = json.dumps(reacts)
    db.commit()

    return {"message": "Reaction added", "reactions": reacts}


@router.post("/posts/{post_id}/flag")
async def flag_post(
    post_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Flag a post as inappropriate for moderator review."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.flag_count = (post.flag_count or 0) + 1
    
    # Auto-moderate if flag count reaches threshold (e.g. 5 flags)
    if post.flag_count >= 5:
        post.is_hidden = True
        post.is_moderated = True

    db.commit()
    return {"message": "Post flagged", "flag_count": post.flag_count, "auto_hidden": post.is_hidden}


@router.put("/posts/{post_id}/moderate")
async def moderate_post(
    post_id: int,
    hidden: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Moderate a post (hide/unhide). Clinician and Admin only."""
    if current_user.role not in ["admin", "clinician"]:
        raise HTTPException(status_code=403, detail="Access denied")

    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.is_hidden = hidden
    post.is_moderated = True
    
    audit = AuditLog(
        user_id=current_user.id, user_role=current_user.role,
        action="post_moderated", resource_type="post", resource_id=post_id,
        success=True, details=f'{{"hidden": {str(hidden).lower()}}}'
    )
    db.add(audit)
    db.commit()

    return {"message": "Post updated successfully", "is_hidden": post.is_hidden}
