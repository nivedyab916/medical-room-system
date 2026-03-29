import sqlite3

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

# Students table
cursor.execute("""
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    roll TEXT UNIQUE NOT NULL,
    room TEXT NOT NULL,
    phone TEXT NOT NULL
)
""")

# Medicines table
cursor.execute("""
CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    qty INTEGER NOT NULL,
    expiry TEXT NOT NULL
)
""")

# History table
cursor.execute("""
CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    roll TEXT NOT NULL,
    room TEXT NOT NULL,
    medicine TEXT NOT NULL,
    qty INTEGER NOT NULL,
    reason TEXT NOT NULL,
    date TEXT NOT NULL
)
""")

conn.commit()
conn.close()

print("Database and tables created successfully!")