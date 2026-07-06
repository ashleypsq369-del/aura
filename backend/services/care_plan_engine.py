"""
Care Plan AI Engine
===================
Analyses ALL available patient data to generate and continuously improve
personalised care plans. No external APIs. Runs entirely locally.

Data sources analysed:
  - Patient demographics, diagnosis, care pathway
  - ESAS assessments (symptom burden 0-10)
  - PPS assessments (functional status 0-100)
  - PHQ-9 (depression severity)
  - GAD-7 (anxiety severity)
  - Cognitive assessments (MMSE / MoCA)
  - Barthel Index (ADL independence)
  - Pain assessments (Brief Pain Inventory)
  - Quality of Life assessments
  - Caregiver Burden (Zarit)
  - Current vitals
  - Active medications
  - Patient preferences / questionnaire
  - Previous care plan history
"""

from __future__ import annotations
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import re
import json


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1  --  DISEASE PROFILES
# Maps diagnosis text → structured care profile
# ═══════════════════════════════════════════════════════════════════════════

DISEASE_PROFILES: Dict[str, Dict] = {
    "cancer": {
        "keywords": ["cancer","carcinoma","sarcoma","lymphoma","leukemia","myeloma","tumour","tumor","malignancy","oncology","metastatic","neoplasm"],
        "care_phase_rules": {
            "terminal": "pps_score < 40 or risk_score > 0.8",
            "deteriorating": "pps_score < 60 or risk_score > 0.6",
            "unstable": "pps_score < 80 or risk_score > 0.4",
            "stable": "pps_score >= 80",
        },
        "priority_symptoms": ["pain","nausea","fatigue","breathlessness","constipation","appetite_loss"],
        "key_goals": [
            {"title": "Achieve adequate pain control (NRS ≤ 3/10)", "category": "pain", "priority": "critical"},
            {"title": "Control nausea and maintain oral intake", "category": "symptom", "priority": "high"},
            {"title": "Preserve functional independence as long as possible", "category": "functional", "priority": "high"},
            {"title": "Provide psychological support for patient and family", "category": "psychological", "priority": "high"},
            {"title": "Ensure advance care plan is documented", "category": "safety", "priority": "medium"},
            {"title": "Optimise nutritional intake and manage cachexia", "category": "nutrition", "priority": "medium"},
            {"title": "Address spiritual and existential concerns", "category": "spiritual", "priority": "medium"},
        ],
        "standard_interventions": [
            {"name": "WHO Pain Ladder review", "category": "medication", "frequency": "daily", "role": "clinician"},
            {"name": "Anti-emetic medication review", "category": "medication", "frequency": "daily", "role": "clinician"},
            {"name": "ESAS symptom assessment", "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Nutritional assessment and support", "category": "therapy", "frequency": "weekly", "role": "clinician"},
            {"name": "Psychosocial support session", "category": "therapy", "frequency": "weekly", "role": "clinician"},
            {"name": "Family meeting and care planning", "category": "education", "frequency": "monthly", "role": "clinician"},
        ],
        "red_flags": ["temperature>38.5°C","severe breathlessness","uncontrolled pain","confusion","bleeding"],
        "monitoring_schedule": "Daily vitals, ESAS every 48 hours, PPS weekly",
        "guide_sections": [
            {
                "title": "Cancer Pain Management  --  WHO Analgesic Ladder",
                "priority": "critical",
                "content": """**Step 1  --  Mild Pain (NRS 1-3):**
- Paracetamol 1g every 6 hours (max 4g/day)
- Ibuprofen 400mg every 8 hours with food (avoid if renal impairment)
- Add adjuvants: amitriptyline for neuropathic component

**Step 2  --  Moderate Pain (NRS 4-6):**
- Tramadol 50-100mg every 6 hours (max 400mg/day)
- OR Codeine 30-60mg every 4-6 hours
- Continue paracetamol as base
- Add lactulose to prevent constipation

**Step 3  --  Severe Pain (NRS 7-10):**
- Oral morphine 5-10mg every 4 hours (immediate release)
- OR Slow-release morphine 10-30mg every 12 hours
- Breakthrough dose: 1/6 of total daily opioid dose
- Prescribe laxative alongside (senna + lactulose)
- Titrate dose every 24-48 hours until pain controlled

**Neuropathic Pain Add-ons:**
- Gabapentin 100-300mg at night, titrate to 300mg TDS
- OR Amitriptyline 10-25mg at night
- Tramadol has dual opioid + SNRI mechanism  --  useful for nerve pain

**Bone Pain:**
- NSAIDs are particularly effective
- Consider bisphosphonate referral for bone mets
- Incident pain: give breakthrough dose 30 min before activity"""
            },
            {
                "title": "Infection Prevention  --  Neutropenic Sepsis Protocol",
                "priority": "critical",
                "content": """**⚠️ MEDICAL EMERGENCY if fever + chemotherapy:**
Temperature >38.5°C during/after chemotherapy = suspected neutropenic sepsis

**Immediate Action:**
1. Check full blood count urgently
2. Blood cultures before starting antibiotics
3. Broad-spectrum antibiotics within 1 HOUR (do not wait for results)
4. Admit to hospital
5. Monitor vital signs every 4 hours

**Prevention:**
- Hand hygiene  --  wash before every patient contact
- Avoid crowds and people with infections
- No raw or undercooked foods
- Daily temperature monitoring
- Good oral hygiene (soft toothbrush, chlorhexidine mouthwash)
- Avoid sources of infection (soil, uncooked meat, sick visitors)

**When to Seek IMMEDIATE Help:**
- Temperature >38.5°C or <36°C
- Shaking chills, sweats
- New confusion or drowsiness
- Burning on urination, cough, sore throat"""
            },
            {
                "title": "Cancer Nutrition  --  Managing Cachexia & Poor Appetite",
                "priority": "high",
                "content": """**Cancer Cachexia (weight loss + muscle wasting):**
- Aim for 30-35 kcal/kg/day
- Protein target: 1.5g/kg/day
- Do NOT force large meals  --  this causes distress

**Practical Strategies:**
- 5-6 small meals and snacks spread through day
- High-calorie, high-protein additions: groundnut butter, eggs, full-fat milk, avocado
- Nutritional supplements (Ensure, Complan) if appetite very poor
- Eat at best-energy time of day
- Social eating if possible  --  enjoyment matters

**Managing Treatment Side Effects:**
- Nausea: bland foods, ginger tea, sit upright after eating
- Mouth sores: soft, cool foods; avoid spicy/acidic; salt + bicarb mouthwash
- Taste changes: try cold foods, use different flavourings
- Dysphagia: pureed foods, thickened liquids  --  refer to speech therapist

**Oral Medications to Improve Appetite:**
- Dexamethasone 2-4mg morning (short-term boost, appetite + energy)
- Megestrol acetate (if available)
- Address nausea first  --  metoclopramide, ondansetron"""
            },
            {
                "title": "Emotional & Psychological Support",
                "priority": "high",
                "content": """**Initial Psychological Assessment:**
- Screen with PHQ-9 (depression) and GAD-7 (anxiety) at diagnosis and every 4 weeks
- PHQ-9 ≥10: moderate-severe depression → active treatment
- GAD-7 ≥10: moderate-severe anxiety → active treatment

**Psychological Interventions:**
- Active listening and therapeutic communication at every visit
- Validate feelings  --  normalise sadness, fear, anger
- Dignity Therapy: structured narrative about life, legacy, meaning
- Mindfulness techniques: breathing, grounding
- Counselling referral for persistent symptoms

**Pharmacological:**
- Depression: sertraline 50mg morning (first-line); mirtazapine if insomnia
- Anxiety: lorazepam 0.5-1mg PRN for acute; pregabalin for chronic
- Delirium: haloperidol 0.5-1mg BD (low dose in elderly/advanced)

**Family Support:**
- Family meeting within first week of palliative care involvement
- Honest, compassionate communication about prognosis
- Identify primary family caregiver and assess burden (Zarit)
- Arrange respite care if caregiver burned out"""
            },
        ]
    },

    "heart_failure": {
        "keywords": ["heart failure","cardiac failure","congestive heart failure","chf","left ventricular","lvf","rvf","cardiomyopathy","heart disease"],
        "priority_symptoms": ["breathlessness","oedema","fatigue","pain"],
        "key_goals": [
            {"title": "Achieve euvolaemia  --  target dry weight maintained", "category": "medication", "priority": "critical"},
            {"title": "Optimise heart failure medication adherence", "category": "medication", "priority": "critical"},
            {"title": "Manage breathlessness to allow basic activity", "category": "symptom", "priority": "high"},
            {"title": "Daily weight monitoring  --  detect fluid retention early", "category": "monitoring", "priority": "high"},
            {"title": "Sodium and fluid restriction education to patient + family", "category": "education", "priority": "high"},
            {"title": "Provide psychological support for adjustment to diagnosis", "category": "psychological", "priority": "medium"},
        ],
        "standard_interventions": [
            {"name": "Daily weight monitoring", "category": "monitoring", "frequency": "daily", "role": "patient"},
            {"name": "Fluid intake chart", "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Medication review (diuretics, ACE-I, beta-blockers)", "category": "medication", "frequency": "weekly", "role": "clinician"},
            {"name": "Breathlessness assessment and positioning", "category": "therapy", "frequency": "daily", "role": "nurse"},
            {"name": "Low-sodium diet education", "category": "education", "frequency": "weekly", "role": "clinician"},
        ],
        "red_flags": ["weight increase >1kg/day","severe breathlessness at rest","chest pain","pink frothy sputum","SpO2<90%"],
        "monitoring_schedule": "Daily weight and fluid balance, vitals twice daily, ESAS weekly",
        "guide_sections": [
            {
                "title": "Heart Failure  --  Fluid and Weight Management",
                "priority": "critical",
                "content": """**Daily Weight Monitoring (Essential):**
- Weigh EVERY morning  --  same time, same scale, before eating, after passing urine
- Record weight and compare to yesterday
- Call doctor immediately if weight increases >1 kg in 1 day or >2 kg in 1 week

**Fluid Restriction:**
- Total fluid limit: 1.5-2 litres per day (all sources: water, tea, soup, juice, ice cream)
- Use small cups  --  track every drink
- Thirst technique: small sips, ice chips, lemon slices in water

**Low Sodium Diet:**
- Target: <2g sodium per day (<5g salt)
- Avoid: table salt, tinned/canned foods, fast food, stock cubes
- Read labels: "low sodium" = <120mg per serve
- Fresh foods, cook from scratch

**Signs of Fluid Overload  --  Act Immediately:**
- Legs, ankles, or abdomen swelling
- Breathlessness worse than usual
- Needing extra pillows to sleep
- Rapid weight gain
- Reduced urine despite diuretics"""
            },
            {
                "title": "Heart Failure  --  Medication Management",
                "priority": "critical",
                "content": """**Essential Medications (Do NOT stop without medical advice):**

**Diuretics (Furosemide, Spironolactone):**
- Take in the morning to avoid night-time urination
- Expect increased urination  --  this is the intended effect
- Monitor potassium (furosemide lowers it; spironolactone raises it)

**ACE Inhibitors / ARBs (Lisinopril, Enalapril, Losartan):**
- May cause dry cough (ACE-I)  --  switch to ARB if troublesome
- Monitor renal function and potassium
- Do NOT take NSAIDs alongside (worsen kidneys)

**Beta-Blockers (Carvedilol, Bisoprolol):**
- May feel more tired first 2-4 weeks  --  persevere
- Do NOT stop suddenly  --  can precipitate crisis
- Helps reduce hospitalisations and prolong life

**SGLT2 Inhibitors (Empagliflozin, Dapagliflozin)  --  if available:**
- Significant mortality benefit in HFrEF
- Also lowers blood sugar and blood pressure

**Monitoring:**
- Renal function (U&E) at 2 weeks after any dose change
- Blood pressure: target <140/90 (or <130/80 in diabetes)
- Heart rate: target 60-70 bpm at rest on beta-blocker"""
            },
        ]
    },

    "copd": {
        "keywords": ["copd","chronic obstructive","emphysema","chronic bronchitis","obstructive airway","airways disease"],
        "priority_symptoms": ["breathlessness","fatigue","cough","sputum"],
        "key_goals": [
            {"title": "Maintain O2 saturation 88-92% (not above in COPD)", "category": "medication", "priority": "critical"},
            {"title": "Prevent and manage acute exacerbations early", "category": "monitoring", "priority": "critical"},
            {"title": "Optimise inhaler technique and bronchodilator use", "category": "medication", "priority": "high"},
            {"title": "Breathing exercise programme  --  pursed-lip and diaphragmatic", "category": "functional", "priority": "high"},
            {"title": "Smoking cessation support (if applicable)", "category": "education", "priority": "high"},
            {"title": "Pulmonary rehabilitation if tolerated", "category": "therapy", "priority": "medium"},
        ],
        "standard_interventions": [
            {"name": "Oxygen therapy monitoring (SpO2 target 88-92%)", "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Inhaler technique check", "category": "medication", "frequency": "monthly", "role": "clinician"},
            {"name": "Breathlessness assessment and breathing exercises", "category": "therapy", "frequency": "daily", "role": "nurse"},
            {"name": "Sputum colour and exacerbation monitoring", "category": "monitoring", "frequency": "daily", "role": "patient"},
            {"name": "Vaccination (flu annual, pneumonia every 5 years)", "category": "procedure", "frequency": "annually", "role": "clinician"},
        ],
        "red_flags": ["SpO2<85%","cyanosis","confusion","accessory muscle use","unable to speak in sentences"],
        "monitoring_schedule": "SpO2 twice daily, vital signs daily, sputum colour daily, ESAS weekly",
        "guide_sections": [
            {
                "title": "COPD Oxygen Therapy  --  Critical Rules",
                "priority": "critical",
                "content": """**⚠️ COPD Oxygen Target: 88-92% SpO2 (NOT 95-100%)**
High-flow oxygen in COPD can suppress respiratory drive and cause CO2 retention (Type 2 respiratory failure).

**Prescribed Oxygen Use:**
- Use EXACTLY the flow rate prescribed (usually 1-2 L/min via nasal cannula)
- Target SpO2 88-92%  --  check with pulse oximeter
- Do NOT increase flow without calling doctor first
- Nocturnal oxygen: use as prescribed; morning headache = CO2 retention  --  call team

**Oxygen Safety:**
- NO smoking near oxygen  --  fire hazard
- No petroleum-based products near face or equipment
- Keep away from heat and naked flames
- Store cylinders upright and secured
- Check tubing for kinks before use

**Signs Oxygen Needs Review:**
- Morning headaches (raised CO2)
- Confusion or unusual drowsiness
- Pink, flushed appearance with O2
- SpO2 consistently >94% on prescribed dose"""
            },
        ]
    },

    "dementia": {
        "keywords": ["dementia","alzheimer","cognitive decline","vascular dementia","lewy body","frontotemporal","memory loss","cognitive impairment","confusion"],
        "priority_symptoms": ["confusion","pain","constipation","depression","anxiety"],
        "key_goals": [
            {"title": "Maintain safety  --  prevent falls and wandering", "category": "safety", "priority": "critical"},
            {"title": "Achieve adequate pain control (use behavioural pain tools)", "category": "pain", "priority": "critical"},
            {"title": "Support and assess caregiver burden regularly", "category": "family", "priority": "high"},
            {"title": "Maintain communication and patient dignity", "category": "psychological", "priority": "high"},
            {"title": "Maintain nutritional intake and hydration", "category": "nutrition", "priority": "high"},
            {"title": "Document advance care plan and DNACPR wishes while capacity present", "category": "safety", "priority": "high"},
        ],
        "standard_interventions": [
            {"name": "Falls risk assessment and safety review", "category": "monitoring", "frequency": "weekly", "role": "nurse"},
            {"name": "Cognitive assessment (MMSE/MoCA)", "category": "monitoring", "frequency": "monthly", "role": "clinician"},
            {"name": "Behavioural pain assessment (Abbey, PAINAD)", "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Caregiver burden assessment (Zarit)", "category": "monitoring", "frequency": "monthly", "role": "clinician"},
            {"name": "Reality orientation and reminiscence therapy", "category": "therapy", "frequency": "daily", "role": "caregiver"},
            {"name": "Advance care planning discussion", "category": "education", "frequency": "quarterly", "role": "clinician"},
        ],
        "red_flags": ["sudden acute confusion","falls with injury","unable to swallow","complete food refusal","severe agitation"],
        "monitoring_schedule": "Behavioural pain scores daily, cognitive screen monthly, caregiver burden monthly",
        "guide_sections": [
            {
                "title": "Dementia  --  Safety and Falls Prevention",
                "priority": "critical",
                "content": """**Environmental Safety Modifications:**
- Remove rugs, loose cables, and clutter from walking paths
- Install grab rails in bathroom (toilet, shower, bath)
- Good lighting in all rooms, especially at night (night lights)
- Lock or secure: medications, sharp objects, cleaning chemicals, car keys
- Stair gates if wandering to stairs is a risk
- Non-slip mats in bathroom and kitchen

**Falls Prevention:**
- Non-slip footwear  --  no loose slippers
- Walking aid (stick, frame) if prescribed  --  ensure correct height
- Supervise during walking if gait is unstable
- Rise slowly from chair/bed  --  dangle feet first
- Hip protectors if repeated falls

**Wandering Management:**
- Install door alarms or high/low locks on external doors
- Identification bracelet with name and contact number
- Notify immediate neighbours to call if seen outside alone
- GPS tracker wristband or pendant
- Maintain daily routine  --  wandering often increases with boredom or anxiety
- Safe outdoor space if possible (supervised garden)"""
            },
        ]
    },

    "renal_failure": {
        "keywords": ["renal failure","kidney failure","chronic kidney disease","ckd","end-stage renal","dialysis","nephrotic","acute kidney injury"],
        "priority_symptoms": ["oedema","breathlessness","pain","nausea","fatigue","itching"],
        "key_goals": [
            {"title": "Optimise fluid balance and monitor oedema", "category": "monitoring", "priority": "critical"},
            {"title": "Manage uraemic symptoms  --  nausea, itching, fatigue", "category": "symptom", "priority": "high"},
            {"title": "Diet compliance: low potassium, low phosphate, fluid restriction", "category": "nutrition", "priority": "high"},
            {"title": "Medication review  --  dose adjustment for renal function", "category": "medication", "priority": "high"},
            {"title": "Advance care planning  --  dialysis decisions documented", "category": "safety", "priority": "medium"},
        ],
        "standard_interventions": [
            {"name": "Fluid balance chart", "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Renal diet education (low K+, low PO4)", "category": "education", "frequency": "weekly", "role": "clinician"},
            {"name": "Medication review for renal dosing", "category": "medication", "frequency": "monthly", "role": "clinician"},
            {"name": "Symptom assessment (itching, nausea, pain)", "category": "monitoring", "frequency": "daily", "role": "nurse"},
        ],
        "red_flags": ["urine output<0.5ml/kg/hr","K+>6mmol/L","pulmonary oedema","pericardial rub","severe uraemic encephalopathy"],
        "monitoring_schedule": "Daily fluid balance and weight, electrolytes weekly, ESAS twice weekly",
        "guide_sections": []
    },

    "stroke": {
        "keywords": ["stroke","cerebrovascular","tia","hemiplegia","hemiparesis","aphasia","dysphasia","ischaemic stroke","haemorrhagic stroke","cva"],
        "priority_symptoms": ["pain","depression","dysphagia","constipation","pressure_sores"],
        "key_goals": [
            {"title": "Prevent secondary stroke  --  medication adherence", "category": "medication", "priority": "critical"},
            {"title": "Swallowing safety assessment  --  prevent aspiration", "category": "safety", "priority": "critical"},
            {"title": "Neurological rehabilitation  --  physiotherapy, OT, speech", "category": "functional", "priority": "high"},
            {"title": "Pressure sore prevention  --  regular repositioning", "category": "safety", "priority": "high"},
            {"title": "Depression screening and treatment (very common post-stroke)", "category": "psychological", "priority": "high"},
            {"title": "Family education on stroke recovery and long-term support", "category": "family", "priority": "medium"},
        ],
        "standard_interventions": [
            {"name": "Swallowing screen before any oral intake", "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Pressure area care  --  2-hourly repositioning", "category": "therapy", "frequency": "daily", "role": "nurse"},
            {"name": "Physiotherapy  --  mobility and function", "category": "therapy", "frequency": "daily", "role": "clinician"},
            {"name": "Anticoagulation / antiplatelet medication check", "category": "medication", "frequency": "daily", "role": "clinician"},
            {"name": "PHQ-9 depression screen", "category": "monitoring", "frequency": "monthly", "role": "clinician"},
        ],
        "red_flags": ["sudden new neurological deficit","severe headache","aspiration","unable to protect airway","fever+confusion"],
        "monitoring_schedule": "Neurological obs hourly (acute), swallowing before each meal, pressure areas daily",
        "guide_sections": []
    },

    "general_palliative": {
        "keywords": [],
        "priority_symptoms": ["pain","fatigue","breathlessness","nausea","anxiety","depression"],
        "key_goals": [
            {"title": "Achieve adequate pain and symptom control", "category": "pain", "priority": "critical"},
            {"title": "Support patient psychological wellbeing", "category": "psychological", "priority": "high"},
            {"title": "Engage family in care planning and provide support", "category": "family", "priority": "high"},
            {"title": "Address spiritual and cultural care needs", "category": "spiritual", "priority": "medium"},
            {"title": "Document advance care plan and patient wishes", "category": "safety", "priority": "medium"},
            {"title": "Optimise nutritional status and comfort", "category": "nutrition", "priority": "medium"},
        ],
        "standard_interventions": [
            {"name": "ESAS symptom assessment", "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "PPS functional assessment", "category": "monitoring", "frequency": "weekly", "role": "clinician"},
            {"name": "Medication review and optimisation", "category": "medication", "frequency": "weekly", "role": "clinician"},
            {"name": "Psychosocial support", "category": "therapy", "frequency": "weekly", "role": "clinician"},
            {"name": "Spiritual and cultural care needs", "category": "therapy", "frequency": "weekly", "role": "clinician"},
        ],
        "red_flags": ["uncontrolled pain","acute breathlessness","confusion","bleeding","fever"],
        "monitoring_schedule": "ESAS daily, PPS weekly, vital signs daily",
        "guide_sections": [
            {
                "title": "General Palliative Care  --  Core Principles",
                "priority": "high",
                "content": """**The Four Domains of Palliative Care:**

**Physical:**
- Proactive symptom assessment at every visit (ESAS)
- Pain management on WHO analgesic ladder
- Treat constipation alongside every opioid prescription
- Breathlessness: positioning, fan, low-dose opioids, anxiolytics
- Nausea: identify cause, treat appropriately

**Psychological:**
- Screen for depression (PHQ-9) and anxiety (GAD-7)
- Active listening and therapeutic presence
- Address fears about death, pain, being a burden
- Counselling referral if PHQ-9 ≥ 10 or GAD-7 ≥ 10

**Social/Family:**
- Assess caregiver burden  --  offer respite care
- Clear, honest communication with family about prognosis
- Social worker referral for practical needs
- Community support and home care coordination

**Spiritual:**
- Ask about spiritual/religious needs at first visit
- Chaplaincy referral if requested
- Respect cultural practices and death rituals
- Facilitate legacy work  --  memory vault, letters to family"""
            },
        ]
    }
}


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2  --  PATIENT DATA ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def detect_disease_profile(diagnosis: str) -> Tuple[str, Dict]:
    """Match diagnosis text to a disease profile  --  DB first, then fallback to hardcoded."""
    if not diagnosis:
        return "general_palliative", DISEASE_PROFILES["general_palliative"]
    diag_lower = diagnosis.lower()

    # Check hardcoded profiles first (have full guide_sections)
    for profile_name, profile in DISEASE_PROFILES.items():
        if profile_name == "general_palliative":
            continue
        if any(kw in diag_lower for kw in profile["keywords"]):
            return profile_name, profile

    # Try DB for conditions not in hardcoded profiles
    try:
        import sys, json as _j
        from pathlib import Path
        bp = Path(__file__).parent.parent
        if str(bp) not in sys.path:
            sys.path.insert(0, str(bp))
        from src.db import SessionLocal, ConditionCareTemplate
        db = SessionLocal()
        try:
            templates = db.query(ConditionCareTemplate).all()
            best, best_score = None, 0
            for t in templates:
                kws = _j.loads(t.condition_keywords or "[]")
                score = sum(1 for kw in kws if kw.lower() in diag_lower)
                if t.condition_name.lower() in diag_lower:
                    score += 4
                if score > best_score:
                    best_score, best = score, t
            if best and best_score > 0:
                # Build a profile dict from DB record
                db_profile = dict(DISEASE_PROFILES["general_palliative"])  # base
                db_profile["keywords"] = _j.loads(best.condition_keywords or "[]")
                db_profile["name"] = best.condition_name
                db_profile["monitoring_schedule"] = "ESAS daily, PPS weekly, vitals daily"
                # Pull goals from DB
                goals_text = best.goals_of_care or ""
                db_goals = []
                for line in goals_text.split('\n'):
                    line = line.strip()
                    if line and (line[0].isdigit() or line.startswith('-') or line.startswith('-')):
                        title = line.lstrip('0123456789.--. ').strip()
                        if 10 < len(title) < 250:
                            cat = "symptom"
                            for kw, cat_name in [("pain","pain"),("psych","psychological"),("spirit","spiritual"),
                                                   ("famil","family"),("nutri","nutrition"),("safe","safety"),
                                                   ("medic","medication"),("function","functional")]:
                                if kw in title.lower():
                                    cat = cat_name
                                    break
                            db_goals.append({"title": title, "category": cat, "priority": "high"})
                db_profile["key_goals"] = db_goals[:8] or DISEASE_PROFILES["general_palliative"]["key_goals"]
                db_profile["red_flags"] = _j.loads(best.red_flag_symptoms or "[]")
                # Add a guide section from pain plan
                db_profile["guide_sections"] = []
                if best.pain_management_plan:
                    db_profile["guide_sections"].append({
                        "title": f"Pain & Symptom Management  --  {best.condition_name}",
                        "priority": "high",
                        "content": best.pain_management_plan
                    })
                if best.psychological_support:
                    db_profile["guide_sections"].append({
                        "title": "Psychological Support",
                        "priority": "high",
                        "content": best.psychological_support
                    })
                if best.spiritual_care:
                    db_profile["guide_sections"].append({
                        "title": "Spiritual & Cultural Care",
                        "priority": "medium",
                        "content": best.spiritual_care
                    })
                if best.family_support_plan:
                    db_profile["guide_sections"].append({
                        "title": "Family & Caregiver Support",
                        "priority": "medium",
                        "content": best.family_support_plan
                    })
                return best.condition_name.lower().replace(" ", "_"), db_profile
        finally:
            db.close()
    except Exception:
        pass

    return "general_palliative", DISEASE_PROFILES["general_palliative"]


def determine_care_phase(patient_data: Dict) -> str:
    """
    Determine care phase from patient data.
    Returns: stable | unstable | deteriorating | terminal | end_of_life
    """
    pps = patient_data.get("pps_score")
    risk = patient_data.get("risk_score", 0.0) or 0.0
    esas_total = patient_data.get("esas_total", 0) or 0
    status = patient_data.get("status", "active")

    if status in ("deceased", "death"):
        return "end_of_life"

    if pps is not None:
        if pps <= 20:
            return "end_of_life"
        if pps <= 40:
            return "terminal"
        if pps <= 60:
            return "deteriorating"
        if pps <= 70:
            return "unstable"

    if risk >= 0.75:
        return "terminal"
    if risk >= 0.55:
        return "deteriorating"
    if risk >= 0.35:
        return "unstable"

    if esas_total >= 60:
        return "deteriorating"
    if esas_total >= 40:
        return "unstable"

    return "stable"


def analyse_patient_data(patient_data: Dict) -> Dict:
    """
    Analyse all patient data and return structured insight dict.
    patient_data keys (all optional):
        diagnosis, age, gender, risk_score, status
        pps_score (latest PPS)
        esas_pain, esas_tiredness, esas_nausea, esas_depression,
        esas_anxiety, esas_shortness_of_breath, esas_wellbeing,
        esas_drowsiness, esas_lack_of_appetite
        phq9_total, phq9_severity
        gad7_total, gad7_severity
        mmse_total, moca_total, cognitive_interpretation
        barthel_total
        pain_worst, pain_average
        caregiver_burden_total
        active_medications (list of str)
        latest_vitals (dict: heart_rate, bp_sys, o2_sat, temp, resp_rate)
        preferences (dict from patient questionnaire)
    """
    insights = {
        "critical_flags": [],
        "high_priority_concerns": [],
        "medium_concerns": [],
        "strengths": [],
        "tailored_goal_adjustments": [],
        "intervention_additions": [],
        "monitoring_flags": [],
    }

    esas_pain  = patient_data.get("esas_pain") or 0
    esas_anx   = patient_data.get("esas_anxiety") or 0
    esas_dep   = patient_data.get("esas_depression") or 0
    esas_sob   = patient_data.get("esas_shortness_of_breath") or 0
    esas_naus  = patient_data.get("esas_nausea") or 0
    esas_tired = patient_data.get("esas_tiredness") or 0
    esas_well  = patient_data.get("esas_wellbeing") or 5
    esas_app   = patient_data.get("esas_lack_of_appetite") or 0
    esas_total = sum([esas_pain, esas_anx, esas_dep, esas_sob,
                      esas_naus, esas_tired, esas_well, esas_app])

    phq9  = patient_data.get("phq9_total") or 0
    gad7  = patient_data.get("gad7_total") or 0
    mmse  = patient_data.get("mmse_total")
    moca  = patient_data.get("moca_total")
    brthl = patient_data.get("barthel_total")
    careb = patient_data.get("caregiver_burden_total") or 0
    pps   = patient_data.get("pps_score")
    pain_w = patient_data.get("pain_worst") or esas_pain

    vitals = patient_data.get("latest_vitals") or {}
    o2    = vitals.get("o2_sat") or vitals.get("oxygen_saturation")
    hr    = vitals.get("heart_rate")
    temp  = vitals.get("temperature")
    bp    = vitals.get("blood_pressure_sys")

    # ── Critical flags ────────────────────────────────────────────────────
    if pain_w >= 7:
        insights["critical_flags"].append(
            f"Severe pain reported (score {pain_w}/10)  --  escalate analgesia NOW per WHO ladder"
        )
    if esas_sob >= 7:
        insights["critical_flags"].append(
            f"Severe breathlessness (ESAS {esas_sob}/10)  --  urgent respiratory assessment needed"
        )
    if o2 and o2 < 88:
        insights["critical_flags"].append(
            f"O2 saturation critically low ({o2}%)  --  immediate oxygen therapy required"
        )
    if temp and temp > 38.5:
        insights["critical_flags"].append(
            f"Fever ({temp}°C)  --  assess for infection, especially if on immunosuppressants"
        )
    if phq9 >= 15:
        insights["critical_flags"].append(
            f"Severe depression (PHQ-9 = {phq9}/27)  --  urgent psychiatric/counselling referral"
        )
    if patient_data.get("phq9_harm_item", 0) >= 1:
        insights["critical_flags"].append(
            "PHQ-9 item 9 positive  --  patient endorsing thoughts of self-harm  --  CRISIS ASSESSMENT REQUIRED"
        )

    # ── High-priority concerns ────────────────────────────────────────────
    if esas_pain >= 4:
        insights["high_priority_concerns"].append(
            f"Moderate pain (ESAS {esas_pain}/10)  --  review current analgesia and titrate"
        )
    if esas_anx >= 7:
        insights["high_priority_concerns"].append(
            f"Significant anxiety (ESAS {esas_anx}/10, GAD-7 {gad7})  --  psychological support + consider pharmacotherapy"
        )
    if esas_dep >= 7 or phq9 >= 10:
        insights["high_priority_concerns"].append(
            f"Moderate-severe depression (ESAS dep {esas_dep}/10, PHQ-9 {phq9})  --  antidepressant + counselling"
        )
    if esas_naus >= 5:
        insights["high_priority_concerns"].append(
            f"Significant nausea (ESAS {esas_naus}/10)  --  review anti-emetics and diet"
        )
    if esas_app >= 6:
        insights["high_priority_concerns"].append(
            f"Poor appetite (ESAS {esas_app}/10)  --  nutritional assessment and support required"
        )
    if careb >= 25:
        insights["high_priority_concerns"].append(
            f"High caregiver burden (Zarit {careb})  --  arrange respite care and caregiver support urgently"
        )
    if mmse is not None and mmse < 20:
        insights["high_priority_concerns"].append(
            f"Significant cognitive impairment (MMSE {mmse}/30)  --  safety review, advance care planning, caregiver support"
        )
    if moca is not None and moca < 20:
        insights["high_priority_concerns"].append(
            f"Significant cognitive impairment (MoCA {moca}/30)  --  consider dementia care pathway"
        )
    if brthl is not None and brthl < 40:
        insights["high_priority_concerns"].append(
            f"Severe functional dependency (Barthel {brthl}/100)  --  occupational therapy + community care package needed"
        )
    if pps is not None and pps <= 40:
        insights["high_priority_concerns"].append(
            f"Low functional status (PPS {pps}%)  --  consider advanced care planning conversation"
        )
    if hr and (hr > 110 or hr < 50):
        insights["high_priority_concerns"].append(
            f"Abnormal heart rate ({hr} bpm)  --  cardiac assessment recommended"
        )
    if bp and bp > 160:
        insights["high_priority_concerns"].append(
            f"Hypertension (systolic {bp} mmHg)  --  review antihypertensive medications"
        )

    # ── Medium concerns ───────────────────────────────────────────────────
    if esas_tired >= 6:
        insights["medium_concerns"].append(
            f"Significant fatigue (ESAS {esas_tired}/10)  --  energy conservation strategies, review haemoglobin"
        )
    if gad7 >= 7 and esas_anx < 7:
        insights["medium_concerns"].append(
            f"Moderate anxiety (GAD-7 {gad7})  --  relaxation techniques, consider counselling"
        )
    if brthl is not None and 40 <= brthl < 60:
        insights["medium_concerns"].append(
            f"Moderate functional dependency (Barthel {brthl}/100)  --  physiotherapy review"
        )
    if esas_well >= 6:
        insights["medium_concerns"].append(
            f"Poor overall wellbeing (ESAS {esas_well}/10)  --  holistic care review needed"
        )

    # ── Strengths ──────────────────────────────────────────────────────────
    if pain_w <= 3 and esas_pain <= 3:
        insights["strengths"].append("Pain currently well-controlled  --  maintain current regimen")
    if phq9 < 10 and esas_dep < 4:
        insights["strengths"].append("No significant depression identified  --  continue monitoring")
    if pps and pps >= 70:
        insights["strengths"].append(f"Good functional status (PPS {pps}%)  --  encourage appropriate activity")
    if brthl and brthl >= 80:
        insights["strengths"].append(f"High functional independence (Barthel {brthl}/100)")

    # ── Tailored goal adjustments ──────────────────────────────────────────
    if esas_pain >= 7:
        insights["tailored_goal_adjustments"].append(
            "Pain goal priority: UPGRADE TO CRITICAL  --  active WHO Step 3 escalation required"
        )
    if careb >= 17:
        insights["tailored_goal_adjustments"].append(
            "Add explicit caregiver burnout goal  --  Zarit score indicates significant burden"
        )
    if mmse is not None and mmse < 24:
        insights["tailored_goal_adjustments"].append(
            "Add cognitive safety goal  --  patient has memory impairment requiring safety assessment"
        )

    # ── Intervention additions ──────────────────────────────────────────────
    if phq9 >= 10 or esas_dep >= 7:
        insights["intervention_additions"].append({
            "name": "Antidepressant initiation and counselling",
            "category": "medication",
            "frequency": "weekly review",
            "role": "clinician"
        })
    if careb >= 25:
        insights["intervention_additions"].append({
            "name": "Caregiver respite care arrangement",
            "category": "referral",
            "frequency": "immediate",
            "role": "clinician"
        })
    if gad7 >= 10 or esas_anx >= 7:
        insights["intervention_additions"].append({
            "name": "Anxiety management: pharmacological + therapeutic",
            "category": "therapy",
            "frequency": "weekly",
            "role": "clinician"
        })
    if esas_naus >= 5:
        insights["intervention_additions"].append({
            "name": "Anti-emetic optimisation and nutritional review",
            "category": "medication",
            "frequency": "daily",
            "role": "clinician"
        })

    # ── Monitoring flags ───────────────────────────────────────────────────
    if esas_pain >= 4:
        insights["monitoring_flags"].append("Pain: reassess with NRS at every clinical contact")
    if o2 and o2 < 92:
        insights["monitoring_flags"].append(f"O2 saturation: monitor 4-hourly (currently {o2}%)")
    if temp and temp > 37.5:
        insights["monitoring_flags"].append(f"Temperature: 4-hourly monitoring (currently {temp}°C)")

    return insights


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3  --  CARE PLAN GENERATOR
# ═══════════════════════════════════════════════════════════════════════════

def generate_care_plan_content(
    patient_data: Dict,
    disease_profile_name: str,
    disease_profile: Dict,
    care_phase: str,
    insights: Dict,
) -> Dict:
    """
    Generate full care plan text content for all CarePlan fields.
    Returns dict matching CarePlan model fields.
    """
    diag = patient_data.get("diagnosis", "Not specified")
    name = patient_data.get("full_name", "Patient")
    age  = patient_data.get("age", "")
    pps  = patient_data.get("pps_score")
    phq9 = patient_data.get("phq9_total") or 0
    gad7 = patient_data.get("gad7_total") or 0
    esas_pain = patient_data.get("esas_pain") or 0

    phase_text = {
        "stable": "Phase 1  --  Stable: disease controlled, maintaining quality of life",
        "unstable": "Phase 2  --  Unstable: active symptom burden, needs close monitoring",
        "deteriorating": "Phase 3  --  Deteriorating: progressive disease, increasing needs",
        "terminal": "Phase 4  --  Terminal: days to weeks, comfort-focused care",
        "end_of_life": "Phase 5  --  End of Life: hours to days, intensive comfort care",
    }[care_phase]

    critical = "\n".join(f"- ⚠️ {f}" for f in insights.get("critical_flags", []))
    high     = "\n".join(f"- {f}" for f in insights.get("high_priority_concerns", []))
    medium   = "\n".join(f"- {f}" for f in insights.get("medium_concerns", []))
    strengths = "\n".join(f"- ✓ {f}" for f in insights.get("strengths", []))

    goals_of_care = f"""**Patient:** {name}{f', Age {age}' if age else ''}
**Diagnosis:** {diag}
**Disease Profile:** {disease_profile_name.replace('_', ' ').title()}
**Current Phase:** {phase_text}
{f'**Functional Status:** PPS {pps}%' if pps else ''}

**Primary Goals of Care:**
{chr(10).join(f'{i+1}. {g["title"]}' for i, g in enumerate(disease_profile.get("key_goals", [])[:5]))}

**AI-Identified Priorities (from assessment data):**
{f'{chr(10)}CRITICAL ISSUES:{chr(10)}{critical}' if critical else ''}
{f'{chr(10)}High Priority:{chr(10)}{high}' if high else ''}
{f'{chr(10)}Monitoring Points:{chr(10)}{medium}' if medium else ''}
{f'{chr(10)}Current Strengths:{chr(10)}{strengths}' if strengths else ''}

**Monitoring Schedule:** {disease_profile.get('monitoring_schedule', 'ESAS daily, PPS weekly')}
"""

    pain_management = f"""**Pain Management Plan  --  {diag}**

**Current Pain Assessment:**
- ESAS Pain Score: {esas_pain}/10
- Pain Level: {'Severe (NRS 7-10)' if esas_pain >= 7 else 'Moderate (NRS 4-6)' if esas_pain >= 4 else 'Mild (NRS 1-3)' if esas_pain >= 1 else 'None/minimal'}

**WHO Analgesic Ladder  --  Current Step:**
{'Step 3: Strong opioids required  --  morphine or equivalent' if esas_pain >= 7 else 'Step 2: Weak opioids appropriate  --  tramadol/codeine' if esas_pain >= 4 else 'Step 1: Non-opioids sufficient  --  paracetamol/NSAIDs'}

**Management Approach:**
- Scheduled analgesia (by the clock)  --  not PRN for chronic pain
- Breakthrough analgesia: 1/6 of total daily opioid dose
- Reassess pain at every contact with NRS score
- {'URGENT: Escalate analgesia immediately' if esas_pain >= 7 else 'Review current medications and titrate within 48 hours' if esas_pain >= 4 else 'Maintain current regimen with regular monitoring'}
- Always prescribe laxative alongside opioids
- Document location, character, timing, and modifying factors

**Non-Pharmacological:**
- Positioning and support for comfort
- Heat/cold therapy as appropriate
- Relaxation and distraction techniques
- Address emotional component of total pain
"""

    phq9_sev = "Severe" if phq9 >= 20 else "Moderately Severe" if phq9 >= 15 else "Moderate" if phq9 >= 10 else "Mild" if phq9 >= 5 else "Minimal"
    gad7_sev = "Severe" if gad7 >= 15 else "Moderate" if gad7 >= 10 else "Mild" if gad7 >= 5 else "Minimal"

    psychological = f"""**Psychological Support Plan**

**Current Mental Health Assessment:**
- PHQ-9 Depression Score: {phq9}/27 ({phq9_sev})
- GAD-7 Anxiety Score: {gad7}/21 ({gad7_sev})

**Treatment Plan:**
{f'- IMMEDIATE: Antidepressant initiation recommended + urgent counselling referral' if phq9 >= 15 else f'- Counselling referral and consider antidepressant (sertraline 50mg morning)' if phq9 >= 10 else '- Regular psychological check-ins; no pharmacotherapy currently required'}
{f'- Anxiety pharmacotherapy: consider lorazepam PRN or pregabalin' if gad7 >= 10 else '- Teach relaxation techniques (4-7-8 breathing, grounding)' if gad7 >= 5 else ''}

**Psychosocial Interventions:**
- Active listening and therapeutic presence at every visit
- Validate and normalise emotional responses to illness
- Screen for adjustment disorder vs. clinical depression
- Explore existential and spiritual concerns
- Facilitate end-of-life conversations sensitively
- Assess for caregiver distress and family dynamics

**Community Resources:**
- Mental Health Authority Ghana: 0800-111-011
- Support groups for patient's diagnosis
- Chaplaincy and spiritual care if requested
"""

    spiritual = f"""**Spiritual and Cultural Care Plan**

**Patient Background:**
- Religious preference: {patient_data.get('religious_preference', 'Not specified')}
- Language preference: {patient_data.get('language', 'English')}

**Spiritual Care:**
- Conduct spiritual needs assessment at care plan initiation
- Facilitate access to patient's own religious leader (pastor, imam, etc.)
- Chaplaincy referral if requested or if patient has unmet spiritual needs
- Support legacy work: Memory Vault, legacy messages to family
- Facilitate life review and reminiscence
- Explore questions of meaning, hope, forgiveness, and legacy

**Cultural Considerations (Ghana context):**
- Respect and involve extended family in care decisions
- Accommodate traditional beliefs and practices  --  discuss safety with care team
- Support preferred location of care and death (home vs. facility)
- Respect cultural death rites and mourning practices
- Communicate prognosis sensitively, culturally appropriate pacing
- Offer interpretation services if English is not first language

**Goals:**
- Patient feels spiritually supported and at peace
- Cultural values are integrated into care plan
- Family feels honoured and included in the care journey
"""

    spiritual_care = spiritual

    family_support = f"""**Family and Caregiver Support Plan**

**Caregiver Burden:** {'HIGH  --  Zarit score ' + str(patient_data.get('caregiver_burden_total', 0)) + '  --  URGENT respite care needed' if (patient_data.get('caregiver_burden_total') or 0) >= 25 else 'Moderate  --  monitor and provide support' if (patient_data.get('caregiver_burden_total') or 0) >= 17 else 'Currently manageable  --  continue monitoring'}

**Key Actions:**
- Family meeting within first week of palliative care involvement
- Identify primary family caregiver and assess their capacity and burden
- {'Arrange formal respite care immediately' if (patient_data.get('caregiver_burden_total') or 0) >= 25 else 'Educate family on available respite care options'}
- Provide clear, honest, compassionate communication about disease trajectory
- Involve family in care planning and decision-making appropriately
- Identify family members needing psychological support

**Caregiver Education:**
- Disease-specific education for the diagnosis ({diag})
- Signs and symptoms requiring urgent medical attention
- Medication management and administration
- Personal care and infection prevention
- When and how to seek emergency help

**Anticipatory Grief Support:**
- Acknowledge family is experiencing anticipatory grief
- Bereavement counselling referral if significant distress
- Plan for post-death bereavement support (schedule contact at 1 week, 1 month, 3 months)
- Connect with support groups for carers of patients with this diagnosis
"""

    advance_notes = f"""**Advance Care Planning Notes**

**Current Status:**
- Advance directive documented: {patient_data.get('advance_directive', False)}
- DNR/DNAR order: {patient_data.get('dnr_status', False)}

**Care Phase:** {phase_text}

**Key Decisions to Document:**
- Patient's goals of care (cure, life prolongation, or comfort-focused)
- Preferred place of care (home, facility, hospital)
- Preferred place of death
- Specific treatments the patient wants or does not want
- Who should make decisions if patient loses capacity (healthcare proxy)

**Next Steps:**
{'- URGENT: Advance care planning conversation needed  --  patient in terminal/end-of-life phase' if care_phase in ('terminal', 'end_of_life') else '- Schedule formal advance care planning conversation within next 2 weeks'}
- Document in patient record after discussion
- Review at every significant clinical change
- Ensure family and care team are all aware of documented wishes
- Review DNAR status  --  document clearly and display appropriately
"""

    bereavement = f"""**Bereavement and End-of-Life Support Plan**

**Current Phase:** {phase_text}

**For Patient:**
- Life review and legacy work facilitated (Memory Vault, letters to loved ones)
- Spiritual and existential concerns addressed
- Final wishes and preferences documented
- Ensure patient feels valued, loved, and not alone
- Dignity in care  --  privacy, comfort, familiar environment

**For Family:**
- Pre-bereavement counselling offered
- Family briefed on signs of approaching death
- Ensure family can be present at end of life if that is the wish
- Chaplain or spiritual leader arranged if requested
- Practical guidance on what to do when death occurs

**Post-Death Support Schedule:**
- Day 1: Condolences and immediate practical support
- Week 1: Bereavement screening invitation (PG-13 questionnaire)
- Month 1: Follow-up call and support group introduction
- Month 3: Complicated grief assessment if indicated
- Month 6: Long-term bereavement support review

**Referrals:**
- Bereavement counselling services
- Support groups for bereaved family members
- Mental Health Authority Ghana: 0800-111-011
"""

    return {
        "goals_of_care": goals_of_care.strip(),
        "pain_management_plan": pain_management.strip(),
        "psychological_support": psychological.strip(),
        "spiritual_care": spiritual_care.strip(),
        "family_support_plan": family_support.strip(),
        "advance_directives_notes": advance_notes.strip(),
        "bereavement_plan": bereavement.strip(),
        "care_phase": care_phase,
        "disease_profile": disease_profile_name,
        "overall_notes": _build_overall_notes(patient_data, care_phase, disease_profile_name)
    }


def _build_overall_notes(patient_data: Dict, care_phase: str, disease_profile_name: str) -> str:
    """Build overall_notes including care setting context if available."""
    base = (
        f"AI-generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC. "
        f"Based on ESAS, PPS, PHQ-9, GAD-7, vitals, medications. "
        f"Review at every clinical change."
    )
    setting = patient_data.get("care_setting")
    if not setting:
        return base

    setting_note = (
        f"\n\n**Care Delivery Setting: {setting['label']}**\n"
        f"- Focus: {setting['focus']}\n"
    )
    if setting.get("facility"):
        setting_note += f"- Facility: {setting['facility']}\n"
    if setting.get("visit_frequency"):
        setting_note += f"- Visit frequency: {setting['visit_frequency']}\n"
    if setting.get("outcome_focus"):
        setting_note += f"- Outcome goal: {setting['outcome_focus']}\n"

    # Setting-specific care plan adjustments
    adjustments = _care_setting_plan_adjustments(setting["key"], care_phase)
    if adjustments:
        setting_note += f"\n**Setting-Specific Guidance:**\n{adjustments}"

    return base + setting_note


def _care_setting_plan_adjustments(setting_key: str, care_phase: str) -> str:
    """
    Returns setting-specific care plan guidance text.
    Each of the 5 settings has distinct priorities that shape care delivery.
    """
    adjustments = {
        "hospital_based": (
            "- Acute symptom management is the priority  --  aggressive titration is appropriate\n"
            "- Daily goals-of-care discussion with family given hospital admission context\n"
            "- Focus on stabilisation then transition planning to appropriate community setting\n"
            "- Ensure all discharge medications are prescribed, dispensed, and patient/carer educated\n"
            "- Infection prevention: hand hygiene, sterile technique, visitor restrictions if immunocompromised\n"
            "- Coordinate with ward team, social worker, and discharge planner daily"
        ),
        "hospice": (
            "- ALL interventions should be comfort-directed  --  curative treatments are no longer appropriate\n"
            "- Discontinue non-essential medications; retain only those that relieve symptoms\n"
            "- 24/7 symptom support must be available; anticipatory medications should be prescribed\n"
            "- Family bereavement preparation is as important as patient care at this stage\n"
            "- Document preferred place of death and ensure it is achievable\n"
            "- Legacy work (Memory Vault, letters) should be actively supported if patient has capacity"
        ),
        "home_based": (
            "- Family caregiver capability must be assessed and education provided at every visit\n"
            "- Community pharmacy coordination is essential  --  ensure supply of all PRN medications\n"
            "- Clear escalation pathway: patient/carer must know when and how to call for help\n"
            "- Environmental safety assessment on first home visit (falls risk, medication storage)\n"
            "- Remote symptom monitoring between visits using patient-reported ESAS via the app\n"
            "- Coordinate with community pharmacist for medication blister packs if complex regimen"
        ),
        "outpatient_clinic": (
            "- Use each clinic appointment to conduct ESAS, PPS, and mental health screening\n"
            "- Medication review at every visit  --  compare against last visit and titrate accordingly\n"
            "- Provide written summary of appointment and any medication changes to patient\n"
            "- Ensure referrals to physiotherapy, dietetics, psychology are actioned between visits\n"
            "- Patient education materials should be provided at each visit (use Resources section)\n"
            "- Confirm next appointment timing and set clear threshold for unscheduled contact"
        ),
        "long_term_residential": (
            "- Monthly multidisciplinary review of care plan is minimum standard\n"
            "- Barthel Index and cognitive assessment should be repeated every 3 months\n"
            "- Ensure care home staff are trained in palliative care principles\n"
            "- Personal care and dignity are as clinically important as medication management\n"
            "- Family communication should be structured  --  written updates and regular meetings\n"
            "- Quality of life assessments (FACT-G) should guide activity and social engagement planning"
        ),
    }
    phase_add = ""
    if care_phase in ("terminal", "end_of_life") and setting_key != "hospice":
        phase_add = (
            f"\n⚠️ Patient is in {care_phase.replace('_', ' ')} phase in a {setting_key.replace('_', ' ')} setting  --  "
            "consider whether transition to hospice care is appropriate and discuss with patient and family."
        )
    return adjustments.get(setting_key, "") + phase_add


def generate_goals(
    disease_profile: Dict,
    insights: Dict,
    care_phase: str,
    existing_goal_titles: List[str] = None,
) -> List[Dict]:
    """Generate a list of goal dicts for this patient."""
    existing = set(t.lower() for t in (existing_goal_titles or []))
    goals = []

    phase_priority_boost = care_phase in ("terminal", "end_of_life", "deteriorating")

    for g in disease_profile.get("key_goals", []):
        if g["title"].lower() in existing:
            continue
        priority = g["priority"]
        if phase_priority_boost and priority == "medium":
            priority = "high"
        goals.append({
            "title": g["title"],
            "category": g["category"],
            "priority": priority,
            "status": "pending",
            "progress": 0,
            "ai_suggested": True,
            "description": f"Auto-generated from {disease_profile.get('disease_profile_name', 'disease profile')} template for {care_phase} phase.",
        })

    # Add insight-based goals
    for adj in insights.get("tailored_goal_adjustments", []):
        if adj.lower() not in existing:
            goals.append({
                "title": adj[:200],
                "category": "monitoring",
                "priority": "high",
                "status": "pending",
                "progress": 0,
                "ai_suggested": True,
                "description": "Generated from analysis of patient assessment data.",
            })

    return goals[:10]  # cap at 10 auto goals


def generate_checklists(goal_title: str, goal_category: str, care_phase: str) -> List[Dict]:
    """Generate daily/weekly checklist items for a given goal."""
    checklists_by_category = {
        "pain": [
            {"task": "Assess pain level using NRS (0-10) and document", "frequency": "daily"},
            {"task": "Administer scheduled analgesia as prescribed", "frequency": "daily"},
            {"task": "Check for breakthrough pain and administer PRN dose if needed", "frequency": "daily"},
            {"task": "Assess for constipation (mandatory alongside opioids)", "frequency": "daily"},
            {"task": "Non-pharmacological pain measure (positioning, heat/cold)", "frequency": "daily"},
            {"task": "Review pain control adequacy  --  escalate if NRS > 3", "frequency": "weekly"},
        ],
        "symptom": [
            {"task": "Complete ESAS symptom assessment", "frequency": "daily"},
            {"task": "Administer anti-nausea medication if nausea score ≥ 4", "frequency": "daily"},
            {"task": "Monitor breathlessness and positioning", "frequency": "daily"},
            {"task": "Assess and document any new or worsening symptoms", "frequency": "daily"},
            {"task": "Review anti-emetic effectiveness", "frequency": "weekly"},
        ],
        "functional": [
            {"task": "Assess mobility and ability to perform ADLs", "frequency": "daily"},
            {"task": "Encourage safe level of activity appropriate to current ability", "frequency": "daily"},
            {"task": "Ensure walking aids are available and used", "frequency": "daily"},
            {"task": "Physiotherapy exercise programme (if prescribed)", "frequency": "daily"},
            {"task": "Barthel Index reassessment", "frequency": "weekly"},
            {"task": "Falls risk review", "frequency": "weekly"},
        ],
        "psychological": [
            {"task": "Therapeutic check-in  --  ask how patient is feeling emotionally", "frequency": "daily"},
            {"task": "Administer antidepressant/anxiolytic as prescribed", "frequency": "daily"},
            {"task": "Relaxation technique (breathing, mindfulness)", "frequency": "daily"},
            {"task": "PHQ-9 reassessment", "frequency": "weekly"},
            {"task": "GAD-7 reassessment", "frequency": "weekly"},
            {"task": "Counselling session (if arranged)", "frequency": "weekly"},
        ],
        "nutrition": [
            {"task": "Record food and fluid intake", "frequency": "daily"},
            {"task": "Offer small frequent meals / preferred foods", "frequency": "daily"},
            {"task": "Weigh patient (same time, same scale)", "frequency": "daily"},
            {"task": "Nutritional supplement as prescribed", "frequency": "daily"},
            {"task": "Review nutritional status and intake adequacy", "frequency": "weekly"},
        ],
        "medication": [
            {"task": "Administer all medications at correct times", "frequency": "daily"},
            {"task": "Check for side effects and medication tolerance", "frequency": "daily"},
            {"task": "Review medication list for interactions and appropriateness", "frequency": "weekly"},
            {"task": "Confirm patient / carer understands medication purpose and dosing", "frequency": "weekly"},
        ],
        "monitoring": [
            {"task": "Record vital signs (HR, BP, O2 sat, temperature, RR)", "frequency": "daily"},
            {"task": "ESAS symptom assessment", "frequency": "daily"},
            {"task": "Document clinical observations in notes", "frequency": "daily"},
            {"task": "PPS assessment", "frequency": "weekly"},
            {"task": "Review of all monitoring data with clinician", "frequency": "weekly"},
        ],
        "safety": [
            {"task": "Safety assessment  --  falls risk, wandering, medication access", "frequency": "daily"},
            {"task": "Pressure area check and repositioning every 2 hours if bedbound", "frequency": "daily"},
            {"task": "Ensure emergency contacts are known and accessible", "frequency": "weekly"},
            {"task": "Advance care plan review", "frequency": "monthly"},
        ],
        "family": [
            {"task": "Check in with primary caregiver about their wellbeing", "frequency": "daily"},
            {"task": "Provide family with today's patient status update", "frequency": "daily"},
            {"task": "Zarit Burden Interview (caregiver burden score)", "frequency": "weekly"},
            {"task": "Family support / education session", "frequency": "weekly"},
        ],
        "spiritual": [
            {"task": "Ask patient about spiritual or existential concerns", "frequency": "weekly"},
            {"task": "Facilitate access to spiritual leader / chaplain if requested", "frequency": "weekly"},
            {"task": "Memory Vault / legacy work session", "frequency": "weekly"},
        ],
    }
    items = checklists_by_category.get(goal_category, checklists_by_category["monitoring"])
    if care_phase in ("terminal", "end_of_life"):
        items = [i for i in items if i["frequency"] == "daily"]
    return items


def generate_interventions(
    disease_profile: Dict,
    insights: Dict,
    care_phase: str,
    existing_names: List[str] = None,
) -> List[Dict]:
    """Generate intervention dicts for the care plan."""
    existing = set(n.lower() for n in (existing_names or []))
    interventions = []

    for iv in disease_profile.get("standard_interventions", []):
        if iv["name"].lower() in existing:
            continue
        interventions.append({
            "name": iv["name"],
            "category": iv["category"],
            "frequency": iv["frequency"],
            "responsible_role": iv["role"],
            "status": "active",
            "ai_suggested": True,
            "description": f"Standard intervention for {care_phase} phase {disease_profile.get('name', 'care')}.",
        })

    for iv in insights.get("intervention_additions", []):
        if iv["name"].lower() not in existing:
            interventions.append({
                "name": iv["name"],
                "category": iv["category"],
                "frequency": iv["frequency"],
                "responsible_role": iv["role"],
                "status": "active",
                "ai_suggested": True,
                "description": "Added based on analysis of current assessment scores.",
            })

    return interventions


# ═══════════════════════════════════════════════════════════════════════════
# SECTION 4  --  FULL PLAN GENERATION (main entry point)
# ═══════════════════════════════════════════════════════════════════════════


def generate_full_care_plan(patient_data: Dict, existing: Dict = None) -> Dict:
    """
    Main entry point. Given all patient data, returns a complete care plan dict.

    patient_data keys (all optional except diagnosis):
      diagnosis, full_name, age, gender, risk_score, status,
      advance_directive, dnr_status, religious_preference, language,
      esas_pain, esas_tiredness, esas_nausea, esas_depression,
      esas_anxiety, esas_shortness_of_breath, esas_wellbeing,
      pps_score, phq9_total, phq9_severity, gad7_total, gad7_severity,
      barthel_total, mmse_total, moca_total, cognitive_interpretation,
      pain_worst, pain_average, caregiver_burden_total,
      latest_vitals, active_medications, preferences,
      care_setting  ← NEW: dict with key/label/focus/facility/...

    Returns dict with keys:
      care_plan_fields, goals, interventions, checklists_per_goal,
      insights, disease_profile, care_phase, confidence,
      guide_sections, monitoring_schedule, red_flags, care_setting
    """
    existing = existing or {}

    disease_name, disease_prof = detect_disease_profile(
        patient_data.get("diagnosis", "")
    )
    care_phase    = determine_care_phase(patient_data)
    insights      = analyse_patient_data(patient_data)
    plan_content  = generate_care_plan_content(
        patient_data, disease_name, disease_prof, care_phase, insights
    )

    existing_goal_titles = [g.get("title", "") for g in existing.get("goals", [])]
    existing_iv_names    = [iv.get("name", "") for iv in existing.get("interventions", [])]

    goals         = generate_goals(disease_prof, insights, care_phase, existing_goal_titles)
    interventions = generate_interventions(disease_prof, insights, care_phase, existing_iv_names)

    # ── Add setting-specific interventions ──────────────────────────────────
    care_setting = patient_data.get("care_setting")
    if care_setting:
        setting_ivs = _setting_specific_interventions(
            care_setting["key"], care_phase, existing_iv_names
        )
        interventions.extend(setting_ivs)

    checklists_per_goal: Dict = {}
    for g in goals:
        checklists_per_goal[g["title"]] = generate_checklists(
            g["title"], g["category"], care_phase
        )
    for g in existing.get("goals", []):
        if g.get("title") not in checklists_per_goal:
            checklists_per_goal[g["title"]] = generate_checklists(
                g.get("title", ""), g.get("category", "monitoring"), care_phase
            )

    # ── Confidence: +1 for each data source present ──────────────────────────
    data_points = sum([
        1 if patient_data.get("esas_pain")         is not None else 0,
        1 if patient_data.get("pps_score")         is not None else 0,
        1 if patient_data.get("phq9_total")        is not None else 0,
        1 if patient_data.get("gad7_total")        is not None else 0,
        1 if patient_data.get("diagnosis")                     else 0,
        1 if patient_data.get("latest_vitals")                 else 0,
        1 if patient_data.get("active_medications")            else 0,
        1 if care_setting                                       else 0,
    ])
    confidence = min(0.95, 0.40 + (data_points * 0.07))

    return {
        "care_plan_fields": {
            **plan_content,
            "ai_generated":    True,
            "ai_generated_at": datetime.utcnow(),
            "ai_confidence":   confidence,
        },
        "goals":               goals,
        "interventions":       interventions,
        "checklists_per_goal": checklists_per_goal,
        "insights":            insights,
        "disease_profile":     disease_name,
        "care_phase":          care_phase,
        "confidence":          confidence,
        "guide_sections":      disease_prof.get("guide_sections", []),
        "monitoring_schedule": disease_prof.get("monitoring_schedule",
                                                "ESAS daily, PPS weekly"),
        "red_flags":           disease_prof.get("red_flags", []),
        "care_setting":        care_setting,
    }


def _setting_specific_interventions(
    setting_key: str, care_phase: str, existing_names: List[str]
) -> List[Dict]:
    """
    Returns additional interventions tailored to the patient's care delivery setting.
    These are on top of disease-profile interventions.
    """
    existing = set(n.lower() for n in existing_names)

    SETTING_INTERVENTIONS: Dict[str, List[Dict]] = {
        "hospital_based": [
            {"name": "Daily goals-of-care discussion (patient & family)", "category": "education",   "frequency": "daily",   "role": "clinician"},
            {"name": "Discharge planning with social worker",             "category": "referral",    "frequency": "daily",   "role": "clinician"},
            {"name": "Ward-based infection prevention protocol",          "category": "monitoring",  "frequency": "daily",   "role": "nurse"},
            {"name": "Acute pain team review if NRS > 6",                 "category": "referral",    "frequency": "as_needed", "role": "clinician"},
        ],
        "hospice": [
            {"name": "Anticipatory medication prescription (syringe driver)", "category": "medication", "frequency": "as_needed", "role": "clinician"},
            {"name": "24-hour symptom support access (on-call nurse)",        "category": "monitoring", "frequency": "daily",   "role": "nurse"},
            {"name": "Bereavement preparation session with family",           "category": "therapy",    "frequency": "weekly",  "role": "clinician"},
            {"name": "Legacy work facilitation (Memory Vault / letters)",     "category": "therapy",    "frequency": "weekly",  "role": "caregiver"},
            {"name": "Chaplaincy / spiritual care visit",                     "category": "therapy",    "frequency": "weekly",  "role": "clinician"},
        ],
        "home_based": [
            {"name": "Home visit  --  symptom assessment & medication review",   "category": "monitoring", "frequency": "weekly",  "role": "nurse"},
            {"name": "Caregiver burden assessment (Zarit) during home visit", "category": "monitoring", "frequency": "monthly", "role": "clinician"},
            {"name": "Home environmental safety assessment",                  "category": "monitoring", "frequency": "monthly", "role": "nurse"},
            {"name": "24-hour telephone support line  --  escalation pathway",   "category": "education",  "frequency": "as_needed", "role": "nurse"},
            {"name": "Patient ESAS self-report via app (remote monitoring)",  "category": "monitoring", "frequency": "daily",   "role": "patient"},
        ],
        "outpatient_clinic": [
            {"name": "Pre-clinic ESAS & PPS assessment",          "category": "monitoring", "frequency": "per_visit", "role": "nurse"},
            {"name": "Medication dose review and adjustment",     "category": "medication", "frequency": "per_visit", "role": "clinician"},
            {"name": "Appointment reminder 24 hours before visit","category": "education",  "frequency": "per_visit", "role": "clinician"},
            {"name": "Written appointment summary provided to patient", "category": "education", "frequency": "per_visit", "role": "nurse"},
        ],
        "long_term_residential": [
            {"name": "Monthly multidisciplinary care plan review",            "category": "monitoring", "frequency": "monthly", "role": "clinician"},
            {"name": "Barthel Index reassessment",                            "category": "monitoring", "frequency": "monthly", "role": "clinician"},
            {"name": "Cognitive assessment (MMSE/MoCA)",                     "category": "monitoring", "frequency": "monthly", "role": "clinician"},
            {"name": "Activity and social engagement programme",              "category": "therapy",    "frequency": "daily",   "role": "caregiver"},
            {"name": "Family structured communication update",                "category": "education",  "frequency": "weekly",  "role": "clinician"},
        ],
    }

    # Add urgency-specific overrides for terminal/end_of_life
    if care_phase in ("terminal", "end_of_life"):
        SETTING_INTERVENTIONS.setdefault(setting_key, []).extend([
            {"name": "Comfort position changes every 2 hours",             "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Mouth care every 4 hours",                           "category": "monitoring", "frequency": "daily", "role": "nurse"},
            {"name": "Family presence facilitation  --  encourage at bedside","category": "education",  "frequency": "daily", "role": "caregiver"},
        ])

    result = []
    for iv in SETTING_INTERVENTIONS.get(setting_key, []):
        if iv["name"].lower() not in existing:
            result.append({
                "name":             iv["name"],
                "category":         iv["category"],
                "frequency":        iv["frequency"],
                "responsible_role": iv["role"],
                "status":           "active",
                "ai_suggested":     True,
                "description":      f"Added for {setting_key.replace('_', ' ')} care setting.",
            })
    return result
