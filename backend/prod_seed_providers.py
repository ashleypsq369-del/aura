"""
Production provider seed + avatar patch.
Uses Neon production DB directly.
Run: python prod_seed_providers.py
"""
import sys, os

PROD_DB = "postgresql://neondb_owner:npg_NS4PdsGFKx2t@ep-soft-shadow-b4zx3dxd-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(PROD_DB, pool_pre_ping=True)
Session = sessionmaker(bind=engine)
db = Session()

try:
    # Quick health check
    result = db.execute(text("SELECT COUNT(*) FROM users WHERE role='provider'")).scalar()
    print(f"[Prod DB] Current provider count: {result}")
except Exception as e:
    print(f"[ERROR] DB connection failed: {e}")
    sys.exit(1)

# ── Avatar map ────────────────────────────────────────────────────────────────
AVATAR_MAP = {
    "abena_nurse":    "/resources/providers/provider-8.jpg",
    "kwame_nurse":    "/resources/providers/provider-1.jpg",
    "dr_efua":        "/resources/providers/provider-3.jpg",
    "dr_kofi":        "/resources/providers/provider-2.jpg",
    "ama_physio":     "/resources/providers/provider-5.jpg",
    "emma_physio":    "/resources/providers/provider-4.jpg",
    "akosua_counsel": "/resources/providers/provider-7.jpg",
    "yaw_counsel":    "/resources/providers/provider-6.jpg",
    "adjoa_nanny":    "/resources/providers/provider-9.jpg",
    "fatima_nanny":   "/resources/providers/provider-11.jpg",
    "nana_massage":   "/resources/providers/provider-12.jpg",
    "serwa_massage":  "/resources/providers/provider-10.jpg",
    "adwoa_social":   "/resources/providers/provider-3.jpg",
    "osei_social":    "/resources/providers/provider-6.jpg",
    "rev_grace":      "/resources/providers/provider-7.jpg",
    "imam_rahman":    "/resources/providers/provider-2.jpg",
}

# ── Seed providers if they don't exist ───────────────────────────────────────
from passlib.context import CryptContext
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

PROVIDERS = [
    {"full_name":"Abena Mensah",      "username":"abena_nurse",    "email":"abena@demo.aura",      "gender":"female","region":"Greater Accra","service_type":"nurse",           "specialisation":"Palliative & Wound Care",           "years_experience":7,  "bio":"Registered palliative nurse with 7 years home-based care in Accra.","license_number":"NMC/GH/2019/4821","facility":"Korle Bu Teaching Hospital",      "score":87.5},
    {"full_name":"Kwame Asante",       "username":"kwame_nurse",    "email":"kwame@demo.aura",      "gender":"male",  "region":"Ashanti",      "service_type":"nurse",           "specialisation":"Oncology Nursing",                  "years_experience":5,  "bio":"Experienced oncology nurse for cancer patients in Ashanti region.","license_number":"NMC/GH/2020/5234","facility":"Komfo Anokye Teaching Hospital",   "score":82.0},
    {"full_name":"Dr. Efua Boateng",  "username":"dr_efua",        "email":"efua@demo.aura",       "gender":"female","region":"Greater Accra","service_type":"doctor",          "specialisation":"Palliative Medicine",               "years_experience":12, "bio":"Consultant palliative physician, 12 years in hospice and home medicine.","license_number":"GCMC/2012/3301","facility":"Private Practice - Accra",         "score":95.0},
    {"full_name":"Dr. Kofi Owusu",    "username":"dr_kofi",        "email":"kofi@demo.aura",       "gender":"male",  "region":"Western",      "service_type":"doctor",          "specialisation":"Geriatric Medicine",                "years_experience":9,  "bio":"Geriatrician specialising in complex elderly patients.","license_number":"GCMC/2015/4102","facility":"Takoradi Teaching Hospital",       "score":90.0},
    {"full_name":"Ama Darko",         "username":"ama_physio",     "email":"ama@demo.aura",        "gender":"female","region":"Ashanti",      "service_type":"physiotherapist", "specialisation":"Palliative Rehabilitation",         "years_experience":6,  "bio":"Physiotherapist specialising in palliative rehabilitation.","license_number":"HCPC/GH/2018/1234","facility":"KATH Physiotherapy Dept",          "score":85.0},
    {"full_name":"Emmanuel Tetteh",   "username":"emma_physio",    "email":"emmaphysio@demo.aura", "gender":"male",  "region":"Greater Accra","service_type":"physiotherapist", "specialisation":"Respiratory Physiotherapy",         "years_experience":4,  "bio":"Respiratory physiotherapist for breathlessness and mobility.","license_number":"HCPC/GH/2020/1891","facility":"37 Military Hospital",             "score":78.0},
    {"full_name":"Akosua Frimpong",   "username":"akosua_counsel", "email":"akosua@demo.aura",     "gender":"female","region":"Greater Accra","service_type":"counsellor",      "specialisation":"Grief & Bereavement Counselling",   "years_experience":8,  "bio":"BACP-accredited grief counsellor, 8 years in bereavement support.","license_number":"BACP/12345","facility":"Private Practice",                 "score":90.0},
    {"full_name":"Yaw Mensah",        "username":"yaw_counsel",    "email":"yaw@demo.aura",        "gender":"male",  "region":"Eastern",      "service_type":"counsellor",      "specialisation":"Trauma & Anxiety",                  "years_experience":5,  "bio":"Counsellor specialising in trauma from life-limiting illness.","license_number":"BACP/67890","facility":"Hope Counselling Centre",          "score":82.0},
    {"full_name":"Adjoa Aidoo",       "username":"adjoa_nanny",    "email":"adjoa@demo.aura",      "gender":"female","region":"Greater Accra","service_type":"nanny",           "specialisation":"Children Affected by Parental Illness","years_experience":6, "bio":"Specialist nanny supporting children of palliative care patients.","license_number":"CC/GH/2018/0045","facility":"Private",                         "score":88.0},
    {"full_name":"Fatima Alhassan",   "username":"fatima_nanny",   "email":"fatima@demo.aura",     "gender":"female","region":"Northern",     "service_type":"nanny",           "specialisation":"Infant & Toddler Care",             "years_experience":4,  "bio":"Experienced nanny with paediatric first aid, speaks Dagbani & Hausa.","license_number":"CC/GH/2020/0112","facility":"Private",                         "score":80.0},
    {"full_name":"Nana Osei",         "username":"nana_massage",   "email":"nana@demo.aura",       "gender":"male",  "region":"Ashanti",      "service_type":"masseur",         "specialisation":"Oncology Massage",                  "years_experience":5,  "bio":"Certified oncology massage therapist for palliative comfort care.","license_number":"GMAT/2019/0234","facility":"Wellness Centre - Kumasi",         "score":82.0},
    {"full_name":"Serwa Mensah",      "username":"serwa_massage",  "email":"serwa@demo.aura",      "gender":"female","region":"Greater Accra","service_type":"masseur",         "specialisation":"Lymphoedema & Palliative Massage",  "years_experience":7,  "bio":"Specialist in lymphatic drainage and palliative massage.","license_number":"GMAT/2017/0156","facility":"Private Practice - Accra",         "score":90.0},
    {"full_name":"Adwoa Kumi",        "username":"adwoa_social",   "email":"adwoa@demo.aura",      "gender":"female","region":"Greater Accra","service_type":"social_worker",   "specialisation":"Palliative Family Support",         "years_experience":9,  "bio":"Social worker for palliative family support and NHIS navigation.","license_number":"GSWC/2015/0892","facility":"Ridge Hospital Social Work Dept",  "score":92.0},
    {"full_name":"Osei Bonsu",        "username":"osei_social",    "email":"osei@demo.aura",       "gender":"male",  "region":"Brong-Ahafo", "service_type":"social_worker",   "specialisation":"Elder Care & Housing",              "years_experience":6,  "bio":"Social worker for elderly palliative patients and home safety.","license_number":"GSWC/2018/1045","facility":"Brong-Ahafo Regional Hospital",    "score":85.0},
    {"full_name":"Rev. Grace Appiah", "username":"rev_grace",      "email":"grace@demo.aura",      "gender":"female","region":"Greater Accra","service_type":"chaplain",        "specialisation":"Christian & Interfaith Spiritual Care","years_experience":14,"bio":"Ordained chaplain, 14 years clinical chaplaincy across all faiths.","license_number":"CHAP/GH/2010/001","facility":"La General Hospital Chaplaincy",   "score":88.0},
    {"full_name":"Imam Abdul Rahman", "username":"imam_rahman",    "email":"rahman@demo.aura",     "gender":"male",  "region":"Northern",     "service_type":"chaplain",        "specialisation":"Islamic Spiritual Care",            "years_experience":10, "bio":"Imam providing Islamic spiritual care for Muslim palliative patients.","license_number":"CHAP/GH/2014/023","facility":"Tamale Teaching Hospital",        "score":85.0},
]

