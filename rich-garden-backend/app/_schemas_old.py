from pydantic import BaseModel
from typing import List, Optional, Any, Union
import datetime

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    price: Optional[str] = None
    price_raw: Optional[int] = 0
    image: Optional[str] = None
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

class Product(ProductBase):
    id: int
    images: str
    history: List['ProductHistory'] = []
    
    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    user_id: Optional[int] = None
    customer_name: str
    customer_phone: str
    total_price: int
    status: str = "new"
    items: str # JSON string
    address: Optional[str] = None
    comment: Optional[str] = None
    payment_method: Optional[str] = None
    extras: Optional[str] = None
    history: Optional[str] = "[]"
    created_at: Optional[datetime.datetime] = None

class OrderCreate(OrderBase):
    telegram_id: Optional[int] = None

class OrderUpdateStatus(BaseModel):
    status: str

class Order(OrderBase):
    id: int
    class Config:
        orm_mode = True

class ExpenseBase(BaseModel):
    amount: int
    category: str
    note: str
    date: str

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    class Config:
        orm_mode = True

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

class ProductWithHistory(Product):
    history: List[ProductHistory] = []
    class Config:
        orm_mode = True

# --- Address ---
class AddressBase(BaseModel):
    title: str
    address: str
    info: Optional[str] = None

class AddressCreate(AddressBase):
    pass

class Address(AddressBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    class Config:
        orm_mode = True

# --- User ---
class TelegramUserBase(BaseModel):
    telegram_id: int
    first_name: str
    username: Optional[str] = None
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None

class TelegramUserCreate(TelegramUserBase):
    pass

class TelegramUser(TelegramUserBase):
    id: int
    created_at: datetime.datetime
    addresses: List[Address] = [] 
    orders_count: int = 0
    total_spent: int = 0
    
    class Config:
        orm_mode = True

class RecentlyViewedBase(BaseModel):
    user_id: int
    product_id: int

class RecentlyViewedCreate(RecentlyViewedBase):
    pass

class RecentlyViewed(RecentlyViewedBase):
    id: int
    viewed_at: datetime.datetime
    product: Optional[Product] = None
    
    class Config:
        orm_mode = True
