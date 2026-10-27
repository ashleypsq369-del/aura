import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, ChevronRight, X, Loader2, LogOut, Settings, User, 
  Moon, Sun, Shield, HelpCircle, PanelLeftClose, PanelLeftOpen,
  MessageCircle, Stethoscope,
} from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import useVoiceControl from '../../hooks/useVoiceControl';
import RealTimeAlerts from '../RealTimeAlerts';
import NotificationCenter from '../NotificationCenter';
import OfflineIndicator from '../OfflineIndicator';
import SignOutModal from '../SignOutModal';
import VoiceCommandOverlay from '../VoiceCommandOverlay';
import HintTooltip from '../HintTooltip';
import DropdownMenu from '../ui/DropdownMenu';
import AvatarDisplay from '../avatar/AvatarDisplay';
import AvatarModal from '../avatar/AvatarModal';
import TaskStatusBar from '../TaskStatusBar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const { isLoggingOut, user, logout } = useAuth();
  const { settings: a11ySettings, disableAssistedMode } = useAccessibility();
  const { theme, updateTheme, sidebarSettings, updateSidebarSetting } = useAppSettings();
  useVoiceControl(); // Activates voice control globally when the setting is enabled
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // Map route → page color class for background tinting
  const getPageClass = () => {
    const p = location.pathname;
    if (p === '/' || p === '/dashboard')       return 'page-tint-dashboard';
    if (p.startsWith('/patients'))             return 'page-tint-patients';
    if (p.startsWith('/alerts'))               return 'page-tint-alerts';
    if (p.startsWith('/ai-insights'))          return 'page-tint-clinical';
    if (p.startsWith('/medications'))          return 'page-tint-clinical';
    if (p.startsWith('/appointments'))         return 'page-tint-patients';
    if (p.startsWith('/caregivers'))           return 'page-tint-patient';
    if (p.startsWith('/community'))            return 'page-tint-community';
    if (p.startsWith('/resources'))            return 'page-tint-resources';
    if (p.startsWith('/my-journey') || p.startsWith('/memory-vault')) return 'page-tint-journey';
    if (p.startsWith('/my-space') || p.startsWith('/wellness'))        return 'page-tint-patient';
    return '';
  };


  // Generate breadcrumbs based on current path
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const getBreadcrumbName = (path) => {
    const mappings = {
      'dashboard': 'Overview',
      'patients': 'Patients',
      'patient': 'Patient',
      'ai-insights': 'AI Insights',
      'alerts': 'Alerts',
      'medications': 'Medications',
      'appointments': 'Appointments',
      'caregivers': 'Caregivers',
      'care-guide': 'Care Guide',
      'continuity-bridge': 'Continuity Bridge',
      'journal': 'My Journal',
      'memory-vault': 'Memory Vault',
      'my-space': 'My Space',
      'my-journey': 'My Journey Map',
      'community': 'Community Hub',
      'resources': 'Resource Library',
      'profile': 'My Profile',
      'admin': 'Administration',
      'users': 'User Management',
      'audit': 'Audit Log',
      'hipaa-compliance': 'HIPAA Compliance',
      'model-bias-report': 'Model Bias Report',
      'setup': 'Personalisation',
      'assessments': 'Assessments',
      'esas': 'ESAS Assessment',
      'pps': 'PPS Assessment',
      'mental-health': 'Mental Health',
      'barthel': 'Barthel Index',
      'cognitive': 'Cognitive Assessment',
      'pain': 'Pain Inventory',
      'qol': 'Quality of Life',
      'caregiver-burden': 'Caregiver Burden',
      'motor-skills': 'Motor Skills',
      'vitals': 'Vitals',
      'symptoms': 'Symptoms',
      'care-plan': 'Care Plan',
      'wellbeing': 'Wellbeing',
      'legacy-setup': 'Legacy Setup',
      'heir-management': 'Manage Heirs',
      'legacy-content': 'Legacy Content',
      'my-legacy-access': 'My Legacy',
      'bereavement-support': 'Bereavement Support',
      'messages': 'Messages',
      'medical-knowledge': 'Medical Knowledge',
      'notifications': 'Notifications',
      'settings': 'Settings',
    };
    // If it's a numeric ID, skip it (show nothing) or show 'Detail'
    if (/^\d+$/.test(path)) return null;
    return mappings[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="flex h-screen overflow-hidden text-[#2C3531]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onOpenAura={() => window.dispatchEvent(new CustomEvent('aura:open'))} />

      {/* Main Content Area - scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Professional Top Header Bar */}
        <header 
          role="banner"
          className="sticky top-0 z-30 px-4 flex items-center justify-between h-[60px] gap-2 header-gradient"
        >
          {/* Left: hamburger + breadcrumbs — allowed to shrink */}
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center flex-shrink-0 text-white hover:bg-white/20 rounded-lg transition-all"
              aria-label="Toggle Sidebar"
              data-tip="Open menu"
              data-tip-below=""
            >
              {sidebarOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
            </button>

            {/* Desktop sidebar toggle - show/hide sidebar */}
            <button
              onClick={() => updateSidebarSetting('desktopVisible', !sidebarSettings.desktopVisible)}
              className="hidden lg:flex w-9 h-9 items-center justify-center flex-shrink-0 text-white hover:bg-white/20 rounded-lg transition-all"
              aria-label={sidebarSettings.desktopVisible ? 'Hide sidebar' : 'Show sidebar'}
              data-tip={sidebarSettings.desktopVisible ? 'Hide sidebar' : 'Show sidebar'}
              data-tip-below=""
            >
              {sidebarSettings.desktopVisible
                ? <PanelLeftClose size={18} strokeWidth={2} />
                : <PanelLeftOpen size={18} strokeWidth={2} />
              }
            </button>

            {/* Logo visible on small screens when sidebar is hidden */}
            <div className="lg:hidden flex items-center gap-2">
              <img src="/logo.png" alt="Project Aura" className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-none" style={{ color: '#ffffff' }}>Project Aura</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Healthcare</span>
              </div>
            </div>

            {/* Breadcrumbs for desktop */}
            <nav 
              aria-label="Breadcrumb navigation"
              id="main-nav"
              className="hidden md:flex items-center space-x-1.5 text-xs font-semibold"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              <Link to={user?.role === 'patient' ? '/my-space' : '/dashboard'}
                className="hover:bg-white/20 transition-colors px-2 py-1 rounded-md"
                style={{ color: 'rgba(255,255,255,0.9)' }}>
                Home
              </Link>
              {pathnames.map((value, index) => {
                const label = getBreadcrumbName(value);
                if (!label) return null;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                return (
                  <div key={to} className="flex items-center space-x-1.5">
                    <ChevronRight size={14} strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.45)' }} />
                    {isLast ? (
                      <span className="font-bold px-2 py-1 rounded-md bg-white/20" style={{ color: '#ffffff' }}>{label}</span>
                    ) : (
                      <Link to={to} className="hover:bg-white/20 transition-colors px-2 py-1 rounded-md" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* User Section - Right Side — sm sizes hidden on xs to prevent overflow */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {/* Dark mode quick toggle — hidden on xs */}
            <button
              onClick={() => updateTheme(isDark ? 'light' : 'dark')}
              className="hidden sm:flex w-8 h-8 items-center justify-center flex-shrink-0 rounded-lg hover:bg-white/20 transition-all"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={16} className="text-yellow-300" /> : <Moon size={16} className="text-white/80" />}
            </button>

            {/* Aura Companion — hidden on xs */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('aura:open'))}
              className="hidden sm:flex w-8 h-8 items-center justify-center flex-shrink-0 rounded-lg hover:bg-white/20 transition-all"
              aria-label="Open Aura care companion"
              title="Aura — Care Companion"
            >
              <MessageCircle size={16} className="text-white/80" strokeWidth={2}/>
            </button>

            {/* Aura Copilot — clinical roles only, hidden on mobile */}
            {user?.role && ['admin', 'clinician', 'caregiver'].includes(user.role) && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('aura:copilot-open'))}
                className="hidden md:flex w-8 h-8 items-center justify-center flex-shrink-0 rounded-lg hover:bg-white/20 transition-all"
                aria-label="Open Aura clinical copilot"
                title="Aura Copilot — Clinical Assistant"
              >
                <Stethoscope size={16} className="text-white/80" strokeWidth={2}/>
              </button>
            )}

            {/* Notification Center */}
            <NotificationCenter />

            {/* Task status pill — sits neatly between notifications and alerts */}
            {user && (
              <div className="hidden sm:flex items-center">
                <TaskStatusBar compact />
              </div>
            )}

            {/* Real-Time Alerts - clinical staff only */}
            {user?.role && ['admin', 'clinician', 'caregiver'].includes(user.role) && (
              <RealTimeAlerts />
            )}
            
            {/* Profile Avatar - Radix DropdownMenu (WAI-ARIA compliant) */}
            <DropdownMenu
              align="end"
              trigger={
                <button
                  className="flex items-center gap-1.5 px-1.5 sm:px-2 h-9 text-sm font-semibold hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
                  style={{ color: '#ffffff' }}
                  aria-label="Profile and settings menu"
                  data-tip="Profile & settings"
                  data-tip-below=""
                  data-tip-right=""
                >
                  <AvatarDisplay
                    size={28}
                    showRing
                    onClick={undefined}
                  />
                  <span className="hidden md:inline">{user?.full_name?.split(' ')[0] || 'User'}</span>
                  <Settings size={14} strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.75)' }} />
                </button>
              }
              items={[
                { type: 'label', label: `${user?.full_name || 'User'} · ${user?.role?.toUpperCase()}` },
                { type: 'separator' },
                { label: 'My Avatar',         icon: User,       desc: 'Customise your avatar',          onClick: () => setShowAvatarBuilder(true) },
                { label: 'My Profile',        icon: User,       desc: 'View and edit profile',          onClick: () => navigate('/profile') },
                { label: 'Settings',          icon: Settings,   desc: 'App preferences & accessibility', onClick: () => navigate('/settings') },
                { label: isDark ? 'Light Mode' : 'Dark Mode', icon: isDark ? Sun : Moon, desc: isDark ? 'Switch to light theme' : 'Switch to dark theme', onClick: () => updateTheme(isDark ? 'light' : 'dark') },
                { type: 'separator' },
                { label: 'Help & Resources',  icon: HelpCircle, desc: 'Get support and guidance',        onClick: () => navigate('/resources') },
                ...(user?.role === 'admin' ? [{ label: 'Admin Panel', icon: Shield, desc: 'Manage users and system', onClick: () => navigate('/admin/users') }] : []),
                { type: 'separator' },
                { label: 'Sign Out',          icon: LogOut,     variant: 'danger',                       onClick: () => setShowSignOutModal(true) },
              ]}
            />
          </div>
        </header>

        {/* Breadcrumbs for Mobile View */}
        <div 
          className="md:hidden px-4 py-2 text-[10px] text-white/90 flex items-center space-x-1.5 overflow-x-auto whitespace-nowrap font-semibold border-b border-teal-700/30"
          style={{ background: '#0f766e' }}
        >
          <Link to={user?.role === 'patient' ? '/my-space' : '/dashboard'} className="hover:text-white px-1.5 py-0.5 rounded-md hover:bg-white/20">Home</Link>
          {pathnames.map((value, index) => {
            const label = getBreadcrumbName(value);
            if (!label) return null;  // skip numeric IDs — fixes "Home > Patients > —" bug
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            return (
              <div key={to} className="flex items-center space-x-1.5">
                <ChevronRight size={10} className="text-white/50" strokeWidth={3} />
                {isLast ? (
                  <span className="text-white font-bold px-1.5 py-0.5 rounded-md bg-white/20">{label}</span>
                ) : (
                  <Link to={to} className="hover:text-white px-1.5 py-0.5 rounded-md hover:bg-white/20 text-white/80">{label}</Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Professional Content Area */}
        <main 
          role="main"
          id="main-content"
          aria-label="Main content"
          className={`flex-1 overflow-y-auto relative flex flex-col ${getPageClass()}`}
          style={{ scrollbarWidth: 'thin' }}
        >          {/* Assisted Mode Banner - shown when assisted mode is active */}
          {a11ySettings.assistedMode && (
            <div className="assisted-mode-banner sticky top-0 z-20 bg-gradient-to-r from-violet-600 to-purple-700 text-white px-6 py-2.5 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <div>
                  <span className="font-bold text-sm">Assisted Mode active</span>
                  <span className="text-purple-200 text-xs ml-2">- large text & buttons enabled</span>
                </div>
              </div>
              <button
                onClick={disableAssistedMode}
                className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1 rounded-lg text-xs border border-white/30 transition-all"
              >
                Turn Off
              </button>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full min-h-full flex flex-col"
          >
            <div className="flex-1">
              {children}
            </div>
            {/* Copyright footer — in document flow, never overlaps content */}
            <footer className="w-full text-center py-2 px-4 select-none pointer-events-none" aria-hidden="true">
              <p className="text-[10px] text-gray-400/50">
                © {new Date().getFullYear()} Project Aura · Group 31 · All rights reserved · For academic &amp; demonstration use only
              </p>
            </footer>
          </motion.div>
        </main>
      </div>

      {/* Logout Overlay State */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2C3531]/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#f0f6fa] rounded-2xl shadow-xl max-w-sm w-full p-8 text-center border border-[#EAEAE8]"
            >
              <Loader2 className="w-12 h-12 text-teal-800 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-[#2C3531] mb-2">Signing Out</h3>
              <p className="text-sm text-[#8E8D8A]">Logging you out safely. Have a peaceful day.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Voice Command Overlay — shows mic status + command feedback */}
      <VoiceCommandOverlay />

      {/* Avatar Builder Modal */}
      <AvatarModal
        isOpen={showAvatarBuilder}
        onClose={() => setShowAvatarBuilder(false)}
        onSave={(config) => {
          window.dispatchEvent(new CustomEvent('avatar_updated'));
          setShowAvatarBuilder(false);
        }}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={() => {
          setShowSignOutModal(false);
          logout();
        }}
      />


    </div>
  );
}
