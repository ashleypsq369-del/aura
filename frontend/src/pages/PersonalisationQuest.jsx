import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle, ArrowLeft, ArrowRight, Loader2, Search } from 'lucide-react';
import { fireMilestone } from '../components/MilestoneConfetti';

import { API_URL } from '../api/client';

// All slideshow images for background cycling
const BG_IMAGES = [
  '/resources/slideshow/care-1.jpg',
  '/resources/slideshow/care-2.jpg',
  '/resources/slideshow/care-3.jpg',
  '/resources/slideshow/care-4.jpg',
  '/resources/slideshow/care-5.jpg',
  '/resources/slideshow/care-6.jpg',
  '/resources/slideshow/care-7.jpg',
  '/resources/slideshow/care-8.jpg',
  '/resources/slideshow/care-9.jpg',
  '/resources/slideshow/care-10.jpg',
];

// --- 10-step PATIENT questionnaire (clinical, symptom-focused) ------------
const PATIENT_STEPS = [
  // -- STEP 1: About You ----------------------------------------------------
  {
    id: 1,
    title: "Welcome to Project Aura",
    subtitle: "Let's take a few minutes to personalise your care experience. Your answers help every part of the system work for you.",
    fields: [
      {
        name: "language_pref",
        label: "What language do you prefer?",
        type: "radio",
        required: true,
        options: [
          { value: "en", label: "English" },
          { value: "twi", label: "Twi" },
          { value: "ga", label: "Ga" },
          { value: "ewe", label: "Ewe" },
          { value: "hausa", label: "Hausa" },
          { value: "dagbani", label: "Dagbani" }
        ]
      },
      {
        name: "info_style",
        label: "How do you prefer to receive health information?",
        type: "radio",
        required: false,
        options: [
          { value: "simple", label: "Simple, plain language - keep it easy" },
          { value: "detailed", label: "Detailed clinical information - I want to understand everything" },
          { value: "visual", label: "Visual guides and diagrams" },
          { value: "mixed", label: "A mix of everything" }
        ]
      },
      {
        name: "tech_comfort",
        label: "How comfortable are you with technology?",
        type: "radio",
        required: false,
        options: [
          { value: "high", label: "Very comfortable" },
          { value: "medium", label: "Somewhat comfortable" },
          { value: "low", label: "I prefer simple screens" },
          { value: "basic", label: "I need step-by-step help" }
        ]
      }
    ]
  },

  // -- STEP 2: Your Diagnosis ------------------------------------------------
  {
    id: 2,
    title: "Your Diagnosis",
    subtitle: "This is the most important step - it lets the system generate a personalised care guide, care plan, and AI recommendations specific to your condition.",
    fields: [
      {
        name: "primary_condition",
        label: "What is your main illness or diagnosis?",
        type: "condition-select",
        required: true,
        options: []
      },
      {
        name: "diagnosis_duration",
        label: "How long have you known about your diagnosis?",
        type: "radio",
        required: true,
        options: [
          { value: "new", label: "Just found out (less than 1 month)" },
          { value: "0-3months", label: "1-3 months" },
          { value: "3-12months", label: "3-12 months" },
          { value: "12months+", label: "More than a year" }
        ]
      },
      {
        name: "care_priorities",
        label: "What matters most to you in your care right now? (Select up to 3)",
        type: "multi-select",
        required: false,
        options: [
          "Pain control",
          "Staying at home",
          "Being comfortable",
          "Spending time with family",
          "Maintaining independence",
          "Emotional and spiritual support",
          "Understanding my condition",
          "Preparing for the future",
          "Supporting my family",
          "Community connection"
        ]
      }
    ]
  },

  // -- STEP 3: Current Symptoms (feeds ESAS, AI engine, care plan) -----------
  {
    id: 3,
    title: "How You Feel Right Now",
    subtitle: "Your symptom answers directly feed the AI care plan, chatbot, and alert system. Be honest - this is for your care, not judgment.",
    fields: [
      {
        name: "esas_pain",
        label: "Pain - How would you rate your pain right now? (0 = no pain, 10 = worst possible)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "No pain", 5: "Moderate", 10: "Worst" }
      },
      {
        name: "esas_tiredness",
        label: "Tiredness - How tired are you? (0 = not tired, 10 = worst tiredness)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "Not tired", 5: "Moderate", 10: "Worst" }
      },
      {
        name: "esas_nausea",
        label: "Nausea - How nauseated do you feel? (0 = none, 10 = worst)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "None", 5: "Moderate", 10: "Worst" }
      },
      {
        name: "esas_shortness_of_breath",
        label: "Breathlessness - (0 = no shortness of breath, 10 = worst)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "None", 5: "Moderate", 10: "Worst" }
      }
    ]
  },

  // -- STEP 4: Emotional & Mental Health -------------------------------------
  {
    id: 4,
    title: "Your Emotional Wellbeing",
    subtitle: "These scores feed the depression and anxiety assessment (PHQ-9 equivalent). They help your care team provide the right psychological support.",
    fields: [
      {
        name: "esas_depression",
        label: "Depression - How depressed do you feel? (0 = not depressed, 10 = worst)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "Not depressed", 5: "Moderate", 10: "Worst" }
      },
      {
        name: "esas_anxiety",
        label: "Anxiety - How anxious or worried do you feel? (0 = not anxious, 10 = worst)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "Not anxious", 5: "Moderate", 10: "Worst" }
      },
      {
        name: "esas_wellbeing",
        label: "Overall Wellbeing - How is your overall feeling of wellbeing? (0 = best, 10 = worst)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "Best", 5: "Moderate", 10: "Worst" }
      },
      {
        name: "emotional_states",
        label: "How are you feeling emotionally right now? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: ["Scared", "Hopeful", "Overwhelmed", "Peaceful", "Confused", "Determined", "Sad", "Grateful", "Angry", "Lonely"]
      },
      {
        name: "future_worry_level",
        label: "How worried are you about the future?",
        type: "radio",
        required: false,
        options: [
          { value: "very", label: "Very worried - constant fear" },
          { value: "somewhat", label: "Somewhat worried" },
          { value: "little", label: "A little worried" },
          { value: "peaceful", label: "I feel mostly at peace" }
        ]
      }
    ]
  },

  // -- STEP 5: Physical Function (feeds PPS, Barthel) ------------------------
  {
    id: 5,
    title: "Your Physical Abilities",
    subtitle: "This helps calculate your functional status (PPS score) which guides care planning, monitoring intensity, and goal-setting.",
    fields: [
      {
        name: "activity_level",
        label: "How active are you currently?",
        type: "radio",
        required: true,
        options: [
          { value: "high", label: "I can move around freely and do most activities" },
          { value: "moderate", label: "I can do light activities with some difficulty" },
          { value: "low", label: "I mostly stay at home, some activities difficult" },
          { value: "very_low", label: "I need help with most activities" },
          { value: "bedbound", label: "I am mostly in bed and fully dependent" }
        ]
      },
      {
        name: "self_care_level",
        label: "Can you care for yourself (washing, dressing, eating)?",
        type: "radio",
        required: true,
        options: [
          { value: "independent", label: "Fully independent" },
          { value: "some_help", label: "Need some help" },
          { value: "much_help", label: "Need significant help" },
          { value: "dependent", label: "Fully dependent on others" }
        ]
      },
      {
        name: "mobility_aid",
        label: "Do you use any mobility aids?",
        type: "radio",
        required: false,
        options: [
          { value: "none", label: "No aids needed" },
          { value: "stick", label: "Walking stick or cane" },
          { value: "frame", label: "Walking frame or rollator" },
          { value: "wheelchair", label: "Wheelchair" },
          { value: "bed", label: "Bedbound - no mobility" }
        ]
      },
      {
        name: "physical_symptoms",
        label: "Which physical symptoms affect you regularly? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Pain", "Tiredness/fatigue", "Nausea", "Breathlessness",
          "Constipation", "Loss of appetite", "Dry mouth", "Difficulty swallowing",
          "Confusion or memory problems", "Dizziness", "Swollen legs", "Itching"
        ]
      }
    ]
  },

  // -- STEP 6: Nutrition & Appetite ------------------------------------------
  {
    id: 6,
    title: "Nutrition & Appetite",
    subtitle: "Nutritional status is critical in palliative care. These answers feed care plan recommendations and alert thresholds.",
    fields: [
      {
        name: "esas_appetite",
        label: "Appetite - How is your appetite? (0 = best appetite, 10 = no appetite at all)",
        type: "esas-slider",
        required: true,
        min: 0, max: 10,
        labels: { 0: "Good appetite", 5: "Moderate", 10: "No appetite" }
      },
      {
        name: "weight_change",
        label: "Have you noticed recent unintended weight change?",
        type: "radio",
        required: true,
        options: [
          { value: "stable", label: "Weight is stable" },
          { value: "mild_loss", label: "Mild weight loss (1-3 kg)" },
          { value: "significant_loss", label: "Significant weight loss (>3 kg)" },
          { value: "gain", label: "Weight gain (possibly fluid)" },
          { value: "unknown", label: "I don't know" }
        ]
      },
      {
        name: "swallowing_difficulty",
        label: "Do you have any difficulty swallowing food or drink?",
        type: "radio",
        required: false,
        options: [
          { value: "none", label: "No difficulty" },
          { value: "mild", label: "Mild - sometimes struggle with hard foods" },
          { value: "moderate", label: "Moderate - need soft or modified foods" },
          { value: "severe", label: "Severe - mostly liquids or tube feeding" }
        ]
      }
    ]
  },

  // -- STEP 7: Spiritual & Cultural -----------------------------------------
  {
    id: 7,
    title: "Your Faith and Culture",
    subtitle: "Spiritual and cultural care is a core part of palliative care. These answers guide chaplaincy, community groups, and resource recommendations.",
    fields: [
      {
        name: "religious_background",
        label: "What is your religious or spiritual background?",
        type: "radio",
        required: false,
        options: [
          { value: "christian", label: "Christian" },
          { value: "muslim", label: "Muslim" },
          { value: "traditional", label: "Traditional African religion" },
          { value: "none", label: "No religion / secular" },
          { value: "other", label: "Other" }
        ]
      },
      {
        name: "spiritual_importance",
        label: "How important is spiritual care to you?",
        type: "radio",
        required: false,
        options: [
          { value: "very", label: "Central to my care - very important" },
          { value: "important", label: "Important" },
          { value: "somewhat", label: "Somewhat important" },
          { value: "not", label: "Not important to me right now" }
        ]
      },
      {
        name: "cultural_practices",
        label: "Are there cultural practices important to your care? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Traditional herbal remedies",
          "Prayer and religious rituals",
          "Family decision-making (extended family involved)",
          "Death and burial customs",
          "Dietary restrictions",
          "Language preference in care discussions"
        ]
      },
      {
        name: "wants_spiritual_care",
        label: "Would you like spiritual or pastoral care support?",
        type: "radio",
        required: false,
        options: [
          { value: "yes", label: "Yes please - connect me with a chaplain or pastor" },
          { value: "no", label: "No thank you" }
        ]
      }
    ]
  },

  // -- STEP 8: Family & Social (feeds caregiver burden, community) -----------
  {
    id: 8,
    title: "Your Family and Support",
    subtitle: "Understanding your support network helps us provide caregiver support resources and connect you with the right community groups.",
    fields: [
      {
        name: "main_support_person",
        label: "Who is your main support person?",
        type: "radio",
        required: false,
        options: [
          { value: "spouse", label: "Spouse or partner" },
          { value: "parent", label: "Parent" },
          { value: "child", label: "Child or children" },
          { value: "sibling", label: "Sibling" },
          { value: "friend", label: "Friend" },
          { value: "paid_caregiver", label: "Paid caregiver or nurse" },
          { value: "alone", label: "I live alone - limited support" }
        ]
      },
      {
        name: "family_involvement_pref",
        label: "How much do you want your family involved in care decisions?",
        type: "radio",
        required: false,
        options: [
          { value: "full", label: "Full involvement - they should know everything" },
          { value: "some", label: "Involved but I make final decisions" },
          { value: "minimal", label: "Minimal - I prefer to manage myself" },
          { value: "none", label: "I prefer privacy" }
        ]
      },
      {
        name: "has_dependants",
        label: "Do you have dependants (children or others who depend on you)?",
        type: "radio",
        required: false,
        options: [
          { value: "yes_children", label: "Yes - young children (under 18)" },
          { value: "yes_adult", label: "Yes - adult dependants" },
          { value: "no", label: "No dependants" }
        ]
      },
      {
        name: "social_connectedness",
        label: "How connected do you feel to people around you?",
        type: "radio",
        required: false,
        options: [
          { value: "very", label: "Very connected - strong community" },
          { value: "mostly", label: "Mostly connected" },
          { value: "sometimes", label: "Sometimes lonely" },
          { value: "isolated", label: "Very isolated - limited connections" }
        ]
      },
      {
        name: "wants_peer_connection",
        label: "Would you like to connect with others in similar situations?",
        type: "radio",
        required: false,
        options: [
          { value: "yes", label: "Yes - I'd welcome peer support" },
          { value: "no", label: "No, I prefer privacy" }
        ]
      }
    ]
  },

  // -- STEP 9: Content & Communication Preferences ---------------------------
  {
    id: 9,
    title: "Your Preferences for Support",
    subtitle: "This shapes what resources, community groups, and information are shown to you on your personal dashboard.",
    fields: [
      {
        name: "coping_strategies",
        label: "What helps you feel better when things are hard? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Talking to family",
          "Prayer or meditation",
          "Music",
          "Being in nature",
          "Reading",
          "Watching films",
          "Creative activities",
          "Being alone and reflecting",
          "Talking to a professional",
          "Gentle exercise"
        ]
      },
      {
        name: "topic_interests",
        label: "Which topics would be most helpful for you? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Pain management",
          "Sleep improvement",
          "Nutrition and appetite",
          "Mental health and emotions",
          "Family communication",
          "Spiritual peace and legacy",
          "Financial concerns",
          "Practical home care",
          "Medication side effects",
          "Advance care planning"
        ]
      },
      {
        name: "info_frequency",
        label: "How often would you like health tips and information?",
        type: "radio",
        required: false,
        options: [
          { value: "daily", label: "Daily - keep me informed" },
          { value: "few_weekly", label: "A few times a week" },
          { value: "weekly", label: "Weekly" },
          { value: "changes", label: "Only when something important changes" }
        ]
      },
      {
        name: "wants_community",
        label: "Would you like to join online support groups?",
        type: "radio",
        required: false,
        options: [
          { value: "yes", label: "Yes - connect me with people who understand" },
          { value: "no", label: "Not right now" }
        ]
      },
      {
        name: "theme_pref",
        label: "Which screen appearance do you prefer?",
        type: "radio",
        required: false,
        options: [
          { value: "light", label: "Light — bright, clean screen" },
          { value: "dark",  label: "Dark — easier on the eyes, especially at night" },
          { value: "auto",  label: "Automatic — follows my device setting" }
        ]
      },
      {
        name: "notification_pref",
        label: "How would you like the app to notify you?",
        type: "radio",
        required: false,
        options: [
          { value: "all",      label: "All notifications — keep me fully updated" },
          { value: "important", label: "Important ones only — medications, urgent alerts" },
          { value: "none",     label: "No notifications — I'll check when I choose" }
        ]
      }
    ]
  },

  // -- STEP 10: AI Consent & Data Use ----------------------------------------
  {
    id: 10,
    title: "AI-Powered Personalised Care",
    subtitle: "Project Aura uses AI to analyse your health data and generate personalised care plans, predictions, and recommendations. We need your consent.",
    fields: [
      {
        name: "ai_analysis_consent",
        label: "May we use AI to analyse your health information and generate personalised care recommendations?",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes - use AI to improve my care and generate my care plan" },
          { value: "no", label: "No - I prefer human-only care (you can change this anytime in Settings)" }
        ]
      },
      {
        name: "ai_data_sharing_consent",
        label: "May we use your anonymised data to improve AI models for future patients?",
        type: "radio",
        required: false,
        options: [
          { value: "yes", label: "Yes - help improve care for future patients" },
          { value: "no", label: "No - keep my data private" }
        ]
      },
      {
        name: "care_team_sharing",
        label: "May we share your questionnaire answers with your assigned care team?",
        type: "radio",
        options: [
          { value: "yes", label: "Yes - share with my clinicians and caregivers" },
          { value: "anonymous", label: "Yes - but anonymised only" },
          { value: "no", label: "No - keep private" }
        ]
      }
    ]
  }
];

