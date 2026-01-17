from pydantic import BaseModel
from typing import Optional

class BannerBase(BaseModel):
    title: str
    subtitle: str
    button_text: str
    bg_color: str
    image_url: Optional[str] = None
    link: Optional[str] = None
    
    title_color: str = "#000000"
    subtitle_color: str = "#000000"
    button_text_color: str = "#FFFFFF"
    button_bg_color: str = "#000000"

    sort_order: int = 0
    is_active: bool = True

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    button_text: Optional[str] = None
    bg_color: Optional[str] = None
    image_url: Optional[str] = None
    link: Optional[str] = None
    
    title_color: Optional[str] = None
    subtitle_color: Optional[str] = None
    button_text_color: Optional[str] = None
    button_bg_color: Optional[str] = None

    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class Banner(BannerBase):
    id: int

    class Config:
        from_attributes = True
