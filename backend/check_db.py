import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('SECRET_KEY', 'test')

from sqlalchemy import text, inspect
from src.db import engine

with engine.connect() as conn:
    user = conn.execute(text('SELECT current_user, current_database()')).fetchone()
    print('DB user:', user[0], '| DB:', user[1])

    result = conn.execute(text("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'patient_preferences'
        AND column_name IN ('age_group', 'ui_needs')
    """)).fetchall()
    print('New cols in patient_preferences:', [r[0] for r in result])

    for t in ['user_feature_overrides', 'feature_requests']:
        r = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '" + t + "'"
        )).scalar()
        print(f'Table {t}:', 'EXISTS' if r else 'MISSING')

    # Check what's actually crashing login - test the auth import
    try:
        from routers.auth import router
        print('auth.py import: OK')
    except Exception as e:
        print('auth.py import ERROR:', e)

    # Test the register function signature (the one we changed)
    try:
        import inspect as ins
        from routers.auth import register
        sig = ins.signature(register)
        print('register() params:', list(sig.parameters.keys()))
    except Exception as e:
        print('register inspect ERROR:', e)
