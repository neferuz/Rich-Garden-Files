
from app.database import SessionLocal
from app.employees.models import Employee

def add_owner():
    db = SessionLocal()
    owner_id = 670031187
    
    existing = db.query(Employee).filter(Employee.telegram_id == owner_id).first()
    if existing:
        print(f"User {owner_id} already exists as {existing.role}")
        existing.role = "owner"
        db.commit()
        print("Updated role to owner")
    else:
        owner = Employee(
            telegram_id=owner_id,
            full_name="Owner",
            role="owner",
            is_active=True
        )
        db.add(owner)
        db.commit()
        print(f"Created new owner with ID {owner_id}")
    
    db.close()

if __name__ == "__main__":
    add_owner()
