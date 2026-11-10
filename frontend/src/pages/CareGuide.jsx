/**
 * CareGuide — Clinical Protocol Reference
 *
 * Layout model: physical Oxford Handbook / BNF digitalised.
 *
 * Grid: 220px sticky left nav | 1fr reading column.
 *
 * Nav: chapter list. Click = select protocol. Active highlighted.
 *
 * Reading column: title line, then sections listed top-to-bottom.
 * Every section is ALWAYS visible — no accordion, no click-to-expand.
 * Each section = small-caps heading + tight clinical prose. That's it.
 * Key dosing lines get a distinct monospace / tabular treatment so a
 * clinician can scan to the number in under 2 seconds.
 *
 * Zero decorative chrome inside the reading pane.
 * Colour is used only for the left-border accent on the active chapter.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Heart, AlertCircle, Users, Utensils, Phone,
  Brain, Pill, Star, Search, Printer, ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

/* ── Colour accent per chapter ───────────────────────────────────────────── */
/* Used ONLY for: left border on active nav item, section heading underline  */
/* Nowhere else.                                                              */

/* ── All protocol content ────────────────────────────────────────────────── */
const PROTOCOLS = [
  {
    id: 'pain', title: 'Pain Management', icon: Heart, accent: '#dc2626',
    tag: 'Core Protocol',
    sections: [
      {
        id: 'analgesic-ladder',
        heading: 'WHO Analgesic Ladder',
        quickRef: 'Step 1 · Step 2 · Step 3',
        body: [
          { type: 'subhead', text: 'Step 1 — Mild pain (NRS 1–3)' },
          { type: 'dose', text: 'Paracetamol 1 g every 6 h (max 4 g/day)' },
          { type: 'dose', text: 'Ibuprofen 400 mg every 8 h with food' },
          { type: 'note', text: 'Avoid NSAIDs: renal impairment · GI bleeding risk · cardiovascular disease' },
          { type: 'subhead', text: 'Step 2 — Moderate pain (NRS 4–6)' },
          { type: 'dose', text: 'Tramadol 50–100 mg every 6 h (max 400 mg/day)' },
          { type: 'dose', text: 'OR Codeine 30–60 mg every 4–6 h + paracetamol base' },
          { type: 'text', text: 'Add adjuvants if neuropathic component suspected.' },
          { type: 'subhead', text: 'Step 3 — Severe pain (NRS 7–10)' },
          { type: 'dose', text: 'Morphine 5–10 mg oral every 4 h (immediate release)' },
          { type: 'dose', text: 'OR Slow-release morphine 10–30 mg every 12 h' },
          { type: 'dose', text: 'Breakthrough dose = 1/6 of total daily opioid dose' },
          { type: 'text', text: 'Titrate every 24–48 h until controlled.' },
          { type: 'warn', text: 'Always co-prescribe a laxative when starting opioids.' },
        ],
      },
      {
        id: 'neuropathic',
        heading: 'Neuropathic Pain',
        quickRef: 'Amitriptyline · Gabapentin · Pregabalin',
        body: [
          { type: 'subhead', text: 'First-line' },
          { type: 'dose', text: 'Amitriptyline 10–25 mg at night (titrate to 75 mg)' },
          { type: 'dose', text: 'OR Gabapentin 100–300 mg at night → titrate to 300 mg TDS' },
          { type: 'subhead', text: 'Second-line' },
          { type: 'dose', text: 'Pregabalin 75 mg BD → 150 mg BD' },
          { type: 'dose', text: 'Duloxetine 30–60 mg morning' },
          { type: 'subhead', text: 'Clinical indicators' },
          { type: 'text', text: 'Burning, shooting, or electric-shock quality suggests neuropathic involvement. Assess with NRS + DN4 screening tool.' },
        ],
      },
      {
        id: 'non-pharma-pain',
        heading: 'Non-Pharmacological Approaches',
        body: [
          { type: 'subhead', text: 'Physical' },
          { type: 'list', items: ['Positioning and pressure-relieving supports', 'Heat packs for muscle pain and cramps — avoid over skin breaks', 'Cold packs for inflammation', 'Gentle massage — avoid directly over tumour sites', 'Physiotherapy-guided exercise'] },
          { type: 'subhead', text: 'Psychological' },
          { type: 'list', items: ['Progressive muscle relaxation and guided imagery', 'Cognitive reframing of pain catastrophising', 'Distraction: music, meaningful activity', 'Mindfulness-based pain management'] },
          { type: 'subhead', text: 'Spiritual / emotional' },
          { type: 'list', items: ['Addressing "total pain" — existential and spiritual dimensions', 'Prayer and faith practices', 'Life review and legacy work'] },
        ],
      },
      {
        id: 'opioid-sideeffects',
        heading: 'Opioid Side Effects',
        body: [
          { type: 'subhead', text: 'Constipation — universal, treat prophylactically' },
          { type: 'warn', text: 'Start laxative AT THE SAME TIME as the opioid — not after constipation develops.' },
          { type: 'dose', text: 'Senna 2 tablets BD + lactulose 15 ml BD' },
          { type: 'dose', text: 'If no effect → macrogol (Movicol) 1–2 sachets daily' },
          { type: 'subhead', text: 'Nausea — often transient' },
          { type: 'dose', text: 'Metoclopramide 10 mg TDS for 1–2 weeks' },
          { type: 'dose', text: 'Haloperidol 0.5–1.5 mg daily (most effective for opioid-induced nausea)' },
          { type: 'text', text: 'Usually resolves — reassess after 2 weeks.' },
          { type: 'subhead', text: 'Drowsiness' },
          { type: 'list', items: ['Usually improves after 1–2 weeks', 'Review concurrent CNS-sedating medications', 'Consider opioid rotation if persistent'] },
          { type: 'subhead', text: 'Delirium / cognitive effects' },
          { type: 'list', items: ['Reduce all non-essential CNS medications', 'Consider opioid rotation (e.g. morphine → oxycodone)', 'Treat underlying cause: infection, dehydration, hypercalcaemia'] },
        ],
      },
    ],
  },
  {
    id: 'symptoms', title: 'Symptom Control', icon: AlertCircle, accent: '#d97706',
    tag: 'Core Protocol',
    sections: [
      {
        id: 'nausea',
        heading: 'Nausea & Vomiting',
        quickRef: 'Match antiemetic to cause',
        body: [
          { type: 'table', headers: ['Cause', 'First-line'], rows: [
            ['Opioid-induced', 'Haloperidol 0.5–1 mg BD'],
            ['Gastroparesis', 'Metoclopramide 10 mg TDS'],
            ['Chemotherapy', 'Ondansetron 8 mg BD'],
            ['Raised ICP', 'Cyclizine 50 mg TDS'],
            ['Metabolic (hypercalcaemia, uraemia)', 'Haloperidol + treat underlying'],
            ['Constipation', 'Treat constipation first'],
            ['Anxiety', 'Lorazepam 0.5–1 mg'],
          ]},
          { type: 'subhead', text: 'Non-pharmacological' },
          { type: 'list', items: ['Small, frequent meals; avoid strong smells', 'Cold food has less odour than hot', 'Fresh air and fan; sit upright 30 min after eating', 'Ginger (tea, biscuits, capsules)', 'Acupressure P6 wristband'] },
        ],
      },
      {
        id: 'breathlessness',
        heading: 'Breathlessness (Dyspnoea)',
        body: [
          { type: 'subhead', text: 'Non-pharmacological — often most effective' },
          { type: 'list', items: ['Upright positioning at 30–45 degrees', 'Fan directed at face — stimulates cold receptors, reduces sensation of breathlessness', 'Open window; pursed-lip breathing (inhale 2 counts, exhale 4)', 'Calm, reassuring, present clinician'] },
          { type: 'subhead', text: 'Pharmacological' },
          { type: 'dose', text: 'Morphine 2.5–5 mg oral every 4 h — highest evidence; does not hasten death' },
          { type: 'dose', text: 'Lorazepam 0.5–1 mg sublingual if anxiety component present' },
          { type: 'note', text: 'Oxygen only if SpO₂ < 88% or documented benefit — not routine.' },
          { type: 'warn', text: 'COPD: target SpO₂ 88–92% — NOT 95–100%.' },
          { type: 'subhead', text: 'Refer urgently' },
          { type: 'list', items: ['Sudden severe breathlessness — new cause?', 'SpO₂ < 85% despite oxygen', 'Stridor (airway obstruction)', 'Haemoptysis'] },
        ],
      },
      {
        id: 'fatigue',
        heading: 'Fatigue',
        body: [
          { type: 'subhead', text: 'Treat reversible causes first' },
          { type: 'list', items: ['Anaemia: Hb < 8 g/dL → transfuse if symptomatic', 'Depression: antidepressant + counselling', 'Hypothyroidism: thyroxine replacement', 'Sedating medications: beta-blockers, antihistamines, excess opioids', 'Poor sleep: insomnia, pain, anxiety'] },
          { type: 'subhead', text: 'Non-pharmacological (best evidence)' },
          { type: 'list', items: ['Aerobic exercise — even 10 min walking has evidence', 'Activity pacing at peak energy times', 'CBT for cancer fatigue', 'Sleep hygiene optimisation', 'Energy conservation: prioritise, plan, pace, position'] },
          { type: 'subhead', text: 'Pharmacological (limited evidence)' },
          { type: 'dose', text: 'Dexamethasone 4 mg — short-term boost, days to weeks only' },
          { type: 'text', text: 'Methylphenidate: selected cases; seek specialist advice.' },
        ],
      },
      {
        id: 'secretions',
        heading: 'Terminal Secretions',
        body: [
          { type: 'note', text: 'Noisy breathing from pooled secretions in unconscious patients. The patient is not distressed — this is more distressing to family members.' },
          { type: 'subhead', text: 'Management' },
          { type: 'list', items: ['Reposition semi-prone or lateral', 'Gentle oral suctioning only if secretions are accessible', 'Reduce IV fluids if running — decreases secretion load', 'Explain clearly to family: the patient is not suffering'] },
          { type: 'subhead', text: 'Pharmacological' },
          { type: 'dose', text: 'Hyoscine butylbromide 20 mg SC/IV stat → 60–120 mg/24 h infusion' },
          { type: 'dose', text: 'OR Glycopyrronium 0.2 mg SC stat → 0.6–1.2 mg/24 h' },
        ],
      },
    ],
  },
  {
    id: 'psychological', title: 'Psychological & Emotional', icon: Brain, accent: '#7c3aed',
    tag: 'Essential',
    sections: [
      {
        id: 'depression',
        heading: 'Depression — Assessment & Treatment',
        quickRef: 'PHQ-9 · Sertraline · Mirtazapine',
        body: [
          { type: 'subhead', text: 'Screening' },
          { type: 'text', text: 'PHQ-9 at diagnosis and every 4 weeks. PHQ-9 ≥ 10 requires treatment. Key differentiating symptom: anhedonia (loss of pleasure in previously enjoyed activities).' },
          { type: 'table', headers: ['PHQ-9 Score', 'Severity', 'Action'], rows: [
            ['5–9', 'Mild', 'Watchful waiting + counselling'],
            ['10–14', 'Moderate', 'Counselling + consider antidepressant'],
            ['15–19', 'Mod. severe', 'Antidepressant + counselling'],
            ['20–27', 'Severe', 'Urgent psychiatric referral'],
          ]},
          { type: 'subhead', text: 'First-line antidepressants' },
          { type: 'dose', text: 'Sertraline 50 mg morning — fewer interactions, good tolerability' },
          { type: 'dose', text: 'Mirtazapine 15 mg at night — also improves sleep and appetite' },
          { type: 'dose', text: 'Escitalopram 10 mg morning — if anxiolytic properties needed' },
          { type: 'note', text: 'SSRIs take 2–4 weeks to work. Methylphenidate acts faster when prognosis < 1 month.' },
        ],
      },
      {
        id: 'anxiety',
        heading: 'Anxiety & Existential Distress',
        body: [
          { type: 'subhead', text: 'Common causes' },
          { type: 'list', items: ['Fear of death and the dying process', 'Loss of control, role, body image', 'Financial and family concerns', 'Uncontrolled symptoms', 'Spiritual and existential suffering'] },
          { type: 'subhead', text: 'Pharmacological' },
          { type: 'dose', text: 'Lorazepam 0.5–1 mg PRN acute; or regular TDS if persistent' },
          { type: 'dose', text: 'Pregabalin 75–150 mg BD for generalised anxiety' },
          { type: 'text', text: 'SSRIs for chronic anxiety: sertraline or escitalopram.' },
          { type: 'subhead', text: 'Non-pharmacological (most effective long-term)' },
          { type: 'list', items: ['Therapeutic listening — acknowledge and validate fears', 'Problem-solving for controllable concerns', 'Mindfulness and relaxation techniques', '4-7-8 breathing (inhale 4, hold 7, exhale 8)', 'Dignity Therapy — structured life narrative'] },
        ],
      },
      {
        id: 'spikes',
        heading: 'Communicating Bad News — SPIKES',
        body: [
          { type: 'table', headers: ['Step', 'Action'], rows: [
            ['S — Setting', 'Private room, sit at patient level, offer support person'],
            ['P — Perception', '"What have you been told about your illness so far?"'],
            ['I — Invitation', '"Would you like me to explain what the results show?"'],
            ['K — Knowledge', 'Small pieces, plain language, pause and check understanding'],
            ['E — Emotions', 'Acknowledge and validate. Then WAIT — allow silence.'],
            ['S — Strategy', 'Summarise, outline next steps, confirm follow-up'],
          ]},
        ],
      },
    ],
  },
  {
    id: 'spiritual', title: 'Spiritual & Cultural', icon: Star, accent: '#b45309',
    tag: 'Ghana-Specific',
    sections: [
      {
        id: 'fica',
        heading: 'Spiritual Needs Assessment — FICA',
        body: [
          { type: 'table', headers: ['Letter', 'Prompt'], rows: [
            ['F — Faith', '"Do you consider yourself spiritual or religious?"'],
            ['I — Importance', '"How important are these beliefs to you?"'],
            ['C — Community', '"Are you part of a religious or spiritual community?"'],
            ['A — Address', '"How would you like me to address these in your care?"'],
          ]},
          { type: 'subhead', text: 'Common spiritual needs' },
          { type: 'list', items: ['Meaning and purpose', 'Hope and peace', 'Forgiveness', 'Connection and love', 'Legacy and memory'] },
        ],
      },
      {
        id: 'ghana-culture',
        heading: 'Cultural Considerations — Ghana',
        body: [
          { type: 'subhead', text: 'Family-centred decision-making' },
          { type: 'text', text: 'Major decisions often involve extended family. Facilitate family meetings for care planning. Balance patient autonomy with family involvement — ask the patient how much family involvement they want.' },
          { type: 'subhead', text: 'Traditional healing' },
          { type: 'text', text: 'Many patients use both traditional and biomedical care. Ask openly. Some herbs interact with medications — vital to know. Collaborate: "Let us make sure they work safely together."' },
          { type: 'subhead', text: 'Communication' },
          { type: 'list', items: ['Allow adequate time — conversations must not feel rushed', 'Offer interpretation: Twi, Ga, Ewe, or other local languages', 'Adapt prognosis discussion pacing to patient and family'] },
          { type: 'subhead', text: 'Death and mourning' },
          { type: 'text', text: 'Respect wishes for home death where safe. Mourning periods vary by ethnic group — acknowledge in bereavement planning.' },
        ],
      },
    ],
  },
  {
    id: 'nutrition', title: 'Nutrition & Hydration', icon: Utensils, accent: '#16a34a',
    tag: 'Practical',
    sections: [
      {
        id: 'cachexia',
        heading: 'Appetite Loss & Cachexia',
        body: [
          { type: 'note', text: 'Cachexia is a metabolic syndrome, not simple malnutrition. It cannot be reversed by increasing calorie intake alone.' },
          { type: 'subhead', text: 'Practical strategies' },
          { type: 'list', items: ['5–6 small meals per day, not 3 large ones', 'High-calorie, high-protein foods at every meal', 'Eat at peak-energy times (often late morning)', 'Never force eating — it causes distress and rarely helps'] },
          { type: 'subhead', text: 'High-calorie additions (Ghana-specific)' },
          { type: 'list', items: ['Groundnut (peanut) butter in porridge or soups', 'Full-fat milk, yoghurt, avocado', 'Eggs added to soups', 'Coconut milk in cooking'] },
        ],
      },
      {
        id: 'dysphagia',
        heading: 'Dysphagia (Swallowing Problems)',
        body: [
          { type: 'warn', text: 'Conduct swallowing screen before any oral intake in new neurological conditions.' },
          { type: 'text', text: 'Signs of aspiration: coughing or choking when eating or drinking, wet voice after swallowing. If unsafe: nil by mouth until speech therapist assessment.' },
          { type: 'subhead', text: 'Modified textures' },
          { type: 'list', items: ['Soft/fork-mashable: soft rice, mashed yam, scrambled eggs', 'Pureed: blended soups, smooth porridge, smooth peanut butter', 'Thickened liquids: add thickener to fluids at specified level'] },
          { type: 'subhead', text: 'Safe eating' },
          { type: 'list', items: ['Always sit upright (90°) when eating and 30 min after', 'Small bites, slow eating; no rushed mealtimes', 'Chin-tuck technique if advised by speech therapist'] },
        ],
      },
      {
        id: 'hydration',
        heading: 'Hydration at End of Life',
        body: [
          { type: 'note', text: 'Clinically assisted hydration in dying patients rarely improves symptoms or survival. It may prolong dying through increased secretions and oedema.' },
          { type: 'subhead', text: 'Comfort hydration' },
          { type: 'list', items: ['Frequent mouth care — wet sponge or swabs', 'Ice chips or small sips if patient can swallow safely', 'Petroleum jelly on lips; regular oral hygiene'] },
          { type: 'subhead', text: 'When IV/SC fluids may be appropriate' },
          { type: 'list', items: ['Delirium caused by dehydration', 'Patient with months to live but temporarily unable to swallow', 'Patient and family explicitly request with understanding of limitations'] },
          { type: 'subhead', text: 'Key phrases for families' },
          { type: 'list', items: ['"Not eating or drinking is part of the dying process — the body is shutting down."', '"Forcing fluids can cause discomfort — bloating, breathing problems."', '"The most comforting thing is gentle mouth care and your presence."'] },
        ],
      },
    ],
  },
  {
    id: 'medications', title: 'Palliative Medications', icon: Pill, accent: '#0891b2',
    tag: 'Reference',
    sections: [
      {
        id: 'opioids-ghana',
        heading: 'Opioids — Ghana Availability',
        body: [
          { type: 'subhead', text: 'Available' },
          { type: 'list', items: ['Oral morphine (10 mg/5 ml solution, 10 mg tablets) — teaching hospitals', 'Morphine injection 10 mg/ml — most hospitals', 'Tramadol 50 mg, 100 mg capsules — widely available', 'Codeine 30 mg, often in compound preparations'] },
          { type: 'subhead', text: 'Limited supply' },
          { type: 'list', items: ['Oxycodone — limited', 'Fentanyl patches — some private pharmacies', 'Methadone — very limited'] },
          { type: 'subhead', text: 'Prescribing & storage' },
          { type: 'list', items: ['FDPC controlled drug prescription form required', 'Locked controlled drug cabinet; two-nurse check for administration', 'Document carefully in controlled drug register'] },
          { type: 'subhead', text: 'Titration protocol (opioid-naive patient)' },
          { type: 'dose', text: 'Start: morphine 5 mg oral every 4 h' },
          { type: 'dose', text: 'Increase 25–33% every 24–48 h until controlled' },
          { type: 'text', text: 'When stable on immediate-release, convert to slow-release. Document breakthrough use to guide titration.' },
        ],
      },
      {
        id: 'syringe-driver',
        heading: 'Syringe Driver — Continuous SC Infusion',
        quickRef: 'Use when oral route fails or last days of life',
        body: [
          { type: 'subhead', text: 'Indications' },
          { type: 'list', items: ['Unable to swallow oral medications', 'Persistent vomiting preventing oral absorption', 'Last days of life'] },
          { type: 'subhead', text: 'Common 24-hour combinations' },
          { type: 'table', headers: ['Indication', 'Combination'], rows: [
            ['Pain + secretions', 'Morphine 20–30 mg + Hyoscine 60–120 mg'],
            ['Pain + nausea', 'Morphine 20–30 mg + Haloperidol 2–5 mg'],
            ['Pain + agitation', 'Morphine 20–30 mg + Midazolam 10–30 mg'],
            ['All three', 'Morphine + Haloperidol + Midazolam'],
          ]},
          { type: 'warn', text: 'Mix in Water for Injection — not normal saline for most combinations. Seek pharmacy compatibility advice before mixing novel combinations.' },
          { type: 'subhead', text: 'Monitoring' },
          { type: 'list', items: ['Site check every 4 h: redness, swelling, leaking', 'Observe for effect and side effects', 'Always prescribe PRN breakthrough medications alongside'] },
        ],
      },
    ],
  },
  {
    id: 'family', title: 'Family & Caregiver', icon: Users, accent: '#db2777',
    tag: 'Essential',
    sections: [
      {
        id: 'zarit',
        heading: 'Caregiver Burden — Zarit Assessment',
        body: [
          { type: 'table', headers: ['Score', 'Burden level', 'Action'], rows: [
            ['0–10', 'Little or none', 'Monitor'],
            ['11–20', 'Mild to moderate', 'Support and counsel'],
            ['21–40', 'Moderate to severe', 'Active intervention'],
            ['41–48', 'Severe', 'Urgent respite care'],
          ]},
          { type: 'note', text: 'Score ≥ 21: immediate respite care discussion · caregiver support group referral · counselling · review care package.' },
          { type: 'subhead', text: 'Signs of burnout' },
          { type: 'list', items: ['Emotional exhaustion and resentment', 'Physical health deterioration', 'Social isolation', 'Neglecting own needs', 'Feeling trapped'] },
        ],
      },
      {
        id: 'eol-family',
        heading: 'Preparing Family for End of Life',
        body: [
          { type: 'subhead', text: 'Days to weeks before death' },
          { type: 'list', items: ['Increased sleep, difficult to rouse', 'Less interest in food and drink', 'Withdrawing from the world', 'May talk to deceased relatives; occasional confusion'] },
          { type: 'subhead', text: 'Hours to days before death' },
          { type: 'list', items: ['Breathing: slower, irregular, long pauses (Cheyne-Stokes)', 'Mottled purplish skin patches on legs and feet', 'Extremities cold and blue; eyes may be partially open', 'Throat sounds from secretions — NOT distress'] },
          { type: 'subhead', text: 'Reassure family' },
          { type: 'list', items: ['The patient is not in pain during this process', 'Presence, talking gently, and touch are all meaningful', 'It is okay to say goodbye and say what needs to be said', 'The patient may hear even when unresponsive'] },
        ],
      },
    ],
  },
  {
    id: 'emergency', title: 'Emergency Protocols', icon: Phone, accent: '#dc2626',
    tag: 'CRITICAL', urgent: true,
    sections: [
      {
        id: 'acute-pain',
        heading: 'Acute Severe Pain',
        body: [
          { type: 'warn', text: 'NRS 8–10 or patient visibly very distressed — act immediately.' },
          { type: 'dose', text: 'If on morphine: give breakthrough dose NOW' },
          { type: 'dose', text: 'If opioid-naive: morphine 5–10 mg oral OR 2.5–5 mg SC' },
          { type: 'text', text: 'Reassess in 30 minutes. If not responding: escalate dose or switch to SC/IV. Identify and treat cause: bone pain, obstruction, infection.' },
        ],
      },
      {
        id: 'acute-breathlessness',
        heading: 'Acute Breathlessness Crisis',
        body: [
          { type: 'list', items: ['Sit upright immediately', 'Fan to face'] },
          { type: 'dose', text: 'Morphine 2.5–5 mg SC/IV' },
          { type: 'dose', text: 'Lorazepam 0.5–1 mg sublingual if anxiety' },
          { type: 'warn', text: 'Oxygen only if SpO₂ < 88%. NEVER high-flow O₂ in COPD.' },
        ],
      },
      {
        id: 'delirium',
        heading: 'Acute Delirium / Agitation',
        body: [
          { type: 'text', text: 'First identify and treat reversible causes: pain, urinary retention, constipation, infection, medication toxicity.' },
          { type: 'dose', text: 'Haloperidol 1–2 mg SC/IM — safest first-line' },
          { type: 'dose', text: 'Lorazepam 1–2 mg IM if haloperidol insufficient or seizure risk' },
          { type: 'list', items: ['Calm, quiet environment', 'Familiar person present — reassure gently'] },
        ],
      },
      {
        id: 'haemorrhage',
        heading: 'Haemorrhage',
        body: [
          { type: 'list', items: ['Apply direct firm pressure', 'Dark or large towels — minimise visual impact on family'] },
          { type: 'dose', text: 'Morphine 10 mg SC — immediate distress relief' },
          { type: 'dose', text: 'Midazolam 10–15 mg SC/IV — sedation' },
          { type: 'warn', text: 'Call emergency services immediately.' },
        ],
      },
      {
        id: 'seizure',
        heading: 'Seizure',
        body: [
          { type: 'list', items: ['Lay safely, protect airway, time the seizure'] },
          { type: 'dose', text: 'Diazepam 10 mg PR  OR  midazolam 5 mg buccal' },
          { type: 'dose', text: 'If > 5 min without stopping → diazepam 10 mg IV or lorazepam 4 mg IV' },
        ],
      },
      {
        id: 'neutropenic',
        heading: 'Neutropenic Sepsis',
        quickRef: 'Treat within 1 hour — life-threatening',
        body: [
          { type: 'warn', text: 'Criteria: fever > 38.5 °C (or < 36 °C) AND patient on chemotherapy or bone marrow suppression.' },
          { type: 'subhead', text: 'Within 1 hour — all of the following' },
          { type: 'list', items: ['Blood cultures × 2 BEFORE antibiotics', 'FBC, U&E, LFT, CRP, lactate', 'Piperacillin-tazobactam 4.5 g IV TDS', '500 ml crystalloid bolus if hypotensive', 'Oxygen if SpO₂ < 94%', 'Escalate to oncology immediately'] },
          { type: 'warn', text: 'Do NOT wait for culture results. Do NOT discharge with oral antibiotics.' },
        ],
      },
      {
        id: 'ghana-contacts',
        heading: 'Ghana Emergency Contacts',
        body: [
          { type: 'table', headers: ['Service', 'Number'], rows: [
            ['National Ambulance', '193'],
            ['Police', '191'],
            ['Fire Service', '192'],
            ['Korle Bu Teaching Hospital (Accra)', '0302-665-401'],
            ['37 Military Hospital', '0302-776-111'],
            ['Ridge Hospital', '0302-664-401'],
            ['Mental Health Authority Ghana', '0800-111-011 (toll-free)'],
            ['Befrienders Ghana (crisis)', '0244-846-472'],
            ['Komfo Anokye Hospital (Kumasi)', '032-202-2301'],
          ]},
        ],
      },
    ],
  },
];

