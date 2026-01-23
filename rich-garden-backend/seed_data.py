import sys
import os
import random
from datetime import datetime, timedelta

sys.path.append(os.getcwd())

from app.database import SessionLocal, engine, Base
from app.products import models as product_models
from app.orders import models as order_models
from app.users import models as user_models

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # 1. Seed Products
        if db.query(product_models.Product).count() == 0:
            print("Seeding products...")
            products = [
                {"name": "101 Роза", "category": "bouquet", "price_raw": 1500000, "price": "1 500 000", "image": "/uploads/roses.jpg", "is_hit": True, "is_new": False, "stock_quantity": 50},
                {"name": "Пионы (5 шт)", "category": "bouquet", "price_raw": 450000, "price": "450 000", "image": "/uploads/peonies.jpg", "is_hit": False, "is_new": True, "stock_quantity": 20},
                {"name": "Тюльпаны", "category": "bouquet", "price_raw": 300000, "price": "300 000", "image": "/uploads/tulips.jpg", "is_hit": True, "is_new": False, "stock_quantity": 100},
                {"name": "Корзина цветов", "category": "basket", "price_raw": 1200000, "price": "1 200 000", "image": "/uploads/basket.jpg", "is_hit": False, "is_new": False, "stock_quantity": 10},
                {"name": "Орхидея", "category": "pot", "price_raw": 250000, "price": "250 000", "image": "/uploads/orchid.jpg", "is_hit": False, "is_new": True, "stock_quantity": 30},
            ]
            
            db_products = []
            for p in products:
                prod = product_models.Product(**p)
                db.add(prod)
                db_products.append(prod)
            db.commit()
            
            # Refresh to get IDs
            for p in db_products:
                db.refresh(p)
        else:
            print("Products already exist.")
            db_products = db.query(product_models.Product).all()

        # 2. Seed Orders (if empty)
        if db.query(order_models.Order).count() == 0:
            print("Seeding orders...")
            # We need a user. If no user, create one.
            user = db.query(user_models.TelegramUser).first()
            if not user:
                user = user_models.TelegramUser(
                    telegram_id=123456789,
                    first_name="Demo User",
                    username="demouser",
                    phone_number="+998901234567"
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            statuses = ["new", "processing", "delivery", "done", "cancelled"]
            
            for i in range(10):
                prod = random.choice(db_products)
                qty = random.randint(1, 3)
                total = prod.price_raw * qty
                
                order = order_models.Order(
                    user_id=user.id,
                    customer_name=user.first_name,
                    customer_phone=user.phone_number,
                    total_price=total,
                    status=random.choice(statuses),
                    items=f'[{{"id": {prod.id}, "name": "{prod.name}", "quantity": {qty}, "price": {prod.price_raw}}}]',
                    address="Test Address " + str(i),
                    created_at=datetime.now() - timedelta(days=random.randint(0, 30))
                )
                db.add(order)
            db.commit()
            print("Orders seeded.")

        print("Done!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
