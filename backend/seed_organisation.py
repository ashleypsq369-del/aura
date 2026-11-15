"""
seed_organisation.py
====================
Seeds one fictional organisation and its staff providers into the system.

Organisation: Mawuli Comfort Care Centre
  - Fictional hospice centre based in Volta Region, Ghana
  - Completely original — no relation to any real organisation
  - 4 staff providers linked via facility_name

Run from backend/ folder:
    python seed_organisation.py
"""

import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from src.db import SessionLocal, User, UserProfile, UserExtended, ProviderApplication, CaregiverRating

try:
    from routers.auth import hash_password
except Exception:
    import bcrypt
    def hash_password(pw):
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

PASSWORD = "TestPass123!"
ORG_NAME = "Mawuli Comfort Care Centre"


def run():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("SEEDING ORGANISATION: Mawuli Comfort Care Centre")
        print("=" * 60)

        # ── 1. Create the Organisation user ──────────────────────────────
        existing = db.query(User).filter(User.username == "mawuli_care").first()
        if existing:
            print(f"Organisation already exists (id={existing.id}) — skipping user creation")
            org = existing
        else:
            org = User(
                username="mawuli_care",
                email="info@mawulicare.gh",
                hashed_password=hash_password(PASSWORD),
                full_name=ORG_NAME,
                role="organisation",
                phone="+233362012345",
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow(),
            )
            db.add(org)
            db.flush()
            print(f"Created organisation user: id={org.id}")

        # UserProfile for the org
        prof = db.query(UserProfile).filter(UserProfile.user_id == org.id).first()
        if not prof:
            prof = UserProfile(
                user_id=org.id,
                facility_name=ORG_NAME,
                region="Volta",
                specialisation="Palliative & Hospice Care",
            )
            db.add(prof)

        # UserExtended for org details
        ext = db.query(UserExtended).filter(UserExtended.user_id == org.id).first()
        if not ext:
            ext = UserExtended(
                user_id=org.id,
                gender=None,
                address="Plot 14, Comfort Close, Ho",
                location="Ho, Volta Region, Ghana",
            )
            db.add(ext)
        # Bio stored via a quick attribute patch (not all DBs have this column in UserExtended)
        try:
            ext.bio = (
                "Mawuli Comfort Care Centre is a community-rooted palliative care facility "
                "serving patients and families across the Volta Region. Founded on the belief "
                "that every person deserves dignity and peace at the end of life, we provide "
                "holistic care through a dedicated multidisciplinary team."
            )
        except Exception:
            pass

        db.flush()

        # ── 2. Create staff providers ─────────────────────────────────────
        STAFF = [
            {
                "username": "mawuli_nurse_afi",
                "email": "afi.dzokoto@mawulicare.gh",
                "full_name": "Afi Dzokoto",
                "professional_title": "Palliative Nurse",
                "service_type": "nurse",
                "gender": "female",
                "region": "Volta",
                "bio": (
                    "Registered palliative nurse with 8 years of home-based care experience "
                    "across the Volta Region. Specialises in pain management and family support."
                ),
                "years_exp": 8,
                "nmc_pin": "NMC-VR-2201",
                "qualifications": [
                    {"title": "RGN Certificate", "institution": "Hohoe Nursing College", "year": "2016"},
                    {"title": "Palliative Care Diploma", "institution": "Ghana College of Nurses", "year": "2019"},
                ],
            },
            {
                "username": "mawuli_doc_kwame",
                "email": "kwame.adzoa@mawulicare.gh",
                "full_name": "Dr. Kwame Adzoa",
                "professional_title": "Palliative Physician",
                "service_type": "doctor",
                "gender": "male",
                "region": "Volta",
                "bio": (
                    "Palliative physician with a focus on complex symptom management and "
                    "advance care planning. Trained in palliative medicine at Korle Bu and "
                    "has served communities in Ho and surrounding areas for over 10 years."
                ),
                "years_exp": 10,
                "nmc_pin": "GCMC-VR-0847",
                "qualifications": [
                    {"title": "MBChB", "institution": "University of Health and Allied Sciences", "year": "2013"},
                    {"title": "Certificate in Palliative Medicine", "institution": "GCPS Ghana", "year": "2017"},
                ],
            },
            {
                "username": "mawuli_physio_edem",
                "email": "edem.tsatsu@mawulicare.gh",
                "full_name": "Edem Tsatsu",
                "professional_title": "Physiotherapist",
                "service_type": "physiotherapist",
                "gender": "male",
                "region": "Volta",
                "bio": (
                    "Community physiotherapist specialising in mobility support and "
                    "breathlessness management for palliative patients. Works closely with "
                    "home-based care teams to maintain patient independence."
                ),
                "years_exp": 5,
                "nmc_pin": "HCPC-VR-5512",
                "qualifications": [
                    {"title": "BSc Physiotherapy", "institution": "UHAS Ho", "year": "2018"},
                ],
            },
            {
                "username": "mawuli_counsellor_abla",
                "email": "abla.sefah@mawulicare.gh",
                "full_name": "Abla Sefah",
                "professional_title": "Grief Counsellor",
                "service_type": "counsellor",
                "gender": "female",
                "region": "Volta",
                "bio": (
                    "Accredited grief counsellor providing psychological and spiritual support "
                    "to patients and bereaved families. Trained in both CBT and narrative "
                    "therapy approaches adapted for Ghanaian cultural contexts."
                ),
                "years_exp": 6,
                "nmc_pin": "GCA-VR-1134",
                "qualifications": [
                    {"title": "Diploma in Counselling", "institution": "Ho Technical University", "year": "2017"},
                    {"title": "Grief Specialist Certification", "institution": "BACP Africa Chapter", "year": "2020"},
                ],
            },
        ]

        for s in STAFF:
            existing_staff = db.query(User).filter(User.username == s["username"]).first()
            if existing_staff:
                print(f"  Staff already exists: {s['full_name']} — skipping")
                continue

            staff_user = User(
                username=s["username"],
                email=s["email"],
                hashed_password=hash_password(PASSWORD),
                full_name=s["full_name"],
                role="provider",
                phone=f"+23336201{hash(s['username']) % 10000:04d}",
                is_active=True,
                is_verified=True,
                is_professional=True,
                professional_title=s["professional_title"],
                created_at=datetime.utcnow(),
            )
            db.add(staff_user)
            db.flush()

            # UserProfile — facility_name matches ORG_NAME so they appear in org staff roster
            staff_prof = UserProfile(
                user_id=staff_user.id,
                facility_name=ORG_NAME,
                region=s["region"],
                specialisation=s["service_type"].replace("_", " ").title(),
                license_number=s["nmc_pin"],
            )
            db.add(staff_prof)

            # UserExtended — avatar, gender, address
            staff_ext = UserExtended(
                user_id=staff_user.id,
                gender=s["gender"],
                address=f"c/o {ORG_NAME}, Ho, Volta Region",
                location="Ho, Volta Region, Ghana",
            )
            db.add(staff_ext)
            db.flush()

            # ProviderApplication — so they appear in services directory with bio+quals
            import json as _json
            app = ProviderApplication(
                user_id=staff_user.id,
                service_type=s["service_type"],
                bio=s["bio"],
                years_experience=s["years_exp"],
                qualifications=_json.dumps(s["qualifications"]),
                approval_status="approved",
                assessment_score=85,
                submitted_at=datetime.utcnow(),
                reviewed_at=datetime.utcnow(),
            )
            db.add(app)

            # Seed 2 ratings per provider
            for rating_val, comment in [
                (5, "Excellent care, very compassionate and knowledgeable."),
                (4, "Professional and thorough. Made my family feel at ease."),
            ]:
                r = CaregiverRating(
                    caregiver_id=staff_user.id,
                    patient_id=1,          # placeholder patient
                    appointment_id=1,      # placeholder appointment
                    rating=rating_val,
                    comment=comment,
                    created_by=1,
                    created_at=datetime.utcnow(),
                )
                db.add(r)

            print(f"  Created staff: {s['full_name']} ({s['service_type']}) id={staff_user.id}")

        db.commit()
        print("\n✓ Mawuli Comfort Care Centre seeded successfully")
        print(f"  Login: mawuli_care / {PASSWORD}")
        print(f"  Staff passwords: {PASSWORD}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    run()
