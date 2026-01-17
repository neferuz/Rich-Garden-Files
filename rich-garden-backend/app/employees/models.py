from sqlalchemy import Column, Integer, String, Boolean, DateTime, BigInteger
import datetime
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True)
    full_name = Column(String)
    username = Column(String, nullable=True)
    role = Column(String, default="worker") # owner, admin, finance, worker
    photo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
