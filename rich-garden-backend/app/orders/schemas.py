from pydantic import BaseModel
from typing import Optional, List
import datetime

class TelegramUserMinimal(BaseModel):
    id: int
    telegram_id: Optional[int] = None
    first_name: str
    username: Optional[str] = None
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    class Config:
        from_attributes = True

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
    user: Optional[TelegramUserMinimal] = None
    class Config:
        from_attributes = True
