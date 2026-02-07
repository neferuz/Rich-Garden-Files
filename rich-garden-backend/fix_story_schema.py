import sys
import os
from sqlalchemy import text, create_engine
from dotenv import load_dotenv

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not set in environment")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def fix_schema():
    print(f"Connecting to database...")
    with engine.connect() as conn:
        print("Dropping table 'story_views' to force schema update (BigInteger)...")
        # Cascade ensures dependent constraints are handled if any (though StoryView usually has none depending on it)
        conn.execute(text("DROP TABLE IF EXISTS story_views CASCADE"))
        conn.commit()
        print("Table 'story_views' dropped successfully.")
        print("Please restart the backend server to recreate the table with the correct schema.")

if __name__ == "__main__":
    fix_schema()
