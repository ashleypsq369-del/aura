"""
Fix predictions table - add all missing columns
"""
from src.db import engine
from sqlalchemy import text

print("Fixing predictions table - adding all missing columns...")

columns_to_add = [
    ("feature_names", "TEXT"),
    ("base_value", "REAL"),
]

with engine.connect() as conn:
    for column_name, column_type in columns_to_add:
        try:
            sql = f"ALTER TABLE predictions ADD COLUMN {column_name} {column_type}"
            conn.execute(text(sql))
            conn.commit()
            print(f"✅ Added column '{column_name}' ({column_type})")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print(f"✅ Column '{column_name}' already exists!")
            else:
                print(f"⚠️  Error adding '{column_name}': {e}")

print("\n✅ Database migration complete!")
print("\nAll required columns:")
print("  - feature_names (TEXT)")
print("  - base_value (REAL)")
