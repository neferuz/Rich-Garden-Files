from pydantic import BaseModel
from typing import List, Optional

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    price: Optional[str] = None
    price_raw: Optional[int] = 0
    image: Optional[str] = None
    images: Optional[str] = "[]"
    rating: Optional[float] = 5.0
    is_hit: bool = False
    is_new: bool = False
    description: Optional[str] = ""
    composition: Optional[str] = "[]"
    cost_price: Optional[int] = 0
    stock_quantity: Optional[int] = 0
    supplier: Optional[str] = "Основной склад"
    unit: Optional[str] = "шт"
    is_ingredient: bool = False
    views: Optional[int] = 0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[str] = None
    price_raw: Optional[int] = None
    image: Optional[str] = None
    images: Optional[str] = None
    rating: Optional[float] = None
    is_hit: Optional[bool] = None
    is_new: Optional[bool] = None
    description: Optional[str] = None
    composition: Optional[str] = None
    cost_price: Optional[int] = None
    stock_quantity: Optional[int] = None
    supplier: Optional[str] = None
    unit: Optional[str] = None
    is_ingredient: Optional[bool] = None
    views: Optional[int] = None

class ProductSupply(BaseModel):
    quantity: int
    cost_price: int
    supplier: Optional[str] = None

class ProductHistoryBase(BaseModel):
    product_id: int
    action: str
    quantity: int
    date: str

class ProductHistoryCreate(ProductHistoryBase):
    pass

class ProductHistory(ProductHistoryBase):
    id: int
    class Config:
        orm_mode = True

class Product(ProductBase):
    id: int
    images: str
    history: List[ProductHistory] = []
    
    class Config:
        orm_mode = True

class ProductWithHistory(Product):
    history: List[ProductHistory] = []
    class Config:
        orm_mode = True
