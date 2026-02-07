from pydantic import BaseModel
from typing import Optional
import datetime

class EmployeeBase(BaseModel):
    telegram_id: int
    full_name: str
    username: Optional[str] = None
    role: str = "worker"
    photo_url: Optional[str] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    telegram_id: Optional[int] = None
    role: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None

class Employee(EmployeeBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True
