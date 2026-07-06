"""
Test the login endpoint directly
"""
import requests
import json

url = "http://localhost:8000/api/auth/login"
credentials = {
    "username": "clinician",
    "password": "clinician123"
}

print(f"Testing login to: {url}")
print(f"Credentials: {credentials}")
print()

try:
    response = requests.post(url, json=credentials)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response'):
        print(f"Response text: {e.response.text}")