/* ── Shared style tokens ─────────────────────────────────────────────────── */
const T = {
  bodySize:   13,
  doseSize:   13,
  subSize:    11,
  bodyColor:  'var(--text-700)',
  headColor:  'var(--text-900)',
  subColor:   'var(--text-500)',
  warnBg:     'rgba(220,38,38,0.06)',
  warnBorder: 'rgba(220,38,38,0.2)',
  noteBg:     'rgba(13,148,136,0.06)',
  noteBorder: 'rgba(13,148,136,0.18)',
  doseBg:     'var(--page-bg)',
};

/* ── Block renderers ─────────────────────────────────────────────────────── */
function Block({ block, accent }) {
  switch (block.type) {
    case 'subhead':
      return (
        <p style={{ margin:'10px 0 2px', fontSize:T.subSize, fontWeight:700,
          color: accent, textTransform:'uppercase', letterSpacing:'0.07em' }}>
          {block.text}
        </p>
      );
    case 'text':
      return (
        <p style={{ margin:'3px 0', fontSize:T.bodySize, color:T.bodyColor, lineHeight:1.65 }}>
          {block.text}
        </p>
      );
    case 'dose':
      return (
        <div style={{
          display:'flex', alignItems:'baseline', gap:8,
          margin:'3px 0', padding:'4px 10px',
          background:T.doseBg, borderRadius:6,
          borderLeft:`2px solid ${accent}`,
        }}>
          <span style={{ fontSize:T.doseSize, color:T.headColor, fontWeight:600,
            lineHeight:1.5, fontVariantNumeric:'tabular-nums' }}>
            {block.text}
          </span>
        </div>
      );
    case 'warn':
      return (
        <div style={{
          display:'flex', alignItems:'flex-start', gap:8,
          margin:'5px 0', padding:'7px 10px',
          background:T.warnBg, border:`1px solid ${T.warnBorder}`, borderRadius:7,
        }}>
          <span style={{ color:'#dc2626', fontSize:13, flexShrink:0, lineHeight:1.5 }}>!</span>
          <p style={{ margin:0, fontSize:T.bodySize, color:'#dc2626', fontWeight:600, lineHeight:1.55 }}>
            {block.text}
          </p>
        </div>
      );
    case 'note':
      return (
        <div style={{
          margin:'5px 0', padding:'7px 10px',
          background:T.noteBg, border:`1px solid ${T.noteBorder}`, borderRadius:7,
        }}>
          <p style={{ margin:0, fontSize:T.bodySize, color:'var(--text-600)', lineHeight:1.55 }}>
            {block.text}
          </p>
        </div>
      );
    case 'list':
      return (
        <ul style={{ margin:'3px 0', padding:0, listStyle:'none', display:'flex',
          flexDirection:'column', gap:2 }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ display:'flex', alignItems:'baseline', gap:8,
              fontSize:T.bodySize, color:T.bodyColor, lineHeight:1.6 }}>
              <span style={{ color:accent, flexShrink:0, fontSize:11, lineHeight:1.8 }}>–</span>
              {item}
            </li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div style={{ margin:'6px 0', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} style={{
                    padding:'6px 10px', textAlign:'left',
                    fontSize:10, fontWeight:700, letterSpacing:'0.06em',
                    textTransform:'uppercase', color:'var(--text-400)',
                    background:'var(--page-bg)',
                    borderBottom:'2px solid var(--card-border)',
                    whiteSpace:'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} style={{
                  borderBottom:'1px solid var(--card-border)',
                  background: ri % 2 === 0 ? 'var(--card-bg)' : 'var(--page-bg)',
                }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding:'6px 10px',
                      fontSize:12,
                      fontWeight: ci === 0 ? 600 : 400,
                      color: ci === 0 ? 'var(--text-800)' : 'var(--text-700)',
                      lineHeight:1.5,
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

/* ── Reading pane ────────────────────────────────────────────────────────── */
function ProtocolReader({ protocol }) {
  const Icon = protocol.icon;

  return (
    <div>
      {/* Chapter title — clean, no gradient box */}
      <div style={{ paddingBottom:14, marginBottom:16,
        borderBottom:`2px solid ${protocol.accent}`,
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
        flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:9,
            background:`${protocol.accent}14`, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={18} style={{ color:protocol.accent }}/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:800,
              color:'var(--text-900)', lineHeight:1.2 }}>
              {protocol.title}
            </h1>
            {protocol.tag && (
              <span style={{ fontSize:10, fontWeight:700, color:protocol.accent,
                textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {protocol.tag}
              </span>
            )}
          </div>
        </div>
        {protocol.urgent && (
          <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px',
            borderRadius:99, background:'#dc2626', color:'#fff',
            letterSpacing:'0.05em', flexShrink:0 }}>
            CRITICAL
          </span>
        )}
      </div>

      {/* Sections — no cards, no borders around sections, clean prose */}
      <div style={{ display:'flex', flexDirection:'column' }}>
        {protocol.sections.map((section, si) => (
          <div key={section.id}
            id={`sec-${section.id}`}
            style={{
              paddingBottom:20,
              marginBottom:20,
              borderBottom: si < protocol.sections.length - 1
                ? '1px solid var(--card-border)' : 'none',
            }}>
            {/* Section heading */}
            <h2 style={{
              margin:'0 0 8px',
              fontSize:14, fontWeight:700,
              color:'var(--text-900)',
              paddingLeft:10,
              borderLeft:`3px solid ${protocol.accent}`,
              lineHeight:1.3,
            }}>
              {section.heading}
              {section.quickRef && (
                <span style={{ marginLeft:10, fontSize:11, fontWeight:500,
                  color:'var(--text-400)', fontStyle:'italic' }}>
                  — {section.quickRef}
                </span>
              )}
            </h2>

            {/* Section body blocks */}
            <div style={{ paddingLeft:4 }}>
              {section.body.map((block, bi) => (
                <Block key={bi} block={block} accent={protocol.accent}/>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize:11, color:'var(--text-300)', borderTop:'1px solid var(--card-border)',
        paddingTop:12, marginTop:4, lineHeight:1.6 }}>
        Evidence-based protocols adapted for the Ghanaian healthcare context.
        Always consult senior clinicians for complex cases and follow institutional protocols.
      </p>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function CareGuide() {
  const [search,   setSearch]   = useState('');
  const [activeId, setActiveId] = useState('pain');
  const readRef = useRef(null);

  const protocol = PROTOCOLS.find(p => p.id === activeId) || PROTOCOLS[0];

  const filtered = search.trim()
    ? PROTOCOLS.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tag?.toLowerCase().includes(search.toLowerCase()) ||
        p.sections.some(s =>
          s.heading.toLowerCase().includes(search.toLowerCase()) ||
          s.body.some(b =>
            (b.text || '').toLowerCase().includes(search.toLowerCase()) ||
            (b.items || []).some(i => i.toLowerCase().includes(search.toLowerCase()))
          )
        ))
    : PROTOCOLS;

  const select = (id) => {
    setActiveId(id);
    setSearch('');
    readRef.current?.scrollTo({ top:0, behavior:'smooth' });
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--page-bg)' }}>
      <PageHeader
        image="/resources/african/african-doctor-female.jpg"
        title="Clinical Care Guide"
        subtitle="Evidence-based palliative protocols — Ghana context"
        icon={BookOpen}
      >
        <div style={{ position:'relative', flex:1, minWidth:160, maxWidth:280 }}>
          <Search size={13} style={{ position:'absolute', left:11, top:'50%',
            transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }}/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search protocols…"
            style={{ width:'100%', height:34, paddingLeft:32, paddingRight:12,
              fontSize:12, borderRadius:20, border:'1px solid var(--card-border)',
              background:'var(--page-bg)', color:'var(--text-800)',
              outline:'none', boxSizing:'border-box' }}
            onFocus={e => (e.target.style.borderColor='#0d9488')}
            onBlur={e  => (e.target.style.borderColor='var(--card-border)')}
          />
        </div>
        <button onClick={() => window.print()}
          style={{ display:'flex', alignItems:'center', gap:6,
            padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:600,
            border:'1px solid var(--card-border)', background:'var(--card-bg)',
            color:'var(--text-600)', cursor:'pointer' }}>
          <Printer size={12}/> Print
        </button>
      </PageHeader>

      {/* ── Two-column layout ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'16px 20px 48px',
        display:'grid', gridTemplateColumns:'200px 1fr', gap:16, alignItems:'start' }}>

        {/* ── LEFT: chapter nav ── */}
        <div style={{ position:'sticky', top:16 }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
            borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--card-border)',
              background:'var(--page-bg)' }}>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color:'var(--text-400)',
                letterSpacing:'0.07em', textTransform:'uppercase' }}>Protocols</p>
            </div>

            {/* Nav items */}
            <div style={{ maxHeight:'calc(100vh - 180px)', overflowY:'auto' }}>
              {(search.trim() ? filtered : PROTOCOLS).map(p => {
                const Icon    = p.icon;
                const isActive = activeId === p.id && !search.trim();
                return (
                  <button key={p.id} onClick={() => select(p.id)}
                    style={{
                      width:'100%', textAlign:'left',
                      display:'flex', alignItems:'center', gap:9,
                      padding:'9px 12px',
                      border:'none', borderBottom:'1px solid var(--card-border)',
                      borderLeft:`3px solid ${isActive ? p.accent : 'transparent'}`,
                      background: isActive ? `${p.accent}0d` : 'transparent',
                      cursor:'pointer', fontFamily:'inherit',
                      transition:'background 0.1s, border-color 0.1s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--page-bg)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={13} style={{ color: isActive ? p.accent : 'var(--text-400)',
                      flexShrink:0 }}/>
                    <span style={{ fontSize:12, fontWeight: isActive ? 700 : 500,
                      color: isActive ? p.accent : 'var(--text-700)',
                      lineHeight:1.3, flex:1 }}>
                      {p.title}
                    </span>
                    {p.urgent && (
                      <span style={{ width:6, height:6, borderRadius:'50%',
                        background:'#dc2626', flexShrink:0 }}/>
                    )}
                  </button>
                );
              })}

              {search.trim() && filtered.length === 0 && (
                <p style={{ margin:0, padding:'16px 12px', fontSize:12,
                  color:'var(--text-400)', fontStyle:'italic' }}>
                  No results
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: reading pane ── */}
        <div ref={readRef}
          style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)',
            borderRadius:12, padding:'24px 28px',
            maxHeight:'calc(100vh - 100px)', overflowY:'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div key={protocol.id}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.12 }}>
              <ProtocolReader protocol={protocol}/>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
