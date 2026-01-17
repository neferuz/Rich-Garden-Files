from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Banner(Base):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    subtitle = Column(String)
    button_text = Column(String)
    bg_color = Column(String) # stores Tailwind class or hex
    image_url = Column(String, nullable=True)
    link = Column(String, nullable=True)
    
    # Custom Colors
    title_color = Column(String, default="#000000")
    subtitle_color = Column(String, default="#000000")
    button_text_color = Column(String, default="#FFFFFF")
    button_bg_color = Column(String, default="#000000")

    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
