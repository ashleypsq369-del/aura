"""Sentiment Analysis Module"""
import re

def analyze_sentiment(text):
    """Analyze sentiment of text"""
    if not text:
        return "neutral"
    
    text_lower = text.lower()
    
    # Positive words
    positive_words = ['happy', 'joy', 'love', 'grateful', 'peace', 'hope', 'better', 'good', 'wonderful']
    # Negative words
    negative_words = ['sad', 'pain', 'hurt', 'difficult', 'hard', 'struggle', 'worry', 'fear', 'anxious']
    
    pos_count = sum(1 for word in positive_words if word in text_lower)
    neg_count = sum(1 for word in negative_words if word in text_lower)
    
    if pos_count > neg_count:
        return "positive"
    elif neg_count > pos_count:
        return "negative"
    else:
        return "neutral"

def detect_grief_stage(text):
    """Detect grief stage from text"""
    if not text:
        return "Unknown"
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['deny', 'cannot believe', 'not real']):
        return "Denial"
    elif any(word in text_lower for word in ['angry', 'unfair', 'why me']):
        return "Anger"
    elif any(word in text_lower for word in ['if only', 'what if', 'should have']):
        return "Bargaining"
    elif any(word in text_lower for word in ['sad', 'empty', 'hopeless', 'depressed']):
        return "Depression"
    elif any(word in text_lower for word in ['accept', 'peace', 'moving forward']):
        return "Acceptance"
    else:
        return "Processing"
