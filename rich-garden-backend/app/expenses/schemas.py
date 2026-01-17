from pydantic import BaseModel
from typing import Optional

class ExpenseBase(BaseModel):
    amount: int
    category: str
    note: str
    date: str

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    class Config:
        orm_mode = True
