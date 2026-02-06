"""
Миграция: добавить колонку payme_receipt_id в orders (Subscribe API).
Запуск: cd /var/www/rich-garden/rich-garden-backend && python migrate_add_payme_receipt_id.py
"""
import os
import sys

# гарантируем загрузку .env из директории бэкенда
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

COLUMN_NAME = "payme_receipt_id"
TABLE_NAME = "orders"


def _is_postgres():
    url = os.getenv("DATABASE_URL", "") or ""
    return "postgresql" in url.lower()


def _column_exists_mysql(conn):
    """Проверка наличия колонки в MySQL."""
    r = conn.execute(text("""
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :tbl
          AND COLUMN_NAME = :col
    """), {"tbl": TABLE_NAME, "col": COLUMN_NAME})
    return r.fetchone() is not None


def run():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL не задан (проверьте .env)")
        sys.exit(1)

    with engine.connect() as conn:
        if _is_postgres():
            conn.execute(text(f"""
                ALTER TABLE {TABLE_NAME}
                ADD COLUMN IF NOT EXISTS {COLUMN_NAME} VARCHAR(255) NULL;
            """))
            conn.commit()
            print("OK (PostgreSQL): orders.payme_receipt_id добавлена (если не было).")
        else:
            # MySQL / MariaDB: IF NOT EXISTS для ADD COLUMN только в новых версиях
            try:
                if _column_exists_mysql(conn):
                    print("OK (MySQL): колонка orders.payme_receipt_id уже есть.")
                else:
                    conn.execute(text(f"""
                        ALTER TABLE {TABLE_NAME}
                        ADD COLUMN {COLUMN_NAME} VARCHAR(255) NULL;
                    """))
                    conn.commit()
                    print("OK (MySQL): orders.payme_receipt_id добавлена.")
            except Exception as e:
                if "Duplicate column" in str(e) or "1060" in str(e):
                    print("OK (MySQL): колонка orders.payme_receipt_id уже есть.")
                else:
                    raise


if __name__ == "__main__":
    run()
