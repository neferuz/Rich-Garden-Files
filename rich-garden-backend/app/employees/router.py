from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from . import service, schemas

router = APIRouter(
    prefix="/employees",
    tags=["employees"]
)

@router.get("", response_model=List[schemas.Employee])
def get_employees(db: Session = Depends(get_db)):
    return service.get_all_employees(db)

@router.post("", response_model=schemas.Employee)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    return service.create_employee(db, employee)

@router.put("/{employee_id}", response_model=schemas.Employee)
def update_employee(employee_id: int, employee_update: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    return service.update_employee(db, employee_id, employee_update)

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    service.delete_employee(db, employee_id)
    return {"message": "Success"}

@router.get("/check/{telegram_id}", response_model=schemas.Employee)
def check_employee_access(telegram_id: int, db: Session = Depends(get_db)):
    # Helper endpoint to check if a user is an employee
    emp = service.check_access(db, telegram_id)
    if not emp:
         # Return partial/empty or 404? 404 is better for "not authorized" check
         from fastapi import HTTPException
         raise HTTPException(status_code=404, detail="Not an employee")
    return emp
