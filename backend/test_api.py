"""Quick API end-to-end test for the new care setting + professional verification features."""
import requests

BASE = "http://localhost:8000"

# Try to login
passwords = ['Admin@1234', 'admin123', 'Admin1234', 'Password1', 'Aura@2024', 'admin@123']
token = None
for pwd in passwords:
    r = requests.post(f"{BASE}/api/auth/login", json={"username": "admin", "password": pwd})
    if r.status_code == 200:
        token = r.json()["access_token"]
        user = r.json()["user"]
        print("=== LOGIN ===")
        print(f"  Status: OK")
        print(f"  care_setting in response: {'care_setting' in user}")
        print(f"  is_professional in response: {'is_professional' in user}")
        print(f"  professional_title in response: {'professional_title' in user}")
        break

if not token:
    print("Could not login with known passwords. Check credentials.")
    import sys; sys.exit(1)

H = {"Authorization": f"Bearer {token}"}

# Test care settings endpoints
tests = [
    ("GET /api/care-settings/templates",    requests.get(f"{BASE}/api/care-settings/templates", headers=H)),
    ("GET /api/care-settings/dashboard",    requests.get(f"{BASE}/api/care-settings/dashboard", headers=H)),
    ("GET /api/care-settings/interactions", requests.get(f"{BASE}/api/care-settings/interactions", headers=H)),
    ("GET /api/admin/users",                requests.get(f"{BASE}/api/admin/users", headers=H)),
]

print("\n=== API ENDPOINTS ===")
for name, resp in tests:
    status = "PASS" if resp.status_code == 200 else f"FAIL ({resp.status_code})"
    print(f"  {status}  {name}")

# Check admin users response includes new fields
r = requests.get(f"{BASE}/api/admin/users", headers=H)
users = r.json().get("users", [])
if users:
    u = users[0]
    print("\n=== ADMIN USER FIELDS ===")
    for field in ["care_setting", "is_professional", "professional_title", "care_setting_change_request"]:
        print(f"  {field}: {'present' if field in u else 'MISSING'}")

print("\nAll tests complete.")
