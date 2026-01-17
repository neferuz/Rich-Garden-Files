from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository, schemas, models
from app.products import repository as product_repo
from app.products import models as product_models # for type hinting or access
# We might need to access orders. Using user.orders relationship.

def auth_telegram(db: Session, user: schemas.TelegramUserCreate):
    return repository.create_or_update_telegram_user(db, user)

def get_clients(db: Session):
    users = repository.get_all_clients(db)
    # Compute stats
    for user in users:
        # access relationship.
        # This requires Order model to be mapped.
        user_orders = user.orders 
        user.orders_count = len(user_orders)
        user.total_spent = sum(o.total_price for o in user_orders)
    return users

def get_recent_products(db: Session, telegram_id: int):
    recents = repository.get_recent_views(db, telegram_id)
    products = []
    seen = set()
    for r in recents:
        if r.product_id not in seen:
            products.append(r.product)
            seen.add(r.product_id)
    return products

def add_recent_product(db: Session, telegram_id: int, product_id: int):
    # Check product exists
    product = product_repo.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Increment global views
    product_repo.increment_views(db, product)
    
    # Add to user history
    success = repository.add_recent_view(db, telegram_id, product_id)
    if not success:
         raise HTTPException(status_code=404, detail="User not found")
         
    return {"message": "OK"}

def create_address(db: Session, telegram_id: int, address: schemas.AddressCreate):
    res = repository.create_address(db, telegram_id, address)
    if not res:
        raise HTTPException(status_code=404, detail="User not found")
    return res

def get_addresses(db: Session, telegram_id: int):
    return repository.get_addresses(db, telegram_id)

def get_user_orders(db: Session, telegram_id: int):
    user = repository.get_by_telegram_id(db, telegram_id)
    if not user:
        return []
    # Sort orders by created_at desc
    return sorted(user.orders, key=lambda x: x.created_at, reverse=True)

def delete_user(db: Session, user_id: int):
    success = repository.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}
