import sqlite3

# Connect to SQLite database
connection = sqlite3.connect("seo.db")

cursor = connection.cursor()

# Create Users Table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    fullname TEXT NOT NULL,

    email TEXT UNIQUE NOT NULL,

    password TEXT NOT NULL

)
""")

# Create Websites Table
cursor.execute("""
CREATE TABLE IF NOT EXISTS websites(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    website_url TEXT,

    seo_score INTEGER,

    content_score INTEGER,

    health_score INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)
""")

connection.commit()

connection.close()

print("Database Created Successfully")