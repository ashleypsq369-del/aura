/**
 * UIProfileContext
 * ================
 * Derives and applies a UI adaptation profile from questionnaire answers.
 * Profiles align with W3C COGA, WCAG 2.2, and mHealth AUI research guidelines.
 *
 * Profiles:
 *   standard        — Default. Full-density UI.
 *   elderly         — Age 65+, low tech comfort. Larger text, fewer nav items, no complex gestures.
 *   cognitive       — Dementia/memory difficulty. Single-task screens, no modals, step-by-step.
 *   visual          — Visual impairment. Ultra-high contrast, ≥22px text, no colour-only cues.
 *   paediatric      — Under 18. Guardian-mode, friendly language, simplified actions.
 *   distressed      — Bedbound / very high symptom scores. Minimal UI, one action per screen.
 *
 * Applied via:  data-ui-profile="elderly" on <html> element
 * CSS in:       index.css  [data-ui-profile="elderly"] { ... }
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_URL } from '../api/client';

// ── Profile derivation logic ─────────────────────────────────────────────────

/**
 * Derive a UI profile from questionnaire preferences.
 * Returns one of the profile strings above.
 * Accepts: prefs object from /api/preferences/mine
 */
export function deriveUIProfile(prefs, user) {
  if (!prefs && !user) return 'standard';

  const age      = prefs?.age_group || '';
  const tech     = prefs?.tech_comfort || 'medium';
  const uiNeeds  = prefs?.ui_needs || '';     // JSON array or comma-separated
  const activity = prefs?.activity_level || '';
  const mood     = prefs?.mood_score || 5;
  const esas     = prefs?.esas_pain || 0;
  const diagnosis = (prefs?.primary_condition || '').toLowerCase();

  // Parse ui_needs array
  let needs = [];
  try { needs = JSON.parse(uiNeeds); } catch { needs = uiNeeds ? [uiNeeds] : []; }
  const hasNeed = (n) => needs.some(x => x.toLowerCase().includes(n.toLowerCase()));

  // 1. Cognitive / dementia
  if (
    hasNeed('memory') || hasNeed('dementia') ||
    diagnosis.includes('dementia') || diagnosis.includes('alzheimer')
  ) return 'cognitive';

  // 2. Visual impairment
  if (hasNeed('visual') || hasNeed('low vision') || hasNeed('blind')) return 'visual';

  // 3. Paediatric
  if (age === 'child' || (user?.date_of_birth && isUnder18(user.date_of_birth))) return 'paediatric';

  // 4. Distressed / bedbound
  if (
    activity === 'bedbound' ||
    (esas >= 8 && mood <= 3) ||
    prefs?.emotional_states?.includes('crisis')
  ) return 'distressed';

  // 5. Elderly
  if (
    age === 'elderly' || age === 'older_adult' ||
    tech === 'basic' ||
    (tech === 'low' && (age === 'older_adult' || age === 'elderly'))
  ) return 'elderly';

  return 'standard';
}

function isUnder18(dob) {
  try {
    const age = (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25);
    return age < 18;
  } catch { return false; }
}

// ── Profile metadata ──────────────────────────────────────────────────────────

