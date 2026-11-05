"""
Patch avatar_url for existing seeded providers.
Run: python patch_provider_avatars.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from src.db import get_session, User, UserExtended

AVATAR_MAP = {
    "abena_nurse":    "/resources/providers/provider-nurse-female-pink.jpg",
    "kwame_nurse":    "/resources/providers/provider-nurse-male-asian.jpg",
    "dr_efua":        "/resources/providers/provider-doctor-female-black.jpg",
    "dr_kofi":        "/resources/providers/provider-doctor-male-white.jpg",
    "ama_physio":     "/resources/providers/provider-doctor-female-asian.jpg",
    "emma_physio":    "/resources/providers/provider-doctor-male-black.jpg",
    "akosua_counsel": "/resources/providers/provider-nurse-female-curly.jpg",
    "yaw_counsel":    "/resources/providers/provider-doctor-male-black2.jpg",
    "adjoa_nanny":    "/resources/providers/provider-nurse-female-dark.jpg",
    "fatima_nanny":   "/resources/providers/provider-doctor-female-black.jpg",
    "nana_massage":   "/resources/providers/provider-doctor-male-black.jpg",
    "serwa_massage":  "/resources/providers/provider-nurse-female-pink.jpg",
    "adwoa_social":   "/resources/providers/provider-doctor-female-black.jpg",
    "osei_social":    "/resources/providers/provider-doctor-male-black2.jpg",
    "rev_grace":      "/resources/providers/provider-nurse-female-curly.jpg",
    "imam_rahman":    "/resources/providers/provider-doctor-male-white.jpg",
}

def patch():
    db = get_session()
    updated = 0
    try:
        for username, avatar_url in AVATAR_MAP.items():
            user = db.query(User).filter(User.username == username).first()
            if not user:
                print(f"  SKIP (not found): {username}")
                continue
            ext = db.query(UserExtended).filter(UserExtended.user_id == user.id).first()
            if not ext:
                ext = UserExtended(user_id=user.id, gender=None)
                db.add(ext)
            ext.avatar_url = avatar_url
            updated += 1
            print(f"  Patched {username} → {avatar_url}")
        db.commit()
        print(f"\nPatched {updated} provider avatar(s).")
    finally:
        db.close()

if __name__ == "__main__":
    patch()
