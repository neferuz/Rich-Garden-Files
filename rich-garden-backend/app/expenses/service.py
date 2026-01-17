from sqlalchemy.orm import Session
from . import repository, schemas

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    return repository.create(db, expense)

def get_expenses(db: Session):
    return repository.get_all(db)
