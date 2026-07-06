"""
Intelligent Care Engine - Personalized, Disease-Specific, Proactive AI Care
Uses questionnaire data to tailor recommendations, monitors actively, generates alerts
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from src.db import (get_db, User, Patient, PatientPreferences, Vital, Symptom, 
                    Medication, Alert, Resource, get_patient)
from routers.auth import get_current_user

router = APIRouter()


# ==================== DISEASE-SPECIFIC KNOWLEDGE BASE ====================

DISEASE_PROFILES = {
    "cancer": {
        "common_symptoms": ["pain", "fatigue", "nausea", "appetite_loss", "weight_loss"],
        "critical_vitals": {"oxygen_saturation": 88, "temperature": 38.5},
        "pain_threshold": 5,
        "monitoring_frequency": "daily",
        "key_concerns": ["infection_risk", "neutropenia", "mucositis", "neuropathy"],
        "care_priorities": ["pain_management", "nutrition", "infection_prevention"],
        "resources": ["pain_management_cancer", "chemotherapy_side_effects", "nutrition_cancer"]
    },
    "heart_failure": {
        "common_symptoms": ["breathlessness", "fatigue", "edema", "chest_pain"],
        "critical_vitals": {"oxygen_saturation": 90, "heart_rate": 120, "bp_sys": 160},
        "pain_threshold": 6,
        "monitoring_frequency": "twice_daily",
        "key_concerns": ["fluid_retention", "arrhythmia", "medication_adherence"],
        "care_priorities": ["fluid_management", "medication_adherence", "activity_modification"],
        "resources": ["heart_failure_management", "low_sodium_diet", "breathing_exercises"]
    },
    "copd": {
        "common_symptoms": ["breathlessness", "cough", "fatigue", "anxiety"],
        "critical_vitals": {"oxygen_saturation": 88, "respiratory_rate": 30},
        "pain_threshold": 5,
        "monitoring_frequency": "twice_daily",
        "key_concerns": ["respiratory_failure", "infection", "oxygen_therapy"],
        "care_priorities": ["breathing_management", "oxygen_therapy", "infection_prevention"],
        "resources": ["copd_breathing_techniques", "oxygen_therapy_guide", "pulmonary_rehab"]
    },
    "dementia": {
        "common_symptoms": ["confusion", "anxiety", "mood_changes", "agitation"],
        "critical_vitals": {"temperature": 38.0},
        "pain_threshold": 4,  # Lower because can't communicate well
        "monitoring_frequency": "continuous",
        "key_concerns": ["falls_risk", "wandering", "behavioral_changes", "caregiver_burden"],
        "care_priorities": ["safety", "routine", "emotional_support", "caregiver_support"],
        "resources": ["dementia_care_guide", "communication_strategies", "caregiver_support"]
    },
    "kidney_disease": {
        "common_symptoms": ["fatigue", "nausea", "edema", "confusion"],
        "critical_vitals": {"bp_sys": 180, "weight_change": 2},  # kg in 24h
        "pain_threshold": 5,
        "monitoring_frequency": "daily",
        "key_concerns": ["dialysis_complications", "fluid_overload", "electrolyte_imbalance"],
        "care_priorities": ["fluid_restriction", "diet_modification", "medication_timing"],
        "resources": ["renal_diet_guide", "dialysis_care", "fluid_management"]
    },
    "liver_disease": {
        "common_symptoms": ["fatigue", "nausea", "confusion", "jaundice"],
        "critical_vitals": {"heart_rate": 110, "confusion": True},
        "pain_threshold": 6,
        "monitoring_frequency": "daily",
        "key_concerns": ["hepatic_encephalopathy", "bleeding_risk", "ascites"],
        "care_priorities": ["protein_restriction", "lactulose_adherence", "infection_prevention"],
        "resources": ["liver_disease_diet", "encephalopathy_management", "ascites_care"]
    },
    "stroke": {
        "common_symptoms": ["weakness", "speech_difficulty", "pain", "depression"],
        "critical_vitals": {"bp_sys": 180, "oxygen_saturation": 92},
        "pain_threshold": 5,
        "monitoring_frequency": "twice_daily",
        "key_concerns": ["recurrent_stroke", "aspiration", "falls", "spasticity"],
        "care_priorities": ["bp_control", "aspiration_prevention", "mobility", "speech_therapy"],
        "resources": ["stroke_rehabilitation", "swallowing_safety", "bp_management"]
    }
}


# ==================== PERSONALIZATION ENGINE ====================

def get_patient_profile(patient: Patient, preferences: Optional[PatientPreferences], 
                       db: Session) -> Dict[str, Any]:
    """Build comprehensive patient profile for personalized care"""
    
    # Get disease profile
    diagnosis = (patient.primary_diagnosis or "").lower()
    disease_profile = None
    for disease, profile in DISEASE_PROFILES.items():
        if disease in diagnosis:
            disease_profile = profile
            break
    
    if not disease_profile:
        # Generic palliative care profile
        disease_profile = {
            "common_symptoms": ["pain", "fatigue", "anxiety"],
            "critical_vitals": {"oxygen_saturation": 88, "heart_rate": 120},
            "pain_threshold": 6,
            "monitoring_frequency": "daily",
            "key_concerns": ["symptom_management", "quality_of_life"],
            "care_priorities": ["comfort", "dignity", "family_support"],
            "resources": ["palliative_care_basics", "symptom_management"]
        }
    
    # Combine with patient preferences
    profile = {
        "patient_id": patient.id,
        "disease_type": disease_profile,
        "diagnosis": patient.primary_diagnosis,
        "communication_style": "standard",
        "priority_symptoms": disease_profile["common_symptoms"],
        "monitoring_schedule": disease_profile["monitoring_frequency"],
        "critical_thresholds": disease_profile["critical_vitals"],
        "pain_threshold": disease_profile["pain_threshold"],
        "key_concerns": disease_profile["key_concerns"],
        "care_priorities": disease_profile["care_priorities"],
        "recommended_resources": disease_profile["resources"],
        "spiritual_care_needed": False,
        "peer_support_recommended": False,
        "family_involvement": "medium"
    }
    
    # Personalize based on questionnaire
    if preferences:
        # Communication style
        if preferences.info_style:
            profile["communication_style"] = preferences.info_style
        
        # Care priorities from questionnaire
        if preferences.care_priorities:
            try:
                user_priorities = json.loads(preferences.care_priorities)
                profile["user_care_priorities"] = user_priorities
            except:
                pass
        
        # Spiritual needs
        if preferences.wants_spiritual_care:
            profile["spiritual_care_needed"] = True
        
        # Peer support
        if preferences.wants_peer_connection:
            profile["peer_support_recommended"] = True
        
        # Family involvement
        if preferences.family_involvement_pref:
            profile["family_involvement"] = preferences.family_involvement_pref
        
        # Topic interests for resource filtering
        if preferences.topic_interests:
            try:
                interests = json.loads(preferences.topic_interests)
                profile["topic_interests"] = interests
            except:
                pass
    
    return profile


# ==================== PROACTIVE MONITORING ====================

def analyze_patient_proactively(patient: Patient, db: Session) -> List[Dict]:
    """Analyze single patient and generate alerts if needed"""
    alerts_to_create = []
    
    # Get patient profile
    preferences = db.query(PatientPreferences).filter(
        PatientPreferences.patient_id == patient.id
    ).first()
    profile = get_patient_profile(patient, preferences, db)
    
    # Get recent data
    latest_vital = db.query(Vital).filter(
        Vital.patient_id == patient.id
    ).order_by(Vital.recorded_at.desc()).first()
    
    latest_symptom = db.query(Symptom).filter(
        Symptom.patient_id == patient.id
    ).order_by(Symptom.recorded_at.desc()).first()
    
    # Check vital signs against disease-specific thresholds
    if latest_vital:
        thresholds = profile["critical_thresholds"]

        # Helper: safely round a float to 1dp for display
        def fmt(v, unit=""):
            try:
                return f"{float(v):.1f}{unit}"
            except Exception:
                return str(v)

        # Helper: normalise temperature  --  if stored value looks like Fahrenheit (>50) convert to Celsius
        def normalise_temp(t):
            try:
                t = float(t)
                return round((t - 32) * 5 / 9, 1) if t > 50 else round(t, 1)
            except Exception:
                return None

        # Oxygen saturation check
        if "oxygen_saturation" in thresholds:
            o2 = latest_vital.oxygen_saturation
            if o2 and o2 < thresholds["oxygen_saturation"]:
                alerts_to_create.append({
                    "patient_id": patient.id,
                    "type": "vital_abnormal",
                    "severity": "critical",
                    "message": f"Low O2 saturation: {fmt(o2, '%')} (threshold: {thresholds['oxygen_saturation']}%)",
                    "value": round(float(o2), 1),
                    "triggered_at": datetime.utcnow(),
                    "disease_context": profile["diagnosis"],
                    "action": get_disease_specific_action(profile["diagnosis"], "hypoxemia"),
                    "rationale": f"Based on {profile['diagnosis']} management guidelines"
                })

        # Temperature check (normalise °F → °C if needed)
        if "temperature" in thresholds:
            raw_temp = latest_vital.temperature
            temp_c = normalise_temp(raw_temp)
            if temp_c is not None and temp_c > thresholds["temperature"]:
                severity = "critical" if "cancer" in profile["diagnosis"].lower() else "high"
                alerts_to_create.append({
                    "patient_id": patient.id,
                    "type": "vital_abnormal",
                    "severity": severity,
                    "message": f"Fever: {temp_c}°C (threshold: {thresholds['temperature']}°C)",
                    "value": temp_c,
                    "triggered_at": datetime.utcnow(),
                    "disease_context": profile["diagnosis"],
                    "action": get_disease_specific_action(profile["diagnosis"], "fever"),
                    "rationale": "Infection risk elevated" if "cancer" in profile["diagnosis"].lower() else "Monitor for infection"
                })

        # Heart rate check
        if "heart_rate" in thresholds:
            hr = latest_vital.heart_rate
            if hr and hr > thresholds["heart_rate"]:
                alerts_to_create.append({
                    "patient_id": patient.id,
                    "type": "vital_abnormal",
                    "severity": "high",
                    "message": f"Tachycardia: HR {fmt(hr, ' bpm')} (threshold: {thresholds['heart_rate']} bpm)",
                    "value": round(float(hr), 1),
                    "triggered_at": datetime.utcnow(),
                    "disease_context": profile["diagnosis"],
                    "action": get_disease_specific_action(profile["diagnosis"], "tachycardia"),
                    "rationale": "May indicate pain, anxiety, or decompensation"
                })

        # Blood pressure check
        if "bp_sys" in thresholds:
            bp = latest_vital.blood_pressure_sys
            if bp and bp > thresholds["bp_sys"]:
                alerts_to_create.append({
                    "patient_id": patient.id,
                    "type": "vital_abnormal",
                    "severity": "high",
                    "message": f"Hypertension: BP {fmt(bp, ' mmHg')} (threshold: {thresholds['bp_sys']} mmHg)",
                    "value": round(float(bp), 1),
                    "triggered_at": datetime.utcnow(),
                    "disease_context": profile["diagnosis"],
                    "action": get_disease_specific_action(profile["diagnosis"], "hypertension"),
                    "rationale": "Risk of stroke or cardiac event"
                })
    
    # Check symptoms against disease-specific thresholds
    if latest_symptom:
        # Pain threshold
        if latest_symptom.pain_level and latest_symptom.pain_level > profile["pain_threshold"]:
            alerts_to_create.append({
                "patient_id": patient.id,
                "type": "pain_spike",
                "severity": "high",
                "message": f"Pain level {latest_symptom.pain_level}/10 exceeds threshold ({profile['pain_threshold']}/10 for {profile['diagnosis']})",
                "value": latest_symptom.pain_level,
                "triggered_at": datetime.utcnow(),
                "disease_context": profile["diagnosis"],
                "action": get_disease_specific_action(profile["diagnosis"], "pain"),
                "rationale": f"Pain management is priority for {profile['diagnosis']} patients"
            })
        
        # Breathlessness (disease-specific)
        if latest_symptom.breathlessness:
            if "breathlessness" in profile["priority_symptoms"]:
                alerts_to_create.append({
                    "patient_id": patient.id,
                    "type": "symptom_concern",
                    "severity": "medium",
                    "message": f"Breathlessness reported (key symptom for {profile['diagnosis']})",
                    "value": latest_symptom.breathlessness,
                    "triggered_at": datetime.utcnow(),
                    "disease_context": profile["diagnosis"],
                    "action": get_disease_specific_action(profile["diagnosis"], "breathlessness"),
                    "rationale": "Critical symptom requiring intervention"
                })
    
    return alerts_to_create


def get_disease_specific_action(diagnosis: str, issue: str) -> str:
    """Get recommended action based on disease and issue"""
    actions = {
        "cancer": {
            "hypoxemia": "Initiate oxygen therapy; assess for pulmonary embolism or infection",
            "fever": "URGENT: Check for neutropenic sepsis. Blood cultures, broad-spectrum antibiotics if indicated",
            "pain": "Escalate WHO Pain Ladder; consider breakthrough medication; review adjuvants",
            "tachycardia": "Assess for pain, anxiety, infection, or anemia",
            "breathlessness": "Oxygen therapy; consider morphine for dyspnea; rule out PE"
        },
        "heart_failure": {
            "hypoxemia": "Increase oxygen; assess fluid status; consider diuresis",
            "hypertension": "Review antihypertensives; assess volume status",
            "tachycardia": "Assess for AFib; optimize beta-blocker; check fluid balance",
            "breathlessness": "Elevate head of bed; diuresis; oxygen therapy"
        },
        "copd": {
            "hypoxemia": "Titrate oxygen to 88-92%; avoid over-oxygenation; assess for exacerbation",
            "breathlessness": "Bronchodilators; pursed-lip breathing; oxygen therapy",
            "tachycardia": "Review bronchodilator dosing; assess for infection"
        },
        "dementia": {
            "fever": "Assess for UTI, aspiration pneumonia; ensure adequate hydration",
            "pain": "Use PAINAD scale; trial analgesics; assess for non-verbal cues",
            "agitation": "Assess for pain, constipation, infection; non-pharmacological first"
        },
        "stroke": {
            "hypertension": "URGENT: Risk of recurrent stroke; optimize BP control",
            "pain": "Differentiate central vs musculoskeletal; specific management per type"
        }
    }
    
    diagnosis_lower = diagnosis.lower()
    for disease in actions.keys():
        if disease in diagnosis_lower:
            return actions[disease].get(issue, "Clinical assessment and management per protocol")
    
    return "Clinical assessment and management per protocol"


# ==================== API ENDPOINTS ====================

@router.get("/profile/{patient_id}")
async def get_personalized_profile(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized patient profile with disease-specific intelligence"""
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    preferences = db.query(PatientPreferences).filter(
        PatientPreferences.patient_id == patient_id
    ).first()
    
    profile = get_patient_profile(patient, preferences, db)
    return profile


