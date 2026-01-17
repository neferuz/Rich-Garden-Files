from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import models, schemas
import datetime

def get_by_telegram_id(db: Session, telegram_id: int):
    return db.query(models.TelegramUser).filter(models.TelegramUser.telegram_id == telegram_id).first()

def get_by_id(db: Session, user_id: int):
    return db.query(models.TelegramUser).filter(models.TelegramUser.id == user_id).first()

def create_or_update_telegram_user(db: Session, user: schemas.TelegramUserCreate):
    db_user = get_by_telegram_id(db, user.telegram_id)
    if not db_user:
        try:
            db_user = models.TelegramUser(**user.dict())
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        except IntegrityError:
            db.rollback()
            db_user = get_by_telegram_id(db, user.telegram_id)
            if db_user:
                # Update
                _update_user_fields(db, db_user, user)
    else:
        _update_user_fields(db, db_user, user)
        
    return db_user

def _update_user_fields(db: Session, db_user: models.TelegramUser, user_data: schemas.TelegramUserCreate):
    db_user.first_name = user_data.first_name
    db_user.username = user_data.username
    db_user.photo_url = user_data.photo_url
    if user_data.phone_number:
        db_user.phone_number = user_data.phone_number
    db.commit()
    db.refresh(db_user)

def get_all_clients(db: Session):
    return db.query(models.TelegramUser).order_by(models.TelegramUser.created_at.desc()).all()

def create_address(db: Session, telegram_id: int, address: schemas.AddressCreate):
    user = get_by_telegram_id(db, telegram_id)
    if not user:
        return None
    
    db_address = models.Address(**address.dict(), user_id=user.id)
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

def get_addresses(db: Session, telegram_id: int):
    user = get_by_telegram_id(db, telegram_id)
    if not user:
        return []
    return user.addresses

def get_recent_views(db: Session, telegram_id: int, limit: int = 10):
    user = get_by_telegram_id(db, telegram_id)
    if not user:
        return []
    
    return db.query(models.RecentlyViewed).filter(models.RecentlyViewed.user_id == user.id)\
             .order_by(models.RecentlyViewed.viewed_at.desc()).limit(limit).all()

def add_recent_view(db: Session, telegram_id: int, product_id: int):
    user = get_by_telegram_id(db, telegram_id)
    if not user:
        return None 
    
    recent = db.query(models.RecentlyViewed).filter(
        models.RecentlyViewed.user_id == user.id,
        models.RecentlyViewed.product_id == product_id
    ).first()

    if recent:
        recent.viewed_at = datetime.datetime.now()
    else:
        recent = models.RecentlyViewed(user_id=user.id, product_id=product_id)
        db.add(recent)
    db.commit()
    return True

def delete_user(db: Session, user_id: int):
    db_user = get_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False
