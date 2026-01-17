from app import database
from sqlalchemy import text

db = database.SessionLocal()
try:
    print("Migrating products table...")
    # Add all possibly missing columns
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0"))
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0"))
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS composition VARCHAR DEFAULT '[]'"))
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR DEFAULT 'шт'"))
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_ingredient BOOLEAN DEFAULT FALSE"))
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS price_raw INTEGER DEFAULT 0"))
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS images VARCHAR DEFAULT '[]'"))
    db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0"))
    db.execute(text("ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS phone_number VARCHAR"))
    
    # Create addresses table if not exists (raw sql for simplicity in this migration script)
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS addresses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES telegram_users(id),
            title VARCHAR,
            address VARCHAR,
            info VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))

    # Create expenses table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            amount INTEGER,
            category VARCHAR,
            note VARCHAR,
            date VARCHAR
        )
    """))

    # Create orders table
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES telegram_users(id),
            customer_name VARCHAR,
            customer_phone VARCHAR,
            total_price INTEGER,
            status VARCHAR DEFAULT 'new',
            items VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    # Add user_id column to orders if it doesn't exist
    try:
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES telegram_users(id)"))
    except Exception:
        pass 
    
    # Add created_at column to orders if it doesn't exist
    try:
        db.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
    except Exception:
        pass

    db.commit()
    print("Migration successful")
except Exception as e:
    print(f"Migration failed (might be acceptable if cols exist): {e}")
finally:
    db.close()
