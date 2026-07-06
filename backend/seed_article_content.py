"""
seed_article_content.py
=======================
Enriches existing article resources with fuller, readable content.
Run:  python seed_article_content.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from src.db import SessionLocal, Resource

CONTENT = {
    "Understanding Pain in Palliative Care": """
UNDERSTANDING PAIN IN PALLIATIVE CARE
======================================

Pain is one of the most common and feared symptoms in serious illness. The good news is that with modern palliative care, most pain can be well controlled.

TYPES OF PAIN
-------------
- Nociceptive pain  --  caused by tissue damage (e.g. from a tumour pressing on organs). Often described as aching or throbbing.
- Neuropathic pain  --  caused by nerve damage. Often described as burning, shooting, or tingling.
- Visceral pain  --  from internal organs. Often cramping or poorly localised.
- Bone pain  --  from metastases or inflammation. Often worse with movement.

THE WHO PAIN LADDER
--------------------
The World Health Organisation recommends a stepwise approach:
Step 1: Mild pain → Non-opioid medicines (paracetamol, NSAIDs)
Step 2: Moderate pain → Mild opioids (codeine, tramadol)
Step 3: Severe pain → Strong opioids (morphine, oxycodone)

At each step, adjuvant medicines (e.g. steroids, antidepressants for nerve pain) can be added.

HOW TO DESCRIBE YOUR PAIN
---------------------------
Tell your care team:
- Where does it hurt? Does it spread anywhere?
- How strong is it? (0 = no pain, 10 = worst imaginable)
- What does it feel like? (aching, burning, stabbing)
- What makes it better or worse?
- How does it affect your daily life  --  sleep, appetite, mood?

WHAT TO EXPECT FROM PAIN MEDICINES
------------------------------------
- Medicines should be taken regularly (not just when pain is bad)
- Breakthrough doses are available for sudden flares
- Side effects like constipation and nausea are manageable
- Physical dependence is not the same as addiction
- Your team will review and adjust your medicines regularly

WHEN TO CONTACT YOUR CARE TEAM
--------------------------------
Contact your palliative care team if:
- Pain is not controlled within 24-48 hours of starting treatment
- You are experiencing side effects
- You have new or different pain
- You are unable to swallow your medicines

Remember: You have the right to be comfortable. Always tell your nurse or doctor if your pain is not controlled.
""".strip(),

    "WHO Pain Ladder Explained": """
THE WHO ANALGESIC LADDER  --  A PATIENT GUIDE
===========================================

The WHO Analgesic Ladder is the global standard for managing cancer pain. It was developed in 1986 and has been used worldwide to provide effective, affordable pain relief.

STEP 1  --  MILD PAIN (Score 1-3 out of 10)
------------------------------------------
Medicines: Paracetamol (acetaminophen) and/or NSAIDs (ibuprofen, diclofenac)
- Paracetamol: up to 4g per day (1g every 6 hours)
- NSAIDs should be taken with food to protect the stomach
- Adjuvants may be added (e.g. corticosteroids for inflammation)

STEP 2  --  MODERATE PAIN (Score 4-6 out of 10)
----------------------------------------------
Medicines: Weak opioids such as codeine or tramadol
- Often combined with paracetamol (e.g. co-codamol)
- Common side effects: constipation, nausea, drowsiness
- Always take a laxative alongside opioids to prevent constipation

STEP 3  --  SEVERE PAIN (Score 7-10 out of 10)
---------------------------------------------
Medicines: Strong opioids  --  morphine is the gold standard
- Available as immediate-release (4-hourly) or modified-release (12-hourly) tablets
- Liquid morphine is available if swallowing is difficult
- Syringe drivers (continuous infusion) can be used for patients who cannot swallow
- Fentanyl patches provide 72-hour pain relief through the skin

KEY PRINCIPLES
---------------
✓ By the clock  --  take medicines at regular intervals, not just when pain returns
✓ By the ladder  --  use the appropriate step for pain severity
✓ By the mouth  --  oral medicines are preferred when possible
✓ For the individual  --  adjust doses based on your pain response

COMMON CONCERNS ABOUT MORPHINE
--------------------------------
"Will I become addicted?"
Using morphine for pain relief under medical supervision is not addiction. Psychological dependence on opioids for pain relief is very rare.

"Does morphine mean I am dying soon?"
No. Morphine is used at all stages of serious illness to control pain and improve quality of life.

