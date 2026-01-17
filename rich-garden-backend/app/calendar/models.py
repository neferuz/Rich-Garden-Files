from sqlalchemy import Column, ForeignKey, Integer, String, Date, DateTime
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("telegram_users.id"))
    name = Column(String)
    relation = Column(String)
    birthday = Column(String, nullable=True) # YYYY-MM-DD
    image = Column(String, default="none")
    created_at = Column(DateTime, default=datetime.datetime.now)

    user = relationship("TelegramUser", backref="family_members")

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("telegram_users.id"))
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=True)
    title = Column(String)
    date = Column(Date)
    type = Column(String) # birthday, anniversary, family, other
    created_at = Column(DateTime, default=datetime.datetime.now)

    user = relationship("TelegramUser", backref="calendar_events")
    family_member = relationship("FamilyMember", backref="events")
