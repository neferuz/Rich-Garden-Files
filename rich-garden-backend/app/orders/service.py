
from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository, schemas
from typing import List
from app.services import telegram
import json

async def notify_new_order(db: Session, db_order: schemas.Order, telegram_id: int = None):
    print(f"DEBUG notify_new_order: Called for order {db_order.id}, payment_method: {db_order.payment_method}")
    # Prepare data for notification
    items_detail = ""
    image_strings = [] # Store image URLs or paths

    try:
        items = json.loads(db_order.items)
        if isinstance(items, list):
            from app.products import repository as prod_repo
            
            for item in items:
                name = item.get('name')
                img = item.get('image')
                
                # If missing name or image, try to fetch from DB product
                if (not name or not img) and item.get('id'):
                    p = prod_repo.get_by_id(db, int(item.get('id')))
                    if p:
                        if not name: name = p.name
                        if not img: img = p.image
                
                name = name or "Товар"
                qty = item.get('quantity') or 1
                items_detail += f"{name} - {qty} шт.\n"
                
                if img:
                    # Add image per quantity? No, usually just one photo per product type
                    # Or per item entry. User said "if 2 photos ordered, 2 photos come".
                    # If I order 51 Tulips x 1, it's 1 photo.
                    # If I order Tulip x 1 and Rose x 1, it's 2 photos.
                    # So we collect one image per line item.
                    image_strings.append(img)
        else:
            items_detail = "Детали заказа: " + str(items)
    except Exception as e:
        print(f"ERROR: Error parsing items for notification: {e}")
        import traceback
        traceback.print_exc()
        items_detail = "Детали заказа не распознаны"

    # Send Notification to Admin Group
    try:
        print(f"DEBUG notify_new_order: Preparing order_dict for order {db_order.id}")
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
            "extras": extras_data,
            "delivery_time": db_order.delivery_time
        }
        
        # 1. Admin Notification
        print(f"DEBUG notify_new_order: Calling send_order_notification for order {db_order.id}")
        msg_id = await telegram.send_order_notification(order_dict, items_detail, images=image_strings)
        print(f"DEBUG notify_new_order: send_order_notification returned message_id: {msg_id}")
        if msg_id:
            repository.update_telegram_message_id(db, db_order.id, msg_id)
            print(f"DEBUG notify_new_order: Updated telegram_message_id for order {db_order.id}")
            
        # 2. Customer Receipt
        # Priority: Linked User -> Manual Telegram ID
        sent_to_user = False
        
        if db_order.user_id:
            try:
                from app.users import repository as user_repo
                user = user_repo.get_by_id(db, db_order.user_id)
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
        else:
            print(f"ERROR notify_new_order: No message_id returned for order {db_order.id}")
            
    except Exception as e:
        print(f"ERROR: Exception during order notification: {e}")
        import traceback
        traceback.print_exc()
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
    payment_method = str(db_order.payment_method).lower().strip() if db_order.payment_method else None
    print(f"DEBUG: Order created - ID: {db_order.id}, Payment method: '{db_order.payment_method}' (normalized: '{payment_method}')")
    
    if payment_method == 'cash':
        print(f"DEBUG: Sending notification for cash order {db_order.id}")
        await notify_new_order(db, db_order, telegram_id)
    else:
        print(f"DEBUG: Skipping notification for order {db_order.id} (payment_method: '{payment_method}')")
        print(f"DEBUG: Note: Online payments (click/payme) will be notified after successful payment")
        
    return db_order

def get_orders(db: Session, status: str = None):
    return repository.get_all(db, status=status)

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
            "extras": extras_data,
            "delivery_time": order.delivery_time
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

