"""
Seed all missing data: community groups, resources, and ensure DB tables exist.
Run: python seed_all_data.py
"""
import sqlite3
import json
from datetime import datetime

DB = "aura.db"
conn = sqlite3.connect(DB)
cur = conn.cursor()

# ─── COMMUNITY GROUPS ─────────────────────────────────────────────────────────
print("Seeding community groups...")
cur.execute("DELETE FROM community_groups")
groups = [
    ("Cancer Support Circle", "A compassionate space for cancer patients and families to share experiences, ask questions, and support each other through the journey.", '["cancer","oncology","chemotherapy"]', 1),
    ("Heart & Lung Conditions", "Support for patients and families living with heart failure, COPD, and other cardiorespiratory conditions.", '["heart failure","copd","cardiac","respiratory"]', 1),
    ("Neurological Conditions", "Community for those affected by dementia, Parkinson's, MND, stroke, and other neurological conditions.", '["dementia","parkinsons","stroke","mnd","als","neurological"]', 1),
    ("Caregivers Connect", "A dedicated space for caregivers and family members to share their experiences, find support, and reduce burnout.", '["caregiver","carer","family","burnout"]', 1),
    ("Grief & Bereavement", "A gentle, supportive space for those experiencing loss and grief at any stage.", '["grief","bereavement","loss","mourning"]', 1),
    ("Chronic Illness Living", "For those living with long-term conditions including kidney disease, HIV, sickle cell, and others.", '["chronic","kidney","hiv","sickle cell","long-term"]', 1),
    ("Spiritual & Faith Support", "An open group exploring faith, spirituality, and meaning in the context of serious illness.", '["spiritual","faith","religion","meaning","prayer"]', 1),
    ("Young Adults & Palliative Care", "For patients and families under 45 navigating serious illness  --  unique challenges, shared journeys.", '["young adult","young","under 45"]', 1),
    ("Ghana Palliative Community", "A group specifically for patients, families and clinicians in Ghana  --  local resources, local context, local support.", '["ghana","accra","kumasi","local"]', 1),
    ("Pain Management Support", "Sharing strategies, experiences and encouragement for managing chronic and cancer-related pain.", '["pain","chronic pain","opioid","morphine"]', 1),
]
for name, desc, tags, active in groups:
    cur.execute("""
        INSERT INTO community_groups (name, description, condition_tags, is_active, member_count, created_at)
        VALUES (?,?,?,?,0,?)
    """, (name, desc, tags, active, datetime.utcnow().isoformat()))
print(f"  Inserted {len(groups)} community groups")

