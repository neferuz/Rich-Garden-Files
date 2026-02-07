from sqlalchemy.orm import Session
from fastapi import HTTPException    
from . import repository, schemas, models
from app.products import repository as product_repo
from app.products import models as product_models 
import asyncio

def auth_telegram(db: Session, user: schemas.TelegramUserCreate):
    return repository.create_or_update_telegram_user(db, user)

def create_offline_client(db: Session, client: schemas.TelegramUserCreate):
    from datetime import date
    db_user = repository.create_offline_user(db, client)
    if db_user.birth_date and isinstance(db_user.birth_date, date):
        db_user.birth_date = db_user.birth_date.isoformat()
    return db_user

def get_clients(db: Session):
    from datetime import date, datetime
    users = repository.get_all_clients(db)
    for user in users:
        user_orders = user.orders 
        user.orders_count = len(user_orders)
        user.total_spent = sum(o.total_price for o in user_orders)
        
        # Fallback phone from last order if missing
        if not user.phone_number and user_orders:
             # Sort orders by date to get the latest one
             sorted_orders = sorted(user_orders, key=lambda x: x.created_at, reverse=True)
             last_phone = sorted_orders[0].customer_phone
             if last_phone and last_phone not in ["Уточнить", "Не указан", "Clarify"]:
                 user.phone_number = last_phone

        if user.birth_date:
            if isinstance(user.birth_date, date):
                user.birth_date = user.birth_date.isoformat()
            elif isinstance(user.birth_date, datetime):
                user.birth_date = user.birth_date.date().isoformat()
        else:
            user.birth_date = None
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
    product = product_repo.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_repo.increment_views(db, product)
    
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

def get_user_by_telegram_id(db: Session, telegram_id: int):
    return repository.get_by_telegram_id(db, telegram_id)

def get_user_orders(db: Session, telegram_id: int):
    # Bypass for development/browser testing
    if telegram_id == 12345678:
        from app.orders import repository as order_repo
        return order_repo.get_all(db)

    user = repository.get_by_telegram_id(db, telegram_id)
    if not user:
        return []
    return sorted(user.orders, key=lambda x: x.created_at, reverse=True)

def get_client_orders(db: Session, client_id: int):
    user = repository.get_by_id(db, client_id)
    if not user:
        return []
    return sorted(user.orders, key=lambda x: x.created_at, reverse=True)

def delete_user(db: Session, user_id: int):
    return repository.delete_user(db, user_id)

async def send_broadcast(db: Session, text: str, filter_type: str = "all"):
    from app.services import telegram
    
    # 1. Create query depending on filter
    if filter_type == "purchased":
        target_users = repository.get_users_purchased(db)
    elif filter_type == "leads":
        target_users = repository.get_users_leads(db)
    else:
        target_users = repository.get_all_clients(db)

    # Filter out offline users (no telegram_id)
    valid_users = [u for u in target_users if u.telegram_id]
    
    if not valid_users:
        return {
            "total": 0,
            "success": 0,
            "failed": 0
        }

    # 2. Send concurrently with Semaphore
    semaphore = asyncio.Semaphore(20) # Max 20 concurrent requests
    
    async def send_one(user):
        async with semaphore:
            try:
                # Slight delay to smooth out traffic spike
                await asyncio.sleep(0.05)
                return await telegram.send_broadcast_message(user.telegram_id, text)
            except Exception as e:
                print(f"Error sending broadcast to {user.telegram_id}: {e}")
                return False

    tasks = [send_one(u) for u in valid_users]
    results = await asyncio.gather(*tasks)

    success_count = results.count(True)
    fail_count = results.count(False)
            
    return {
        "total": len(valid_users),
        "success": success_count,
        "failed": fail_count
    }

def update_user_phone(db: Session, telegram_id: int, phone_number: str):
    user = repository.get_by_telegram_id(db, telegram_id)
    if not user:
        from . import schemas
        user_data = schemas.TelegramUserCreate(
            telegram_id=telegram_id,
            phone_number=phone_number,
            first_name="Клиент"
        )
        return repository.create_or_update_telegram_user(db, user_data)
    
    user.phone_number = phone_number
    db.commit()
    db.refresh(user)
    return user
