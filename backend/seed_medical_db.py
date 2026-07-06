"""
Palliative Care Medical Knowledge Database Seeder
===================================================
Seeds ConditionCareTemplate table with evidence-based data for 30+ conditions.
Sources: WHO, IAHPC, Oxford Handbook of Palliative Medicine, NHS Guidelines.
Run once: python seed_medical_db.py
"""

import sqlite3
import json
from datetime import datetime

DB_PATH = "aura.db"

CONDITIONS = []

# ═══════════════════════════════════════════════════════════
# CONDITION 1  --  ADVANCED CANCER (General)
# ═══════════════════════════════════════════════════════════
CONDITIONS.append({
    "condition_name": "Advanced Cancer",
    "condition_keywords": json.dumps(["cancer","carcinoma","sarcoma","lymphoma","leukemia","leukaemia","myeloma","malignancy","tumour","tumor","neoplasm","metastatic","metastasis","oncology"]),
    "goals_of_care": """Primary Goals:
1. Achieve and maintain adequate pain control (NRS target ≤3/10)
2. Manage cancer-related symptoms: nausea, fatigue, breathlessness, constipation
3. Maintain functional independence as long as possible
4. Provide psychological support addressing fear, depression, anxiety
5. Support family and caregiver wellbeing
6. Ensure advance care plan documented and respected
7. Address spiritual and existential concerns
8. Optimise nutritional status, manage cancer cachexia

Disease Stages and Goals Shift:
- Early palliative: symptom control alongside curative/life-prolonging treatment
- Supportive: disease-modifying treatment stopped, focus on quality of life
- Terminal (weeks): intensive comfort, family preparation
- End of life (days): comfort only, symptom control, dignity, presence""",

    "pain_management_plan": """WHO Cancer Pain Ladder  --  Apply By The Clock, Not PRN:

STEP 1  --  MILD PAIN (NRS 1-3):
- Paracetamol 1g every 6 hours (max 4g/day)
- NSAIDs: Ibuprofen 400mg TDS with food OR Diclofenac 50mg TDS
- Avoid NSAIDs in: renal impairment, GI bleeding risk, concurrent anticoagulation

STEP 2  --  MODERATE PAIN (NRS 4-6):
- Tramadol 50-100mg every 6 hours (max 400mg/day)
- OR Codeine 30-60mg + Paracetamol every 4-6 hours
- Always add Paracetamol as base at all steps

STEP 3  --  SEVERE PAIN (NRS 7-10):
- Morphine immediate-release 5-10mg every 4 hours oral
- OR Morphine slow-release 10-30mg every 12 hours
- Breakthrough: 1/6 of total daily dose, available every hour PRN
- Titrate by 25-33% every 24-48 hours until controlled
- ALWAYS prescribe laxative with opioids (Senna 2 tabs BD + Lactulose 15ml BD)
- Anti-emetic for first 2 weeks: Haloperidol 0.5-1.5mg nocte or Metoclopramide 10mg TDS

NEUROPATHIC ADD-ON (burning, shooting, electric shock quality):
- First-line: Gabapentin 100mg nocte → titrate to 300mg TDS over 2-3 weeks
- Second-line: Amitriptyline 10-25mg nocte (also helps sleep and depression)
- Pregabalin 75mg BD if gabapentin inadequate

BONE PAIN:
- NSAIDs most effective component
- Dexamethasone 4-8mg morning for inflammatory component
- Refer for bisphosphonate if bone metastases: Zoledronic acid
- Incident pain: give breakthrough 30 min before movement/activity

OPIOID SIDE EFFECTS MANAGEMENT:
- Constipation: Senna + Lactulose prophylactically, never wait
- Nausea: usually settles in 1-2 weeks; Haloperidol 0.5mg most effective
- Drowsiness: usually improves; review if persistent
- Confusion/delirium: consider opioid rotation (morphine → oxycodone → hydromorphone)
- Respiratory depression: only at toxic doses; reassure family

WHEN ORAL ROUTE LOST (last days):
- Syringe driver SC: Morphine 10-20mg/24h + Midazolam 10mg/24h ± Haloperidol 2mg/24h
- Breakthrough: Morphine 2.5-5mg SC PRN every 4 hours""",

    "psychological_support": """PSYCHOLOGICAL ASSESSMENT  --  Screen at Every Visit:
- PHQ-9 for depression (score ≥10 = moderate, treat)
- GAD-7 for anxiety (score ≥10 = moderate, treat)
- Distress thermometer (0-10 scale) rapid screen

DEPRESSION IN CANCER (30-40% prevalence):
- Distinguish from appropriate sadness: anhedonia is key diagnostic symptom
- PHQ-9 ≥10 requires active treatment, not just support
- Antidepressant first-line: Sertraline 50mg morning (low interactions)
- Alternative: Mirtazapine 15mg nocte (also helps appetite, sleep, nausea)
- For prognosis <1 month: Methylphenidate 5mg BD works faster (days not weeks)
- Counselling: Cognitive Behavioural Therapy, Dignity Therapy, narrative therapy

ANXIETY IN CANCER:
- Address controllable fears first: pain management, family plans, finances
- Pharmacological: Lorazepam 0.5-1mg PRN (acute), Pregabalin 75-150mg BD (chronic)
- Psychological: 4-7-8 breathing, mindfulness, progressive muscle relaxation
- Existential anxiety: spiritual care, meaning-making, dignity therapy

ADJUSTMENT DISORDER: Most common; normalise and support; counselling effective

DELIRIUM (20-40% terminal cancer):
- Identify and treat reversible causes: pain, infection, dehydration, urinary retention, opioid toxicity
- Low-dose Haloperidol 0.5-1mg BD; Olanzapine 2.5-5mg nocte alternative
- Maintain safe environment; family reassurance critical
- Sedation only if refractory: Midazolam 2.5-5mg SC PRN""",

    "spiritual_care": """SPIRITUAL NEEDS ASSESSMENT (FICA Tool):
F  --  Faith/Belief: 'Do you have spiritual or religious beliefs that give meaning?'
I  --  Importance: 'How important are these during your illness?'
C  --  Community: 'Are you part of a faith community?'
A  --  Address: 'How should we incorporate this into your care?'

COMMON SPIRITUAL NEEDS IN CANCER:
- Why me?  --  anger at God, loss of faith
- Meaning and purpose  --  'Has my life mattered?'
- Fear of death  --  'Will I suffer?', 'What happens after?'
- Forgiveness  --  relationship reconciliation
- Legacy  --  'What will I leave behind?'
- Hope  --  realistic hope even in terminal illness

INTERVENTIONS:
- Chaplaincy referral  --  trained in all faiths and none
- Dignity Therapy: structured narrative capturing life story, values, legacy
- Life review conversations at every visit
- Legacy work: Memory Vault, letters to family, recorded messages
- Facilitate visits from patient's own pastor/imam/priest

GHANAIAN CULTURAL SPIRITUAL CARE:
- Christianity dominant; prayer, church community central
- Islamic patients: prayer times, halal food, imam visits, Quran
- Traditional spiritual practices  --  respect without judgement
- Extended family spiritual leadership roles
- Ancestral beliefs  --  explore gently if patient raises
- Death preparation customs vary by ethnic group (Akan, Ewe, Ga, Hausa)""",

    "family_support_plan": """FAMILY ASSESSMENT  --  At First Contact:
- Identify primary caregiver and assess capacity/burden (Zarit Burden Interview)
- Map extended family involvement and decision-making hierarchy
- Identify children in household (including dependent adults)
- Assess financial impact and practical support needs

CAREGIVER BURDEN (Zarit Score Interpretation):
- 0-20: Mild burden  --  monitor, provide education
- 21-40: Moderate burden  --  active support, respite care referral
- 41-48: Severe burden  --  urgent intervention, formal care package

FAMILY COMMUNICATION:
- Family meeting within first week of palliative involvement
- Honest, compassionate prognosis discussion
- 'What have you been told?' before launching into information
- Allow time for questions; multiple short conversations better than one long one
- Consistent messaging across all team members

PREPARING FAMILY FOR PATIENT DETERIORATION:
- Teach signs of deterioration specific to cancer type
- Create written action plan: when to call, when to go to hospital, who to call
- Anticipatory medication prescription at home (breakthrough pain kit)
- Discuss preferred place of death early, revisit as approaches

BEREAVEMENT PREPARATION:
- Pre-bereavement counselling if family overwhelmed
- Connect to caregiver support groups
- Schedule post-death contact: day 1, week 1, month 1, month 3""",

    "plain_language_summary": """What to expect with advanced cancer:
Your care team's main job now is keeping you comfortable and supporting your quality of life. This includes controlling pain and other symptoms like nausea, tiredness, and breathlessness. We will work closely with you and your family to make sure your wishes are followed. There are good treatments available for all symptoms  --  you don't have to suffer. Your spiritual, emotional and cultural needs are just as important as your physical ones. Please tell us anything that is worrying you.""",

    "key_symptoms_to_monitor": json.dumps([
        "pain_nrs", "nausea_esas", "fatigue_esas", "breathlessness_esas",
        "appetite_esas", "depression_esas", "anxiety_esas", "wellbeing_esas",
        "constipation", "confusion", "weight_loss", "pps_score",
        "oxygen_saturation", "heart_rate", "temperature"
    ]),
    "red_flag_symptoms": json.dumps([
        "Uncontrolled pain NRS >7 unresponsive to current regimen",
        "Acute breathlessness at rest",
        "Fever >38.5C (possible neutropenic sepsis if on chemotherapy)",
        "Sudden new neurological symptoms (spinal cord compression)",
        "Back pain with leg weakness or bladder/bowel change",
        "Confusion or acute delirium",
        "Active bleeding",
        "Hypercalcaemia: confusion + thirst + constipation + bone pain",
        "Superior vena cava obstruction: facial swelling + breathlessness"
    ])
})

