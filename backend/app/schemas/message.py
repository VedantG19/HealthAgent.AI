from pydantic import BaseModel
from datetime import datetime
from app.models.message import MessageRole

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    role: MessageRole

class MessageResponse(MessageBase):
    id: int
    session_id: int
    role: MessageRole
    created_at: datetime
    
    class Config:
        from_attributes = True
