"""Reset all core demo account passwords to known values."""
import sys
sys.path.insert(0, '.')
from src.db import SessionLocal, User, hash_password, authenticate_user

db = SessionLocal()

resets = [
    ('admin',     'Admin1234'),
    ('caregiver', 'Care1234'),
    ('patient',   'Patient1234'),
    ('family',    'Family1234'),
    ('dr.mensah', 'Doctor1234'),
    ('dr.osei',   'Doctor1234'),
]

print('Resetting passwords...')
for username, new_pwd in resets:
    user = db.query(User).filter(User.username == username).first()
    if user:
        user.hashed_password = hash_password(new_pwd)
        user.failed_logins = 0
        user.locked_until = None
        print(f'  Reset : {username:20s}  ->  {new_pwd}')
    else:
        print(f'  MISS  : {username} not found')

db.commit()

print()
print('Verifying...')
for username, pwd in resets:
    result = authenticate_user(username, pwd, db)
    status = 'OK  ' if result else 'FAIL'
    print(f'  {status}  {username:20s}  /  {pwd}')

db.close()
print()
print('Done. Use these credentials to log in.')
