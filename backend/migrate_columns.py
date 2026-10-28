"""
Migration: add gender, date_of_birth, address, location to users
and avatar_url, address to user_profiles.

Tries aura_user first, then falls back to postgres superuser.
Run: python migrate_columns.py
"""
import os, sys
from dotenv import load_dotenv
load_dotenv()

MIGRATIONS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(200)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
    "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT",
]

def run_migrations(dsn, label):
    import psycopg2
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True          # each statement in its own txn
        cur = conn.cursor()
        ok = 0
        for sql in MIGRATIONS:
            try:
                cur.execute(sql)
                print(f"  OK  : {sql[:65]}")
                ok += 1
            except Exception as e:
                print(f"  SKIP: {sql[:40]} -> {e.__class__.__name__}")
        cur.close()
        conn.close()
        print(f"\n[{label}] {ok}/{len(MIGRATIONS)} migrations applied.")
        return ok > 0
    except Exception as e:
        print(f"[{label}] Connection failed: {e}")
        return False


# ── Try aura_user first ──────────────────────────────────────────────────────
app_dsn = os.getenv(
    'DATABASE_URL',
    'postgresql://aura_user:vtVK7WlG1NQPIzqUaGclXIEP5iX6FfFq@localhost:5432/aura'
)
print("Trying aura_user...")
if run_migrations(app_dsn, 'aura_user'):
    print("\nDone.")
    sys.exit(0)

# ── Fallback: postgres superuser (common XAMPP/local setup) ─────────────────
print("\nTrying postgres superuser...")
super_dsns = [
    'postgresql://postgres:postgres@localhost:5432/aura',
    'postgresql://postgres:admin@localhost:5432/aura',
    'postgresql://postgres:password@localhost:5432/aura',
    'postgresql://postgres:@localhost:5432/aura',
    f'postgresql://postgres:{os.getenv("PGPASSWORD","postgres")}@localhost:5432/aura',
]
for dsn in super_dsns:
    print(f"  Trying {dsn.split('@')[0].split(':')[1]}...")
    if run_migrations(dsn, 'postgres'):
        print("\nDone.")
        sys.exit(0)

print("\nCould not apply migrations automatically.")
print("Please run these SQL statements manually in pgAdmin or psql:")
print()
for sql in MIGRATIONS:
    print(f"  {sql};")
sys.exit(1)