export const UI_PROFILE_META = {
  standard: {
    label: 'Standard',
    description: 'Default interface with full features',
    bodyClass: '',
    htmlAttr: 'standard',
    minFontSize: 14,
    touchTargetMin: 44,
    maxNavItems: 12,
    density: 'normal',
    simplifiedNav: false,
    noModals: false,
    singleTask: false,
    reducedMotion: false,
    highContrast: false,
  },
  elderly: {
    label: 'Simplified (Elderly)',
    description: 'Larger text, bigger touch targets, simplified navigation',
    bodyClass: 'ui-profile-elderly',
    htmlAttr: 'elderly',
    minFontSize: 18,
    touchTargetMin: 56,
    maxNavItems: 5,
    density: 'comfortable',
    simplifiedNav: true,
    noModals: false,
    singleTask: false,
    reducedMotion: true,
    highContrast: false,
  },
  cognitive: {
    label: 'Cognitive Support',
    description: 'Simplified screens, step-by-step, no time pressure',
    bodyClass: 'ui-profile-cognitive',
    htmlAttr: 'cognitive',
    minFontSize: 18,
    touchTargetMin: 56,
    maxNavItems: 4,
    density: 'spacious',
    simplifiedNav: true,
    noModals: true,
    singleTask: true,
    reducedMotion: true,
    highContrast: false,
  },
  visual: {
    label: 'High Contrast (Visual)',
    description: 'Maximum contrast, larger text, no colour-only information',
    bodyClass: 'ui-profile-visual',
    htmlAttr: 'visual',
    minFontSize: 20,
    touchTargetMin: 56,
    maxNavItems: 6,
    density: 'comfortable',
    simplifiedNav: false,
    noModals: false,
    singleTask: false,
    reducedMotion: true,
    highContrast: true,
  },
  paediatric: {
    label: 'Child Mode',
    description: 'Friendly language, guardian oversight, simplified actions',
    bodyClass: 'ui-profile-paediatric',
    htmlAttr: 'paediatric',
    minFontSize: 16,
    touchTargetMin: 52,
    maxNavItems: 5,
    density: 'comfortable',
    simplifiedNav: true,
    noModals: false,
    singleTask: false,
    reducedMotion: false,
    highContrast: false,
  },
  distressed: {
    label: 'Minimal (Distressed)',
    description: 'Minimal interface, one action at a time, emergency contacts prominent',
    bodyClass: 'ui-profile-distressed',
    htmlAttr: 'distressed',
    minFontSize: 18,
    touchTargetMin: 60,
    maxNavItems: 3,
    density: 'spacious',
    simplifiedNav: true,
    noModals: true,
    singleTask: true,
    reducedMotion: true,
    highContrast: false,
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
const UIProfileContext = createContext(null);

export function UIProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const isPatientLike = ['patient','family','caregiver'].includes(user?.role);

  const { data: prefsData } = useQuery({
    queryKey: ['prefs-for-ui-profile', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const r = await axios.get(`${API_URL}/api/preferences/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return r.data;
    },
    enabled: isAuthenticated && isPatientLike && !!user?.id,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const profileKey = useMemo(() => {
    // Check localStorage override first (from previous questionnaire run)
    const stored = localStorage.getItem('ui_profile');
    if (stored && UI_PROFILE_META[stored]) return stored;
    if (!isPatientLike) return 'standard';
    return deriveUIProfile(prefsData, user);
  }, [prefsData, user, isPatientLike]);

  const profile = UI_PROFILE_META[profileKey] || UI_PROFILE_META.standard;

  // Apply to <html> element
  useEffect(() => {
    const html = document.documentElement;

    // Remove previous profile classes
    Object.values(UI_PROFILE_META).forEach(p => {
      if (p.bodyClass) html.classList.remove(p.bodyClass);
    });

    // Apply new profile
    if (profile.bodyClass) html.classList.add(profile.bodyClass);
    html.setAttribute('data-ui-profile', profile.htmlAttr);

    // Apply reduced motion
    if (profile.reducedMotion) {
      html.classList.add('reduce-motion');
    } else {
      // Only remove if not set by accessibility settings
      const a11y = JSON.parse(localStorage.getItem('accessibility_settings') || '{}');
      if (!a11y.reducedMotion) html.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (profile.highContrast) {
      html.classList.add('high-contrast');
    }

    // Save profile to localStorage so it persists across refreshes
    localStorage.setItem('ui_profile', profileKey);
  }, [profileKey, profile]);

  return (
    <UIProfileContext.Provider value={{ profileKey, profile, allProfiles: UI_PROFILE_META, deriveUIProfile }}>
      {children}
    </UIProfileContext.Provider>
  );
}

export function useUIProfile() {
  const ctx = useContext(UIProfileContext);
  if (!ctx) throw new Error('useUIProfile must be used within UIProfileProvider');
  return ctx;
}
