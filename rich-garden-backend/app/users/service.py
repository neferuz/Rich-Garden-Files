from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository, schemas, models
from app.products import repository as product_repo
from app.products import models as product_models # for type hinting or access
# We might need to access orders. Using user.orders relationship.

def auth_telegram(db: Session, user: schemas.TelegramUserCreate):
    return repository.create_or_update_telegram_user(db, user)

def create_offline_client(db: Session, client: schemas.TelegramUserCreate):
    return repository.create_offline_user(db, client)

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

def get_client_orders(db: Session, client_id: int):
    user = repository.get_by_id(db, client_id)
    if not user:
        return []
    return sorted(user.orders, key=lambda x: x.created_at, reverse=True)

    return {"message": "User deleted successfully"}

async def send_broadcast(db: Session, text: str, filter_type: str = "all"):
    from app.services import telegram
    
    # helper query
    users = repository.get_all_clients(db)
    target_users = []
    
    for u in users:
        # Skip if no telegram_id (offline user)
        if not u.telegram_id:
            continue
            
        if filter_type == "all":
            target_users.append(u)
        elif filter_type == "purchased":
            # Check if user has orders
            if u.orders and len(u.orders) > 0:
                target_users.append(u)
        elif filter_type == "leads":
             if not u.orders or len(u.orders) == 0:
                target_users.append(u)

    success_count = 0
    fail_count = 0
    
    for user in target_users:
        res = await telegram.send_broadcast_message(user.telegram_id, text)
        if res:
            success_count += 1
        else:
            fail_count += 1
            
    return {
        "total": len(target_users),
        "success": success_count,
        "failed": fail_count
    }
