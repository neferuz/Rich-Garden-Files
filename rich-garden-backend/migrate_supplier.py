from app import database
from sqlalchemy import text

db = database.SessionLocal()
try:
    print("Migrating products table for supplier...")
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier VARCHAR"))
    db.commit()
    print("Migration successful")
except Exception as e:
    print(f"Migration failed (might be acceptable if cols exist): {e}")
finally:
    db.close()
