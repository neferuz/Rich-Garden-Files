from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE banners ADD COLUMN IF NOT EXISTS title_color VARCHAR DEFAULT '#000000'"))
        conn.execute(text("ALTER TABLE banners ADD COLUMN IF NOT EXISTS subtitle_color VARCHAR DEFAULT '#000000'"))
        conn.execute(text("ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_text_color VARCHAR DEFAULT '#FFFFFF'"))
        conn.execute(text("ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_bg_color VARCHAR DEFAULT '#000000'"))
        conn.commit()
    print("Migration done")

if __name__ == "__main__":
    migrate()