"Will morphine make me confused?"
Some people experience mild drowsiness when starting morphine. This usually settles within a few days.
""".strip(),

    "Managing Anxiety and Fear": """
MANAGING ANXIETY AND FEAR IN SERIOUS ILLNESS
============================================

It is completely normal to feel anxious or afraid when facing a serious illness. These feelings can affect your sleep, appetite, relationships, and overall quality of life.

UNDERSTANDING ANXIETY IN PALLIATIVE CARE
-----------------------------------------
Anxiety often includes:
- Worry about the future, death, or leaving loved ones
- Fear of pain or loss of control
- Uncertainty about treatment
- Concerns about being a burden
- Existential questions about meaning and purpose

Physical symptoms of anxiety include: racing heart, shortness of breath, trembling, sweating, poor sleep, and difficulty concentrating.

WHAT HELPS
-----------
1. TALKING
   - Speak with your palliative care nurse or doctor
   - Ask for a referral to a counsellor or psychologist
   - Share your fears with trusted family or friends
   - Chaplaincy and spiritual care can help with existential worries

2. RELAXATION TECHNIQUES
   - Slow, deep breathing (inhale 4 counts, hold 4, exhale 6)
   - Progressive muscle relaxation
   - Guided imagery and visualisation
   - Gentle movement such as seated yoga or tai chi

3. MINDFULNESS
   - Focus on the present moment rather than future worries
   - Apps such as Headspace or Calm offer guided sessions
   - Even 5 minutes per day can reduce anxiety levels

4. PRACTICAL STEPS
   - Write down your worries  --  this can help externalise them
   - Break large problems into small manageable steps
   - Plan ahead for things that feel uncertain

5. MEDICINES
   - Short-acting benzodiazepines (e.g. lorazepam) for acute anxiety attacks
   - Antidepressants for persistent anxiety disorder
   - Your care team can help balance benefits and side effects

WHEN TO SEEK HELP URGENTLY
---------------------------
Contact your care team if anxiety is:
- Stopping you from sleeping most nights
- Causing panic attacks
- Stopping you from eating or leaving the house
- Accompanied by thoughts of self-harm

YOU ARE NOT ALONE. Your palliative care team is there to support your emotional as well as physical wellbeing.
""".strip(),

    "Depression in Serious Illness": """
DEPRESSION IN SERIOUS ILLNESS  --  WHAT YOU NEED TO KNOW
======================================================

Depression is not a sign of weakness or a failure to cope. It is a common and treatable condition that affects many people living with serious illness.

HOW IS DEPRESSION DIFFERENT FROM SADNESS?
------------------------------------------
Feeling sad or low after a serious diagnosis is a natural response. Depression is different  --  it persists for weeks, affects most areas of life, and does not lift on its own.

SIGNS OF DEPRESSION
--------------------
- Feeling hopeless, worthless, or empty most of the time
- Loss of interest in people or activities you used to enjoy
- Significant changes in appetite or weight
- Sleep disturbance (too much or too little)
- Fatigue and loss of energy
- Difficulty concentrating or making decisions
- Persistent thoughts of death or suicide

Note: Some symptoms (fatigue, weight loss, sleep problems) overlap with illness itself. Your care team is trained to identify depression despite this.

EFFECTIVE TREATMENTS
---------------------
1. TALKING THERAPIES
   - Cognitive Behavioural Therapy (CBT) is effective and evidence-based
   - Problem-solving therapy helps with practical worries
   - Dignity therapy helps people find meaning and legacy
   - Supportive counselling provides a safe space to express feelings

2. ANTIDEPRESSANT MEDICINES
   - SSRIs (e.g. sertraline, citalopram) are commonly used
   - They take 2-4 weeks to reach full effect
   - Side effects are usually mild and temporary
   - They are not addictive

3. SOCIAL SUPPORT
   - Connecting with community and support groups
   - Regular contact with family and friends
   - Volunteering or light activity if possible

4. SPIRITUAL AND EXISTENTIAL SUPPORT
   - Chaplaincy, faith leaders, or meditation
   - Dignity therapy to document life stories and values

IF YOU ARE HAVING THOUGHTS OF SUICIDE
--------------------------------------
Please tell a member of your care team immediately. You will not be judged. Help is available.

In Ghana: Mental Health Authority Helpline  --  0800-111-011 (free, 24 hours)
""".strip(),

    "Eating Well When You Have Little Appetite": """
EATING WELL WHEN YOU HAVE LITTLE APPETITE
==========================================

