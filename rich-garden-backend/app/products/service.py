from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository, schemas, models
from app.expenses import service as expense_service
from app.expenses import schemas as expense_schemas
import datetime

def get_products(db: Session, category: str = None, search: str = None):
    return repository.get_all(db, category, search)

def get_product(db: Session, product_id: int):
    product = repository.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

def create_product(db: Session, product: schemas.ProductCreate):
    return repository.create(db, product)

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    # Logic for stock history
    db_product = repository.get_by_id(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    old_stock = db_product.stock_quantity
    updated_product = repository.update(db, product_id, product_update)
    
    # Check if stock changed (this logic was in main.py)
    # Since repository.update already commits, we can just check objects
    # But repository.update updates the object in place attached to session.
    
    if "stock_quantity" in product_update.dict(exclude_unset=True) and old_stock != updated_product.stock_quantity:
        diff = updated_product.stock_quantity - old_stock
        if diff != 0:
            repository.add_history(
                db, 
                product_id=updated_product.id,
                action="income" if diff > 0 else "writeoff",
                quantity=abs(diff),
                date=datetime.datetime.now().isoformat()
            )
            
    return updated_product

def delete_product(db: Session, product_id: int):
    success = repository.delete(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

def supply_product(db: Session, product_id: int, supply: schemas.ProductSupply):
    product = repository.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update product fields
    product.cost_price = supply.cost_price
    if supply.supplier:
        product.supplier = supply.supplier
    
    # Update stock
    repository.update_stock(db, product, supply.quantity)
    
    # Add History
    repository.add_history(
        db,
        product_id=product.id,
        action="income",
        quantity=supply.quantity,
        date=datetime.datetime.now().isoformat()
    )
    
    # Create Expense
    total_cost = supply.quantity * supply.cost_price
    if total_cost > 0:
        expense = expense_schemas.ExpenseCreate(
            amount=total_cost,
            category="Закупка",
            note=f"Поставка: {product.name} ({supply.quantity} шт) {f'от {supply.supplier}' if supply.supplier else ''}",
            date=datetime.datetime.now().isoformat()
        )
        expense_service.create_expense(db, expense)
        
    return product
