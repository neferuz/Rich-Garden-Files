from pydantic import BaseModel
from typing import Optional

class WowEffectBase(BaseModel):
    name: str
    price: float
    icon: str
    category: Optional[str] = "wow"
    description: Optional[str] = None
    is_active: bool = True

class WowEffectCreate(WowEffectBase):
    pass

class WowEffectUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class WowEffect(WowEffectBase):
    id: int

    class Config:
        from_attributes = True
