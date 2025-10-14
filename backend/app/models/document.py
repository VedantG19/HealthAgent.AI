from sqlalchemy import Column, Integer, String, DateTime, BigInteger
from datetime import datetime
from app.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(String, default="pending")  # pending, processing, completed, failed
