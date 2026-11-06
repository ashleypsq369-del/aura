"""
Patch avatar_url for demo non-provider users (clinicians, caregivers, patients, family)
using the 12 provider headshot images already in /resources/providers/.
Run: python patch_demo_avatars.py
"""
from sqlalchemy import create_engine, text
import os

# Reads DATABASE_URL from environment (set by .env or shell)
DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_NS4PdsGFKx2t@ep-soft-shadow-b4zx3dxd-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

engine = create_engine(DB_URL, pool_pre_ping=True)

# Map usernames to provider headshot images
# Males -> provider-1,2,4,6,12  Females -> provider-3,5,7,8,9,10,11
AVATAR_MAP = {
    # Clinicians
    "dr_amara":       "/resources/providers/provider-3.jpg",   # female doctor
    "dr_kwesi":       "/resources/providers/provider-2.jpg",   # male doctor white coat
    "dr_ama":         "/resources/providers/provider-5.jpg",   # female doctor asian
    "clinician1":     "/resources/providers/provider-6.jpg",   # male black tie
    "clinician2":     "/resources/providers/provider-4.jpg",   # male doctor ICU
    "nurse_abena":    "/resources/providers/provider-8.jpg",   # nurse female dark scrubs
    "nurse_kofi":     "/resources/providers/provider-1.jpg",   # nurse male asian
    "nurse1":         "/resources/providers/provider-7.jpg",   # nurse female pink
    "nurse2":         "/resources/providers/provider-9.jpg",   # nurse female navy
    # Caregivers
    "caregiver1":     "/resources/providers/provider-11.jpg",
    "caregiver2":     "/resources/providers/provider-10.jpg",
    "carer_grace":    "/resources/providers/provider-3.jpg",
    "carer_kwame":    "/resources/providers/provider-12.jpg",
    # Admin
    "admin":          "/resources/providers/provider-6.jpg",
    "admin1":         "/resources/providers/provider-2.jpg",
}

# Also patch by role - assign images to any user without an avatar
# Cycle through images by gender heuristic (name-based)
FEMALE_NAMES = {"grace","abena","ama","efua","adwoa","akosua","serwa","adjoa","fatima","rev"}
MALE_NAMES   = {"kofi","kwesi","kwame","osei","nana","yaw","emmanuel","imam","dr_kofi","dr_kwesi"}

FEMALE_IMGS = [
    "/resources/providers/provider-3.jpg",
    "/resources/providers/provider-5.jpg",
    "/resources/providers/provider-7.jpg",
    "/resources/providers/provider-8.jpg",
    "/resources/providers/provider-9.jpg",
    "/resources/providers/provider-10.jpg",
    "/resources/providers/provider-11.jpg",
]
MALE_IMGS = [
    "/resources/providers/provider-1.jpg",
    "/resources/providers/provider-2.jpg",
    "/resources/providers/provider-4.jpg",
    "/resources/providers/provider-6.jpg",
    "/resources/providers/provider-12.jpg",
]

def guess_img(username, gender, fi, mi):
    """Pick next image based on gender."""
    uname = username.lower()
    is_female = (gender == "female") or any(n in uname for n in FEMALE_NAMES)
    if is_female:
        img = FEMALE_IMGS[fi[0] % len(FEMALE_IMGS)]
        fi[0] += 1
    else:
        img = MALE_IMGS[mi[0] % len(MALE_IMGS)]
        mi[0] += 1
    return img

with engine.connect() as conn:
    # Get all non-provider users without avatars
    rows = conn.execute(text("""
        SELECT u.id, u.username, u.role,
               COALESCE(ue.gender, '') as gender,
               COALESCE(ue.avatar_url, '') as avatar_url
        FROM users u
        LEFT JOIN user_extended ue ON ue.user_id = u.id
        WHERE u.role != 'provider'
        AND u.is_active = true
        ORDER BY u.id
    """)).fetchall()

    fi = [0]
    mi = [0]
    patched = 0

    for row in rows:
        uid, username, role, gender, current_avatar = row

        # Skip if already has a real avatar
        if current_avatar and current_avatar.startswith("/resources/providers/"):
            continue

        # Use explicit map first, fall back to auto-assign
        img = AVATAR_MAP.get(username) or guess_img(username, gender, fi, mi)

        # Upsert into user_extended
        conn.execute(text("""
            INSERT INTO user_extended (user_id, avatar_url, gender)
            VALUES (:uid, :av, :g)
            ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
        """), {"uid": uid, "av": img, "g": gender or None})

        print(f"  Patched {username} ({role}) -> {img}")
        patched += 1

    conn.commit()
    print(f"\nDone. Patched {patched} demo users.")
