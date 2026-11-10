/**
 * ProcedureTraining.jsx
 * =====================
 * Step-by-step illustrated clinical procedure guides for caregivers and clinicians.
 * Access: caregiver + clinician + admin roles only.
 *
 * Features:
 * - Categorised procedure library (wound care, medications, vitals, comfort, etc.)
 * - Numbered step cards with icon illustrations
 * - Warning / critical callouts per step
 * - Video embed support (YouTube or local)
 * - Completion tracking per procedure (localStorage)
 * - Search + category filter
 * - Print-friendly modal
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, CheckCircle, AlertTriangle, Info, Play,
  ChevronRight, ChevronLeft, Printer, BookOpen,
  Heart, Activity, Pill, Droplets, Hand, Wind,
  Users, Shield, Thermometer, Stethoscope, ArrowLeft,
  Check, Clock, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';

// ── Category metadata ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',          label: 'All Procedures',   icon: BookOpen    },
  { id: 'vitals',       label: 'Vitals & Monitoring', icon: Activity  },
  { id: 'wound',        label: 'Wound & Skin Care',   icon: Hand      },
  { id: 'medication',   label: 'Medication Admin',    icon: Pill      },
  { id: 'comfort',      label: 'Comfort & Positioning', icon: Heart   },
  { id: 'breathing',    label: 'Breathing Support',   icon: Wind      },
  { id: 'nutrition',    label: 'Nutrition & Hydration', icon: Droplets },
  { id: 'hygiene',      label: 'Personal Hygiene',    icon: Droplets  },
  { id: 'emergency',    label: 'Emergency Response',  icon: AlertTriangle },
];

// ── Step type styling ──────────────────────────────────────────────────────
const STEP_STYLES = {
  action:   { bg: 'bg-[var(--card-bg)]',   border: 'border-[var(--card-border)]', num: 'bg-teal-600 text-white' },
  warning:  { bg: 'bg-amber-50',            border: 'border-amber-200',             num: 'bg-amber-500 text-white' },
  critical: { bg: 'bg-red-50',              border: 'border-red-200',               num: 'bg-red-600 text-white'   },
  tip:      { bg: 'bg-blue-50',             border: 'border-blue-200',              num: 'bg-blue-500 text-white'  },
  check:    { bg: 'bg-green-50',            border: 'border-green-200',             num: 'bg-green-600 text-white' },
};

// ── Procedure data ─────────────────────────────────────────────────────────
const PROCEDURES = [
  // ── VITALS ───────────────────────────────────────────────────────────────
  {
    id: 'record-vitals',
    category: 'vitals',
    title: 'Recording Vital Signs',
    summary: 'How to accurately measure and record pulse, blood pressure, oxygen saturation and temperature.',
    duration: '10 min',
    level: 'Foundational',
    icon: Activity,
    color: '#0d9488',
    videoUrl: 'https://www.youtube.com/embed/0NfUlRPOXrs',
    steps: [
      { type: 'action', title: 'Wash your hands', body: 'Wash hands with soap and water for at least 20 seconds, or use alcohol hand gel. Dry thoroughly. This prevents spreading infection to or from the patient.' },
      { type: 'tip', title: 'Allow the patient to rest first', body: 'Ask the patient to sit or lie quietly for 5 minutes before recording. Activity, pain and anxiety all raise readings. Record the resting value, not an excited one.' },
      { type: 'action', title: 'Measure pulse (heart rate)', body: 'Place two fingers (not your thumb) on the inside of the wrist below the thumb. Count beats for a full 60 seconds. Normal adult range: 60-100 beats per minute. Record the number and note if the rhythm feels irregular.' },
      { type: 'action', title: 'Measure blood pressure', body: 'Place the cuff on the upper arm 2-3 cm above the elbow, arm resting at heart level. Press the start button. Do not move the arm or talk during the reading. Record both numbers (e.g. 120/80 mmHg).' },
      { type: 'warning', title: 'Blood pressure alert thresholds', body: 'If systolic (top number) is above 180 OR below 90, this is a critical alert. Enter it into the Aura app immediately — the system will notify the clinician automatically.' },
      { type: 'action', title: 'Measure oxygen saturation (SpO2)', body: 'Place the pulse oximeter clip on the patient\'s fingertip, ring finger preferred. Wait 10-15 seconds for the reading to stabilise. Normal: 95-100%. Below 90% is a medical emergency.' },
      { type: 'critical', title: 'SpO2 below 90% — act immediately', body: 'If SpO2 reads below 90%: (1) Sit the patient upright if possible. (2) Call the supervising clinician NOW. (3) Enter the reading in Aura immediately — this triggers an urgent alert automatically. Do not wait.' },
      { type: 'action', title: 'Measure temperature', body: 'Use a digital thermometer in the armpit (axillary) or ear. Hold for the number of seconds the thermometer indicates. Normal: 36.1-37.2°C. Above 38.5°C is a fever requiring clinician notification.' },
      { type: 'check', title: 'Enter all readings in Aura', body: 'Open the patient\'s record in Aura → Vitals tab → Record Vitals. Enter all readings with the correct time. The system automatically flags abnormal values and alerts the care team.' },
    ],
  },

  {
    id: 'pulse-oximeter',
    category: 'vitals',
    title: 'Using a Pulse Oximeter',
    summary: 'Correct technique for measuring oxygen saturation and understanding the readings.',
    duration: '5 min',
    level: 'Foundational',
    icon: Activity,
    color: '#0891b2',
    steps: [
      { type: 'action', title: 'Choose the correct finger', body: 'Use the ring or middle finger of the dominant hand. Remove any nail polish — dark colours block the light reading. Make sure the finger is warm; cold fingers give falsely low readings.' },
      { type: 'action', title: 'Position the oximeter correctly', body: 'Clip the oximeter so the finger fits snugly but not tightly. The red light should be on the pad of the finger, not the nail. The screen should face you.' },
      { type: 'action', title: 'Wait for a stable reading', body: 'Wait 10-15 seconds until the number stops changing. The waveform bar at the bottom should be regular and strong. A weak or irregular waveform means the reading may be inaccurate — reposition and try again.' },
      { type: 'warning', title: 'Causes of false readings', body: 'False low readings can be caused by: nail polish, poor circulation (cold hands), patient movement, poor positioning, very bright light on the sensor. If the reading seems wrong, warm the hand, reposition, and retry.' },
      { type: 'check', title: 'Interpret the reading', body: '95-100%: Normal. 91-94%: Below normal — monitor closely and notify clinician if not improving. 90% or below: Medical emergency — notify clinician immediately and sit the patient upright.' },
    ],
  },

  // ── WOUND CARE ───────────────────────────────────────────────────────────
  {
    id: 'wound-dressing',
    category: 'wound',
    title: 'Wound Dressing Change',
    summary: 'Safe technique for cleaning and redressing a wound at home, minimising infection risk.',
    duration: '20-30 min',
    level: 'Intermediate',
    icon: Hand,
    color: '#dc2626',
    steps: [
      { type: 'action', title: 'Gather all supplies before starting', body: 'You will need: clean gloves (2 pairs), sterile saline solution or clean boiled cooled water, dressing pads, medical tape or bandage, clinical waste bag. Lay them out on a clean surface before touching the patient.' },
      { type: 'action', title: 'Wash hands thoroughly', body: 'Wash hands with soap and water for 20 seconds. Dry with a clean paper towel. Put on the first pair of gloves before removing the old dressing.' },
      { type: 'action', title: 'Remove the old dressing', body: 'Gently lift the edges of the old dressing. If it is stuck, moisten it with saline first — never rip it off. Place the old dressing directly into the clinical waste bag. Remove your first gloves into the same bag.' },
      { type: 'action', title: 'Assess the wound', body: 'Look at the wound carefully. Note: size (approximate length and width), colour of the wound bed (red = healing, yellow = infection, black = dead tissue), amount and colour of discharge, any odour, condition of surrounding skin. Report changes to the clinician.' },
      { type: 'warning', title: 'Signs of infection — stop and call', body: 'If you see any of these, do NOT proceed with normal dressing. Call the clinician: increased redness spreading from the wound edges, hot skin around the wound, green or brown discharge, foul smell, patient reports increased pain, patient has a fever.' },
      { type: 'action', title: 'Clean the wound', body: 'Put on fresh gloves. Using saline-soaked gauze, wipe the wound from the centre outward in one direction. Use a fresh piece of gauze for each wipe — never go back over the wound with used gauze. This removes bacteria without pushing them back in.' },
      { type: 'action', title: 'Apply the new dressing', body: 'Choose the dressing size to cover the wound and 2-3 cm around the edges. Place it gently — do not press hard. Secure with tape, ensuring all edges are sealed but not so tight it restricts circulation.' },
      { type: 'check', title: 'Dispose of waste and document', body: 'Place all used materials in the clinical waste bag. Remove gloves inside-out and add them. Wash hands again. Record the wound assessment in Aura: wound appearance, dressing used, next dressing date. Take a photo if the wound has changed significantly.' },
    ],
  },

  {
    id: 'pressure-sore-prevention',
    category: 'wound',
    title: 'Pressure Sore Prevention',
    summary: 'How to protect bed-bound patients from pressure injuries through repositioning and skin care.',
    duration: '15 min',
    level: 'Foundational',
    icon: Hand,
    color: '#ea580c',
    steps: [
      { type: 'action', title: 'Understand the risk areas', body: 'Pressure sores develop where bone is close to skin with little padding: heels, ankles, sacrum (base of spine), hips, shoulder blades, back of head, elbows. Inspect these areas at every care visit.' },
      { type: 'action', title: 'Reposition every 2 hours', body: 'For patients who cannot move themselves, turn them every 2 hours minimum. Use a draw sheet (a folded sheet under the patient) to move without dragging skin. Record turning times on the care log.' },
      { type: 'tip', title: 'The 30-degree rule', body: 'When a patient cannot tolerate full side-lying, tilt them to 30 degrees using a pillow behind their back. This keeps pressure off the hip bone (greater trochanter) which is a common pressure sore site.' },
      { type: 'warning', title: 'Never massage red areas', body: 'If you find a red area that does not go white when you press on it (non-blanching redness), this is a Grade 1 pressure injury. Do NOT massage it — this damages fragile blood vessels. Relieve pressure immediately and report to the clinician.' },
      { type: 'action', title: 'Protect bony areas', body: 'Use foam or gel heel protectors on heels. Place pillows between the knees to prevent hip bones pressing together. Use a pressure-relieving mattress or overlay if available.' },
      { type: 'action', title: 'Keep skin clean and dry', body: 'Clean skin with gentle soap and warm water after each episode of incontinence. Pat dry thoroughly — moisture softens skin and increases injury risk. Apply a thin layer of barrier cream (zinc oxide or petroleum jelly) to vulnerable areas.' },
      { type: 'check', title: 'Document any skin changes', body: 'At each repositioning, check the pressure areas. If you find any redness, blistering, or broken skin, photograph it and document its location and size in the Aura daily care log immediately.' },
    ],
  },

  // ── MEDICATION ADMINISTRATION ─────────────────────────────────────────────
  {
    id: 'oral-medications',
    category: 'medication',
    title: 'Administering Oral Medications',
    summary: 'The five rights of medication administration and safe technique for giving tablets, capsules and liquids.',
    duration: '10 min',
    level: 'Foundational',
    icon: Pill,
    color: '#7c3aed',
    steps: [
      { type: 'check', title: 'The Five Rights — check every time', body: 'Before giving any medication, confirm all five: (1) Right PATIENT — check their name and date of birth. (2) Right MEDICATION — read the label carefully. (3) Right DOSE — confirm the amount. (4) Right ROUTE — this procedure is for oral (by mouth) only. (5) Right TIME — check the schedule.' },
      { type: 'action', title: 'Check the medication record in Aura', body: 'Open the patient\'s Medications tab in Aura. Confirm the medication is due now. Check for any special instructions (e.g. "take with food", "crush tablet", "do not give with milk").' },
      { type: 'warning', title: 'Never give a medication you are unsure about', body: 'If you do not recognise the medication, the dose seems too high, or the instructions are unclear — do NOT give it. Call the prescribing clinician first. It is always safer to wait and confirm than to give the wrong dose.' },
      { type: 'action', title: 'Prepare the medication', body: 'Wash your hands. Use a medicine cup or spoon — never your bare hands. For liquid medications, hold the measuring cup at eye level to read the correct line. For tablets, tip from the container into the cup without touching.' },
      { type: 'action', title: 'Give the medication', body: 'Help the patient sit upright. Offer a full glass of water alongside. Watch the patient swallow — do not leave the medication at the bedside. Some patients may try to hide tablets rather than swallow them.' },
      { type: 'action', title: 'Stay with the patient briefly', body: 'Stay for 5 minutes after giving pain medication or sedatives. Observe for any immediate reaction: rash, difficulty breathing, excessive drowsiness. These are rare but require immediate clinician notification.' },
      { type: 'check', title: 'Record it in Aura immediately', body: 'Mark the dose as taken in the Aura Medications tab. If the patient refused or vomited the medication, record this too with a brief reason. This triggers the adherence tracking system.' },
      { type: 'critical', title: 'If the patient cannot swallow', body: 'If the patient is too drowsy, confused, or struggling to swallow, do NOT give oral medication — there is a risk of choking (aspiration). Call the clinician. Some medications can be given as patches, suppositories, or subcutaneous injections instead.' },
    ],
  },

  {
    id: 'subcutaneous-syringe-driver',
    category: 'medication',
    title: 'Monitoring a Syringe Driver',
    summary: 'How to check a subcutaneous syringe driver is running correctly (observation only — not set-up).',
    duration: '10 min',
    level: 'Advanced',
    icon: Pill,
    color: '#db2777',
    steps: [
      { type: 'warning', title: 'This is observation only', body: 'Caregivers should NEVER change, refill, or adjust the syringe driver settings. Only trained nurses or clinicians do this. Your role is to check it is running correctly and report problems.' },
      { type: 'action', title: 'Check the driver is running', body: 'The syringe driver should have a steady green indicator light or audible click. The syringe plunger should be slowly advancing. Note the current volume marking on the syringe.' },
      { type: 'action', title: 'Inspect the infusion site', body: 'Look at the needle or cannula site on the patient\'s skin (usually upper arm, chest, or abdomen). It should look clean with no: redness, swelling, hardness under the skin, leaking fluid. The dressing should be clean and stuck down.' },
      { type: 'warning', title: 'Signs to report immediately', body: 'Call the nurse or clinician if you notice: the driver has stopped or is alarming, the site is red or swollen, the syringe is empty before the expected time, the tubing has become disconnected or kinked, or the patient\'s pain suddenly worsens (suggesting it has stopped).' },
      { type: 'action', title: 'Check the patient\'s comfort', body: 'Ask the patient how their pain and nausea are. The driver provides continuous relief — if they report a sudden return of symptoms, the driver may have stopped. Record their symptom scores in Aura as usual.' },
      { type: 'check', title: 'Document your observations', body: 'Record in the Aura daily care log: driver running (yes/no), site appearance, volume remaining, patient\'s symptom scores. Flag any concerns immediately in the notes field.' },
    ],
  },

  // ── COMFORT & POSITIONING ─────────────────────────────────────────────────
  {
    id: 'repositioning',
    category: 'comfort',
    title: 'Repositioning a Bed-Bound Patient',
    summary: 'Safe manual handling technique to reposition a patient without injury to them or yourself.',
    duration: '15 min',
    level: 'Foundational',
    icon: Heart,
    color: '#059669',
    steps: [
      { type: 'action', title: 'Assess before moving', body: 'Before moving the patient, check: are there any painful areas that need protecting? Do they have any wounds, drains, or tubes? Are there 1 or 2 people needed? A patient who cannot assist at all requires 2 people to reposition safely.' },
      { type: 'action', title: 'Explain what you are going to do', body: 'Always tell the patient what you are about to do, even if they appear unconscious. "I am going to turn you onto your left side now, to help your breathing and prevent sore areas." This reduces anxiety and maintains dignity.' },
      { type: 'action', title: 'Raise the bed or use the floor space', body: 'If using a bed, raise it to your hip height to avoid back strain. Keep your feet shoulder-width apart, bend your knees slightly, and keep your back straight. Never twist your back while lifting.' },
      { type: 'action', title: 'Use a draw sheet', body: 'A folded sheet under the patient lets you slide rather than lift. Fold both sides of the sheet close to the patient\'s body, grip firmly, and slide smoothly. Never drag skin against the mattress — this causes skin tears and pressure injuries.' },
      { type: 'action', title: 'Position with pillows', body: 'Once turned to the side: (1) Place one pillow under the head. (2) Place one pillow behind the back for support. (3) Place one pillow between the knees. (4) Ensure the top arm rests comfortably — not pressing on the chest.' },
      { type: 'check', title: 'Check comfort and document', body: 'Ask if the patient is comfortable. Check all bony prominences are free from pressure. Note the new position and time in the Aura daily care log. The next turn is due in 2 hours.' },
    ],
  },

  {
    id: 'breathlessness-management',
    category: 'comfort',
    title: 'Managing Breathlessness at the Bedside',
    summary: 'Immediate non-medication measures to relieve the distress of breathlessness in palliative patients.',
    duration: '10 min',
    level: 'Foundational',
    icon: Heart,
    color: '#0891b2',
    steps: [
      { type: 'action', title: 'Stay calm — your calm reduces their panic', body: 'Breathlessness causes intense fear. Your calm, steady presence is itself therapeutic. Sit next to them, make eye contact, speak in a low steady voice. "I am right here with you. Let\'s breathe together."' },
      { type: 'action', title: 'Sit the patient upright at 45 degrees', body: 'Lying flat makes breathlessness worse by pushing abdominal organs against the diaphragm. Help the patient sit forward with pillows behind their back and under their arms. This opens the chest and makes breathing easier.' },
      { type: 'action', title: 'Use a small fan directed at the face', body: 'A cool airflow on the face stimulates cold receptors around the mouth and nose, directly reducing the sensation of breathlessness — this works even when oxygen would not help. Use a handheld fan, table fan, or open window.' },
      { type: 'action', title: 'Teach pursed-lip breathing', body: 'Ask the patient to breathe in slowly through the nose for 2 counts. Then breathe out slowly through pursed (puckered) lips for 4 counts. This slows the breathing rate and prevents the panic spiral of "I can\'t breathe so I breathe faster."' },
      { type: 'action', title: 'Remove tight clothing and clear the room', body: 'Loosen any tight clothing around the chest. If there are many people in the room, ask all but one to step out — a crowded room feels more airless. Open a window if the weather allows.' },
      { type: 'warning', title: 'Oxygen is not always the answer', body: 'In palliative care, supplemental oxygen only helps if the patient\'s SpO2 is genuinely low (below 88%). For many breathless patients near end of life, the fan works better than oxygen. Do not force an oxygen mask on a distressed patient.' },
      { type: 'critical', title: 'When to call urgently', body: 'Call the clinician immediately if: SpO2 drops below 88%, the patient cannot speak in sentences, lips or fingernails turn blue, the patient is using neck or shoulder muscles to breathe, or breathlessness comes on suddenly when it was previously controlled.' },
    ],
  },

  // ── BREATHING SUPPORT ────────────────────────────────────────────────────
  {
    id: 'oxygen-therapy',
    category: 'breathing',
    title: 'Administering Prescribed Oxygen',
    summary: 'Safe delivery of supplemental oxygen in the home or facility setting.',
    duration: '10 min',
    level: 'Intermediate',
    icon: Wind,
    color: '#0369a1',
    steps: [
      { type: 'warning', title: 'Oxygen must be prescribed', body: 'Never start oxygen without a clinician\'s written prescription. The prescription will state the flow rate (e.g. 2 L/min) and device type (nasal cannula or face mask). Do not exceed the prescribed rate.' },
      { type: 'critical', title: 'Fire safety — no smoking near oxygen', body: 'Oxygen greatly increases fire risk. No smoking anywhere in the room. No naked flames, candles, or gas cookers within 2 metres. Keep the cylinder upright and away from heat sources. No petroleum-based products (Vaseline, oil) near the face or equipment.' },
      { type: 'action', title: 'Set up the equipment', body: 'Attach the tubing to the oxygen cylinder or concentrator. Connect the humidifier bottle if prescribed (keeps airways moist). Set the flow rate dial to the prescribed number. Listen for the hiss of oxygen flow before applying to the patient.' },
      { type: 'action', title: 'Apply the nasal cannula', body: 'Place the two small prongs gently into the nostrils pointing downward. Loop the tubing over both ears and tighten the slider under the chin — snug but not tight. Check the prongs are not pressing hard into the nose or nostril rims.' },
      { type: 'warning', title: 'COPD patients: different target', body: 'For patients with COPD, the target SpO2 is 88-92%, NOT 95-100%. Too much oxygen in COPD can suppress breathing drive. If the patient\'s SpO2 goes above 94% on the prescribed dose, reduce it and notify the clinician.' },
      { type: 'action', title: 'Monitor after starting oxygen', body: 'Check SpO2 after 5 minutes. The target depends on the patient\'s condition (see prescription). Check the skin under the tubing at ears and nose every 2 hours — oxygen tubing causes pressure injuries over time. Pad with gauze if needed.' },
      { type: 'check', title: 'Document in Aura', body: 'Record: flow rate used, SpO2 before and after, patient comfort, any skin issues under tubing. If SpO2 does not improve to target within 15 minutes of starting oxygen, call the clinician.' },
    ],
  },

  // ── NUTRITION & HYDRATION ─────────────────────────────────────────────────
  {
    id: 'assisted-feeding',
    category: 'nutrition',
    title: 'Assisted Eating and Drinking',
    summary: 'Supporting a patient to eat and drink safely, including swallowing awareness.',
    duration: '20-30 min',
    level: 'Foundational',
    icon: Droplets,
    color: '#d97706',
    steps: [
      { type: 'action', title: 'Sit the patient fully upright', body: 'The patient must be sitting upright at 90 degrees for eating and drinking — not reclining. This keeps the airway above the oesophagus and prevents choking. If they cannot sit fully upright, raise the head of the bed to at least 60 degrees.' },
      { type: 'warning', title: 'Swallowing alert — watch for these signs', body: 'If the patient coughs, chokes, or has a gurgly voice during or after swallowing, they may have a swallowing problem (dysphagia). Stop the meal and report to the clinician. Do not give food or drink again until a swallowing assessment has been done.' },
      { type: 'action', title: 'Offer small amounts at a time', body: 'Use a teaspoon, not a tablespoon, for the first few mouthfuls. Watch the patient swallow completely before offering the next spoonful. Never hurry a patient with eating — rushed feeding causes choking.' },
      { type: 'tip', title: 'Soft foods are safer for weak patients', body: 'If the patient struggles with solid food, offer soft or mashed options: soft-cooked vegetables, mashed yam or plantain, smooth peanut butter, soft-boiled eggs, yoghurt, pureed fruit. Avoid hard, dry or crumbly foods.' },
      { type: 'action', title: 'Thickened drinks if prescribed', body: 'If the clinician has prescribed thickened fluids, follow the instructions for mixing. Thin fluids (water, juice, soup) pass too quickly for patients with swallowing problems and can enter the airway.' },
      { type: 'action', title: 'Mouth care after eating', body: 'After every meal, help the patient brush teeth or use a mouthwash. Food left in the mouth of a patient with swallowing problems can be aspirated (inhaled) during sleep, causing pneumonia.' },
      { type: 'check', title: 'Document intake', body: 'Record what the patient ate and drank in the Aura care log. If they refused food, took less than half, or showed any swallowing difficulties, note this — poor intake and swallowing changes are important clinical flags.' },
    ],
  },

  // ── PERSONAL HYGIENE ─────────────────────────────────────────────────────
  {
    id: 'bed-bath',
    category: 'hygiene',
    title: 'Giving a Bed Bath',
    summary: 'Complete bed bath for patients who cannot wash themselves, maintaining dignity and preventing infection.',
    duration: '30-40 min',
    level: 'Foundational',
    icon: Droplets,
    color: '#059669',
    steps: [
      { type: 'action', title: 'Prepare the environment', body: 'Close curtains or the door. Ensure the room is warm (above 22°C). Gather: two basins of comfortably warm water, 2-3 washcloths, mild soap, towels, clean clothes, barrier cream for skin, clinical waste bag.' },
      { type: 'action', title: 'Maintain dignity throughout', body: 'Only expose the body part being washed, then cover it again. Talk to the patient throughout. Ask their preferences — do they prefer soap or not? What water temperature? This is their body — they are in charge of how it is cared for.' },
      { type: 'action', title: 'Wash in order: face, then body, genitals last', body: 'Start with the face using clean warm water (no soap on the face unless requested). Then arms, chest, abdomen, legs. Change the water before washing the genital area. Always wash from cleanest to least clean area.' },
      { type: 'action', title: 'Dry thoroughly', body: 'Pat (don\'t rub) each area dry with a towel before moving on. Pay particular attention to skin folds: under the breasts, groin, between toes, armpits. Moisture left in skin folds causes skin breakdown and fungal infection.' },
      { type: 'action', title: 'Inspect the skin during the bath', body: 'The bed bath is the best time to inspect all skin areas. Look for: new redness, bruising, skin tears, swelling, rashes. This is when you will catch early pressure injuries. Document any findings in Aura.' },
      { type: 'action', title: 'Apply barrier cream to vulnerable areas', body: 'After drying, apply thin barrier cream to pressure areas and areas exposed to moisture (around incontinence pads). Help the patient put on clean, comfortable clothing — loose, soft fabrics are best.' },
      { type: 'check', title: 'Document and dispose', body: 'Dispose of washcloths into the laundry bag and waste water appropriately. Wash hands thoroughly. Document the bath, any skin findings, and patient\'s comfort in the Aura care log.' },
    ],
  },

  // ── EMERGENCY RESPONSE ───────────────────────────────────────────────────
  {
    id: 'fall-response',
    category: 'emergency',
    title: 'Responding to a Patient Fall',
    summary: 'What to do when a patient falls — assessment, safety, and reporting.',
    duration: '10 min',
    level: 'Foundational',
    icon: AlertTriangle,
    color: '#dc2626',
    steps: [
      { type: 'critical', title: 'Do not move the patient immediately', body: 'If you find or witness a patient fall, do NOT move them immediately. First assess for injury. Moving a patient with a spinal injury can cause permanent paralysis.' },
      { type: 'action', title: 'Assess for serious injury', body: 'Stay calm and speak to the patient. Ask: "Are you in pain? Can you move your arms and legs?" Look for obvious injuries: deformity, unequal arm or leg positions, head injury, bleeding. If the patient is unconscious, call emergency services immediately.' },
      { type: 'action', title: 'Make the patient comfortable where they are', body: 'If there are no obvious serious injuries, place a pillow under their head. Cover them with a blanket. Do not leave them alone on the floor. Keep them calm and still while you call for help.' },
      { type: 'warning', title: 'Call for help before moving', body: 'Even if the patient seems uninjured, do not try to lift them alone — you risk injuring yourself and them. Call the supervising clinician or nurse. If you suspect serious injury (hip fracture, head injury), call emergency services.' },
      { type: 'action', title: 'Help them up safely (if no injury)', body: 'Only after clinician assessment. Use two people. Move a chair next to the patient. Help them roll to their side, then to kneeling, then push up onto the chair. This is the safest way to get a person from the floor.' },
      { type: 'check', title: 'Document and complete an incident report', body: 'Report all falls in the Aura daily care log immediately: exact time, what you witnessed, any injuries found, action taken, clinician notified. Falls must be documented even if no injury occurred — repeat falls indicate a pattern that needs addressing.' },
    ],
  },

  {
    id: 'seizure-response',
    category: 'emergency',
    title: 'Responding to a Seizure',
    summary: 'Safe management of a seizure episode — what to do and what NOT to do.',
    duration: '5 min',
    level: 'Intermediate',
    icon: AlertTriangle,
    color: '#7c3aed',
    steps: [
      { type: 'critical', title: 'Stay calm and start timing', body: 'Note the exact time the seizure started. Most seizures last 1-3 minutes. A seizure lasting more than 5 minutes is a medical emergency — call emergency services immediately.' },
      { type: 'action', title: 'Protect from injury — clear the area', body: 'Move any hard or sharp objects away from the patient. If possible, guide them gently to the floor if they are standing. Place something soft (folded jacket, pillow) under their head. Do not restrain their movements.' },
      { type: 'critical', title: 'Never put anything in their mouth', body: 'The old idea of putting something in the mouth to prevent swallowing the tongue is wrong and dangerous. The tongue cannot be swallowed. Objects in the mouth during a seizure cause broken teeth and can be inhaled.' },
      { type: 'action', title: 'Roll to recovery position after shaking stops', body: 'Once the shaking has stopped, gently roll the patient onto their side (recovery position). This keeps the airway clear and allows any saliva or vomit to drain out. Keep the head tilted slightly back.' },
      { type: 'action', title: 'Stay with them through recovery', body: 'After a seizure, the patient may be confused, drowsy, or frightened. Stay with them. Speak calmly: "You had a seizure. You are safe. I am right here." Do not give food or drink until they are fully alert.' },
      { type: 'warning', title: 'Call the clinician after every seizure', body: 'All seizures in palliative care patients must be reported to the clinician, even if the patient recovers fully. Some patients have prescribed emergency seizure medication (e.g. midazolam buccal gel) — if prescribed, follow those specific instructions.' },
      { type: 'check', title: 'Document in Aura immediately', body: 'Record: time started, duration, what the seizure looked like (whole body or one side, eyes open or closed), how long recovery took, patient\'s condition afterwards. This information helps the clinician manage future episodes.' },
    ],
  },
];

// ── Completion tracking ────────────────────────────────────────────────────
function getCompleted() {
  try { return JSON.parse(localStorage.getItem('procedure_completed') || '{}'); }
  catch { return {}; }
}
function markComplete(id) {
  const c = getCompleted();
  c[id] = new Date().toISOString();
  localStorage.setItem('procedure_completed', JSON.stringify(c));
}

// ── Step icon helper ───────────────────────────────────────────────────────
function StepIcon({ type, number }) {
  const icons = {
    warning:  <AlertTriangle size={13} />,
    critical: <AlertTriangle size={13} />,
    tip:      <Info size={13} />,
    check:    <Check size={13} />,
    action:   <span className="text-xs font-black">{number}</span>,
  };
  const styles = STEP_STYLES[type] || STEP_STYLES.action;
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${styles.num}`}>
      {icons[type]}
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────
function StepCard({ step, number }) {
  const styles = STEP_STYLES[step.type] || STEP_STYLES.action;
  return (
    <div className={`rounded-xl border p-4 ${styles.bg} ${styles.border}`}>
      <div className="flex items-start gap-3">
        <StepIcon type={step.type} number={number} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--text-900)] mb-1 leading-snug">{step.title}</p>
          <p className="text-sm text-[var(--text-700)] leading-relaxed">{step.body}</p>
        </div>
      </div>
    </div>
  );
}

// ── Procedure detail modal ─────────────────────────────────────────────────
function ProcedureModal({ proc, onClose }) {
  const [step, setStep] = useState(-1); // -1 = overview
  const [completed, setCompleted] = useState(getCompleted());
  const isDone = !!completed[proc.id];
  const totalSteps = proc.steps.length;

  const handleComplete = () => {
    markComplete(proc.id);
    setCompleted(getCompleted());
    toast.success(`${proc.title} marked as completed`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-[var(--card-border)]"
             style={{ borderTop: `4px solid ${proc.color}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: `${proc.color}18` }}>
                <proc.icon size={20} style={{ color: proc.color }} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-[var(--text-900)] text-base leading-tight">{proc.title}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-[var(--text-500)] flex items-center gap-1"><Clock size={11}/> {proc.duration}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${proc.color}15`, color: proc.color }}>{proc.level}</span>
                  {isDone && (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle size={11}/> Completed</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-400)] hover:bg-[var(--page-bg)] transition flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Optional video */}
          {proc.videoUrl && step === -1 && (
            <div className="relative w-full" style={{ paddingBottom: '36%', background: '#000' }}>
              <iframe
                src={proc.videoUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={proc.title}
              />
            </div>
          )}

          {step === -1 ? (
            /* Overview — all steps listed */
            <div className="p-5 space-y-3">
              <p className="text-sm text-[var(--text-600)] leading-relaxed mb-4">{proc.summary}</p>
              <p className="text-xs font-bold text-[var(--text-400)] uppercase tracking-wider mb-3">
                {totalSteps} Steps
              </p>
              {proc.steps.map((s, i) => (
                <StepCard key={i} step={s} number={i + 1} />
              ))}
            </div>
          ) : (
            /* Single step focus mode */
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[var(--text-400)]">Step {step + 1} of {totalSteps}</span>
                <div className="flex-1 mx-4 h-1.5 bg-[var(--page-bg)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                       style={{ width: `${((step + 1) / totalSteps) * 100}%`, background: proc.color }} />
                </div>
              </div>
              <StepCard step={proc.steps[step]} number={step + 1} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
          {step === -1 ? (
            <>
              <button onClick={() => setStep(0)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                style={{ background: proc.color }}>
                <Play size={14} /> Start Step-by-Step
              </button>
              {!isDone && (
                <button onClick={handleComplete}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-green-300 text-green-700 hover:bg-green-50 transition">
                  <CheckCircle size={14} /> Mark Complete
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(s => s <= 0 ? -1 : s - 1)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-[var(--card-border)] text-[var(--text-700)] hover:bg-[var(--page-bg)] transition">
                <ChevronLeft size={15}/> {step === 0 ? 'Overview' : 'Back'}
              </button>
              {step < totalSteps - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: proc.color }}>
                  Next <ChevronRight size={15}/>
                </button>
              ) : (
                <button onClick={() => { handleComplete(); onClose(); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition">
                  <CheckCircle size={15}/> Finish & Complete
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ProcedureTraining() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [completed] = useState(getCompleted());

  // Role guard
  if (!['clinician', 'caregiver', 'admin'].includes(user?.role)) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Shield size={40} className="mx-auto mb-4 text-[var(--text-300)]" />
          <h2 className="text-base font-bold text-[var(--text-800)] mb-2">Clinical Staff Only</h2>
          <p className="text-sm text-[var(--text-500)] mb-4">Procedure training is available to caregivers and clinicians only.</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  const filtered = useMemo(() => {
    return PROCEDURES.filter(p => {
      const matchCat = category === 'all' || p.category === category;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.summary.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const completedCount = Object.keys(completed).filter(id => PROCEDURES.find(p => p.id === id)).length;

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-clinical-team.jpg"
        title="Procedure Training"
        subtitle="Step-by-step clinical guides for caregivers and clinicians"
        icon={Stethoscope}
        stats={[
          { label: 'Procedures', value: PROCEDURES.length, color: '#2dd4bf' },
          { label: 'Completed', value: completedCount, color: '#4ade80', pulse: false },
          { label: 'Remaining', value: PROCEDURES.length - completedCount, color: '#fbbf24', pulse: false },
        ]}
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 space-y-5">

        {/* Search + category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-400)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search procedures…"
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--card-bg)] text-[var(--text-900)] focus:border-teal-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const count = id === 'all' ? PROCEDURES.length : PROCEDURES.filter(p => p.category === id).length;
            return (
              <button key={id} onClick={() => setCategory(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                  category === id
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-[var(--card-bg)] text-[var(--text-600)] border-[var(--card-border)] hover:border-teal-300'
                }`}>
                <Icon size={12} />
                {label}
                <span className={`text-[11px] px-1.5 rounded-full font-bold ${category === id ? 'bg-white/25 text-white' : 'bg-[var(--page-bg)] text-[var(--text-400)]'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Progress banner */}
        {completedCount > 0 && (
          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800">
                {completedCount} of {PROCEDURES.length} procedures completed
              </p>
              <div className="mt-1.5 h-2 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all"
                     style={{ width: `${(completedCount / PROCEDURES.length) * 100}%` }} />
              </div>
            </div>
            <span className="text-sm font-black text-green-700 flex-shrink-0">
              {Math.round((completedCount / PROCEDURES.length) * 100)}%
            </span>
          </div>
        )}

        {/* Procedure grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-400)]">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No procedures found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(proc => {
              const isDone = !!completed[proc.id];
              return (
                <motion.button
                  key={proc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelected(proc)}
                  className="text-left bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden hover:shadow-md transition-all group"
                  style={{ borderTop: `3px solid ${proc.color}` }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                           style={{ background: `${proc.color}15` }}>
                        <proc.icon size={18} style={{ color: proc.color }} />
                      </div>
                      {isDone && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
                          <CheckCircle size={10} /> Done
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-[var(--text-900)] text-sm leading-tight mb-1 group-hover:text-teal-700 transition-colors">
                      {proc.title}
                    </h3>
                    <p className="text-xs text-[var(--text-500)] leading-relaxed line-clamp-2 mb-3">
                      {proc.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-400)]">
                        <span className="flex items-center gap-1"><Clock size={10}/> {proc.duration}</span>
                        <span className="flex items-center gap-1"><BookOpen size={10}/> {proc.steps.length} steps</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${proc.color}15`, color: proc.color }}>
                        {proc.level}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Procedure modal */}
      <AnimatePresence>
        {selected && (
          <ProcedureModal proc={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
