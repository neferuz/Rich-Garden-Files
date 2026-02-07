from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(SQLALCHEMY_DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, full_name, telegram_id, photo_url FROM employees"))
    for row in result:
        print(f"ID: {row.id}, Name: {row.full_name}, TG: {row.telegram_id}, Photo: {row.photo_url}")
