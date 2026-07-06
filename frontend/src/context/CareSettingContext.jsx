/**
 * CareSettingContext
 * ==================
 * Provides the active care setting for the logged-in user.
 * Drives: sidebar reordering, dashboard quick actions, questionnaire steps.
 *
 * Care settings:
 *   hospital_based | hospice | home_based | outpatient_clinic | long_term_residential
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Building2, Heart, Home, Stethoscope, BedDouble } from 'lucide-react';

// -- Setting metadata ----------------------------------------------------------
export const CARE_SETTING_META = {
  hospital_based: {
    label: 'Hospital-Based Palliative Care',
    shortLabel: 'Hospital',
    icon: Building2,
    color: 'blue',
    description: 'Inpatient specialist team - acute symptom management',
  },
  hospice: {
    label: 'Hospice Care',
    shortLabel: 'Hospice',
    icon: Heart,
    color: 'rose',
    description: 'Comfort-first care - dignity and peace in final months',
  },
  home_based: {
    label: 'Home-Based Palliative Care',
    shortLabel: 'Home Care',
    icon: Home,
    color: 'green',
    description: 'Mobile care team visits you at home',
  },
  outpatient_clinic: {
    label: 'Outpatient Clinic',
    shortLabel: 'Clinic',
    icon: Stethoscope,
    color: 'teal',
    description: 'Regular clinic appointments - same day back home',
  },
  long_term_residential: {
    label: 'Long-Term Residential',
    shortLabel: 'Residential',
    icon: BedDouble,
    color: 'purple',
    description: 'Continuous care in a nursing or residential facility',
  },
};

// -- Setting-specific sidebar nav additions per role ---------------------------
// These items are ADDED/PRIORITISED on top of the base nav for the role.
export const SETTING_NAV_ADDITIONS = {
  // patient nav additions
  patient: {
    hospital_based: [
      { name: 'My Care Plan',     path: '/care-plan',         priority: 1 },
      { name: 'Care Team',        path: '/messages',          priority: 2 },
    ],
    hospice: [
      { name: 'Memory Vault',     path: '/memory-vault',      priority: 1 },
      { name: 'Digital Legacy',   path: '/legacy-setup',      priority: 2 },
      { name: 'My Final Wishes',  path: '/legacy-content',    priority: 3 },
    ],
    home_based: [
      { name: 'Daily Symptom Log', path: '/my-journey',       priority: 1 },
      { name: 'My Medications',    path: '/medications',       priority: 2 },
    ],
    outpatient_clinic: [
      { name: 'Appointments',     path: '/appointments',      priority: 1 },
      { name: 'Pre-Clinic Check', path: '/pre-clinic',        priority: 2 },
    ],
    long_term_residential: [
      { name: 'Wellbeing Check',  path: '/my-space',          priority: 1 },
      { name: 'Community',        path: '/community',         priority: 2 },
    ],
  },
  // family nav additions
  family: {
    hospice: [
      { name: 'Memory Vault',     path: '/memory-vault',      priority: 1 },
      { name: 'Bereavement Support', path: '/continuity-bridge', priority: 2 },
    ],
    home_based: [
      { name: 'Caregiver Support', path: '/resources',        priority: 1 },
    ],
    long_term_residential: [
      { name: 'Family Updates',   path: '/continuity-bridge', priority: 1 },
    ],
  },
  // caregiver nav additions
  caregiver: {
    hospital_based: [
      { name: 'Shift Handover',   path: '/shift-handover',    priority: 1 },
    ],
    home_based: [
      { name: 'Daily Care Log',   path: '/daily-care-log',    priority: 1 },
    ],
    long_term_residential: [
      { name: 'Residential Log',  path: '/residential-log',   priority: 1 },
    ],
  },
};

// -- Setting-specific dashboard quick actions ----------------------------------
export const SETTING_QUICK_ACTIONS = {
  patient: {
    hospital_based: [
      { label: 'Log Pain Level',     path: '/my-space',         icon: '😣', color: 'red' },
      { label: 'Message Care Team',  path: '/messages',         icon: '💬', color: 'teal' },
      { label: 'View Care Plan',     path: '/care-plan',        icon: '📋', color: 'blue' },
      { label: 'My Medications',     path: '/medications',      icon: '💊', color: 'purple' },
    ],
    hospice: [
      { label: 'Add a Memory',       path: '/memory-vault',     icon: '💙', color: 'rose' },
      { label: 'My Legacy',          path: '/legacy-setup',     icon: '📝', color: 'purple' },
      { label: 'Care Team Chat',     path: '/messages',         icon: '💬', color: 'teal' },
      { label: 'Resources',          path: '/resources',        icon: '📚', color: 'green' },
    ],
    home_based: [
      { label: 'Log Symptoms',       path: '/my-journey',       icon: '📊', color: 'teal' },
      { label: 'Medication Reminder', path: '/medications',     icon: '💊', color: 'blue' },
      { label: 'Ask Aura AI',        path: null,                icon: '🤖', color: 'purple', openAura: true },
      { label: 'Contact Care Team',  path: '/messages',         icon: '📞', color: 'green' },
    ],
    outpatient_clinic: [
      { label: 'My Appointments',    path: '/appointments',     icon: '📅', color: 'blue' },
      { label: 'Pre-Clinic Check',   path: '/pre-clinic',       icon: '✅', color: 'teal' },
      { label: 'My Resources',       path: '/resources',        icon: '📚', color: 'green' },
      { label: 'Message Team',       path: '/messages',         icon: '💬', color: 'purple' },
    ],
    long_term_residential: [
      { label: 'Daily Wellbeing',    path: '/my-space',         icon: '❤️', color: 'rose' },
      { label: 'Community Hub',      path: '/community',        icon: '👥', color: 'teal' },
      { label: 'My Journal',         path: '/journal',          icon: '📔', color: 'purple' },
      { label: 'Resources',          path: '/resources',        icon: '📚', color: 'green' },
    ],
  },
  family: {
    hospital_based: [
      { label: 'Message Team',       path: '/messages',         icon: '💬', color: 'teal' },
      { label: 'Care Plan Access',   path: '/continuity-bridge', icon: '📋', color: 'blue' },
    ],
    hospice: [
      { label: 'Memory Vault',       path: '/memory-vault',     icon: '💙', color: 'rose' },
      { label: 'Bereavement Support', path: '/continuity-bridge', icon: '🤝', color: 'purple' },
      { label: 'Community',          path: '/community',        icon: '👥', color: 'teal' },
    ],
    home_based: [
      { label: 'Caregiver Support',  path: '/resources',        icon: '🤝', color: 'green' },
      { label: 'Message Team',       path: '/messages',         icon: '💬', color: 'teal' },
    ],
    long_term_residential: [
      { label: 'Family Updates',     path: '/continuity-bridge', icon: '📰', color: 'blue' },
      { label: 'Memory Vault',       path: '/memory-vault',     icon: '💙', color: 'rose' },
    ],
    outpatient_clinic: [
      { label: 'Appointments',       path: '/appointments',     icon: '📅', color: 'blue' },
      { label: 'Resources',          path: '/resources',        icon: '📚', color: 'green' },
    ],
  },
  caregiver: {
    hospital_based: [
      { label: 'Shift Handover',     path: '/shift-handover',   icon: '🔄', color: 'blue' },
      { label: 'Patient Monitor',    path: '/patients',         icon: '📊', color: 'red' },
    ],
    home_based: [
      { label: 'Daily Care Log',     path: '/daily-care-log',   icon: '📝', color: 'green' },
      { label: 'Patient Check',      path: '/patients',         icon: '👤', color: 'teal' },
    ],
    long_term_residential: [
      { label: 'Residential Log',    path: '/residential-log',  icon: '🏠', color: 'purple' },
      { label: 'Activity Log',       path: '/residential-log',  icon: '🎯', color: 'teal' },
    ],
    hospice: [
      { label: 'Comfort Care',       path: '/patients',         icon: '💙', color: 'rose' },
      { label: 'Family Support',     path: '/messages',         icon: '👨‍👩‍👧', color: 'purple' },
    ],
    outpatient_clinic: [
      { label: 'Pre-Clinic Prep',    path: '/appointments',     icon: '✅', color: 'teal' },
      { label: 'Patient List',       path: '/patients',         icon: '👥', color: 'blue' },
    ],
  },
};

// -- Context -------------------------------------------------------------------
const CareSettingContext = createContext(null);

export function CareSettingProvider({ children }) {
  // Use a try-catch so that if this renders before AuthProvider
  // during HMR or SSR, it degrades gracefully instead of crashing
  let user = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    user = auth?.user ?? null;
  } catch {
    // AuthProvider not yet mounted (HMR race) - use null user
    user = null;
  }

  const value = useMemo(() => {
    const setting = user?.care_setting || null;
    const meta    = setting ? CARE_SETTING_META[setting] : null;
    const role    = user?.role || 'patient';

    return {
      careSetting:   setting,
      meta,
      isKnown:       !!setting,
      navAdditions:  (setting && SETTING_NAV_ADDITIONS[role]?.[setting]) || [],
      quickActions:  (setting && SETTING_QUICK_ACTIONS[role]?.[setting]) || [],
      allSettings:   CARE_SETTING_META,
    };
  }, [user?.care_setting, user?.role]);

  return (
    <CareSettingContext.Provider value={value}>
      {children}
    </CareSettingContext.Provider>
  );
}

export function useCareSettingContext() {
  const ctx = useContext(CareSettingContext);
  if (!ctx) throw new Error('useCareSettingContext must be used within CareSettingProvider');
  return ctx;
}
