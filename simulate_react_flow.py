"""
Simulate the exact flow that happens in the React app
"""
import requests
import time

base_url = "http://localhost:8000"

print("="*70)
print("SIMULATING REACT APP FLOW FOR FAMILY USER")
print("="*70)

# Step 1: Login (like Login.jsx does)
print("\n[1] Login Request")
print("-" * 70)
login_response = requests.post(
    f"{base_url}/api/auth/login",
    json={"username": "family", "password": "family123"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.text}")
    exit(1)

login_data = login_response.json()
token = login_data['access_token']
user = login_data['user']

print(f"✅ Login successful")
print(f"   Token: {token[:40]}...")
print(f"   User: {user['username']} ({user['role']})")

headers = {"Authorization": f"Bearer {token}"}

# Step 2: AuthContext might verify token (checking /me endpoint)
print("\n[2] Verify Token (AuthContext pattern)")
print("-" * 70)
time.sleep(0.1)  # Small delay like in real app

me_response = requests.get(f"{base_url}/api/auth/me", headers=headers)
print(f"   Status: {me_response.status_code}")

if me_response.status_code == 200:
    print(f"   ✅ Token is valid")
else:
    print(f"   ❌ Token verification failed!")
    print(f"   Response: {me_response.text}")
    exit(1)

# Step 3: Navigate to Dashboard - ProtectedRoute checks isAuthenticated
print("\n[3] Protected Route Check")
print("-" * 70)
print("   ✅ isAuthenticated = true (token exists in localStorage)")

# Step 4: Dashboard component mounts and makes queries
print("\n[4] Dashboard Data Fetch")
print("-" * 70)

# Query 1: Dashboard summary (always runs)
print("   [4a] Fetching dashboard summary...")
dashboard_response = requests.get(f"{base_url}/api/dashboard/summary", headers=headers)
print(f"        Status: {dashboard_response.status_code}")

if dashboard_response.status_code == 200:
    print(f"        ✅ Dashboard data fetched")
    dash_data = dashboard_response.json()
    print(f"        Role: {dash_data.get('role')}")
else:
    print(f"        ❌ Dashboard fetch failed!")
    print(f"        Response: {dashboard_response.text}")
    if dashboard_response.status_code == 401:
        print("\n🔥 THIS WOULD TRIGGER LOGOUT IN THE REACT APP!")
    exit(1)

# Query 2: Patients (conditionally enabled for clinician/admin only)
print("\n   [4b] Patients query (enabled: false for family role)")
print("        ⏭️  Skipped (not enabled for family role)")

# Check if any other queries run
print("\n[5] All Initial Queries Complete")
print("-" * 70)
print("   ✅ No 401 errors detected")
print("   ✅ User should stay logged in")

print("\n" + "="*70)
print("SIMULATION COMPLETE - NO ISSUES FOUND")
print("="*70)
print("\nIf the React app is still logging out family users, the issue might be:")
print("  1. A frontend error (check browser console for errors)")
print("  2. A navigation/routing issue")
print("  3. An API call not captured in this simulation")
print("  4. A race condition or timing issue")
print("\nNext step: Check the browser console for errors when family logs in")
