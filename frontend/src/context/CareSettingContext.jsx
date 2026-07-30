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
import { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Building2, Heart, Home, Stethoscope, BedDouble } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/client';

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

// -- Care-setting feature gates -----------------------------------------------
// Maps each care setting to which features are HIDDEN or DE-EMPHASISED for patients/family.
// 'hidden'    → completely removed from sidebar/quick-actions/UI
// 'reduced'   → shown but with a softer label or lower priority
// Staff (clinician/admin) always see everything.

export const SETTING_FEATURE_GATES = {
  hospital_based: {
    hidden:  [],                                       // everything available
    reduced: ['legacy-setup', 'memory-vault', 'bereavement-support'],
    emphasis: ['care-plan', 'medications', 'wellness-checkin', 'messages'],
  },
  hospice: {
    hidden:  ['pre-clinic', 'appointments'],           // no clinic visits
    reduced: ['community'],
    emphasis: ['memory-vault', 'legacy-setup', 'journal', 'messages', 'bereavement-support'],
  },
  home_based: {
    hidden:  ['pre-clinic', 'shift-handover'],
    reduced: ['bereavement-support'],
    emphasis: ['medications', 'wellness-checkin', 'messages', 'my-journey'],
  },
  outpatient_clinic: {
    hidden:  ['legacy-setup', 'legacy-content', 'bereavement-support', 'memory-vault', 'journal', 'shift-handover'],
    reduced: ['community'],
    emphasis: ['appointments', 'medications', 'wellness-checkin'],
  },
  long_term_residential: {
    hidden:  ['pre-clinic'],
    reduced: ['bereavement-support'],
    emphasis: ['wellness-checkin', 'community', 'journal', 'memory-vault', 'messages'],
  },
};

// Helper: given a care setting and a path segment, is the feature hidden?
export function isFeatureHidden(careSetting, featurePathSegment, role = 'patient') {
  if (!careSetting) return false;
  // Staff always see everything
  if (['clinician', 'admin'].includes(role)) return false;
  const gates = SETTING_FEATURE_GATES[careSetting];
  if (!gates) return false;
  return gates.hidden.some(h => featurePathSegment.includes(h));
}

// Helper: returns the emphasis level for a feature ('high' | 'normal' | 'reduced' | 'hidden')
export function featureEmphasis(careSetting, featurePathSegment, role = 'patient') {
  if (!careSetting || ['clinician', 'admin'].includes(role)) return 'normal';
  const gates = SETTING_FEATURE_GATES[careSetting];
  if (!gates) return 'normal';
  if (gates.hidden.some(h => featurePathSegment.includes(h)))    return 'hidden';
  if (gates.reduced.some(h => featurePathSegment.includes(h)))   return 'reduced';
  if (gates.emphasis.some(h => featurePathSegment.includes(h)))  return 'high';
  return 'normal';
}

// -- Context ------------------------------------------------------------------
const CareSettingContext = createContext(null);

export function CareSettingProvider({ children }) {
  let user = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    user = auth?.user ?? null;
  } catch {
    user = null;
  }

  // Fetch per-user feature overrides from backend (patient/family/caregiver)
  const [userOverrides, setUserOverrides] = useState({});
  useEffect(() => {
    if (!user?.id || ['clinician','admin'].includes(user?.role)) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    axios.get(`${API_URL}/api/features/my-overrides`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      // Build map: feature_path → state
      const map = {};
      for (const o of (r.data?.overrides || [])) {
        map[o.feature_path] = o.state;   // 'enabled' | 'disabled' | 'locked'
      }
      setUserOverrides(map);
    }).catch(() => {});
  }, [user?.id, user?.role]);

  const value = useMemo(() => {
    const setting = user?.care_setting || null;
    const meta    = setting ? CARE_SETTING_META[setting] : null;
    const role    = user?.role || 'patient';
    const gates   = (setting && SETTING_FEATURE_GATES[setting]) || { hidden: [], reduced: [], emphasis: [] };

    /**
     * isHidden(pathSegment) — true if feature should be removed.
     * Priority order:
     *  1. Admin override 'locked'   → always hidden (cannot be overridden by user)
     *  2. Admin override 'enabled'  → always shown (overrides care setting)
     *  3. Admin override 'disabled' → always hidden
     *  4. Care setting gate default
     */
    const isHidden = (pathSegment) => {
      if (['clinician','admin'].includes(role)) return false;
      const override = userOverrides[pathSegment];
      if (override === 'locked')   return true;
      if (override === 'enabled')  return false;
      if (override === 'disabled') return true;
      return isFeatureHidden(setting, pathSegment, role);
    };

    /** isLocked(pathSegment) — admin has explicitly locked this feature */
    const isLocked = (pathSegment) => userOverrides[pathSegment] === 'locked';

    /** isAdminEnabled(pathSegment) — admin explicitly enabled despite care setting */
    const isAdminEnabled = (pathSegment) => userOverrides[pathSegment] === 'enabled';

    const emphasis = (pathSegment) => {
      if (isHidden(pathSegment)) return 'hidden';
      return featureEmphasis(setting, pathSegment, role);
    };

    return {
      careSetting:        setting,
      meta,
      isKnown:            !!setting,
      navAdditions:       (setting && SETTING_NAV_ADDITIONS[role]?.[setting]) || [],
      quickActions:       (setting && SETTING_QUICK_ACTIONS[role]?.[setting]) || [],
      allSettings:        CARE_SETTING_META,
      // Feature gates
      hiddenFeatures:     gates.hidden,
      reducedFeatures:    gates.reduced,
      emphasizedFeatures: gates.emphasis,
      userOverrides,      // raw override map for the feature request UI
      isHidden,
      isLocked,
      isAdminEnabled,
      emphasis,
    };
  }, [user?.care_setting, user?.role, userOverrides]);

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
