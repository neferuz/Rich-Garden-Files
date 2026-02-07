from sqlalchemy.orm import Session
from . import repository, schemas, models
from fastapi import HTTPException

def get_all_employees(db: Session):
    return repository.get_employees(db)

def get_employee(db: Session, employee_id: int):
    emb = repository.get_employee(db, employee_id)
    if not emb:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emb

async def create_employee(db: Session, employee: schemas.EmployeeCreate):
    from app.services import telegram
    
    # Check if employee already exists
    existing = repository.get_by_telegram_id(db, employee.telegram_id)
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this Telegram ID already exists")
    
    # Try to get user photo (optional, don't fail if it fails)
    photo_url = None
    try:
        photo_url = await telegram.get_chat_photo(employee.telegram_id)
    except Exception as e:
        print(f"Warning: Could not get photo for user {employee.telegram_id}: {e}")
        # Continue without photo
    
    return repository.create_employee(db, employee, photo_url=photo_url)

async def update_employee(db: Session, employee_id: int, employee_update: schemas.EmployeeUpdate):
    from app.services import telegram
    
    # If telegram_id is updated, try to refresh photo
    if employee_update.telegram_id is not None:
        try:
            photo_url = await telegram.get_chat_photo(employee_update.telegram_id)
            if photo_url:
                employee_update.photo_url = photo_url
        except Exception as e:
            print(f"Warning: Could not refresh photo for updated user {employee_update.telegram_id}: {e}")

    return repository.update_employee(db, employee_id, employee_update)

def delete_employee(db: Session, employee_id: int):
    return repository.delete_employee(db, employee_id)

async def check_access(db: Session, telegram_id: int, username: str = None):
    emp = repository.get_by_telegram_id(db, telegram_id)
    if not emp:
        return None
    
    # Update info if missing
    needs_update = False
    update_data = {}
    
    if username and not emp.username:
        update_data['username'] = username
        needs_update = True
        
    if not emp.photo_url:
        from app.services import telegram
        photo_url = await telegram.get_chat_photo(telegram_id)
        if photo_url:
            update_data['photo_url'] = photo_url
            needs_update = True
            
    if needs_update:
        repository.update_employee(db, emp.id, schemas.EmployeeUpdate(**update_data))
        db.refresh(emp)
        
    return emp
