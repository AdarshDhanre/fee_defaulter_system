import sqlite3

conn = sqlite3.connect("database/db.sqlite3")
cursor = conn.cursor()
cursor.execute("SELECT id, student_id, file_path, status FROM offline_receipt")
rows = cursor.fetchall()
print("--- Offline Receipts ---")
for row in rows:
    print(f"ID: {row[0]}, Student ID: {row[1]}, File Path: {row[2]}, Status: {row[3]}")
conn.close()
