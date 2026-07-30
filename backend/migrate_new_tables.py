"""
Migration: Create new tables and columns added since last DB sync.
Adds: user_feature_overrides, feature_requests, and new columns on
      patient_preferences (age_group, ui_needs) and users (feature_overrides, feature_requests rels).

Run from backend/:  python migrate_new_tables.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('SECRET_KEY', 'test-migrate')

from sqlalchemy import text, inspect
from src.db import Base, engine, UserFeatureOverride, FeatureRequest, PatientPreferences, User

print("=" * 55)
print("ProjectAura — Database Migration")
print("=" * 55)

inspector = inspect(engine)
existing_tables = inspector.get_table_names()

# 1. Create new tables if they don't exist
new_tables = {
    'user_feature_overrides': UserFeatureOverride,
    'feature_requests':       FeatureRequest,
}

with engine.begin() as conn:
    for table_name, model in new_tables.items():
        if table_name not in existing_tables:
            model.__table__.create(engine)
            print(f"  Created table: {table_name}")
        else:
            print(f"  Table already exists: {table_name}")

    # 2. Add new columns to patient_preferences if missing
    pp_cols = {c['name'] for c in inspector.get_columns('patient_preferences')}

    if 'age_group' not in pp_cols:
        conn.execute(text("ALTER TABLE patient_preferences ADD COLUMN age_group VARCHAR(20)"))
        print("  Added column: patient_preferences.age_group")
    else:
        print("  Column exists: patient_preferences.age_group")

    if 'ui_needs' not in pp_cols:
        conn.execute(text("ALTER TABLE patient_preferences ADD COLUMN ui_needs TEXT"))
        print("  Added column: patient_preferences.ui_needs")
    else:
        print("  Column exists: patient_preferences.ui_needs")

    # 3. Check users table for new optional columns we may have added
    user_cols = {c['name'] for c in inspector.get_columns('users')}
    # These are relationship-only, no new columns needed on users table
    print(f"  Users table has {len(user_cols)} columns — OK")

print()
print("Migration complete.")
print("=" * 55)
