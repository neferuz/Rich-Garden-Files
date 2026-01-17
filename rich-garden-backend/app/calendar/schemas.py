from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List

class FamilyMemberBase(BaseModel):
    name: str
    relation: str
    birthday: Optional[str] = None
    image: Optional[str] = "none"

class FamilyMemberCreate(FamilyMemberBase):
    pass

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    relation: Optional[str] = None
    birthday: Optional[str] = None
    image: Optional[str] = None

class UserSimplified(BaseModel):
    id: int
    first_name: str
    username: Optional[str] = None
    photo_url: Optional[str] = None
    phone_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class FamilyMemberResponse(FamilyMemberBase):
    id: int
    user_id: int
    user: Optional[UserSimplified] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CalendarEventBase(BaseModel):
    title: str
    date: date
    type: str # birthday, anniversary, family, other
    family_member_id: Optional[int] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventResponse(CalendarEventBase):
    id: int
    user_id: int
    user: Optional[UserSimplified] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CalendarDataResponse(BaseModel):
    family: List[FamilyMemberResponse]
    events: List[CalendarEventResponse]

    model_config = ConfigDict(from_attributes=True)
