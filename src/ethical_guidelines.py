"""
Ethical Guidelines and Referral System for AI Chatbot
Ensures appropriate human support recommendations based on question type
"""

from typing import Dict, List, Tuple, Optional

class EthicalGuidelines:
    """Manages ethical guidelines and intelligent referral recommendations"""
    
    def __init__(self):
        # Define referral categories and appropriate contacts
        self.referral_matrix = {
            'medical': {
                'contacts': ['doctor', 'nurse', 'physician', 'medical team'],
                'urgency': 'high',
                'message': "This is a medical concern that should be discussed with your healthcare provider."
            },
            'medication': {
                'contacts': ['doctor', 'pharmacist', 'nurse'],
                'urgency': 'high',
                'message': "Medication questions should be reviewed by your doctor or pharmacist."
            },
            'pain': {
                'contacts': ['doctor', 'nurse', 'pain specialist'],
                'urgency': 'high',
                'message': "Pain management requires professional medical assessment."
            },
            'mental_health': {
                'contacts': ['therapist', 'counselor', 'psychologist', 'psychiatrist'],
                'urgency': 'medium',
                'message': "Mental health concerns are best addressed with a mental health professional."
            },
            'grief': {
                'contacts': ['grief counselor', 'therapist', 'bereavement specialist', 'support group'],
                'urgency': 'medium',
                'message': "Grief is a profound experience. A grief counselor or support group can provide specialized support."
            },
            'family': {
                'contacts': ['family member', 'loved one', 'family therapist', 'social worker'],
                'urgency': 'low',
                'message': "Family matters often benefit from open communication with loved ones or a family therapist."
            },
            'spiritual': {
                'contacts': ['chaplain', 'spiritual advisor', 'clergy', 'faith leader'],
                'urgency': 'low',
                'message': "Spiritual questions can be explored with a chaplain or your spiritual advisor."
            },
            'legal': {
                'contacts': ['social worker', 'legal advisor', 'patient advocate'],
                'urgency': 'medium',
                'message': "Legal matters should be discussed with a social worker or legal advisor."
            },
            'financial': {
                'contacts': ['social worker', 'financial counselor', 'case manager'],
                'urgency': 'medium',
                'message': "Financial concerns can be addressed with your social worker or financial counselor."
            },
            'care_planning': {
                'contacts': ['care team', 'case manager', 'social worker', 'doctor'],
                'urgency': 'medium',
                'message': "Care planning decisions should involve your care team and family."
            },
            'crisis': {
                'contacts': ['crisis counselor', 'emergency services', 'care team'],
                'urgency': 'critical',
                'message': "This requires immediate professional support."
            }
        }
        
        # Ethical principles
        self.principles = {
            'transparency': "I'm an AI assistant, not a replacement for human care professionals.",
            'limitations': "I can provide support and information, but cannot diagnose, prescribe, or replace professional judgment.",
            'referral': "I'll always recommend speaking with appropriate professionals when needed.",
            'confidentiality': "Your conversations are private, but I encourage you to share concerns with your care team.",
            'autonomy': "You have the right to make your own decisions. I'm here to support, not direct.",
            'beneficence': "My goal is to help you access the right support at the right time."
        }
    
    def analyze_question_type(self, message: str) -> List[str]:
        """Analyze message to determine question type(s)"""
        message_lower = message.lower()
        detected_types = []
        
        # Medical concerns
        if any(word in message_lower for word in ['symptom', 'diagnosis', 'treatment', 'medical', 'health', 'disease', 'condition']):
            detected_types.append('medical')
        
        # Medication
        if any(word in message_lower for word in ['medication', 'medicine', 'pill', 'drug', 'prescription', 'dose', 'side effect']):
            detected_types.append('medication')
        
        # Pain
        if any(word in message_lower for word in ['pain', 'hurt', 'ache', 'discomfort', 'suffering']):
            detected_types.append('pain')
        
        # Mental health
        if any(word in message_lower for word in ['depressed', 'depression', 'anxiety', 'panic', 'mental health', 'therapy']):
            detected_types.append('mental_health')
        
        # Grief
        if any(word in message_lower for word in ['grief', 'loss', 'died', 'death', 'mourning', 'bereavement', 'miss']):
            detected_types.append('grief')
        
        # Family
        if any(word in message_lower for word in ['family', 'spouse', 'children', 'relationship', 'conflict', 'communication']):
            detected_types.append('family')
        
        # Spiritual
        if any(word in message_lower for word in ['spiritual', 'faith', 'god', 'prayer', 'meaning', 'purpose', 'afterlife']):
            detected_types.append('spiritual')
        
        # Legal
        if any(word in message_lower for word in ['legal', 'will', 'advance directive', 'power of attorney', 'rights']):
            detected_types.append('legal')
        
        # Financial
        if any(word in message_lower for word in ['financial', 'money', 'cost', 'insurance', 'bills', 'afford']):
            detected_types.append('financial')
        
        # Care planning
        if any(word in message_lower for word in ['care plan', 'goals', 'preferences', 'wishes', 'decisions']):
            detected_types.append('care_planning')
        
        # Crisis
        if any(word in message_lower for word in ['crisis', 'emergency', 'urgent', 'immediate', 'help me']):
            detected_types.append('crisis')
        
        return detected_types if detected_types else ['general']
    
    def get_referral_recommendation(self, question_types: List[str]) -> Dict:
        """Get intelligent referral recommendation based on question types"""
        if not question_types or question_types == ['general']:
            return {
                'should_refer': False,
                'contacts': [],
                'urgency': 'none',
                'message': None
            }
        
        # Get highest urgency level
        urgency_levels = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'none': 0}
        max_urgency = 'none'
        all_contacts = set()
        messages = []
        
        for q_type in question_types:
            if q_type in self.referral_matrix:
                ref = self.referral_matrix[q_type]
                if urgency_levels.get(ref['urgency'], 0) > urgency_levels.get(max_urgency, 0):
                    max_urgency = ref['urgency']
                all_contacts.update(ref['contacts'])
                messages.append(ref['message'])
        
        return {
            'should_refer': len(all_contacts) > 0,
            'contacts': list(all_contacts),
            'urgency': max_urgency,
            'messages': messages,
            'question_types': question_types
        }
    
    def format_referral_message(self, referral: Dict, include_disclaimer: bool = True) -> str:
        """Format a professional referral message"""
        if not referral['should_refer']:
            return ""
        
        message_parts = []
        
        # Add disclaimer for transparency
        if include_disclaimer:
            message_parts.append("**Important:** I'm an AI assistant and cannot replace professional medical or therapeutic advice.")
        
        # Add specific messages
        if referral['messages']:
            message_parts.append("\n" + referral['messages'][0])
        
        # Add contact recommendations
        if referral['contacts']:
            if len(referral['contacts']) == 1:
                contact_text = f"**I recommend speaking with your {referral['contacts'][0]}** about this."
            elif len(referral['contacts']) == 2:
                contact_text = f"**I recommend speaking with your {referral['contacts'][0]} or {referral['contacts'][1]}** about this."
            else:
                contacts_list = ', '.join(referral['contacts'][:-1])
                contact_text = f"**I recommend speaking with your {contacts_list}, or {referral['contacts'][-1]}** about this."
            
            message_parts.append("\n" + contact_text)
        
        # Add urgency indicator
        if referral['urgency'] == 'critical':
            message_parts.append("\n\n🚨 **This requires immediate attention.** Please contact your care team or emergency services right away.")
        elif referral['urgency'] == 'high':
            message_parts.append("\n\n⚠️ **Please discuss this with your care team soon.** They can provide the medical guidance you need.")
        elif referral['urgency'] == 'medium':
            message_parts.append("\n\n💡 **Consider scheduling time to discuss this** with the appropriate professional when you're ready.")
        
        # Add support offer
        message_parts.append("\n\nI'm here to support you and can help you prepare for that conversation. Would you like to talk about what you'd like to discuss with them?")
        
        return '\n'.join(message_parts)
    
    def get_ethical_reminder(self, context: str = 'general') -> str:
        """Get appropriate ethical reminder based on context"""
        reminders = {
            'medical': "Remember: I can provide information and support, but medical decisions should always be made with your healthcare team.",
            'crisis': "Your safety is the priority. While I'm here to listen, please reach out to crisis professionals who can provide immediate, specialized help.",
            'grief': "Grief is deeply personal. While I can offer support, a grief counselor or therapist can provide specialized guidance through this journey.",
            'general': "I'm here to support you, but I encourage you to share important concerns with your care team, family, or appropriate professionals."
        }
        return reminders.get(context, reminders['general'])
    
    def should_escalate_to_human(self, message: str, conversation_depth: int) -> Tuple[bool, str]:
        """Determine if conversation should be escalated to human"""
        message_lower = message.lower()
        
        # Immediate escalation triggers
        if any(word in message_lower for word in ['emergency', 'urgent', 'right now', 'immediately']):
            return True, "This sounds urgent. Let me help you connect with your care team right away."
        
        # Medical complexity
        if conversation_depth > 3 and any(word in message_lower for word in ['diagnosis', 'treatment', 'medication change']):
            return True, "This is getting into medical details that really need your doctor's expertise. Would you like me to help you schedule an appointment or send a message to your care team?"
        
        # Emotional distress over time
        if conversation_depth > 5 and any(word in message_lower for word in ['can\'t cope', 'too much', 'overwhelmed', 'breaking down']):
            return True, "I hear that you're really struggling. While I'm here to listen, I think you would benefit from speaking with a counselor or therapist who can provide more specialized support. Can I help you connect with someone?"
        
        # Complex decision-making
        if any(word in message_lower for word in ['should i', 'what should', 'decision', 'choose']):
            return True, "This is an important decision. While I can help you think through it, I encourage you to discuss this with your care team and family so you have all the support and information you need."
        
        return False, ""
    
    def get_conversation_guidelines(self) -> Dict[str, str]:
        """Get guidelines for ethical AI conversation"""
        return {
            'transparency': "Always identify as AI, never pretend to be human",
            'scope': "Provide support and information, not medical advice or diagnosis",
            'referral': "Recommend appropriate professionals based on question type",
            'escalation': "Recognize when human intervention is needed",
            'empowerment': "Support user autonomy and decision-making",
            'safety': "Prioritize user safety, especially in crisis situations",
            'boundaries': "Maintain appropriate professional boundaries",
            'documentation': "Encourage users to share important concerns with care team"
        }
