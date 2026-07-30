"""Simulate exactly what happens when /api/auth/login is called."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('SECRET_KEY', 'test-key-abc123')

try:
    from src.db import get_db, User, authenticate_user
    print('db import OK')
except Exception as e:
    print('db import FAILED:', e)
    sys.exit(1)

try:
    from routers.auth import login, router
    print('auth router import OK')
except Exception as e:
    print('auth router import FAILED:', e)
    sys.exit(1)

# Try to get a DB session and do what login does
try:
    db = next(get_db())
    user = authenticate_user('admin', 'admin123', db)
    print('authenticate_user:', 'FOUND' if user else 'NOT FOUND (wrong password or user)')
    db.close()
except Exception as e:
    print('authenticate_user FAILED:', e)
    import traceback; traceback.print_exc()

# Check if the User model's new relationships cause issues
try:
    db = next(get_db())
    u = db.query(User).filter(User.username == 'admin').first()
    if u:
        print('User found:', u.id, u.role)
        # Access the dynamic relationships - this is where it might crash
        try:
            overrides = u.feature_overrides.count()
            print('feature_overrides count:', overrides)
        except Exception as e:
            print('feature_overrides access FAILED:', e)
        try:
            reqs = u.feature_requests.count()
            print('feature_requests count:', reqs)
        except Exception as e:
            print('feature_requests access FAILED:', e)
    db.close()
except Exception as e:
    print('User query FAILED:', e)
    import traceback; traceback.print_exc()

print('All checks done')
