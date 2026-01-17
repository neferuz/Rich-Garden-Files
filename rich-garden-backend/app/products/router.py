from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from . import service, schemas

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.get("", response_model=List[schemas.Product])
def get_products(category: str = None, search: str = None, db: Session = Depends(get_db)):
    return service.get_products(db, category, search)

@router.get("/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return service.get_product(db, product_id)

@router.post("", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return service.create_product(db, product)

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return service.update_product(db, product_id, product_update)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return service.delete_product(db, product_id)

@router.post("/{product_id}/supply", response_model=schemas.Product)
def supply_product(product_id: int, supply: schemas.ProductSupply, db: Session = Depends(get_db)):
    return service.supply_product(db, product_id, supply)