# ═══════════════════════════════════════════════════════════
# CONDITION 2  --  HEART FAILURE
# ═══════════════════════════════════════════════════════════
CONDITIONS.append({
    "condition_name": "Heart Failure",
    "condition_keywords": json.dumps(["heart failure","cardiac failure","congestive heart failure","chf","cardiomyopathy","left ventricular failure","lvf","right ventricular failure","rvf","heart disease advanced","decompensated heart"]),
    "goals_of_care": """Primary Goals:
1. Achieve and maintain euvolaemia (target dry weight)
2. Optimise medication adherence (diuretics, ACE-I/ARB, beta-blockers, SGLT2-I)
3. Manage breathlessness to permit basic daily activity
4. Reduce hospital admissions through daily monitoring and early intervention
5. Educate patient and family on sodium/fluid restriction
6. Provide psychological support for adjustment to chronic illness
7. Advance care planning: resuscitation decisions, ICD deactivation if relevant
8. Manage co-morbidities: diabetes, hypertension, AF, renal impairment

NYHA Classification and Goal Shift:
- NYHA I-II: disease management, lifestyle, medication optimisation
- NYHA III: symptom management, exercise rehab, frequent monitoring
- NYHA IV: palliative focus, comfort, reduce hospitalisations, advance care plan""",

    "pain_management_plan": """Pain in Heart Failure (often underrecognised):
- Musculoskeletal pain from reduced activity: physiotherapy, gentle exercise
- Angina: Nitrates (GTN spray PRN, isosorbide mononitrate for regular use)
- Peripheral oedema discomfort: elevate limbs, compression if tolerated, diuretic optimisation
- Avoid NSAIDs (worsen fluid retention, renal function, heart failure)
- Avoid COX-2 inhibitors for same reasons
- Safe analgesia: Paracetamol 1g QDS (first line for all pain)
- Low-dose opioids for breathlessness AND pain: Morphine 2.5-5mg oral/SC  --  evidence-based for dyspnoea

BREATHLESSNESS MANAGEMENT (most important symptom):
- Non-pharmacological: upright positioning 45°, fan to face, reduce anxiety
- Low-dose Morphine 2.5-5mg every 4 hours  --  most evidence-based pharmacological treatment
- Loop diuretics IV/SC if acute decompensation with pulmonary oedema
- Oxygen ONLY if SpO2 <88% (not routine)
- Nitrates if pulmonary oedema acute: GTN spray 1-2 puffs SL""",

    "psychological_support": """PSYCHOLOGICAL BURDEN IN HEART FAILURE:
- Depression prevalence 20-40% in advanced HF
- Anxiety common, especially breathlessness-related panic
- Cardiac cachexia and functional decline affect self-esteem and identity

ASSESSMENT AND TREATMENT:
- PHQ-9 and GAD-7 at every clinic visit
- Antidepressants: Sertraline safest in HF (avoid TCAs  --  arrhythmia risk)
- Psychotherapy: CBT for breathlessness-related anxiety very effective
- Breathlessness panic cycle: education + breathing techniques breaks cycle
- Address fear of dying from sudden cardiac death
- Discuss ICD shock anxiety and consider deactivation conversation in advanced HF

ADVANCE CARE PLANNING IN HF:
- ICD deactivation  --  important discussion; active shock causes distress
- Resuscitation decision  --  CPR rarely successful in advanced HF
- 'What matters most to you?'  --  goals-of-care conversation
- Preferred place of death  --  most HF patients die in hospital but prefer home""",

    "spiritual_care": """Spiritual needs specific to heart failure:
- 'Will I drown in my own fluid?'  --  fear of death by breathlessness
- Loss of strength and role identity  --  'I was always the strong one'
- Sudden death fear  --  address honestly and compassionately
- Reassure that breathlessness at end of life is treatable with opioids
- Legacy concerns if sudden death risk present

Reassurance around dying process in HF:
- End-stage HF  --  most patients become progressively sleepy
- Breathlessness can be well-controlled with low-dose opioids
- Pain is manageable
- Family presence is important and welcomed""",

    "family_support_plan": """Specific family issues in heart failure:
- Fluid and diet restrictions require whole-family commitment
- Daily weighing  --  caregiver often does this
- Medication complexity  --  many drugs, complex timing
- Frequent hospitalisation  --  family fatigue and disruption
- Sudden death risk creates anticipatory anxiety
- ICD shock witnessed by family  --  traumatic; prepare and support

CAREGIVER EDUCATION:
- Signs of acute decompensation: weight >1kg/day, worsening breathlessness, new ankle swelling
- Action plan: when to call GP, when to go to emergency
- Fluid restriction: ALL fluids count (water, tea, soup, ice cream)
- Low sodium: <2g/day, avoid salt, tinned food, processed food
- Daily weight: same time, same scale, morning, after toilet, before eating""",

    "plain_language_summary": """Heart failure means the heart muscle is not pumping as well as it should. This causes fluid to build up in the lungs and body, making you feel breathless, tired, and swollen. We cannot cure heart failure but we can control it. Taking your medications every day  --  even when you feel well  --  is the most important thing. Weighing yourself every morning tells us if fluid is building up. Your care team wants to hear from you early if you notice any change.""",

    "key_symptoms_to_monitor": json.dumps([
        "breathlessness_esas", "weight_daily", "ankle_oedema", "fatigue_esas",
        "oxygen_saturation", "heart_rate", "blood_pressure", "urine_output",
        "chest_pain", "palpitations", "syncope", "depression_phq9"
    ]),
    "red_flag_symptoms": json.dumps([
        "Weight increase >1kg in 24 hours or >2kg in 1 week",
        "Acute severe breathlessness at rest",
        "Pink frothy sputum (pulmonary oedema)",
        "SpO2 <88%",
        "Chest pain (possible ACS or pulmonary embolism)",
        "Syncope or pre-syncope",
        "New confusion",
        "Urine output <0.5ml/kg/hr (renal failure)",
        "ICD shock",
        "Cold clammy skin + hypotension (cardiogenic shock)"
    ])
})

# ═══════════════════════════════════════════════════════════
# CONDITION 3  --  COPD / CHRONIC RESPIRATORY FAILURE
# ═══════════════════════════════════════════════════════════
CONDITIONS.append({
    "condition_name": "COPD Advanced",
    "condition_keywords": json.dumps(["copd","chronic obstructive pulmonary disease","emphysema","chronic bronchitis","obstructive airway","airways disease","respiratory failure","end stage lung","chronic respiratory"]),
    "goals_of_care": """Primary Goals:
1. Control breathlessness  --  the dominant and most distressing symptom
2. Prevent and promptly treat acute exacerbations
3. Maintain safe O2 saturation 88-92% (NEVER target >94% in COPD)
4. Optimise bronchodilator use and inhaler technique
5. Smoking cessation support if currently smoking
6. Pulmonary rehabilitation if GOLD stage II-III
7. Manage anxiety and depression (both very common in COPD)
8. Advance care planning: ventilation decisions, resuscitation

GOLD STAGING and Goals:
- GOLD I-II: active management, rehab, smoking cessation
- GOLD III: symptom management, prevent exacerbations, rehab
- GOLD IV: palliative focus, O2 if hypoxaemic, end-of-life planning
- End-stage: comfort, breathlessness control, family support""",

    "pain_management_plan": """Breathlessness Management (Primary Symptom):
OXYGEN THERAPY:
- Target SpO2 88-92% (NOT 95-100%)  --  high O2 suppresses respiratory drive in COPD (type II RF)
- Long-term O2 therapy (LTOT): >15 hours/day if PaO2 <7.3kPa on two occasions
- Ambulatory O2 for exercise desaturation only
- No smoking within 1 metre of oxygen  --  fire hazard

LOW-DOSE OPIOIDS FOR BREATHLESSNESS (most evidence-based):
- Morphine 2.5-5mg oral every 4 hours or SR 10mg BD
- Does NOT suppress respiratory drive at palliative doses
- Reduces sensation of breathlessness by 20-30%
- Most effective pharmacological intervention available

BRONCHODILATORS (maintain regardless of stage):
- SABA: Salbutamol 100mcg 1-2 puffs PRN (rescue)
- LABA + ICS: Salmeterol/Fluticasone or Budesonide/Formoterol BD
- LAMA: Tiotropium 18mcg once daily
- Combined: LABA+LAMA+ICS (triple therapy) for GOLD III-IV

NON-PHARMACOLOGICAL BREATHLESSNESS:
- Fan to face  --  cold air stimulates trigeminal nerve, reduces breathlessness sensation
- Upright positioning, lean forward with arms supported
- Pursed-lip breathing technique
- Anxiety management (panic worsens breathlessness cycle)
- Pacing and energy conservation

ACUTE EXACERBATION MANAGEMENT:
- Controlled O2: start at 24-28% via Venturi mask
- Short-acting bronchodilators: Salbutamol 5mg nebulised
- Prednisolone 30-40mg for 5-7 days
- Antibiotics if: increased sputum purulence, systemic signs of infection
- Escalation to NIV if pH <7.35 on controlled O2""",

    "psychological_support": """PSYCHOLOGICAL BURDEN IN COPD:
- Anxiety 40-50% prevalence (breathlessness triggers panic which worsens breathlessness)
- Depression 30-40% prevalence  --  often undertreated
- Social isolation due to mobility limitation
- Fear of choking or suffocating at death

BREATHLESSNESS-PANIC CYCLE:
Breathlessness → Fear/Panic → Hyperventilation → Worsened breathlessness
BREAK THE CYCLE: Education + breathing techniques + Lorazepam PRN

PHARMACOLOGICAL:
- Anxiety: Lorazepam 0.5-1mg PRN for acute breathlessness-related panic
- Depression: Sertraline 50mg (avoid TCAs  --  anticholinergic side effects worsen mucus)
- Regular benzodiazepines only in end-stage (addiction risk less relevant)

PSYCHOLOGICAL INTERVENTIONS:
- Education about breathlessness  --  not dangerous, can be treated
- Breathing control techniques: pursed-lip, paced breathing
- Pacing and energy management
- Pulmonary rehabilitation (CBT component integrated)
- End-of-life conversation: dying from COPD  --  reassure re: breathlessness control""",

    "spiritual_care": """Spiritual needs specific to COPD:
- Fear of suffocating at death  --  most common fear; must address directly
- Reassure: 'We have very effective medications to prevent breathlessness at end of life'
- Loss of voice (talking worsens breathlessness)  --  affects communication and relationships
- Dependency and loss of role/dignity
- If on long-term oxygen: restricted mobility, home-bound, isolation

Advance care planning:
- Ventilation decisions: most patients do not want intubation/ventilation at end-stage
- NIV (non-invasive ventilation): time-limited trial or ceiling of treatment
- Resuscitation: CPR rarely successful in end-stage COPD""",

    "family_support_plan": """Family roles in COPD:
- Oxygen equipment management  --  training essential
- Recognising acute exacerbation vs normal variation
- Action plan document: amber/red warning signs, who to call
- Home nebuliser management
- Supporting activity without promoting dependence

CAREGIVER BURDEN:
- Breathlessness very distressing to witness
- Fear of patient dying during exacerbation
- Disrupted sleep  --  nocturnal breathlessness
- Social isolation  --  patient cannot go out, family stays in

OXYGEN SAFETY EDUCATION:
- No smoking within 1 metre of oxygen cylinders
- No petroleum-based products near face/equipment
- Keep away from heat sources
- Ensure cylinder secured upright""",

    "plain_language_summary": """COPD is a lung condition where the airways are damaged and narrowed, making it hard to breathe. The most important thing to know is that your oxygen level should be kept at 88-92%  --  NOT higher. Too much oxygen can actually make COPD worse. Your inhalers must be taken every day even when you feel well. A fan blowing cool air on your face can help when you feel breathless. Tell your care team early if your breathlessness is getting worse or your phlegm changes colour.""",

    "key_symptoms_to_monitor": json.dumps([
        "breathlessness_esas", "oxygen_saturation", "respiratory_rate",
        "sputum_colour", "sputum_volume", "wheeze", "fatigue_esas",
        "anxiety_esas", "depression_phq9", "pps_score", "weight"
    ]),
    "red_flag_symptoms": json.dumps([
        "SpO2 <85% on prescribed O2",
        "Cyanosis (blue lips or fingertips)",
        "Confusion or drowsiness (possible CO2 retention)",
        "Accessory muscle use at rest",
        "Unable to complete sentence in one breath",
        "Increased respiratory rate >30/min",
        "Change in sputum to green/yellow with systemic signs",
        "Peak flow <50% of best",
        "Silent chest (no wheeze = no air movement  --  dangerous)"
    ])
})

