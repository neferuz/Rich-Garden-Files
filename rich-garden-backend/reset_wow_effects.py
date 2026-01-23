from app.database import engine, Base
from sqlalchemy import text
from app.wow_effects import models # Ensure model is imported

def reset():
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS wow_effects"))
        conn.commit()
    
    # Recreate all tables (including wow_effects with new column)
    Base.metadata.create_all(bind=engine)
    print("Table wow_effects reset successfully.")

if __name__ == "__main__":
    reset()
