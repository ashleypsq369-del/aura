import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as SonnerToaster } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { CareSettingProvider } from './context/CareSettingContext';
import { useCareSettingContext } from './context/CareSettingContext';
import { UIProfileProvider } from './context/UIProfileContext';
import { PersonalisationProvider, usePersonalisationFlags } from './context/PersonalisationContext';
import { WebSocketProvider } from './context/WebSocketContext';
import KeyboardNav from './components/KeyboardNav';
import NProgressBar from './components/NProgressBar';
import { TooltipProvider } from './components/ui/Tooltip';
import useVoiceControl from './hooks/useVoiceControl';
import useTouchSupport from './hooks/useTouchSupport';
import useIdleTimer from './hooks/useIdleTimer';
import AutoLogoffWarning from './components/AutoLogoffWarning';
import SplashScreen from './components/SplashScreen';
import 'nprogress/nprogress.css';
import './styles/nprogress-override.css';
import './styles/accessibility.css';
import './styles/themes.css';
import './styles/touch.css';
import './styles/symbol-fixes.css';
import './styles/animations.css';
import './styles/color-system.css';
import './styles/sonner-overrides.css';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import VitalsDetail from './pages/VitalsDetail';
import MedicationsDetail from './pages/MedicationsDetail';
import SymptomsDetail from './pages/SymptomsDetail';
import CarePlanDetail from './pages/CarePlanDetail';
import WellbeingDetail from './pages/WellbeingDetail';
import AIInsights from './pages/AIInsights';
import PatientMonitor from './pages/PatientMonitor';
import Alerts from './pages/Alerts';
import Medications from './pages/Medications';
import Appointments from './pages/Appointments';
import Caregivers from './pages/Caregivers';
import CareGuide from './pages/CareGuide';
import AdaptiveCareGuide from './pages/AdaptiveCareGuide';
import AssessmentDashboard from './pages/AssessmentDashboard';
import ESASForm from './pages/ESASForm';
import PPSForm from './pages/PPSForm';
import MentalHealthForm from './pages/MentalHealthForm';
import BarthelIndexForm from './pages/BarthelIndexForm';
import CognitiveAssessmentForm from './pages/CognitiveAssessmentForm';
import BriefPainInventoryForm from './pages/BriefPainInventoryForm';
import QualityOfLifeForm from './pages/QualityOfLifeForm';
import CaregiverBurdenForm from './pages/CaregiverBurdenForm';
import MotorSkillsForm from './pages/MotorSkillsForm';
import AdvanceCarePlanForm from './pages/AdvanceCarePlanForm';
import MDTMeetingLog from './pages/MDTMeetingLog';
import ReferralTracker from './pages/ReferralTracker';
import SpiritualCareForm from './pages/SpiritualCareForm';
import ContinuityBridge from './pages/ContinuityBridge';
import MemoryVault from './pages/MemoryVault';
import LegacySetup from './pages/LegacySetup';
import HeirManagement from './pages/HeirManagement';
import LegacyContentCreator from './pages/LegacyContentCreator';
import MyLegacyAccess from './pages/MyLegacyAccess';
import AnimationDemoSimple from './pages/AnimationDemoSimple';
import Journal from './pages/Journal';
import PersonalisationQuest from './pages/PersonalisationQuest';
import MLRiskDetail from './pages/MLRiskDetail';
import PatientPortal from './pages/PatientPortal';
import WellnessCheckin from './pages/WellnessCheckin';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminFeaturePanel from './pages/AdminFeaturePanel';
import AuditLog from './pages/AuditLog';
import HIPAACompliance from './pages/HIPAACompliance';
import Reports from './pages/Reports';
import CommunityHub from './pages/CommunityHub';
import CommunityGroupPage from './pages/CommunityGroupPage';
import Profile from './pages/Profile';
import Resources from './pages/Resources';
import MyJourney from './pages/MyJourney';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import NotificationTester from './pages/NotificationTester';
import Settings from './pages/Settings';
import TouchDemo from './pages/TouchDemo';
import Layout from './components/layout/Layout';
import AuraChat from './components/AuraChat';
import AIAssistant from './components/AIAssistant';
import AuraOnboarding from './components/AuraOnboarding';
import TaskNudge from './components/TaskNudge';