# ═══════════════════════════════════════════════════════════
# CONDITION 4  --  DEMENTIA (All types)
# ═══════════════════════════════════════════════════════════
CONDITIONS.append({
    "condition_name": "Dementia Advanced",
    "condition_keywords": json.dumps(["dementia","alzheimer","alzheimers","vascular dementia","lewy body dementia","frontotemporal dementia","ftd","cognitive decline","cognitive impairment advanced","memory loss progressive","neurodegenerative"]),
    "goals_of_care": """Primary Goals:
1. Maintain patient safety (falls, wandering, medication errors)
2. Achieve adequate pain control using behavioural assessment tools (not self-report)
3. Maintain nutrition and hydration  --  appropriate to stage
4. Preserve dignity, identity, and personhood
5. Support and regularly assess caregiver burden (Zarit score)
6. Document advance care plan while patient has capacity, then proxy decisions
7. Manage behavioural and psychological symptoms of dementia (BPSD)
8. Prevent and treat infections, pressure sores, aspiration

STAGING AND GOALS:
- Mild (MMSE 20-26): maintain independence, safety, early ACP, carer education
- Moderate (MMSE 10-20): increased supervision, routine, behavioural management
- Severe (MMSE <10): safety, comfort, infection prevention, nutrition
- End-stage: comfort only, oral care, positioning, family support, spiritual care""",

    "pain_management_plan": """PAIN ASSESSMENT IN NON-VERBAL DEMENTIA:
Patients cannot reliably self-report pain  --  use observational tools:
- Abbey Pain Scale: facial expression, vocalisation, body language, behavioural change, physiological change, physical changes
- PAINAD (Pain Assessment in Advanced Dementia): 5 items, 0-10 score
- DOLOPLUS-2: for repeated observations

PAIN TREATMENT  --  Same WHO Ladder but guided by behaviour:
- Unexplained agitation, facial grimacing, vocalisation, resistance to care = pain until proven otherwise
- Trial of Paracetamol 1g QDS is diagnostic AND therapeutic
- Opioids if Paracetamol insufficient  --  same as cancer pain
- Avoid NSAIDs in elderly (renal impairment, GI bleed, delirium risk)
- Avoid Tramadol in dementia (lowers seizure threshold, causes confusion)
- Preferred opioid in dementia: Oxycodone (fewer psychoactive metabolites than morphine)
- Fentanyl patches useful if oral route unreliable

BPSD (Behavioural and Psychological Symptoms of Dementia):
Non-pharmacological FIRST:
- Person-centred care: know the person, their history, preferences
- Music therapy  --  strong evidence for agitation
- Reality orientation (mild-moderate) vs validation therapy (severe)
- Structured daily activity to reduce boredom
- Bright light therapy for sundowning

Pharmacological ONLY if non-pharmacological failed and risk of harm:
- Lorazepam 0.5mg PRN for acute agitation (short-term)
- Haloperidol 0.5-1mg (lowest dose, shortest duration, dementia increases stroke risk)
- Avoid antipsychotics if Lewy Body Dementia (severe reaction risk)
- Mirtazapine for depression + sleep disturbance in dementia""",

    "psychological_support": """PSYCHOLOGICAL CARE FOR PATIENT WITH DEMENTIA:
- Even severely cognitively impaired patients have emotional experience
- Respond to tone and presence even when language lost
- Use gentle touch, eye contact, reassuring voice
- Life story book or box  --  photos, meaningful objects
- Reminiscence therapy  --  music, photos from patient's era
- Validation therapy  --  enter patient's reality rather than correcting

PSYCHOLOGICAL CARE FOR CAREGIVERS (Critical):
- Caregiver depression: 30-40% of dementia caregivers
- Anticipatory grief  --  'pre-death bereavement' watching personality change
- Caregiver burden is number one predictor of nursing home placement
- Zarit Burden Interview at every clinical contact
- Caregiver support groups  --  highly effective
- Respite care is not abandonment  --  educate
- Counselling referral for significant burden

COMMUNICATION STRATEGIES:
- Use simple sentences, one instruction at a time
- Make eye contact, approach slowly from front
- Never argue or reality-orient in moderate/severe dementia
- Redirect rather than correct
- Use patient's preferred name
- Non-verbal communication  --  smile, gentle touch""",

    "spiritual_care": """Spiritual care in dementia:
- The person within still experiences spiritual connection even with cognitive loss
- Familiar hymns, prayers, religious rituals trigger recognition and calm
- Involve patient's pastor, imam, priest  --  familiar spiritual figures reassure
- Objects of faith (cross, rosary, prayer beads, Quran) provide comfort
- Music from patient's spiritual tradition profoundly effective

GHANAIAN CONTEXT:
- Family gathering and prayer at bedside very comforting
- Traditional practices  --  discuss with family, accommodate safely
- Concept of ancestors  --  family may speak to patient about this
- Final rites and preparation important to family  --  plan ahead

ADVANCE CARE PLANNING (while capacity present):
- If patient has mild dementia and can participate  --  document NOW
- What matters most to them
- Preferred place of care and death
- Resuscitation preferences
- Who they want to make decisions
- Religious/cultural wishes for end of life""",

    "family_support_plan": """FAMILY IN DEMENTIA CARE IS CENTRAL  --  TREAT THEM AS PARTNERS:

EDUCATION PROGRAMME:
- Understanding dementia: what it is, what to expect at each stage
- Communicating with person with dementia
- Managing behaviours: aggression, wandering, repetition, sundowning
- Preventing and recognising complications: falls, infections, pressure sores, dysphagia
- When to seek help

CAREGIVER BURDEN  --  PRIORITY INTERVENTION:
- Zarit score 0-40: mild to moderate  --  education, support group, respite
- Zarit score >40: severe  --  urgent respite care, social worker, consider residential care
- Caregiver burnout signs: physical illness, resentment, social isolation, financial strain
- Take caregiver's mental health as seriously as patient's

PLANNING FOR FUTURE NEEDS:
- Anticipate stages  --  plan formal care before crisis
- Financial and legal planning while patient has capacity (power of attorney)
- Residential care decision  --  not failure, often becomes necessary
- Home safety assessment and modification (rails, locks, night lights)
- Emergency contacts for acute deterioration
- Post-death bereavement  --  often complex grief after prolonged loss""",

    "plain_language_summary": """Dementia is a progressive condition affecting memory, thinking and behaviour. The most important things are keeping your loved one safe, comfortable and maintaining their dignity. Even when they can no longer speak or remember, they can still feel and experience emotions. Your role as family and caregiver is vital. Please talk to your care team about any changes  --  we are here to support both of you through every stage.""",

    "key_symptoms_to_monitor": json.dumps([
        "cognitive_mmse", "behavioural_agitation", "pain_abbey_scale",
        "nutrition_intake", "weight", "swallowing_safety",
        "falls_frequency", "pressure_sore_risk", "urine_infection_signs",
        "caregiver_burden_zarit", "depression_caregiver"
    ]),
    "red_flag_symptoms": json.dumps([
        "Sudden acute confusion worse than baseline (delirium  --  find cause)",
        "Fall with injury  --  assess for fracture",
        "Unable to swallow safely (aspiration risk)",
        "Complete food and fluid refusal",
        "Severe agitation or aggression causing harm",
        "Signs of neglect or abuse",
        "Fever or signs of infection",
        "New neurological signs (new stroke, subdural)",
        "Caregiver expressing safety concerns or abuse"
    ])
})

