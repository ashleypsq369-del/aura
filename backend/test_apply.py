"""Test POST /api/services/apply"""
import requests, json, time

payload = {
    "username": f"test_nurse_{int(time.time())}",
    "email": f"test_{int(time.time())}@test.com",
    "password": "TestPass1",
    "full_name": "Test Nurse Provider",
    "phone": "0241234567",
    "gender": "female",
    "date_of_birth": "1990-05-15",
    "service_type": "nurse",
    "bio": "Experienced palliative care nurse with 5 years in home-based care across Accra.",
    "years_experience": 5,
    "qualifications": [{"title": "RGN", "institution": "University of Ghana", "year": "2018"}],
    "region": "Greater Accra",
    "assessment_answers": {"1": 1, "2": 1, "3": 2, "4": 1, "5": 1},
}

r = requests.post("http://127.0.0.1:8000/api/services/apply", json=payload)
print(f"Status: {r.status_code}")
if r.ok:
    print(json.dumps(r.json(), indent=2))
else:
    print("Error:", r.text[:500])
