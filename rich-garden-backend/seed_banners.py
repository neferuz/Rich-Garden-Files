from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.banners import models

db = SessionLocal()

banners = [
    { "title": "на первый заказ", "subtitle": "скидка вырастет до -20%\nс этим промокодом", "button_text": "УЗНАТЬ ПОДРОБНЕЕ", "bg_color": "bg-[#d9f99d]", "sort_order": 1 },
    { "title": "сезон пионов", "subtitle": "самые свежие поставки\nэтой недели", "button_text": "СМОТРЕТЬ КАТАЛОГ", "bg_color": "bg-[#fbcfe8]", "sort_order": 2 },
    { "title": "свадебное", "subtitle": "оформление торжеств\nпод ключ", "button_text": "ЗАКАЗАТЬ", "bg_color": "bg-[#bae6fd]", "sort_order": 3 },
]

for b in banners:
    exists = db.query(models.Banner).filter(models.Banner.title == b["title"]).first()
    if not exists:
        db_banner = models.Banner(**b)
        db.add(db_banner)

db.commit()
print("Banners seeded.")
db.close()
