import sqlite3
from pathlib import Path


def initialize_database(database_path=None):
    path = Path(database_path or Path(__file__).resolve().parent / "seo.db")
    connection = sqlite3.connect(path)
    cursor = connection.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS websites(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        website_url TEXT,
        seo_score INTEGER,
        content_score INTEGER,
        health_score INTEGER,
        full_result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    connection.commit()
    connection.close()