from app import models, database
from sqlalchemy.orm import Session

db = database.SessionLocal()
try:
    print("Querying products...")
    products = db.query(models.Product).all()
    print(f"Found {len(products)} products")
    for p in products:
        print(f"ID: {p.id}, Name: {p.name}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
