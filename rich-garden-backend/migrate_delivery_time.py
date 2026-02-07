import sqlite3
import os

db_path = "/Users/notferuz/Desktop/Rich-Garden-Files-main/rich-garden-backend/rich-garden.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN delivery_time TEXT")
        print("Column delivery_time added successfully to orders table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column delivery_time already exists.")
        else:
            print(f"Error: {e}")
    conn.commit()
    conn.close()
else:
    print(f"Database not found at {db_path}")
