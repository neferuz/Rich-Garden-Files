from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class StoryBase(BaseModel):
    title: str
    thumbnail_url: str
    content_url: str
    content_type: Optional[str] = "image"
    bg_color: Optional[str] = "bg-blue-100"
    is_active: Optional[bool] = True

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content_url: Optional[str] = None
    content_type: Optional[str] = None
    bg_color: Optional[str] = None
    is_active: Optional[bool] = None

class StoryViewSchema(BaseModel):
    user_id: int
    user_name: Optional[str] = "Пользователь"
    user_photo: Optional[str] = None
    viewed_at: datetime
    
    class Config:
        from_attributes = True

class Story(StoryBase):
    id: int
    views_count: int = 0
    is_viewed_by_me: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class StoryStats(BaseModel):
    id: int
    title: str
    views_count: int
    viewers: List[StoryViewSchema]
