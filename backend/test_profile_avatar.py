import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
import requests

BASE = "http://localhost:8000"

# Login as Asher
r = requests.post(f"{BASE}/api/auth/login",
    json={"username": "ashersmithpsq44gmailcom", "password": "DemoPass1"})
print("Login:", r.status_code)
if r.status_code != 200:
    print(r.text); sys.exit(1)

token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get profile
r2 = requests.get(f"{BASE}/api/profile", headers=headers)
print("Profile status:", r2.status_code)
d = r2.json()
print("avatar_url (top level):", d.get("avatar_url"))
profile_nested = d.get("profile") or {}
print("avatar_url (profile.avatar_url):", profile_nested.get("avatar_url"))

# Test image URL directly
url = d.get("avatar_url") or profile_nested.get("avatar_url")
if url:
    img_url = f"{BASE}{url}"
    r3 = requests.head(img_url)
    print(f"\nImage URL: {img_url}")
    print(f"Image HTTP: {r3.status_code} | Content-Type: {r3.headers.get('content-type')}")
else:
    print("\nNo avatar_url returned — AvatarDisplay will show DiceBear cartoon")
