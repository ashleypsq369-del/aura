"""
Test Ollama-powered ChatBot
Verify conversational AI is working with local Ollama
"""

import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login"
CHAT_URL = f"{BASE_URL}/conversational-chatbot/chat"
STATUS_URL = f"{BASE_URL}/conversational-chatbot/status"

def test_chatbot():
    print("\n" + "="*60)
    print("🤖 TESTING OLLAMA-POWERED CHATBOT")
    print("="*60 + "\n")
    
    # Step 1: Check ChatBot status
    print("1️⃣ Checking ChatBot AI status...")
    try:
        response = requests.get(STATUS_URL)
        if response.status_code == 200:
            status = response.json()
            print(f"   ✅ Provider: {status['provider']}")
            print(f"   ✅ Model: {status['model']}")
            print(f"   ✅ Available: {status['available']}")
            print(f"   ✅ Local (Free): {status['is_local']}")
            print(f"   ✅ Features: {json.dumps(status['features'], indent=6)}")
        else:
            print(f"   ❌ Failed to get status: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 2: Login
    print("\n2️⃣ Logging in as test user...")
    try:
        login_data = {
            "email": "admin@projectaura.gh",
            "password": "admin123"
        }
        response = requests.post(LOGIN_URL, json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data["access_token"]
            print(f"   ✅ Logged in as: {data['user']['full_name']}")
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Step 3: Test conversational questions
    print("\n3️⃣ Testing conversational AI with Ollama...")
    
    test_questions = [
        "Hi! What's your name?",
        "Can you tell me about palliative care?",
        "How do I manage pain at home?",
        "What services does ProjectAura offer?"
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    conversation_id = None
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n   📤 Question {i}: {question}")
        
        try:
            chat_data = {
                "message": question,
                "conversation_id": conversation_id
            }
            
            response = requests.post(CHAT_URL, json=chat_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                answer = data["message"]
                model_used = data.get("model_used", "unknown")
                tokens = data.get("tokens_used", 0)
                conversation_id = data["conversation_id"]
                
                print(f"   📥 Answer ({model_used}, ~{tokens} tokens):")
                print(f"   {answer[:200]}..." if len(answer) > 200 else f"   {answer}")
                
                # Verify it's using Ollama
                if model_used and "qwen" in model_used.lower():
                    print(f"   ✅ Confirmed using Ollama!")
                else:
                    print(f"   ⚠️  Model used: {model_used} (expected qwen3.5)")
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "="*60)
    print("✅ CHATBOT TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_chatbot()