# ─── RESOURCES ────────────────────────────────────────────────────────────────
print("Seeding educational resources...")
cur.execute("DELETE FROM resources")
resources = [
    # Pain management
    ("Understanding Pain in Palliative Care", "pain_management", "article",
     "A clear guide to understanding different types of pain and how they are managed in palliative care.",
     "Pain is one of the most common and feared symptoms in serious illness. The good news is that with modern palliative care, most pain can be well controlled...",
     '["cancer","chronic pain","pain management"]', '["pain","opioids","who ladder"]', "en", 1, 1),
    ("WHO Pain Ladder Explained", "pain_management", "article",
     "Step-by-step guide to the World Health Organization analgesic ladder  --  the gold standard for cancer pain.",
     "The WHO Pain Ladder has three steps: Step 1 for mild pain (paracetamol, NSAIDs), Step 2 for moderate pain (tramadol, codeine), Step 3 for severe pain (morphine)...",
     '["cancer","pain management"]', '["pain","morphine","tramadol","paracetamol"]', "en", 1, 1),
    ("Opioid Myths and Facts", "pain_management", "article",
     "Dispelling common fears about morphine and opioid pain medications in palliative care.",
     "Many patients and families fear opioids because of myths about addiction and hastening death. The reality is very different...",
     '["cancer","pain"]', '["opioids","morphine","addiction","myths"]', "en", 1, 1),
    # Mental health
    ("Managing Anxiety and Fear", "mental_health", "article",
     "Practical strategies for managing anxiety, fear and worry when living with serious illness.",
     "Anxiety is a natural response to facing serious illness. There are many effective ways to manage it  --  both psychological and medication-based...",
     '["cancer","heart failure","chronic illness"]', '["anxiety","fear","breathing","meditation"]', "en", 1, 1),
    ("Depression in Serious Illness", "mental_health", "article",
     "Understanding and treating depression in the context of life-limiting illness.",
     "Depression affects 30-40% of people with serious illness. It is not 'just understandable sadness'  --  it is treatable and deserves attention...",
     '["cancer","chronic illness","palliative"]', '["depression","phq9","sertraline","counselling"]', "en", 1, 1),
    ("Talking to Your Family About Your Illness", "mental_health", "guide",
     "Guidance on having difficult conversations with family members about your diagnosis and wishes.",
     "Starting these conversations is hard but important. This guide provides approaches that work across different family dynamics and cultural contexts...",
     '["palliative","family","communication"]', '["family","communication","advance care planning"]', "en", 1, 1),
    # Nutrition
    ("Eating Well When You Have Little Appetite", "nutrition", "article",
     "Practical nutrition guidance for people with cancer-related appetite loss and cachexia.",
     "Loss of appetite is very common in serious illness. The approach to nutrition in palliative care is different from standard healthy eating advice...",
     '["cancer","cachexia","appetite"]', '["nutrition","appetite","cachexia","meals"]', "en", 1, 1),
    ("Managing Nausea and Eating", "nutrition", "article",
     "How to maintain nutrition when nausea makes eating difficult.",
     "Nausea can make eating very challenging. There are practical strategies that help, and anti-nausea medications are very effective...",
     '["cancer","chemotherapy","nausea"]', '["nausea","vomiting","diet","ginger"]', "en", 1, 1),
    # Spiritual care
    ("Finding Meaning in Difficult Times", "spiritual_care", "article",
     "Exploring questions of meaning, purpose and spiritual peace during serious illness.",
     "Many people with serious illness find themselves grappling with profound questions: Why is this happening? What matters most? What will I leave behind?...",
     '["palliative","spiritual","meaning"]', '["spirituality","meaning","legacy","faith"]', "en", 1, 1),
    ("Faith and Serious Illness", "spiritual_care", "article",
     "How faith communities and spiritual practices support people through serious illness  --  Ghana context.",
     "In Ghana, faith is central to most people's lives. Christianity, Islam, and traditional practices all offer resources for those facing serious illness...",
     '["spiritual","ghana","faith"]', '["faith","church","prayer","imam","pastor"]', "en", 1, 1),
    # Ghana resources
    ("Palliative Care Services in Ghana", "ghana_resources", "guide",
     "A guide to palliative care services, hospices, and support organisations available in Ghana.",
     "Ghana has a growing palliative care system. Key resources include Korle Bu Teaching Hospital, Komfo Anokye Teaching Hospital, and various NGO services...",
     '["ghana","palliative care","services"]', '["ghana","korle bu","accra","kumasi","services"]', "en", 1, 1),
    ("Ghana Emergency Contacts", "ghana_resources", "guide",
     "Essential emergency and support contacts for patients and families in Ghana.",
     "National Ambulance Service: 193. Mental Health Authority: 0800-111-011. Befrienders Ghana: 0244-846-472. Korle Bu ER: 0302-665-401...",
     '["ghana","emergency","contacts"]', '["emergency","hotline","ambulance","ghana"]', "en", 1, 1),
    ("NHIS and Medication Access in Ghana", "ghana_resources", "article",
     "Understanding what medications are available through the National Health Insurance Scheme in Ghana.",
     "The NHIS covers essential medicines but there are gaps in access to some palliative care medications, especially opioids. This guide explains what to expect...",
     '["ghana","nhis","medications","morphine"]', '["nhis","insurance","medications","access"]', "en", 1, 1),
    # Caregiver
    ("Caregiver Self-Care Guide", "mental_health", "guide",
     "A practical guide to preventing and managing caregiver burnout.",
     "Caring for someone with serious illness is one of the most demanding roles there is. Your wellbeing matters too  --  this is not selfish, it is essential...",
     '["caregiver","burnout","family"]', '["caregiver","burnout","self-care","respite"]', "en", 1, 1),
    ("Preparing for End of Life", "spiritual_care", "guide",
     "A compassionate guide for families preparing for the end of their loved one's life.",
     "Knowing what to expect at end of life helps reduce fear and allows families to focus on what matters  --  presence, love, and saying what needs to be said...",
     '["palliative","end of life","family"]', '["end of life","death","dying","family"]', "en", 1, 1),
]

for (title, cat, fmt, summary, content, cond_tags, topic_tags, lang, published, ghana) in resources:
    cur.execute("""
        INSERT INTO resources (title, category, format, summary, content, condition_tags, topic_tags,
            language, is_published, is_ghana_specific, helpful_count, view_count, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,0,0,?)
    """, (title, cat, fmt, summary, content, cond_tags, topic_tags, lang, published, 
          1 if cat == "ghana_resources" else ghana, datetime.utcnow().isoformat()))

print(f"  Inserted {len(resources)} resources")

# ─── MESSAGING TABLES CHECK ────────────────────────────────────────────────────
print("Checking messaging tables...")
for tbl in ("conversations","conversation_participants","messages","message_reads","message_reactions"):
    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", (tbl,))
    exists = cur.fetchone()[0]
    print(f"  {tbl}: {'✅ exists' if exists else '❌ MISSING'}")

# ─── VERIFY BEREAVEMENT TABLES ─────────────────────────────────────────────────
print("Checking bereavement tables...")
for tbl in ("bereavement_screening","grief_journal","post_death_schedule"):
    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", (tbl,))
    exists = cur.fetchone()[0]
    print(f"  {tbl}: {'✅ exists' if exists else '❌ MISSING'}")

conn.commit()
conn.close()
print("\nDone! All data seeded.")
