"""
Medical Knowledge Base Downloader
Downloads medical literature, guidelines, and clinical knowledge
for enriching SHAP explanations with medical context
"""

import requests
import json
import time
from pathlib import Path
from typing import Dict, List
import logging

from config import MEDICAL_KNOWLEDGE_DIR, MEDICAL_APIS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MedicalKnowledgeDownloader:
    """Downloads medical knowledge from various sources"""
    
    def __init__(self):
        self.knowledge_dir = MEDICAL_KNOWLEDGE_DIR
        self.knowledge_dir.mkdir(exist_ok=True)
    
    def download_clinical_guidelines(self):
        """Download clinical practice guidelines"""
        
        guidelines = {
            "palliative_care": {
                "source": "WHO",
                "title": "WHO Palliative Care Guidelines",
                "topics": [
                    "pain_management",
                    "symptom_control",
                    "end_of_life_care",
                    "family_support"
                ],
                "url": "https://www.who.int/news-room/fact-sheets/detail/palliative-care"
            },
            
            "esas_interpretation": {
                "source": "Edmonton Symptom Assessment System",
                "title": "ESAS Clinical Guidelines",
                "scoring": {
                    "pain": {
                        "0-3": "Mild pain - manageable with routine analgesia",
                        "4-6": "Moderate pain - may require opioid adjustment",
                        "7-10": "Severe pain - urgent intervention required"
                    },
                    "tiredness": {
                        "0-3": "Mild fatigue - encourage activity as tolerated",
                        "4-6": "Moderate fatigue - energy conservation strategies",
                        "7-10": "Severe fatigue - assess for reversible causes (anemia, etc.)"
                    },
                    "nausea": {
                        "0-3": "Mild nausea - dietary modifications",
                        "4-6": "Moderate nausea - antiemetic medication",
                        "7-10": "Severe nausea - urgent assessment for causes"
                    },
                    "depression": {
                        "0-3": "Minimal depression - supportive care",
                        "4-6": "Moderate depression - counseling recommended",
                        "7-10": "Severe depression - psychiatric consultation"
                    },
                    "anxiety": {
                        "0-3": "Mild anxiety - relaxation techniques",
                        "4-6": "Moderate anxiety - consider anxiolytic",
                        "7-10": "Severe anxiety - urgent mental health support"
                    }
                }
            },
            
            "pps_interpretation": {
                "source": "Palliative Performance Scale",
                "title": "PPS Clinical Interpretation",
                "scoring": {
                    "100-90": "Fully ambulatory, normal activity, no evidence of disease",
                    "80-70": "Ambulatory, some symptoms, normal self-care",
                    "60-50": "Reduced ambulation, unable to do most work, considerable disease",
                    "40-30": "Mainly in bed, extensive disease, needs assistance",
                    "20-10": "Totally bed bound, unable to do any care, death approaching"
                },
                "survival_correlation": {
                    "PPS_80_100": "Median survival: 6-12 months",
                    "PPS_50_70": "Median survival: 2-4 months",
                    "PPS_30_40": "Median survival: 3-6 weeks",
                    "PPS_10_20": "Median survival: 1-2 weeks"
                }
            },
            
            "phq9_interpretation": {
                "source": "Patient Health Questionnaire-9",
                "title": "PHQ-9 Depression Severity",
                "scoring": {
                    "0-4": "Minimal depression - monitoring",
                    "5-9": "Mild depression - watchful waiting, counseling",
                    "10-14": "Moderate depression - counseling, consider medication",
                    "15-19": "Moderately severe depression - medication + counseling",
                    "20-27": "Severe depression - immediate treatment, safety assessment"
                },
                "recommendations": {
                    "suicide_risk": "If item 9 (thoughts of death) scored >0, immediate safety assessment required",
                    "treatment_response": "Reassess every 2-4 weeks, expect 50% improvement in 4-6 weeks",
                    "referral_criteria": "Score >15 or no improvement after 4-6 weeks"
                }
            },
            
            "gad7_interpretation": {
                "source": "Generalized Anxiety Disorder-7",
                "title": "GAD-7 Anxiety Severity",
                "scoring": {
                    "0-4": "Minimal anxiety",
                    "5-9": "Mild anxiety",
                    "10-14": "Moderate anxiety - consider treatment",
                    "15-21": "Severe anxiety - active treatment warranted"
                },
                "recommendations": {
                    "first_line": "CBT (Cognitive Behavioral Therapy)",
                    "medication": "Consider SSRI if score >10",
                    "panic_disorder": "If item 7 (worry about different things) high, screen for panic disorder"
                }
            },
            
            "barthel_interpretation": {
                "source": "Barthel Index",
                "title": "Activities of Daily Living Assessment",
                "scoring": {
                    "100": "Fully independent",
                    "80-90": "Minimal assistance needed",
                    "60-75": "Moderate assistance needed",
                    "40-55": "Very dependent",
                    "0-35": "Totally dependent"
                },
                "care_planning": {
                    "80_100": "Home care with minimal support",
                    "60_75": "Home care with regular support",
                    "40_55": "Consider assisted living or extensive home care",
                    "0_35": "24/7 care required - nursing home or family caregivers"
                }
            },
            
            "mmse_interpretation": {
                "source": "Mini-Mental State Examination",
                "title": "Cognitive Function Assessment",
                "scoring": {
                    "27-30": "Normal cognition",
                    "24-26": "Possible mild cognitive impairment",
                    "18-23": "Mild to moderate dementia",
                    "10-17": "Moderate to severe dementia",
                    "0-9": "Severe dementia"
                },
                "education_adjustment": {
                    "note": "Add 1 point if education <8 years, subtract 1 if >12 years",
                    "cultural": "MMSE may underestimate cognition in non-English speakers"
                }
            },
            
            "zarit_interpretation": {
                "source": "Zarit Burden Interview",
                "title": "Caregiver Burden Assessment",
                "scoring": {
                    "0-20": "Little to no burden",
                    "21-40": "Mild to moderate burden",
                    "41-60": "Moderate to severe burden - intervention needed",
                    "61-88": "Severe burden - urgent support required"
                },
                "interventions": {
                    "mild_moderate": ["Caregiver education", "Support groups", "Respite planning"],
                    "moderate_severe": ["Respite care services", "Home health aide", "Counseling"],
                    "severe": ["Urgent respite care", "Mental health support", "Alternative care options"]
                }
            },
            
            "vital_signs_interpretation": {
                "source": "Clinical Practice Guidelines",
                "title": "Vital Signs Normal Ranges and Alerts",
                "ranges": {
                    "heart_rate": {
                        "normal": "60-100 bpm",
                        "bradycardia": "<60 bpm",
                        "tachycardia": ">100 bpm",
                        "critical_low": "<40 bpm",
                        "critical_high": ">120 bpm"
                    },
                    "blood_pressure_systolic": {
                        "normal": "90-140 mmHg",
                        "hypotension": "<90 mmHg",
                        "hypertension": ">140 mmHg",
                        "stage_2_hypertension": ">160 mmHg",
                        "hypertensive_crisis": ">180 mmHg"
                    },
                    "oxygen_saturation": {
                        "normal": ">95%",
                        "mild_hypoxemia": "90-95%",
                        "moderate_hypoxemia": "85-90%",
                        "severe_hypoxemia": "<85%",
                        "copd_target": "88-92% (avoid hyperoxia)"
                    },
                    "temperature": {
                        "normal": "36.1-37.8°C",
                        "hypothermia": "<36.0°C",
                        "low_grade_fever": "37.8-38.5°C",
                        "fever": "38.5-39.5°C",
                        "high_fever": ">39.5°C"
                    }
                }
            },
            
            "medication_interactions": {
                "source": "Drug Interaction Database",
                "title": "Common Medication Interactions in Palliative Care",
                "interactions": {
                    "opioids_benzodiazepines": {
                        "severity": "high",
                        "effect": "Additive CNS depression, respiratory depression risk",
                        "monitoring": "Close monitoring, reduce doses if combined",
                        "alternatives": "Consider non-benzodiazepine anxiolytics"
                    },
                    "ssri_tramadol": {
                        "severity": "high",
                        "effect": "Serotonin syndrome risk",
                        "monitoring": "Watch for agitation, confusion, tachycardia",
                        "alternatives": "Use different opioid (morphine, hydromorphone)"
                    },
                    "warfarin_nsaids": {
                        "severity": "high",
                        "effect": "Increased bleeding risk",
                        "monitoring": "Monitor INR closely, watch for bleeding signs",
                        "alternatives": "Acetaminophen for pain"
                    }
                }
            },
            
            "disease_trajectories": {
                "source": "Palliative Care Literature",
                "title": "Disease Trajectory Patterns",
                "patterns": {
                    "cancer": {
                        "trajectory": "Relatively stable → rapid decline near end",
                        "predictability": "High - clear terminal phase",
                        "key_indicators": ["PPS <50%", "ESAS total >50", "weight loss >10%"]
                    },
                    "heart_failure": {
                        "trajectory": "Gradual decline with acute exacerbations",
                        "predictability": "Moderate - difficult to predict timing",
                        "key_indicators": ["NYHA Class IV", "recurrent admissions", "O2 saturation <90%"]
                    },
                    "copd": {
                        "trajectory": "Gradual decline with acute exacerbations",
                        "predictability": "Moderate - exacerbations unpredictable",
                        "key_indicators": ["FEV1 <30%", "home oxygen", "recurrent infections"]
                    },
                    "dementia": {
                        "trajectory": "Prolonged gradual decline",
                        "predictability": "Low - long trajectory, unclear endpoint",
                        "key_indicators": ["MMSE <10", "Barthel <20", "dysphagia"]
                    }
                }
            }
        }
        
        # Save guidelines
        guidelines_file = self.knowledge_dir / "clinical_guidelines.json"
        with open(guidelines_file, 'w') as f:
            json.dump(guidelines, f, indent=2)
        
        logger.info(f"✅ Clinical guidelines saved to {guidelines_file}")
        return guidelines
    
    def download_medication_database(self):
        """Download medication information"""
        
        medications = {
            "opioids": {
                "morphine": {
                    "class": "strong_opioid",
                    "indications": ["moderate to severe pain"],
                    "monitoring": ["respiratory_rate", "sedation", "constipation"],
                    "interactions": ["benzodiazepines", "muscle_relaxants"],
                    "side_effects": ["nausea", "drowsiness", "constipation", "respiratory_depression"]
                },
                "oxycodone": {
                    "class": "strong_opioid",
                    "indications": ["moderate to severe pain"],
                    "monitoring": ["respiratory_rate", "sedation", "constipation"],
                    "interactions": ["benzodiazepines", "alcohol"],
                    "side_effects": ["nausea", "drowsiness", "constipation"]
                },
                "fentanyl": {
                    "class": "strong_opioid",
                    "indications": ["severe chronic pain"],
                    "monitoring": ["respiratory_rate", "sedation"],
                    "interactions": ["CYP3A4 inhibitors"],
                    "side_effects": ["respiratory_depression", "sedation"]
                }
            },
            
            "antidepressants": {
                "sertraline": {
                    "class": "SSRI",
                    "indications": ["depression", "anxiety"],
                    "monitoring": ["mood", "suicidal_ideation", "bleeding_risk"],
                    "interactions": ["tramadol", "warfarin", "NSAIDs"],
                    "side_effects": ["nausea", "insomnia", "sexual_dysfunction"]
                },
                "mirtazapine": {
                    "class": "atypical_antidepressant",
                    "indications": ["depression", "appetite_stimulation", "sleep"],
                    "monitoring": ["mood", "weight", "sedation"],
                    "interactions": ["sedatives", "MAOIs"],
                    "side_effects": ["sedation", "weight_gain", "increased_appetite"]
                }
            },
            
            "antiemetics": {
                "metoclopramide": {
                    "class": "dopamine_antagonist",
                    "indications": ["nausea", "gastroparesis"],
                    "monitoring": ["extrapyramidal_symptoms"],
                    "interactions": ["dopamine_agonists"],
                    "side_effects": ["dystonia", "tardive_dyskinesia", "drowsiness"]
                },
                "ondansetron": {
                    "class": "5-HT3_antagonist",
                    "indications": ["nausea", "vomiting"],
                    "monitoring": ["QT_prolongation"],
                    "interactions": ["QT_prolonging_drugs"],
                    "side_effects": ["headache", "constipation"]
                }
            }
        }
        
        meds_file = self.knowledge_dir / "medication_database.json"
        with open(meds_file, 'w') as f:
            json.dump(medications, f, indent=2)
        
        logger.info(f"✅ Medication database saved to {meds_file}")
        return medications
    
    def download_symptom_management_protocols(self):
        """Download symptom management protocols"""
        
        protocols = {
            "pain_management": {
                "mild_pain_1_3": [
                    "Acetaminophen 500-1000mg q6h PRN",
                    "NSAIDs (if no contraindications)",
                    "Topical analgesics",
                    "Non-pharmacological: heat/cold, massage, relaxation"
                ],
                "moderate_pain_4_6": [
                    "Continue acetaminophen",
                    "Add weak opioid (tramadol, codeine)",
                    "Consider opioid rotation if already on opioid",
                    "Adjuvant analgesics based on pain type (neuropathic vs nociceptive)",
                    "Physical therapy/occupational therapy assessment"
                ],
                "severe_pain_7_10": [
                    "Strong opioid (morphine, oxycodone, hydromorphone)",
                    "Immediate release for breakthrough + sustained release for baseline",
                    "Palliative care consultation",
                    "Assess for interventional options (nerve blocks, etc.)",
                    "Urgent review if pain uncontrolled"
                ]
            },
            
            "dyspnea_management": {
                "mild_dyspnea": [
                    "Fan therapy (cool air on face)",
                    "Breathing exercises",
                    "Positioning (upright)",
                    "Supplemental O2 if hypoxemic (SpO2 <90%)"
                ],
                "moderate_dyspnea": [
                    "Low-dose opioid (morphine 2.5-5mg PO q4h)",
                    "Benzodiazepine if anxious",
                    "Oxygen therapy",
                    "Pulmonary rehabilitation"
                ],
                "severe_dyspnea": [
                    "Opioid titration (morphine 5-10mg PO/SC q4h)",
                    "Consider nebulized morphine",
                    "Anxiolytic (lorazepam 0.5-1mg)",
                    "Palliative care/hospice consultation"
                ]
            },
            
            "nausea_management": {
                "assessment": [
                    "Identify cause: opioids, chemotherapy, constipation, bowel obstruction",
                    "Medication review (opioids, antibiotics, etc.)"
                ],
                "treatment_by_cause": {
                    "opioid_induced": ["Metoclopramide 10mg TID", "Rotate opioid"],
                    "chemotherapy": ["Ondansetron 8mg TID", "Dexamethasone"],
                    "constipation": ["Treat constipation first", "Laxatives"],
                    "bowel_obstruction": ["NPO", "NG tube", "Octreotide"]
                }
            },
            
            "depression_management": {
                "mild_depression_phq9_5_9": [
                    "Watchful waiting (2 weeks)",
                    "Counseling/psychotherapy",
                    "Behavioral activation",
                    "Support groups",
                    "Reassess in 2 weeks"
                ],
                "moderate_depression_phq9_10_14": [
                    "Psychotherapy (CBT preferred)",
                    "Consider antidepressant (SSRI first-line)",
                    "Psychiatry referral if not improving",
                    "Reassess every 2 weeks"
                ],
                "severe_depression_phq9_15_plus": [
                    "Immediate psychiatric consultation",
                    "Antidepressant medication",
                    "Intensive psychotherapy",
                    "Safety assessment (suicide risk)",
                    "Consider hospitalization if suicidal"
                ]
            },
            
            "anxiety_management": {
                "non_pharmacological": [
                    "Relaxation techniques",
                    "Deep breathing exercises",
                    "Mindfulness meditation",
                    "CBT for anxiety",
                    "Address underlying fears (death anxiety, etc.)"
                ],
                "pharmacological_gad7_10_plus": [
                    "SSRI (sertraline, escitalopram) - first-line",
                    "Benzodiazepine (lorazepam, diazepam) - short-term only",
                    "Buspirone - alternative to benzodiazepines",
                    "Mirtazapine - if insomnia present"
                ]
            }
        }
        
        protocols_file = self.knowledge_dir / "symptom_management_protocols.json"
        with open(protocols_file, 'w') as f:
            json.dump(protocols, f, indent=2)
        
        logger.info(f"✅ Symptom management protocols saved to {protocols_file}")
        return protocols
    
    def download_all(self):
        """Download all medical knowledge"""
        
        logger.info("="*80)
        logger.info("DOWNLOADING MEDICAL KNOWLEDGE BASE")
        logger.info("="*80)
        
        guidelines = self.download_clinical_guidelines()
        medications = self.download_medication_database()
        protocols = self.download_symptom_management_protocols()
        
        logger.info("\n" + "="*80)
        logger.info("MEDICAL KNOWLEDGE DOWNLOAD COMPLETE")
        logger.info("="*80)
        logger.info(f"Location: {self.knowledge_dir}")
        logger.info(f"Files created:")
        logger.info(f"  - clinical_guidelines.json")
        logger.info(f"  - medication_database.json")
        logger.info(f"  - symptom_management_protocols.json")
        
        return {
            "guidelines": guidelines,
            "medications": medications,
            "protocols": protocols
        }


if __name__ == "__main__":
    downloader = MedicalKnowledgeDownloader()
    knowledge = downloader.download_all()
