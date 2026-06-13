import sqlite3
import os

db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "database", "db.sqlite3")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

columns = ["course", "year", "category"]

for col in columns:
    try:
        cur.execute(f"ALTER TABLE student ADD COLUMN {col} VARCHAR(50)")
        print(f"Added column {col}")
    except sqlite3.OperationalError as e:
        print(f"Error adding {col} (might already exist): {e}")

conn.commit()
conn.close()
print("Migration completed successfully.")
