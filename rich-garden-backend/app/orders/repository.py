from sqlalchemy.orm import Session, joinedload
from . import models, schemas
import json
import datetime
from app.users import repository as user_repo

def create(db: Session, order: schemas.OrderCreate):
    order_data = order.dict()
    telegram_id = order_data.pop("telegram_id", None)
    
    # Init history
    initial_history = [{
        "status": "new",
        "time": datetime.datetime.now().strftime("%d.%m.%Y %H:%M"),
        "active": True
    }]
    order_data["history"] = json.dumps(initial_history)
    
    db_order = models.Order(**order_data)
    
    if telegram_id:
        user = user_repo.get_by_telegram_id(db, telegram_id)
        if user:
            db_order.user_id = user.id
            if db_order.customer_name == "Гость" or not db_order.customer_name:
                db_order.customer_name = user.first_name
            
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def get_all(db: Session):
    return db.query(models.Order).options(joinedload(models.Order.user)).order_by(models.Order.created_at.desc()).all()

def get_by_id(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_by_user_id(db: Session, user_id: int):
    return db.query(models.Order).filter(models.Order.user_id == user_id).order_by(models.Order.created_at.desc()).all()

def update_status(db: Session, order_id: int, status_update: schemas.OrderUpdateStatus):
    order = get_by_id(db, order_id)
    if not order:
        return None
    
    new_status = status_update.status
    if new_status:
        order.status = new_status
        
        # Update history
        history = json.loads(order.history) if order.history else []
        
        # Deactivate previous
        for h in history:
            h['active'] = False
            
        history.insert(0, {
            "status": new_status,
            "time": datetime.datetime.now().strftime("%d.%m.%Y %H:%M"),
            "active": True
        })
        order.history = json.dumps(history)
        
    db.commit()
    db.refresh(order)
    return order

def update_telegram_message_id(db: Session, order_id: int, message_id: int):
    order = get_by_id(db, order_id)
    if order:
        order.telegram_message_id = message_id
        db.commit()

def delete(db: Session, order_id: int):
    order = get_by_id(db, order_id)
    if order:
        db.delete(order)
        db.commit()


