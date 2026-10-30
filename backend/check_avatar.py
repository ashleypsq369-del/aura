import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from src.db import get_session, UserExtended, User

db = get_session()
users_with_avatars = (
    db.query(User, UserExtended)
    .join(UserExtended, User.id == UserExtended.user_id)
    .filter(UserExtended.avatar_url != None)
    .all()
)

print(f"\nUsers with avatar_url set: {len(users_with_avatars)}")
for u, e in users_with_avatars:
    fname = e.avatar_url.split("/")[-1]
    paths = {
        "uploads/profiles/" + fname:        os.path.exists("uploads/profiles/" + fname),
        "static/uploads/profiles/" + fname: os.path.exists("static/uploads/profiles/" + fname),
    }
    print(f"\n  user_id={u.id}  username={u.username}")
    print(f"  avatar_url = {e.avatar_url}")
    for path, exists in paths.items():
        size = os.path.getsize(path) if exists else 0
        print(f"  {'✓' if exists else '✗'} {path}  ({size} bytes)")

# Test the actual HTTP endpoint
import urllib.request
url = "http://localhost:8000/api/profile"
token = None
# Try to get a token for first user with avatar
if users_with_avatars:
    u = users_with_avatars[0][0]
    print(f"\nTesting GET /api/profile for user {u.username}...")
    print("  (run: curl http://localhost:8000/uploads/profiles/<filename> to test file serving)")

db.close()
