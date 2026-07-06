"""
Debug JWT token
"""
import requests
import json
from jose import jwt
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Get token
login_url = "http://localhost:8000/api/auth/login"
credentials = {
    "username": "clinician",
    "password": "clinician123"
}

response = requests.post(login_url, json=credentials)
if response.status_code == 200:
    data = response.json()
    token = data['access_token']
    
    print("Token:", token[:50] + "...")
    print("\nSECRET_KEY from .env:", SECRET_KEY)
    print()
    
    # Try to decode with the secret key
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("✓ Token decoded successfully!")
        print("Payload:", json.dumps(payload, indent=2))
    except Exception as e:
        print(f"✗ Failed to decode token: {e}")
        
    # Try decoding without verification to see what's inside
    print("\n" + "=" * 60)
    print("Decoding without verification:")
    try:
        payload_unverified = jwt.decode(token, options={"verify_signature": False})
        print(json.dumps(payload_unverified, indent=2))
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"Login failed: {response.text}")
