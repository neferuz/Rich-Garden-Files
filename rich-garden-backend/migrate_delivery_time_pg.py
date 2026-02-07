from app.database import engine
from sqlalchemy import text

def migrate():
    print("Starting migration...")
    with engine.connect() as conn:
        try:
            # Postgres syntax for adding column if not exists is tricky in one line, 
            # usually expect error if exists or check information_schema.
            # simpler to just try add and catch error.
            conn.execute(text("ALTER TABLE orders ADD COLUMN delivery_time VARCHAR"))
            conn.commit()
            print("Successfully added delivery_time column")
        except Exception as e:
            print(f"Migration info: {e}")

if __name__ == "__main__":
    migrate()
