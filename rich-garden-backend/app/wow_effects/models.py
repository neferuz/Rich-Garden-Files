from sqlalchemy import Column, Integer, String, Boolean, Float
from app.database import Base

class WowEffect(Base):
    __tablename__ = "wow_effects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    icon = Column(String) # e.g. 'music', 'user', 'zap', 'smile', 'package'
    category = Column(String, default="wow") # 'wow' or 'extra'
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
