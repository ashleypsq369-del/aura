/**
 * PersonalisationContext
 * ======================
 * Derives uiFlags from questionnaire preferences and exposes them
 * system-wide so any component can hide/show features, tabs, or
 * sidebar items based on what the user chose during onboarding.
 *
 * Key flags:
 * showCommunity – false if wants_community === 'no'
 * showLegacy – false if legacy_interest === 'no'
 * showJournal – false if coping_strategies excludes writing
 * showAI – false if ai_analysis_consent === 'no'
 * showSpiritualItems – false if spiritual_importance === 'not'
 * simplifiedNav – true if tech_comfort === 'basic' or info_style === 'simple'
 * hiddenNavPaths – Set of sidebar paths to hide
 * hiddenSections – Set of section keys to hide within pages
 */

import { createContext, useContext, useMemo } from 'react';
import usePersonalisation from '../hooks/usePersonalisation';

const PersonalisationContext = createContext({
 uiFlags: {},
 hiddenNavPaths: new Set(),
 hiddenSections: new Set(),
 loaded: false,
});

export function usePersonalisationFlags() {
 return useContext(PersonalisationContext);
}

export function PersonalisationProvider({ children }) {
 const { signals, prefs, isLoading } = usePersonalisation();

 const { uiFlags, hiddenNavPaths, hiddenSections } = useMemo(() => {
 if (!prefs || !signals) {
 return { uiFlags: {}, hiddenNavPaths: new Set(), hiddenSections: new Set() };
 }

 // ── Derive flags ─────────────────────────────────────────────────────
 const wantsCommunity = prefs.wants_community !== 'no';
 const wantsLegacy = prefs.legacy_interest !== 'no';
 const aiConsent = prefs.ai_analysis_consent !== 'no';
 const wantsJournal = !prefs.coping_strategies ||
 prefs.coping_strategies.includes('Reading') ||
 prefs.coping_strategies.includes('Being alone and reflecting') ||
 prefs.coping_strategies.includes('Creative activities') ||
 true; // default on unless explicitly excluded
 const wantsSpiritual = prefs.spiritual_importance !== 'not';
 const wantsEolPlanning = prefs.eol_planning_readiness !== 'no';
 const wantsPeerConnect = prefs.wants_peer_connection !== 'no';
 const simplified = prefs.tech_comfort === 'basic' || prefs.info_style === 'simple';
 const isHighAcuity = signals.isHighAcuity;

 // Caregiver burnout - show wellbeing-focused items
 const isBurntOut = prefs.caregiver_burnout_risk === 'burnout' ||
 prefs.caregiver_burnout_risk === 'struggling';

 // Bereaved family
 const isBereaved = prefs.grief_stage === 'bereaved';

 const uiFlags = {
 showCommunity: wantsCommunity,
 showLegacy: wantsLegacy,
 showJournal: wantsJournal,
 showAI: aiConsent,
 showSpiritualItems: wantsSpiritual,
 showEolPlanning: wantsEolPlanning,
 showPeerConnect: wantsPeerConnect,
 simplifiedNav: simplified,
 isHighAcuity,
 isBurntOut,
 isBereaved,
 // Tab-level flags (used by individual pages)
 showSpiritualTab: wantsSpiritual,
 showFamilyTab: prefs.family_involvement_pref !== 'none',
 showPsychTab: true, // always show psychological support
 };

 // ── Hidden sidebar paths ─────────────────────────────────────────────
 const hidden = new Set();

 // Patient role exclusions
 if (!wantsCommunity) { hidden.add('/community'); }
 if (!wantsLegacy) {
 hidden.add('/legacy-setup');
 hidden.add('/heir-management');
 hidden.add('/legacy-content');
 }
 if (!wantsJournal) { hidden.add('/journal'); }
 if (!wantsEolPlanning) { hidden.add('/legacy-setup'); hidden.add('/heir-management'); }

 // Family role exclusions
 if (!isBereaved && !wantsCommunity) { hidden.add('/bereavement-support'); }
 if (!wantsLegacy) { hidden.add('/my-legacy-access'); }

 // Simplified mode - hide advanced clinical items from patient view
 if (simplified) {
 hidden.add('/care-settings');
 hidden.add('/legacy-content'); // advanced
 }

 // ── Hidden page sections ─────────────────────────────────────────────
 const sections = new Set();

 if (!wantsSpiritual) { sections.add('spiritual'); sections.add('spiritual_care'); }
 if (!wantsCommunity) { sections.add('community_section'); }
 if (!aiConsent) { sections.add('ai_explanation'); sections.add('ai_insights_tab'); }
 if (!wantsLegacy) { sections.add('legacy_section'); sections.add('memory_vault_promo'); }
 if (simplified) {
 sections.add('advanced_clinical');
 sections.add('shap_details');
 }

 return { uiFlags, hiddenNavPaths: hidden, hiddenSections: sections };
 }, [prefs, signals]);

 return (
 <PersonalisationContext.Provider value={{ uiFlags, hiddenNavPaths, hiddenSections, loaded: !isLoading }}>
 {children}
 </PersonalisationContext.Provider>
 );
}
