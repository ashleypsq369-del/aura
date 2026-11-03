"""
Fix demo users: mark questionnaire_complete=True so they don't
get stuck in the onboarding loop on every login.
Run against both local and Neon databases.
"""
import sys, os
sys.path.insert(0, '.')

def fix_db(db_url, label):
    os.environ['DATABASE_URL'] = db_url
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from src.db import User, PatientPreferences
    from datetime import datetime

    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    demo_users = ['patient', 'family', 'clinician', 'caregiver', 'admin', 'superadmin']
    users = db.query(User).filter(User.username.in_(demo_users)).all()

    print(f'\n[{label}] Fixing {len(users)} demo users...')
    for u in users:
        prefs = db.query(PatientPreferences).filter(
            PatientPreferences.user_id == u.id
        ).first()
        if prefs:
            prefs.questionnaire_complete = True
            prefs.completed_at = prefs.completed_at or datetime.utcnow()
            print(f'  Updated prefs for {u.username} (id={u.id})')
        else:
            # Create a minimal prefs row so login doesn't force onboarding
            new_prefs = PatientPreferences(
                user_id=u.id,
                patient_id=None,
                questionnaire_complete=True,
                completed_at=datetime.utcnow(),
            )
            db.add(new_prefs)
            print(f'  Created prefs for {u.username} (id={u.id})')

    db.commit()
    print(f'[{label}] Done.')
    db.close()


# ── Local DB ──────────────────────────────────────────────────────
fix_db(
    'postgresql://aura_user:vtVK7WlG1NQPIzqUaGclXIEP5iX6FfFq@localhost:5432/aura',
    'LOCAL'
)

# ── Neon production DB ────────────────────────────────────────────
fix_db(
    'postgresql://neondb_owner:npg_NS4PdsGFKx2t@ep-soft-shadow-b4zx3dxd-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
    'NEON'
)

print('\nAll done. Demo users will no longer be redirected to onboarding.')
