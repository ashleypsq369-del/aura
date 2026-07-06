"""
Test family account login and dashboard access
"""
import requests
import json

base_url = "http://localhost:8000"

# Test family login
print("=" * 60)
print("Testing FAMILY Account")
print("=" * 60)

login_url = f"{base_url}/api/auth/login"
credentials = {
    "username": "family",
    "password": "family123"
}

print(f"1. Logging in as family...")
response = requests.post(login_url, json=credentials)
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data['access_token']
    user = data['user']
    
    print(f"   ✓ Login successful")
    print(f"   User: {user}")
    print(f"   Token: {token[:50]}...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Test /me endpoint
    print(f"\n2. Testing /api/auth/me endpoint...")
    me_url = f"{base_url}/api/auth/me"
    response2 = requests.get(me_url, headers=headers)
    print(f"   Status: {response2.status_code}")
    if response2.status_code == 200:
        print(f"   ✓ /me endpoint works")
        print(f"   Data: {response2.json()}")
    else:
        print(f"   ✗ /me endpoint failed: {response2.text}")
    
    # Test dashboard
    print(f"\n3. Testing /api/dashboard/summary...")
    dashboard_url = f"{base_url}/api/dashboard/summary"
    response3 = requests.get(dashboard_url, headers=headers)
    print(f"   Status: {response3.status_code}")
    
    if response3.status_code == 200:
        print(f"   ✓ Dashboard works")
        dashboard_data = response3.json()
        print(f"   Role: {dashboard_data.get('role')}")
        print(f"   Role-specific data: {dashboard_data.get('role_specific_data')}")
    else:
        print(f"   ✗ Dashboard failed")
        print(f"   Response: {response3.text}")
    
    # Test patients endpoint
    print(f"\n4. Testing /api/patients...")
    patients_url = f"{base_url}/api/patients"
    response4 = requests.get(patients_url, headers=headers)
    print(f"   Status: {response4.status_code}")
    
    if response4.status_code == 200:
        print(f"   ✓ Patients endpoint works")
    elif response4.status_code == 403:
        print(f"   ⚠ Forbidden (expected for family role)")
        print(f"   Response: {response4.text}")
    else:
        print(f"   ✗ Unexpected error")
        print(f"   Response: {response4.text}")

else:
    print(f"✗ Login failed: {response.text}")
