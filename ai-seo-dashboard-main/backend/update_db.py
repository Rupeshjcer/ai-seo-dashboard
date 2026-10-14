import sqlite3
import sys

conn = sqlite3.connect('seo.db')
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE websites ADD COLUMN full_result TEXT;")
    conn.commit()
    print("Column added successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column already exists.")
    else:
        print(f"Error: {e}")
conn.close()
