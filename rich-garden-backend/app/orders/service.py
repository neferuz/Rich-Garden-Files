
from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository, schemas
from typing import List
from app.services import telegram
import json

async def create_order(db: Session, order: schemas.OrderCreate):
    # 1. Create Order in DB
    db_order = repository.create(db, order)
    
    # 2. Prepare data for notification
    try:
        items = json.loads(db_order.items)
        items_detail = ""
        for item in items:
            name = item.get('name') or "Товар"
            qty = item.get('quantity') or 1
            items_detail += f"- {name} x{qty}\n"
    except:
        items_detail = "Детали заказа не распознаны"

    # 3. Send Notification (Async)
    # We call await here because this function will be called from an async router
    # Prepare extras display
    try:
            extras_data = json.loads(db_order.extras) if db_order.extras else {}
    except:
            extras_data = {}

    order_dict = {
        "id": db_order.id,
        "status": db_order.status,
        "customer_name": db_order.customer_name,
        "customer_phone": db_order.customer_phone,
        "address": db_order.address,
        "total_price": db_order.total_price,
        "payment_method": db_order.payment_method,
        "comment": db_order.comment,
        "extras": extras_data
    }
    
    msg_id = await telegram.send_order_notification(order_dict, items_detail)
    
    # 4. Save Message ID if sent
    if msg_id:
        repository.update_telegram_message_id(db, db_order.id, msg_id)
        
    return db_order

def get_orders(db: Session):
    return repository.get_all(db)

def get_order(db: Session, order_id: int):
    order = repository.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

def get_user_orders(db: Session, user_id: int):
    return repository.get_by_user_id(db, user_id)

async def update_order_status(db: Session, order_id: int, status_update: schemas.OrderUpdateStatus):
    # 1. Update DB Status
    order = repository.update_status(db, order_id, status_update)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # 2. Update Telegram Message
    if order.telegram_message_id:
        try:
            items = json.loads(order.items)
            items_detail = ""
            for item in items:
                name = item.get('name') or "Товар"
                qty = item.get('quantity') or 1
                items_detail += f"- {name} x{qty}\n"
        except:
             items_detail = "Детали заказа не распознаны"

        # Prepare extras display
        try:
             extras_data = json.loads(order.extras) if order.extras else {}
             logger_extras = extras_data # Just temporary var name
        except:
             extras_data = {}

        order_dict = {
            "id": order.id,
            "status": order.status,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone,
            "address": order.address,
            "total_price": order.total_price,
            "payment_method": order.payment_method,
            "comment": order.comment,
            "extras": extras_data
        }
        
        await telegram.update_order_status_message(order.telegram_message_id, order_dict, items_detail)
        
    return order