// One-time: migrate old dismiss keys so avatar shows for returning users
if (localStorage.getItem('aura_dismissed') === 'true' || localStorage.getItem('aura_v2_dismissed') === 'true') {
 localStorage.removeItem('aura_dismissed');
 localStorage.removeItem('aura_v2_dismissed');
 // Don't set v3 - let avatar show fresh
}

// One-time: clear any tour_done keys that were saved under 'patient' as fallback
// while the real role was still loading. This ensures users who got stuck
// (tour marked done under wrong role) will see it fresh under their real role.
;(function clearStaleTourKeys() {
 // Migration v2: only clear STEP keys (in-progress), never clear DONE keys.
 // Done keys (aura_tour_done_ROLE_v3) are preserved so completed tours don't replay.
 if (!localStorage.getItem('aura_tour_migration_v2')) {
 ['patient','clinician','admin','caregiver','family'].forEach(r => {
 // Only clear in-progress step state, not the completion marker
 sessionStorage.removeItem(`aura_tour_step_${r}`);
 });
 // Also clear the old v1 migration flag so this supersedes it cleanly
 localStorage.removeItem('aura_tour_migration_v1');
 localStorage.setItem('aura_tour_migration_v2', '1');
 }
})();

// ── Restore UI adaptation profile on every page load ─────────────────────────
// This runs before React mounts so the correct CSS class is on <html> immediately,
// preventing any flash of unstyled content for users with non-standard profiles.
;(function restoreUIProfile() {
 const stored = localStorage.getItem('ui_profile');
 if (!stored || stored === 'standard') return;
 const PROFILE_CLASSES = {
 elderly: 'ui-profile-elderly',
 cognitive: 'ui-profile-cognitive',
 visual: 'ui-profile-visual',
 paediatric: 'ui-profile-paediatric',
 distressed: 'ui-profile-distressed',
 };
 const html = document.documentElement;
 html.setAttribute('data-ui-profile', stored);
 if (PROFILE_CLASSES[stored]) html.classList.add(PROFILE_CLASSES[stored]);
 if (['cognitive', 'distressed', 'elderly'].includes(stored)) html.classList.add('reduce-motion');
 if (stored === 'visual') html.classList.add('high-contrast');
})();

// Ghana Homecare Features
import WoundCareModule from './pages/WoundCareModule';
import CarePathwaySelector from './pages/CarePathwaySelector';

// Gap Analysis Priority Pages
import MedicalKnowledge from './pages/MedicalKnowledge';
import ModelBiasReportPage from './pages/ModelBiasReportPage';
import CareSettings from './pages/CareSettings';
import ShiftHandover from './pages/ShiftHandover';
import DailyCareLog from './pages/DailyCareLog';
import PreClinicChecklist from './pages/PreClinicChecklist';
import ResidentialLog from './pages/ResidentialLog';
import BereavedFamilyDashboard from './pages/BereavedFamilyDashboard';

const queryClient = new QueryClient({
 defaultOptions: {
 queries: {
 refetchOnWindowFocus: false,
 retry: 1,
 },
 },
});

function RedirectWithSearch({ to }) {
 const location = useLocation();
 return <Navigate to={`${to}${location.search}`} replace />;
}

function ProtectedRoute({ children }) {
 const { isAuthenticated, loading } = useAuth();

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-800"></div>
 </div>
 );
 }

 return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * CareSettingRouteGuard
 * Wraps individual routes that may be hidden for certain care settings.
 * If the feature is hidden for this user's care setting, redirect to /my-space.
 * Staff (clinician/admin) always pass through.
 */
