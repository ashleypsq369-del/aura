"""Reset all demo account passwords on the Neon production database."""
import sys, os
sys.path.insert(0, '.')
os.environ['DATABASE_URL'] = (
    'postgresql://neondb_owner:npg_NS4PdsGFKx2t@'
    'ep-soft-shadow-b4zx3dxd-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require'
)

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db import User, hash_password, authenticate_user

engine = create_engine(os.environ['DATABASE_URL'])
Session = sessionmaker(bind=engine)
db = Session()

resets = [
    ('admin',      'Admin1234'),
    ('clinician',  'Clinician1234'),
    ('caregiver',  'Care1234'),
    ('patient',    'Patient1234'),
    ('family',     'Family1234'),
    ('superadmin', 'SuperAdmin@2026'),
]

print('Resetting Neon DB passwords...')
for username, pwd in resets:
    u = db.query(User).filter(User.username == username).first()
    if u:
        u.hashed_password = hash_password(pwd)
        u.failed_logins   = 0
        u.locked_until    = None
        u.is_active       = True
        print(f'  Reset  : {username:20s} -> {pwd}')
    elif username == 'superadmin':
        su = User(
            username='superadmin',
            email='superadmin@projectaura.gh',
            hashed_password=hash_password(pwd),
            role='admin',
            full_name='Super Administrator',
            is_active=True,
            is_verified=True,
            consent_given=True,
            created_at=datetime.utcnow(),
        )
        db.add(su)
        print(f'  Created: superadmin')
    else:
        print(f'  MISS   : {username} not found in Neon DB')

db.commit()

print()
print('Verifying...')
for username, pwd in resets:
    result = authenticate_user(username, pwd, db)
    status = 'OK  ' if result else 'FAIL'
    print(f'  {status}  {username:20s} / {pwd}')

db.close()
print()
print('Done — production Neon DB updated.')
