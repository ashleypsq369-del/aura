"""
Test script for the new Conversational ChatBot
Tests both fallback mode and shows what responses look like
"""

import requests
import json

base_url = "http://localhost:8000"

# First, login to get token
print("=" * 70)
print("🔐 LOGGING IN...")
print("=" * 70)

login_response = requests.post(
    f"{base_url}/api/auth/login",
    json={"username": "clinician", "password": "clinician123"}
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful\n")
else:
    print(f"❌ Login failed: {login_response.status_code}")
    exit(1)

# Check ChatBot status
print("=" * 70)
print("📊 CHECKING CHATBOT STATUS...")
print("=" * 70)

status_response = requests.get(
    f"{base_url}/api/conversational-chatbot/status",
    headers=headers
)

if status_response.status_code == 200:
    status = status_response.json()
    print(f"Provider: {status['provider']}")
    print(f"Model: {status['model']}")
    print(f"Available: {status['available']}")
    print(f"Features: {json.dumps(status['features'], indent=2)}")
    print()
else:
    print(f"❌ Status check failed: {status_response.status_code}\n")

# Test everyday questions
questions = [
    "Hi, how are you today?",
    "I'm feeling a bit anxious about my health",
    "Can you explain what palliative care means?",
    "What should I eat to stay healthy?",
    "I'm having trouble sleeping at night",
    "Tell me about managing pain",
    "How can I support my family member who is ill?",
    "What are some coping strategies for stress?"
]

print("=" * 70)
print("💬 TESTING CONVERSATIONAL CHATBOT")
print("=" * 70)
print()

conversation_id = None

for i, question in enumerate(questions, 1):
    print(f"\n{'='*70}")
    print(f"❓ QUESTION {i}: {question}")
    print(f"{'='*70}\n")
    
    # Send message
    chat_data = {
        "message": question,
        "conversation_id": conversation_id,
        "patient_context_id": None
    }
    
    response = requests.post(
        f"{base_url}/api/conversational-chatbot/chat",
        json=chat_data,
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        conversation_id = data["conversation_id"]  # Save for next message
        
        print(f"🤖 RESPONSE:")
        print(f"Model: {data.get('model_used', 'unknown')}")
        if data.get('tokens_used'):
            print(f"Tokens: {data['tokens_used']}")
        print()
        print(data["message"])
        print()
        
        # Only test first 3 questions to avoid spamming
        if i >= 3:
            print("\n✅ ChatBot is responding! (Stopping at 3 questions)")
            break
    else:
        print(f"❌ Request failed: {response.status_code}")
        print(response.text)
        break

print("\n" + "=" * 70)
print("🎯 TEST SUMMARY")
print("=" * 70)
print()
print("What you should see:")
print("• If API key is configured: Natural, empathetic responses")
print("• If no API key: Compassionate fallback responses")
print("• Both modes: Appropriate for healthcare context")
print()
print("To enable full AI:")
print("1. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to backend/.env")
print("2. Restart backend")
print("3. Run this test again")
print()
print("=" * 70)