// --- 8-step FAMILY questionnaire (support-focused, grief-aware) -----------
const FAMILY_STEPS = [
  // STEP 1: About You
  {
    id: 1,
    title: "Welcome to Project Aura",
    subtitle: "You're here as a family member or loved one. These questions help us support you and tailor how you're involved in care. Your answers are private.",
    fields: [
      {
        name: "language_pref",
        label: "What language do you prefer?",
        type: "radio",
        required: true,
        options: [
          { value: "en", label: "English" },
          { value: "twi", label: "Twi" },
          { value: "ga", label: "Ga" },
          { value: "ewe", label: "Ewe" },
          { value: "hausa", label: "Hausa" },
          { value: "dagbani", label: "Dagbani" }
        ]
      },
      {
        name: "tech_comfort",
        label: "How comfortable are you with technology?",
        type: "radio",
        required: false,
        options: [
          { value: "high",   label: "Very comfortable" },
          { value: "medium", label: "Somewhat comfortable" },
          { value: "low",    label: "I prefer simple screens" },
          { value: "basic",  label: "I need step-by-step help" }
        ]
      },
      {
        name: "info_style",
        label: "How do you prefer to receive information about your loved one's care?",
        type: "radio",
        required: false,
        options: [
          { value: "simple",   label: "Plain, easy language — keep it simple" },
          { value: "detailed", label: "Full clinical detail — I want to understand everything" },
          { value: "visual",   label: "Visual summaries and diagrams" },
          { value: "mixed",    label: "A mix depending on the situation" }
        ]
      }
    ]
  },

  // STEP 2: Your Relationship to the Patient
  {
    id: 2,
    title: "Your Relationship",
    subtitle: "Help us understand your role so we can personalise how you're connected to care updates and decisions.",
    fields: [
      {
        name: "family_relation",
        label: "What is your relationship to the patient?",
        type: "radio",
        required: true,
        options: [
          { value: "spouse",    label: "Spouse or partner" },
          { value: "child",     label: "Child" },
          { value: "parent",    label: "Parent" },
          { value: "sibling",   label: "Sibling" },
          { value: "friend",    label: "Close friend" },
          { value: "extended",  label: "Extended family member" },
          { value: "other",     label: "Other" }
        ]
      },
      {
        name: "family_involvement_pref",
        label: "How involved do you want to be in care decisions?",
        type: "radio",
        required: true,
        options: [
          { value: "full",    label: "Fully involved — I want to know everything" },
          { value: "some",    label: "Involved but the patient makes final decisions" },
          { value: "updates", label: "Just keep me updated on major changes" },
          { value: "minimal", label: "Minimal — I'm available but not day-to-day" }
        ]
      },
      {
        name: "lives_with_patient",
        label: "Do you live with or near the patient?",
        type: "radio",
        required: false,
        options: [
          { value: "with",    label: "Yes — I live with them" },
          { value: "nearby",  label: "Nearby — I visit regularly" },
          { value: "distant", label: "I live far away — mostly remote support" }
        ]
      }
    ]
  },

  // STEP 3: Your Caregiving Role
  {
    id: 3,
    title: "Your Caregiving Role",
    subtitle: "Understanding how much care you provide helps us send the right support resources and connect you with caregiver wellbeing tools.",
    fields: [
      {
        name: "caregiver_level",
        label: "How much hands-on care do you provide day-to-day?",
        type: "radio",
        required: true,
        options: [
          { value: "primary",     label: "I am the primary caregiver — providing most care" },
          { value: "shared",      label: "I share care with others (family or professional)" },
          { value: "occasional",  label: "I help occasionally but it's not my main role" },
          { value: "emotional",   label: "Mainly emotional support — no physical care" },
          { value: "none",        label: "I am not providing direct care right now" }
        ]
      },
      {
        name: "care_tasks",
        label: "What care tasks do you help with? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Personal hygiene (bathing, dressing)",
          "Medication management",
          "Preparing meals",
          "Attending medical appointments",
          "Emotional support and companionship",
          "Managing finances or paperwork",
          "Transport to appointments",
          "Overnight or 24-hour care",
          "Managing household tasks"
        ]
      },
      {
        name: "caregiver_burnout_risk",
        label: "How are you coping with your caregiving responsibilities?",
        type: "radio",
        required: false,
        options: [
          { value: "fine",       label: "Managing well — I feel supported" },
          { value: "tired",      label: "Tired but coping" },
          { value: "struggling", label: "Struggling — it's becoming overwhelming" },
          { value: "burnout",    label: "I am burnt out and need support urgently" }
        ]
      }
    ]
  },

  // STEP 4: Your Emotional Wellbeing
  {
    id: 4,
    title: "Your Emotional Wellbeing",
    subtitle: "Supporting a loved one in palliative care is one of the hardest things to go through. Your own wellbeing matters too.",
    fields: [
      {
        name: "family_emotional_state",
        label: "How are you feeling emotionally right now? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Scared", "Grief", "Hopeful", "Overwhelmed", "Exhausted",
          "Grateful", "Confused", "Peaceful", "Lonely", "Determined", "Angry", "Numb"
        ]
      },
      {
        name: "grief_stage",
        label: "Where are you right now with accepting your loved one's situation?",
        type: "radio",
        required: false,
        options: [
          { value: "shock",      label: "Still in shock — hard to accept" },
          { value: "processing", label: "Processing — coming to terms slowly" },
          { value: "preparing",  label: "Preparing — focusing on what we can do" },
          { value: "peaceful",   label: "At peace — focusing on quality time" },
          { value: "bereaved",   label: "Already bereaved — seeking support after loss" }
        ]
      },
      {
        name: "needs_counselling",
        label: "Would you like emotional or counselling support for yourself?",
        type: "radio",
        required: false,
        options: [
          { value: "yes",   label: "Yes — I'd welcome that support" },
          { value: "maybe", label: "Maybe later — not ready yet" },
          { value: "no",    label: "No thank you — I have support" }
        ]
      },
      {
        name: "future_worry_level",
        label: "How worried are you about what lies ahead for your family?",
        type: "radio",
        required: false,
        options: [
          { value: "very",     label: "Very worried — I think about it constantly" },
          { value: "somewhat", label: "Somewhat worried" },
          { value: "little",   label: "A little — taking it day by day" },
          { value: "peaceful", label: "Mostly at peace — focused on now" }
        ]
      }
    ]
  },

  // STEP 5: Faith, Culture & Traditions
  {
    id: 5,
    title: "Faith, Culture & Traditions",
    subtitle: "Cultural and spiritual values shape how families experience illness and loss. Help us honour what matters to your family.",
    fields: [
      {
        name: "religious_background",
        label: "What is your family's religious or spiritual background?",
        type: "radio",
        required: false,
        options: [
          { value: "christian",   label: "Christian" },
          { value: "muslim",      label: "Muslim" },
          { value: "traditional", label: "Traditional African religion" },
          { value: "none",        label: "No religion / secular" },
          { value: "other",       label: "Other" }
        ]
      },
      {
        name: "cultural_practices",
        label: "Are there cultural or religious practices important to your family? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Prayer and religious rituals at the bedside",
          "Family involvement in all care decisions",
          "Death and burial customs",
          "Dietary restrictions",
          "Traditional healing alongside medical care",
          "Language preference in care discussions",
          "Post-death mourning traditions"
        ]
      },
      {
        name: "spiritual_importance",
        label: "How important is spiritual care to your family?",
        type: "radio",
        required: false,
        options: [
          { value: "very",      label: "Central — very important" },
          { value: "important", label: "Important" },
          { value: "somewhat",  label: "Somewhat" },
          { value: "not",       label: "Not a priority" }
        ]
      }
    ]
  },

  // STEP 6: Practical Needs & Information
  {
    id: 6,
    title: "What Information Would Help You?",
    subtitle: "We want to give you the resources that are actually useful — not information overload.",
    fields: [
      {
        name: "topic_interests",
        label: "Which topics would be most helpful for you right now? (Select all that apply)",
        type: "multi-select",
        required: false,
        options: [
          "Understanding palliative care",
          "What to expect in the coming weeks",
          "How to talk to my loved one about their illness",
          "Managing my own stress and emotions",
          "Financial and legal planning",
          "Organising end-of-life wishes",
          "Bereavement and grief support",
          "How to support children or young people",
          "Cultural and spiritual end-of-life practices",
          "Home care practical guides"
        ]
      },
      {
        name: "info_frequency",
        label: "How often would you like updates and health information?",
        type: "radio",
        required: false,
        options: [
          { value: "daily",      label: "Daily — keep me closely informed" },
          { value: "few_weekly", label: "A few times a week" },
          { value: "weekly",     label: "Weekly summary" },
          { value: "changes",    label: "Only when something important changes" }
        ]
      },
      {
        name: "wants_community",
        label: "Would you like to connect with other families in similar situations?",
        type: "radio",
        required: false,
        options: [
          { value: "yes", label: "Yes — peer support would help" },
          { value: "no",  label: "Not right now" }
        ]
      }
    ]
  },

  // STEP 7: Legacy & End-of-Life Planning
  {
    id: 7,
    title: "Legacy & Planning Ahead",
    subtitle: "These are difficult but important conversations. Knowing your preferences helps us show you the right tools at the right time.",
    fields: [
      {
        name: "eol_planning_readiness",
        label: "How ready is your family to discuss end-of-life planning?",
        type: "radio",
        required: false,
        options: [
          { value: "ready",     label: "Ready — we want to plan ahead now" },
          { value: "open",      label: "Open to it — but need guidance on how" },
          { value: "difficult", label: "It's difficult — we're not there yet" },
          { value: "no",        label: "We prefer not to discuss this" }
        ]
      },
      {
        name: "legacy_interest",
        label: "Would you like to use the Memory Vault to preserve your loved one's stories and messages?",
        type: "radio",
        required: false,
        options: [
          { value: "yes",   label: "Yes — this sounds meaningful" },
          { value: "maybe", label: "Maybe — tell me more later" },
          { value: "no",    label: "Not for us" }
        ]
      },
      {
        name: "has_young_children",
        label: "Are there children or young people (under 18) affected by this situation?",
        type: "radio",
        required: false,
        options: [
          { value: "yes_young",  label: "Yes — young children under 10" },
          { value: "yes_teen",   label: "Yes — teenagers (10–17)" },
          { value: "yes_young_adult", label: "Yes — young adults 18–25" },
          { value: "no",         label: "No" }
        ]
      }
    ]
  },

  // STEP 8: Consent
  {
    id: 8,
    title: "Data Use & Consent",
    subtitle: "We handle your information with strict privacy protections. Your answers personalise your experience and help us support you better.",
    fields: [
      {
        name: "ai_analysis_consent",
        label: "May we use AI to personalise your dashboard, resource recommendations, and support content?",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes — personalise my experience using AI" },
          { value: "no",  label: "No — standard experience only" }
        ]
      },
      {
        name: "care_team_sharing",
        label: "May we share your preferences with the care team so they can better support your family?",
        type: "radio",
        required: false,
        options: [
          { value: "yes",       label: "Yes — share with the care team" },
          { value: "anonymous", label: "Yes — anonymised only" },
          { value: "no",        label: "No — keep private" }
        ]
      },
      {
        name: "ai_data_sharing_consent",
        label: "May we use your anonymised answers to improve AI support for future families?",
        type: "radio",
        required: false,
        options: [
          { value: "yes", label: "Yes — help future families" },
          { value: "no",  label: "No — keep private" }
        ]
      }
    ]
  }
];

