import requests
import json

try:
    # First login to get token
    login_response = requests.post('http://localhost:8000/api/auth/login', json={
        'username': 'clinician',
        'password': 'clinician123'
    })
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code}")
        print(login_response.text)
        exit(1)
    
    token = login_response.json()['access_token']
    print(f"✅ Login successful, got token")
    
    # Now test the AI insights endpoint
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get('http://localhost:8000/api/ai-analysis/system-insights', headers=headers)
    
    print(f"\n📊 AI Insights Endpoint Test:")
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse Body:")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS!")
        print(f"Total Patients: {data['trends']['total_patients']}")
        print(f"Critical: {data['trends']['critical_count']}")
        print(f"Deteriorating: {data['trends']['deteriorating_count']}")
        print(f"Stable: {data['trends']['stable_count']}")
        print(f"\nClinical Summary: {data['clinical_summary']}")
    else:
        print(f"❌ ERROR!")
        print(response.text)
except Exception as e:
    print(f"💥 Exception: {e}")
    import traceback
    traceback.print_exc()
