/**
 * usePersonalisation.js
 * =====================
 * Reads the user's questionnaire preferences from the backend and applies
 * them system-wide:
 *   - Language preference → app_language
 *   - Tech comfort → accessibility font size
 *   - Info style → stored for consumption by components
 *   - Primary condition → care guide, resources, community filtering
 *   - Spiritual care → community group filtering
 *   - Wants community → prompt community hub
 *
 * This hook is called once on login inside AppSettingsProvider.
 * Individual pages can also call it to get prefs for conditional rendering.
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

// Map tech_comfort → accessibility font size setting
const TECH_COMFORT_TO_FONT = {
  high:   'normal',
  medium: 'normal',
  low:    'large',
  basic:  'xlarge',
};

export function usePersonalisation({ applySettings } = {}) {
  const { user, isAuthenticated } = useAuth();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      const r = await apiClient.get(`/api/preferences/${user.id}`);
      return r.data;
    },
    enabled: !!(isAuthenticated && user?.id),
    staleTime: 10 * 60 * 1000,   // 10 min cache
    retry: false,
  });

  // Apply language preference
  useEffect(() => {
    if (!prefs?.language_pref) return;
    const stored = localStorage.getItem('app_language');
    if (!stored || stored === 'en') {
      localStorage.setItem('app_language', prefs.language_pref);
      document.documentElement.lang = prefs.language_pref;
    }
  }, [prefs?.language_pref]);

  // Apply tech_comfort → font size accessibility setting
  useEffect(() => {
    if (!prefs?.tech_comfort) return;
    const currentSize = localStorage.getItem('a11y_fontSize');
    if (!currentSize || currentSize === 'normal') {
      const recommendedSize = TECH_COMFORT_TO_FONT[prefs.tech_comfort] || 'normal';
      if (recommendedSize !== 'normal') {
        localStorage.setItem('a11y_fontSize', recommendedSize);
        applySettings?.({ fontSize: recommendedSize });
      }
    }
  }, [prefs?.tech_comfort, applySettings]);

  // Apply theme preference (only if user hasn't manually changed it since questionnaire)
  useEffect(() => {
    if (!prefs?.theme_pref) return;
    const stored = localStorage.getItem('app_theme');
    // Only apply if still at default 'light' — respect manual overrides
    if (!stored || stored === 'light') {
      localStorage.setItem('app_theme', prefs.theme_pref);
      const root = document.documentElement;
      root.classList.remove('light-theme', 'dark-theme', 'dark');
      if (prefs.theme_pref === 'dark') {
        root.classList.add('dark-theme', 'dark');
      } else if (prefs.theme_pref === 'auto') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark-theme', 'dark');
        } else {
          root.classList.add('light-theme');
        }
      } else {
        root.classList.add('light-theme');
      }
    }
  }, [prefs?.theme_pref]);

  // Apply notification preference
  useEffect(() => {
    if (!prefs?.notification_pref) return;
    const stored = localStorage.getItem('app_notifications');
    if (stored === null) {
      localStorage.setItem('app_notifications', prefs.notification_pref === 'none' ? 'false' : 'true');
    }
  }, [prefs?.notification_pref]);

  // Apply activity_level → reduced motion + large touch for low-mobility users
  useEffect(() => {
    if (!prefs?.activity_level) return;
    if (prefs.activity_level === 'bedbound' || prefs.activity_level === 'very_low') {
      try {
        const a11y = JSON.parse(localStorage.getItem('accessibility_settings') || '{}');
        if (!a11y.reducedMotion) {
          localStorage.setItem('accessibility_settings', JSON.stringify({
            ...a11y, reducedMotion: true, largeTouch: true
          }));
        }
      } catch { /* non-fatal */ }
    }
  }, [prefs?.activity_level]);

  // Compute derived personalisation signals
  const signals = prefs ? computeSignals(prefs) : null;

  return { prefs, signals, isLoading };
}

/**
 * computeSignals - derives actionable UI signals from raw preferences.
 * Components import this to make conditional rendering decisions.
 * Works for both patient AND family roles.
 */