hashed_pw = pwd_ctx.hash("DemoPass1")
seeded = 0
patched = 0

for p in PROVIDERS:
    username = p["username"]

    # Check if user exists
    row = db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": username}).fetchone()

    if not row:
        # Create user
        db.execute(text("""
            INSERT INTO users (full_name, username, email, role, hashed_password,
                               is_active, is_verified, is_professional, professional_title,
                               created_at)
            VALUES (:fn, :un, :em, 'provider', :pw,
                    true, true, true, :pt, NOW())
        """), {
            "fn": p["full_name"], "un": username, "em": p["email"],
            "pw": hashed_pw, "pt": f"Verified {p['service_type']}",
        })
        user_id = db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": username}).scalar()

        # Profile
        db.execute(text("""
            INSERT INTO user_profiles (user_id, specialisation, facility_name, region, language_pref)
            VALUES (:uid, :sp, :fac, :reg, 'en')
            ON CONFLICT (user_id) DO NOTHING
        """), {"uid": user_id, "sp": p["specialisation"], "fac": p["facility"], "reg": p["region"]})

        # Extended
        db.execute(text("""
            INSERT INTO user_extended (user_id, gender, avatar_url)
            VALUES (:uid, :g, :av)
            ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
        """), {"uid": user_id, "g": p["gender"], "av": AVATAR_MAP.get(username)})

        # Application
        db.execute(text("""
            INSERT INTO provider_applications (user_id, service_type, bio, years_experience,
                                               qualifications, assessment_score, approval_status,
                                               submitted_at, created_at)
            VALUES (:uid, :st, :bio, :ye, '[]', :score, 'approved', NOW(), NOW())
        """), {
            "uid": user_id, "st": p["service_type"], "bio": p["bio"],
            "ye": p["years_experience"], "score": p["score"],
        })
        print(f"  SEEDED  {username}")
        seeded += 1
    else:
        user_id = row[0]
        # Just patch avatar
        db.execute(text("""
            INSERT INTO user_extended (user_id, gender, avatar_url)
            VALUES (:uid, :g, :av)
            ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
        """), {"uid": user_id, "g": p["gender"], "av": AVATAR_MAP.get(username)})
        print(f"  PATCHED {username} → {AVATAR_MAP.get(username)}")
        patched += 1

db.commit()
db.close()
print(f"\nDone. Seeded: {seeded}, Patched: {patched}")
