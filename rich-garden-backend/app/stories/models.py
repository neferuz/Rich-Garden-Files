from sqlalchemy import Column, Integer, String, DateTime, Boolean, BigInteger
from datetime import datetime
from app.database import Base

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    thumbnail_url = Column(String) # For the circle
    content_url = Column(String)   # For the full story view
    content_type = Column(String, default="image") # image or video
    bg_color = Column(String, default="bg-blue-100") # Tailwind color class or hex
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class StoryView(Base):
    __tablename__ = "story_views"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer) # ForeignKey manually used for simplicity or add it properly
    user_id = Column(BigInteger)
    viewed_at = Column(DateTime, default=datetime.utcnow)
