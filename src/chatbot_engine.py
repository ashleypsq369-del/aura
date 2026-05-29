"""
Advanced Chatbot Engine for Project Aura
Provides intelligent, context-aware conversations with emotional support
Incorporates therapeutic techniques: Active Listening, Validation, CBT, Motivational Interviewing
Includes ethical guidelines and intelligent referral system
"""
import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import random
from src.ethical_guidelines import EthicalGuidelines

class ChatbotEngine:
    """Advanced chatbot with context awareness and emotional intelligence"""
    
    def __init__(self):
        self.conversation_history = []
        self.user_context = {
            'name': None,
            'mood': 'neutral',
            'topics_discussed': [],
            'concerns': [],
            'emotional_state': 'unknown',
            'conversation_depth': 0,
            'last_topic': None,
            'referrals_made': []
        }
        
        # Initialize ethical guidelines system
        self.ethics = EthicalGuidelines()
        
        # Therapeutic techniques
        self.active_listening_phrases = [
            "I hear you saying that",
            "It sounds like you're feeling",
            "What I'm understanding is",
            "Let me make sure I understand",
            "So what you're experiencing is"
        ]
        
        self.validation_phrases = [
            "That makes complete sense given what you're going through",
            "Your feelings are completely valid",
            "Anyone in your situation would feel this way",
            "It's understandable that you feel",
            "You have every right to feel"
        ]
        
        self.open_ended_questions = [
            "Can you tell me more about that?",
            "What does that mean to you?",
            "How has this been affecting you?",
            "What would help you feel better?",
            "What's the hardest part about this?"
        ]
        
    def generate_response(self, user_message: str, context: Optional[Dict] = None) -> str:
        """Generate intelligent response based on user input with ethical guidelines"""
        
        # Update context
        if context:
            self.user_context.update(context)
        
        # Increment conversation depth
        self.user_context['conversation_depth'] += 1
        
        # Store message
        self.conversation_history.append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.now().isoformat()
        })
        
        # Analyze message
        message_lower = user_message.lower()
        
        # Detect emotional state
        self.user_context['emotional_state'] = self._detect_emotional_state(message_lower)
        
        # Analyze question type for ethical referrals
        question_types = self.ethics.analyze_question_type(user_message)
        referral = self.ethics.get_referral_recommendation(question_types)
        
        # Check if escalation to human is needed
        should_escalate, escalation_msg = self.ethics.should_escalate_to_human(
            user_message, 
            self.user_context['conversation_depth']
        )
        
        # Check for crisis (highest priority)
        is_crisis, crisis_type = self._detect_crisis(message_lower)
        if is_crisis:
            response = self._handle_crisis(crisis_type)
        
        # Check if escalation is needed
        elif should_escalate:
            response = escalation_msg
        
        # Check for gratitude/positive feedback
        elif self._is_gratitude(message_lower):
            response = self._handle_gratitude()
        
        # Check for greeting
        elif self._is_greeting(message_lower):
            response = self._handle_greeting()
        
        # Check for farewell
        elif self._is_farewell(message_lower):
            response = self._handle_farewell()
        
        # Check for affirmation/agreement
        elif self._is_affirmation(message_lower):
            response = self._handle_affirmation()
        
        # Check for questions
        elif '?' in user_message:
            response = self._handle_question(message_lower, user_message)
            # Add referral if needed
            if referral['should_refer']:
                response += "\n\n" + self.ethics.format_referral_message(referral)
                self.user_context['referrals_made'].append(referral)
        
        # Check for strong emotions (needs validation)
        elif self._contains_strong_emotion(message_lower):
            response = self._handle_strong_emotion(message_lower, user_message)
            # Add mental health referral if appropriate
            if 'mental_health' in question_types or 'grief' in question_types:
                response += "\n\n" + self.ethics.format_referral_message(referral, include_disclaimer=False)
                self.user_context['referrals_made'].append(referral)
        
        # Check for emotions
        elif self._contains_emotion(message_lower):
            response = self._handle_emotion(message_lower, user_message)
            # Add referral for prolonged emotional distress
            if self.user_context['conversation_depth'] > 4 and referral['should_refer']:
                response += "\n\n" + self.ethics.format_referral_message(referral, include_disclaimer=False)
                self.user_context['referrals_made'].append(referral)
        
        # Check for specific topics
        elif any(word in message_lower for word in ['pain', 'medication', 'doctor', 'appointment', 'symptom']):
            response = self._handle_medical_topic(message_lower, user_message)
            # Always add medical referral
            if referral['should_refer']:
                response += "\n\n" + self.ethics.format_referral_message(referral)
                self.user_context['referrals_made'].append(referral)
        
        elif any(word in message_lower for word in ['family', 'loved one', 'miss', 'grief', 'loss', 'death', 'dying']):
            response = self._handle_grief_topic(message_lower, user_message)
            # Add grief counselor referral
            if referral['should_refer']:
                response += "\n\n" + self.ethics.format_referral_message(referral, include_disclaimer=False)
                self.user_context['referrals_made'].append(referral)
        
        elif any(word in message_lower for word in ['sleep', 'tired', 'exhausted', 'fatigue', 'rest']):
            response = self._handle_sleep_topic(message_lower)
            # Add medical referral for persistent sleep issues
            if self.user_context['conversation_depth'] > 2:
                response += "\n\n**Note:** Persistent sleep issues should be discussed with your doctor or nurse."
        
        elif any(word in message_lower for word in ['eat', 'food', 'appetite', 'hungry', 'nutrition']):
            response = self._handle_nutrition_topic(message_lower)
            # Always add medical referral for nutrition concerns
            response += "\n\n**Important:** Please discuss nutrition concerns with your care team."
        
        elif any(word in message_lower for word in ['memory', 'remember', 'forget', 'confused']):
            response = self._handle_memory_topic(message_lower)
            # Add medical referral
            response += "\n\n**Note:** Memory changes should be evaluated by your doctor."
        
        # General conversation with active listening
        else:
            response = self._handle_general(message_lower, user_message)
            # Add gentle referral reminder if conversation is deep
            if self.user_context['conversation_depth'] > 6:
                response += "\n\n" + self.ethics.get_ethical_reminder('general')
        
        # Store response
        self.conversation_history.append({
            'role': 'assistant',
            'content': response,
            'timestamp': datetime.now().isoformat(),
            'referral_made': referral['should_refer'],
            'question_types': question_types
        })
        
        return response
    
    
    def _detect_emotional_state(self, message: str) -> str:
        """Detect overall emotional state from message"""
        if any(word in message for word in ['crisis', 'emergency', 'help me', 'can\'t take', 'end it']):
            return 'crisis'
        elif any(word in message for word in ['angry', 'furious', 'rage', 'hate', 'mad']):
            return 'angry'
        elif any(word in message for word in ['sad', 'depressed', 'hopeless', 'miserable', 'crying']):
            return 'sad'
        elif any(word in message for word in ['anxious', 'worried', 'scared', 'panic', 'nervous']):
            return 'anxious'
        elif any(word in message for word in ['happy', 'good', 'better', 'grateful', 'peaceful']):
            return 'positive'
        elif any(word in message for word in ['confused', 'lost', 'don\'t know', 'uncertain']):
            return 'confused'
        else:
            return 'neutral'
    
    def _is_gratitude(self, message: str) -> bool:
        """Check if message expresses gratitude"""
        gratitude_words = ['thank', 'thanks', 'grateful', 'appreciate', 'helpful']
        return any(word in message for word in gratitude_words)
    
    def _handle_gratitude(self) -> str:
        """Handle expressions of gratitude"""
        responses = [
            "You're very welcome. I'm glad I could help. Is there anything else you'd like to talk about?",
            "I'm happy to be here for you. That's what I'm here for. How else can I support you?",
            "It's my pleasure to support you. You're doing great by reaching out. What else is on your mind?",
            "Thank you for sharing that. I'm here whenever you need. Is there anything else I can help with?"
        ]
        return random.choice(responses)
    
    def _is_affirmation(self, message: str) -> bool:
        """Check if message is affirmation/agreement"""
        affirmations = ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'right', 'exactly', 'that\'s right']
        return message.strip() in affirmations or any(message.startswith(aff) for aff in affirmations)
    
    def _handle_affirmation(self) -> str:
        """Handle affirmations by continuing conversation"""
        if self.user_context['last_topic']:
            return f"I'm glad that resonates with you. {random.choice(self.open_ended_questions)}"
        else:
            return "I'm listening. What would you like to share?"
    
    def _contains_strong_emotion(self, message: str) -> bool:
        """Check for strong emotional expressions"""
        strong_emotions = ['devastated', 'destroyed', 'broken', 'shattered', 'unbearable', 
                          'overwhelming', 'crushing', 'terrible', 'awful', 'horrible',
                          'can\'t cope', 'falling apart', 'losing it']
        return any(emotion in message for emotion in strong_emotions)
    
    def _handle_strong_emotion(self, message: str, original: str) -> str:
        """Handle strong emotions with validation and support"""
        # Use active listening
        listening = random.choice(self.active_listening_phrases)
        
        # Add validation
        validation = random.choice(self.validation_phrases)
        
        # Offer support
        support_options = [
            "I'm here with you through this. You don't have to face it alone.",
            "Would it help to talk about what's making this so difficult?",
            "Sometimes just naming these feelings can help. I'm here to listen.",
            "What would feel most supportive to you right now?"
        ]
        
        return f"{listening} you're experiencing something very difficult. {validation}. {random.choice(support_options)}"
    
    def _detect_crisis(self, message: str) -> Tuple[bool, str]:
        """Detect crisis language"""
        crisis_patterns = {
            'suicide': ['kill myself', 'end my life', 'want to die', 'suicide', 'not worth living', 'better off dead'],
            'self_harm': ['hurt myself', 'harm myself', 'cut myself', 'injure myself'],
            'severe_distress': ['can\'t go on', 'give up', 'no hope', 'hopeless', 'can\'t take it', 'end it all']
        }
        
        for crisis_type, patterns in crisis_patterns.items():
            if any(pattern in message for pattern in patterns):
                return True, crisis_type
        
        return False, None
    
    def _handle_crisis(self, crisis_type: str) -> str:
        """Handle crisis situations with immediate support"""
        responses = {
            'suicide': """🚨 I'm very concerned about what you're sharing. Your life matters deeply, and help is available right now.

**Please call 988 (Suicide & Crisis Lifeline) immediately** - they're available 24/7 with trained counselors.

Or text HOME to 741741 for the Crisis Text Line.

I'm here with you, but please reach out to them now. You don't have to face this alone. Would you like me to help you connect with your care team as well?""",
            
            'self_harm': """🚨 I hear that you're in pain and thinking about hurting yourself. Please know that you don't have to face this alone.

**Please call 988 or text HOME to 741741 right now.** These are trained counselors who can help immediately.

Your care team also needs to know about this. Can I help you reach out to them? You deserve support and safety.""",
            
            'severe_distress': """I can hear how much you're struggling right now, and I want you to know that support is available. You don't have to go through this alone.

**Crisis resources available 24/7:**
- Call 988 (Suicide & Crisis Lifeline)
- Text HOME to 741741 (Crisis Text Line)

Would it help to talk to a counselor right now? I'm here to listen too, and I can help you connect with your care team."""
        }
        return responses.get(crisis_type, responses['severe_distress'])
        """Detect crisis language"""
        crisis_patterns = {
            'suicide': ['kill myself', 'end my life', 'want to die', 'suicide', 'not worth living'],
            'self_harm': ['hurt myself', 'harm myself', 'cut myself'],
            'severe_distress': ['can\'t go on', 'give up', 'no hope', 'hopeless', 'can\'t take it']
        }
        
        for crisis_type, patterns in crisis_patterns.items():
            if any(pattern in message for pattern in patterns):
                return True, crisis_type
        
        return False, None
    
    def _handle_crisis(self, crisis_type: str) -> str:
        """Handle crisis situations with immediate support"""
        responses = {
            'suicide': "I'm very concerned about what you're sharing. Your life matters, and help is available right now. Please call 988 (Suicide & Crisis Lifeline) immediately - they're available 24/7. I'm here with you, but please reach out to them now. Would you like me to help you connect with someone?",
            'self_harm': "I hear that you're in pain and thinking about hurting yourself. Please know that you don't have to face this alone. Call 988 or text HOME to 741741 right now. These are trained counselors who can help. Can I help you reach out to your care team?",
            'severe_distress': "I can hear how much you're struggling right now, and I want you to know that support is available. You don't have to go through this alone. Would it help to talk to a counselor? The Crisis Text Line (text HOME to 741741) is available 24/7. I'm here to listen too."
        }
        return responses.get(crisis_type, responses['severe_distress'])
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting"""
        greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings']
        return any(greeting in message for greeting in greetings)
    
    def _handle_greeting(self) -> str:
        """Handle greetings warmly"""
        greetings = [
            "Hello! I'm here to support you. How are you feeling today?",
            "Hi there! It's good to hear from you. What's on your mind?",
            "Hello! I'm here to listen and help. How can I support you today?",
            "Hi! Thank you for reaching out. How are you doing right now?",
            "Hello! I'm glad you're here. What would you like to talk about?"
        ]
        return random.choice(greetings)
    
    def _is_farewell(self, message: str) -> bool:
        """Check if message is a farewell"""
        farewells = ['goodbye', 'bye', 'see you', 'talk later', 'gotta go', 'have to go']
        return any(farewell in message for farewell in farewells)
    
    def _handle_farewell(self) -> str:
        """Handle farewells supportively"""
        farewells = [
            "Take care of yourself. I'm here whenever you need to talk. 💙",
            "Goodbye for now. Remember, I'm always here when you need support. 🌟",
            "It was good talking with you. Reach out anytime you need. Take care! 💚",
            "I'll be here whenever you need me. Wishing you peace and comfort. 🕊️",
            "Take good care. I'm just a message away whenever you need support. 💛"
        ]
        return random.choice(farewells)
    
    def _handle_question(self, message: str) -> str:
        """Handle questions intelligently"""
        
        # Medication questions
        if any(word in message for word in ['medication', 'medicine', 'pill', 'drug']):
            return "I can help you with medication information. You can view your current medications, schedules, and add new ones in the Medication Management page. Would you like me to guide you there, or do you have a specific question about your medications?"
        
        # Pain questions
        elif any(word in message for word in ['pain', 'hurt', 'ache', 'discomfort']):
            return "I understand you're asking about pain. Managing pain is so important for your comfort. You can log your pain levels in the system, and your care team will be notified. On a scale of 1-10, how would you rate your pain right now? Also, when did it start?"
        
        # Appointment questions
        elif any(word in message for word in ['appointment', 'visit', 'doctor', 'nurse']):
            return "I can help with appointments! You can view upcoming appointments, schedule new ones, or contact your care team in the Appointment Scheduling page. Would you like to schedule an appointment or check your upcoming visits?"
        
        # Support questions
        elif any(word in message for word in ['help', 'support', 'talk', 'listen']):
            return "I'm here to support you in any way I can. You can talk to me about how you're feeling, ask questions about your care, or I can connect you with resources. What would be most helpful for you right now?"
        
        # General questions
        else:
            return "That's a great question. I'm here to help you navigate your care and provide support. Could you tell me a bit more about what you're looking for? I can help with medications, appointments, emotional support, or connecting you with your care team."
    
    def _contains_emotion(self, message: str) -> bool:
        """Check if message contains emotional content"""
        emotions = ['feel', 'feeling', 'sad', 'happy', 'angry', 'scared', 'worried', 'anxious', 
                   'depressed', 'lonely', 'overwhelmed', 'grateful', 'peaceful', 'hopeful']
        return any(emotion in message for emotion in emotions)
    
    def _handle_emotion(self, message: str) -> str:
        """Handle emotional expressions with empathy"""
        
        # Positive emotions
        if any(word in message for word in ['happy', 'good', 'better', 'grateful', 'peaceful', 'hopeful', 'joy']):
            return "I'm so glad to hear you're feeling this way. It's wonderful that you're experiencing these positive moments. Would you like to share more about what's bringing you comfort or joy?"
        
        # Sadness
        elif any(word in message for word in ['sad', 'down', 'blue', 'unhappy', 'miss', 'missing']):
            return "I hear that you're feeling sad, and that's completely understandable. Your feelings are valid. Sometimes it helps to talk about what's weighing on you. I'm here to listen without judgment. Would you like to share more?"
        
        # Anxiety/worry
        elif any(word in message for word in ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'fear']):
            return "It sounds like you're carrying some worry right now. That can feel really heavy. What's concerning you most? Sometimes naming our worries can help us address them. I'm here to listen and help however I can."
        
        # Overwhelmed
        elif any(word in message for word in ['overwhelmed', 'too much', 'can\'t handle', 'stressed']):
            return "Feeling overwhelmed is exhausting. You're dealing with a lot, and it makes sense that it feels like too much sometimes. Let's take this one step at a time. What feels most pressing right now? We can work through it together."
        
        # Lonely
        elif any(word in message for word in ['lonely', 'alone', 'isolated']):
            return "Loneliness can be one of the hardest feelings. Please know that you're not alone - I'm here, and your care team is here for you. Would it help to connect with someone? I can help you reach out to family, friends, or a counselor."
        
        # General emotional support
        else:
            return "Thank you for sharing how you're feeling with me. Your emotions are important and valid. I'm here to listen and support you. Would you like to talk more about what you're experiencing?"
    
    def _handle_medical_topic(self, message: str) -> str:
        """Handle medical-related topics"""
        responses = [
            "I understand you're concerned about your medical care. Your care team is here to support you. Would you like me to help you log this concern so your doctor or nurse can address it? Or would you prefer to schedule an appointment?",
            "That's an important medical topic. I want to make sure you get the right information from your healthcare team. I can help you document this question or concern, and your care team will be notified. Would that be helpful?",
            "Your health and comfort are the top priority. I can help you track this information and make sure your care team sees it. Would you also like to speak with a nurse or doctor about this?"
        ]
        return random.choice(responses)
    
    def _handle_grief_topic(self, message: str) -> str:
        """Handle grief and loss topics with sensitivity"""
        responses = [
            "Grief is such a personal journey, and there's no right or wrong way to feel. I'm here to listen to whatever you need to share. Your loved one's memory is precious, and it's natural to miss them deeply.",
            "Thank you for trusting me with your feelings about your loved one. The pain of loss is real, and it's okay to feel however you're feeling. Would it help to share a memory, or would you prefer to talk about how you're coping?",
            "Missing someone you love is one of the deepest pains we can experience. I'm here to support you through this. Some people find it helpful to journal their feelings or share memories. The Bereavement Bridge has resources that might help. Would you like to explore those?",
            "Your grief is a reflection of your love, and both are valid and important. I'm here to listen without judgment, whenever you need to talk. You don't have to go through this alone."
        ]
        return random.choice(responses)
    
    def _handle_general(self, message: str) -> str:
        """Handle general conversation"""
        responses = [
            "I'm listening. Tell me more about that.",
            "That sounds important. How does that make you feel?",
            "I appreciate you sharing that with me. What else is on your mind?",
            "Thank you for telling me. I'm here to support you. What would be most helpful right now?",
            "I hear you. Would you like to talk more about this, or is there something else I can help with?",
            "That's interesting. How are you managing with everything?",
            "I'm here for you. What matters most to you right now?"
        ]
        return random.choice(responses)
    
    def get_conversation_history(self) -> List[Dict]:
        """Get full conversation history"""
        return self.conversation_history
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.user_context = {
            'name': None,
            'mood': 'neutral',
            'topics_discussed': [],
            'concerns': [],
            'emotional_state': 'unknown',
            'conversation_depth': 0,
            'last_topic': None,
            'referrals_made': []
        }

    
    def _handle_sleep_topic(self, message: str) -> str:
        """Handle sleep-related concerns"""
        if any(word in message for word in ['can\'t sleep', 'insomnia', 'awake']):
            return """Sleep difficulties can be so exhausting. Not being able to rest affects everything. 

