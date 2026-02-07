from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, BigInteger
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class TelegramUser(Base):
    __tablename__ = "telegram_users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=True)
    first_name = Column(String)
    username = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.now)

    addresses = relationship("Address", back_populates="user")
    recently_viewed = relationship("RecentlyViewed", back_populates="user")
    orders = relationship("Order", back_populates="user") # Ensure Order model is loaded app-wide

class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("telegram_users.id"))
    title = Column(String) # e.g. "Дом", "Офис"
    address = Column(String) # Full address line
    info = Column(String, nullable=True) # Extra info like door code, floor
    created_at = Column(DateTime, default=datetime.datetime.now)

    user = relationship("TelegramUser", back_populates="addresses")

class RecentlyViewed(Base):
    __tablename__ = "recently_viewed"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("telegram_users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    viewed_at = Column(DateTime, default=datetime.datetime.now)
    
    user = relationship("TelegramUser", back_populates="recently_viewed")
    product = relationship("Product") # Ensure Product model is loaded

# Fix circular imports for SQLAlchemy relationships
try:
    from app.orders.models import Order
    from app.products.models import Product
except ImportError:
    pass
