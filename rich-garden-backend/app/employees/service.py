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

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    existing = repository.get_by_telegram_id(db, employee.telegram_id)
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this Telegram ID already exists")
    return repository.create_employee(db, employee)

def update_employee(db: Session, employee_id: int, employee_update: schemas.EmployeeUpdate):
    return repository.update_employee(db, employee_id, employee_update)

def delete_employee(db: Session, employee_id: int):
    return repository.delete_employee(db, employee_id)

def check_access(db: Session, telegram_id: int):
    emp = repository.get_by_telegram_id(db, telegram_id)
    if not emp:
        return None
    return emp
