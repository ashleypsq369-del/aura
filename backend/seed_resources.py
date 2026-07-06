"""
Seeding Script for Educational Resources, Care Templates, and Community Groups
Project Aura  --  40 Resources + Care Templates + Support Groups
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session
from src.db import get_session, Resource, ConditionCareTemplate, CommunityGroup, init_database

def seed_data():
    init_database()
    db = get_session()
    try:
        print("Seeding Care Templates...")
        # Clear existing care templates
        db.query(ConditionCareTemplate).delete()
        
        templates = [
            ConditionCareTemplate(
                condition_name="Cancer",
                condition_keywords=json.dumps(["cancer", "carcinoma", "tumor", "sarcoma", "lymphoma", "leukemia", "oncology"]),
                goals_of_care="Maximise comfort and quality of life, manage pain proactively, support emotional and spiritual needs of the patient and family.",
                pain_management_plan="Scheduled long-acting opioids with short-acting breakthroughs. Antiemetics for opioid-induced nausea. Daily bowel regimen (laxatives) to prevent constipation.",
                psychological_support="Counselling for grief and anxiety. Peer group support. Encourage expressive activities like journaling or memory vault sharing.",
                spiritual_care="Coordinate with religious leaders (pastor, imam, or traditional elders). Address concerns about legacy, peace, and afterlife.",
                family_support_plan="Caregiver training on medication administration, respite care planning, family counseling, and bereavement preparation.",
                plain_language_summary="Focus on keeping you comfortable, pain-free, and supported emotionally and spiritually with your family.",
                key_symptoms_to_monitor=json.dumps(["pain", "nausea", "fatigue", "appetite_loss", "constipation"]),
                red_flag_symptoms=json.dumps(["uncontrolled_pain", "incessant_vomiting", "sudden_breathlessness", "confusion"])
            ),
            ConditionCareTemplate(
                condition_name="Dementia",
                condition_keywords=json.dumps(["dementia", "alzheimer", "cognitive", "parkinson", "lewy body"]),
                goals_of_care="Maintain a safe, calm, and familiar environment. Preserve dignity, manage behavioral symptoms gently, and support family caregivers.",
                pain_management_plan="Assess pain using behavioral indicators (grimacing, agitation). Use non-opioid analgesics (acetaminophen) scheduled, titrate opioids carefully.",
                psychological_support="Validation therapy, sensory stimulation (music, familiar photos), memory logs, and minimizing environmental stress/noise.",
                spiritual_care="Faith-based routines, soft traditional music, prayer, and reassuring presence from spiritual community members.",
                family_support_plan="Intense caregiver respite support, dementia behavior management education, and long-term planning/support groups.",
                plain_language_summary="Focus on safety, familiar comfort, gentle symptom control, and support for your family caregivers.",
                key_symptoms_to_monitor=json.dumps(["agitation", "confusion", "sleep_disturbance", "wandering", "poor_intake"]),
                red_flag_symptoms=json.dumps(["sudden_extreme_agitation", "fall", "aspiration_choking", "refusal_of_all_fluids"])
            ),
            ConditionCareTemplate(
                condition_name="Cardiovascular",
                condition_keywords=json.dumps(["heart", "cardiac", "cardiovascular", "hypertension", "chf", "coronary", "stroke"]),
                goals_of_care="Manage breathlessness and fluid overload, maintain physical comfort, reduce cardiac workload, and ease patient anxiety.",
                pain_management_plan="Acetaminophen for minor pain. Low-dose opioids (morphine) scheduled to ease dyspnea. Avoid NSAIDs due to fluid retention.",
                psychological_support="Anxiety management, relaxation techniques, and emotional reassurance for patient and family.",
                spiritual_care="Prayer, spiritual counseling, finding hope and connection within their religious framework.",
                family_support_plan="Training on monitoring fluid balance and weight, dietary support (low sodium), and emergency distress management.",
                plain_language_summary="Focus on keeping your breathing easy, managing fluid retention, keeping you calm, and helping your family care for you.",
                key_symptoms_to_monitor=json.dumps(["breathlessness", "edema_swelling", "chest_pain", "fatigue", "weight_gain"]),
                red_flag_symptoms=json.dumps(["severe_chest_pain", "acute_shortness_of_breath", "rapid_weight_gain", "fainting"])
            ),
            ConditionCareTemplate(
                condition_name="Respiratory",
                condition_keywords=json.dumps(["respiratory", "copd", "lung", "pulmonary", "asthma", "bronchitis"]),
                goals_of_care="Relieve breathlessness (dyspnea), manage secretions, reduce anxiety associated with air hunger, and maintain comfort.",
                pain_management_plan="Low-dose opioids (e.g., liquid morphine) for dyspnea and pain. Bronchodilators and low-dose corticosteroids as adjunctive care.",
                psychological_support="Breathing relaxation, anxiety counseling, fan therapy (cool breeze on face), and emotional reassurance.",
                spiritual_care="Spiritual counseling, prayer groups, breathing as a spiritual connection, and reassurance.",
                family_support_plan="Oxygen safety training, dyspnea rescue techniques (positioning, fan, morphine), and caregiver coping skills.",
                plain_language_summary="Focus on helping you breathe comfortably, calming anxiety related to breathing, and teaching your family how to assist you.",
                key_symptoms_to_monitor=json.dumps(["breathlessness", "cough", "secretions", "anxiety", "fatigue"]),
                red_flag_symptoms=json.dumps(["severe_air_hunger", "cyanosis_blue_lips", "hemoptysis_coughing_blood", "extreme_anxiety"])
            ),
            ConditionCareTemplate(
                condition_name="Renal",
                condition_keywords=json.dumps(["renal", "kidney", "nephropathy", "esrd", "dialysis"]),
                goals_of_care="Manage uremic symptoms (pruritus, nausea), maintain fluid balance without aggressive dialysis, and maximize comfort.",
                pain_management_plan="Avoid NSAIDs. Use fentanyl or methadone for severe pain. Acetaminophen for mild pain. Antihistamines for uremic itch.",
                psychological_support="Counseling for transition of treatment goals (e.g. stopping dialysis), depression support, and family conferencing.",
                spiritual_care="Spiritual reconciliation, preparing for transition, prayer, and support from religious community leaders.",
                family_support_plan="Education on uremic symptoms, dietary fluid restriction comfort, and intensive bereavement preparation.",
                plain_language_summary="Focus on relieving itching, nausea, and fluid build-up, and supporting you and your family as care needs change.",
                key_symptoms_to_monitor=json.dumps(["itching", "nausea", "swelling", "confusion", "fatigue"]),
                red_flag_symptoms=json.dumps(["severe_uremic_agitation", "seizure", "severe_fluid_overload_dyspnea", "coma"])
            ),
            ConditionCareTemplate(
                condition_name="General",
                condition_keywords=json.dumps(["general", "frailty", "multimorbidity"]),
                goals_of_care="Provide holistic comfort, manage pain and symptoms, support social, emotional, and spiritual well-being.",
                pain_management_plan="Individualized analgesic titration starting with acetaminophen, escalating to low-dose opioids as indicated.",
                psychological_support="Regular social interaction, peer groups, and emotional support counseling.",
                spiritual_care="Ensure spiritual connection according to patient preferences, quiet time, and prayer.",
                family_support_plan="Family meetings to discuss care goals, training on patient care tasks, and emotional support resources.",
                plain_language_summary="Focus on your total comfort, peace of mind, and helping your family support you.",
                key_symptoms_to_monitor=json.dumps(["pain", "fatigue", "mood_changes", "appetite", "sleep"]),
                red_flag_symptoms=json.dumps(["uncontrolled_pain", "sudden_decline", "inability_to_swallow", "extreme_distress"])
            )
        ]
        
        db.add_all(templates)
        print("Care Templates seeded successfully")

        print("Seeding Community Groups...")
        # Clear existing groups
        db.query(CommunityGroup).delete()
        
        groups = [
            CommunityGroup(name="Cancer Warriors Support", description="A safe space for patients and families navigating oncological care. Share stories, coping strategies, and support.", condition_tags=json.dumps(["cancer"]), member_count=12),
            CommunityGroup(name="Dementia Caregivers & Family Support", description="Connecting family members caring for loved ones with dementia or cognitive decline. Respite tips and peer support.", condition_tags=json.dumps(["dementia"]), member_count=8),
            CommunityGroup(name="Healthy Hearts Circle", description="Support and advice for those living with chronic heart failure or cardiovascular conditions.", condition_tags=json.dumps(["cardiovascular"]), member_count=5),
            CommunityGroup(name="Easy Breathing Network", description="Connect with peers managing COPD, lung cancer, or other respiratory conditions. Breath control and comfort tips.", condition_tags=json.dumps(["respiratory"]), member_count=9),
            CommunityGroup(name="Renal Care Journey", description="A group for kidney patients and their families transitioning to comfort-focused care and symptom control.", condition_tags=json.dumps(["renal"]), member_count=4),
            CommunityGroup(name="General Palliative Fellowship", description="A warm fellowship space open to all patients and family members in our palliative care system.", condition_tags=json.dumps(["general"]), member_count=19)
        ]
        db.add_all(groups)
        print("Community Groups seeded successfully")

        print("Seeding 40 Educational Resources...")
        # Clear existing resources
        db.query(Resource).delete()

        resources_data = [
            # 1-10: Pain and Physical Comfort
            {
                "title": "Understanding Pain Management in Palliative Care",
                "summary": "Learn about the types of pain medication, schedules, and how we target pain to keep you comfortable.",
                "content": "Pain control is a primary goal of palliative care. We use a step-by-step approach: mild pain is treated with non-opioid medications like acetaminophen. Moderate to severe pain may require opioid medications like morphine. Taking pain medications on a regular schedule rather than waiting for pain to become severe is the key to maintaining constant comfort.",
                "category": "Pain Management", "condition_tags": ["general", "cancer", "cardiovascular", "respiratory", "renal"],
                "topic_tags": ["pain", "medication"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Managing Opioid Constipation",
                "summary": "Opioid pain medications cause constipation. Learn how to prevent and manage this side effect.",
                "content": "Almost everyone who takes opioids needs a bowel regimen because opioids slow down the digestive system. Drink fluids, eat high-fiber foods if possible, and take your prescribed laxative daily. Do not wait more than 2 days without a bowel movement before notifying your care team.",
                "category": "Symptom Management", "condition_tags": ["general", "cancer"],
                "topic_tags": ["pain", "constipation"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Breathing Easier: Managing Breathlessness (Dyspnea) at Home",
                "summary": "Practical techniques to ease shortness of breath, including positioning and fan therapy.",
                "content": "Shortness of breath can be frightening. To manage it: 1. Sit upright or lean forward slightly on a table with pillows. 2. Use a small hand fan to blow a cool breeze across your face. 3. Practice pursed-lip breathing (breathe in through nose, out slowly through pursed lips). 4. Take your prescribed low-dose liquid morphine as directed to relax your breathing muscles.",
                "category": "Symptom Management", "condition_tags": ["respiratory", "cardiovascular"],
                "topic_tags": ["breathlessness", "anxiety"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Managing Breathlessness: Positioning (Video Guide)",
                "summary": "Watch how to position pillows and sit to immediately reduce breathlessness.",
                "content": "This video shows the 3 best positions for reducing shortness of breath: high side-lying, forward-lean sitting, and upright sitting with arm support. It also demonstrates how to position a standard table fan for maximum relief.",
                "category": "Symptom Management", "condition_tags": ["respiratory", "cardiovascular"],
                "topic_tags": ["breathlessness"], "format": "video", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Managing Nausea and Appetite Loss",
                "summary": "Tips for managing nausea, vomiting, and loss of appetite in advanced illness.",
                "content": "If you struggle with nausea: 1. Eat small, frequent meals rather than large ones. 2. Choose bland foods (rice, crackers) that are cold or room temperature to minimize odors. 3. Take anti-nausea medications 30 minutes before meals. 4. Maintain good mouth care. Do not force yourself to eat if you feel full or nauseated.",
                "category": "Symptom Management", "condition_tags": ["general", "cancer", "renal"],
                "topic_tags": ["nausea", "nutrition"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Caring for the Skin and Preventing Bedsores",
                "summary": "Guide for caregivers on keeping skin clean, dry, and repositioning to prevent pressure sores.",
                "content": "Bedsores can form quickly on pressure points like the tailbone, heels, and hips. To prevent them: reposition the patient at least every 2 hours. Keep skin clean and moisturized. Use soft pillows to support bony areas. Change wet bedding or pads immediately. Inspect the skin daily for redness.",
                "category": "Physical Comfort", "condition_tags": ["general", "dementia"],
                "topic_tags": ["mobility", "skin"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Fluid Management in Heart Failure and Kidney Disease",
                "summary": "How to manage fluid intake comfortably without causing swelling or breathlessness.",
                "content": "Fluid build-up causes swelling and severe breathlessness. Stay within your recommended fluid limit. Suck on ice chips, hard candy, or rinse your mouth with cold water to relieve thirst. Avoid high-salt foods as they increase thirst and retain water.",
                "category": "Symptom Management", "condition_tags": ["cardiovascular", "renal"],
                "topic_tags": ["swelling", "nutrition"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Dealing with Uremic Itching",
                "summary": "Methods to manage persistent itching in advanced kidney failure.",
                "content": "Uremic pruritus is a common symptom in kidney disease. Keep skin moisturized using thick creams. Keep fingernails short to prevent scratching injuries. Apply cool, damp cloths to itchy areas. Wear loose cotton clothing and take your prescribed antihistamines.",
                "category": "Symptom Management", "condition_tags": ["renal"],
                "topic_tags": ["itching", "skin"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Fatigue and Energy Conservation",
                "summary": "How to balance rest and active moments to get the most out of your day.",
                "content": "Feeling very tired is normal. Plan important activities (like visits) during times when you have the most energy. Perform tasks sitting down rather than standing. Take short rests throughout the day. Delegate chores to family and friends who want to help.",
                "category": "Physical Comfort", "condition_tags": ["general", "cancer", "cardiovascular", "respiratory", "renal"],
                "topic_tags": ["fatigue"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Managing Pain: A Relaxing Audio Guide (Audio)",
                "summary": "Listen to this 10-minute guided breathing and relaxation recording to help manage pain.",
                "content": "This audio guide takes you through a relaxing body scan. By focusing on slow, deep breathing and muscle relaxation, you can help calm the nervous system and reduce the intensity of pain and anxiety.",
                "category": "Pain Management", "condition_tags": ["general"],
                "topic_tags": ["pain", "anxiety"], "format": "audio", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },

            # 11-20: Emotional and Mental Wellbeing
            {
                "title": "Coping with Anxiety and Fear in Advanced Illness",
                "summary": "Strategies for addressing worry, panic, and fear of the future.",
                "content": "Anxiety is a natural response. Try to: 1. Express your feelings to a trusted person. 2. Practice deep, slow breathing. 3. Focus on the present moment rather than worrying about what might happen. 4. Engage in quiet activities like prayer, reading, or listening to music. Don't hesitate to ask your care team for counselling support.",
                "category": "Emotional Support", "condition_tags": ["general"],
                "topic_tags": ["anxiety", "mood"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Sharing Your Story: The Memory Vault",
                "summary": "How to use Project Aura's Memory Vault to record your legacy and share memories.",
                "content": "The Memory Vault is a special place where you can write down memories, record stories, upload photos, or leave messages for your loved ones. It is a powerful way to celebrate your life and pass down your wisdom and family history to the next generation.",
                "category": "Emotional Support", "condition_tags": ["general"],
                "topic_tags": ["legacy", "family"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Dealing with Dementia: Tips for Handling Confusion and Agitation",
                "summary": "Caregiver tips for de-escalating confusion and restlessness in patients with dementia.",
                "content": "When a dementia patient is confused or agitated: 1. Do not argue or try to correct them. 2. Speak in a calm, gentle, reassuring voice. 3. Redirect their attention to a pleasant activity (music, folding towels). 4. Ensure their physical needs (hunger, toilet, pain) are met. Reassure them that they are safe.",
                "category": "Cognitive Support", "condition_tags": ["dementia"],
                "topic_tags": ["confusion", "agitation"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Validation Therapy in Dementia Care (Video)",
                "summary": "A video guide showing how to use validation therapy to connect with dementia patients.",
                "content": "Validation therapy involves accepting the patient's current reality rather than trying to force them into our reality. This video shows real examples of caregivers using validation to successfully de-escalate anxiety and build trust.",
                "category": "Cognitive Support", "condition_tags": ["dementia"],
                "topic_tags": ["confusion"], "format": "video", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Coping with Sadness and Depression",
                "summary": "Recognising the signs of clinical depression and finding support.",
                "content": "It is normal to feel sad, but persistent hopelessness, loss of interest in everything, and withdrawal may indicate depression. Reach out to your clinicians. We can provide counselling, connect you with support groups, or prescribe gentle medications to lift your mood.",
                "category": "Emotional Support", "condition_tags": ["general"],
                "topic_tags": ["mood", "depression"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "A Guide to Journaling for Emotional Peace",
                "summary": "How writing down your thoughts daily can help process heavy emotions.",
                "content": "Journaling is a private way to release feelings of fear, anger, or sadness. You don't need to write long pages  --  even a few sentences about your day, your feelings, or what you are grateful for can relieve stress and bring mental clarity.",
                "category": "Emotional Support", "condition_tags": ["general"],
                "topic_tags": ["mood", "legacy"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Guided Meditative Breathing (Audio)",
                "summary": "Listen to this 5-minute deep breathing meditation for instant anxiety relief.",
                "content": "This audio recording guides you through a rhythmic breathing exercise designed to lower your heart rate and settle an anxious mind. Listen in a quiet, comfortable space.",
                "category": "Emotional Support", "condition_tags": ["general"],
                "topic_tags": ["anxiety", "mood"], "format": "audio", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Caregiver Burnout: Caring for Yourself While Caring for Others",
                "summary": "Identifying signs of caregiver exhaustion and learning how to take breaks.",
                "content": "Caregiver burnout is real and dangerous. Symptoms include chronic fatigue, irritability, and isolation. Remember that you cannot care for others if you don't care for yourself. Ask other family members to step in, take short walks, join a caregiver support group, and accept help.",
                "category": "Caregiver Support", "condition_tags": ["general", "dementia"],
                "topic_tags": ["caregiver_fatigue", "respite"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Preparing for Changes: What to Expect as Illness Advances",
                "summary": "A gentle, plain-language guide on physical changes in the final stages of illness.",
                "content": "As illness advances, the body naturally slows down. Sleeping increases, appetite declines significantly, breathing patterns change, and the patient may withdraw from social interaction. These changes are a normal part of the transition. Focus on keeping the lips moist, gentle touch, and quiet presence.",
                "category": "Transition of Care", "condition_tags": ["general", "cancer", "cardiovascular", "respiratory", "renal"],
                "topic_tags": ["transition", "death"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "detailed"
            },
            {
                "title": "Supporting Children Through a Family Member's Illness",
                "summary": "How to talk to children and support them through a loved one's serious illness.",
                "content": "Children notice when things are wrong. Talk to them honestly in age-appropriate language. Reassure them that they are loved and safe. Encourage them to ask questions, share their drawings, or participate in small, comfortable ways in the patient's care.",
                "category": "Emotional Support", "condition_tags": ["general"],
                "topic_tags": ["family", "grief"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },

            # 21-30: Spiritual and Cultural Support (Ghana context)
            {
                "title": "Finding Spiritual Peace in Hard Times",
                "summary": "Reflections on faith, community, and finding meaning in palliative care.",
                "content": "Palliative care includes spiritual care. Whether you find comfort in church, the mosque, traditional practices, or personal reflection, lean into these resources. Ask your care team to connect you with spiritual leaders who can visit and pray with you.",
                "category": "Spiritual Care", "condition_tags": ["general"],
                "topic_tags": ["spiritual", "peace"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "simple"
            },
            {
                "title": "Faith, Healing, and Palliative Care: A Balanced View",
                "summary": "Understanding that palliative symptom relief can go hand-in-hand with faith and prayer.",
                "content": "In Ghana, faith in divine healing is very strong. Palliative care does not oppose faith; rather, it works alongside it. Medical pain relief helps quiet the body so that you can pray, rest, and find peace. We honor your prayers while working to relieve physical suffering.",
                "category": "Spiritual Care", "condition_tags": ["general"],
                "topic_tags": ["spiritual", "culture"], "format": "article", "language": "en", "is_ghana_specific": True, "difficulty_level": "standard"
            },
            {
                "title": "The Role of Family and Elders in Care Decisions",
                "summary": "Navigating family discussions about care plans and advance directives in Ghana.",
                "content": "Family and community support are central to Ghanaian culture. When making care decisions, it is helpful to involve family elders and key decision-makers early. Be open about your wishes regarding comfort care, pain management, and where you prefer to be cared for.",
                "category": "Social & Family", "condition_tags": ["general"],
                "topic_tags": ["family", "culture"], "format": "article", "language": "en", "is_ghana_specific": True, "difficulty_level": "standard"
            },
            {
                "title": "Traditional Prayers and Songs for Comfort (Audio)",
                "summary": "Listen to a selection of comforting traditional hymns and prayers.",
                "content": "This audio recording features gentle traditional choral music, calming scriptures, and comforting prayers to bring peace, quiet reflection, and spiritual strength to your home.",
                "category": "Spiritual Care", "condition_tags": ["general"],
                "topic_tags": ["spiritual"], "format": "audio", "language": "en", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Honoring Cultural Death and Bereavement Customs",
                "summary": "How Project Aura supports families with funeral planning and cultural customs.",
                "content": "We understand the importance of traditional funeral customs and community mourning. Our bereavement team helps families navigate the initial steps after a loss, coordinate with community leaders, and manage the transition with respect for your specific family and cultural practices.",
                "category": "Spiritual Care", "condition_tags": ["general"],
                "topic_tags": ["death", "grief", "culture"], "format": "article", "language": "en", "is_ghana_specific": True, "difficulty_level": "standard"
            },
            {
                "title": "Community-Based Bereavement Networks",
                "summary": "Find local grief support groups and community widows/widowers networks in Ghana.",
                "content": "No one should walk the path of grief alone. We partner with local religious and community groups that hold regular bereavement meetings. These groups provide a safe space to share stories, find mutual support, and receive counsel from trained peer leaders.",
                "category": "Spiritual Care", "condition_tags": ["general"],
                "topic_tags": ["grief", "family"], "format": "article", "language": "en", "is_ghana_specific": True, "difficulty_level": "standard"
            },
            {
                "title": "Understanding Advance Directives and Living Wills",
                "summary": "A clear guide on how to document your medical wishes for future comfort care.",
                "content": "An advance directive is a document that states your preferences for medical treatment if you become unable to speak for yourself. It covers your preferences on resuscitation (DNR), tube feeding, and where you want to spend your final days. Share this document with your primary clinician.",
                "category": "Transition of Care", "condition_tags": ["general"],
                "topic_tags": ["directives", "family"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "detailed"
            },
            {
                "title": "DNR (Do Not Resuscitate) Orders Explained",
                "summary": "Understanding why choosing comfort over chest compressions is appropriate in advanced illness.",
                "content": "A DNR order tells medical staff not to perform CPR if your breathing or heart stops. In advanced illness, CPR is rarely successful and can cause painful injuries (like broken ribs). A DNR ensures a peaceful, natural, and pain-free transition of life.",
                "category": "Transition of Care", "condition_tags": ["general"],
                "topic_tags": ["directives"], "format": "article", "language": "en", "is_ghana_specific": False, "difficulty_level": "standard"
            },
            {
                "title": "Ghana Palliative Care Association (GPCA) Contact Guide",
                "summary": "Official support hotlines and contacts for the GPCA and regional clinics.",
                "content": "The Ghana Palliative Care Association provides resources, care coordination, and support services across Ghana. Contact their hotline at +233 (0) 302 999 888 for guidance on accessing local palliative nursing services, medication supplies, and home visits.",
                "category": "Ghanaian Resources", "condition_tags": ["general"],
                "topic_tags": ["hotline", "clinics"], "format": "hotline", "language": "en", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "National Health Insurance Scheme (NHIS) and Palliative Care",
                "summary": "A guide on what palliative medications and services are covered under NHIS in Ghana.",
                "content": "Under the NHIS, several essential pain management medications and clinic consultation fees are fully covered. Learn how to verify your active NHIS status, submit claims for palliative care consultations, and access covered generic medications at participating regional facilities.",
                "category": "Ghanaian Resources", "condition_tags": ["general"],
                "topic_tags": ["nhis", "medication"], "format": "article", "language": "en", "is_ghana_specific": True, "difficulty_level": "standard"
            },

            # 31-40: Local Languages (Twi, Ga, Ewe)
            {
                "title": "Nteaseɛ wɔ Yareɛ mu Ahoyere Ho (Twi Article)",
                "summary": "Snea yɛhwɛ yadeɛ mu ahoyere ne ɛyadeɛ mu yaw so wɔ fie anaa ayaresabea.",
                "content": "Yaw koɛ ne yadeɛ mu ahoyere yɛ asɛm kɛseɛ wɔ palliative care mu. Yɛde nnuruyɛ beberee di yaw ne ahoyere ho dwuma snea ɛbɛyɛ a yarefoɔ bɛnya ahomgyeɛ kɛseɛ. Sɛ wowɔ yaw biara a, ka kyerɛ wo dɔkota anaa nɛɛse ntempa.",
                "category": "Pain Management", "condition_tags": ["general"],
                "topic_tags": ["pain", "medication"], "format": "article", "language": "tw", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Snea Wote Nkabom ne Komamyɛ (Twi Audio)",
                "summary": "Tie asɛm kyerɛe ne mpaebɔ a ɛbɛma wo koma atɔ wo yam wɔ yareɛ mu.",
                "content": "Tie saa ndwom ne mpaebɔ yi snea ɛbɛma wo koma adwo, na woanya ahoɔden ne nkuranhyɛ kɛseɛ wɔ wo yareɛ yi mu. Ahomgyeɛ beberee gu wo ho.",
                "category": "Spiritual Care", "condition_tags": ["general"],
                "topic_tags": ["spiritual", "anxiety"], "format": "audio", "language": "tw", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Nuumɔ Ke Efeemɔ Kpakpa Yɛ Hela Mli (Ga Article)",
                "summary": "Bɔni wɔyaa hela mli yaw kɛ hela mli shihɛlɛ heha helefoi kɛ amɛ wekumɛi.",
                "content": "Hela mli yaw tsabaa kɛ ahomgyeɛ yɛ shihɛlɛ ko ni he hiaa waa. Wɔnuɔ yaw mli, ni wɔfeɔ nɔni he hiaa fɛɛ bɔni afee ni shihɛlɛ mli hejɔlɛ kɛ hefɛɛlɛ ahe helatɛlɛ lɔ.",
                "category": "Pain Management", "condition_tags": ["general"],
                "topic_tags": ["pain"], "format": "article", "language": "ga", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Gbedodoɗa Kple Akɔfafa Na Dɔnɔwo (Ewe Article)",
                "summary": "Aleke dɔnɔwo kple woƒe ƒometɔwo woakpɔ dzidzeme kple akɔfafa le dɔlélé me.",
                "content": "Dɔlélé kple vevesese mekpɔna ahom kple dzidzeme gake Mawu ƒe lɔlɔ̃ kple dɔda nutsirinuwo akpe ɖe wo ŋu. Míaƒe dɔdalawo kple dɔnɔdzikpɔlawo le klalo be woakpe ɖe wo ŋu le ɣeyiɣi sia me.",
                "category": "Pain Management", "condition_tags": ["general"],
                "topic_tags": ["pain", "spiritual"], "format": "article", "language": "ee", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Dementia: Akɔfafa ne Nteaseɛ ma Abusua (Twi Video)",
                "summary": "Hwɛ snea yɛhwɛ yarefoɔ a ɔwɔ adwene mu ahabadeɛ anaa dementia wɔ fie.",
                "content": "Saa video yi kyerɛ abusuafoɔ snea yɛhwɛ yarefoɔ a n'adwene reyera (dementia) anaa adwene mu ɔhaw ahorow a ɛba. Ɛbɛboa wo ma woahu snea wobɛkasa akyerɛ wɔn, na woadwo wɔn koma.",
                "category": "Cognitive Support", "condition_tags": ["dementia"],
                "topic_tags": ["confusion", "agitation"], "format": "video", "language": "tw", "is_ghana_specific": True, "difficulty_level": "standard"
            },
            {
                "title": "Korle Bu Palliative Care Centre Support (Hotline)",
                "summary": "Direct clinical hotline for Korle Bu Teaching Hospital Palliative Centre.",
                "content": "For specialized palliative nursing support, medical consultations, and home care visits in Accra, call the Korle Bu Palliative Care Centre coordinator directly at +233 (0) 503 111 222. Operating hours: Monday to Friday, 8:00 AM to 5:00 PM.",
                "category": "Ghanaian Resources", "condition_tags": ["general"],
                "topic_tags": ["hotline", "clinics"], "format": "hotline", "language": "en", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Komfo Anokye Teaching Hospital Palliative Clinic (Hotline)",
                "summary": "Direct support hotline for KATH Palliative Clinic in Kumasi.",
                "content": "For patients in the Ashanti Region and northern sector, contact KATH Palliative Clinic at +233 (0) 545 444 333 for home care visit requests, opioid prescription refills, and family counseling bookings.",
                "category": "Ghanaian Resources", "condition_tags": ["general"],
                "topic_tags": ["hotline", "clinics"], "format": "hotline", "language": "en", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Wɔn a Wɔrehwɛ Yarefoɔ Yiedie (Twi Article)",
                "summary": "Snea abusuafoɔ a wɔrehwɛ yarefoɔ bɛhwɛ wɔn ho so yie wɔ fie.",
                "content": "Yarefoɔ hwɛ yɛ adwuma a ɛyɛ den nanso yɛbɛboa wo. Hwɛ wo ho so yie: da beberee, di nduane pa, na hwɛ sɛ wobɛnya ahomgyeɛ kakra. Nya ahotosoɔ sɛ wo reyɛ adwuma pa ampa.",
                "category": "Caregiver Support", "condition_tags": ["general"],
                "topic_tags": ["caregiver_fatigue", "respite"], "format": "article", "language": "tw", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Nuurɔtsii Kpakpa kɛ hejɔlɛ yɛ weku mli (Ga Audio)",
                "summary": "Tie hejɔlɛ lala kɛ nuurɔtsii ni tsabaa hela mli shihɛlɛ he.",
                "content": "Lala kpakpa ni baaha wekumɛi fɛɛ hejɔlɛ kɛ akɔfafa yɛ shihɛlɛ fɛɛ shihɛlɛ mli. Ebaaha helefoɔ hewolo kɛ adwene fɛɛ hejɔlɛ mli.",
                "category": "Spiritual Care", "condition_tags": ["general"],
                "topic_tags": ["spiritual"], "format": "audio", "language": "ga", "is_ghana_specific": True, "difficulty_level": "simple"
            },
            {
                "title": "Ghana Hospice and Palliative Care Association Information (PDF)",
                "summary": "Download the official patient advocacy handbook and guide.",
                "content": "This downloadable guide details the national standards of palliative care, directory of all registered hospices, medication access rights under the National Essential Medicines List, and legal templates for advance care planning.",
                "category": "Ghanaian Resources", "condition_tags": ["general"],
                "topic_tags": ["directives", "clinics"], "format": "pdf", "language": "en", "is_ghana_specific": True, "difficulty_level": "detailed"
            }
        ]

        # Bulk save
        for r_dict in resources_data:
            r = Resource(
                title=r_dict["title"],
                summary=r_dict["summary"],
                content=r_dict["content"],
                category=r_dict["category"],
                condition_tags=json.dumps(r_dict["condition_tags"]),
                topic_tags=json.dumps(r_dict["topic_tags"]),
                format=r_dict["format"],
                language=r_dict["language"],
                is_ghana_specific=r_dict["is_ghana_specific"],
                difficulty_level=r_dict["difficulty_level"],
                is_published=True,
                helpful_count=0,
                view_count=0,
                created_at=datetime.utcnow()
            )
            db.add(r)
        
        db.commit()
        print("40 Educational Resources seeded successfully")
        print("Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
