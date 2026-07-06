import requests
import json
import sys

# Reconfigure stdout to use utf-8 to avoid Windows console encoding issues
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:8000"

# 1. Login to get token
passwords = ['Admin@1234', 'admin123', 'Admin1234', 'Password1', 'Aura@2024', 'admin@123']
token = None
for pwd in passwords:
    r = requests.post(f"{BASE}/api/auth/login", json={"username": "admin", "password": pwd})
    if r.status_code == 200:
        token = r.json()["access_token"]
        break

if not token:
    print("Could not login.")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 2. Start a stream for first message "hello"
print("--- FIRST MESSAGE ---")
r = requests.get(f"{BASE}/api/llm-chatbot/stream?message=hello", headers=headers, stream=True)
print(f"Status: {r.status_code}")
conv_id = None
for line in r.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        print(decoded)
        if decoded.startswith("data: "):
            try:
                payload = json.loads(decoded[6:])
                if payload.get("type") == "meta":
                    conv_id = payload.get("conversation_id")
            except Exception as e:
                print("Error parsing json:", e)

print(f"Captured Conversation ID: {conv_id}")

if not conv_id:
    print("No conversation ID returned.")
    exit(1)

# 3. Send second message with conversation_id
print("\n--- SECOND MESSAGE ---")
url = f"{BASE}/api/llm-chatbot/stream?message=how%20are%20you&conversation_id={conv_id}"
r = requests.get(url, headers=headers, stream=True)
print(f"Status: {r.status_code}")
for line in r.iter_lines():
    if line:
        print(line.decode('utf-8'))
