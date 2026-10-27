"""One-time migration: add family_consent to patients, care_provider cols to spiritual_care_notes"""
import sys
sys.path.insert(0, 'src')

from src.db import engine
from sqlalchemy import text

with engine.begin() as conn:
    # patients.family_consent
    r = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='patients' AND column_name='family_consent'"
    ))
    if not r.fetchone():
        conn.execute(text("ALTER TABLE patients ADD COLUMN family_consent TEXT DEFAULT '{}'"))
        print("Added: patients.family_consent")
    else:
        print("Already exists: patients.family_consent")

    # spiritual_care_notes.care_provider_type
    r2 = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='spiritual_care_notes' AND column_name='care_provider_type'"
    ))
    if not r2.fetchone():
        conn.execute(text("ALTER TABLE spiritual_care_notes ADD COLUMN IF NOT EXISTS care_provider_type VARCHAR(100)"))
        conn.execute(text("ALTER TABLE spiritual_care_notes ADD COLUMN IF NOT EXISTS care_provider_name VARCHAR(200)"))
        print("Added: spiritual_care_notes.care_provider_type/name")
    else:
        print("Already exists: spiritual_care_notes.care_provider_type")

    # New palliative tables - create_all handles these (new tables, not existing)
    print("Migration complete.")
