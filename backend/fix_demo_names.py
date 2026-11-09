"""
Fix demo account full_name and ensure feedback captures names correctly.
Also fixes the questionnaire_skipped column missing issue.
"""
from sqlalchemy import create_engine, text

PROD_DB = "postgresql://neondb_owner:npg_NS4PdsGFKx2t@ep-soft-shadow-b4zx3dxd-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(PROD_DB)

DEMO_NAMES = {
    'clinician': 'Dr. Amara Mensah',
    'caregiver': 'Nurse Grace Osei',
    'patient':   'Kofi Asante',
    'family':    'Emmanuel Darko',
    'admin':     'Admin User',
}

with engine.connect() as conn:
    # 1. Fix demo account full names
    for username, full_name in DEMO_NAMES.items():
        conn.execute(text(
            "UPDATE users SET full_name = :name WHERE username = :user AND full_name IS NULL OR full_name = '' OR full_name = username"
        ), {"name": full_name, "user": username})
        print(f"  Updated {username} -> {full_name}")

    # 2. Add questionnaire_skipped column if it doesn't exist
    try:
        conn.execute(text(
            "ALTER TABLE patient_preferences ADD COLUMN IF NOT EXISTS questionnaire_skipped BOOLEAN DEFAULT FALSE"
        ))
        print("  questionnaire_skipped column ensured")
    except Exception as e:
        print(f"  questionnaire_skipped column: {e}")

    conn.commit()

    # 3. Verify
    rows = conn.execute(text(
        "SELECT username, full_name, email FROM users WHERE username IN ('clinician','caregiver','patient','family','admin') ORDER BY username"
    )).fetchall()
    print("\nDemo accounts:")
    for r in rows:
        print(f"  {r[0]}: full_name='{r[1]}' email={r[2]}")
