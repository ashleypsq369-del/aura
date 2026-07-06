import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { CareSettingProvider } from './context/CareSettingContext';
import KeyboardNav from './components/KeyboardNav';
import NProgressBar from './components/NProgressBar';
import { TooltipProvider } from './components/ui/Tooltip';
import useVoiceControl from './hooks/useVoiceControl';
import useTouchSupport from './hooks/useTouchSupport';
import useIdleTimer from './hooks/useIdleTimer';
import { useEffect } from 'react';
import { initAOS } from './utils/animations';
import AutoLogoffWarning from './components/AutoLogoffWarning';
import 'nprogress/nprogress.css';
import './styles/nprogress-override.css';
import './styles/accessibility.css';
import './styles/themes.css';
import './styles/touch.css';
import './styles/symbol-fixes.css';
import './styles/animations.css';
import './styles/color-system.css';
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
import ContinuityBridge from './pages/ContinuityBridge';
import MemoryVault from './pages/MemoryVault';
import LegacySetup from './pages/LegacySetup';
import HeirManagement from './pages/HeirManagement';
import LegacyContentCreator from './pages/LegacyContentCreator';
import MyLegacyAccess from './pages/MyLegacyAccess';
import AnimationDemoSimple from './pages/AnimationDemoSimple';
import Journal from './pages/Journal';
import PersonalisationQuest from './pages/PersonalisationQuest';
import PatientPortal from './pages/PatientPortal';
import WellnessCheckin from './pages/WellnessCheckin';
import AdminUserManagement from './pages/AdminUserManagement';
import AuditLog from './pages/AuditLog';
import HIPAACompliance from './pages/HIPAACompliance';
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

// One-time: migrate old dismiss keys so avatar shows for returning users
if (localStorage.getItem('aura_dismissed') === 'true' || localStorage.getItem('aura_v2_dismissed') === 'true') {
  localStorage.removeItem('aura_dismissed');
  localStorage.removeItem('aura_v2_dismissed');
  // Don't set v3 - let avatar show fresh
}

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

function AppRoutes() {
  const { isAuthenticated, logout } = useAuth();
  const { showAiWidgets } = useAppSettings();
  const location = useLocation();
  
  // Initialize voice control hook
  useVoiceControl();
  
  // Initialize touch support (haptics + sounds)
  useTouchSupport();

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
                    <Route path="/continuity-bridge" element={<ContinuityBridge />} />
                    <Route path="/memory-vault" element={<MemoryVault />} />
                    <Route path="/legacy-setup" element={<LegacySetup />} />
                    <Route path="/heir-management" element={<HeirManagement />} />
                    <Route path="/legacy-content" element={<LegacyContentCreator />} />
                    <Route path="/my-legacy-access" element={<MyLegacyAccess />} />
                    <Route path="/journal" element={<Journal />} />
                    <Route path="/community" element={<CommunityHub />} />
                    <Route path="/community/:groupId" element={<CommunityGroupPage />} />
                    <Route path="/community-hub" element={<CommunityHub />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/my-journey" element={<MyJourney />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/notification-tester" element={<NotificationTester />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/touch-demo" element={<TouchDemo />} />
                    <Route path="/admin/users" element={<AdminUserManagement />} />
                    <Route path="/admin/audit" element={<AuditLog />} />
                    <Route path="/admin/hipaa-compliance" element={<HIPAACompliance />} />
                    <Route path="/admin/model-bias-report" element={<ModelBiasReportPage />} />
                    <Route path="/medical-knowledge" element={<MedicalKnowledge />} />
                    <Route path="/care-settings" element={<CareSettings />} />
                    <Route path="/shift-handover" element={<ShiftHandover />} />
                    <Route path="/daily-care-log" element={<DailyCareLog />} />
                    <Route path="/pre-clinic" element={<PreClinicChecklist />} />
                    <Route path="/residential-log" element={<ResidentialLog />} />
                    <Route path="/bereavement-support" element={<BereavedFamilyDashboard />} />
                    {/* Dev-only pages  --  hidden from nav but reachable if needed */}
                    <Route path="/notification-tester" element={<NotificationTester />} />
                    <Route path="/touch-demo" element={<TouchDemo />} />
                    <Route path="/animation-demo" element={<AnimationDemoSimple />} />
                  </Routes>
                </Layout>
                {/* AI widgets - draggable, visible on every page unless disabled in Settings → AI Tools */}
                {showAiWidgets && (
                  <>
                    <AuraChat />
                    <AIAssistant />
                  </>
                )}
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
      
      {/* React Hot Toast - patient-facing notifications */}
      <Toaster
        position="top-right"
        gutter={6}
        containerStyle={{ top: 72, right: 16 }}
        toastOptions={{
          duration: 4000,
          style: {
            padding: 0,
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            maxWidth: '320px',
          },
        }}
      />
      {/* Sonner - clinical stacking alerts (never shows PHI) */}
      <SonnerToaster
        position="top-right"
        toastOptions={{
          style: {
            background:   '#ffffff',
            border:       '1px solid rgba(0,0,0,0.08)',
            borderRadius: '10px',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
            padding:      '11px 14px',
            fontSize:     '13px',
            fontWeight:   '500',
            color:        '#1e293b',
            maxWidth:     '360px',
          },
        }}
        richColors
        closeButton
        expand={false}
        visibleToasts={5}
        gap={8}
      />
    </>
  );
}

export default function App() {
  // Initialize AOS (Animate On Scroll) for scroll animations
  useEffect(() => {
    initAOS();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AccessibilityProvider>
          <AppSettingsProvider>
            <CareSettingProvider>
              <BrowserRouter>
                <TooltipProvider>
                  <AppRoutes />
                </TooltipProvider>
              </BrowserRouter>
            </CareSettingProvider>
          </AppSettingsProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
