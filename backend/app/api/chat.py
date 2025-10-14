from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.session import Session as ChatSession
from app.models.message import Message, MessageRole
from app.schemas.message import MessageCreate, MessageResponse
from app.core.security import get_current_active_user
from app.core.rag_agent import RAGAgent
from app.config import get_settings
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["Chat"])
settings = get_settings()

# Initialize RAG agent
rag_agent = RAGAgent(settings.DATABASE_URL)

@router.post("/{session_id}/message", response_model=MessageResponse)
async def send_message(
    session_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message and get agent response"""
    # Verify session belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Save user message
    user_message = Message(
        session_id=session_id,
        role=MessageRole.USER,
        content=message.content
    )
    db.add(user_message)
    db.commit()
    
    # Get agent response
    agent_response = await rag_agent.chat(session.thread_id, message.content)
    
    # Save agent message
    assistant_message = Message(
        session_id=session_id,
        role=MessageRole.ASSISTANT,
        content=agent_response
    )
    db.add(assistant_message)
    
    # Update session timestamp
    session.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(assistant_message)
    
    return assistant_message

@router.get("/{session_id}/messages", response_model=List[MessageResponse])
def get_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all messages for a session"""
    # Verify session belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at).all()
    
    return messages