# ═══════════════════════════════════════════════════════════
# CONDITION 5  --  CHRONIC KIDNEY DISEASE / RENAL FAILURE
# ═══════════════════════════════════════════════════════════
CONDITIONS.append({
    "condition_name": "Chronic Kidney Disease Advanced",
    "condition_keywords": json.dumps(["chronic kidney disease","ckd","renal failure","kidney failure","end stage renal","esrd","dialysis","nephrotic","renal impairment","uraemia","uremia","creatinine elevated"]),
    "goals_of_care": """Primary Goals:
1. Manage uraemic symptoms: nausea, pruritus, fatigue, restless legs, oedema
2. Optimise fluid and electrolyte balance
3. Renal diet: low potassium, low phosphate, protein restriction, fluid restriction
4. Medication review: dose-adjust or discontinue renally cleared drugs
5. Manage anaemia of CKD (erythropoietin, iron supplementation)
6. Control hypertension and cardiovascular risk
7. Dialysis decision-making: conservative vs dialysis pathway
8. Advance care planning: dialysis withdrawal if applicable

CKD STAGING:
- Stage 3 (GFR 30-59): slow progression, CV risk management, nephrology referral
- Stage 4 (GFR 15-29): intensive preparation, diet, dialysis decision
- Stage 5/ESRD (GFR <15): dialysis or conservative pathway, full palliative""",

    "pain_management_plan": """PAIN IN CKD  --  SPECIAL CONSIDERATIONS:
Most opioids and their metabolites accumulate in renal failure  --  requires modification

SAFE ANALGESICS IN CKD:
- Paracetamol: SAFE  --  first-line for all pain (no renal toxicity)
- Buprenorphine: SAFE  --  fentanyl patch or sublingual buprenorphine
- Alfentanil: SAFE  --  SC infusion for end-stage

MODIFIED USE IN CKD:
- Morphine: ACCUMULATES (M6G active metabolite)  --  use with caution, reduce dose, extend intervals
- Oxycodone: less accumulation than morphine  --  preferred if opioid needed
- Tramadol: AVOID in GFR <30 (accumulates, lowers seizure threshold)

UNSAFE IN CKD:
- NSAIDs: AVOID (worsen renal function, cause hyperkalaemia, fluid retention)
- Codeine: AVOID (active metabolite morphine-6-glucuronide accumulates)

URAEMIC PRURITUS (very distressing symptom):
- Skin moisturising (emollients) BD-TDS essential
- Gabapentin 100mg nocte (renally adjusted)  --  most evidence
- UVB phototherapy if available
- Investigate: hyperphosphataemia, hyperparathyroidism (treat underlying)
- Ondansetron 4-8mg for acute relief

RESTLESS LEGS SYNDROME (common in CKD):
- Iron replacement if ferritin low
- Pramipexole or ropinirole (dopamine agonists)  --  seek nephrology advice
- Gabapentin  --  evidence in CKD-associated RLS""",

    "psychological_support": """PSYCHOLOGICAL ISSUES IN CKD:
- Depression 20-30% (often undertreated  --  assumed to be 'understandable')
- Anxiety about dialysis, transplant, death
- Cognitive impairment (uraemic encephalopathy in late stages)
- Sexual dysfunction affecting relationships and self-esteem
- Financial impact of dialysis (transport, time off work, diet costs)

DIALYSIS-RELATED PSYCHOLOGICAL ISSUES:
- Dependence on machine for life  --  significant psychological adjustment
- Anxiety around dialysis sessions (cramps, hypotension)
- Social impact: time commitment, travel, fatigue after sessions
- Dialysis withdrawal: when patient decides to stop  --  comfort care focus

CONSERVATIVE (NON-DIALYSIS) PATHWAY:
- Life expectancy often similar to dialysis in elderly with comorbidity
- Better quality of life in some patients without dialysis
- Full palliative care support
- Decision requires honest discussion: 'Is dialysis adding life to years or just years to life?'

ANTIDEPRESSANTS SAFE IN CKD:
- Sertraline: largely hepatically metabolised  --  safe (adjust if GFR <20)
- Citalopram: avoid QT prolongation risk in CKD
- Avoid tricyclics (metabolite accumulation, anticholinergic, hyperkalaemia risk)""",

    "spiritual_care": """Spiritual care in renal failure:
- 'Why do I have to be a machine to survive?'  --  loss of natural body function
- Fear of fluid overload death  --  breathlessness; reassure re: treatment
- Dialysis withdrawal decision may carry spiritual/religious weight
- Some beliefs oppose discontinuing life-sustaining treatment
- Involve spiritual leader in dialysis withdrawal conversation if patient wishes
- Legacy planning important given progressive prognosis""",

    "family_support_plan": """FAMILY ROLES IN CKD:
- Diet preparation  --  low K+, low PO4, fluid restriction affects whole family
- Transport to dialysis (enormous burden  --  3x/week, 4+ hours each session)
- Monitoring access site (AV fistula): swelling, infection, thrills, bruits
- Managing acute deterioration: fluid overload, hyperkalaemia symptoms

FLUID AND DIET EDUCATION:
- Low potassium: avoid bananas, oranges, tomatoes, potatoes (unboiled), dried fruit, nuts
- Low phosphate: avoid dairy, cola drinks, processed foods, nuts
- Fluid restriction: total 500ml/day + previous day urine output
- Low-sodium: reduces thirst and fluid accumulation

DIALYSIS WITHDRAWAL SUPPORT:
- If patient withdraws from dialysis  --  median survival 7-10 days
- Family preparation for this process is critical
- Symptom management: uraemia causes peaceful drowsiness at end
- Breathlessness from fluid: morphine and furosemide
- Death at home possible and often preferred""",

    "plain_language_summary": """Kidney failure means the kidneys can no longer clean your blood properly. This builds up waste products that make you feel unwell. Your diet is very important  --  some foods that are healthy for other people (like bananas and dairy) can be harmful for you. Your care team will help manage symptoms like itching, tiredness, and swelling. If you are on dialysis, talk to your care team about how this fits with your goals for your life.""",

    "key_symptoms_to_monitor": json.dumps([
        "nausea_esas", "pruritus_itching", "fatigue_esas",
        "oedema_lower_limb", "weight_daily", "blood_pressure",
        "urine_output", "potassium_level", "creatinine",
        "breathlessness_esas", "confusion", "restless_legs"
    ]),
    "red_flag_symptoms": json.dumps([
        "Hyperkalaemia symptoms: palpitations, muscle weakness, ECG changes",
        "Pulmonary oedema: severe breathlessness, pink frothy sputum",
        "Uraemic encephalopathy: confusion, seizures, asterixis",
        "AV fistula: loss of thrill/bruit (access failure), bleeding, infection",
        "Hypotension during dialysis",
        "Peritonitis if on PD: cloudy effluent, abdominal pain, fever",
        "Hypertensive emergency: BP >180/120 with symptoms",
        "Pericarditis: chest pain, friction rub (uraemic)"
    ])
})

# ═══════════════════════════════════════════════════════════
# CONDITIONS 6-10
# ═══════════════════════════════════════════════════════════

CONDITIONS.append({
    "condition_name": "Stroke Advanced",
    "condition_keywords": json.dumps(["stroke","cerebrovascular accident","cva","tia","transient ischaemic attack","hemiplegia","hemiparesis","aphasia","dysphasia","dysarthria","ischaemic stroke","haemorrhagic stroke","subarachnoid haemorrhage","brainstem stroke"]),
    "goals_of_care": "Primary Goals:\n1. Prevent secondary stroke: anticoagulation/antiplatelet, BP control, AF management\n2. Swallowing safety: SALT assessment before any oral intake\n3. Neurological rehabilitation: physiotherapy, occupational therapy, speech therapy\n4. Pressure sore prevention: 2-hourly repositioning if bedbound\n5. Depression screening and treatment (very common post-stroke)\n6. Bladder and bowel management\n7. Communication support for aphasia\n8. Family education and preparation for rehabilitation journey\n\nPost-Stroke Trajectory:\n- Acute (0-2 weeks): stabilise, prevent complications, begin swallowing assessment\n- Rehabilitation (2-26 weeks): intensive therapy, functional recovery focus\n- Chronic/Palliative: when recovery plateau reached, manage ongoing disability\n- End-stage: often dementia progression, recurrent stroke, comfort focus",
    "pain_management_plan": "PAIN IN STROKE:\nCentral post-stroke pain (neuropathic): burning, electric shock, allodynia\n- First line: Amitriptyline 25-75mg nocte\n- Second line: Lamotrigine or Gabapentin\n- Avoid opioids (minimal benefit, significant side effects)\n\nShoulder pain (hemiplegic shoulder):\n- Positioning and manual handling technique critical\n- TENS, ultrasound therapy\n- Corticosteroid injection if bursitis/impingement\n- Botulinum toxin for spasticity-related pain\n\nSpasticity:\n- Physiotherapy and stretching programme\n- Baclofen 5-10mg TDS (titrate)\n- Botulinum toxin injections for focal spasticity",
    "psychological_support": "POST-STROKE DEPRESSION (30-40% prevalence):\n- PHQ-9 at 1 month, 6 months post-stroke\n- Often undertreated  --  attributed to 'understandable reaction'\n- Sertraline 50mg morning  --  first-line (avoid TCA in stroke)\n- Psychotherapy: CBT effective when communication allows\n\nEMOTIONAL LABILITY (pseudobulbar affect):\n- Inappropriate laughing or crying\n- Explain to family: not always reflecting inner state\n- Low-dose Amitriptyline or SSRI reduces frequency\n\nAPHASIA AND PSYCHOLOGICAL SUPPORT:\n- Profound psychological impact of losing speech\n- Communication aids, picture boards\n- Speech and language therapy\n- Support groups for aphasia patients and families",
    "spiritual_care": "Spiritual issues post-stroke:\n- 'Why did this happen to me?'  --  sudden onset without warning\n- Loss of independence and identity\n- Aphasia may prevent prayer/scripture reading  --  adapt (music, familiar prayers aloud)\n- Legacy concerns if prognosis poor\n- Family grief for the person they 'lost' before physical death",
    "family_support_plan": "FAMILY IN STROKE REHABILITATION:\n- Central to recovery  --  consistent therapy approach across all settings\n- Physiotherapy education: safe transfers, positioning, exercises\n- Communication strategies for aphasia\n- Emotional adjustment: person changed; family grief\n- Caregiver training: personal care, nutrition, medications, monitoring\n- Respite care and community support essential for long-term",
    "plain_language_summary": "A stroke happens when blood supply to part of the brain is interrupted. Recovery depends on the area affected and how quickly treatment was received. Rehabilitation with the therapy team is important for recovery. Secondary prevention  --  blood pressure medications, statins, anticoagulants  --  must be taken every day to prevent another stroke. Tell your care team about any new symptoms immediately.",
    "key_symptoms_to_monitor": json.dumps(["neurological_obs","swallowing_safety","blood_pressure","depression_phq9","pain_esas","pps_score","falls_risk","pressure_sore_risk","communication_ability"]),
    "red_flag_symptoms": json.dumps(["Sudden new neurological deficit  --  new stroke","FAST positive: Face drooping, Arm weakness, Speech problems, Time to call 999","Swallowing unsafe  --  aspiration","Fever + confusion (aspiration pneumonia)","Severe headache  --  haemorrhage","DVT or pulmonary embolism (high risk post-stroke)"])
})

