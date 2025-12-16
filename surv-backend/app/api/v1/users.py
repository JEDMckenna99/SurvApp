from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.utils.dependencies import get_current_user
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    phone: str = None
    is_active: bool = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    role: str
    is_active: bool
    email_verified: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[UserResponse])
def list_users(
    role_filter: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users - admin only"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    query = db.query(User)
    
    if role_filter:
        query = query.filter(User.role == role_filter)
    
    users = query.offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user details"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        if current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse.model_validate(user)


@router.put("/{user_id}")
def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user details"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        if current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only provided fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return {
        "status": "success",
        "message": "User updated successfully",
        "user_id": user.id
    }