@router.post("/analyze-patient/{patient_id}")
async def analyze_single_patient(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger analysis for single patient"""
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Generate alerts
    alerts_data = analyze_patient_proactively(patient, db)
    
    # Save to database
    created_alerts = []
    for alert_data in alerts_data:
        # Check if similar alert already exists in last hour
        existing = db.query(Alert).filter(
            Alert.patient_id == alert_data["patient_id"],
            Alert.alert_type == alert_data["type"],
            Alert.created_at > datetime.utcnow() - timedelta(hours=1),
            Alert.is_acknowledged == False
        ).first()
        
        if not existing:
            new_alert = Alert(
                patient_id=alert_data["patient_id"],
                alert_type=alert_data["type"],
                severity=alert_data["severity"],
                message=alert_data["message"],
                triggered_value=str(alert_data.get("value", "")),
                created_at=alert_data["triggered_at"],
                is_acknowledged=False
            )
            db.add(new_alert)
            created_alerts.append(alert_data)
            
            # Track critical/high alerts as journey events
            if alert_data["severity"] in ["Critical", "High"]:
                from services.journey_tracker import track_critical_alert
                db.flush()  # Ensure alert is saved first
                track_critical_alert(
                    db=db,
                    patient_id=alert_data["patient_id"],
                    alert_type=alert_data["type"],
                    severity=alert_data["severity"],
                    details=alert_data["message"]
                )
    
    db.commit()
    
    return {
        "patient_id": patient_id,
        "alerts_generated": len(created_alerts),
        "alerts": created_alerts
    }


@router.post("/analyze-all")
async def analyze_all_patients_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger proactive analysis for ALL patients"""
    patients = db.query(Patient).filter(Patient.status != 'deceased').all()
    
    total_alerts = 0
    for patient in patients:
        alerts_data = analyze_patient_proactively(patient, db)
        
        for alert_data in alerts_data:
            # Avoid duplicates
            existing = db.query(Alert).filter(
                Alert.patient_id == alert_data["patient_id"],
                Alert.alert_type == alert_data["type"],
                Alert.created_at > datetime.utcnow() - timedelta(hours=1),
                Alert.is_acknowledged == False
            ).first()
            
            if not existing:
                new_alert = Alert(
                    patient_id=alert_data["patient_id"],
                    alert_type=alert_data["type"],
                    severity=alert_data["severity"],
                    message=alert_data["message"],
                    triggered_value=str(alert_data.get("value", "")),
                    created_at=alert_data["triggered_at"],
                    is_acknowledged=False
                )
                db.add(new_alert)
                total_alerts += 1
                
                # Track critical/high alerts as journey events
                if alert_data["severity"] in ["Critical", "High"]:
                    from services.journey_tracker import track_critical_alert
                    db.flush()  # Ensure alert is saved first
                    track_critical_alert(
                        db=db,
                        patient_id=alert_data["patient_id"],
                        alert_type=alert_data["type"],
                        severity=alert_data["severity"],
                        details=alert_data["message"]
                    )
    
    db.commit()
    
    return {
        "patients_analyzed": len(patients),
        "alerts_generated": total_alerts,
        "timestamp": datetime.utcnow()
    }



# ==================== ADAPTIVE CARE GUIDE ====================

CARE_GUIDE_CONTENT = {
    "cancer": {
        "protocols": [
            {
                "title": "WHO Pain Ladder for Cancer Pain",
                "priority": "high",
                "content": """
**Step 1: Mild Pain (1-3/10)**
- Non-opioids: Paracetamol 1g every 6 hours
- NSAIDs: Ibuprofen 400mg every 8 hours
- Monitor for breakthrough pain

**Step 2: Moderate Pain (4-6/10)**
- Weak opioids: Tramadol 50-100mg every 6 hours
- OR Codeine 30-60mg every 4-6 hours
- Continue non-opioid base
- Add adjuvants if neuropathic component

**Step 3: Severe Pain (7-10/10)**
- Strong opioids: Morphine 5-10mg every 4 hours (oral immediate release)
- OR Morphine 10-30mg every 12 hours (slow release)
- Breakthrough dose: 1/6 of total daily dose
- Titrate every 24-48 hours
- Monitor for side effects (nausea, constipation)

**⚠️ Cancer-Specific Considerations:**
- Assess for bone pain → consider bisphosphonates
- Neuropathic pain → add gabapentin or pregabalin
- Incident pain → give breakthrough dose 30 min before activity
- Always prescribe laxative with opioids
                """
            },
            {
                "title": "Infection Prevention & Fever Management",
                "priority": "critical",
                "content": """
**⚠️ CRITICAL: Neutropenic Fever Protocol**

**If Temperature >38.5°C:**
1. **Immediate Assessment:**
   - Check vital signs every 4 hours
   - Blood cultures before antibiotics
   - Full blood count (check neutrophils)
   
2. **Neutropenic Sepsis Risk (if neutrophils <0.5):**
   - This is a MEDICAL EMERGENCY
   - Broad-spectrum antibiotics within 1 hour
   - Consider hospital admission
   - Do NOT wait for culture results

3. **Prevention Measures:**
   - Avoid crowds and sick contacts
   - Practice good hand hygiene
   - Watch for infection signs: sore throat, cough, urinary symptoms
   - No raw foods (salads, uncooked vegetables)
   - Maintain oral hygiene

**When to Seek Immediate Help:**
- Fever >38.5°C
- Shaking chills
- New cough or breathlessness
- Burning during urination
- Unusual fatigue or confusion
                """
            },
            {
                "title": "Nutrition for Cancer Patients",
                "priority": "medium",
                "content": """
**Managing Appetite Loss & Nausea:**

**Small Frequent Meals:**
- Eat 5-6 small meals instead of 3 large ones
- Keep snacks handy (biscuits, fruits, yogurt)
- Don't force eating when nauseated

**Protein-Rich Foods:**
- Eggs, beans, fish, chicken
- Protein shakes or supplements
- Greek yogurt, cheese
- Aim for protein at each meal

**Managing Nausea:**
- Eat bland foods (toast, crackers, rice)
- Avoid spicy, fried, or strong-smelling foods
- Ginger tea can help
- Take anti-nausea meds 30 min before eating
- Stay upright after meals

**Hydration:**
- Sip fluids throughout day
- Try ice chips if plain water unappealing
- Oral rehydration salts if persistent vomiting
- Target: 2 liters daily

**⚠️ When to Seek Help:**
- Unable to eat/drink for 24 hours
- Persistent vomiting
- Weight loss >5% in 1 month
                """
            }
        ],
        "emergency_contacts": [
            "Cancer Helpline Ghana: 0800-CANCER",
            "Korle Bu Oncology: +233 302 123 456"
        ]
    },
    "heart_failure": {
        "protocols": [
            {
                "title": "Fluid Management for Heart Failure",
                "priority": "critical",
                "content": """
**Daily Fluid Restriction:**
- **Limit total fluids to 1.5-2 liters per day**
- This includes water, tea, soup, juice, etc.
- Use small cups to track intake

**Daily Weight Monitoring:**
- Weigh yourself EVERY morning
- Same time, same scale, after urination
- Before eating or drinking
- Wear similar clothing

**⚠️ Call Doctor if Weight Increases:**
- >1 kg in 1 day
- >2 kg in 1 week
- This indicates fluid retention

**Low Sodium Diet:**
- Avoid adding salt to food
- Avoid processed foods (tinned, canned)
- Avoid fast foods and restaurant meals
- Read labels: aim for <2g sodium per day

**Signs of Fluid Overload:**
- Swelling in legs/ankles/feet
- Breathlessness when lying flat
- Needing more pillows to sleep
- Reduced urine output
- Rapid weight gain
                """
            },
            {
                "title": "Breathlessness Management",
                "priority": "high",
                "content": """
**Positioning:**
- Sit upright or semi-recumbent
- Use 2-3 pillows at night
- Lean forward with arms supported
- Avoid lying completely flat

**Breathing Techniques:**
- Pursed-lip breathing: breathe in through nose, out through pursed lips
- Slow, controlled breaths
- Don't panic - panic worsens breathlessness

**Activity Modification:**
- Plan rest periods between activities
- Avoid rushing
- Break tasks into smaller steps
- Keep frequently used items within reach

**Oxygen Therapy (if prescribed):**
- Use as directed by doctor
- Keep flow rate at prescribed level
- Don't adjust without medical advice
- Ensure tubing not kinked

**⚠️ Seek Immediate Help if:**
- Sudden severe breathlessness
- Chest pain with breathlessness
- Coughing pink frothy sputum
- Cannot speak in full sentences
- Blue lips or fingernails
                """
            },
            {
                "title": "Medication Adherence",
                "priority": "critical",
                "content": """
**Essential Heart Failure Medications:**

**Diuretics (Water Pills):**
- Usually taken in morning
- Will increase urination (normal)
- Don't skip even if feeling better
- Monitor weight as indicator

**ACE Inhibitors / ARBs:**
- Blood pressure control
- Protect heart and kidneys
- May cause dry cough (tell doctor)
- Don't stop suddenly

**Beta-Blockers:**
- Slow heart rate
- Protect heart muscle
- May feel more tired initially (improves)
- Essential for heart failure

**⚠️ Never Stop Medications Without Consulting Doctor**

**Medication Tips:**
- Use pill organizer
- Set phone reminders
- Keep medication list updated
- Check with pharmacist before taking new medicines
- Some over-the-counter meds worsen heart failure
                """
            }
        ],
        "emergency_contacts": [
            "Cardiology Emergency: 0800-HEART",
            "37 Military Hospital Cardiology: +233 302 777 777"
        ]
    },
    "copd": {
        "protocols": [
            {
                "title": "Oxygen Therapy Management",
                "priority": "critical",
                "content": """
**Prescribed Oxygen Use:**
- Target O2 saturation: 88-92% (NOT 95-100%)
- Use prescribed flow rate EXACTLY
- Don't increase flow without medical advice
- Over-oxygenation is dangerous in COPD

**Oxygen Safety:**
- NO smoking near oxygen (fire hazard)
- Keep oxygen away from heat sources
- No oil-based products near oxygen
- Ensure good ventilation

**Equipment Care:**
- Clean nasal cannula daily with soap and water
- Replace tubing monthly
- Check connections for leaks
- Keep equipment clean and dry

**Signs Oxygen Needs Adjustment:**
- Increasing breathlessness despite oxygen
- Morning headaches (may indicate high CO2)
- Confusion or drowsiness
- Contact respiratory team for assessment
                """
            },
            {
                "title": "Breathing Exercises & Techniques",
                "priority": "high",
                "content": """
**Pursed-Lip Breathing:**
1. Breathe in through nose (count to 2)
2. Purse lips as if whistling
3. Breathe out slowly through pursed lips (count to 4)
4. Use during activities and when breathless

**Diaphragmatic Breathing:**
1. Sit or lie comfortably
2. Place hand on belly
3. Breathe in through nose, feel belly rise
4. Breathe out slowly, belly falls
5. Practice 5 minutes, 3 times daily

**Positions to Ease Breathlessness:**
- Forward lean: sit, lean forward, arms on table
- Standing: lean forward against wall
- Lying: semi-recumbent with pillows

**Energy Conservation:**
- Plan activities for when you have most energy
- Rest before getting tired
- Break tasks into smaller steps
- Avoid rushing
- Keep frequently used items within reach
                """
            },
            {
                "title": "Infection Prevention & Management",
                "priority": "critical",
                "content": """
**⚠️ COPD Exacerbations:**

**Early Warning Signs:**
- Increased breathlessness
- More coughing
- Change in sputum (color, amount, thickness)
- Increased wheeze
- Chest tightness
- Fatigue

**Action Plan:**
- Start rescue antibiotics if prescribed
- Increase bronchodilator use
- Contact doctor within 24 hours
- Don't wait - early treatment prevents hospital admission

**Prevention:**
- Annual flu vaccination
- Pneumonia vaccination every 5 years
- Avoid people with colds/flu
- Good hand hygiene
- Stop smoking (essential)

**Daily Monitoring:**
- Note sputum color and amount
- Monitor breathlessness level
- Check O2 saturation if home monitor available
- Keep rescue medications handy
                """
            }
        ],
        "emergency_contacts": [
            "Respiratory Emergency: 0800-COPD",
            "Ridge Hospital Respiratory Unit: +233 302 123 789"
        ]
    },
    "dementia": {
        "protocols": [
            {
                "title": "Safety & Fall Prevention",
                "priority": "critical",
                "content": """
**Home Safety Modifications:**
- Remove tripping hazards (rugs, clutter)
- Install grab bars in bathroom
- Ensure good lighting throughout
- Lock away dangerous items (chemicals, sharp objects)
- Use night lights
- Consider bed rails if needed

**Fall Prevention:**
- Wear non-slip footwear
- Use walking aids if prescribed
- Supervise during walking if unsteady
- Keep floors dry and clear
- Rise slowly from sitting/lying

**Wandering Prevention:**
- Install locks high/low on doors
- Use identification bracelet
- Inform neighbors
- Consider GPS tracking device
- Establish routine to reduce anxiety

**Medication Safety:**
- Store medications securely
- Supervise medication taking
- Use dosette boxes
- Set reminders
- Prevent access to medication cupboard
                """
            },
            {
                "title": "Communication Strategies",
                "priority": "high",
                "content": """
**Effective Communication:**
- Speak slowly and clearly
- Use simple sentences
- One instruction at a time
- Allow time to respond
- Don't argue or correct
- Validate feelings
- Use visual cues
- Maintain eye contact

**Managing Repetitive Questions:**
- Answer patiently each time
- Distract gently to new topic
- Keep answers brief
- Don't say "I already told you"
- Consider answer board for common questions

**Reducing Confusion:**
- Maintain consistent routine
- Keep environment familiar
- Use calendars and clocks
- Label drawers and cupboards
- Minimize changes
- Avoid busy, noisy environments
                """
            },
            {
                "title": "Caregiver Support & Self-Care",
                "priority": "high",
                "content": """
**Caregiver Well-Being:**
- Accept help from family/friends
- Join caregiver support group
- Take regular breaks (respite care)
- Maintain own health appointments
- Don't neglect own needs
- Seek counseling if feeling overwhelmed

**Managing Difficult Behaviors:**
- Stay calm
- Don't take behaviors personally
- Identify triggers
- Distract and redirect
- Ensure physical comfort (pain, hunger, bathroom)
- Consult doctor if behaviors worsen

**Resources:**
- Dementia Ghana Support Group
- Caregiver respite services
- Adult day care centers
- Home care assistance
- Counseling services

**⚠️ Seek Help if:**
- Caregiver burnout
- Patient becomes aggressive
- Unable to manage at home
- Safety concerns escalate
                """
            }
        ],
        "emergency_contacts": [
            "Dementia Helpline: 0800-DEMENTIA",
            "Psychiatric Hospital Accra: +233 302 654 321"
        ]
    }
}


@router.get("/care-guide/{patient_id}")
async def get_adaptive_care_guide(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized care guide filtered by patient's disease"""
    patient = get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get patient profile to determine disease type
    preferences = db.query(PatientPreferences).filter(
        PatientPreferences.patient_id == patient_id
    ).first()
    
    profile = get_patient_profile(patient, preferences, db)
    
    # Find matching care guide content
    diagnosis_lower = (patient.primary_diagnosis or "").lower()
    care_content = None
    disease_matched = "general"
    
    for disease in CARE_GUIDE_CONTENT.keys():
        if disease in diagnosis_lower:
            care_content = CARE_GUIDE_CONTENT[disease]
            disease_matched = disease
            break
    
    # Fallback to generic palliative care
    if not care_content:
        care_content = {
            "protocols": [
                {
                    "title": "General Palliative Care Guidelines",
                    "priority": "high",
                    "content": "Comprehensive symptom management and quality of life support."
                }
            ],
            "emergency_contacts": ["Palliative Care Hotline: 0800-PALLIATE"]
        }
    
    # Adapt complexity based on preferences
    communication_style = profile.get("communication_style", "standard")
    
    return {
        "patient_id": patient_id,
        "patient_name": patient.full_name,
        "diagnosis": patient.primary_diagnosis,
        "disease_matched": disease_matched,
        "care_priorities": profile.get("care_priorities", []),
        "communication_style": communication_style,
        "protocols": care_content["protocols"],
        "emergency_contacts": care_content.get("emergency_contacts", []),
        "monitoring_schedule": profile.get("monitoring_schedule", "daily")
    }
