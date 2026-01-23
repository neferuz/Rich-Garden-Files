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

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    service.delete_order(db, order_id)
    return {"message": "Order deleted"}