Loss of appetite (anorexia) is very common in serious illness. It can be caused by the illness itself, medicines, pain, anxiety, or treatment side effects.

WHY NUTRITION MATTERS
----------------------
Good nutrition can:
- Maintain your strength and energy
- Support your immune system
- Improve mood and concentration
- Help you cope better with treatment
- Preserve muscle mass and physical function

PRACTICAL TIPS FOR POOR APPETITE
----------------------------------
1. EAT LITTLE AND OFTEN
   Instead of three large meals, try 5-6 small snacks or meals throughout the day. Your stomach may feel full very quickly.

2. CHOOSE ENERGY-DENSE FOODS
   When you can only eat small amounts, make every mouthful count:
   - Full-fat dairy (milk, cheese, yoghurt)
   - Nuts, nut butters, and seeds
   - Avocado
   - Eggs
   - Fortified cereals and smoothies

3. DRINK NOURISHING LIQUIDS
   If solid food feels difficult, try:
   - Milk-based drinks and milkshakes
   - Fruit smoothies with added protein powder
   - Oral nutritional supplements (e.g. Ensure, Complan)  --  available on prescription

4. MAKE MEALTIMES PLEASANT
   - Eat with others when possible
   - Use attractive crockery and presentation
   - Small portions look less daunting on a smaller plate
   - Eat at your best time of day (often morning)

5. MANAGE SYMPTOMS THAT AFFECT EATING
   - Nausea: ginger tea, small bland meals, anti-nausea medicines
   - Taste changes: try cold or room-temperature foods, experiment with flavours
   - Dry mouth: sip water frequently, try sugar-free gum
   - Sore mouth: soft foods, avoid acidic or spicy items

6. TALK TO A DIETITIAN
   Your palliative care team can refer you to a dietitian who will create a personalised plan.

WHEN APPETITE CANNOT BE IMPROVED
----------------------------------
In advanced illness, the body naturally reduces its need for food. This is a normal part of the dying process and does not cause suffering. Your team will guide you and your family through this.
""".strip(),

    "Finding Meaning in Difficult Times": """
FINDING MEANING AND PURPOSE IN DIFFICULT TIMES
===============================================

Facing serious illness often raises profound questions: Why is this happening? What matters most? What will I leave behind? These are spiritual and existential questions  --  they do not require religious answers.

WHAT IS MEANING-MAKING?
------------------------
Meaning-making is the process of finding value, purpose, or significance even in the most difficult circumstances. Research shows that people who find meaning in their experience cope better, experience less depression, and report better quality of life.

SOURCES OF MEANING
-------------------
Different people find meaning in different places:
- RELATIONSHIPS  --  time with loved ones, reconciliation, saying what needs to be said
- LEGACY  --  what you will leave behind: memories, wisdom, creative work, impact
- ACHIEVEMENT  --  reflecting on what you have accomplished and contributed
- SPIRITUAL BELIEFS  --  faith, prayer, connection to something larger than oneself
- NATURE  --  beauty, seasons, the natural world
- CREATIVITY  --  art, music, writing, gardening, cooking
- SERVICE  --  helping others, even in small ways

DIGNITY THERAPY
----------------
Dignity Therapy is a brief counselling approach developed for people with life-limiting illness. It involves a recorded interview exploring:
- What has mattered most in your life
- Things you are most proud of
- What you want loved ones to remember
- Words of wisdom you would pass on

The interview is transcribed into a document  --  a "generativity document"  --  that becomes a lasting legacy for your family.

PRACTICAL STEPS
----------------
- Write letters to people who matter to you
- Record voice or video messages
- Create a memory box with photographs and meaningful objects
- Share your life story through conversation or journaling
- Plant something, build something, teach something

SPIRITUAL CARE
---------------
Our palliative care chaplain and spiritual care team provide support regardless of your faith tradition or beliefs. You do not need to be religious to benefit from spiritual care.

"It's not the years in your life that count. It's the life in your years."  --  Abraham Lincoln
""".strip(),
}


def main():
    db = SessionLocal()
    updated = 0
    for r in db.query(Resource).filter(Resource.format.in_(["article", "guide"])).all():
        new_content = CONTENT.get(r.title)
        if new_content:
            r.content = new_content
            print(f"  Updated: {r.title[:60]}")
            updated += 1
    db.commit()
    db.close()
    print(f"\nUpdated {updated} resources with full content.")


if __name__ == "__main__":
    main()
