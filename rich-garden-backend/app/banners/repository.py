from sqlalchemy.orm import Session
from app.banners import models, schemas

def get_all(db: Session, active_only: bool = False):
    query = db.query(models.Banner)
    if active_only:
        query = query.filter(models.Banner.is_active == True)
    return query.order_by(models.Banner.sort_order.asc()).all()

def get_by_id(db: Session, banner_id: int):
    return db.query(models.Banner).filter(models.Banner.id == banner_id).first()

def create(db: Session, banner: schemas.BannerCreate):
    db_banner = models.Banner(**banner.model_dump())
    db.add(db_banner)
    db.commit()
    db.refresh(db_banner)
    return db_banner

def update(db: Session, banner_id: int, banner_data: schemas.BannerUpdate):
    db_banner = get_by_id(db, banner_id)
    if not db_banner:
        return None
    
    update_data = banner_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_banner, key, value)
    
    db.commit()
    db.refresh(db_banner)
    return db_banner

def delete(db: Session, banner_id: int):
    db_banner = get_by_id(db, banner_id)
    if not db_banner:
        return False
    
    db.delete(db_banner)
    db.commit()
    return True
