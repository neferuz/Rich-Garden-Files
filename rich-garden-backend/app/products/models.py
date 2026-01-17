from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

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
