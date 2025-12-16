from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from pathlib import Path
from app.database import get_db
from app.models.file_upload import FileUpload
from app.models.user import User
from app.utils.dependencies import get_current_user
import uuid

router = APIRouter(prefix="/files", tags=["files"])

# File upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    entity_type: str = Form(...),  # job, customer, invoice
    entity_id: str = Form(...),
    category: Optional[str] = Form(None),  # before_photo, after_photo, document, signature
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a file and attach to an entity"""
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / entity_type / entity_id
        file_path.mkdir(parents=True, exist_ok=True)
        full_path = file_path / unique_filename
        
        # Save file
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(full_path)
        
        # Create database record
        db_file = FileUpload(
            filename=unique_filename,
            original_filename=file.filename,
            file_size=file_size,
            file_type=file.content_type,
            file_path=str(full_path),
            entity_type=entity_type,
            entity_id=entity_id,
            category=category,
            description=description,
            uploaded_by=current_user.id
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return {
            "id": db_file.id,
            "filename": db_file.original_filename,
            "file_size": db_file.file_size,
            "category": db_file.category,
            "uploaded_at": db_file.uploaded_at
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )


@router.get("/{entity_type}/{entity_id}")
def list_files(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all files for an entity"""
    files = db.query(FileUpload).filter(
        FileUpload.entity_type == entity_type,
        FileUpload.entity_id == entity_id
    ).order_by(FileUpload.uploaded_at.desc()).all()
    
    return [{
        "id": f.id,
        "filename": f.original_filename,
        "file_size": f.file_size,
        "file_type": f.file_type,
        "category": f.category,
        "description": f.description,
        "uploaded_at": f.uploaded_at,
        "uploaded_by": f.uploaded_by
    } for f in files]


@router.delete("/{file_id}")
def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a file"""
    db_file = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete physical file
    try:
        if os.path.exists(db_file.file_path):
            os.remove(db_file.file_path)
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Delete database record
    db.delete(db_file)
    db.commit()
    
    return {"message": "File deleted successfully"}











