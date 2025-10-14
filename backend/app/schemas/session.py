from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SessionBase(BaseModel):
    title: str = "New Chat"

class SessionCreate(SessionBase):
    pass

class SessionResponse(SessionBase):
    id: int
    thread_id: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SessionListResponse(BaseModel):
    id: int
    thread_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
