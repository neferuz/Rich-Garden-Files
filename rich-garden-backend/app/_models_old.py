from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    price = Column(String)
    price_raw = Column(Integer, default=0)
    image = Column(String)
    images = Column(String, default="[]") 
    rating = Column(String, default="5.0")
    is_hit = Column(Boolean, default=False)
    is_new = Column(Boolean, default=False)
    
    # Details
    description = Column(String, default="")
    composition = Column(String, default="[]") # JSON string
    
    # Inventory
    cost_price = Column(Integer, default=0)
    stock_quantity = Column(Integer, default=0)
    supplier = Column(String, default="Основной склад")
    unit = Column(String, default="шт")
    is_ingredient = Column(Boolean, default=False)

    views = Column(Integer, default=0)
    
    history = relationship("ProductHistory", back_populates="product")

class ProductHistory(Base):
    __tablename__ = "product_history"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    action = Column(String) 
    quantity = Column(Integer)
    date = Column(String)
    
    product = relationship("Product", back_populates="history")

class TelegramUser(Base):
    __tablename__ = "telegram_users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True)
    first_name = Column(String)
    username = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.now)

    addresses = relationship("Address", back_populates="user")
    recently_viewed = relationship("RecentlyViewed", back_populates="user")

class RecentlyViewed(Base):
    __tablename__ = "recently_viewed"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("telegram_users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    viewed_at = Column(DateTime, default=datetime.datetime.now)
    
    user = relationship("TelegramUser", back_populates="recently_viewed")
    product = relationship("Product")

class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("telegram_users.id"))
    title = Column(String) # e.g. "Дом", "Офис"
    address = Column(String) # Full address line
    info = Column(String, nullable=True) # Extra info like door code, floor
    created_at = Column(DateTime, default=datetime.datetime.now)

    user = relationship("TelegramUser", back_populates="addresses")

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

    user = relationship("TelegramUser", back_populates="orders")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer)
    category = Column(String)
    note = Column(String)
    date = Column(String)

# Update TelegramUser relationship
TelegramUser.orders = relationship("Order", back_populates="user")
TelegramUser.addresses = relationship("Address", back_populates="user")
TelegramUser.recently_viewed = relationship("RecentlyViewed", back_populates="user")