CONDITIONS.append({
    "condition_name": "Motor Neurone Disease / ALS",
    "condition_keywords": json.dumps(["motor neurone disease","mnd","amyotrophic lateral sclerosis","als","lou gehrig","progressive bulbar palsy","progressive muscular atrophy","primary lateral sclerosis","spinal muscular atrophy","neurodegenerative motor"]),
    "goals_of_care": "Primary Goals:\n1. Manage progressive dysphagia  --  modify diet, consider PEG timing\n2. Respiratory support: NIV at appropriate time, advance planning\n3. Communication: AAC devices as speech deteriorates\n4. Manage symptom burden: cramps, spasticity, sialorrhoea, constipation\n5. Psychological support through progressive loss\n6. Advance care planning: ventilator decisions, resuscitation, PEG\n7. Maintain quality of life and independence as long as possible\n8. Family and caregiver intensive support\n\nMND Trajectory:\n- ALS typically: 2-5 years from diagnosis\n- Bulbar onset: faster progression, dysphagia first\n- Limb onset: slower, respiratory eventual cause of death in most\n- Death typically: respiratory failure, aspiration pneumonia",
    "pain_management_plan": "PAIN IN MND:\nMuscle cramps (common):\n- Quinine sulfate 200-300mg nocte\n- Mexiletine 150mg TDS (if available)\n- Stretching programme\n\nSpasticity:\n- Baclofen 5-10mg TDS\n- Tizanidine\n- Physiotherapy, stretching\n\nNeuropathic pain:\n- Gabapentin or Pregabalin\n- Amitriptyline\n\nSialorrhoea (drooling from bulbar palsy):\n- Hyoscine patch 1mg/72h\n- Amitriptyline 10-50mg\n- Glycopyrronium 0.2mg SC\n- Botulinum toxin to salivary glands if severe\n\nThick secretions (opposite problem to sialorrhoea):\n- Adequate hydration\n- Carbocisteine 375mg TDS to thin secretions\n- Mechanical insufflator-exsufflator (cough assist device)\n\nRESPIRATORY FAILURE (inevitable in MND):\n- Non-invasive ventilation (NIV): improves quality of life and survival by months\n- Start when FVC <65% or symptomatic breathlessness\n- Invasive ventilation: personal decision; most MND patients decline\n- End-stage breathlessness: Low-dose morphine SC infusion",
    "psychological_support": "PSYCHOLOGICAL IMPACT OF MND:\n- Awareness is retained throughout  --  patient fully conscious while losing all function\n- Anticipatory grief for each function lost\n- Communication loss: most profound psychological impact when speech gone\n- Locked-in state possible in late ALS  --  maintain dignity and communication\n- Depression requires active treatment (SSRIs)\n- Pseudobulbar affect: emotional lability (treat with Amitriptyline/SSRI)\n\nSUPPORT COMPONENTS:\n- Psychological support from diagnosis\n- Support groups (MND Association)\n- Peer support from others with MND\n- Advance care planning conversations early\n- Record patient voice for AAC before lost",
    "spiritual_care": "Spiritual needs in MND:\n- Profound existential challenge: 'watching myself disappear'\n- Legacy work: record voice, video messages, life story\n- Questions of meaning: 'Why is this happening to me this way?'\n- Dignity in care: most important value for many MND patients\n- AAC must include spiritual/existential vocabulary\n- Legacy materials (Memory Vault) especially important  --  start early",
    "family_support_plan": "FAMILY IN MND:\n- Enormous carer burden  --  physical care needs increase rapidly\n- Psychological burden: watching rapid loss\n- Communication support  --  learn AAC with patient\n- Respite care essential\n- Children: age-appropriate, honest communication\n- Community care package: early involvement essential",
    "plain_language_summary": "Motor neurone disease affects the nerves that control muscles. Over time it makes it harder to move, speak, swallow and breathe. There is no cure but there are many treatments that help manage symptoms and maintain quality of life. Planning ahead is very important with MND  --  talking about future care while you still can speak.",
    "key_symptoms_to_monitor": json.dumps(["respiratory_function_fvc","swallowing_safety","communication_ability","pain_cramps","spasticity","sialorrhoea","fatigue_esas","depression_phq9","nutritional_status","weight"]),
    "red_flag_symptoms": json.dumps(["FVC <50% (respiratory failure approaching)","Aspiration event","Acute respiratory distress","Severe dysphagia with weight loss","Complete communication failure without AAC","Suicidal ideation","Caregiver breakdown"])
})

CONDITIONS.append({
    "condition_name": "Liver Failure / Cirrhosis Advanced",
    "condition_keywords": json.dumps(["liver failure","hepatic failure","cirrhosis","portal hypertension","end stage liver disease","esld","hepatocellular carcinoma","liver cancer","ascites","hepatic encephalopathy","variceal bleeding","hepatorenal syndrome","decompensated liver"]),
    "goals_of_care": "Primary Goals:\n1. Manage ascites: paracentesis, diuretics (spironolactone + furosemide)\n2. Prevent and manage hepatic encephalopathy\n3. Monitor for variceal bleeding and manage accordingly\n4. Control pain without hepatotoxic drugs\n5. Manage pruritus, jaundice, fatigue\n6. Nutritional support: high protein (BCAA if tolerated)\n7. Renal function monitoring (hepatorenal syndrome)\n8. Advance care planning: transplant eligibility, resuscitation, TIPSS\n\nChild-Pugh/MELD Staging:\n- Child A / MELD <10: active management, liver transplant workup\n- Child B / MELD 10-19: close monitoring, treat complications\n- Child C / MELD >20: palliative focus, symptom management",
    "pain_management_plan": "ANALGESIA IN LIVER FAILURE  --  MAJOR MODIFICATIONS:\n\nHEPATOTOXIC  --  AVOID:\n- NSAIDs (renal, GI bleeding risk in cirrhosis)\n- High-dose Paracetamol (max 2g/day in cirrhosis; avoid in active alcoholism)\n\nSAFE WITH CAUTION:\n- Paracetamol: SAFE up to 2g/day (NOT 4g) in stable cirrhosis\n- Opioids: use with caution  --  reduced hepatic metabolism, increased HE risk\n  Start at 50% of normal dose, extend dosing intervals\n  Preferred: Fentanyl (fewer active metabolites)\n  Avoid: Morphine (sedating metabolites accumulate), Tramadol (HE risk)\n\nPRURITUS IN LIVER DISEASE:\n- Cholestyramine 4g BD-TDS (bile acid sequestrant  --  first line)\n- Rifampicin 150-300mg daily (second line)\n- Sertraline 50-100mg (evidence for cholestatic pruritus)\n- Naltrexone 12.5-50mg (opioid antagonist  --  use cautiously)\n- Emollients and cool baths for relief\n\nASCITES MANAGEMENT:\n- Low-sodium diet <2g/day\n- Spironolactone 100mg + Furosemide 40mg (5:2 ratio)\n- Therapeutic paracentesis if tense: drain up to 5L, albumin replacement",
    "psychological_support": "PSYCHOLOGICAL ISSUES IN LIVER FAILURE:\n- Alcohol-related cirrhosis: complex grief, guilt, stigma\n- Hepatic encephalopathy: reversible but frightening personality changes for family\n- Body image: ascites, jaundice, muscle wasting\n- Pruritus: profound effect on sleep and wellbeing\n- Rapid or unpredictable decline\n\nTREATMENT:\n- Sertraline safe in liver disease (start low, go slow)\n- Avoid benzodiazepines (precipitate encephalopathy)\n- Lorazepam at lowest dose if acute anxiety absolutely requires treatment\n- Address alcohol use: Motivational interviewing, support groups",
    "spiritual_care": "Spiritual needs in liver failure:\n- Alcohol-related: guilt, shame, questions of blame\n- 'I brought this on myself'  --  requires pastoral compassion without judgement\n- Jaundice and visible illness affect identity and dignity\n- Confusion from HE  --  distressing for family to witness",
    "family_support_plan": "Family care in liver failure:\n- HE episodes: prepare family for personality changes, confusion, aggression\n- Spontaneous bacterial peritonitis: recognise signs (fever, abdominal pain)\n- Variceal bleed risk: dark stools, haematemesis  --  emergency\n- Home paracentesis may be available  --  caregiver training\n- Alcohol use in family: address sensitively",
    "plain_language_summary": "Your liver is not working properly, which causes fluid to build up (ascites), affects thinking (encephalopathy) and causes itching and jaundice. A very low-salt diet is essential. Some common medications including aspirin and ibuprofen can be dangerous with your condition  --  always check before taking any new medicine.",
    "key_symptoms_to_monitor": json.dumps(["ascites_girth","weight_daily","confusion_HE","jaundice","pruritus","haematemesis","melaena","fatigue_esas","pain_esas","renal_function"]),
    "red_flag_symptoms": json.dumps(["Haematemesis or melaena (variceal bleed)","Acute confusion (hepatic encephalopathy)","Fever + abdominal pain (spontaneous bacterial peritonitis)","Sudden tense ascites with breathlessness","Renal failure (hepatorenal syndrome)","Jaundice rapidly worsening"])
})

