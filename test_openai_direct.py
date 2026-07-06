"""
Direct test of OpenAI API key
"""
import os
from dotenv import load_dotenv

load_dotenv('.env')  # Load from current directory when run from backend folder

API_KEY = os.getenv("OPENAI_API_KEY")

print("=" * 70)
print("🔑 API KEY CHECK")
print("=" * 70)
print(f"API Key found: {bool(API_KEY)}")
if API_KEY:
    print(f"API Key starts with: {API_KEY[:20]}...")
    print(f"API Key length: {len(API_KEY)}")
    print()
    
    # Try to use it
    print("=" * 70)
    print("🧪 TESTING OPENAI API")
    print("=" * 70)
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=API_KEY)
        
        print("✅ OpenAI client created")
        print("Sending test message...")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello, I am working!' in one sentence."}
            ],
            max_tokens=50
        )
        
        print("✅ API call successful!")
        print(f"Response: {response.choices[0].message.content}")
        print(f"Tokens used: {response.usage.total_tokens}")
        
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
else:
    print("❌ No API key found!")
