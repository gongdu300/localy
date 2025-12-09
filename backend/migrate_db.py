"""
Quick DB Migration: Add preferred_character column
Run this script once to fix the schema.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "localy.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(user)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'preferred_character' not in columns:
        print("Adding preferred_character column...")
        cursor.execute("ALTER TABLE user ADD COLUMN preferred_character TEXT")
        conn.commit()
        print("✅ Column added successfully!")
    else:
        print("✅ Column already exists!")
    
    conn.close()

if __name__ == "__main__":
    migrate()
