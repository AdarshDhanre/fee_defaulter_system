import sqlite3
import os

db_path = os.path.join('database', 'db.sqlite3')
new_db_path = os.path.join('database', 'db_recovered.sqlite3')

try:
    # Attempt to dump
    conn = sqlite3.connect(db_path)
    dump_sql = ""
    for line in conn.iterdump():
        dump_sql += line + '\n'
    conn.close()
    
    # Attempt to restore to new DB
    new_conn = sqlite3.connect(new_db_path)
    new_conn.executescript(dump_sql)
    new_conn.commit()
    new_conn.close()
    
    # If successful, replace the old DB
    os.remove(db_path)
    os.rename(new_db_path, db_path)
    print("Recovery successful!")

except Exception as e:
    print(f"Recovery failed: {e}")
