"""
Patch avatar_url for existing seeded providers.
Run: python patch_provider_avatars.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from src.db import get_session, User, UserExtended

AVATAR_MAP = {
    "abena_nurse":    "/resources/providers/provider-8.jpg",   # nurse female dark scrubs
    "kwame_nurse":    "/resources/providers/provider-1.jpg",   # nurse male asian scrubs
    "dr_efua":        "/resources/providers/provider-3.jpg",   # doctor female black lab coat
    "dr_kofi":        "/resources/providers/provider-2.jpg",   # doctor male white lab coat
    "ama_physio":     "/resources/providers/provider-5.jpg",   # doctor female asian lab coat
    "emma_physio":    "/resources/providers/provider-4.jpg",   # doctor male black lab coat ICU
    "akosua_counsel": "/resources/providers/provider-7.jpg",   # nurse female pink scrubs
    "yaw_counsel":    "/resources/providers/provider-6.jpg",   # doctor male black tie
    "adjoa_nanny":    "/resources/providers/provider-9.jpg",   # nurse female navy scrubs
    "fatima_nanny":   "/resources/providers/provider-11.jpg",  # nurse female dark professional
    "nana_massage":   "/resources/providers/provider-12.jpg",  # doctor male black arms crossed
    "serwa_massage":  "/resources/providers/provider-10.jpg",  # nurse female black scrubs headshot
    "adwoa_social":   "/resources/providers/provider-3.jpg",   # doctor female black
    "osei_social":    "/resources/providers/provider-6.jpg",   # doctor male black
    "rev_grace":      "/resources/providers/provider-7.jpg",   # nurse female pink
    "imam_rahman":    "/resources/providers/provider-2.jpg",   # doctor male white coat
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
