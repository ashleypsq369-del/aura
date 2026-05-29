"""Conversational Support Module"""
import random

def generate_response(user_input, context="general"):
    """Generate supportive response"""
    responses = {
        "general": [
            "I'm here to listen and support you.",
            "Thank you for sharing. How are you feeling right now?",
            "That sounds challenging. Would you like to talk more about it?"
        ],
        "grief": [
            "Grief is a natural process. Take all the time you need.",
            "Your feelings are valid. It's okay to feel this way.",
            "I'm here with you through this difficult time."
        ],
        "anxiety": [
            "Let's take a deep breath together.",
            "You're not alone in feeling this way.",
            "Would you like to try a calming exercise?"
        ]
    }
    
    response_list = responses.get(context, responses["general"])
    return random.choice(response_list)

def detect_crisis_keywords(text):
    """Detect crisis keywords in text"""
    crisis_words = ['suicide', 'kill myself', 'end it all', 'no reason to live', 'hurt myself']
    text_lower = text.lower()
    return any(word in text_lower for word in crisis_words)

def get_crisis_resources():
    """Get crisis resources"""
    return {
        "hotline": "988 - Suicide & Crisis Lifeline",
        "text": "Text HOME to 741741",
        "emergency": "Call 911 for immediate help"
    }


def detect_crisis(text):
    """Detect crisis situation from text - alias for detect_crisis_keywords"""
    return detect_crisis_keywords(text)
