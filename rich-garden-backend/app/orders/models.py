from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("telegram_users.id"), nullable=True)
    customer_name = Column(String)
    customer_phone = Column(String)
    total_price = Column(Integer)
    status = Column(String, default="new")
    items = Column(String) # JSON string
    address = Column(String, nullable=True)
    comment = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)
    extras = Column(String, nullable=True) # JSON string for postcard, wow-effect, balloons, etc.
    history = Column(String, default='[]') # JSON string of list of {status, time, description}
    created_at = Column(DateTime, default=datetime.datetime.now)
    telegram_message_id = Column(Integer, nullable=True)

    user = relationship("TelegramUser", back_populates="orders")
