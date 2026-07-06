"""
File Upload Router  --  Project Aura
Handle file uploads for messages, legacy content, memories, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import os
import uuid
import shutil
from pathlib import Path

from src.db import get_db, User, FileAttachment
from routers.auth import get_current_user

router = APIRouter()

# Upload configuration
UPLOAD_DIR = Path("uploads")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    'image': {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'},
    'video': {'.mp4', '.webm', '.mov', '.avi'},
    'audio': {'.mp3', '.wav', '.ogg', '.m4a', '.aac'},
    'document': {'.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx'},
}
ALLOWED_MIME_TYPES = {
    'image': {'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'},
    'video': {'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'},
    'audio': {'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'},
    'document': {
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
}

# Create upload directories
for category in ['messages', 'legacy', 'memories', 'community', 'profiles', 'documents']:
    (UPLOAD_DIR / category).mkdir(parents=True, exist_ok=True)


def get_file_category(content_type: str) -> Optional[str]:
    """Determine file category from MIME type."""
    for category, mime_types in ALLOWED_MIME_TYPES.items():
        if content_type in mime_types:
            return category
    return None


def validate_file(file: UploadFile) -> tuple[bool, str, str]:
    """Validate uploaded file. Returns (valid, error_message, category)."""
    # Check content type
    category = get_file_category(file.content_type)
    if not category:
        return False, f"File type not allowed: {file.content_type}", None
    
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS[category]:
        return False, f"File extension not allowed: {file_ext}", None
    
    return True, "", category


def generate_unique_filename(original_filename: str, category: str) -> tuple[str, str]:
    """Generate unique filename and relative path."""
    file_ext = Path(original_filename).suffix.lower()
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}{file_ext}"
    return filename, filename


async def save_upload_file(file: UploadFile, subfolder: str) -> tuple[str, int]:
    """Save uploaded file to disk. Returns (filepath, file_size)."""
    upload_path = UPLOAD_DIR / subfolder
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower()
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}{file_ext}"
    filepath = upload_path / filename
    
    # Save file
    file_size = 0
    with filepath.open("wb") as buffer:
        chunk_size = 1024 * 1024  # 1MB chunks
        while chunk := await file.read(chunk_size):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                filepath.unlink()  # Delete incomplete file
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024)}MB"
                )
            buffer.write(chunk)
    
    # Return relative path
    relative_path = f"{subfolder}/{filename}"
    return relative_path, file_size


# ─── Upload Endpoints ─────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(...),  # messages, legacy, memories, community, profiles, documents
    related_id: Optional[int] = Form(None),  # ID of related entity (message, post, etc.)
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file.
    Categories: messages, legacy, memories, community, profiles, documents
    """
    # Validate category
    valid_categories = ['messages', 'legacy', 'memories', 'community', 'profiles', 'documents']
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
    
    # Validate file
    valid, error, file_category = validate_file(file)
    if not valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Save file
    try:
        filepath, file_size = await save_upload_file(file, category)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create database record
    file_attachment = FileAttachment(
        user_id=current_user.id,
        filename=file.filename,
        original_filename=file.filename,
        filepath=filepath,
        file_size=file_size,
        mime_type=file.content_type,
        file_category=file_category,
        upload_category=category,
        related_id=related_id,
        description=description,
        uploaded_at=datetime.utcnow(),
    )
    db.add(file_attachment)
    db.commit()
    db.refresh(file_attachment)
    
    return {
        "id": file_attachment.id,
        "filename": file_attachment.filename,
        "original_filename": file_attachment.original_filename,
        "filepath": file_attachment.filepath,
        "file_size": file_attachment.file_size,
        "mime_type": file_attachment.mime_type,
        "file_category": file_attachment.file_category,
        "upload_category": file_attachment.upload_category,
        "url": f"/api/uploads/file/{file_attachment.id}",
        "uploaded_at": file_attachment.uploaded_at.isoformat(),
    }


@router.post("/upload-multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    category: str = Form(...),
    related_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload multiple files at once."""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files per upload")
    
    uploaded_files = []
    for file in files:
        # Validate file
        valid, error, file_category = validate_file(file)
        if not valid:
            raise HTTPException(status_code=400, detail=f"{file.filename}: {error}")
        
        # Save file
        try:
            filepath, file_size = await save_upload_file(file, category)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save {file.filename}: {str(e)}")
        
        # Create database record
        file_attachment = FileAttachment(
            user_id=current_user.id,
            filename=file.filename,
            original_filename=file.filename,
            filepath=filepath,
            file_size=file_size,
            mime_type=file.content_type,
            file_category=file_category,
            upload_category=category,
            related_id=related_id,
            uploaded_at=datetime.utcnow(),
        )
        db.add(file_attachment)
        db.flush()
        
        uploaded_files.append({
            "id": file_attachment.id,
            "filename": file_attachment.filename,
            "original_filename": file_attachment.original_filename,
            "filepath": file_attachment.filepath,
            "file_size": file_attachment.file_size,
            "mime_type": file_attachment.mime_type,
            "url": f"/api/uploads/file/{file_attachment.id}",
            "uploaded_at": file_attachment.uploaded_at.isoformat(),
        })
    
    db.commit()
    
    return {
        "count": len(uploaded_files),
        "files": uploaded_files
    }


@router.get("/file/{file_id}")
async def get_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download/view a file."""
    file_attachment = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check access permissions
    # TODO: Add more sophisticated access control based on category
    # For now, allow access to:
    # - File owner
    # - Admin/Clinician
    if file_attachment.user_id != current_user.id and current_user.role not in ['admin', 'clinician']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get file path
    file_path = UPLOAD_DIR / file_attachment.filepath
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=file_attachment.original_filename,
        media_type=file_attachment.mime_type
    )


@router.get("/list")
async def list_files(
    category: Optional[str] = None,
    related_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's uploaded files."""
    query = db.query(FileAttachment).filter(FileAttachment.user_id == current_user.id)
    
    if category:
        query = query.filter(FileAttachment.upload_category == category)
    
    if related_id:
        query = query.filter(FileAttachment.related_id == related_id)
    
    files = query.order_by(FileAttachment.uploaded_at.desc()).all()
    
    return {
        "files": [
            {
                "id": f.id,
                "filename": f.filename,
                "original_filename": f.original_filename,
                "file_size": f.file_size,
                "mime_type": f.mime_type,
                "file_category": f.file_category,
                "upload_category": f.upload_category,
                "related_id": f.related_id,
                "description": f.description,
                "url": f"/api/uploads/file/{f.id}",
                "uploaded_at": f.uploaded_at.isoformat(),
            }
            for f in files
        ]
    }


@router.delete("/file/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file."""
    file_attachment = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check permissions
    if file_attachment.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete file from disk
    file_path = UPLOAD_DIR / file_attachment.filepath
    if file_path.exists():
        file_path.unlink()
    
    # Delete database record
    db.delete(file_attachment)
    db.commit()
    
    return {"message": "File deleted successfully"}


@router.get("/stats")
async def get_upload_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's upload statistics."""
    files = db.query(FileAttachment).filter(FileAttachment.user_id == current_user.id).all()
    
    total_size = sum(f.file_size for f in files)
    
    by_category = {}
    for f in files:
        cat = f.upload_category
        if cat not in by_category:
            by_category[cat] = {"count": 0, "size": 0}
        by_category[cat]["count"] += 1
        by_category[cat]["size"] += f.file_size
    
    return {
        "total_files": len(files),
        "total_size": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "by_category": by_category
    }
