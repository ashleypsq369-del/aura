"""
Educational Resources Router  --  Project Aura
Search, bookmark, recommended, and helpful feedback.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
from sqlalchemy.orm import Session
import json

from src.db import (
    get_db, Resource, ResourceBookmark, ResourceFeedback, User, AuditLog
)
from routers.auth import get_current_user
from services.personalisation import get_recommended_resources

router = APIRouter()

PDF_DIR = Path(__file__).parent.parent / "static" / "pdfs"


class FeedbackRequest(BaseModel):
    helpful: bool


# ─── PDF serve endpoint (authenticated, CORS-safe) ────────────────────────────

@router.get("/pdf/{filename}")
async def serve_pdf(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """Serve a local PDF with auth check and CORS headers.
    Frontend fetches this as a Blob (with Authorization header) and
    creates an object URL  --  avoids all iframe/CORS issues."""
    if not filename.endswith(".pdf") or "/" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    pdf_path = PDF_DIR / filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "private, max-age=3600",
        },
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
async def list_resources(
    search: Optional[str] = None,
    category: Optional[str] = None,
    condition: Optional[str] = None,
    topic: Optional[str] = None,
    format: Optional[str] = None,
    language: Optional[str] = None,
    is_ghana_specific: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all educational resources with filtering."""
    query = db.query(Resource).filter(Resource.is_published == True)

    if search:
        query = query.filter(
            (Resource.title.ilike(f"%{search}%")) |
            (Resource.summary.ilike(f"%{search}%")) |
            (Resource.content.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Resource.category == category)
    if format:
        query = query.filter(Resource.format == format)
    if language:
        query = query.filter(Resource.language == language)
    if is_ghana_specific is not None:
        query = query.filter(Resource.is_ghana_specific == is_ghana_specific)

    resources = query.all()

    # Client-side style filters for json array fields (condition_tags, topic_tags)
    filtered = []
    for r in resources:
        keep = True
        if condition:
            tags = json.loads(r.condition_tags) if r.condition_tags else []
            if condition not in tags:
                keep = False
        if topic:
            tags = json.loads(r.topic_tags) if r.topic_tags else []
            if topic not in tags:
                keep = False
        
        if keep:
            filtered.append(r)

    return filtered


@router.get("/recommended")
async def get_my_recommended_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ranked recommendations for the logged-in user."""
    resources = get_recommended_resources(current_user.id, db)
    return resources


@router.get("/recommended/{user_id}")
async def get_user_recommended_resources(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recommendations for a specific patient. Admin / Clinicians only."""
    if current_user.id != user_id and current_user.role not in ["clinician", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    resources = get_recommended_resources(user_id, db)
    return resources


@router.get("/bookmarks")
async def get_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all bookmarked resources for current user."""
    bookmarks = db.query(ResourceBookmark).filter(
        ResourceBookmark.user_id == current_user.id
    ).all()
    
    resource_ids = [b.resource_id for b in bookmarks]
    if not resource_ids:
        return []

    resources = db.query(Resource).filter(
        Resource.id.in_(resource_ids),
        Resource.is_published == True
    ).all()

    return resources


@router.get("/{resource_id}")
async def get_resource_details(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single resource detail and increment view count."""
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.is_published == True
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Increment view count
    resource.view_count = (resource.view_count or 0) + 1
    db.commit()

    # Check if currently bookmarked
    is_bookmarked = db.query(ResourceBookmark).filter(
        ResourceBookmark.user_id == current_user.id,
        ResourceBookmark.resource_id == resource_id
    ).first() is not None

    # Check feedback
    feedback = db.query(ResourceFeedback).filter(
        ResourceFeedback.user_id == current_user.id,
        ResourceFeedback.resource_id == resource_id
    ).first()
    
    user_feedback = None
    if feedback:
        user_feedback = "helpful" if feedback.helpful else "not_helpful"

    return {
        "resource": resource,
        "is_bookmarked": is_bookmarked,
        "user_feedback": user_feedback
    }


@router.post("/{resource_id}/helpful")
async def toggle_resource_helpful(
    resource_id: int,
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit helpful / not helpful feedback."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    feedback = db.query(ResourceFeedback).filter(
        ResourceFeedback.user_id == current_user.id,
        ResourceFeedback.resource_id == resource_id
    ).first()

    if not feedback:
        feedback = ResourceFeedback(
            user_id=current_user.id,
            resource_id=resource_id,
            helpful=request.helpful
        )
        db.add(feedback)
        if request.helpful:
            resource.helpful_count = (resource.helpful_count or 0) + 1
    else:
        # If toggling
        if feedback.helpful != request.helpful:
            feedback.helpful = request.helpful
            if request.helpful:
                resource.helpful_count = (resource.helpful_count or 0) + 1
            else:
                resource.helpful_count = max(0, (resource.helpful_count or 0) - 1)
        
    db.commit()

    return {"message": "Feedback recorded", "helpful_count": resource.helpful_count}


@router.post("/{resource_id}/bookmark")
async def toggle_resource_bookmark(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle a resource bookmark for the logged-in user."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    bookmark = db.query(ResourceBookmark).filter(
        ResourceBookmark.user_id == current_user.id,
        ResourceBookmark.resource_id == resource_id
    ).first()

    is_bookmarked = False
    if bookmark:
        db.delete(bookmark)
    else:
        new_bookmark = ResourceBookmark(
            user_id=current_user.id,
            resource_id=resource_id
        )
        db.add(new_bookmark)
        is_bookmarked = True

    db.commit()
    return {"message": "Bookmark toggled", "is_bookmarked": is_bookmarked}
