from sqlalchemy.orm import Session
from fastapi import HTTPException
from . import repository, schemas, models
from app.expenses import service as expense_service
from app.expenses import schemas as expense_schemas
from app.users.models import RecentlyViewed
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

import json

def delete_product(db: Session, product_id: int):
    try:
        product = repository.get_by_id(db, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # RESTORE INGREDIENTS LOGIC
        # If it's a bouquet (has composition) and has stock, return ingredients to warehouse
        if product.stock_quantity > 0 and product.composition and product.composition != "[]":
            try:
                comp_list = json.loads(product.composition)
                if isinstance(comp_list, list):
                    for item in comp_list:
                        ing_id = item.get('id')
                        ing_qty = item.get('qty', 0)
                        if ing_id and ing_qty > 0:
                            ingredient = repository.get_by_id(db, ing_id)
                            if ingredient:
                                restore_amount = ing_qty * product.stock_quantity
                                repository.update_stock(db, ingredient, restore_amount)
                                # Add history record for ingredient
                                repository.add_history(
                                    db, 
                                    product_id=ingredient.id, 
                                    action="income", 
                                    quantity=restore_amount, 
                                    date=datetime.datetime.now().isoformat()
                                )
            except Exception as e:
                print(f"Error restoring ingredients: {e}")

        # Manually delete related records to avoid foreign key constraints
        # Delete recently_viewed records
        try:
            db.query(RecentlyViewed).filter(RecentlyViewed.product_id == product_id).delete()
            db.commit()
        except Exception as e:
            print(f"Error deleting recently_viewed: {e}")

        # Delete product history
        try:
            db.query(models.ProductHistory).filter(models.ProductHistory.product_id == product_id).delete()
            db.commit()
        except Exception as e:
            print(f"Error deleting history: {e}")

        success = repository.delete(db, product_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete product")
        return {"message": "Product deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL ERROR deleting product {product_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

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
