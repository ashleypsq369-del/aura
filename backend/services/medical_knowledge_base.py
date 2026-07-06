"""
Medical Knowledge Base for Conversational ChatBot
Provides comprehensive medical information, palliative care guidance,
and context-aware responses for ProjectAura
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import re

class MedicalKnowledgeBase:
    """Comprehensive medical knowledge for chatbot conversations"""
    
    def __init__(self):
        self.symptoms_db = self._init_symptoms()
        self.medications_db = self._init_medications()
        self.palliative_care_db = self._init_palliative_care()
        self.cultural_context_db = self._init_cultural_context()
        self.coping_strategies_db = self._init_coping_strategies()
        self.nutrition_db = self._init_nutrition()
        self.pain_management_db = self._init_pain_management()
        
    def _init_symptoms(self) -> Dict:
        """Common symptoms in palliative care"""
        return {
            "pain": {
                "description": "Physical discomfort ranging from mild to severe",
                "types": ["acute", "chronic", "breakthrough", "neuropathic", "visceral"],
                "management": [
                    "Pain medications as prescribed by doctor",
                    "Positioning for comfort",
                    "Heat or cold therapy",
                    "Relaxation techniques",
                    "Distraction activities"
                ],
                "when_to_call": "Severe uncontrolled pain, new pain, pain preventing sleep or activities",
                "questions_to_ask": [
                    "On a scale of 0-10, how would you rate your pain?",
                    "Where is the pain located?",
                    "Is it constant or does it come and go?",
                    "What makes it better or worse?"
                ]
            },
            "nausea": {
                "description": "Feeling sick to your stomach, may or may not lead to vomiting",
                "causes": ["Medications", "Disease progression", "Constipation", "Anxiety", "Food"],
                "management": [
                    "Anti-nausea medications as prescribed",
                    "Small, frequent meals",
                    "Bland foods (rice, toast, bananas)",
                    "Ginger tea or ginger ale",
                    "Fresh air and cool environment",
                    "Avoid strong smells"
                ],
                "when_to_call": "Unable to keep down fluids, severe vomiting, signs of dehydration"
            },
            "fatigue": {
                "description": "Extreme tiredness that doesn't improve with rest",
                "causes": ["Disease itself", "Treatments", "Anemia", "Pain", "Depression", "Poor sleep"],
                "management": [
                    "Balance activity with rest",
                    "Prioritize important activities",
                    "Accept help from others",
                    "Light exercise if able",
                    "Good sleep hygiene",
                    "Nutritious food and hydration"
                ],
                "tips": "Save energy for what matters most. It's okay to rest."
            },
            "shortness_of_breath": {
                "description": "Difficulty breathing or feeling like you can't get enough air",
                "causes": ["Lung disease", "Heart problems", "Anemia", "Anxiety", "Fluid buildup"],
                "management": [
                    "Oxygen therapy if prescribed",
                    "Upright positioning",
                    "Fan for air circulation",
                    "Pursed-lip breathing",
                    "Relaxation techniques",
                    "Avoid triggers"
                ],
                "when_to_call": "Sudden severe breathlessness, blue lips, extreme anxiety",
                "emergency": True
            },
            "anxiety": {
                "description": "Feelings of worry, fear, or unease",
                "common_concerns": ["Prognosis", "Pain", "Family", "Spiritual matters", "Loss of control"],
                "management": [
                    "Talk with your care team",
                    "Counseling or therapy",
                    "Medications if needed",
                    "Mindfulness and meditation",
                    "Spiritual support",
                    "Support groups"
                ],
                "breathing_technique": "4-7-8 breathing: Inhale for 4, hold for 7, exhale for 8"
            },
            "constipation": {
                "description": "Difficulty passing stool or infrequent bowel movements",
                "causes": ["Pain medications", "Reduced activity", "Less food/fluid", "Certain diseases"],
                "management": [
                    "Stool softeners and laxatives as prescribed",
                    "Increase fluids if able",
                    "High-fiber foods if tolerated",
                    "Gentle activity",
                    "Establish routine"
                ],
                "when_to_call": "No bowel movement for 3+ days, severe pain, bloating"
            },
            "loss_of_appetite": {
                "description": "Not feeling hungry or interested in food",
                "causes": ["Disease", "Medications", "Nausea", "Mouth problems", "Depression"],
                "management": [
                    "Small frequent meals",
                    "Eat favorite foods",
                    "Make food appealing",
                    "Nutritious drinks/smoothies",
                    "Social mealtimes",
                    "Don't force eating"
                ],
                "family_support": "Focus on quality time, not food amount. Comfort matters more than calories."
            },
            "insomnia": {
                "description": "Difficulty falling asleep or staying asleep",
                "causes": ["Pain", "Anxiety", "Medications", "Napping", "Worry"],
                "management": [
                    "Regular sleep schedule",
                    "Comfortable environment",
                    "Limit daytime naps",
                    "Relaxation before bed",
                    "Address pain and discomfort",
                    "Sleep medications if needed"
                ],
                "sleep_hygiene": "Cool, dark room; no screens 1 hour before bed; gentle routine"
            }
        }
    
    def _init_medications(self) -> Dict:
        """Common palliative care medications"""
        return {
            "opioids": {
                "purpose": "Pain relief",
                "examples": ["morphine", "tramadol", "codeine", "fentanyl"],
                "side_effects": ["Constipation", "Nausea", "Drowsiness", "Confusion"],
                "tips": [
                    "Take as prescribed, not as needed for chronic pain",
                    "Always take stool softeners alongside",
                    "Store safely away from children",
                    "Report side effects to doctor",
                    "Don't stop suddenly"
                ],
                "myths": "Addiction is rare when used for pain. Don't let fear prevent relief."
            },
            "anti_nausea": {
                "purpose": "Control nausea and vomiting",
                "examples": ["metoclopramide", "ondansetron", "promethazine"],
                "tips": [
                    "Take before meals if nausea is predictable",
                    "Keep water nearby",
                    "May cause drowsiness"
                ]
            },
            "steroids": {
                "purpose": "Reduce inflammation, improve appetite and energy",
                "examples": ["dexamethasone", "prednisolone"],
                "side_effects": ["Increased appetite", "Mood changes", "Sleep problems", "Swelling"],
                "tips": [
                    "Take in morning to avoid sleep problems",
                    "Take with food",
                    "Don't stop suddenly",
                    "Monitor blood sugar if diabetic"
                ]
            },
            "anxiolytics": {
                "purpose": "Reduce anxiety and promote calm",
                "examples": ["diazepam", "lorazepam", "alprazolam"],
                "side_effects": ["Drowsiness", "Dizziness", "Confusion"],
                "tips": [
                    "Avoid alcohol",
                    "Be careful with activities requiring alertness",
                    "Use only as prescribed",
                    "Report increased anxiety or unusual thoughts"
                ]
            },
            "laxatives": {
                "purpose": "Prevent and treat constipation",
                "types": ["Stool softeners", "Stimulants", "Osmotic"],
                "tips": [
                    "Start when starting opioids",
                    "Drink plenty of fluids",
                    "May take 1-3 days to work",
                    "Adjust dose based on results"
                ]
            }
        }
    
    def _init_palliative_care(self) -> Dict:
        """Palliative care concepts and approaches"""
        return {
            "philosophy": {
                "definition": "Care focused on improving quality of life by addressing physical, emotional, social, and spiritual needs",
                "goals": [
                    "Maximize comfort and dignity",
                    "Support the whole person and family",
                    "Align care with patient's values and wishes",
                    "Provide symptom management",
                    "Offer emotional and spiritual support"
                ],
                "not_giving_up": "Palliative care is about living well. It's adding support, not taking anything away."
            },
            "advance_care_planning": {
                "importance": "Planning helps ensure your wishes are known and respected",
                "topics_to_discuss": [
                    "What matters most to you",
                    "Where you want to be cared for",
                    "Who should make decisions if you can't",
                    "Treatments you do or don't want",
                    "Spiritual and cultural preferences"
                ],
                "approach": "Start conversations early when feeling well. Revisit as things change."
            },
            "family_support": {
                "caregiver_care": [
                    "Take breaks - respite care is important",
                    "Ask for specific help from others",
                    "Join support groups",
                    "Maintain your own health",
                    "Accept that you're doing your best"
                ],
                "talking_to_children": [
                    "Be honest in age-appropriate ways",
                    "Reassure them it's not their fault",
                    "Let them express feelings",
                    "Maintain routines when possible",
                    "Say goodbye in their own way"
                ],
                "grief_support": [
                    "Grief is individual - there's no right way",
                    "Allow yourself to feel",
                    "Remember happy times",
                    "Seek support when needed",
                    "Be patient with yourself"
                ]
            },
            "spiritual_care": {
                "dimensions": ["Meaning", "Hope", "Relationships", "Forgiveness", "Legacy"],
                "questions": [
                    "What gives your life meaning?",
                    "What are you hoping for now?",
                    "Are there relationships you want to address?",
                    "What do you want to be remembered for?"
                ],
                "support": "Chaplains, spiritual leaders, counselors available to explore these questions"
            }
        }
    
    def _init_cultural_context(self) -> Dict:
        """Ghanaian cultural context for palliative care"""
        return {
            "traditional_healing": {
                "respect": "Traditional and modern medicine can work together",
                "communication": "Please share any traditional remedies with your medical team",
                "safety": "Some herbs interact with medications - it's important to discuss",
                "integration": "Many care teams are open to incorporating cultural practices"
            },
            "family_involvement": {
                "extended_family": "In Ghana, family is central to caregiving",
                "decision_making": "Family meetings are important for major decisions",
                "roles": "Everyone has a role - some provide care, others emotional support",
                "balance": "Honor family wishes while respecting patient's preferences"
            },
            "spiritual_practices": {
                "prayer": "Prayer and spiritual practices are sources of strength",
                "church_community": "Faith communities often provide practical and emotional support",
                "pastoral_care": "Chaplains can support both Christian and other faith traditions",
                "customs": "Cultural and religious customs around death are respected"
            },
            "language": {
                "local_languages": "Care available in Twi, Ga, Ewe, and other languages",
                "interpretation": "Don't hesitate to ask for interpretation",
                "medical_terms": "We'll explain medical terms in simple language"
            },
            "death_and_dying": {
                "customs": "We respect Ghanaian customs around end of life",
                "preparation": "Cultural practices around preparing for death are supported",
                "after_death": "Family wishes around the body and funeral are honored",
                "community": "Community involvement in grief and mourning is welcomed"
            }
        }
    
    def _init_coping_strategies(self) -> Dict:
        """Coping strategies for patients and families"""
        return {
            "emotional": {
                "techniques": [
                    "Journaling thoughts and feelings",
                    "Talking with trusted people",
                    "Professional counseling",
                    "Support groups (connecting with others who understand)",
                    "Creative expression (art, music, poetry)",
                    "Prayer and meditation",
                    "Mindfulness exercises"
                ],
                "normal_feelings": [
                    "Sadness and grief",
                    "Anger and frustration",
                    "Fear and anxiety",
                    "Guilt",
                    "Hope mixed with worry"
                ],
                "validation": "All feelings are valid. You don't have to stay positive all the time."
            },
            "practical": {
                "daily_living": [
                    "Create routines that bring comfort",
                    "Break tasks into small steps",
                    "Use adaptive devices to maintain independence",
                    "Organize medications with pill boxes",
                    "Keep important numbers handy"
                ],
                "financial": [
                    "Discuss concerns with social workers",
                    "Explore assistance programs",
                    "Prioritize essential expenses",
                    "Consider fundraising if needed"
                ]
            },
            "social": {
                "connections": [
                    "Stay connected with loved ones",
                    "Accept offers of help",
                    "Video calls with distant family",
                    "Share memories and stories",
                    "Say the things that matter"
                ],
                "activities": [
                    "Continue hobbies when energy allows",
                    "Adapted activities (audio books instead of reading)",
                    "Gentle outings if able",
                    "Visitors at times you feel best"
                ]
            },
            "spiritual": {
                "practices": [
                    "Prayer and devotion",
                    "Reading sacred texts",
                    "Visits from spiritual leaders",
                    "Forgiveness work",
                    "Life review and legacy",
                    "Finding meaning and peace"
                ]
            }
        }
    
    def _init_nutrition(self) -> Dict:
        """Nutrition guidance in palliative care"""
        return {
            "principles": {
                "shift_in_focus": "Nutrition for comfort and pleasure, not just health",
                "permission": "It's okay if appetite decreases - focus on enjoyment",
                "hydration": "Sips of favorite drinks are more important than large amounts"
            },
            "when_appetite_is_low": {
                "strategies": [
                    "Small portions of favorite foods",
                    "Eat when hungry, even if not mealtime",
                    "Nutritious drinks (smoothies, milkshakes)",
                    "Make food look and smell appealing",
                    "Eat with others when possible",
                    "Don't force eating - it can cause distress"
                ],
                "high_calorie_options": [
                    "Add groundnut butter to foods",
                    "Full-fat milk and yogurt",
                    "Cheese and eggs",
                    "Soups with coconut milk",
                    "Mashed yam or plantain",
                    "Energy-dense smoothies"
                ]
            },
            "managing_challenges": {
                "nausea": ["Bland foods", "Cold foods", "Avoid strong smells", "Ginger"],
                "mouth_sores": ["Soft foods", "Room temperature", "Avoid spicy/acidic", "Smoothies"],
                "dry_mouth": ["Frequent sips", "Ice chips", "Lemon drops", "Lip balm"],
                "difficulty_swallowing": ["Pureed foods", "Thickened liquids", "Small bites", "Upright position"]
            },
            "ghanaian_foods": {
                "comfort_foods": ["Light soup", "Banku", "Kenkey", "Porridges", "Fufu (soft)"],
                "easy_to_eat": ["Kontomire stew", "Groundnut soup", "Rice water", "Mashed plantain"],
                "snacks": ["Garden eggs", "Groundnuts", "Papaya", "Watermelon"]
            }
        }
    
    def _init_pain_management(self) -> Dict:
        """Comprehensive pain management approaches"""
        return {
            "types_of_pain": {
                "acute": "Sudden, sharp pain from injury or procedure",
                "chronic": "Ongoing pain lasting weeks to months",
                "breakthrough": "Sudden flare of pain despite regular medication",
                "neuropathic": "Nerve pain (burning, tingling, shooting)",
                "visceral": "Deep, internal organ pain"
            },
            "pain_scale": {
                "0": "No pain",
                "1-3": "Mild pain - noticeable but doesn't interfere much",
                "4-6": "Moderate pain - interferes with activities",
                "7-9": "Severe pain - difficult to do anything",
                "10": "Worst pain imaginable"
            },
            "medication_approaches": {
                "by_the_ladder": "WHO pain ladder: Start simple, add stronger as needed",
                "by_the_clock": "Take regularly, not just when pain is bad",
                "by_the_route": "Pills, liquids, patches, injections - find what works",
                "breakthrough": "Fast-acting medication for sudden pain flares"
            },
            "non_medication": {
                "physical": [
                    "Positioning and support",
                    "Heat or cold packs",
                    "Gentle massage",
                    "Physical therapy",
                    "TENS unit"
                ],
                "mind_body": [
                    "Relaxation techniques",
                    "Guided imagery",
                    "Music therapy",
                    "Distraction",
                    "Meditation and prayer"
                ],
                "complementary": [
                    "Acupuncture (if available)",
                    "Aromatherapy",
                    "Art therapy",
                    "Pet therapy"
                ]
            },
            "total_pain": {
                "concept": "Pain has physical, emotional, social, and spiritual dimensions",
                "addressing_all": [
                    "Physical: Medications and treatments",
                    "Emotional: Counseling, support",
                    "Social: Connection, support groups",
                    "Spiritual: Meaning, purpose, peace"
                ]
            }
        }
    
    def get_symptom_info(self, symptom: str) -> Optional[Dict]:
        """Get information about a specific symptom"""
        symptom_lower = symptom.lower()
        for key, info in self.symptoms_db.items():
            if key in symptom_lower or symptom_lower in key:
                return info
        return None
    
    def get_medication_info(self, medication: str) -> Optional[Dict]:
        """Get information about medication categories"""
        med_lower = medication.lower()
        for key, info in self.medications_db.items():
            if key in med_lower or any(example in med_lower for example in info.get('examples', [])):
                return info
        return None
    
    def detect_intent(self, message: str) -> List[str]:
        """Detect user intent from message"""
        message_lower = message.lower()
        intents = []
        
        # Symptom-related
        symptom_keywords = ["pain", "hurt", "nausea", "sick", "tired", "breath", "sleep", "anxious", "worried", "constipat", "appetite"]
        if any(kw in message_lower for kw in symptom_keywords):
            intents.append("symptom_query")
        
        # Medication-related
        med_keywords = ["medication", "medicine", "drug", "pill", "morphine", "taking", "prescri"]
        if any(kw in message_lower for kw in med_keywords):
            intents.append("medication_query")
        
        # Emotional support
        emotion_keywords = ["scared", "afraid", "sad", "depressed", "alone", "worried", "cry", "feel"]
        if any(kw in message_lower for kw in emotion_keywords):
            intents.append("emotional_support")
        
        # Family/caregiver
        family_keywords = ["family", "caregiver", "child", "wife", "husband", "caring for"]
        if any(kw in message_lower for kw in family_keywords):
            intents.append("family_support")
        
        # Spiritual
        spiritual_keywords = ["god", "pray", "faith", "spirit", "meaning", "why", "death", "dying"]
        if any(kw in message_lower for kw in spiritual_keywords):
            intents.append("spiritual_support")
        
        # Practical
        practical_keywords = ["how do i", "how can i", "what should i", "when should i"]
        if any(kw in message_lower for kw in practical_keywords):
            intents.append("practical_guidance")
        
        # Crisis
        crisis_keywords = ["kill", "suicide", "end it", "hurt myself", "no point", "give up", "can't go on"]
        if any(kw in message_lower for kw in crisis_keywords):
            intents.append("crisis")
        
        return intents if intents else ["general_conversation"]
    
    def get_context_enrichment(self, message: str, intents: List[str]) -> str:
        """Enrich context based on detected intents"""
        enrichment = ""
        
        if "symptom_query" in intents:
            # Find relevant symptom
            for symptom_key, symptom_info in self.symptoms_db.items():
                if symptom_key in message.lower():
                    enrichment += f"\n\n📚 Medical Context - {symptom_key.title()}:\n"
                    enrichment += f"Description: {symptom_info['description']}\n"
                    if 'management' in symptom_info:
                        enrichment += f"Management approaches: {', '.join(symptom_info['management'][:3])}\n"
                    if 'when_to_call' in symptom_info:
                        enrichment += f"⚠️ Call care team if: {symptom_info['when_to_call']}\n"
                    break
        
        if "medication_query" in intents:
            enrichment += "\n\n💊 Medication Safety Reminder:\n"
            enrichment += "- Always take as prescribed\n"
            enrichment += "- Report side effects to your care team\n"
            enrichment += "- Never stop suddenly without consulting doctor\n"
        
        if "crisis" in intents:
            enrichment += "\n\n🚨 CRISIS SUPPORT NEEDED\n"
            enrichment += "Mental Health Authority Ghana: 0800-111-011 (toll-free)\n"
            enrichment += "Befrienders Ghana: 0244-846-472\n"
        
        if "spiritual_support" in intents:
            enrichment += "\n\n🙏 Spiritual Support:\n"
            enrichment += "Chaplains and spiritual counselors are available 24/7.\n"
            enrichment += "Cultural and religious practices are respected and supported.\n"
        
        return enrichment


# Global instance
medical_kb = MedicalKnowledgeBase()
