from pydantic import BaseModel
from typing import List, Optional
import datetime
# We might need to import Address/Order schemas to minimize circular deps, 
# or just define them here if they are user-specific. Address is user specific. Order is not.

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
        from_attributes = True

class TelegramUserBase(BaseModel):
    telegram_id: Optional[int] = None
    first_name: str
    username: Optional[str] = None
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None
    birth_date: Optional[str] = None

class TelegramUserCreate(TelegramUserBase):
    pass

class TelegramUser(TelegramUserBase):
    id: int
    created_at: datetime.datetime

class PhoneUpdate(BaseModel):
    phone_number: str
    addresses: List[Address] = [] 
    orders_count: int = 0
    total_spent: int = 0
    
    class Config:
        from_attributes = True

class RecentlyViewedBase(BaseModel):
    user_id: int
    product_id: int

class RecentlyViewedCreate(RecentlyViewedBase):
    pass

class RecentlyViewed(RecentlyViewedBase):
    id: int
    viewed_at: datetime.datetime
    # product: Optional[Product] = None # Avoid importing Product schema to avoid circular dep if Product imports User
    # But usually frontend needs it. We can handle it with ForwardRef or careful imports.
    # For now let's skip embedding full product unless needed. 
    # Actually checking main.py: get_recent_products returns List[Product].
    # So the endpoint returns Product schema, not RecentlyViewed schema.
    
    class Config:
        from_attributes = True

class BroadcastRequest(BaseModel):
    text: str
    filter_type: Optional[str] = "all"
