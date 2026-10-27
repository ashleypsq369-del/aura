"""
Seed ServiceTypeConfig — 8 palliative care service types
with role-specific MCQ assessments, Ghana-localised.
Run: python seed_services.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from src.db import get_session, ServiceTypeConfig

SERVICE_TYPES = [
  {
    "key": "nurse",
    "label": "Palliative Nurse",
    "description": "Registered nurse providing clinical care, wound management, medication administration, and symptom monitoring for patients at home.",
    "icon_name": "Stethoscope",
    "color": "#0d9488",
    "required_certifications": ["RGN Nursing Certificate", "NMC PIN", "Palliative Care Training"],
    "min_pass_score": 70,
    "assessment_questions": [
      {"id":1,"scenario_context":"You are visiting a palliative patient at home at 11pm.","question":"The patient reports a pain score of 8/10 that has not responded to their usual oral morphine dose given 2 hours ago. What is your FIRST action?","options":[{"text":"Wait until morning and report to the clinical team","score":0},{"text":"Administer the prescribed PRN breakthrough opioid dose as per the care plan","score":10},{"text":"Call an ambulance immediately","score":3},{"text":"Reassure the patient and suggest distraction techniques","score":2}],"correct_index":1},
      {"id":2,"scenario_context":"During a routine visit, you observe that a patient's breathing has changed.","question":"A patient on the Liverpool Care Pathway develops Cheyne-Stokes breathing. The family is present and distressed. What do you do?","options":[{"text":"Say nothing and document in the notes","score":0},{"text":"Explain this is a normal part of the dying process, provide emotional support, and contact the care team","score":10},{"text":"Immediately start CPR","score":0},{"text":"Give extra oxygen and call an ambulance","score":2}],"correct_index":1},
      {"id":3,"scenario_context":"The patient is conscious and mentally competent.","question":"A patient's family asks you to NOT tell the patient their prognosis. What is the ethical approach?","options":[{"text":"Respect the family's wishes completely","score":2},{"text":"Tell the patient everything immediately","score":2},{"text":"Discuss with the multidisciplinary team; the patient has the right to information if they wish","score":10},{"text":"Avoid the topic entirely during all visits","score":0}],"correct_index":2},
      {"id":4,"scenario_context":"The patient is largely bed-bound and requires repositioning every 2 hours.","question":"You notice a pressure ulcer Grade 2 on a patient's sacrum that was not documented previously. What do you do?","options":[{"text":"Cover it with a plaster and say nothing","score":0},{"text":"Document it fully, photograph it, report to the clinician, begin appropriate wound care","score":10},{"text":"Wait to see if it improves on its own","score":1},{"text":"Tell the family to arrange a hospital admission","score":3}],"correct_index":1},
      {"id":5,"scenario_context":"General palliative care knowledge question.","question":"When should a subcutaneous syringe driver be considered for a palliative patient?","options":[{"text":"When the patient asks for it","score":2},{"text":"When oral medications can no longer be swallowed, absorbed, or tolerated","score":10},{"text":"Only in the final 24 hours of life","score":3},{"text":"When IV access is unavailable","score":4}],"correct_index":1},
      {"id":6,"scenario_context":"You are alone in the patient's home. The family member is shouting and has moved towards you.","question":"A family member becomes aggressive towards you during a home visit. What do you do?","options":[{"text":"Shout back to assert yourself","score":0},{"text":"Stay and try to resolve the situation verbally for as long as needed","score":1},{"text":"Leave safely if at risk, document the incident, and report to your manager and the safeguarding team","score":10},{"text":"Ignore the behaviour and continue the visit","score":0}],"correct_index":2},
      {"id":7,"scenario_context":"Scope of practice question.","question":"Which of the following is NOT within the scope of a home-visiting palliative nurse?","options":[{"text":"Administering subcutaneous medications from a syringe driver","score":0},{"text":"Performing a surgical procedure requiring anaesthesia","score":10},{"text":"Monitoring vital signs and reporting changes","score":0},{"text":"Providing emotional support to family carers","score":0}],"correct_index":1},
      {"id":8,"scenario_context":"Advance care planning scenario.","question":"A patient expresses a wish to die at home. What should be documented and actioned?","options":[{"text":"Nothing - verbal wishes are not binding","score":0},{"text":"Document the wish in the care plan, discuss with MDT, update the Advance Care Plan, and inform all relevant team members","score":10},{"text":"Tell the family to arrange it themselves","score":1},{"text":"Advise the patient to write a letter to their GP","score":2}],"correct_index":1}
    ]
  },
  {
    "key": "doctor",
    "label": "Palliative Care Physician",
    "description": "Medical doctor providing clinical assessment, prescribing, prognostication, and care planning for palliative patients.",
    "icon_name": "Activity",
    "color": "#0891b2",
    "required_certifications": ["MBCHB or equivalent", "Medical Licence (GCMC)", "Palliative Medicine Training"],
    "min_pass_score": 75,
    "assessment_questions": [
      {"id":1,"scenario_context":"A patient with advanced cancer has uncontrolled breathlessness.","question":"The most evidence-based pharmacological treatment for refractory breathlessness in palliative care is:","options":[{"text":"Nebulised saline","score":2},{"text":"Low-dose oral or subcutaneous opioids","score":10},{"text":"High-flow oxygen in all cases","score":2},{"text":"Benzodiazepines as first-line","score":3}],"correct_index":1},
      {"id":2,"scenario_context":"A patient is approaching end of life and can no longer swallow.","question":"Which route is most appropriate for continuing essential medications at end of life?","options":[{"text":"Intravenous","score":3},{"text":"Subcutaneous via syringe driver","score":10},{"text":"Intramuscular","score":2},{"text":"Rectal","score":3}],"correct_index":1},
      {"id":3,"scenario_context":"Ethics and consent.","question":"A mentally competent patient refuses a blood transfusion on religious grounds. You should:","options":[{"text":"Override their decision as it risks their life","score":0},{"text":"Respect their autonomous decision, document it, and explore alternatives","score":10},{"text":"Seek a court order immediately","score":2},{"text":"Involve the family to persuade the patient","score":1}],"correct_index":1},
      {"id":4,"scenario_context":"Palliative pharmacology.","question":"What is the recommended starting dose of oral morphine for opioid-naive patients with moderate-severe cancer pain?","options":[{"text":"10mg every 4 hours","score":3},{"text":"2.5-5mg every 4 hours","score":10},{"text":"30mg every 12 hours","score":1},{"text":"100mcg fentanyl patch","score":0}],"correct_index":1},
      {"id":5,"scenario_context":"Clinical deterioration recognition.","question":"Which of the following is a red flag requiring urgent reassessment in a palliative patient at home?","options":[{"text":"Mild constipation","score":0},{"text":"New confusion with a fever","score":10},{"text":"Fatigue that is unchanged","score":0},{"text":"Reduced appetite for 2 days","score":1}],"correct_index":1},
      {"id":6,"scenario_context":"End of life governance.","question":"DNACPR decisions in palliative care should be:","options":[{"text":"Made unilaterally by the doctor","score":0},{"text":"A sensitive conversation involving the patient (if competent), family, and MDT","score":10},{"text":"Only made in hospital","score":0},{"text":"Avoided as they cause distress","score":0}],"correct_index":1},
      {"id":7,"scenario_context":"Symptom management at end of life.","question":"Terminal agitation is best managed with:","options":[{"text":"Increasing opioids alone","score":2},{"text":"A benzodiazepine such as midazolam, often combined with a syringe driver","score":10},{"text":"Physical restraint","score":0},{"text":"Antipsychotics as the only treatment","score":2}],"correct_index":1},
      {"id":8,"scenario_context":"Oncological emergency.","question":"Hypercalcaemia of malignancy presents with which triad?","options":[{"text":"Anaemia, jaundice, fever","score":0},{"text":"Bones, groans, psychic moans (bone pain, abdominal pain, confusion)","score":10},{"text":"Breathlessness, chest pain, leg swelling","score":0},{"text":"Headache, vomiting, papilloedema","score":1}],"correct_index":1}
    ]
  },
  {
    "key": "physiotherapist",
    "label": "Physiotherapist",
    "description": "Qualified physiotherapist providing mobility support, breathing exercises, pain management, and rehabilitation for palliative patients.",
    "icon_name": "Heart",
    "color": "#059669",
    "required_certifications": ["BSc Physiotherapy or equivalent", "HCPC Registration", "Palliative Rehab Training"],
    "min_pass_score": 70,
    "assessment_questions": [
      {"id":1,"scenario_context":"A patient with advanced lung cancer has increasing breathlessness on minimal exertion.","question":"The MOST appropriate physiotherapy intervention is:","options":[{"text":"High-intensity aerobic exercise programme","score":0},{"text":"Breathing retraining, positioning, energy conservation techniques","score":10},{"text":"Discharge as palliative patients should not exercise","score":0},{"text":"Refer immediately to the emergency department","score":1}],"correct_index":1},
      {"id":2,"scenario_context":"Rehabilitation philosophy.","question":"A goal-setting approach in palliative physiotherapy should primarily focus on:","options":[{"text":"Cure and full functional recovery","score":0},{"text":"Patient-defined meaningful activities and quality of life","score":10},{"text":"Standardised physiotherapy milestones regardless of prognosis","score":1},{"text":"Maximising exercise tolerance metrics","score":2}],"correct_index":1},
      {"id":3,"scenario_context":"Palliative symptom management.","question":"Lymphoedema in a palliative patient is best managed with:","options":[{"text":"Diuretics as first-line","score":2},{"text":"Manual lymphatic drainage, compression garments, skin care, and exercise","score":10},{"text":"Elevation of the limb only","score":3},{"text":"Immediate surgical referral","score":1}],"correct_index":1},
      {"id":4,"scenario_context":"Risk assessment in palliative care.","question":"A patient with bone metastases asks to walk to the toilet independently. You should:","options":[{"text":"Refuse all mobility","score":0},{"text":"Assess fracture risk, use appropriate aids, balance risk vs. patient autonomy and dignity","score":10},{"text":"Allow it without assessment","score":1},{"text":"Refer to orthopaedics before any mobility","score":2}],"correct_index":1},
      {"id":5,"scenario_context":"End of life rehab.","question":"When a patient's prognosis is days, physiotherapy goals should shift to:","options":[{"text":"Increasing exercise capacity","score":0},{"text":"Comfort, positioning for pressure relief, breathing support, and family education","score":10},{"text":"Continue all previous goals unchanged","score":0},{"text":"Discharge the patient from physiotherapy","score":2}],"correct_index":1},
      {"id":6,"scenario_context":"Palliative values.","question":"A 'good death' from a physiotherapy perspective includes:","options":[{"text":"Full mobility to the end","score":0},{"text":"Patient comfort, dignity, meaningful occupation, and family support","score":10},{"text":"Maximised exercise scores","score":0},{"text":"No physiotherapy involvement","score":0}],"correct_index":1}
    ]
  },
  {
    "key": "counsellor",
    "label": "Counsellor / Psychotherapist",
    "description": "Trained counsellor providing psychological support, grief therapy, and emotional wellbeing services to patients and families.",
    "icon_name": "Brain",
    "color": "#7c3aed",
    "required_certifications": ["Counselling Diploma or Degree", "BACP/UKCP Accreditation", "Grief Counselling Training"],
    "min_pass_score": 70,
    "assessment_questions": [
      {"id":1,"scenario_context":"A grieving family member says during a session: 'I've been thinking maybe it would be easier if I wasn't here anymore.'","question":"Your IMMEDIATE response should be:","options":[{"text":"Change the subject to reduce their distress","score":0},{"text":"Conduct a suicide risk assessment, explore the statement, do not leave them alone if at risk","score":10},{"text":"Note it in your records and continue the session normally","score":1},{"text":"Tell them it is a normal thought and move on","score":2}],"correct_index":1},
      {"id":2,"scenario_context":"Counselling theory.","question":"In person-centred counselling, the three core conditions are:","options":[{"text":"Advice, challenge, and homework","score":0},{"text":"Unconditional positive regard, empathy, and congruence","score":10},{"text":"CBT techniques, mindfulness, and medication","score":1},{"text":"Active listening, confrontation, and interpretation","score":2}],"correct_index":1},
      {"id":3,"scenario_context":"Confidentiality and duty of care.","question":"A patient tells you something in confidence but it suggests they are at serious risk of harm. You should:","options":[{"text":"Maintain absolute confidentiality at all times","score":0},{"text":"Explain the limits of confidentiality and escalate to safeguarding if a serious risk exists","score":10},{"text":"Tell the family immediately without informing the patient","score":1},{"text":"Ignore it as it falls outside your role","score":0}],"correct_index":1},
      {"id":4,"scenario_context":"Grief theory knowledge.","question":"The Kubler-Ross model of grief includes which stages?","options":[{"text":"Shock, confusion, resolution","score":2},{"text":"Denial, anger, bargaining, depression, acceptance","score":10},{"text":"Crisis, stabilisation, recovery","score":2},{"text":"Detachment, grief, adjustment, re-engagement","score":3}],"correct_index":1},
      {"id":5,"scenario_context":"Specialist palliative counselling.","question":"Anticipatory grief in palliative care refers to:","options":[{"text":"Grief experienced only after a death","score":0},{"text":"Grief experienced before and in anticipation of an expected loss","score":10},{"text":"A diagnosable psychiatric disorder","score":1},{"text":"Grief that occurs too early and should be discouraged","score":0}],"correct_index":1},
      {"id":6,"scenario_context":"Clinical recognition.","question":"In Complicated Grief (Prolonged Grief Disorder), a clinician should:","options":[{"text":"Advise the family to 'move on' after 6 months","score":0},{"text":"Recognise the prolonged impairment and refer for specialist therapy","score":10},{"text":"Prescribe antidepressants as sole treatment","score":2},{"text":"Discharge the client","score":0}],"correct_index":1},
      {"id":7,"scenario_context":"Culturally sensitive practice in Ghana.","question":"Cultural humility in counselling means:","options":[{"text":"Learning everything about every culture","score":2},{"text":"Acknowledging your own cultural lens and remaining open to learning from clients about their cultural experience","score":10},{"text":"Applying your own cultural values to all clients","score":0},{"text":"Avoiding cultural topics altogether","score":0}],"correct_index":1},
      {"id":8,"scenario_context":"Children and bereavement.","question":"A child aged 8 whose parent is dying asks: 'Is Daddy going to die?' How do you respond?","options":[{"text":"Lie and say 'No, Daddy will be fine'","score":0},{"text":"Use age-appropriate, honest language and let them know it is safe to ask questions","score":10},{"text":"Change the subject","score":0},{"text":"Say nothing and refer to a psychiatrist","score":1}],"correct_index":1}
    ]
  },
  {
    "key": "nanny",
    "label": "Specialist Nanny / Childcare",
    "description": "Experienced nanny providing childcare support for families caring for a palliative patient at home.",
    "icon_name": "Baby",
    "color": "#d97706",
    "required_certifications": ["Childcare Certificate (Level 3 or above)", "First Aid (Paediatric)", "Police Clearance"],
    "min_pass_score": 60,
    "assessment_questions": [
      {"id":1,"scenario_context":"A 3-year-old child in your care has a temperature of 38.5 degrees Celsius.","question":"Your FIRST action is:","options":[{"text":"Ignore it unless it exceeds 40 degrees","score":0},{"text":"Give age-appropriate paracetamol if no contraindications, remove excess clothing, monitor closely, and inform the parent","score":10},{"text":"Immediately call 999","score":2},{"text":"Put the child in a cold bath","score":0}],"correct_index":1},
      {"id":2,"scenario_context":"Paediatric emergency.","question":"A child in your care has a severe allergic reaction (hives, swelling, difficulty breathing). What do you do?","options":[{"text":"Give antihistamine and wait","score":0},{"text":"Call 999 immediately, use the prescribed EpiPen if available, lay the child down with legs raised","score":10},{"text":"Drive the child to hospital yourself","score":3},{"text":"Call the parents and wait for them to return","score":0}],"correct_index":1},
      {"id":3,"scenario_context":"Supporting children through parental illness.","question":"A child of 5 asks you why their mummy is so sick and in bed all the time. You should:","options":[{"text":"Tell them adult matters are none of their business","score":0},{"text":"Use honest, simple language appropriate to their age and let them know it is safe to ask questions","score":10},{"text":"Make up a different explanation to protect them","score":1},{"text":"Ignore the question","score":0}],"correct_index":1},
      {"id":4,"scenario_context":"Child safeguarding.","question":"You notice a child has unexplained bruises in different stages of healing. You should:","options":[{"text":"Say nothing as it is not your place","score":0},{"text":"Document your observations and immediately report to the designated safeguarding lead or child protection services","score":10},{"text":"Ask the child where the bruises came from and leave it at that","score":2},{"text":"Confront the parents directly","score":1}],"correct_index":1},
      {"id":5,"scenario_context":"Child behaviour management.","question":"The best way to manage a toddler's tantrum is:","options":[{"text":"Shout louder than the child","score":0},{"text":"Stay calm, get to their level, acknowledge feelings, redirect with a simple choice","score":10},{"text":"Give them what they want immediately","score":2},{"text":"Leave them alone until they stop","score":3}],"correct_index":1},
      {"id":6,"scenario_context":"Infant safe sleep.","question":"SIDS risk is reduced by:","options":[{"text":"Placing the baby on their tummy","score":0},{"text":"Back to sleep, feet-to-foot position, firm mattress, no loose bedding","score":10},{"text":"Wrapping the baby very warmly","score":1},{"text":"Co-sleeping always","score":0}],"correct_index":1}
    ]
  },
  {
    "key": "masseur",
    "label": "Therapeutic Masseur",
    "description": "Trained massage therapist offering gentle therapeutic massage for pain relief, relaxation, and comfort in palliative care.",
    "icon_name": "Hand",
    "color": "#ea580c",
    "required_certifications": ["Massage Therapy Certificate", "Oncology/Palliative Massage Training", "First Aid Certificate"],
    "min_pass_score": 60,
    "assessment_questions": [
      {"id":1,"scenario_context":"A palliative patient wants a full body massage but has bone metastases.","question":"You should:","options":[{"text":"Perform a normal deep tissue massage","score":0},{"text":"Decline all massage as it is contraindicated","score":2},{"text":"Adapt the massage to avoid areas of metastases, use light pressure, and confirm with the care team first","score":10},{"text":"Only massage the face","score":3}],"correct_index":2},
      {"id":2,"scenario_context":"Clinical safety.","question":"Contraindications for massage in a palliative setting include:","options":[{"text":"Mild anxiety","score":0},{"text":"Open wounds, thrombosis/DVT, acute infection, directly over tumour sites","score":10},{"text":"High blood pressure (controlled)","score":0},{"text":"Fatigue","score":0}],"correct_index":1},
      {"id":3,"scenario_context":"Oncology massage precautions.","question":"A patient is receiving chemotherapy and asks for a massage. You should:","options":[{"text":"Refuse all massage during chemotherapy","score":2},{"text":"Confirm with the oncology/palliative team, avoid treatment days and 48 hours after, use gentle techniques","score":10},{"text":"Perform as normal","score":0},{"text":"Only massage the legs","score":1}],"correct_index":1},
      {"id":4,"scenario_context":"Professional standards.","question":"Informed consent before a palliative massage session means:","options":[{"text":"The family member consents on behalf of the patient always","score":0},{"text":"The patient understands the treatment, its benefits and risks, and gives voluntary agreement","score":10},{"text":"A signature on a form is always sufficient","score":2},{"text":"Consent is not needed for massage","score":0}],"correct_index":1},
      {"id":5,"scenario_context":"Evidence-based practice.","question":"What is the primary benefit of gentle massage in palliative care?","options":[{"text":"Curing the underlying disease","score":0},{"text":"Reducing anxiety, improving relaxation, reducing pain perception, and providing therapeutic touch","score":10},{"text":"Replacing medication","score":0},{"text":"Improving fitness","score":0}],"correct_index":1}
    ]
  },
  {
    "key": "social_worker",
    "label": "Social Worker",
    "description": "Qualified social worker supporting palliative patients and families with practical, financial, housing, and emotional needs.",
    "icon_name": "Users",
    "color": "#db2777",
    "required_certifications": ["Social Work Degree (BSc/MSW)", "Social Work Licence (GSWC)", "Palliative/End of Life Training"],
    "min_pass_score": 70,
    "assessment_questions": [
      {"id":1,"scenario_context":"A family caring for a dying parent at home is struggling financially and emotionally.","question":"Your FIRST step as their social worker is:","options":[{"text":"Provide financial assistance immediately from your own funds","score":0},{"text":"Complete a holistic needs assessment covering practical, financial, social, and emotional domains","score":10},{"text":"Refer to a GP and take no further action","score":1},{"text":"Advise them to apply for all benefits without assessment","score":2}],"correct_index":1},
      {"id":2,"scenario_context":"Safeguarding principles.","question":"Adult safeguarding in palliative care applies when:","options":[{"text":"Only when physical abuse is obvious","score":0},{"text":"A vulnerable adult is at risk of abuse, neglect, or exploitation including financial, emotional, or carer-related harm","score":10},{"text":"Only in care homes","score":0},{"text":"When the family requests it","score":1}],"correct_index":1},
      {"id":3,"scenario_context":"Mental Capacity Act principles.","question":"A palliative patient lacks mental capacity to make a decision about care. Who makes decisions on their behalf?","options":[{"text":"The next of kin automatically","score":2},{"text":"The decision-maker must act in the patient's best interests, using any previously expressed wishes","score":10},{"text":"The social worker alone","score":0},{"text":"The hospital consultant only","score":1}],"correct_index":1},
      {"id":4,"scenario_context":"Carer assessment.","question":"Carer burnout in families caring for palliative patients should be:","options":[{"text":"Ignored as it is part of the caring role","score":0},{"text":"Assessed proactively, with carer support, respite services, and psychological support offered","score":10},{"text":"Only addressed after a crisis","score":1},{"text":"Referred entirely to mental health services","score":2}],"correct_index":1},
      {"id":5,"scenario_context":"Integrated care planning.","question":"Discharge planning for a palliative patient going home from hospital should include:","options":[{"text":"Discharge as quickly as possible with no support package","score":0},{"text":"Assessment of home environment, carer capacity, equipment needs, community support package, and GP notification","score":10},{"text":"Family consent only","score":1},{"text":"A single phone call to the family","score":2}],"correct_index":1},
      {"id":6,"scenario_context":"Ghana-specific knowledge.","question":"In Ghana, which body oversees social worker registration?","options":[{"text":"Ghana Health Service","score":1},{"text":"Ghana Social Work Council (GSWC) under the Ministry of Gender, Children and Social Protection","score":10},{"text":"NHIA","score":0},{"text":"Ghana Medical Association","score":0}],"correct_index":1}
    ]
  },
  {
    "key": "chaplain",
    "label": "Chaplain / Spiritual Care Provider",
    "description": "Interfaith chaplain providing spiritual support, prayer, rituals, and meaning-making for patients and families of all faiths and none.",
    "icon_name": "Heart",
    "color": "#0369a1",
    "required_certifications": ["Theology Degree or Chaplaincy Certificate", "Interfaith Training", "Clinical Chaplaincy Training"],
    "min_pass_score": 60,
    "assessment_questions": [
      {"id":1,"scenario_context":"A Muslim patient is dying and requests specific prayers and a halal diet.","question":"As a chaplain of a different faith, you should:","options":[{"text":"Decline as it is outside your faith tradition","score":0},{"text":"Respect and facilitate their spiritual needs - contact an imam if possible, ensure dietary requirements are met","score":10},{"text":"Offer your own faith's prayers instead","score":0},{"text":"Document the request and take no action","score":1}],"correct_index":1},
      {"id":2,"scenario_context":"Spiritual needs recognition.","question":"Spiritual distress in a palliative patient may manifest as:","options":[{"text":"Requesting pain medication","score":1},{"text":"Asking 'Why is this happening to me?' expressions of meaninglessness, guilt, or unfinished business","score":10},{"text":"Being quiet during visits","score":0},{"text":"Reduced appetite","score":0}],"correct_index":1},
      {"id":3,"scenario_context":"Cultural and religious respect.","question":"A patient from a traditional African religion asks for a libation ceremony in their room. You should:","options":[{"text":"Refuse as it is not an official religion","score":0},{"text":"Facilitate the request respectfully, ensure it is safe, and document it in the spiritual care plan","score":10},{"text":"Tell the family it is not allowed","score":1},{"text":"Refer to the medical team to decide","score":2}],"correct_index":1},
      {"id":4,"scenario_context":"Professional ethics.","question":"Boundaries in chaplaincy include:","options":[{"text":"Converting patients to your own faith","score":0},{"text":"Not imposing your own beliefs; being present without judgement; maintaining professional boundaries","score":10},{"text":"Sharing your personal religious testimony in every session","score":0},{"text":"Providing legal or medical advice","score":0}],"correct_index":1},
      {"id":5,"scenario_context":"Spiritual accompaniment.","question":"A dying patient says they are afraid. The most appropriate first response is:","options":[{"text":"Immediately offer a prayer","score":2},{"text":"Sit with them, acknowledge the fear, ask what would help them feel less afraid, be present","score":10},{"text":"Tell them they should not be afraid if they have faith","score":0},{"text":"Call a nurse","score":1}],"correct_index":1},
      {"id":6,"scenario_context":"End of life spiritual care.","question":"Legacy work in chaplaincy may include:","options":[{"text":"Financial planning","score":0},{"text":"Life review, ethical will writing, recording messages for loved ones, reconciliation facilitation","score":10},{"text":"Prescription writing","score":0},{"text":"Arranging funeral services only","score":0}],"correct_index":1}
    ]
  }
]

def seed():
    db = get_session()
    try:
        for st in SERVICE_TYPES:
            existing = db.query(ServiceTypeConfig).filter(ServiceTypeConfig.key == st['key']).first()
            if existing:
                for k, v in st.items():
                    setattr(existing, k, v)
                print(f"  Updated: {st['key']}")
            else:
                db.add(ServiceTypeConfig(**st))
                print(f"  Created: {st['key']}")
        db.commit()
        print(f"\nSeeded {len(SERVICE_TYPES)} service types successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