CONDITIONS.append({
    "condition_name": "HIV/AIDS Advanced",
    "condition_keywords": json.dumps(["hiv","aids","human immunodeficiency virus","acquired immune deficiency syndrome","advanced hiv","late stage hiv","aids defining illness","opportunistic infection","kaposi sarcoma hiv","cd4 low"]),
    "goals_of_care": "Primary Goals:\n1. Adherence to antiretroviral therapy (ART)  --  most important\n2. Prophylaxis and treatment of opportunistic infections\n3. Manage HIV-related symptoms: nausea, pain, weight loss, fatigue, diarrhoea\n4. Psychological support: stigma, disclosure, relationships\n5. Nutritional support\n6. Address social issues: housing, family, financial\n7. Advance care planning\n8. Peer and community support\n\nCD4 Staging:\n- CD4 >500: asymptomatic, ART, monitoring\n- CD4 200-500: symptomatic HIV, prophylaxis\n- CD4 50-200: AIDS, opportunistic infection risk high\n- CD4 <50: severe AIDS, intensive prophylaxis, palliative symptoms",
    "pain_management_plan": "PAIN IN HIV/AIDS (very common  --  50-80% advanced):\nTypes:\n- Peripheral neuropathy (HIV and ART-related)\n- Pain from opportunistic infections\n- Kaposi sarcoma pain\n- Headache (cryptococcal meningitis)\n- Abdominal pain (infections, hepatomegaly, lymphoma)\n\nNEUROPATHIC PAIN IN HIV:\n- Stop offending ARV if possible (stavudine, didanosine)\n- First line: Gabapentin 300mg TDS\n- Amitriptyline 25-75mg nocte\n- Duloxetine 60mg morning\n- Topical Capsaicin 0.075% cream\n\nOPIOIDS AND ART INTERACTIONS:\n- Methadone levels affected by ARVs (efavirenz LOWERS methadone)\n- Opioids generally safe; check interactions with HAART\n- Tramadol: increased seizure risk with some ARVs\n- Fentanyl: CYP3A4 substrate  --  affected by protease inhibitors",
    "psychological_support": "PSYCHOLOGICAL ISSUES IN HIV:\n- Stigma: profound, pervasive, often internalized\n- Disclosure: to family, partner  --  complex and high-stakes\n- Depression: 30-50% prevalence\n- Substance use: high comorbidity, complicates treatment\n- Survivor guilt in those who have lost partners/friends\n- Young patients  --  loss of life plans\n\nTREATMENT:\n- SSRI (sertraline, fluoxetine)  --  watch CYP450 interactions with ARVs\n- Trauma-informed counselling\n- Peer support groups  --  profound benefit\n- Address stigma directly and consistently",
    "spiritual_care": "Spiritual needs in HIV:\n- Stigma from religious communities  --  painful and common\n- 'Is this God's punishment?'  --  must be addressed\n- Non-judgmental presence and unconditional care\n- Reconciliation with family after disclosure\n- Legacy: particularly important in young patients\n- Children  --  arrangements if parent dying",
    "family_support_plan": "Family support in HIV:\n- Disclosure decision belongs entirely to patient\n- Never disclose without consent\n- When family knows: educate on transmission, dispel myths\n- Prepare for stigma within family\n- Children of HIV+ parents  --  support, counselling, testing",
    "plain_language_summary": "HIV can be very well controlled with medication. Taking your antiretroviral treatment every single day is the most important thing you can do. People living with HIV who take their treatment regularly can live long, healthy lives. Your care team is here to support you with any side effects, symptoms or concerns. Everything you tell us is confidential.",
    "key_symptoms_to_monitor": json.dumps(["cd4_count","viral_load","weight","fatigue_esas","pain_esas","diarrhoea","fever","neuropathy","depression_phq9","adherence_art"]),
    "red_flag_symptoms": json.dumps(["Fever + headache + confusion (cryptococcal meningitis)","New visual symptoms (CMV retinitis)","Severe breathlessness (PCP pneumonia)","Persistent cough + weight loss (TB)","Dysphagia (oesophageal candidiasis)","Severe watery diarrhoea","Skin lesions suggesting KS progression"])
})

CONDITIONS.append({
    "condition_name": "Parkinson Disease Advanced",
    "condition_keywords": json.dumps(["parkinson","parkinsons disease","parkinson's disease","parkinsonism","lewy body","multiple system atrophy","progressive supranuclear palsy","corticobasal degeneration","pd dementia"]),
    "goals_of_care": "Primary Goals:\n1. Maintain mobility and prevent falls  --  huge risk in PD\n2. Manage motor symptoms: tremor, rigidity, akinesia, dyskinesia\n3. Ensure medications given ON TIME  --  critical in PD (withdrawal causes crisis)\n4. Manage non-motor symptoms: drooling, constipation, hallucinations, orthostatic hypotension\n5. Dysphagia management\n6. Parkinson's dementia screening and management\n7. Psychological support: depression very common\n8. Advance care planning including medication crisis plan\n\nHoehn and Yahr Staging:\n- Stage 1-2: unilateral/bilateral, minimal disability\n- Stage 3: mild-moderate, balance impaired\n- Stage 4: severe disability, still stand and walk\n- Stage 5: bedbound or wheelchair, full care needed",
    "pain_management_plan": "PAIN IN PARKINSON'S (very underrecognised):\n- Musculoskeletal: rigidity, dystonia\n- Neuropathic: akathisia, restless legs\n- Central pain: diffuse, poorly localised\n\nMOTOR SYMPTOM MANAGEMENT:\n- Levodopa (co-careldopa, co-beneldopa): cornerstone treatment\n- MEDICATIONS MUST BE GIVEN ON TIME  --  missed doses cause severe OFF episodes\n- In hospital, never delay Parkinson's medications\n- Dopamine agonists: pramipexole, ropinirole\n- MAO-B inhibitors: rasagiline, selegiline\n\nDYSTONIA PAIN:\n- Optimise levodopa timing (often early morning 'off')\n- Botulinum toxin for focal dystonia\n- Baclofen for generalised\n\nSALIVARY MANAGEMENT:\n- Hyoscine patches\n- Glycopyrronium\n- Botulinum toxin to parotid/submandibular glands",
    "psychological_support": "DEPRESSION IN PD (40% prevalence):\n- Both reactive and neurobiologically driven (dopaminergic loss)\n- SSRIs: Sertraline or Escitalopram\n- SNRIs: Duloxetine (also helps pain)\n- Avoid antidepressants that worsen PD motor symptoms: Risperidone, Haloperidol\n- Safe antipsychotic if needed (hallucinations): Clozapine (gold standard), Quetiapine (practical)\n- NEVER use Risperidone, Haloperidol or Metoclopramide in PD  --  severe worsening\n\nPD DEMENTIA:\n- Rivastigmine (Exelon) only approved dementia treatment for PD\n- Reduces hallucinations and cognitive impairment",
    "spiritual_care": "Spiritual needs in Parkinson's:\n- Loss of tremor control affecting prayer (writing, handling objects)\n- Masked facies (blank expression)  --  people think not engaged; reassure family\n- Dysarthria  --  speech difficult, misunderstood\n- Adapt: recorded prayers, familiar music, presence",
    "family_support_plan": "Family care in Parkinson's:\n- Medication timing is non-negotiable  --  set alarms, never skip\n- Falls prevention: home hazard assessment, walking aids, physiotherapy\n- Communication: speak slowly, face-to-face, adequate time\n- Swallowing: small bites, upright position, modified textures\n- Dementia in PD: same guidance as dementia section",
    "plain_language_summary": "Parkinson's disease affects the brain's ability to control movement. Your medication must be taken exactly on time  --  if you miss doses you can become very rigid and unable to move. The disease is progressive but many symptoms can be well managed with the right treatment. Physiotherapy, speech therapy and occupational therapy all have important roles.",
    "key_symptoms_to_monitor": json.dumps(["motor_symptoms_updrs","falls_frequency","medication_timing","swallowing_safety","constipation","orthostatic_hypotension","depression_phq9","hallucinations","cognitive_mmse"]),
    "red_flag_symptoms": json.dumps(["Medication missed leading to akinetic crisis (emergency)","Aspiration event","Severe dyskinesia or dystonia","Neuroleptic malignant syndrome if wrong antipsychotic given","Fall with injury","Sudden worsening cognition (delirium vs PD dementia progression)"])
})

# ═══════════════════════════════════════════════════════════
# CONDITIONS 11-20  --  Remaining major conditions
# ═══════════════════════════════════════════════════════════

