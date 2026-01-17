from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from . import service, schemas

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

@router.post("", response_model=schemas.Order)
async def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    return await service.create_order(db, order)

@router.get("", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db)):
    return service.get_orders(db)

@router.get("/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return service.get_order(db, order_id)

@router.put("/{order_id}/status", response_model=schemas.Order)
async def update_order_status(order_id: int, status_update: schemas.OrderUpdateStatus, db: Session = Depends(get_db)):
    return await service.update_order_status(db, order_id, status_update)