Some things that might help:
- Keeping a consistent sleep schedule
- Creating a calm bedtime routine
- Limiting screen time before bed
- Talking to your care team about sleep aids if needed

How long have you been having trouble sleeping? Your care team should know about this so they can help."""
        
        elif any(word in message for word in ['tired', 'exhausted', 'fatigue']):
            return """Feeling exhausted all the time is really hard. Fatigue can have many causes - physical, emotional, or both.

It's important to let your care team know about this. They can:
- Check if medications might be contributing
- Assess for other medical causes
- Suggest energy conservation techniques
- Adjust your care plan

Would you like me to help you log this concern for your doctor?"""
        
        else:
            return "Rest and sleep are so important for healing and wellbeing. Tell me more about what's going on with your sleep. How are you feeling during the day?"
    
    def _handle_nutrition_topic(self, message: str) -> str:
        """Handle nutrition and appetite concerns"""
        if any(word in message for word in ['no appetite', 'can\'t eat', 'don\'t want to eat']):
            return """Loss of appetite is common and concerning. It's important that you're getting nutrition, even if you don't feel hungry.

Some strategies that might help:
- Small, frequent meals instead of large ones
- Eating foods you enjoy, even if just a little
- Nutritional supplements if recommended
- Eating with others when possible

Your care team needs to know about this. They can assess if there's an underlying cause and suggest ways to help. Would you like to document this concern?"""
        
        elif any(word in message for word in ['nausea', 'sick', 'throw up']):
            return """Nausea and vomiting can make it so hard to eat or drink. This is something your care team can help with - there are medications and strategies that can really help.

Please let your doctor or nurse know about this soon, especially if:
- You can't keep fluids down
- It's been going on for more than a day
- You're losing weight

Would you like me to alert your care team about this?"""
        
        else:
            return "Nutrition is an important part of your care. What's been going on with eating? I'm here to listen and can help you communicate this to your care team."
    
    def _handle_memory_topic(self, message: str) -> str:
        """Handle memory and cognitive concerns"""
        return """Memory changes can be frustrating and sometimes scary. You're not alone in experiencing this.

Memory issues can happen for many reasons:
- Medications
- Stress and emotional strain
- Fatigue
- Medical conditions
- Normal aging

It's important to mention this to your care team. They can:
- Review your medications
- Assess for treatable causes
- Suggest memory aids and strategies
- Adjust your care plan

What have you noticed about your memory? When did you first start noticing changes?"""
    
    def _use_motivational_interviewing(self, topic: str) -> str:
        """Use motivational interviewing techniques"""
        questions = {
            'change': [
                "What would you like to be different?",
                "If things could change, what would that look like?",
                "What's one small step that might help?"
            ],
            'values': [
                "What matters most to you right now?",
                "What gives your life meaning?",
                "What are you hoping for?"
            ],
            'confidence': [
                "What strengths have helped you through difficult times before?",
                "What resources do you have to draw on?",
                "What's worked for you in the past?"
            ]
        }
        
        category = random.choice(list(questions.keys()))
        return random.choice(questions[category])
    
    def _provide_coping_strategies(self, emotion: str) -> str:
        """Provide evidence-based coping strategies"""
        strategies = {
            'anxiety': """Here are some strategies that can help with anxiety:

**Immediate relief:**
- Deep breathing: Breathe in for 4, hold for 4, out for 4
- Grounding: Name 5 things you see, 4 you hear, 3 you can touch
- Progressive muscle relaxation

**Longer-term:**
- Regular gentle exercise
- Mindfulness or meditation
- Talking with a counselor
- Limiting caffeine

Would any of these feel doable for you right now?""",
            
            'sadness': """When sadness feels heavy, these might help:

**Self-care:**
- Allow yourself to feel without judgment
- Reach out to someone you trust
- Do one small thing you used to enjoy
- Get outside if possible, even briefly

**Support:**
- Talk to a counselor or therapist
- Join a support group
- Journal your feelings
- Connect with your care team

What feels most accessible to you right now?""",
            
            'anger': """Anger is a valid emotion. Here are healthy ways to process it:

**In the moment:**
- Take a break if possible
- Physical release (if able): walk, stretch
- Write it out without censoring
- Talk to someone who will listen

**Processing:**
- Identify what's underneath the anger
- Communicate needs clearly
- Problem-solve if there's a specific issue
- Talk with a counselor

What would feel most helpful?"""
        }
        
        return strategies.get(emotion, "What coping strategies have helped you in the past? I'm here to support you in finding what works.")
    
    def get_conversation_summary(self) -> Dict:
        """Generate summary of conversation for care team"""
        return {
            'message_count': len(self.conversation_history),
            'emotional_state': self.user_context['emotional_state'],
            'topics_discussed': self.user_context['topics_discussed'],
            'concerns_raised': self.user_context['concerns'],
            'crisis_detected': any('crisis' in msg.get('content', '').lower() for msg in self.conversation_history),
            'duration': self.user_context['conversation_depth']
        }

    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a greeting"""
        greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings']
        return any(greeting in message for greeting in greetings)
    
    def _handle_greeting(self) -> str:
        """Handle greetings warmly"""
        greetings = [
            "Hello! I'm here to support you. How are you feeling today?",
            "Hi there! It's good to hear from you. What's on your mind?",
            "Hello! I'm here to listen and help. How can I support you today?",
            "Hi! Thank you for reaching out. How are you doing right now?",
            "Hello! I'm glad you're here. What would you like to talk about?"
        ]
        return random.choice(greetings)
    
    def _is_farewell(self, message: str) -> bool:
        """Check if message is a farewell"""
        farewells = ['goodbye', 'bye', 'see you', 'talk later', 'gotta go', 'have to go']
        return any(farewell in message for farewell in farewells)
    
    def _handle_farewell(self) -> str:
        """Handle farewells supportively"""
        farewells = [
            "Take care of yourself. I'm here whenever you need to talk.",
            "Goodbye for now. Remember, I'm always here when you need support.",
            "It was good talking with you. Reach out anytime you need. Take care!",
            "I'll be here whenever you need me. Wishing you peace and comfort.",
            "Take good care. I'm just a message away whenever you need support."
        ]
        return random.choice(farewells)
    
    def _handle_question(self, message: str, original: str) -> str:
        """Handle questions intelligently"""
        
        # Medication questions
        if any(word in message for word in ['medication', 'medicine', 'pill', 'drug']):
            return "I can help you with medication information. You can view your current medications, schedules, and add new ones in the Medication Management page. Would you like me to guide you there, or do you have a specific question about your medications?"
        
        # Pain questions
        elif any(word in message for word in ['pain', 'hurt', 'ache', 'discomfort']):
            return "I understand you're asking about pain. Managing pain is so important for your comfort. You can log your pain levels in the system, and your care team will be notified. On a scale of 1-10, how would you rate your pain right now? Also, when did it start?"
        
        # Appointment questions
        elif any(word in message for word in ['appointment', 'visit', 'doctor', 'nurse']):
            return "I can help with appointments! You can view upcoming appointments, schedule new ones, or contact your care team in the Appointment Scheduling page. Would you like to schedule an appointment or check your upcoming visits?"
        
        # Support questions
        elif any(word in message for word in ['help', 'support', 'talk', 'listen']):
            return "I'm here to support you in any way I can. You can talk to me about how you're feeling, ask questions about your care, or I can connect you with resources. What would be most helpful for you right now?"
        
        # General questions
        else:
            return "That's a great question. I'm here to help you navigate your care and provide support. Could you tell me a bit more about what you're looking for? I can help with medications, appointments, emotional support, or connecting you with your care team."
    
    def _contains_emotion(self, message: str) -> bool:
        """Check if message contains emotional content"""
        emotions = ['feel', 'feeling', 'sad', 'happy', 'angry', 'scared', 'worried', 'anxious', 
                   'depressed', 'lonely', 'overwhelmed', 'grateful', 'peaceful', 'hopeful']
        return any(emotion in message for emotion in emotions)
    
    def _handle_emotion(self, message: str, original: str) -> str:
        """Handle emotional expressions with empathy"""
        
        # Positive emotions
        if any(word in message for word in ['happy', 'good', 'better', 'grateful', 'peaceful', 'hopeful', 'joy']):
            return "I'm so glad to hear you're feeling this way. It's wonderful that you're experiencing these positive moments. Would you like to share more about what's bringing you comfort or joy?"
        
        # Sadness
        elif any(word in message for word in ['sad', 'down', 'blue', 'unhappy', 'miss', 'missing']):
            return "I hear that you're feeling sad, and that's completely understandable. Your feelings are valid. Sometimes it helps to talk about what's weighing on you. I'm here to listen without judgment. Would you like to share more?"
        
        # Anxiety/worry
        elif any(word in message for word in ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'fear']):
            return "It sounds like you're carrying some worry right now. That can feel really heavy. What's concerning you most? Sometimes naming our worries can help us address them. I'm here to listen and help however I can."
        
        # Overwhelmed
        elif any(word in message for word in ['overwhelmed', 'too much', 'can\'t handle', 'stressed']):
            return "Feeling overwhelmed is exhausting. You're dealing with a lot, and it makes sense that it feels like too much sometimes. Let's take this one step at a time. What feels most pressing right now? We can work through it together."
        
        # Lonely
        elif any(word in message for word in ['lonely', 'alone', 'isolated']):
            return "Loneliness can be one of the hardest feelings. Please know that you're not alone - I'm here, and your care team is here for you. Would it help to connect with someone? I can help you reach out to family, friends, or a counselor."
        
        # General emotional support
        else:
            return "Thank you for sharing how you're feeling with me. Your emotions are important and valid. I'm here to listen and support you. Would you like to talk more about what you're experiencing?"
    
    def _handle_medical_topic(self, message: str, original: str) -> str:
        """Handle medical-related topics"""
        responses = [
            "I understand you're concerned about your medical care. Your care team is here to support you. Would you like me to help you log this concern so your doctor or nurse can address it? Or would you prefer to schedule an appointment?",
            "That's an important medical topic. I want to make sure you get the right information from your healthcare team. I can help you document this question or concern, and your care team will be notified. Would that be helpful?",
            "Your health and comfort are the top priority. I can help you track this information and make sure your care team sees it. Would you also like to speak with a nurse or doctor about this?"
        ]
        return random.choice(responses)
    
    def _handle_grief_topic(self, message: str, original: str) -> str:
        """Handle grief and loss topics with sensitivity"""
        responses = [
            "Grief is such a personal journey, and there's no right or wrong way to feel. I'm here to listen to whatever you need to share. Your loved one's memory is precious, and it's natural to miss them deeply.",
            "Thank you for trusting me with your feelings about your loved one. The pain of loss is real, and it's okay to feel however you're feeling. Would it help to share a memory, or would you prefer to talk about how you're coping?",
            "Missing someone you love is one of the deepest pains we can experience. I'm here to support you through this. Some people find it helpful to journal their feelings or share memories. The Bereavement Bridge has resources that might help. Would you like to explore those?",
            "Your grief is a reflection of your love, and both are valid and important. I'm here to listen without judgment, whenever you need to talk. You don't have to go through this alone."
        ]
        return random.choice(responses)
    
    def _handle_general(self, message: str, original: str) -> str:
        """Handle general conversation"""
        responses = [
            "I'm listening. Tell me more about that.",
            "That sounds important. How does that make you feel?",
            "I appreciate you sharing that with me. What else is on your mind?",
            "Thank you for telling me. I'm here to support you. What would be most helpful right now?",
            "I hear you. Would you like to talk more about this, or is there something else I can help with?",
            "That's interesting. How are you managing with everything?",
            "I'm here for you. What matters most to you right now?"
        ]
        return random.choice(responses)

    
    def get_referral_summary(self) -> Dict:
        """Get summary of referrals made during conversation"""
        if not self.user_context['referrals_made']:
            return {
                'total_referrals': 0,
                'referral_types': [],
                'contacts_recommended': [],
                'highest_urgency': 'none'
            }
        
        all_contacts = set()
        all_types = set()
        urgency_levels = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'none': 0}
        max_urgency = 'none'
        
        for referral in self.user_context['referrals_made']:
            all_contacts.update(referral.get('contacts', []))
            all_types.update(referral.get('question_types', []))
            if urgency_levels.get(referral.get('urgency', 'none'), 0) > urgency_levels.get(max_urgency, 0):
                max_urgency = referral.get('urgency', 'none')
        
        return {
            'total_referrals': len(self.user_context['referrals_made']),
            'referral_types': list(all_types),
            'contacts_recommended': list(all_contacts),
            'highest_urgency': max_urgency
        }
    
    def get_ethical_disclaimer(self) -> str:
        """Get ethical disclaimer for display"""
        return """
**About This AI Assistant:**

I'm here to provide support, information, and a listening ear. However, please remember:

✓ I'm an AI assistant, not a replacement for healthcare professionals
✓ I cannot diagnose conditions or prescribe treatments
✓ Medical, mental health, and crisis situations require human professional support
✓ I'll always recommend speaking with appropriate professionals when needed
✓ Your conversations help me understand how to best support you

**You're in control:** You decide what to share and when to seek additional support.
"""
