"""
Create the superadmin account.
superadmin has role='admin' - full access to all admin endpoints.
Run once: python create_superadmin.py
"""
import sys
sys.path.insert(0, '.')
from datetime import datetime
from src.db import SessionLocal, User, hash_password, authenticate_user

db = SessionLocal()

USERNAME = 'superadmin'
PASSWORD = 'SuperAdmin@2026'  # Strong password - change after first login

existing = db.query(User).filter(User.username == USERNAME).first()
if existing:
    # Reset password if account already exists
    existing.hashed_password = hash_password(PASSWORD)
    existing.failed_logins = 0
    existing.locked_until = None
    existing.is_active = True
    db.commit()
    print(f'Updated existing superadmin account.')
else:
    superadmin = User(
        username=USERNAME,
        email='superadmin@projectaura.gh',
        hashed_password=hash_password(PASSWORD),
        role='admin',
        full_name='Super Administrator',
        is_active=True,
        is_verified=True,
        consent_given=True,
        created_at=datetime.utcnow(),
    )
    db.add(superadmin)
    db.commit()
    print(f'Created superadmin account.')

# Verify it works
ok = authenticate_user(USERNAME, PASSWORD, db)
print(f'Login test: {"PASS" if ok else "FAIL"}')
print()
print('─' * 40)
print(f'  Username : {USERNAME}')
print(f'  Password : {PASSWORD}')
print(f'  Role     : admin (full access)')
print('─' * 40)

db.close()
