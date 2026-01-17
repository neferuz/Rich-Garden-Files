from sqlalchemy import Boolean, Column, Integer, String
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer)
    category = Column(String)
    note = Column(String)
    date = Column(String)