// --- Role-aware step resolver ---------------------------------------------
function getStepsForRole(role) {
  if (role === 'family') return FAMILY_STEPS;
  return PATIENT_STEPS; // patient (default)
}

// --- Main Component --------------------------------------------------------
export default function PersonalisationQuest() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bgIndex, setBgIndex] = useState(0);
  const navigate = useNavigate();

  // Detect role from localStorage immediately — determines which questionnaire to show
  const userRole = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').role || 'patient'; }
    catch { return 'patient'; }
  })();
  const isFamily = userRole === 'family';
  const QUESTIONNAIRE_STEPS = getStepsForRole(userRole);

  // Re-entry guard: if questionnaire already completed, redirect to dashboard
  // Only runs for users who have an existing session (not fresh registrations)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('auth_token');
    // Skip guard if the login response already said they need the questionnaire
    if (user.needs_questionnaire === true) return;
    if (token && user.id) {
      axios.get(`${API_URL}/api/preferences/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => {
        if (r.data?.questionnaire_complete === true) {
          const dest = user.role === 'patient' ? '/my-space' : '/dashboard';
          navigate(dest, { replace: true });
        }
      }).catch(() => {}); // non-fatal -- if API is down, let them complete
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    language_pref: "en",
    emotional_states: [],
    physical_symptoms: [],
    coping_strategies: [],
    topic_interests: [],
    care_priorities: [],
    cultural_practices: [],
    care_tasks: [],
    family_emotional_state: [],
    esas_pain: 0,
    esas_tiredness: 0,
    esas_nausea: 0,
    esas_shortness_of_breath: 0,
    esas_depression: 0,
    esas_anxiety: 0,
    esas_wellbeing: 0,
    esas_appetite: 0,
    activity_level: "moderate",
    self_care_level: "some_help",
    mobility_aid: "none",
    weight_change: "stable",
    swallowing_difficulty: "none",
    mood_score: 5,
    wants_spiritual_care: "no",
    wants_peer_connection: "no",
    wants_community: "no",
    ai_analysis_consent: "yes",
    ai_data_sharing_consent: "no",
    care_team_sharing: "yes",
    // Family-specific
    family_relation: "",
    caregiver_level: "",
    caregiver_burnout_risk: "",
    grief_stage: "",
    needs_counselling: "",
    eol_planning_readiness: "",
    legacy_interest: "",
    has_young_children: "",
    lives_with_patient: "",
    family_involvement_pref: "",
  });
  const [isComplete, setIsComplete] = useState(false);
  const TOTAL = QUESTIONNAIRE_STEPS.length;

  // Auto-cycle background images every 6 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setBgIndex(i => (i + 1) % BG_IMAGES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const savePreferences = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // 1. Save preferences (questionnaire data)
      const prefsResp = await axios.post(`${API_URL}/api/preferences`, {
        ...data,
        user_id: user.id,
        questionnaire_complete: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. If the user is a patient, update their Patient record with onboarding data
      if (user.role === 'patient') {
        try {
          // Get patient_id from prefs response or stored user data
          const patientId = prefsResp.data?.patient_id || user.patient_id;
          if (patientId) {
            // Build patient update payload from questionnaire answers
            const patientUpdate = {};
            if (data.date_of_birth) patientUpdate.date_of_birth = data.date_of_birth;
            if (data.gender) patientUpdate.gender = data.gender;
            if (data.primary_diagnosis) patientUpdate.primary_diagnosis = data.primary_diagnosis;
            if (data.care_setting) patientUpdate.care_setting = data.care_setting;
            if (data.religious_preference) patientUpdate.religious_preference = data.religious_preference;
            if (data.preferred_language) patientUpdate.preferred_language = data.preferred_language;
            if (Object.keys(patientUpdate).length > 0) {
              await axios.patch(`${API_URL}/api/patients/${patientId}`, patientUpdate, {
                headers: { Authorization: `Bearer ${token}` }
              }).catch(() => {}); // Don't block if patch fails
            }

            // 3. Also submit initial ESAS assessment if symptom data was collected
            const esasFields = ['esas_pain','esas_tiredness','esas_nausea','esas_shortness_of_breath','esas_depression','esas_anxiety','esas_wellbeing'];
            const hasEsas = esasFields.some(f => data[f] !== undefined);
            if (hasEsas) {
              const esasPayload = {
                patient_id: patientId,
                pain: data.esas_pain || 0,
                tiredness: data.esas_tiredness || 0,
                nausea: data.esas_nausea || 0,
                shortness_of_breath: data.esas_shortness_of_breath || 0,
                depression: data.esas_depression || 0,
                anxiety: data.esas_anxiety || 0,
                wellbeing: data.esas_wellbeing || 0,
                drowsiness: 0, appetite: 0,
                source: 'onboarding_questionnaire',
              };
              await axios.post(`${API_URL}/api/clinical-assessments/esas`, esasPayload, {
                headers: { Authorization: `Bearer ${token}` }
              }).catch(() => {}); // Don't block
            }
          }
        } catch (e) {
          // Patient update is best-effort — don't block onboarding completion
          console.warn('Patient record update failed during onboarding:', e);
        }
      }

      return prefsResp;
    },
    onSuccess: (_, submittedData) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...user, needs_questionnaire: false };
      localStorage.setItem('user', JSON.stringify(updated));

      // ── Immediately apply questionnaire answers to app settings ──────────
      // Language
      if (submittedData.language_pref && submittedData.language_pref !== 'en') {
        localStorage.setItem('app_language', submittedData.language_pref);
        document.documentElement.lang = submittedData.language_pref;
      }

      // Tech comfort → font size and sidebar mode
      const techToFont = { high: 'medium', medium: 'medium', low: 'large', basic: 'xlarge' };
      const fontSz = techToFont[submittedData.tech_comfort] || 'medium';
      if (fontSz !== 'medium') {
        const a11y = JSON.parse(localStorage.getItem('accessibility_settings') || '{}');
        localStorage.setItem('accessibility_settings', JSON.stringify({ ...a11y, fontSize: fontSz }));
        document.documentElement.classList.remove('text-small','text-medium','text-large','text-xlarge','text-xxlarge');
        document.documentElement.classList.add(`text-${fontSz}`);
      }

      // Basic tech comfort → simplified sidebar (icons only, keep it clean)
      if (submittedData.tech_comfort === 'basic' || submittedData.tech_comfort === 'low') {
        const sidebar = JSON.parse(localStorage.getItem('sidebar_settings') || '{}');
        localStorage.setItem('sidebar_default_state', 'icons');
        // Also enable large touch targets
        const a11y = JSON.parse(localStorage.getItem('accessibility_settings') || '{}');
        localStorage.setItem('accessibility_settings', JSON.stringify({
          ...a11y, largeTouch: true, fontSize: fontSz
        }));
      }

      // Info style → notifications frequency preference
      if (submittedData.info_frequency) {
        localStorage.setItem('info_frequency_pref', submittedData.info_frequency);
      }

      // Activity level → if bedbound/very_low, enable reduced motion + large touch
      if (submittedData.activity_level === 'bedbound' || submittedData.activity_level === 'very_low') {
        const a11y = JSON.parse(localStorage.getItem('accessibility_settings') || '{}');
        localStorage.setItem('accessibility_settings', JSON.stringify({
          ...a11y, reducedMotion: true, largeTouch: true
        }));
      }

      // High burnout or caregiver struggle → show AI widgets prominently
      if (submittedData.caregiver_burnout_risk === 'burnout' || submittedData.caregiver_burnout_risk === 'struggling') {
        localStorage.setItem('show_ai_widgets', 'true');
      }

      // AI consent → control AI widgets visibility
      if (submittedData.ai_analysis_consent === 'no') {
        localStorage.setItem('show_ai_widgets', 'false');
      }

      // Theme preference
      if (submittedData.theme_pref) {
        localStorage.setItem('app_theme', submittedData.theme_pref);
        const root = document.documentElement;
        root.classList.remove('light-theme', 'dark-theme', 'dark');
        if (submittedData.theme_pref === 'dark') {
          root.classList.add('dark-theme', 'dark');
        } else if (submittedData.theme_pref === 'auto') {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            root.classList.add('dark-theme', 'dark');
          } else {
            root.classList.add('light-theme');
          }
        } else {
          root.classList.add('light-theme');
        }
      }

      // Notification preference
      if (submittedData.notification_pref === 'none') {
        localStorage.setItem('app_notifications', 'false');
      } else {
        localStorage.setItem('app_notifications', 'true');
      }

      // Wants community → persist for sidebar quick-link priority
      if (submittedData.wants_community === 'yes') {
        localStorage.setItem('wants_community', 'true');
      }

      // Legacy interest → unlock Memory Vault prompt
      if (submittedData.legacy_interest === 'yes') {
        localStorage.setItem('legacy_interest', 'true');
      }

      // ─────────────────────────────────────────────────────────────────────
      fireMilestone('stars');
      setIsComplete(true);
      const dest = user.role === 'patient' ? '/my-space' :
                   user.role === 'family'  ? '/dashboard' : '/dashboard';
      setTimeout(() => navigate(dest), 2500);
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to save. Please try again.');
    }
  });

  const handleNext = () => {
    if (currentStep < TOTAL) {
      setCurrentStep(s => s + 1);
      window.scrollTo(0, 0);
    } else {
      savePreferences.mutate(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
      window.scrollTo(0, 0);
    }
  };

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // -- Complete screen --------------------------------------------------------
  if (isComplete) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src="/resources/slideshow/care-10.jpg" alt="" aria-hidden="true"
            className="w-full h-full object-cover" style={{ filter: 'brightness(0.3)' }} />
          <div className="absolute inset-0 bg-teal-950/60" />
        </div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-white/30">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }}
            transition={{ type: "spring", duration: 0.8 }} className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-700 shadow-lg">
              <CheckCircle className="w-11 h-11 text-white" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">All set, {user.full_name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-teal-700 mb-2 font-semibold text-sm">
            {user.role === 'family'
              ? 'Your family profile is being set up.'
              : 'Your personalised care experience is being created.'}
          </p>
          <p className="text-slate-500 text-sm mb-6">
            {user.role === 'family'
              ? 'We\'ll personalise your dashboard with the resources, updates, and support tools that matter most to your family.'
              : 'The AI is generating your care plan, personalised resources, and recommendations based on your answers.'}
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" />
          <p className="mt-2 text-sm text-teal-700 font-semibold">Taking you to your space...</p>
        </motion.div>
      </div>
    );
  }

  const stepData = QUESTIONNAIRE_STEPS[currentStep - 1];
  const progress = ((currentStep - 1) / TOTAL) * 100;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">

      {/* -- Slideshow background - auto-cycles every 6 s -- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatePresence initial={false}>
          <motion.img
            key={bgIndex}
            src={BG_IMAGES[bgIndex]}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ zIndex: 1 }}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        </AnimatePresence>
        {/* Overlay */}
        <div className="absolute inset-0 bg-teal-950/50" style={{ zIndex: 2 }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full relative z-10">

        {/* Header badge */}
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">
              {isFamily ? 'Family Setup' : 'Personalisation Setup'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 px-5 py-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/75">Step {currentStep} of {TOTAL}</span>
            <span className="text-xs font-bold text-teal-300 tabular-nums">{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #2dd4bf 0%, #22d3ee 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }} />
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {QUESTIONNAIRE_STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${
                i + 1 === currentStep ? 'w-5 h-1.5 bg-teal-400' :
                i + 1 < currentStep  ? 'w-1.5 h-1.5 bg-teal-500' :
                                        'w-1.5 h-1.5 bg-white/25'
              }`} />
            ))}
          </div>
        </div>

        {/* Main form card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Card header accent strip */}
          <div className="h-1 w-full bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-500" />

          <div className="p-6 min-h-[420px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22 }} className="flex-1 flex flex-col">

                {/* Step heading */}
                <div className="mb-5 pb-4 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">{stepData.title}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{stepData.subtitle}</p>
                </div>

                <div className="space-y-5 flex-1">
                  {stepData.fields.map(field => (
                    <FieldRenderer key={field.name} field={field}
                      value={formData[field.name]}
                      onChange={v => updateField(field.name, v)} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <button onClick={handleBack} disabled={currentStep === 1}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                currentStep === 1 ? 'opacity-0 cursor-not-allowed' :
                'bg-white text-slate-600 border border-slate-300 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/50 shadow-sm'
              }`}>
              <ArrowLeft size={15} /> Back
            </button>
            <button onClick={handleNext} disabled={savePreferences.isPending}
              className="flex items-center gap-2 px-7 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50">
              <span>{currentStep === TOTAL ? 'Complete Setup' : 'Continue'}</span>
              {savePreferences.isPending ? <Loader2 size={15} className="animate-spin" /> :
               currentStep < TOTAL ? <ArrowRight size={15} /> : <CheckCircle size={15} />}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Your answers are private and stored securely. You can update them anytime in Settings.
        </p>
      </motion.div>
    </div>
  );
}

// --- Field Renderer --------------------------------------------------------
function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'condition-select') {
    return <ConditionSelectField label={field.label} value={value} onChange={onChange} />;
  }

  if (field.type === 'esas-slider') {
    const val = value ?? 0;
    const color = val >= 7 ? 'bg-red-500' : val >= 4 ? 'bg-amber-500' : 'bg-teal-600';
    const ringColor = val >= 7 ? 'ring-red-300' : val >= 4 ? 'ring-amber-300' : 'ring-teal-300';
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <input type="range" min={field.min} max={field.max} value={val}
            onChange={e => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full accent-teal-600 mb-3"
            style={{ background: `linear-gradient(to right, #0f766e 0%, #0f766e ${val * 10}%, #e2e8f0 ${val * 10}%, #e2e8f0 100%)` }} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{field.labels[0]}</span>
            <div className={`w-9 h-9 rounded-full ${color} ring-2 ${ringColor} flex items-center justify-center shadow`}>
              <span className="text-white text-xs font-bold">{val}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{field.labels[10]}</span>
          </div>
          {val >= 7 && (
            <p className="text-xs text-red-600 font-semibold mt-2.5 text-center bg-red-50 rounded-lg py-1.5 border border-red-200">
              ⚠️ Score of {val} - your care team will be notified
            </p>
          )}
        </div>
      </div>
    );
  }

  if (field.type === 'radio') {
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
        <div className="grid grid-cols-1 gap-2">
          {field.options.map(opt => {
            const v = typeof opt === 'object' ? opt.value : opt;
            const l = typeof opt === 'object' ? opt.label : opt;
            const sel = String(value) === String(v);
            return (
              <button key={String(v)} type="button" onClick={() => onChange(v)}
                className={`relative px-4 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                  sel
                    ? 'border-teal-600 bg-teal-50/80 shadow-sm ring-1 ring-teal-500/30'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    sel ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'
                  }`}>
                    {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm ${sel ? 'text-teal-900 font-semibold' : 'text-slate-600 font-medium'}`}>{l}</span>
                </div>
                {sel && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle size={11} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === 'multi-select') {
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
        <div className="flex flex-wrap gap-2">
          {field.options.map(opt => {
            const sel = (value || []).includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => {
                  const cur = value || [];
                  onChange(sel ? cur.filter(x => x !== opt) : [...cur, opt]);
                }}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-150 ${
                  sel
                    ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700'
                }`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === 'slider') {
    const val = value ?? 5;
    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{field.label}</label>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <input type="range" min={field.min} max={field.max} value={val}
            onChange={e => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full accent-teal-600 mb-3"
            style={{ background: `linear-gradient(to right, #0f766e 0%, #0f766e ${(val - 1) / 9 * 100}%, #e2e8f0 ${(val - 1) / 9 * 100}%, #e2e8f0 100%)` }} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{field.labels?.[field.min] || field.min}</span>
            <div className="w-9 h-9 rounded-full bg-teal-600 ring-2 ring-teal-200 flex items-center justify-center shadow">
              <span className="text-white text-xs font-bold">{val}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{field.labels?.[field.max] || field.max}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// --- Condition Select (loads from DB) -------------------------------------
function ConditionSelectField({ label, value, onChange }) {
  const [search, setSearch] = useState('');
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/medical/questionnaire-conditions`)
      .then(r => r.json())
      .then(d => { setConditions(d.conditions || []); setLoading(false); })
      .catch(() => {
        setConditions([
          { value: 'Advanced Cancer', label: 'Cancer (any type)' },
          { value: 'Lung Cancer', label: 'Lung Cancer' },
          { value: 'Breast Cancer Advanced', label: 'Breast Cancer' },
          { value: 'Prostate Cancer Advanced', label: 'Prostate Cancer' },
          { value: 'Colorectal Cancer Advanced', label: 'Colorectal / Bowel Cancer' },
          { value: 'Head and Neck Cancer', label: 'Head and Neck Cancer' },
          { value: 'Pancreatic Cancer', label: 'Pancreatic Cancer' },
          { value: 'Ovarian Cancer Advanced', label: 'Ovarian Cancer' },
          { value: 'Heart Failure', label: 'Heart Failure' },
          { value: 'COPD Advanced', label: 'COPD / Chronic Lung Disease' },
          { value: 'Dementia Advanced', label: "Dementia / Alzheimer's" },
          { value: 'Chronic Kidney Disease Advanced', label: 'Kidney Failure' },
          { value: 'Stroke Advanced', label: 'Stroke' },
          { value: 'Parkinson Disease Advanced', label: "Parkinson's Disease" },
          { value: 'Motor Neurone Disease / ALS', label: 'Motor Neurone Disease (MND/ALS)' },
          { value: 'Liver Failure / Cirrhosis Advanced', label: 'Liver Disease / Cirrhosis' },
          { value: 'HIV/AIDS Advanced', label: 'HIV / AIDS' },
          { value: 'Multiple Sclerosis Advanced', label: 'Multiple Sclerosis' },
          { value: 'Sickle Cell Disease Advanced', label: 'Sickle Cell Disease' },
          { value: 'Tuberculosis Advanced', label: 'Tuberculosis (TB)' },
          { value: 'Other', label: 'Other / Not listed here' },
        ]);
        setLoading(false);
      });
  }, []);

  const filtered = conditions.filter(c =>
    !search ||
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    (c.keywords || []).some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search your condition..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none bg-white transition-all" />
      </div>
      {loading ? (
        <div className="text-center py-6"><Loader2 size={20} className="animate-spin mx-auto text-teal-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
          {filtered.map(c => {
            const sel = value === c.value;
            return (
              <button key={c.value} type="button" onClick={() => onChange(c.value)}
                className={`px-3 py-2 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${
                  sel
                    ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-500/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-slate-50'
                }`}>
                <span className="flex items-center gap-1.5">
                  {sel && <CheckCircle size={12} className="text-teal-600 flex-shrink-0" />}
                  {c.label}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-2 text-center text-slate-400 text-sm py-4">No conditions match your search</p>}
        </div>
      )}
      {value && (
        <p className="mt-2.5 text-xs text-teal-700 font-semibold bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
          <CheckCircle size={11} className="text-teal-600" />
          Selected: {conditions.find(c => c.value === value)?.label || value}
        </p>
      )}
    </div>
  );
}