_REMAINING = [
  ("Lung Cancer",
   ["lung cancer","non-small cell lung cancer","nsclc","small cell lung cancer","sclc","mesothelioma","pleural mesothelioma","bronchogenic carcinoma","lung adenocarcinoma","lung squamous cell"],
   "1. Control pain (bone mets, chest wall invasion, neuropathic components)\n2. Manage breathlessness  --  most feared symptom in lung cancer\n3. Treat malignant pleural effusion: thoracocentesis or indwelling pleural catheter\n4. Haemoptysis management\n5. Steroid treatment for SVC obstruction, SVCO\n6. Nutritional support\n7. Anxiety management  --  breathlessness triggers severe anxiety\n8. Advance care planning",
   "LUNG CANCER PAIN:\n- Bone metastases: NSAIDs + bisphosphonates + opioids\n- Chest wall invasion/Pancoast: neuropathic pain  --  gabapentin + opioids\n- Pleural pain: position, NSAIDs, pleurodesis for effusion\n\nBREATHLESSNESS:\n- Drain effusion if present (up to 1.5L, then stop if vasovagal)\n- Low-dose morphine 2.5-5mg oral  --  most effective treatment\n- Lorazepam 0.5mg SL for breathlessness panic\n- Fan to face, upright positioning\n- Oxygen if SpO2 <88%\n\nHAEMOPTYSIS:\n- Reassure: usually small amounts, rarely massive\n- Tranexamic acid 1g TDS if recurrent\n- Massive haemoptysis: Midazolam 10mg SC stat (sedation), dark towels\n- Radiotherapy referral for haemoptysis control",
   ["breathlessness_esas","pain_esas","fatigue_esas","haemoptysis","weight_loss","oxygen_saturation","depression_phq9","anxiety_gad7"],
   ["Massive haemoptysis","SVC obstruction: facial oedema + dilated neck veins + breathlessness","Spinal cord compression: back pain + leg weakness/numbness","Hypercalcaemia: confusion + thirst + constipation","Pericardial effusion: breathlessness + raised JVP","Stridor (central airway obstruction)"]),

  ("Breast Cancer Advanced",
   ["breast cancer","breast carcinoma","breast malignancy","metastatic breast cancer","triple negative breast cancer","her2 positive breast cancer","hormone receptor positive breast","inflammatory breast cancer"],
   "1. Manage bone metastases (most common in breast cancer)\n2. Control pain  --  nociceptive and neuropathic\n3. Treat lymphoedema if present\n4. Manage brain metastases if present\n5. Address hormonal and body image concerns\n6. Psychological support for young patients\n7. Fertility and sexuality concerns\n8. Advance care planning",
   "BONE METASTASES (70% metastatic breast cancer):\n- Bisphosphonates: Zoledronic acid IV monthly\n- Denosumab: alternative to bisphosphonate\n- Incident pain: breakthrough opioid 30 min before activity\n- NSAID component important for inflammatory bone pain\n- Radiotherapy for focal bone pain  --  highly effective\n\nLYMPHOEDEMA MANAGEMENT:\n- Manual lymphatic drainage (MLD) by trained therapist\n- Compression bandaging/garments\n- Meticulous skin care  --  prevent cellulitis\n- Exercise  --  beneficial, not harmful\n- Avoid BP measurement, blood tests in affected arm",
   ["pain_bone","lymphoedema","fatigue_esas","anxiety_esas","depression_phq9","weight","fracture_risk","brain_met_symptoms"],
   ["Pathological fracture or spinal cord compression","Brain metastases: new headache + neurological symptoms","Hypercalcaemia","Lymphoedema cellulitis","Chest wall wound breakdown"]),

  ("Prostate Cancer Advanced",
   ["prostate cancer","prostate carcinoma","metastatic prostate cancer","castration resistant prostate cancer","crpc","prostate adenocarcinoma","hormone resistant prostate"],
   "1. Manage bone pain (predominant feature  --  widespread bone metastases)\n2. Hormone therapy side effects: hot flushes, sexual dysfunction, osteoporosis\n3. Urinary symptoms: obstruction, haematuria\n4. Monitor for spinal cord compression\n5. Nutritional support\n6. Psychological support for masculinity/sexual identity\n7. Bone-protecting therapy: bisphosphonates or denosumab\n8. Advance care planning",
   "BONE PAIN IN PROSTATE CANCER:\n- Very severe  --  prostate cancer has osteoblastic AND osteolytic metastases\n- WHO ladder Steps 1-3 as per cancer pain\n- Radium-223 treatment if eligible: specifically targets bone metastases\n- Bisphosphonates: Zoledronic acid monthly\n- Denosumab: alternative, also reduces skeletal events\n- Radiotherapy: single fraction very effective for focal bone pain\n\nURINARY SYMPTOMS:\n- Obstructive: Alpha-blocker (tamsulosin) or catheterisation\n- Haematuria: Tranexamic acid, bladder irrigation if needed\n- Spinal cord compression: Dexamethasone 16mg STAT + urgent oncology",
   ["pain_bone","urinary_symptoms","fatigue_esas","hot_flushes","weight","pps_score","depression_phq9","bowel_function"],
   ["Spinal cord compression (most common emergency in prostate cancer)","Pathological fracture","Ureteric obstruction (hydronephrosis)","Severe haematuria"]),

  ("Colorectal Cancer Advanced",
   ["colorectal cancer","colon cancer","rectal cancer","bowel cancer","sigmoid cancer","colorectal carcinoma","large bowel cancer","colorectal adenocarcinoma"],
   "1. Manage bowel obstruction risk and symptoms\n2. Control pain: visceral and neuropathic\n3. Manage stoma if present\n4. Nutritional support  --  often profound malnutrition\n5. Treat malignant ascites if present\n6. Fistula management if present\n7. Liver metastases management\n8. Advance care planning",
   "BOWEL OBSTRUCTION MANAGEMENT:\nConservative: NG decompression, IV fluids, nil by mouth\n- Dexamethasone 8mg BD (reduce peri-tumour oedema)\n- Octreotide 300-600mcg/24h SC (reduce secretions)\n- Hyoscine butylbromide 60-120mg/24h (reduce colic)\n- Antiemetics: Haloperidol or Cyclizine\n\nPAIN IN COLORECTAL CANCER:\n- Visceral pain: opioids most effective\n- Neuropathic (sacral invasion): gabapentin + opioids\n- Tenesmus (rectal pain): amitriptyline + low-dose opioid\n- Radiotherapy for local pain control\n\nSTOMA MANAGEMENT:\n- Stoma nurse referral essential\n- Body image and psychological support",
   ["bowel_function","nausea_esas","pain_esas","weight_loss","ascites","fatigue_esas","stoma_output"],
   ["Complete bowel obstruction","Perforation (sudden severe abdominal pain)","Major rectal bleeding","Fistula formation","Liver failure from metastases"]),

  ("Head and Neck Cancer",
   ["head and neck cancer","oral cancer","oropharyngeal cancer","laryngeal cancer","hypopharyngeal cancer","thyroid cancer","salivary gland cancer","nasopharyngeal cancer","head neck squamous cell"],
   "1. Manage complex dysphagia  --  often severe in head/neck cancer\n2. Nutritional support: PEG/RIG feeding tube often required\n3. Airway management: tracheostomy care\n4. Pain: often very severe (nerve invasion, mucositis)\n5. Manage mucositis and dry mouth (xerostomia)\n6. Communication support: speech therapy\n7. Body image and disfigurement support\n8. Advance care planning including airway decisions",
   "PAIN IN HEAD AND NECK CANCER (often most severe of all cancers):\n- Nociceptive: wound, mucositis\n- Neuropathic: nerve invasion, trigeminal\n- Step 3 opioids often required early\n- Methadone: good evidence for complex neuropathic pain\n- Regional nerve blocks: trigeminal, glossopharyngeal\n\nMUCOSITIS (from radiotherapy):\n- Regular oral rinses: salt + bicarb or chlorhexidine\n- Lidocaine viscous 2% before meals (topical anaesthesia)\n- Oral hygiene Q4h\n- Systemic analgesia: must be adequate before meals\n- Nutritional support: NG or PEG if swallowing severely affected\n\nXEROSTOMIA (dry mouth from salivary gland damage):\n- Frequent sips of water, saliva substitutes\n- Pilocarpine if some salivary function remains\n- Ice chips, pineapple chunks stimulate saliva\n- Good oral hygiene  --  high dental caries risk",
   ["pain_esas","swallowing_ability","nutrition_peg","weight","speech_function","mucositis_grade","xerostomia","airway_tracheostomy","depression_phq9"],
   ["Airway compromise","Carotid artery rupture risk (if tumour eroding carotid)","Aspiration pneumonia","Severe mucositis preventing any intake","Fistula formation"]),

  ("Pancreatic Cancer",
   ["pancreatic cancer","pancreatic adenocarcinoma","pancreatic carcinoma","exocrine pancreatic","endocrine pancreatic cancer","islet cell cancer","ampullary cancer"],
   "1. Manage severe pain  --  most challenging in pancreatic cancer\n2. Treat jaundice: biliary stenting or PTBD\n3. Coeliac plexus block for pain control early\n4. Manage exocrine insufficiency: Creon (pancreatic enzymes)\n5. Manage diabetes if head of pancreas tumour\n6. Nutritional support\n7. Manage ascites and malignant bowel obstruction\n8. Advance care planning  --  median survival 6-12 months from diagnosis",
   "PAIN IN PANCREATIC CANCER (most severe of GI cancers):\n- Retroperitoneal invasion: deep boring epigastric and back pain\n- Coeliac plexus block/neurolysis: 70-80% pain reduction, should be done EARLY\n- WHO Step 3 opioids often needed early in disease course\n- Neuropathic component: gabapentin or pregabalin\n- Octreotide for pain from bowel obstruction\n\nJAUNDICE MANAGEMENT:\n- ERCP + biliary stent: palliative biliary drainage\n- Itching: cholestyramine, rifampicin\n- PTC (percutaneous) if ERCP not possible\n\nPANCREATIC ENZYME REPLACEMENT:\n- Creon (pancreatin) with every meal and snack\n- Dose with main meals: 25,000-75,000 units lipase\n- Prevents steatorrhoea and malabsorption",
   ["pain_esas","jaundice","weight_loss","nausea_esas","steatorrhoea","diabetes_blood_glucose","fatigue_esas","depression_phq9"],
   ["Biliary sepsis: fever + jaundice + rigors (Charcot's triad)","Complete bowel obstruction","Severe uncontrolled pain","Haemorrhage from tumour"]),

  ("Ovarian Cancer Advanced",
   ["ovarian cancer","ovarian carcinoma","fallopian tube cancer","peritoneal cancer","ovarian adenocarcinoma","borderline ovarian tumour"],
   "1. Manage ascites  --  dominant symptom in advanced ovarian cancer\n2. Control pain: abdominal distension, nerve invasion\n3. Manage bowel obstruction (common late complication)\n4. Nutritional support\n5. Manage lymphoedema if present\n6. Address fertility and femininity concerns\n7. Fistula management if present\n8. Advance care planning",
   "ASCITES IN OVARIAN CANCER:\n- Therapeutic paracentesis: drain 5L at a time, albumin replacement\n- Peritoneovenous shunt (Denver shunt) for refractory cases\n- Diuretics less effective in malignant ascites than hepatic ascites\n\nBOWEL OBSTRUCTION IN OVARIAN CANCER:\n- Most common in late disease  --  'frozen abdomen'\n- Conservative: IV fluids, NG, antisecretories (Octreotide, Hyoscine)\n- Dexamethasone trial for resolution\n- Surgery rarely appropriate in end-stage disease\n- Venting gastrostomy if appropriate\n\nPAIN:\n- Visceral: opioids\n- Abdominal distension: paracentesis relieves dramatically\n- Neuropathic (ureteric): gabapentin, opioids",
   ["ascites_girth","bowel_function","pain_esas","nausea_esas","weight","fatigue_esas","urine_output","depression_phq9"],
   ["Bowel obstruction","Ureteric obstruction (hydronephrosis)","Ovarian/intraperitoneal haemorrhage","Fistula formation","Sepsis from bowel perforation"]),

  ("Multiple Sclerosis Advanced",
   ["multiple sclerosis","ms","relapsing remitting ms","secondary progressive ms","primary progressive ms","clinically isolated syndrome","demyelinating disease","optic neuritis ms"],
   "1. Manage fatigue  --  most common and disabling symptom\n2. Spasticity management: physiotherapy, oral and ITB medications\n3. Bladder dysfunction: urgency, frequency, retention\n4. Pain: neuropathic central pain, musculoskeletal\n5. Cognitive changes  --  support independence\n6. Depression screening and treatment\n7. Falls prevention\n8. Advance care planning for progressive phase",
   "FATIGUE IN MS (>90% of patients):\n- Energy conservation: pacing, prioritisation\n- Cooling (heat worsens MS fatigue): cool showers, fans\n- Amantadine 100mg BD: modest benefit\n- Modafinil 100-200mg: off-label, some evidence\n- Avoid overexertion\n\nSPASTICITY:\n- Baclofen 5-10mg TDS (titrate up to 80mg/day)\n- Tizanidine 2-4mg TDS\n- Dantrolene sodium (peripheral action)\n- Intrathecal baclofen pump for severe refractory spasticity\n- Cannabis-based medicine (Sativex): licensed for MS spasticity\n- Physiotherapy: stretching, positioning critical\n\nNEUROPATHIC PAIN:\n- Gabapentin or Pregabalin\n- Amitriptyline\n- Carbamazepine for trigeminal neuralgia\n- Duloxetine for central pain",
   ["fatigue_esas","spasticity","bladder_function","pain_neuropathic","falls_frequency","depression_phq9","cognitive_function","pps_score"],
   ["Acute relapse","Urinary tract infection (very common in MS bladder dysfunction)","Falls with injury","Aspiration (dysphagia in advanced MS)","Pressure sores","Severe depression with suicidal ideation"]),

  ("Sickle Cell Disease Advanced",
   ["sickle cell disease","sickle cell anaemia","scd","haemoglobin ss","haemoglobin sc","sickle beta thalassaemia","vaso-occlusive crisis","sickling","sickle cell crisis","acute chest syndrome sickle"],
   "1. Manage vaso-occlusive pain crisis  --  most common reason for admission\n2. Prevent acute chest syndrome\n3. Hydroxyurea (hydroxycarbamide) to reduce crisis frequency\n4. Stroke prevention and management\n5. Organ damage management: kidneys, liver, lungs, eyes\n6. Psychological support for chronic pain and disease burden\n7. Transition from paediatric to adult services\n8. Genetic counselling if reproductive age",
   "VASO-OCCLUSIVE CRISIS (VOC)  --  ACUTE PAIN:\n- Assess pain with NRS immediately on arrival\n- Strong opioids needed: Morphine 0.1mg/kg IV/SC every 20-30 min until NRS <4\n- Oral morphine/oxycodone for maintenance\n- NSAIDs if renal function adequate (Ketorolac IV in acute setting)\n- Paracetamol 1g QDS as base\n- Avoid cold environment (triggers sickling)\n- Warm packs, hydration (IV fluids)\n\nCHRONIC PAIN (long-term opioid therapy issues):\n- Many SCD patients on long-term opioids  --  manage sensitively\n- Opioid tolerance common  --  doses need to be higher\n- Avoid stigmatising language ('drug-seeking')  --  pain is real\n- Neuropathic component: gabapentin\n- Multimodal approach: physio, psychology, pain clinic\n\nACUTE CHEST SYNDROME:\n- Fever + chest pain + new infiltrate on CXR\n- Exchange transfusion may be needed\n- Incentive spirometry, adequate analgesia, supplemental O2\n- Broad-spectrum antibiotics",
   ["pain_nrs_crisis","hemoglobin","reticulocyte_count","fever","oxygen_saturation","renal_function","depression_phq9","quality_of_life"],
   ["Acute chest syndrome: fever + chest pain + new infiltrate","Stroke: acute neurological symptoms","Splenic sequestration: sudden abdominal pain + anaemia","Priapism: >4 hours painful erection","Acute anaemia: pallor + rapid deterioration","Osteomyelitis: severe localised bone pain + fever"]),

  ("Tuberculosis Advanced",
   ["tuberculosis","tb","mycobacterium tuberculosis","pulmonary tb","extrapulmonary tb","drug resistant tb","mdr-tb","xdr-tb","miliary tb","tb meningitis","tb with hiv"],
   "1. Adherence to full anti-TB regimen (6-24 months)\n2. DOT (Directly Observed Therapy) if adherence concern\n3. Manage drug side effects: hepatotoxicity, peripheral neuropathy, visual changes\n4. Contact tracing and notification\n5. HIV co-management if relevant\n6. Nutritional support\n7. Palliative care when treatment fails or MDR-TB\n8. End-of-life care for terminal TB",
   "SYMPTOM MANAGEMENT IN TB:\nHaemoptysis:\n- Rest and reassurance for small amounts\n- Tranexamic acid 1g TDS\n- Massive haemoptysis: emergency management\n\nBreathlessness (empyema, effusion, fibrosis):\n- Drain effusion/empyema\n- Low-dose morphine for refractory breathlessness\n\nFever and night sweats:\n- Paracetamol 1g QDS\n- NSAIDs if tolerated\n\nPAIN IN TB:\n- Pleuritic pain: NSAIDs\n- Spinal TB (Pott's disease): analgesia + immobilisation + surgery if cord compression\n- Lymph node pain: anti-inflammatory treatment\n\nDRUG-RELATED SIDE EFFECTS:\n- Isoniazid peripheral neuropathy: Pyridoxine 25-50mg daily prophylaxis\n- Rifampicin hepatitis: monitor LFTs monthly\n- Ethambutol optic neuritis: monthly eye tests in prolonged therapy\n- Pyrazinamide: gout, hepatitis",
   ["cough","haemoptysis","weight_loss","night_sweats","fever","sputum_afb","breathlessness_esas","liver_function","adherence"],
   ["Massive haemoptysis","TB meningitis: fever + headache + confusion","Spinal cord compression (Pott's disease)","Pericardial effusion: breathlessness + distant heart sounds","Severe hepatotoxicity from medications","Multi-organ failure in miliary TB"])
]

