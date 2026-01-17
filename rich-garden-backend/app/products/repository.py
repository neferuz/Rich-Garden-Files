from sqlalchemy.orm import Session
from . import models, schemas
import datetime

def get_all(db: Session, category: str = None, search: str = None):
    query = db.query(models.Product)
    if category and category != "all":
        query = query.filter(models.Product.category.ilike(category))
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    return query.all()

def get_by_id(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def create(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_by_id(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete(db: Session, product_id: int):
    product = get_by_id(db, product_id)
    if product:
        db.delete(product)
        db.commit()
        return True
    return False

def add_history(db: Session, product_id: int, action: str, quantity: int, date: str):
    history = models.ProductHistory(
        product_id=product_id,
        action=action,
        quantity=quantity,
        date=date
    )
    db.add(history)
    db.commit() # Commit here? Or let service commit? 
    # Current codebase commits aggressively. I'll follow pattern.
    return history

def update_stock(db: Session, product: models.Product, quantity: int):
    product.stock_quantity += quantity
    db.commit()
    db.refresh(product)
    return product

def get_top_viewed(db: Session, limit: int = 4):
    return db.query(models.Product).order_by(models.Product.views.desc()).limit(limit).all()

def increment_views(db: Session, product: models.Product):
    product.views += 1
    db.commit()
