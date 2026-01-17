import sys
import os
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

# Add the project root to sys.path to import app
sys.path.append(os.getcwd())

from app.database import engine, Base
from app.stories import models

def run_migration():
    print("Running manual migration...")
    with engine.connect() as conn:
        # Add content_type to stories if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE stories ADD COLUMN content_type VARCHAR DEFAULT 'image'"))
            conn.commit()
            print("Added content_type column to stories table.")
        except Exception as e:
            print(f"Adding content_type failed (might already exist): {e}")
            conn.rollback()

        # Create story_views table if it doesn't exist
        try:
            # We can use metadata to create only missing tables
            models.Base.metadata.create_all(bind=engine, tables=[models.StoryView.__table__])
            print("Ensured story_views table exists.")
        except Exception as e:
            print(f"Failed to create story_views table: {e}")

    print("Migration finished.")

if __name__ == "__main__":
    run_migration()