for name, keywords, goals, pain, monitor_list, red_flags in _REMAINING:
    CONDITIONS.append({
        "condition_name": name,
        "condition_keywords": json.dumps(keywords),
        "goals_of_care": goals,
        "pain_management_plan": pain,
        "psychological_support": f"Screen with PHQ-9 and GAD-7 at every visit. Depression prevalence is high in {name}. Sertraline 50mg morning is first-line. Refer for counselling if scores ≥10. Address disease-specific psychological burden, stigma, and adjustment challenges.",
        "spiritual_care": f"Assess spiritual needs using FICA tool. Respect cultural and religious practices specific to patient and family. Facilitate chaplaincy or faith leader visits as requested. Support legacy work through Memory Vault. Address existential concerns compassionately.",
        "family_support_plan": f"Assess caregiver burden with Zarit Burden Interview. Provide disease-specific family education for {name}. Arrange respite care if Zarit >21. Connect to support groups. Prepare family for likely trajectory and what to expect.",
        "plain_language_summary": f"Your care team is here to support you through {name}. We will work with you to manage your symptoms, support your family, and ensure your wishes are respected. Please tell us about any concerns  --  physical, emotional or spiritual.",
        "key_symptoms_to_monitor": json.dumps(monitor_list),
        "red_flag_symptoms": json.dumps(red_flags)
    })


# ═══════════════════════════════════════════════════════════
# DATABASE WRITE
# ═══════════════════════════════════════════════════════════

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    cur.execute("DELETE FROM condition_care_templates")
    print("Cleared existing templates")

    for c in CONDITIONS:
        cur.execute("""
            INSERT INTO condition_care_templates
              (condition_name, condition_keywords, goals_of_care,
               pain_management_plan, psychological_support, spiritual_care,
               family_support_plan, plain_language_summary,
               key_symptoms_to_monitor, red_flag_symptoms, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (
            c["condition_name"],
            c["condition_keywords"],
            c.get("goals_of_care",""),
            c.get("pain_management_plan",""),
            c.get("psychological_support",""),
            c.get("spiritual_care",""),
            c.get("family_support_plan",""),
            c.get("plain_language_summary",""),
            c.get("key_symptoms_to_monitor","[]"),
            c.get("red_flag_symptoms","[]"),
            datetime.utcnow().isoformat()
        ))
        print(f"  Inserted: {c['condition_name']}")

    conn.commit()
    conn.close()
    print(f"\nDone  --  {len(CONDITIONS)} conditions seeded into database")


if __name__ == "__main__":
    seed()
