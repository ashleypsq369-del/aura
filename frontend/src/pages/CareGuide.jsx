/**
 * CareGuide.jsx
 * =============
 * Layout:
 * - Page = clean grid of 8 protocol cards (no inline content)
 * - Click a card → modal opens showing the protocol sections as
 * stacked readable content blocks (no nested accordions)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 BookOpen, Heart, AlertCircle, Users, Utensils, Phone, Brain,
 Activity, Pill, Star, Search, ChevronDown, ChevronUp, ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

// -- All protocol data (unchanged) -----------------------------------------
const PROTOCOLS = [
 {
 id: 'pain',
 title: 'Pain Management',
 icon: Heart,
 color: 'red',
 badge: 'Core Protocol',
 summary: 'WHO analgesic ladder, opioid guidance, breakthrough pain, non-pharmacological approaches',
 sections: [
 {
 title: 'WHO Analgesic Ladder',
 content: `**Step 1 - Mild Pain (NRS 1-3):**
- Paracetamol 1g every 6 hours (max 4g/day)
- NSAIDs: Ibuprofen 400mg every 8 hours with food
- NSAIDs avoid if: renal impairment, GI bleeding risk, cardiovascular disease

**Step 2 - Moderate Pain (NRS 4-6):**
- Tramadol 50-100mg every 6 hours (max 400mg/day)
- OR Codeine 30-60mg every 4-6 hours + Paracetamol base
- Add adjuvants if neuropathic component suspected

**Step 3 - Severe Pain (NRS 7-10):**
- Oral morphine 5-10mg every 4 hours (immediate release)
- OR Slow-release morphine 10-30mg every 12 hours
- Breakthrough dose = 1/6 of total daily opioid dose
- Titrate every 24-48 hours until controlled
- ⚠️ Always prescribe laxative alongside opioids`,
 },
 {
 title: 'Neuropathic Pain',
 content: `**First-line:**
- Amitriptyline 10-25mg at night (titrate to 75mg)
- OR Gabapentin 100-300mg at night → titrate to 300mg TDS

**Second-line:**
- Pregabalin 75mg BD → 150mg BD
- Duloxetine 30-60mg morning

**Adjuvants:**
- Tramadol has dual opioid + SNRI activity - useful for nerve pain
- Topical lidocaine patches for localised neuropathic pain

**Assessment:**
- Burning, shooting, electric-shock quality suggests neuropathic
- Use NRS + neuropathic screening tool (DN4)`,
 },
 {
 title: 'Non-Pharmacological Pain Management',
 content: `**Physical:**
- Positioning and pressure-relieving supports
- Heat packs - muscle pain, cramps (avoid over skin-breaks)
- Cold packs - inflammation, nerve pain
- Gentle massage (avoid directly over tumour sites)
- TENS (transcutaneous electrical nerve stimulation)
- Physiotherapy-guided exercise programme

**Psychological:**
- Relaxation techniques - progressive muscle relaxation
- Guided imagery and visualisation
- Cognitive reframing of pain catastrophising
- Distraction - music, meaningful activity, conversation
- Mindfulness-based pain management

**Spiritual/Emotional:**
- Addressing "total pain" - spiritual, existential dimensions
- Prayer and faith practices
- Life review and legacy work`,
 },
 {
 title: 'Opioid Side Effects & Management',
 content: `**Constipation (universal - treat prophylactically):**
- Start laxative WHEN opioid started - not after constipation occurs
- First-line: Senna 2 tablets BD + Lactulose 15ml BD
- If no effect: Macrogol (Movicol) 1-2 sachets daily
- Increase fluids and activity if tolerated

**Nausea (often transient, settles in 1-2 weeks):**
- Metoclopramide 10mg TDS for 1-2 weeks
- Haloperidol 0.5-1.5mg daily (most effective opioid-induced)
- Usually resolves - reassess need after 2 weeks

**Drowsiness:**
- Usually improves after first 1-2 weeks
- Review concurrent CNS-sedating medications
- Consider opioid rotation if persistent

**Cognitive effects / delirium:**
- Review and reduce all non-essential CNS medications
- Consider opioid rotation (e.g., morphine → oxycodone)
- Treat underlying cause: infection, dehydration, hypercalcaemia`,
 },
 ],
 },
 {
 id: 'symptoms',
 title: 'Symptom Control',
 icon: AlertCircle,
 color: 'amber',
 badge: 'Core Protocol',
 summary: 'Nausea, breathlessness, fatigue, constipation, secretions, delirium',
 sections: [
 {
 title: 'Nausea & Vomiting',
 content: `**Common Causes & Targeted Treatment:**

| Cause | First-line Treatment |
|-------|---------------------|
| Opioid-induced | Haloperidol 0.5-1mg BD |
| Gastroparesis/motility | Metoclopramide 10mg TDS |
| Chemotherapy-induced | Ondansetron 8mg BD |
| Raised intracranial pressure | Cyclizine 50mg TDS |
| Metabolic (hypercalcaemia, uraemia) | Haloperidol + treat underlying |
| Constipation | Treat constipation |
| Anxiety-driven | Lorazepam 0.5-1mg |

**Non-pharmacological:**
- Small, frequent meals
- Avoid strong smells, hot food (cold food less smell)
- Fresh air and fan
- Sit upright for 30 minutes after eating
- Ginger (tea, biscuits, capsules)
- Acupressure (P6 wristband)`,
 },
 {
 title: 'Breathlessness (Dyspnoea)',
 content: `**Non-pharmacological (often most effective):**
- Upright positioning at 30-45°
- Fan directed at face - stimulates cold receptors, reduces sensation of breathlessness
- Open window for air flow
- Pursed-lip breathing: in through nose (2 counts), out through pursed lips (4 counts)
- Reduce anxiety - present, reassuring, calm presence
- Relaxation techniques

**Pharmacological:**
- Low-dose oral morphine 2.5-5mg every 4 hours - MOST evidence-based (does NOT hasten death)
- Lorazepam 0.5-1mg SL/PO if anxiety component
- Oxygen ONLY if SpO2 < 88% or documented benefit (not routine)
- ⚠️ In COPD: target SpO2 88-92% NOT 95-100%

**When to refer urgently:**
- Sudden severe breathlessness - new cause?
- SpO2 < 85% despite oxygen
- Stridor (airway obstruction)
- Haemoptysis`,
 },
 {
 title: 'Fatigue',
 content: `**Assessment:**
- Is it cancer-related fatigue (CRF), anaemia, depression, hypothyroidism, or medication-related?
- Screen with ESAS tiredness + Functional Assessment of Cancer Therapy-Fatigue (FACT-F)

**Treat Reversible Causes:**
- Anaemia: Hb < 8 g/dL → transfusion if symptomatic
- Depression: treat with antidepressant + counselling
- Hypothyroidism: thyroxine replacement
- Review medications - beta-blockers, antihistamines, opioids (if excessive)
- Treat poor sleep (insomnia, pain, anxiety)

**Non-pharmacological (most evidence):**
- Aerobic exercise - even 10 min walking has evidence
- Activity pacing - plan activities for peak energy times
- Cognitive-behavioural therapy for cancer fatigue
- Sleep hygiene optimisation
- Energy conservation: prioritise, plan, pace, and position

**Pharmacological (limited evidence):**
- Corticosteroids (dexamethasone 4mg) - short-term boost (days to weeks)
- Methylphenidate - in selected cases, seek specialist advice`,
 },
 {
 title: 'Terminal Secretions ("Death Rattle")',
 content: `**Understanding:**
- Noisy breathing from pooled secretions in unconscious/semi-conscious patients
- Not distressing to the patient - more distressing to family
- Occurs in final hours to days of life

**Management:**
- Reposition patient - semi-prone or lateral
- Mouth care - gentle suctioning only if accessible
- Reassure family: patient is not drowsy because of the sound; they cannot feel it
- Reduce IV fluids if running - reduces secretion burden

**Pharmacological:**
- Hyoscine butylbromide 20mg SC/IV stat + 60-120mg/24h infusion
- OR Glycopyrronium 0.2mg SC stat + 0.6-1.2mg/24h

**Communication:**
- Explain to family what they are hearing and why
- This does NOT mean the patient is suffering
- Focus family on gentle presence, touch, talking`,
 },
 ],
 },
 {
 id: 'psychological',
 title: 'Psychological & Emotional',
 icon: Brain,
 color: 'purple',
 badge: 'Essential',
 summary: 'Depression screening, anxiety, adjustment disorder, counselling, communicating bad news',
 sections: [
 {
 title: 'Depression - Assessment & Treatment',
 content: `**Screening:**
- PHQ-9 at diagnosis and every 4 weeks
- Distinguish from appropriate sadness - PHQ-9 ≥ 10 needs treatment
- Anhedonia (loss of pleasure) is the key differentiating symptom

**PHQ-9 Severity:**
- 5-9: Mild → watchful waiting, counselling
- 10-14: Moderate → counselling + consider antidepressant
- 15-19: Moderately severe → antidepressant + counselling
- 20-27: Severe → urgent psychiatric referral

**First-line Antidepressants in Palliative Care:**
- Sertraline 50mg morning (fewer interactions, good tolerability)
- Mirtazapine 15mg at night (also helps sleep and appetite)
- Escitalopram 10mg morning (if needs anxiolytic properties)

⚠️ SSRIs take 2-4 weeks to work. Methylphenidate works faster for palliative prognosis < 1 month.`,
 },
 {
 title: 'Anxiety & Existential Distress',
 content: `**Causes:**
- Fear of death / dying process
- Loss of control, loss of role, loss of body image
- Financial and family concerns
- Uncontrolled symptoms
- Spiritual and existential suffering

**Pharmacological:**
- Benzodiazepines: Lorazepam 0.5-1mg PRN (acute) or regular TDS if persistent
- Antidepressants: SSRIs if anxiety is chronic (sertraline, escitalopram)
- Pregabalin 75-150mg BD for generalised anxiety

**Non-pharmacological (most effective long-term):**
- Therapeutic listening - acknowledge and validate fears
- Problem-solving for controllable concerns
- Mindfulness and relaxation techniques
- 4-7-8 breathing: in 4 counts, hold 7, out 8 counts
- Cognitive reframing
- Dignity Therapy - structured narrative about life and legacy`,
 },
 {
 title: 'Communicating Bad News - SPIKES Protocol',
 content: `**S - Setting:**
- Private, quiet room; sit at patient level
- Offer to have a support person present

**P - Perception:**
- "What have you been told about your illness so far?"
- Understand what the patient already knows

**I - Invitation:**
- "Would you like me to explain what the test results show?"
- Gauge how much information the patient wants

**K - Knowledge:**
- Give information in small pieces, plain language
- Pause and check understanding
- Avoid medical jargon

**E - Emotions:**
- Acknowledge and validate emotional response
- "This is clearly very difficult news to hear..."
- WAIT - allow silence

**S - Summary and Strategy:**
- Summarise what was discussed
- Outline next steps
- Ensure follow-up is clear
- "I will be here to support you through this"`,
 },
 ],
 },
 {
 id: 'spiritual',
 title: 'Spiritual & Cultural Care',
 icon: Star,
 color: 'yellow',
 badge: 'Ghana-Specific',
 summary: 'Spiritual needs assessment (FICA), faith communities, cultural practices, end-of-life rituals',
 sections: [
 {
 title: 'Spiritual Needs Assessment (FICA Tool)',
 content: `**F - Faith and Belief:**
- "Do you consider yourself a spiritual or religious person?"
- "Do you have spiritual beliefs that help you cope with your illness?"

**I - Importance and Influence:**
- "How important are these beliefs to you?"
- "How do they influence the way you take care of yourself?"

**C - Community:**
- "Are you part of a religious or spiritual community?"
- "Is this a source of support for you?"

**A - Address in Care:**
- "How would you like me to address these issues in your care?"
- Chaplaincy referral, pastor visits, prayer facilities

**Common Spiritual Needs:**
- Meaning and purpose
- Hope and peace
- Forgiveness
- Connection and love
- Legacy and memory`,
 },
 {
 title: 'Cultural Considerations - Ghana',
 content: `**Family-Centred Decision-Making:**
- In Ghanaian culture, major decisions often involve extended family
- Respect this - facilitate family meetings for care planning
- Balance patient autonomy with family involvement
- Ask patient how much family involvement they want

**Traditional Healing:**
- Many patients use both traditional and biomedical care
- Ask openly: "Are you using any herbal remedies or seeing a traditional healer?"
- Avoid judgment - some herbs interact with medications (important to know)
- Collaborate where possible: "Thank you for telling me. Let us make sure they work together safely."

**Communication Style:**
- Allow adequate time - conversations should not feel rushed
- Offer interpretation in Twi, Ga, Ewe, or other local languages
- Prognosis discussions: adapt pacing to patient and family preferences
- Some families may wish to protect patient from bad news - discuss sensitively

**Death and Mourning Customs:**
- Many Ghanaian cultures have specific death rites and mourning periods
- Respect wishes for home death if safe and feasible
- Accommodate traditional burial practices where possible
- Mourning periods vary by ethnic group - acknowledge this in bereavement planning`,
 },
 ],
 },
 {
 id: 'nutrition',
 title: 'Nutrition & Hydration',
 icon: Utensils,
 color: 'green',
 badge: 'Practical Guide',
 summary: 'Appetite loss, cachexia management, dysphagia, hydration at end of life',
 sections: [
 {
 title: 'Managing Appetite Loss & Cachexia',
 content: `**Understanding Cachexia:**
- Not just malnutrition - metabolic syndrome with inflammation
- Cannot be reversed by simply increasing calorie intake
- Goal shifts from cure to comfort and quality of life

**Practical Strategies:**
- Small, frequent meals (5-6 per day) rather than 3 large meals
- High-calorie, high-protein foods at every meal
- Eat at best-energy times of day (often late morning)
- Make food visually appealing - eat with others if possible
- Don't force eating - it causes distress and rarely helps

**High-Calorie Additions (Ghana-specific):**
- Groundnut (peanut) butter - add to porridge, soups
- Full-fat milk, yoghurt
- Avocado in meals
- Eggs - scrambled, boiled, added to soups
- Coconut milk in cooking

**Oral Nutritional Supplements:**
- Ensure, Complan, or similar if available
- Home-made smoothies: milk + banana + groundnut butter + honey

**When appetite is very poor:**
- Small sips of favourite drink or soup matters more than large amounts
- Ice cream, smoothies, or fortified milk drinks
- Do not measure or comment on how little is eaten - focus on enjoyment`,
 },
 {
 title: 'Dysphagia (Swallowing Problems)',
 content: `**Causes in Palliative Care:**
- Head/neck cancer - direct obstruction
- Neurological (stroke, MND, dementia) - poor coordination
- Oesophageal stricture or candidiasis
- Weakness/fatigue

**Immediate Safety:**
- SWALLOWING SCREEN before any oral intake in new neurological conditions
- Signs of aspiration: coughing/choking with eating/drinking, wet voice after swallowing
- If unsafe: NPO (nil by mouth) until speech therapist assessment

**Modified Textures:**
- Soft/fork-mashable: soft rice, mashed yam, scrambled eggs
- Pureed: blended soups, smooth porridge, smooth peanut butter
- Thickened liquids: add thickener to fluids (specify correct level)

**Safe Eating:**
- Always sit upright (90°) when eating and for 30 minutes after
- Small bites and slow eating
- No rushed mealtimes
- Chin-tuck technique if advised by speech therapist`,
 },
 {
 title: 'Hydration at End of Life',
 content: `**Evidence-Based Approach:**
- Clinically assisted hydration (IV/SC) in dying patients rarely improves symptoms or survival
- May prolong dying with increased secretions, oedema
- Oral care is MORE important than artificial hydration for comfort

**Comfort Hydration:**
- Frequent mouth care - wet sponge, wet mouth swabs
- Ice chips or small sips if patient can swallow safely
- Petroleum jelly on lips
- Regular oral hygiene even when not eating

**When IV/SC fluids may be appropriate:**
- Delirium caused by dehydration
- Patient with months to live but temporarily unable to swallow (e.g., post-procedure)
- Patient/family explicitly requests, understanding limitations

**Communicating with Families:**
- "Not eating and drinking is part of the dying process - the body is shutting down"
- "Forcing fluids can actually cause discomfort - bloating, breathing problems"
- "The best comfort is gentle mouth care and presence"`,
 },
 ],
 },
 {
 id: 'medications_guide',
 title: 'Palliative Medications',
 icon: Pill,
 color: 'blue',
 badge: 'Reference',
 summary: 'Opioids, anti-emetics, anxiolytics, steroids - availability and dosing in Ghana',
 sections: [
 {
 title: 'Opioids - Ghana Availability',
 content: `**Available in Ghana:**
- Oral Morphine (immediate release 10mg/5ml solution, 10mg tablets) - Teaching hospitals
- Morphine injection (10mg/ml) - most hospitals
- Tramadol 50mg, 100mg capsules - widely available
- Codeine (30mg, often in compound preparations)
- Pethidine (injection) - available but not preferred for palliative use

**Less available:**
- Oxycodone - limited
- Fentanyl patches - some private pharmacies, limited supply
- Methadone - very limited

**Morphine Prescribing:**
- Requires controlled drug prescription (FDPC form in Ghana)
- Store in locked controlled drug cabinet
- Two-nurse check for administration
- Document carefully - controlled drug register

**Titration Protocol:**
- Starting dose (opioid-naive patient): 5mg oral morphine every 4 hours
- Increase by 25-33% every 24-48 hours if not controlled
- When stable on immediate-release, convert to slow-release
- Document breakthrough use to guide titration`,
 },
 {
 title: 'Syringe Driver / Continuous SC Infusion',
 content: `**When to use:**
- Patient unable to swallow oral medications
- Persistent vomiting preventing oral absorption
- Last days of life

**Common Syringe Driver Combinations (24h):**
- Pain + secretions: Morphine 20-30mg + Hyoscine 60-120mg
- Pain + nausea: Morphine 20-30mg + Haloperidol 2-5mg
- Pain + agitation: Morphine 20-30mg + Midazolam 10-30mg
- All three: Morphine + Haloperidol + Midazolam

**Compatibility:**
- Mix in Water for Injection (not normal saline for most combinations)
- Seek pharmacy compatibility advice before mixing
- Use 24-hour driver; change daily

**Monitoring:**
- Site check every 4 hours (redness, swelling, leaking)
- Observe for effect and side effects
- PRN breakthrough medications prescribed alongside`,
 },
 ],
 },
 {
 id: 'family',
 title: 'Family & Caregiver Support',
 icon: Users,
 color: 'pink',
 badge: 'Essential',
 summary: 'Caregiver burden assessment, communicating end of life, bereavement preparation',
 sections: [
 {
 title: 'Caregiver Burden Assessment (Zarit)',
 content: `**When to use:**
- At first family/caregiver contact
- Monthly throughout palliative care
- When caregiver appears distressed

**Zarit Burden Interview (Short Form - 12 items):**
Scored 0-48. Caregiver rates: Never (0) to Nearly always (4)
- Score 0-10: Little or no burden
- Score 11-20: Mild to moderate burden
- Score 21-40: Moderate to severe burden → active intervention needed
- Score 41-48: Severe burden → urgent respite care

**If Zarit ≥ 21:**
- Immediate discussion of respite care options
- Referral to caregiver support group
- Counselling for caregiver
- Review of care package - is more professional help needed?

**Signs of Caregiver Burnout:**
- Emotional exhaustion and resentment
- Physical health deterioration
- Social isolation
- Neglecting own needs
- Feeling trapped`,
 },
 {
 title: 'Preparing Family for End of Life',
 content: `**Signs of Dying - Teach Family What to Expect:**

**Days to Weeks Before:**
- Increased sleep, difficult to rouse
- Less interest in food and drink
- Withdrawing from the world
- May "talk" to deceased relatives
- Confusion or seeing things

**Hours to Days Before:**
- Breathing changes: slower, irregular, with long pauses (Cheyne-Stokes)
- Skin changes: mottled purplish patches on legs/feet (livedo)
- Extremities cold and blue
- Eyes may be partially open
- Jaw relaxed, mouth open
- Throat sounds: "gurgling" (secretions) - not distress

**Reassure Family:**
- Patient is not in pain during this process
- The sounds do not mean suffering
- Being present, talking gently, touch - all meaningful
- It is okay to say goodbye, say what they need to say
- The patient may be able to hear even when unresponsive

**After Death:**
- What to do immediately (who to call, what not to move)
- Cultural and religious last rites
- Post-death support schedule`,
 },
 ],
 },
 {
 id: 'emergency',
 title: 'Emergency Protocols',
 icon: Phone,
 color: 'rose',
 badge: '🚨 CRITICAL',
 summary: 'Acute pain crisis, breathlessness, delirium, haemorrhage, seizures - Ghana contacts',
 sections: [
 {
 title: 'Palliative Emergency - Acute Management',
 content: `**Acute Severe Pain (NRS 8-10 or patient very distressed):**
- If on oral morphine: give immediate-release breakthrough dose now
- If not on opioids: give morphine 5-10mg oral or 2.5-5mg SC
- Reassess in 30 minutes
- If not responding: escalate dose or switch route (SC/IV)
- Identify and treat cause (bone pain, obstruction, infection)

**Acute Breathlessness Crisis:**
- Sit patient upright immediately
- Fan to face
- Low-dose morphine 2.5-5mg SC/IV
- Lorazepam 0.5-1mg SL if anxiety component
- Oxygen ONLY if SpO2 < 88% (not routine)
- ⚠️ NEVER give high-flow O2 in COPD

**Acute Delirium / Agitation:**
- Identify and treat reversible causes: pain, urinary retention, constipation, infection, drugs
- Haloperidol 1-2mg SC/IM - safest first-line
- Lorazepam 1-2mg IM if haloperidol insufficient or seizure risk
- Maintain calm, quiet environment
- Familiar person present; reassure gently

**Haemorrhage:**
- Apply direct firm pressure
- Dark/large towels to minimise visual impact on family
- Morphine 10mg SC immediately for distress
- Midazolam 10-15mg SC/IV for sedation
- Call emergency services immediately

**Seizure:**
- Lay patient safely, protect airway
- Diazepam 10mg PR / Midazolam 5mg buccal
- Time the seizure
- After 5 minutes without stopping: Diazepam 10mg IV or Lorazepam 4mg IV`,
 },
 {
 title: 'Ghana Emergency Contacts',
 content: `**National Emergency Services:**
- National Ambulance Service: **193**
- Police Emergency: **191**
- Fire Service: **192**

**Hospitals - Accra:**
- Korle Bu Teaching Hospital Emergency: **0302-665-401**
- 37 Military Hospital: **0302-776-111**
- Ridge Hospital: **0302-664-401**
- Police Hospital: **0302-784-444**

**Specialist Lines:**
- Mental Health Authority Ghana: **0800-111-011** (toll-free)
- Befrienders Ghana (suicide crisis): **0244-846-472**
- Komfo Anokye Teaching Hospital (Kumasi): **032-202-2301**

**Palliative Care:**
- Ghana Palliative Care Network: Contact through Korle Bu Oncology Unit
- Hospice Africa Ghana: Contact via Accra teaching hospitals`,
 },
 {
 title: 'Neutropenic Sepsis - Oncology Emergency',
 content: `**⚠️ LIFE-THREATENING - Treat within 1 HOUR**

**Criteria:**
- Fever >38.5°C (or <36°C) AND
- Patient is on chemotherapy or bone marrow suppression

**Immediate Actions (ALL within 1 hour):**
1. Blood cultures (2 sets - peripheral + central line if present) BEFORE antibiotics
2. FBC, U&E, LFT, CRP, lactate
3. Broad-spectrum IV antibiotics (e.g., Piperacillin-Tazobactam 4.5g IV TDS)
4. IV fluids if hypotensive (500ml crystalloid bolus)
5. Oxygen if SpO2 < 94%
6. Escalate to senior/oncology team immediately

**Do NOT:**
- Wait for culture results before starting antibiotics
- Send patient home with oral antibiotics for suspected neutropenic sepsis

**Subsequent Management:**
- Admit to hospital
- Repeat vitals every 4 hours minimum
- Adjust antibiotics based on cultures when available
- G-CSF (filgrastim) if available and appropriate`,
 },
 ],
 },
];

// -- Colour config ---------------------------------------------------------
const COLORS = {
 red: { gradient: 'from-red-600 to-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: 'bg-red-600', section: 'bg-red-50 border-red-200 text-red-700' },
 amber: { gradient: 'from-amber-600 to-amber-500',bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700',icon: 'bg-amber-600', section: 'bg-amber-50 border-amber-200 text-amber-700' },
 purple: { gradient: 'from-purple-600 to-purple-500',bg:'bg-purple-50',border:'border-purple-200',text:'text-purple-700',badge:'bg-purple-100 text-purple-700',icon:'bg-purple-600',section:'bg-purple-50 border-purple-200 text-purple-700' },
 yellow: { gradient: 'from-yellow-500 to-yellow-400',bg:'bg-yellow-50',border:'border-yellow-200',text:'text-yellow-800',badge:'bg-yellow-100 text-yellow-800',icon:'bg-yellow-500',section:'bg-yellow-50 border-yellow-200 text-yellow-800' },
 green: { gradient: 'from-green-600 to-green-500', bg:'bg-green-50', border:'border-green-200', text:'text-green-700', badge:'bg-green-100 text-green-700', icon:'bg-green-600', section:'bg-green-50 border-green-200 text-green-700' },
 blue: { gradient: 'from-blue-600 to-blue-500', bg:'bg-blue-50', border:'border-blue-200', text:'text-teal-700', badge:'bg-blue-100 text-teal-700', icon:'bg-teal-600', section:'bg-blue-50 border-blue-200 text-teal-700' },
 pink: { gradient: 'from-pink-600 to-pink-500', bg:'bg-pink-50', border:'border-pink-200', text:'text-pink-700', badge:'bg-pink-100 text-pink-700', icon:'bg-pink-600', section:'bg-pink-50 border-pink-200 text-pink-700' },
 rose: { gradient: 'from-rose-700 to-rose-600', bg:'bg-rose-50', border:'border-rose-300', text:'text-rose-800', badge:'bg-rose-100 text-rose-800', icon:'bg-rose-700', section:'bg-rose-50 border-rose-300 text-rose-800' },
};

// -- Rich text renderer ----------------------------------------------------
function renderInline(text) {
 return text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
 p.startsWith('**') && p.endsWith('**')
 ? <strong key={i} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>
 : <span key={i}>{p}</span>
 );
}

function RichText({ content }) {
 if (!content) return null;
 const lines = content.split('\n');
 const elements = [];
 let i = 0;

 while (i < lines.length) {
 const line = lines[i];

 if (line.trim().startsWith('|') && line.includes('|')) {
 const rows = [];
 while (i < lines.length && lines[i].includes('|')) {
 if (!lines[i].match(/^\s*\|[\s\-|]+\|\s*$/)) rows.push(lines[i]);
 i++;
 }
 elements.push(
 <div key={`t${i}`} className="overflow-x-auto my-4 rounded-lg border border-slate-200 shadow-sm">
 <table className="min-w-full text-xs">
 <tbody>
 {rows.map((row, ri) => {
 const cells = row.split('|').filter(c => c.trim());
 return (
 <tr key={ri} className={ri === 0 ? 'bg-slate-100' : 'odd:bg-slate-50 even:bg-slate-50'}>
 {cells.map((cell, ci) => (
 <td key={ci} className={`px-4 py-2.5 border-b border-slate-100 ${ri === 0 ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
 {cell.trim()}
 </td>
 ))}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 );
 continue;
 }

 if (line.trim() === '') { elements.push(<div key={i} className="h-2" />); i++; continue; }

 if (line.trim().startsWith('-')) {
 elements.push(
 <div key={i} className="flex items-start gap-2.5 py-0.5">
 <span className="text-teal-500 font-bold flex-shrink-0 mt-0.5 text-sm">-</span>
 <span className="text-sm text-slate-700 leading-relaxed">{renderInline(line.trim().slice(1).trim())}</span>
 </div>
 );
 i++; continue;
 }

 const num = line.match(/^(\d+)\.\s+(.+)/);
 if (num) {
 elements.push(
 <div key={i} className="flex items-start gap-2.5 py-0.5">
 <span className="text-teal-600 font-bold flex-shrink-0 min-w-[1.4rem] text-sm mt-0.5">{num[1]}.</span>
 <span className="text-sm text-slate-700 leading-relaxed">{renderInline(num[2])}</span>
 </div>
 );
 i++; continue;
 }

 elements.push(
 <div key={i} className="py-0.5 text-sm text-slate-700 leading-relaxed">{renderInline(line)}</div>
 );
 i++;
 }
 return <div className="space-y-0.5">{elements}</div>;
}

// -- Protocol modal content ------------------------------------------------
function ProtocolModalContent({ protocol }) {
 const [openSections, setOpenSections] = useState(
 () => Object.fromEntries(protocol.sections.map((_, i) => [i, i === 0]))
 );
 const conf = COLORS[protocol.color] || COLORS.blue;

 const toggleSection = (i) => setOpenSections(p => ({ ...p, [i]: !p[i] }));
 const allOpen = Object.values(openSections).every(Boolean);
 const toggleAll = () => {
 const next = !allOpen;
 setOpenSections(Object.fromEntries(protocol.sections.map((_, i) => [i, next])));
 };

 const ProtocolIcon = protocol.icon;

 return (
 <div className="space-y-4">

 {/* ── Title band - book chapter opener ─────────────────────────── */}
 <div className={`rounded-lg border ${conf.border} overflow-hidden`}>
 <div className={`bg-gradient-to-r ${conf.gradient} px-5 py-4`}>
 <div className="flex items-start gap-3">
 <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
 <ProtocolIcon size={18} className="text-white" />
 </div>
 <div className="flex-1">
 <p className="text-white font-bold text-base leading-snug">{protocol.title}</p>
 <p className="text-white/80 text-xs mt-0.5 leading-relaxed">{protocol.summary}</p>
 </div>
 <span className="flex-shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-white/25 text-white uppercase tracking-wide self-start">
 {protocol.badge}
 </span>
 </div>
 </div>
 {/* Contents list - like a book's chapter contents page */}
 <div className="bg-slate-50 border-t border-slate-200 px-5 py-3">
 <p className="text-[10px] font-bold text-slate-400 mb-2 select-none">Contents</p>
 <div className="flex flex-wrap gap-x-4 gap-y-1">
 {protocol.sections.map((s, i) => (
 <button key={i} onClick={() => { setOpenSections(p => ({...p, [i]: true})); }}
 className="text-[11px] text-slate-500 hover:text-teal-700 transition-colors flex items-center gap-1">
 <span className="text-slate-300">§{i + 1}</span> {s.title}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* ── Controls ─────────────────────────────────────────────────── */}
 <div className="flex items-center justify-between px-1">
 <button onClick={toggleAll}
 className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-teal-700 transition">
 {allOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
 {allOpen ? 'Collapse all sections' : 'Expand all sections'}
 </button>
 <button onClick={() => window.print()}
 className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-teal-700 transition">
 Print / Export
 </button>
 </div>

 {/* ── Sections - accordion with numbered chapter headings ──────── */}
 <div className="space-y-2">
 {protocol.sections.map((section, i) => {
 const isOpen = openSections[i] !== false;
 return (
 <div key={i} className="rounded-lg border border-slate-200 overflow-hidden">
 {/* Section header */}
 <button
 onClick={() => toggleSection(i)}
 className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
 >
 {/* Chapter number */}
 <span className="w-6 h-6 rounded flex items-center justify-center bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 flex-shrink-0 shadow-sm">
 {i + 1}
 </span>
 {/* Left accent bar in protocol colour */}
 <span className={`w-0.5 h-5 rounded-full flex-shrink-0 bg-gradient-to-b ${conf.gradient}`} />
 <h4 className="flex-1 text-sm font-semibold text-slate-800 leading-snug text-left">{section.title}</h4>
 {isOpen
 ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" />
 : <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />}
 </button>

 {/* Section body */}
 <AnimatePresence initial={false}>
 {isOpen && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.18 }}
 className="overflow-hidden"
 >
 <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
 <RichText content={section.content} />
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
 })}
 </div>

 {/* ── Footnote ─────────────────────────────────────────────────── */}
 <div className="flex items-start gap-2 px-1 pt-2 border-t border-slate-100">
 <span className="text-slate-300 text-base leading-none select-none mt-0.5">§</span>
 <p className="text-[10.5px] text-slate-400 leading-relaxed">
 Evidence-based protocols adapted for the Ghanaian healthcare context.
 Always consult senior clinicians for complex cases and follow institutional protocols.
 </p>
 </div>
 </div>
 );
}

// -- Main page - two-column library layout ---------------------------------
export default function CareGuide() {
 const [search, setSearch] = useState('');
 const [activeId, setActiveId] = useState(null);

 const filtered = search
 ? PROTOCOLS.filter(p =>
 p.title.toLowerCase().includes(search.toLowerCase()) ||
 p.summary.toLowerCase().includes(search.toLowerCase()) ||
 p.sections.some(s =>
 s.title.toLowerCase().includes(search.toLowerCase()) ||
 s.content.toLowerCase().includes(search.toLowerCase())
 )
 )
 : PROTOCOLS;

 const protocol = PROTOCOLS.find(p => p.id === activeId) || null;

 return (
 <div className="min-h-screen bg-slate-50">
 <PageHeader
 image="/resources/african/african-doctor-female.jpg"
 title="Clinical Care Guide"
 subtitle={`${PROTOCOLS.length} evidence-based protocols · 🇬🇭 Ghana Palliative Care`}
 icon={BookOpen}
 >
 <button onClick={() => window.print()}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg border border-white/30 text-xs font-bold transition">
 Print / Export
 </button>
 </PageHeader>

 {/* ── Two-column layout ────────────────────────────────────────── */}
 <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex flex-col lg:flex-row gap-5 items-start">

 {/* ── LEFT: Protocol index ──────────────────────────────────── */}
 <div className="w-full lg:w-72 lg:flex-shrink-0 flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
 {/* Search */}
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
 <input type="text" value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Search protocols…"
 className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none shadow-sm"/>
 </div>

 {/* Index */}
 <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
 <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <BookOpen size={13} className="text-slate-400"/>
 <span className="text-[11px] font-bold text-slate-500 select-none">Protocols</span>
 </div>
 <span className="text-[10px] font-semibold text-slate-400">{filtered.length} entries</span>
 </div>

 <div className="overflow-y-auto max-h-[60vh]">
 {filtered.length === 0 ? (
 <div className="px-4 py-8 text-center text-slate-400">
 <p className="text-sm italic">No protocols found</p>
 </div>
 ) : (
 filtered.map((p) => {
 const Icon = p.icon;
 const conf = COLORS[p.color] || COLORS.blue;
 const isActive = activeId === p.id;
 return (
 <button key={p.id} onClick={() => setActiveId(p.id)}
 className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${
 isActive ? `${conf.bg} border-l-2 ${conf.border}` : 'hover:bg-slate-50'
 }`}>
 <div className={`w-8 h-8 rounded-lg ${conf.icon} flex items-center justify-center flex-shrink-0`}>
 <Icon size={14} className="text-white"/>
 </div>
 <div className="flex-1 min-w-0">
 <p className={`text-sm font-semibold truncate ${isActive ? conf.text : 'text-slate-700'}`}>{p.title}</p>
 <p className="text-[10px] text-slate-400 mt-0.5">{p.sections.length} sections</p>
 </div>
 {isActive && <ChevronRight size={13} className={conf.text}/>}
 </button>
 );
 })
 )}
 </div>

 {/* Advisory footer */}
 <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
 <div className="flex items-start gap-2">
 <Activity size={11} className="text-teal-500 flex-shrink-0 mt-0.5"/>
 <p className="text-[10px] text-slate-400 leading-relaxed">
 Evidence-based · adapted for the Ghanaian context. Always consult senior clinicians for complex cases.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* ── RIGHT: Reading pane ──────────────────────────────────── */}
 <div className="flex-1 min-w-0">
 <AnimatePresence mode="wait">
 {!protocol ? (
 <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
 className="h-full flex flex-col items-center justify-center py-24 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400">
 <BookOpen size={40} className="opacity-20 mb-3"/>
 <p className="font-semibold text-slate-500">Select a protocol from the index</p>
 <p className="text-sm mt-1">Click any entry on the left to read the full clinical guide</p>
 </motion.div>
 ) : (
 <motion.div key={protocol.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.15}}
 className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
 <div className="p-5">
 <ProtocolModalContent protocol={protocol}/>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>
 );
}

