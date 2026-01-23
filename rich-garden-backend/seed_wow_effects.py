import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine, Base
from app.wow_effects import models

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(models.WowEffect).count() > 0:
            print("Database already contains wow effects.")
            return

        effects = [
            {
                "name": "Скрипач",
                "price": 350000,
                "icon": "music",
                "category": "wow",
                "description": "Профессиональный скрипач исполнит любимую мелодию при вручении букета.",
                "is_active": True
            },
            {
                "name": "Брутальный мужчина",
                "price": 500000,
                "icon": "user",
                "category": "wow",
                "description": "Эффектное вручение букета статным мужчиной в строгом костюме.",
                "is_active": True
            },
            {
                "name": "Мишка Тедди",
                "price": 250000,
                "icon": "smile",
                "category": "extra",
                "description": "Милый мягкий медвежонок.",
                "is_active": True
            },
            {
                "name": "Зайка",
                "price": 180000,
                "icon": "smile",
                "category": "extra",
                "description": "Пушистый зайчик в подарок.",
                "is_active": True
            },
            {
                "name": "Шары (5 шт)",
                "price": 85000,
                "icon": "sparkles",
                "category": "extra",
                "description": "Сет из пяти праздничных шаров.",
                "is_active": True
            },
            {
                "name": "Открытка",
                "price": 10000,
                "icon": "pen",
                "category": "postcard",
                "description": "Классическая открытка для ваших теплых слов.",
                "is_active": True
            }
        ]

        for effect_data in effects:
            effect = models.WowEffect(**effect_data)
            db.add(effect)
        
        db.commit()
        print("Successfully seeded wow effects and extras!")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
