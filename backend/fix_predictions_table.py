"""
Fix predictions table - add missing feature_names column
"""
from src.db import engine
from sqlalchemy import text

print("Adding missing column to predictions table...")

try:
    with engine.connect() as conn:
        # Add feature_names column if it doesn't exist
        conn.execute(text("ALTER TABLE predictions ADD COLUMN feature_names TEXT"))
        conn.commit()
        print("✅ Column 'feature_names' added successfully!")
except Exception as e:
    if "duplicate column name" in str(e).lower():
        print("✅ Column 'feature_names' already exists!")
    else:
        print(f"❌ Error: {e}")

print("\n✅ Database migration complete!")
