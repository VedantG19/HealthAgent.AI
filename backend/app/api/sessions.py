from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid
from app.database import get_db
from app.models.user import User
from app.models.session import Session as ChatSession
from app.models.message import Message
from app.schemas.session import SessionCreate, SessionResponse, SessionListResponse
from app.core.security import get_current_active_user

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.post("/", response_model=SessionResponse, status_code=201)
def create_session(
    session: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new chat session"""
    thread_id = str(uuid.uuid4())
    new_session = ChatSession(
        thread_id=thread_id,
        user_id=current_user.id,
        title=session.title
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session

@router.get("/", response_model=List[SessionListResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all sessions for current user"""
    sessions = db.query(
        ChatSession,
        func.count(Message.id).label('message_count')
    ).outerjoin(Message).filter(
        ChatSession.user_id == current_user.id
    ).group_by(ChatSession.id).order_by(
        ChatSession.updated_at.desc()
    ).all()
    
    result = []
    for session, message_count in sessions:
        result.append(SessionListResponse(
            id=session.id,
            thread_id=session.thread_id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=message_count
        ))
    
    return result

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific session"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session

@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a session"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session deleted successfully"}

@router.patch("/{session_id}/title")
def update_session_title(
    session_id: int,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update session title"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.title = title
    db.commit()
    
    return {"message": "Title updated successfully"}
