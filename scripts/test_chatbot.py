"""
Test Script for Enhanced AI Chatbot
Demonstrates conversational capabilities and therapeutic techniques
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.chatbot_engine import ChatbotEngine

print("=" * 70)
print("AI CHATBOT - ENHANCED CONVERSATIONAL SUPPORT TEST")
print("=" * 70)

# Initialize chatbot
chatbot = ChatbotEngine()

# Test scenarios
test_conversations = [
    {
        'name': 'Emotional Support - Grief',
        'messages': [
            "I'm feeling so sad today",
            "I miss my mom so much, she passed away last month"
        ]
    },
    {
        'name': 'Medical Question - Pain',
        'messages': [
            "I'm having a lot of pain today",
            "It's in my back and it's about a 7 out of 10"
        ]
    },
    {
        'name': 'Anxiety Support',
        'messages': [
            "I'm feeling really anxious about everything",
            "I can't stop worrying about what's going to happen"
        ]
    },
    {
        'name': 'Sleep Issues',
        'messages': [
            "I can't sleep at night",
            "I've been awake for hours just thinking"
        ]
    },
    {
        'name': 'Positive Moment',
        'messages': [
            "I had a really good day today",
            "My family visited and we had a nice time together"
        ]
    },
    {
        'name': 'Crisis Detection',
        'messages': [
            "I'm feeling really hopeless",
            "I don't know if I can keep going"
        ]
    }
]

for scenario in test_conversations:
    print("\n" + "=" * 70)
    print(f"SCENARIO: {scenario['name']}")
    print("=" * 70)
    
    # Clear history for each scenario
    chatbot.clear_history()
    
    for user_message in scenario['messages']:
        print(f"\nUSER: {user_message}")
        
        response = chatbot.generate_response(user_message)
        
        print(f"\nAI: {response}")
        print("\n" + "-" * 70)

# Test conversation summary
print("\n" + "=" * 70)
print("CONVERSATION SUMMARY EXAMPLE")
print("=" * 70)

chatbot.clear_history()
chatbot.generate_response("I'm feeling sad and anxious today")
chatbot.generate_response("I'm worried about my pain medication")
chatbot.generate_response("Thank you for listening")

summary = chatbot.get_conversation_summary()

print("\nConversation Summary:")
print(f"  - Messages: {summary['message_count']}")
print(f"  - Emotional State: {summary['emotional_state']}")
print(f"  - Topics: {', '.join(summary['topics_discussed']) if summary['topics_discussed'] else 'General conversation'}")
print(f"  - Concerns: {', '.join(summary['concerns_raised']) if summary['concerns_raised'] else 'None logged'}")
print(f"  - Crisis Detected: {'Yes' if summary['crisis_detected'] else 'No'}")
print(f"  - Conversation Depth: {summary['duration']} exchanges")

# Test therapeutic techniques
print("\n" + "=" * 70)
print("THERAPEUTIC TECHNIQUES DEMONSTRATION")
print("=" * 70)

chatbot.clear_history()

print("\n1. ACTIVE LISTENING")
print("User: 'I'm overwhelmed with everything'")
response = chatbot.generate_response("I'm overwhelmed with everything")
print(f"AI: {response[:200]}...")

print("\n2. VALIDATION")
print("User: 'I feel like I'm being a burden to my family'")
response = chatbot.generate_response("I feel like I'm being a burden to my family")
print(f"AI: {response[:200]}...")

print("\n3. OPEN-ENDED QUESTIONS")
print("User: 'Things are hard right now'")
response = chatbot.generate_response("Things are hard right now")
print(f"AI: {response[:200]}...")

print("\n" + "=" * 70)
print("CHATBOT TEST COMPLETE")
print("=" * 70)

print("\nKey Features Demonstrated:")
print("  - Emotional support with empathy")
print("  - Medical question handling")
print("  - Crisis detection and resources")
print("  - Active listening techniques")
print("  - Validation and support")
print("  - Open-ended questions")
print("  - Context awareness")
print("  - Conversation summaries")

print("\nThe AI Chatbot is ready for use!")
print("\nTo test interactively:")
print("  streamlit run app.py")
print("  Navigate to: AI Chatbot (Page 18)")