function computeSignals(prefs) {
  const role = prefs.role || 'patient';

  // ── FAMILY SIGNALS ──────────────────────────────────────────────────────
  if (role === 'family') {
    // Safely coerce to array
    const toArr = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { const p = JSON.parse(val); return Array.isArray(p) ? p : [p]; } catch {}
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    };
    const familyEmotions = toArr(prefs.family_emotional_state);
    const needsEmotionalSupport = prefs.needs_counselling === 'yes' ||
      prefs.caregiver_burnout_risk === 'struggling' || prefs.caregiver_burnout_risk === 'burnout' ||
      familyEmotions.some(e => ['Overwhelmed', 'Exhausted', 'Scared', 'Grief', 'Lonely', 'Numb'].includes(e));

    const isBurntOut = prefs.caregiver_burnout_risk === 'burnout' || prefs.caregiver_burnout_risk === 'struggling';
    const isBereaved = prefs.grief_stage === 'bereaved';
    const hasYoungChildren = prefs.has_young_children && prefs.has_young_children !== 'no';
    const wantsEolPlanning = prefs.eol_planning_readiness === 'ready' || prefs.eol_planning_readiness === 'open';
    const wantsLegacy = prefs.legacy_interest === 'yes';
    const needsCommunity = prefs.wants_community === 'yes' || prefs.wants_community === true;
    const needsSpiritualSupport = prefs.spiritual_importance === 'very' || prefs.spiritual_importance === 'important';

    const greetingContext = (() => {
      if (isBereaved) return 'bereaved';
      if (isBurntOut) return 'burnout';
      if (needsEmotionalSupport) return 'emotional';
      if (needsSpiritualSupport) return 'spiritual';
      return 'general';
    })();

    const prioritisedActions = [];
    if (isBurntOut || needsEmotionalSupport) prioritisedActions.push('messages');
    if (needsCommunity) prioritisedActions.push('community');
    if (wantsLegacy) prioritisedActions.push('memory-vault');
    if (wantsEolPlanning) prioritisedActions.push('journey');

    const todayFocusMessage = (() => {
      if (isBurntOut) return "You mentioned feeling burnt out. Please reach out to your care team — caregiver support is available for you too.";
      if (isBereaved) return "We're here for you during this time of grief. Bereavement support resources are available in the Community Hub.";
      if (needsEmotionalSupport) return "Looking after someone you love is hard. Emotional support is available — check Resources or message the care team.";
      if (hasYoungChildren) return "You have young people affected by this. Resources on supporting children through illness and loss are available.";
      if (wantsLegacy) return "The Memory Vault lets you and your loved one preserve stories, photos, and messages for the family.";
      return null;
    })();

    const wellbeingInsight = (() => {
      if (isBurntOut) return "Caregiver burnout is serious — you can't pour from an empty cup. Please prioritise your own wellbeing.";
      if (needsEmotionalSupport) return "Caring for someone with a serious illness can bring up overwhelming emotions. You don't have to manage this alone.";
      if (isBereaved) return "Bereavement is a journey that takes time. Grief support resources and peer groups are here when you need them.";
      return null;
    })();

    const recommendedResources = (() => {
      const recs = [];
      if (isBurntOut) recs.push({ title: 'Caregiver Wellbeing Guide', reason: 'You indicated caregiver burnout or struggle.', tag: 'caregiver' });
      if (isBereaved) recs.push({ title: 'Bereavement Support', reason: 'Selected to support you through grief and loss.', tag: 'bereavement' });
      if (hasYoungChildren) recs.push({ title: 'Talking to Children About Serious Illness', reason: 'You have young family members affected by this.', tag: 'family' });
      if (wantsEolPlanning) recs.push({ title: 'End-of-Life Planning Guide', reason: 'Your family expressed readiness to plan ahead.', tag: 'eol' });
      if (needsSpiritualSupport) recs.push({ title: 'Spiritual Care for Families', reason: 'Faith is important to your family.', tag: 'spiritual' });
      return recs.slice(0, 3);
    })();

    return {
      role: 'family',
      greetingContext,
      needsEmotionalSupport,
      isBurntOut,
      isBereaved,
      hasYoungChildren,
      wantsLegacy,
      wantsEolPlanning,
      needsCommunity,
      needsSpiritualSupport,
      prioritisedActions,
      todayFocusMessage,
      wellbeingInsight,
      recommendedResources,
      infoStyle: prefs.info_style || 'mixed',
      language: prefs.language_pref || 'en',
      techComfort: prefs.tech_comfort,
      useSimpleLayout: prefs.info_style === 'simple' || prefs.tech_comfort === 'basic',
      // Pass through shared fields used across system
      resourceTags: needsSpiritualSupport ? ['spiritual', 'family'] : ['family'],
      communityTags: ['family', ...(isBereaved ? ['bereavement'] : [])],
      familyRelation: prefs.family_relation,
      caregiverLevel: prefs.caregiver_level,
      emotionalStates: toArr(prefs.family_emotional_state),
      religiousBackground: prefs.religious_background,
    };
  }

  // ── PATIENT SIGNALS (original logic) ────────────────────────────────────
  const condition = prefs.primary_condition || '';
  const infoStyle = prefs.info_style || 'mixed';

  // Safely coerce to array — prefs may store as JSON string, CSV, or actual array
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { const p = JSON.parse(val); return Array.isArray(p) ? p : [p]; } catch {}
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const emotionalStates = toArray(prefs.emotional_states);
  const carePriorities = toArray(prefs.care_priorities);

  // Pain severity bucket (from initial ESAS)
  const painLevel = prefs.esas_pain ?? 0;
  const anxietyLevel = prefs.esas_anxiety ?? 0;
  const wellbeingLevel = prefs.esas_wellbeing ?? 0;

  // High-priority support flags
  const needsEmotionalSupport = anxietyLevel >= 6 || wellbeingLevel >= 6 ||
    emotionalStates.some(e => ['Scared', 'Overwhelmed', 'Sad', 'Lonely'].includes(e));

  const needsSpiritualSupport = prefs.wants_spiritual_care === true ||
    prefs.wants_spiritual_care === 'yes' ||
    prefs.spiritual_importance === 'very' ||
    prefs.spiritual_importance === 'important';

  const needsCommunity = prefs.wants_community === true ||
    prefs.wants_peer_connection === true ||
    carePriorities.includes('Community connection');

  const isHighAcuity = painLevel >= 7 || wellbeingLevel >= 7 ||
    prefs.activity_level === 'bedbound' || prefs.activity_level === 'very_low';

  // Dashboard greeting personalisation
  const greetingContext = (() => {
    if (painLevel >= 7) return 'pain';
    if (needsEmotionalSupport) return 'emotional';
    if (needsSpiritualSupport) return 'spiritual';
    if (carePriorities.includes('Spending time with family')) return 'family';
    return 'general';
  })();

  // Which quick-action cards should be highlighted (top of list)
  const prioritisedActions = [];
  if (painLevel >= 5) prioritisedActions.push('wellness-checkin');
  if (needsEmotionalSupport) prioritisedActions.push('messages');
  if (needsSpiritualSupport) prioritisedActions.push('community');
  if (needsCommunity) prioritisedActions.push('community');
  if (carePriorities.includes('Pain control')) prioritisedActions.push('wellness-checkin');
  if (carePriorities.includes('Preparing for the future')) prioritisedActions.push('journey');

  // Resource filter tags derived from condition + culture
  const resourceTags = [condition.toLowerCase()].filter(Boolean);
  if (prefs.religious_background && prefs.religious_background !== 'none') {
    resourceTags.push(prefs.religious_background);
  }
  const culturalPractices = toArray(prefs.cultural_practices);
  if (culturalPractices.includes('Traditional herbal remedies')) {
    resourceTags.push('traditional');
  }

  // Community group filter tags
  const communityTags = [condition.toLowerCase()].filter(Boolean);
  if (prefs.religious_background && prefs.religious_background !== 'none') {
    communityTags.push(prefs.religious_background);
  }
  if (needsEmotionalSupport) communityTags.push('mental_health', 'grief');

  // Display style — 'simple' users get less text, fewer options shown
  const useSimpleLayout = infoStyle === 'simple' || prefs.tech_comfort === 'basic';

  // Today's focus message driven by questionnaire
  const todayFocusMessage = (() => {
    if (painLevel >= 7) return `Your pain score from setup was ${painLevel}/10. Log today's symptoms so your care team can adjust your plan.`;
    if (needsEmotionalSupport) return "You mentioned feeling overwhelmed or anxious. Your care team is here — reach out via Messages anytime.";
    if (needsSpiritualSupport) return "Spiritual care is important to you. Check the Community Hub for support groups aligned with your faith.";
    if (carePriorities.includes('Staying at home')) return "Your goal is to stay at home. Your care plan has been tailored for home-based palliative care.";
    if (needsCommunity) return "Connecting with others going through similar experiences can make a real difference. Visit the Community Hub.";
    return null;
  })();

  // Wellbeing insight — a contextual sentence shown in the Wellbeing Snapshot
  const wellbeingInsight = (() => {
    if (painLevel >= 7 && anxietyLevel >= 6)
      return `You reported high pain (${painLevel}/10) and anxiety (${anxietyLevel}/10) during setup. Your team has been notified.`;
    if (painLevel >= 7)
      return `You reported a pain level of ${painLevel}/10 during setup. Log daily so your team can keep it under control.`;
    if (anxietyLevel >= 6)
      return `You mentioned significant anxiety (${anxietyLevel}/10). Emotional support is available — message your care team anytime.`;
    if (wellbeingLevel >= 6)
      return `Your overall wellbeing score was ${wellbeingLevel}/10 at setup. Regular check-ins help your team track improvements.`;
    if (needsSpiritualSupport)
      return "Spiritual and emotional care is part of your personalised plan. Your care team is mindful of what matters most to you.";
    return null;
  })();

  // Personalised resource suggestions based on condition + care priorities
  const recommendedResources = (() => {
    const recs = [];
    if (condition && condition !== 'other') {
      recs.push({
        title: `Understanding ${condition.replace(/_/g, ' ')}`,
        reason: `Matched to your primary diagnosis from your intake questionnaire.`,
        tag: condition,
      });
    }
    if (carePriorities.includes('Pain control')) {
      recs.push({
        title: 'Managing Pain at Home',
        reason: 'You listed pain control as a top care priority.',
        tag: 'pain',
      });
    }
    if (needsEmotionalSupport) {
      recs.push({
        title: 'Coping with Difficult Emotions',
        reason: 'Based on emotional states you shared during setup.',
        tag: 'mental_health',
      });
    }
    if (needsSpiritualSupport) {
      recs.push({
        title: 'Spiritual Care & Comfort',
        reason: 'Spiritual care is important to you — this guide was selected for you.',
        tag: 'spiritual',
      });
    }
    if (carePriorities.includes('Spending time with family')) {
      recs.push({
        title: 'Family Support Guide',
        reason: 'You identified family time as a top priority.',
        tag: 'family',
      });
    }
    if (carePriorities.includes('Staying at home')) {
      recs.push({
        title: 'Home-Based Palliative Care',
        reason: 'Your care preference is to remain at home — this resource explains your options.',
        tag: 'home_care',
      });
    }
    return recs.slice(0, 3);
  })();

  return {
    condition,
    painLevel,
    anxietyLevel,
    wellbeingLevel,
    needsEmotionalSupport,
    needsSpiritualSupport,
    needsCommunity,
    isHighAcuity,
    greetingContext,
    prioritisedActions,
    resourceTags,
    communityTags,
    useSimpleLayout,
    todayFocusMessage,
    wellbeingInsight,
    recommendedResources,
    infoStyle,
    language: prefs.language_pref || 'en',
    carePriorities,
    emotionalStates,
    religiousBackground: prefs.religious_background,
    wantsSpiritualCare: needsSpiritualSupport,
    activityLevel: prefs.activity_level,
    techComfort: prefs.tech_comfort,
    themePref: prefs.theme_pref || 'light',
    notificationPref: prefs.notification_pref || 'all',
    topicInterests: toArray(prefs.topic_interests),
    copingStrategies: toArray(prefs.coping_strategies),
    infoFrequency: prefs.info_frequency || 'weekly',
    hasYoungDependants: prefs.has_dependants === 'yes_children',
    mainSupportPerson: prefs.main_support_person,
    socialConnectedness: prefs.social_connectedness,
    wantsLegacy: prefs.legacy_interest === 'yes',
    aiConsent: prefs.ai_analysis_consent !== 'no',
    role: 'patient',
  };
}

export default usePersonalisation;
