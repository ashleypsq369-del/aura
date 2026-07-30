"""
Fix missing columns by using aura_user connection.
If aura_user isn't the table owner, we need to find the postgres password.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('SECRET_KEY', 'test')

from sqlalchemy import text
from src.db import engine

with engine.connect() as conn:
    # Who owns the table?
    r = conn.execute(text(
        "SELECT tableowner FROM pg_tables WHERE tablename='patient_preferences'"
    )).fetchone()
    owner = r[0] if r else 'unknown'
    print('Table owner:', owner)
    print('Current user:', conn.execute(text('SELECT current_user')).scalar())

    # Check if columns exist
    existing = conn.execute(text("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='patient_preferences'
        AND column_name IN ('age_group', 'ui_needs')
    """)).fetchall()
    print('Existing cols:', [e[0] for e in existing])
    
    # If we ARE the owner, just do it
    cur = conn.execute(text('SELECT current_user')).scalar()
    if cur == owner:
        print('We own the table - running ALTER...')
        if not any(e[0] == 'age_group' for e in existing):
            conn.execute(text("ALTER TABLE patient_preferences ADD COLUMN age_group VARCHAR(20)"))
            conn.commit()
            print('Added age_group')
        if not any(e[0] == 'ui_needs' for e in existing):
            conn.execute(text("ALTER TABLE patient_preferences ADD COLUMN ui_needs TEXT"))
            conn.commit()
            print('Added ui_needs')
    else:
        print(f'We ({cur}) are NOT the owner ({owner})')
        print('Need to find postgres password or use pgAdmin to run:')
        print('  ALTER TABLE patient_preferences ADD COLUMN IF NOT EXISTS age_group VARCHAR(20);')
        print('  ALTER TABLE patient_preferences ADD COLUMN IF NOT EXISTS ui_needs TEXT;')
