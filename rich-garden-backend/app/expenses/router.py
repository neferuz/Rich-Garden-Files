from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from . import service, schemas

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)

@router.post("", response_model=schemas.Expense)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    return service.create_expense(db, expense)

@router.get("", response_model=List[schemas.Expense])
def get_expenses(db: Session = Depends(get_db)):
    return service.get_expenses(db)
