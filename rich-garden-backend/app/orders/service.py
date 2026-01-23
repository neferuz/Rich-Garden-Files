
from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository, schemas
from typing import List
from app.services import telegram
import json

async def notify_new_order(db: Session, db_order: schemas.Order, telegram_id: int = None):
    # Prepare data for notification
    items_detail = ""
    try:
        items = json.loads(db_order.items)
        if isinstance(items, list):
            for item in items:
                name = item.get('name')
                if not name and item.get('id'):
                    from app.products import repository as prod_repo
                    p = prod_repo.get_by_id(db, int(item.get('id')))
                    if p:
                        name = p.name
                
                name = name or "Товар"
                qty = item.get('quantity') or 1
                items_detail += f"- {name} x{qty}\n"
        else:
            items_detail = "Детали заказа: " + str(items)
    except Exception as e:
        print(f"Error parsing items for notification: {e}")
        items_detail = "Детали заказа не распознаны"

    # Send Notification to Admin Group
    try:
        extras_data = {}
        if db_order.extras:
            try:
                extras_data = json.loads(db_order.extras) if isinstance(db_order.extras, str) else db_order.extras
            except:
                pass

        order_dict = {
            "id": db_order.id,
            "status": db_order.status,
            "customer_name": db_order.customer_name or "Гость",
            "customer_phone": db_order.customer_phone or "Не указан",
            "address": db_order.address,
            "total_price": db_order.total_price or 0,
            "payment_method": db_order.payment_method,
            "comment": db_order.comment,
            "extras": extras_data
        }
        
        # 1. Admin Notification
        msg_id = await telegram.send_order_notification(order_dict, items_detail)
        if msg_id:
            repository.update_telegram_message_id(db, db_order.id, msg_id)
            
        # 2. Customer Receipt
        # Priority: Linked User -> Manual Telegram ID
        sent_to_user = False
        
        if db_order.user_id:
            try:
                from app.users import repository as user_repo
                user = user_repo.get(db, db_order.user_id)
                if user and user.telegram_id:
                     await telegram.send_customer_receipt(user.telegram_id, order_dict, items_detail)
                     sent_to_user = True
            except Exception as e:
                print(f"Failed to send receipt to linked user: {e}")
        
        if not sent_to_user and telegram_id:
            # Fallback to provided telegram_id (e.g. Guest with known ID or manual)
             await telegram.send_customer_receipt(telegram_id, order_dict, items_detail)

        if msg_id:
            return msg_id
            
    except Exception as e:
        print(f"Error during order notification: {e}")
    return None

async def create_order(db: Session, order: schemas.OrderCreate):
    # Capture telegram_id before it might be consumed/modified (though here it's input schema)
    telegram_id = order.telegram_id
    
    # 1. Create Order in DB
    try:
        db_order = repository.create(db, order)
    except Exception as e:
        print(f"Database error during order creation: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    # 2. Only notify immediately if it's CASH
    # For Click/Payme, notification will be sent after successful payment
    if db_order.payment_method == 'cash':
        await notify_new_order(db, db_order, telegram_id)
        
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
    
    # 2. Update/Send Telegram Notification
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

        extras_data = {}
        if order.extras:
            try:
                 extras_data = json.loads(order.extras) if isinstance(order.extras, str) else order.extras
            except:
                 pass

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
    else:
        # If notification wasn't sent yet (e.g. for deferred online payments)
        # and it's now 'paid' or admin manually updated status, send it now.
        if order.status != 'pending_payment':
            await notify_new_order(db, order)
        
        
    return order

def delete_order(db: Session, order_id: int):
    # Optional: Delete telegram message if exists
    repository.delete(db, order_id)

