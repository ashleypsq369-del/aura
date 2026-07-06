"""
Test the complete authentication flow
"""
import requests
import json

base_url = "http://localhost:8000"

# Step 1: Login
print("=" * 60)
print("STEP 1: Login")
print("=" * 60)

login_url = f"{base_url}/api/auth/login"
credentials = {
    "username": "clinician",
    "password": "clinician123"
}

response = requests.post(login_url, json=credentials)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data['access_token']
    print(f"Token received: {token[:50]}...")
    print(f"User: {data['user']}")
    
    # Step 2: Test authenticated request
    print("\n" + "=" * 60)
    print("STEP 2: Test Dashboard with Token")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    dashboard_url = f"{base_url}/api/dashboard/summary"
    response2 = requests.get(dashboard_url, headers=headers)
    print(f"Status: {response2.status_code}")
    
    if response2.status_code == 200:
        print("✓ Dashboard accessed successfully!")
        print(json.dumps(response2.json(), indent=2)[:500])
    else:
        print(f"✗ Dashboard failed!")
        print(f"Response: {response2.text}")
        
    # Step 3: Test patients endpoint
    print("\n" + "=" * 60)
    print("STEP 3: Test Patients with Token")
    print("=" * 60)
    
    patients_url = f"{base_url}/api/patients"
    response3 = requests.get(patients_url, headers=headers)
    print(f"Status: {response3.status_code}")
    
    if response3.status_code == 200:
        print("✓ Patients accessed successfully!")
    else:
        print(f"✗ Patients failed!")
        print(f"Response: {response3.text}")

else:
    print(f"Login failed: {response.text}")
