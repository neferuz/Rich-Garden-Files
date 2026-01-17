from sqlalchemy.orm import Session
from app.products import repository as product_repo

def get_popular_searches(db: Session):
    tags = ["101 роза 🌹", "Пионы", "Авторские букеты", "Тюльпаны", "Гипсофила", "Сладкие подарки"]
    
    # Get top 4 viewed products
    top_products = product_repo.get_top_viewed(db, limit=4)
    
    return {
        "tags": tags,
        "products": top_products
    }
