from src.db import SessionLocal
from sqlalchemy import text
db = SessionLocal()
rows = db.execute(text(
    "SELECT triggered_value, message FROM alerts WHERE triggered_value LIKE '%.%' LIMIT 8"
)).fetchall()
for tv, msg in rows:
    print(f"  triggered_value: {repr(tv)}")
    print(f"  message: {msg[:90]}")
    print()
db.close()
