from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from . import models, schemas

router = APIRouter(prefix="/wow-effects", tags=["Wow Effects"])

@router.get("/", response_model=List[schemas.WowEffect])
def get_wow_effects(db: Session = Depends(get_db)):
    return db.query(models.WowEffect).all()

@router.post("/", response_model=schemas.WowEffect)
def create_wow_effect(effect: schemas.WowEffectCreate, db: Session = Depends(get_db)):
    db_effect = models.WowEffect(**effect.model_dump())
    db.add(db_effect)
    db.commit()
    db.refresh(db_effect)
    return db_effect

@router.patch("/{effect_id}", response_model=schemas.WowEffect)
def update_wow_effect(effect_id: int, effect: schemas.WowEffectUpdate, db: Session = Depends(get_db)):
    db_effect = db.query(models.WowEffect).filter(models.WowEffect.id == effect_id).first()
    if not db_effect:
        raise HTTPException(status_code=404, detail="Effect not found")
    
    update_data = effect.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_effect, key, value)
    
    db.commit()
    db.refresh(db_effect)
    return db_effect

@router.delete("/{effect_id}")
def delete_wow_effect(effect_id: int, db: Session = Depends(get_db)):
    db_effect = db.query(models.WowEffect).filter(models.WowEffect.id == effect_id).first()
    if not db_effect:
        raise HTTPException(status_code=404, detail="Effect not found")
    
    db.delete(db_effect)
    db.commit()
    return {"message": "Effect deleted"}