function CareSettingRouteGuard({ children, featurePath }) {
 const { isHidden } = useCareSettingContext();
 if (isHidden(featurePath)) {
 return <Navigate to="/my-space" replace />;
 }
 return children;
}


function AppRoutes() {
 const { isAuthenticated, logout } = useAuth();
 const { showAiWidgets, featureSettings } = useAppSettings();
 const { uiFlags } = usePersonalisationFlags();
 const location = useLocation();
 
 // Initialize voice control hook
 useVoiceControl();
 
 // Initialize touch support (haptics + sounds)
 useTouchSupport();

 // ── Global personalisation applier ────────────────────────────────────
 // Runs once per login session. Fetches questionnaire prefs from the backend
 // and applies them to theme, a11y, sidebar, and notifications - so returning
 // users always get their chosen settings without re-doing the questionnaire.
 const { user } = useAuth();
 useEffect(() => {
 if (!isAuthenticated || !user?.id) return;
 // Only run once per session
 const sessionKey = `prefs_applied_${user.id}`;
 if (sessionStorage.getItem(sessionKey)) return;

 const token = localStorage.getItem('auth_token');
 if (!token) return;

 // Only apply prefs for patient/family/caregiver - clinicians/admins have no questionnaire
 if (!['patient','family','caregiver'].includes(user.role)) {
 sessionStorage.setItem(sessionKey, '1');
 return;
 }

 // Use /mine endpoint - always correct, works for all roles, uses the API_URL from env
 const baseUrl = import.meta.env.VITE_API_URL?.trim() || '';
 fetch(`${baseUrl}/api/preferences/my`, {
 headers: { Authorization: `Bearer ${token}` },
 })
 .then(r => r.ok ? r.json() : null)
 .then(prefs => {
 if (!prefs) return;

 // Language
 if (prefs.language_pref && prefs.language_pref !== 'en') {
 const stored = localStorage.getItem('app_language');
 if (!stored || stored === 'en') {
 localStorage.setItem('app_language', prefs.language_pref);
 document.documentElement.lang = prefs.language_pref;
 }
 }

 // Theme
 if (prefs.theme_pref) {
 const stored = localStorage.getItem('app_theme');
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
 }

 // Notifications
 if (prefs.notification_pref === 'none') {
 const stored = localStorage.getItem('app_notifications');
 if (stored === null) localStorage.setItem('app_notifications', 'false');
 }

 // Font size from tech comfort
 const techToFont = { low: 'large', basic: 'xlarge' };
 const fontSz = techToFont[prefs.tech_comfort];
 if (fontSz) {
 try {
 const a11y = JSON.parse(localStorage.getItem('accessibility_settings') || '{}');
 if (!a11y.fontSize || a11y.fontSize === 'medium') {
 const updated = { ...a11y, fontSize: fontSz };
 localStorage.setItem('accessibility_settings', JSON.stringify(updated));
 document.documentElement.classList.remove('text-small','text-medium','text-large','text-xlarge','text-xxlarge');
 document.documentElement.classList.add(`text-${fontSz}`);
 // Large touch for basic users
 if (prefs.tech_comfort === 'basic') {
 updated.largeTouch = true;
 localStorage.setItem('accessibility_settings', JSON.stringify(updated));
 document.documentElement.classList.add('large-touch');
 }
 }
 } catch { /* non-fatal */ }
 }

 // Sidebar mode: patients always get expanded sidebar so they can see nav labels
 // Low-tech staff get icon mode only
 if (['patient', 'family'].includes(user.role)) {
 const stored = localStorage.getItem('sidebar_default_state');
 if (!stored || stored === 'icons') {
 localStorage.setItem('sidebar_default_state', 'expanded');
 }
 } else if (prefs.tech_comfort === 'basic' || prefs.tech_comfort === 'low') {
 const stored = localStorage.getItem('sidebar_default_state');
 if (!stored) localStorage.setItem('sidebar_default_state', 'icons');
 }

 // Activity level → reduced motion
 if (prefs.activity_level === 'bedbound' || prefs.activity_level === 'very_low') {
 try {
 const a11y = JSON.parse(localStorage.getItem('accessibility_settings') || '{}');
 if (!a11y.reducedMotion) {
 localStorage.setItem('accessibility_settings', JSON.stringify({ ...a11y, reducedMotion: true, largeTouch: true }));
 }
 } catch { /* non-fatal */ }
 }

 // AI consent
 if (prefs.ai_analysis_consent === 'no') {
 const stored = localStorage.getItem('show_ai_widgets');
 if (stored === null) localStorage.setItem('show_ai_widgets', 'false');
 }

 sessionStorage.setItem(sessionKey, '1');
 })
 .catch(() => { /* network failure is non-fatal */ });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [isAuthenticated, user?.id]);
 // ──────────────────────────────────────────────────────────────────────

 // Reinitialise AOS when smoothScrollReveal changes
 useEffect(() => {
 import('aos').then((AOS) => {
 if (featureSettings.smoothScrollReveal) {
 AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 80, disable: false });
 } else {
 AOS.init({ disable: true });
 // Remove all existing AOS classes so nothing is hidden
 document.querySelectorAll('[data-aos]').forEach(el => {
 el.removeAttribute('data-aos');
 el.style.opacity = '';
 el.style.transform = '';
 });
 }
 });
 }, [featureSettings.smoothScrollReveal]);

 // HIPAA Compliance: 15-minute auto-logoff
 const {
 showWarning,
 remainingSeconds,
 stayActive
 } = useIdleTimer({
 enabled: isAuthenticated, // Only when logged in
 onIdle: () => {
 console.log('[HIPAA] Auto-logout due to 15 minutes inactivity');
 logout();
 },
 onWarning: () => {
 console.log('[HIPAA] Showing inactivity warning at 14 minutes');
 }
 });

 const handleLogoutNow = () => {
 console.log('[HIPAA] User manually logged out from warning');
 logout();
 };

 return (
 <>
 {/* Keyboard Navigation Support */}
 <KeyboardNav />

 {/* Page transition progress bar */}
 <NProgressBar />
 
 {/* HIPAA Auto-Logoff Warning */}
 {isAuthenticated && (
 <AutoLogoffWarning
 show={showWarning}
 remainingSeconds={remainingSeconds}
 onStayActive={stayActive}
 onLogout={handleLogoutNow}
 />
 )}
 
 <AnimatePresence mode="wait">
 <Routes location={location} key={location.pathname}>
 {/* Public Routes */}
 <Route path="/login" element={<Login />} />
 <Route path="/register" element={<Register />} />
 <Route path="/forgot-password" element={<ForgotPassword />} />
 <Route path="/reset-password" element={<ResetPassword />} />
 {/* Chatbot redirect - public (catches pre-login visits), preserves ?userId= params */}
 <Route path="/chatbot" element={<RedirectWithSearch to="/messages" />} />
 
 {/* Personalisation Questionnaire - No Layout */}
 <Route 
 path="/setup" 
 element={
 <ProtectedRoute>
 <PersonalisationQuest />
 </ProtectedRoute>
 } 
 />
 
 {/* Protected Routes with Layout */}
 <Route
 path="/*"
 element={
 <ProtectedRoute>
 <Layout>
 <Routes>
 <Route path="/" element={<Dashboard />} />
 <Route path="/dashboard" element={<Dashboard />} />
 <Route path="/my-space" element={<PatientPortal />} />
 <Route path="/wellness-checkin" element={<WellnessCheckin />} />
 <Route path="/patients" element={<Patients />} />
 <Route path="/patient/:patientId" element={<PatientMonitor />} />
 <Route path="/patients/:patientId" element={<PatientDetail />} />
 <Route path="/patients/:patientId/vitals" element={<VitalsDetail />} />
 <Route path="/patients/:patientId/medications" element={<MedicationsDetail />} />
 <Route path="/patients/:patientId/symptoms" element={<SymptomsDetail />} />
 <Route path="/patients/:patientId/care-plan" element={<CarePlanDetail />} />
 <Route path="/patients/:patientId/appointments" element={<Appointments />} />
 <Route path="/patients/:patientId/wellbeing" element={<WellbeingDetail />} />
 <Route path="/patients/:patientId/wound-care" element={<WoundCareModule />} />
 <Route path="/patients/:patientId/ml-risk" element={<MLRiskDetail />} />
 <Route path="/ai-insights" element={<AIInsights />} />
 <Route path="/alerts" element={<Alerts />} />
 <Route path="/medications" element={<Medications />} />
 <Route path="/appointments" element={<Appointments />} />
 <Route path="/caregivers" element={<Caregivers />} />
 <Route path="/care-guide" element={<CareGuide />} />
 <Route path="/care-guide/:patientId" element={<AdaptiveCareGuide />} />
 <Route path="/assessments/:patientId" element={<AssessmentDashboard />} />
 <Route path="/assessments/:patientId/esas" element={<ESASForm />} />
 <Route path="/assessments/:patientId/pps" element={<PPSForm />} />
 <Route path="/assessments/:patientId/mental-health" element={<MentalHealthForm />} />
 <Route path="/assessments/:patientId/barthel" element={<BarthelIndexForm />} />
 <Route path="/assessments/:patientId/cognitive" element={<CognitiveAssessmentForm />} />
 <Route path="/assessments/:patientId/pain" element={<BriefPainInventoryForm />} />
 <Route path="/assessments/:patientId/qol" element={<QualityOfLifeForm />} />
 <Route path="/assessments/:patientId/caregiver-burden" element={<CaregiverBurdenForm />} />
 <Route path="/assessments/:patientId/motor-skills" element={<MotorSkillsForm />} />
 <Route path="/assessments/:patientId/acp" element={<AdvanceCarePlanForm />} />
 <Route path="/assessments/:patientId/mdt" element={<MDTMeetingLog />} />
 <Route path="/assessments/:patientId/referrals" element={<ReferralTracker />} />
 <Route path="/assessments/:patientId/spiritual-care" element={<SpiritualCareForm />} />
 <Route path="/continuity-bridge" element={<ContinuityBridge />} />
 <Route path="/memory-vault" element={
 <CareSettingRouteGuard featurePath="/memory-vault">
 <MemoryVault />
 </CareSettingRouteGuard>
 } />
 <Route path="/legacy-setup" element={
 <CareSettingRouteGuard featurePath="/legacy-setup">
 <LegacySetup />
 </CareSettingRouteGuard>
 } />
 <Route path="/heir-management" element={
 <CareSettingRouteGuard featurePath="/legacy-setup">
 <HeirManagement />
 </CareSettingRouteGuard>
 } />
 <Route path="/legacy-content" element={
 <CareSettingRouteGuard featurePath="/legacy-content">
 <LegacyContentCreator />
 </CareSettingRouteGuard>
 } />
 <Route path="/my-legacy-access" element={<MyLegacyAccess />} />
 <Route path="/journal" element={
 <CareSettingRouteGuard featurePath="/journal">
 <Journal />
 </CareSettingRouteGuard>
 } />
 <Route path="/community" element={
 <CareSettingRouteGuard featurePath="/community">
 <CommunityHub />
 </CareSettingRouteGuard>
 } />
 <Route path="/community/:groupId" element={<CommunityGroupPage />} />
 <Route path="/community-hub" element={<CommunityHub />} />
 <Route path="/profile" element={<Profile />} />
 <Route path="/resources" element={<Resources />} />
 <Route path="/my-journey" element={<MyJourney />} />
 <Route path="/messages" element={<Messages />} />
 {/* Chatbot redirect - inside Layout (logged-in users), preserves ?userId= params */}
 <Route path="/chatbot" element={<RedirectWithSearch to="/messages" />} />
 <Route path="/notifications" element={<Notifications />} />
 <Route path="/notification-tester" element={<NotificationTester />} />
 <Route path="/settings" element={<Settings />} />
 <Route path="/touch-demo" element={<TouchDemo />} />
 <Route path="/care-pathway-selector" element={<CarePathwaySelector />} />
 <Route path="/admin/users" element={<AdminUserManagement />} />
 <Route path="/admin/features" element={<AdminFeaturePanel />} />
 <Route path="/admin/audit" element={<AuditLog />} />
 <Route path="/admin/hipaa-compliance" element={<HIPAACompliance />} />
 <Route path="/admin/model-bias-report" element={<ModelBiasReportPage />} />
 <Route path="/reports" element={<Reports />} />
 <Route path="/medical-knowledge" element={<MedicalKnowledge />} />
 <Route path="/care-settings" element={<CareSettings />} />
 <Route path="/shift-handover" element={<ShiftHandover />} />
 <Route path="/daily-care-log" element={<DailyCareLog />} />
 <Route path="/pre-clinic" element={
 <CareSettingRouteGuard featurePath="/pre-clinic">
 <PreClinicChecklist />
 </CareSettingRouteGuard>
 } />
 <Route path="/residential-log" element={<ResidentialLog />} />
 <Route path="/bereavement-support" element={
 <CareSettingRouteGuard featurePath="/bereavement-support">
 <BereavedFamilyDashboard />
 </CareSettingRouteGuard>
 } />
 {/* Dev-only pages -- hidden from nav but reachable if needed */}
 <Route path="/animation-demo" element={<AnimationDemoSimple />} />
 </Routes>
 </Layout>
 {/* AI widgets - hidden if user declined AI consent in questionnaire OR turned off in Settings */}
 {showAiWidgets && uiFlags.showAI !== false && (
 <>
 <AuraChat />
 <AIAssistant />
 <AuraOnboarding />
 </>
 )}
 {/* Task nudge - fires once per session when pending tasks exist */}
 <TaskNudge />
 </ProtectedRoute>
 }
 />
 </Routes>
 </AnimatePresence>
 
 {/* Single Sonner toaster - below header, right-aligned, 6s duration */}
 <SonnerToaster
 position="top-right"
 richColors
 expand={false}
 visibleToasts={3}
 gap={6}
 toastOptions={{
 duration: 6000,
 style: {
 fontFamily: 'inherit',
 fontSize: '13px',
 },
 }}
 theme="system"
 />
 </>
 );
}

export default function App() {
 // Show splash screen once per browser session
 const SPLASH_KEY = 'aura_splash_v4';
 const [showSplash, setShowSplash] = React.useState(() => {
 return !sessionStorage.getItem(SPLASH_KEY);
 });

 const handleSplashDone = () => {
 sessionStorage.setItem(SPLASH_KEY, '1');
 setShowSplash(false);
 };

 return (
 <QueryClientProvider client={queryClient}>
 <AuthProvider>
 <AccessibilityProvider>
 <AppSettingsProvider>
 <CareSettingProvider>
 <WebSocketProvider>
 <PersonalisationProvider>
 <UIProfileProvider>
 <BrowserRouter>
 <TooltipProvider>
 {/* Intro splash - shown once per session */}
 {showSplash && (
 <SplashScreen onDone={handleSplashDone} />
 )}
 <AppRoutes />
 </TooltipProvider>
 </BrowserRouter>
 </UIProfileProvider>
 </PersonalisationProvider>
 </WebSocketProvider>
 </CareSettingProvider>
 </AppSettingsProvider>
 </AccessibilityProvider>
 </AuthProvider>
 </QueryClientProvider>
 );
}
