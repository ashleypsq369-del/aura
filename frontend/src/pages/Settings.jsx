import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  User, Bell, Palette, Globe, Eye, Shield, Brain,
  Download, Trash2, ChevronRight, Check, Sun, Moon,
  Type, Zap, Volume2, MousePointer, MessageSquare,
  Hand, Activity, Heart, RotateCcw, Info, Smile,
  PanelLeft, PanelLeftClose, PanelLeftOpen, AlignJustify,
  Sparkles, LayoutGrid, Stethoscope, Briefcase, Users,
  Smartphone, Loader2, Keyboard, BookOpen,
} from 'lucide-react';
import Switch from '../components/ui/Switch';
import { useAuth } from '../context/AuthContext';
import usePushNotifications from '../hooks/usePushNotifications';
import useInstallPrompt from '../hooks/useInstallPrompt';
import toast from '../utils/toast';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAppSettings } from '../context/AppSettingsContext';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import AvatarModal from '../components/avatar/AvatarModal';
import { ROLE_PRESETS } from '../components/avatar/avatarParts';
import { useRestartTour } from '../components/AuraOnboarding';
import FeatureRequestPanel from '../components/FeatureRequestPanel';
import { useUIProfile, UI_PROFILE_META } from '../context/UIProfileContext';
import FamilyConsentSettings from './FamilyConsentSettings';

// Toggle is now the Radix Switch component imported above
function Toggle({ on, onToggle, color = '#0d9488' }) {
  return <Switch checked={on} onCheckedChange={onToggle} color={color} />;
}

// -- Reusable row -------------------------------------------------------------
function Row({ icon: Icon, iconColor = '#0d9488', iconBg = '#f0fdfa', label, desc, right, border = true }) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 ${border ? 'border-b border-gray-100' : ''}`}>
      {Icon && (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}>
          <Icon size={17} color={iconColor} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

// -- Section wrapper ----------------------------------------------------------
function Section({ title, children }) {
  return (
    <div className="mb-6">
      {title && (
        <p className="text-xs font-semibold text-gray-400  px-1 mb-2">{title}</p>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

// -- Main Settings page -------------------------------------------------------
export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const push = usePushNotifications();
  const pwa  = useInstallPrompt();
  const restartTour = useRestartTour();
  const { profileKey, profile: uiProfile } = useUIProfile();
  const {
    settings: a11y, updateSetting, resetSettings,
    enableAssistedMode, disableAssistedMode, applyPreset,
  } = useAccessibility();
  const {
    theme, language, notifications, chatbotSettings,
    assistantSettings, showAiWidgets,
    updateTheme, updateLanguage, updateNotifications,
    updateChatbotSetting, updateAssistantSetting, toggleAiWidgets,
    sidebarSettings, updateSidebarSetting,
    featureSettings, updateFeature,
  } = useAppSettings();

  const [tab, setTab] = useState('profile');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Auto-switch to tab passed via navigation state (e.g. from PatientPortal)
  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.state?.tab]);

  const tabs = [
    { id: 'profile',       label: 'Profile',        icon: User,    tip: 'Your account and data settings' },
    { id: 'avatar',        label: 'My Avatar',      icon: Smile,   tip: 'Customise your personal avatar' },
    { id: 'appearance',    label: 'Appearance',     icon: Palette, tip: 'Theme, language and sidebar layout' },
    { id: 'accessibility', label: 'Accessibility',  icon: Eye,     tip: 'Vision, motion and assistive tech' },
    { id: 'ai',            label: 'AI & Features',  icon: Brain,   tip: 'AI tools, optional features and notifications' },
    ...(user?.role === 'patient' ? [
      { id: 'privacy', label: 'Family Sharing', icon: Shield, tip: 'Control what your family can see' }
    ] : []),
  ];

  const getRoleStyle = (role) => ({
    patient:   { bg: '#eff6ff', color: '#1d4ed8' },
    clinician: { bg: '#f0fdf4', color: '#15803d' },
    family:    { bg: '#faf5ff', color: '#7e22ce' },
    caregiver: { bg: '#fff7ed', color: '#c2410c' },
    admin:     { bg: '#fef2f2', color: '#dc2626' },
  }[role] || { bg: '#f9fafb', color: '#374151' });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ theme, language, notifications, accessibility: a11y }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `projectaura-settings-${Date.now()}.json`; a.click();
  };

  const handleClear = () => {
    if (window.confirm('Clear all app data? This cannot be undone.')) {
      [
        'chatbot_conversations','chatbot_notifications','chatbot_sound',
        'assistant_notifications','assistant_sound','assistant_thinking_process',
        'assistant_auto_navigate','feature_settings','accessibility_settings',
        'app_theme','app_language','app_notifications','show_ai_widgets',
        'sidebar_desktop_visible','sidebar_default_state','sidebar_show_labels',
        'user_avatar','aura_tour_done_clinician_v3','aura_tour_done_patient_v3',
        'aura_tour_done_caregiver_v3','aura_tour_done_admin_v3',
      ].forEach(k => localStorage.removeItem(k));
      toast.success('All app data cleared');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const presets = [
    { id: 'dementia',  Icon: Brain,    label: 'Dementia',             desc: 'Largest text, voice prompts, big buttons', color: '#7c3aed', bg: '#f5f3ff', s: { fontSize:'xxlarge', largeTouch:true, reducedMotion:true, voiceControl:true } },
    { id: 'parkinsons',Icon: Hand,     label: "Parkinson's",          desc: 'Extra-large tap targets, voice input',     color: '#1d4ed8', bg: '#eff6ff', s: { fontSize:'xlarge',  largeTouch:true, reducedMotion:true, voiceControl:true } },
    { id: 'low_vision',Icon: Eye,      label: 'Low Vision',           desc: 'Max text, high contrast, screen reader',  color: '#b45309', bg: '#fffbeb', s: { fontSize:'xxlarge', largeTouch:true, highContrast:true, screenReaderMode:true } },
    { id: 'stroke',    Icon: Activity, label: 'Stroke / Hemiplegia',  desc: 'Large zones, one-handed friendly',         color: '#c2410c', bg: '#fff7ed', s: { fontSize:'xlarge',  largeTouch:true, reducedMotion:true } },
    { id: 'fatigue',   Icon: Heart,    label: 'Severe Fatigue',       desc: 'Calm layout, no time pressure',            color: '#15803d', bg: '#f0fdf4', s: { fontSize:'large',   largeTouch:true, reducedMotion:true } },
    { id: 'anxiety',   Icon: Zap,      label: 'Anxiety / PTSD',       desc: 'Reduced motion, gentle layout',            color: '#0f766e', bg: '#f0fdfa', s: { reducedMotion:true } },
  ];

  return (
    <div className="min-h-screen px-3 sm:p-6 py-4">
      <div className="max-w-5xl mx-auto">

      {/* -- Page header - same compact style as Resources page ------- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl p-4 shadow-md border border-slate-200 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Shield size={20} style={{ color: '#ffffff' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold font-serif" style={{ color: '#ffffff' }}>Settings</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Manage your account, appearance and preferences</p>
        </div>
      </motion.div>

        {/* -- Tab bar ---------------------------------------------------- */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon, tip }, i) => {
              const tabColors = [
                '#0d9488','#db2777','#7c3aed','#1d4ed8','#d97706','#059669','#0891b2','#4338ca'
              ];
              const c = tabColors[i % tabColors.length];
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  data-tip={tip}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all min-w-[80px] ${
                    tab === id
                      ? 'border-b-[3px] bg-opacity-5'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                  style={tab === id
                    ? { borderBottomColor: c, color: c, backgroundColor: `${c}0f` }
                    : {}}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >

            {/* -- PROFILE - account details + data/advanced ----------- */}
            {tab === 'profile' && (
              <>
                <Section>
                  <div className="px-4 py-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {user?.full_name?.split(' ').slice(0,2).map(n=>n[0]).join('') || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{user?.full_name || 'User'}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: getRoleStyle(user?.role).bg, color: getRoleStyle(user?.role).color }}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </Section>
                <Section title="Account Details">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                  {[
                    { label: 'Username', value: user?.username },
                    { label: 'Phone',    value: user?.phone || 'Not set' },
                    { label: 'User ID',  value: `#${user?.id}` },
                    { label: 'Role',     value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 sm:odd:border-r">
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <a href="/profile"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors shadow-sm">
                      <User size={15} /> Edit Profile &amp; Change Password
                    </a>
                  </div>
                </Section>
                <Section title="Data">
                  <button onClick={handleExport}
                    data-tip="Download your current settings as a JSON file"
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                      <Download size={16} className="text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Export Settings</p>
                      <p className="text-xs text-gray-500">Download your settings as JSON</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                  <button onClick={handleClear}
                    data-tip="Permanently remove all locally stored app data (cannot be undone)"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <Trash2 size={16} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600">Clear All Data</p>
                      <p className="text-xs text-gray-500">Remove all app data permanently</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                </Section>
                <Section title="App Info">
                  {[
                    { label: 'Version',     value: '2.0.0' },
                    { label: 'Build',       value: 'Production' },
                    { label: 'Environment', value: 'Healthcare' },
                  ].map(({ label, value }, i, arr) => (
                    <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length-1 ? 'border-b border-gray-100' : ''}`}>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{value}</p>
                    </div>
                  ))}
                  {/* Restart App Tour */}
                  <div className="border-t border-gray-100">
                    <button onClick={() => { restartTour(); toast.success('Tour restarted — follow Aura\'s guide!'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition-colors text-left">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                        <RotateCcw size={16} className="text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-teal-700">Restart App Tour</p>
                        <p className="text-xs text-gray-500">Walk through all pages with Aura's guided tour again</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  </div>
                  {/* PWA Install */}
                  {pwa.canInstall && (
                    <div className="border-t border-gray-100">
                      <button onClick={() => { pwa.install(); toast.success('Opening install prompt…'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <Smartphone size={16} className="text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-teal-700">Install App</p>
                          <p className="text-xs text-gray-500">Add Project Aura to your home screen for offline use</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    </div>
                  )}
                </Section>
              </>
            )}

            {/* -- AVATAR - full builder ------------------------------- */}
            {tab === 'avatar' && (
              <>
                <Section title="Your Avatar">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-shrink-0">
                      <AvatarDisplay size={90} showRing />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 mb-1">Personalise your avatar</p>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        Choose your skin tone, hair, eyes, outfit and more. Your avatar appears in the app header, profile page and chat.
                      </p>
                      <button
                        onClick={() => setShowAvatarModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                      >
                        <Smile size={16} />
                        Open Avatar Builder
                      </button>
                    </div>
                  </div>
                </Section>

                <Section title="Role Presets">
                  <p className="text-xs text-slate-500 px-5 py-3 border-b border-slate-100">
                    Quick-start with a pre-designed avatar based on role, age group or style.
                  </p>
                  {[
                    { role: 'clinician', Icon: Stethoscope, label: 'Doctor / Clinician', desc: 'Professional scrubs, short hair' },
                    { role: 'caregiver', Icon: Heart,        label: 'Nurse / Caregiver', desc: 'Caring, approachable look' },
                    { role: 'patient',   Icon: User,         label: 'Patient',            desc: 'Comfortable, relaxed style' },
                    { role: 'family',    Icon: Users,        label: 'Family Member',      desc: 'Warm casual look' },
                    { role: 'admin',     Icon: Briefcase,    label: 'Administrator',      desc: 'Smart business attire' },
                  ].map(({ role, Icon: RoleIcon, label, desc }) => (
                    <button key={role}
                      onClick={() => {
                        const preset = { ...(ROLE_PRESETS[role] || ROLE_PRESETS.patient), role };
                        localStorage.setItem('user_avatar', JSON.stringify(preset));
                        window.dispatchEvent(new CustomEvent('avatar_updated'));
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 border-b border-slate-100 hover:bg-teal-50 transition-colors text-left">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <RoleIcon size={16} className="text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </button>
                  ))}
                </Section>

                <Section title="About Your Avatar">
                  <div className="px-5 py-4 space-y-2">
                    <p className="text-xs text-slate-500 leading-relaxed">Your avatar is stored locally on your device and is only visible to you. It replaces the initials circle in the app header and your profile page.</p>
                    <button
                      onClick={() => { localStorage.removeItem('user_avatar'); window.dispatchEvent(new CustomEvent('avatar_updated')); }}
                      className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors mt-2"
                    >
                      <RotateCcw size={12} /> Reset to default
                    </button>
                  </div>
                </Section>

                <AvatarModal
                  isOpen={showAvatarModal}
                  onClose={() => setShowAvatarModal(false)}
                  onSave={() => {
                    window.dispatchEvent(new CustomEvent('avatar_updated'));
                    setShowAvatarModal(false);
                  }}
                />
              </>
            )}

            {/* -- APPEARANCE - theme + language + sidebar ---------------- */}
            {tab === 'appearance' && (
              <>
                <Section title="Theme">
                  {[
                    { id: 'light', label: 'Light', icon: Sun,  desc: 'Clean bright interface' },
                    { id: 'dark',  label: 'Dark',  icon: Moon, desc: 'Easy on the eyes at night' },
                    { id: 'auto',  label: 'Auto',  icon: Zap,  desc: 'Follows your device setting' },
                  ].map(({ id, label, icon: Icon, desc }, i, arr) => (
                    <button key={id} onClick={() => updateTheme(id)} data-tip={desc}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${i < arr.length-1 ? 'border-b border-gray-100' : ''} ${theme === id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme===id ? 'bg-teal-100' : 'bg-gray-100'}`}>
                        <Icon size={15} className={theme===id ? 'text-teal-700' : 'text-gray-500'} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${theme===id ? 'text-teal-700' : 'text-gray-900'}`}>{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      {theme === id && <Check size={16} className="text-teal-600 flex-shrink-0" />}
                    </button>
                  ))}
                </Section>
                {/* ── UI Adaptation Profile ── */}
                <Section title="Interface Adaptation Profile">
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="ui-profile-badge">
                        Active: {uiProfile?.label || 'Standard'}
                      </span>
                      <span className="text-xs text-gray-400">{uiProfile?.description}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Your interface adapts automatically based on your questionnaire answers — age group, vision, cognitive needs, and activity level. You can also override it manually here.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(UI_PROFILE_META).map(([key, meta]) => (
                        <button
                          key={key}
                          onClick={() => {
                            localStorage.setItem('ui_profile', key);
                            const html = document.documentElement;
                            html.setAttribute('data-ui-profile', meta.htmlAttr);
                            Object.values(UI_PROFILE_META).forEach(p => { if (p.bodyClass) html.classList.remove(p.bodyClass); });
                            if (meta.bodyClass) html.classList.add(meta.bodyClass);
                            if (meta.reducedMotion) html.classList.add('reduce-motion');
                            if (meta.highContrast) html.classList.add('high-contrast');
                            toast.success(`Interface switched to ${meta.label}`);
                            window.location.reload();
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            profileKey === key
                              ? 'border-teal-500 bg-teal-50 text-teal-800'
                              : 'border-slate-200 hover:border-slate-300 bg-[#f0f6fa] text-slate-700'
                          }`}
                        >
                          <p className={`text-xs font-bold ${profileKey === key ? 'text-teal-700' : 'text-slate-700'}`}>
                            {meta.label}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{meta.description}</p>
                          {profileKey === key && (
                            <span className="mt-1 inline-block text-[9px] font-bold text-teal-600 uppercase tracking-wide">Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-start gap-1">
                      <Info size={11} className="flex-shrink-0 mt-0.5" />
                      Switching profile applies larger text, adjusted touch targets, and layout changes immediately. Based on W3C WCAG 2.2 and COGA guidelines.
                    </p>
                  </div>
                </Section>
                <Section title="Language">
                  <Row icon={Globe} iconColor="#6b7280" iconBg="#f3f4f6"
                    label="Language" desc="Sets the app's language attribute and text direction" border={false}
                    right={
                      <select value={language} onChange={e => { updateLanguage(e.target.value); toast.success('Language preference saved'); }}
                        className="text-sm text-gray-700 bg-transparent border-none outline-none cursor-pointer font-medium">
                        <optgroup label="International">
                          <option value="en">English</option>
                          <option value="fr">Français (French)</option>
                        </optgroup>
                        <optgroup label="Ghanaian Languages">
                          <option value="tw">Twi (Akan)</option>
                          <option value="gaa">Ga</option>
                          <option value="ee">Ewe</option>
                          <option value="dag">Dagbani</option>
                          <option value="ha">Hausa</option>
                          <option value="nzi">Nzema</option>
                        </optgroup>
                      </select>
                    }
                  />
                </Section>
                <Section title="Sidebar">
                  <Row icon={sidebarSettings.desktopVisible ? PanelLeftClose : PanelLeftOpen}
                    iconColor="#0f766e" iconBg="#f0fdfa"
                    label="Show Sidebar on Desktop"
                    desc="Use the panel icon in the header or toggle here"
                    right={<Toggle on={sidebarSettings.desktopVisible} onToggle={() => updateSidebarSetting('desktopVisible', !sidebarSettings.desktopVisible)} />}
                  />
                  {[
                    { id:'icons',    label:'Icons only',      desc:'Compact - expands on hover',           icon: PanelLeft },
                    { id:'expanded', label:'Always expanded',  desc:'Full labels pinned open',               icon: AlignJustify },
                  ].map(({ id, label, desc, icon: Icon }, i, arr) => (
                    <button key={id} onClick={() => updateSidebarSetting('defaultState', id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i < arr.length-1 ? 'border-b border-gray-100' : ''} ${sidebarSettings.defaultState === id ? 'bg-teal-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sidebarSettings.defaultState === id ? 'bg-teal-100' : 'bg-gray-100'}`}>
                        <Icon size={15} className={sidebarSettings.defaultState === id ? 'text-teal-700' : 'text-gray-500'} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${sidebarSettings.defaultState === id ? 'text-teal-700' : 'text-gray-900'}`}>{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      {sidebarSettings.defaultState === id && <Check size={16} className="text-teal-600 flex-shrink-0" />}
                    </button>
                  ))}
                  <Row icon={Eye} iconColor="#6b7280" iconBg="#f3f4f6"
                    label="Show Labels on Hover" desc="Show item name tooltip when sidebar is collapsed" border={false}
                    right={<Toggle on={sidebarSettings.showLabels} onToggle={() => updateSidebarSetting('showLabels', !sidebarSettings.showLabels)} />}
                  />
                </Section>
              </>
            )}
            {/* -- AI & FEATURES - AI tools + optional features + notifications -- */}
            {tab === 'ai' && (
              <>
                <Section title="AI Widgets">
                  <Row icon={Brain} iconColor="#7c3aed" iconBg="#f5f3ff"
                    label="Show AI Widgets" desc="Floating Aura Chat and AI Assistant on every page" border={false}
                    right={<Toggle on={showAiWidgets} onToggle={toggleAiWidgets} color="#7c3aed" />} />
                </Section>
                <Section title="Aura Chat">
                  <Row icon={MessageSquare} iconColor="#0284c7" iconBg="#f0f9ff"
                    label="Notifications" desc="Get notified of new messages"
                    right={<Toggle on={chatbotSettings.notifications} onToggle={() => updateChatbotSetting('notifications', !chatbotSettings.notifications)} color="#0284c7" />} />
                  <Row icon={Volume2} iconColor="#0284c7" iconBg="#f0f9ff"
                    label="Sound Effects" desc="Play sounds for messages" border={false}
                    right={<Toggle on={chatbotSettings.sound} onToggle={() => updateChatbotSetting('sound', !chatbotSettings.sound)} color="#0284c7" />} />
                </Section>
                <Section title="AI Assistant">
                  {[
                    { key:'notifications',   label:'Notifications',       desc:'Get notified of responses' },
                    { key:'sound',           label:'Sound Effects',        desc:'Play sounds for alerts' },
                    { key:'thinkingProcess', label:'Show Thinking Steps',  desc:'Display AI reasoning process' },
                    { key:'autoNavigate',    label:'Auto-Navigate',        desc:'Automatically go to suggested pages' },
                  ].map(({ key, label, desc }, i, arr) => (
                    <Row key={key} icon={Brain} iconColor="#0d9488" iconBg="#f0fdfa"
                      label={label} desc={desc} border={i < arr.length-1}
                      right={<Toggle on={assistantSettings[key]} onToggle={() => updateAssistantSetting(key, !assistantSettings[key])} />} />
                  ))}
                </Section>
                <Section title="Notifications">
                  <Row icon={Bell} iconColor="#0d9488" iconBg="#f0fdfa"
                    label="All Notifications" desc="Master switch for all in-app notifications" border={false}
                    right={<Toggle on={notifications} onToggle={() => updateNotifications(!notifications)} />} />
                </Section>

                {/* ── Push Notifications ── */}
                <Section title="Device Push Notifications">
                  {!push.supported ? (
                    <div className="px-4 py-3 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      Your browser does not support push notifications. Try Chrome, Edge, or Firefox.
                    </div>
                  ) : push.permission === 'denied' ? (
                    <div className="px-4 py-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
                      Notifications blocked. Go to your browser settings → Site Settings → Notifications and allow this site.
                    </div>
                  ) : (
                    <>
                      <Row
                        icon={Smartphone} iconColor="#7c3aed" iconBg="#f5f3ff"
                        label="Push Notifications"
                        desc={push.subscribed
                          ? "✓ Enabled — you'll receive alerts on this device even when the app is closed"
                          : "Get real-time alerts for critical vitals, medication reminders, and messages on this device"}
                        right={
                          <button
                            onClick={async () => {
                              if (push.subscribed) {
                                await push.unsubscribe();
                                toast.info('Push notifications disabled for this device');
                              } else {
                                const ok = await push.subscribe();
                                if (ok) toast.success('Push notifications enabled!');
                                else toast.error('Could not enable notifications — check browser permissions');
                              }
                            }}
                            disabled={push.loading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              push.subscribed
                                ? 'bg-teal-50 text-teal-700 hover:bg-red-100 hover:text-red-700 border border-teal-200 hover:border-red-200'
                                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                            }`}
                          >
                            {push.loading
                              ? <Loader2 size={14} className="animate-spin" />
                              : push.subscribed ? <Check size={14} /> : <Bell size={14} />}
                            {push.loading ? 'Please wait…' : push.subscribed ? 'Enabled' : 'Enable'}
                          </button>
                        }
                      />
                      {push.subscribed && (
                        <Row
                          icon={Zap} iconColor="#0891b2" iconBg="#ecfeff"
                          label="Send Test Notification"
                          desc="Verify push is working by sending a test alert to this device"
                          border={false}
                          right={
                            <button
                              onClick={async () => {
                                try {
                                  const r = await push.sendTest();
                                  toast.success(`Test sent to ${r.devices} device${r.devices !== 1 ? 's' : ''}`);
                                } catch (e) {
                                  toast.error(e.message);
                                }
                              }}
                              className="px-4 py-2 rounded-xl text-sm font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all"
                            >
                              Send Test
                            </button>
                          }
                        />
                      )}
                    </>
                  )}
                </Section>
                <Section title="Optional Features">
                  <Row icon={Sparkles} iconColor="#7c3aed" iconBg="#f5f3ff"
                    label="Milestone Celebrations" desc="Confetti on completed assessments and goals"
                    right={<Toggle on={featureSettings.confettiOnMilestone} onToggle={() => updateFeature('confettiOnMilestone', !featureSettings.confettiOnMilestone)} color="#7c3aed" />} />
                  <Row icon={Zap} iconColor="#0891b2" iconBg="#ecfeff"
                    label="Page Progress Bar" desc="Teal loading bar on every page transition"
                    right={<Toggle on={featureSettings.pageProgressBar} onToggle={() => updateFeature('pageProgressBar', !featureSettings.pageProgressBar)} color="#0891b2" />} />
                  <Row icon={Activity} iconColor="#0d9488" iconBg="#f0fdfa"
                    label="Scroll Reveal Animations" desc="Cards fade in as you scroll - respects reduced motion"
                    right={<Toggle on={featureSettings.smoothScrollReveal} onToggle={() => updateFeature('smoothScrollReveal', !featureSettings.smoothScrollReveal)} />} />
                  <Row icon={Bell} iconColor="#0369a1" iconBg="#eff6ff"
                    label="Rich Date Picker" desc="Interactive calendar for date fields"
                    right={<Toggle on={featureSettings.inlineDatePicker} onToggle={() => updateFeature('inlineDatePicker', !featureSettings.inlineDatePicker)} color="#0369a1" />} />
                  <Row icon={LayoutGrid} iconColor="#15803d" iconBg="#f0fdf4"
                    label="Virtualised Patient Lists" desc="High-performance tables for >100 patients"
                    right={<Toggle on={featureSettings.virtualizedLists} onToggle={() => updateFeature('virtualizedLists', !featureSettings.virtualizedLists)} color="#15803d" />} />
                  <Row icon={Shield} iconColor="#b45309" iconBg="#fffbeb"
                    label="Section Error Recovery" desc="Broken sections show a Retry button instead of crashing the page" border={false}
                    right={<Toggle on={featureSettings.errorBoundaries} onToggle={() => updateFeature('errorBoundaries', !featureSettings.errorBoundaries)} color="#b45309" />} />
                </Section>
                <div className="px-1 flex items-start gap-2 text-xs text-gray-400">
                  <Info size={13} className="flex-shrink-0 mt-0.5" />
                  <span>Optional features can be turned off to improve performance on older devices.</span>
                </div>
              </>
            )}

            {/* -- ACCESSIBILITY ------------------------------------------ */}
            {tab === 'accessibility' && (
              <>
                {/* Assisted Mode */}
                <Section title="Assisted Mode">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Brain size={16} className="text-teal-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Assisted Mode
                            {a11y.assistedMode && (
                              <span className="ml-2 inline-block px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded">ON</span>
                            )}
                          </p>
                          <Toggle on={a11y.assistedMode} onToggle={() => a11y.assistedMode ? disableAssistedMode() : enableAssistedMode()} color="#0d9488" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">One-tap setup for cognitive or physical needs</p>
                      </div>
                    </div>
                  </div>
                  {/* Condition presets */}
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold text-gray-400  mb-2">Condition Profile</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-3">
                      {presets.map(({ id, Icon, label, desc, color, bg, s }) => {
                        const active = a11y.assistedMode && a11y.activePreset === id;
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              // applyPreset atomically resets all settings then applies
                              // only this preset's overrides — no lingering values
                              applyPreset(id, s);
                              if (window.speechSynthesis) {
                                const u = new SpeechSynthesisUtterance(`${label} mode activated`);
                                u.rate = 0.9; window.speechSynthesis.speak(u);
                              }
                            }}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all ${active ? 'border-current shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                            style={active ? { borderColor: color, background: bg } : {}}
                          >
                            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: active ? color : '#f3f4f6' }}>
                              <Icon size={13} color={active ? '#fff' : '#6b7280'} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold leading-tight" style={{ color: active ? color : '#111827' }}>{label}</p>
                              <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {a11y.assistedMode && (
                      <button onClick={disableAssistedMode}
                        className="w-full mb-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-all">
                        Turn Off Assisted Mode
                      </button>
                    )}
                  </div>
                </Section>

                {/* Vision */}
                <Section title="Vision & Display">
                  <Row icon={Palette} iconColor="#2563eb" iconBg="#eff6ff" label="High Contrast" desc="Stronger colour contrast — black/white sharp borders"
                    right={<Toggle on={a11y.highContrast} onToggle={() => updateSetting('highContrast', !a11y.highContrast)} />} />

                  {/* Visual Impairments — expanded */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Eye size={17} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Visual Impairments</p>
                        <p className="text-xs text-gray-500 mt-0.5">Colour correction filters for various vision conditions</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-12">
                      {[
                        { value: 'none',            label: 'No Filter',              desc: 'Standard colour vision' },
                        { value: 'protanopia',       label: 'Protanopia',             desc: 'Red-blind (1% of males)' },
                        { value: 'deuteranopia',     label: 'Deuteranopia',           desc: 'Green-blind (most common)' },
                        { value: 'tritanopia',       label: 'Tritanopia',             desc: 'Blue-blind (rare)' },
                        { value: 'monochrome',       label: 'Achromatopsia',          desc: 'Full grayscale vision' },
                        { value: 'low_contrast',     label: 'Low Contrast Boost',     desc: 'Enhances faint text & borders' },
                        { value: 'photosensitive',   label: 'Photosensitive',         desc: 'Reduced brightness, no flashing' },
                      ].map(opt => {
                        const active = (a11y.colorBlindMode || 'none') === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => updateSetting('colorBlindMode', opt.value)}
                            className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                              active
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-gray-200 bg-[#f0f6fa] hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <p className={`text-xs font-bold ${active ? 'text-amber-800' : 'text-gray-800'}`}>{opt.label}</p>
                            <p className={`text-[10px] mt-0.5 ${active ? 'text-amber-600' : 'text-gray-400'}`}>{opt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <Type size={17} className="text-teal-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">Font Size</p>
                    </div>
                    <div className="flex gap-1.5 ml-12">
                      {[['small','S'],['medium','M'],['large','L'],['xlarge','XL'],['xxlarge','XXL']].map(([v,lbl]) => (
                        <button key={v} onClick={() => updateSetting('fontSize', v)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${a11y.fontSize===v ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Row icon={Zap} iconColor="#0d9488" iconBg="#f0fdfa" label="Reduce Motion" desc="Minimises animations — helps epilepsy, migraine, vertigo" border={false}
                    right={<Toggle on={a11y.reducedMotion} onToggle={() => updateSetting('reducedMotion', !a11y.reducedMotion)} />} />
                </Section>

                {/* Assistive */}
                <Section title="Assistive Technology">
                  {[
                    { key:'screenReaderMode', Icon:Volume2,      label:'Screen Reader',    desc:'Enhanced descriptions for screen readers' },
                    { key:'voiceControl',     Icon:Volume2,      label:'Voice Control',    desc:'Navigate by speaking commands' },
                    { key:'largeTouch',       Icon:MousePointer, label:'Large Touch Areas',desc:'Bigger tap targets for motor difficulties' },
                  ].map(({ key, Icon, label, desc }, i, arr) => (
                    <Row key={key} icon={Icon} iconColor="#7c3aed" iconBg="#f5f3ff"
                      label={label} desc={desc}
                      border={i < arr.length-1}
                      right={<Toggle on={a11y[key]} onToggle={() => updateSetting(key, !a11y[key])} color="#7c3aed" />}
                    />
                  ))}
                </Section>

                {/* Interface & Navigation */}
                <Section title="Interface & Navigation">
                  <Row icon={Brain} iconColor="#7c3aed" iconBg="#f5f3ff"
                    label="Simplified Interface" desc="Cleaner layout with fewer distractions"
                    right={<Toggle on={a11y.simplifiedUI} onToggle={() => updateSetting('simplifiedUI', !a11y.simplifiedUI)} color="#7c3aed" />} />
                  <Row icon={Keyboard} iconColor="#0891b2" iconBg="#ecfeff"
                    label="Keyboard Navigation Mode" desc="Enhanced shortcuts and focus indicators"
                    right={<Toggle on={a11y.keyboardOnly} onToggle={() => updateSetting('keyboardOnly', !a11y.keyboardOnly)} color="#0891b2" />} />
                  <Row icon={Eye} iconColor="#b45309" iconBg="#fffbeb"
                    label="Focus Mode" desc="Dims everything except the focused element"
                    right={<Toggle on={a11y.focusMode} onToggle={() => updateSetting('focusMode', !a11y.focusMode)} color="#b45309" />} />
                  <Row icon={BookOpen} iconColor="#059669" iconBg="#f0fdf4"
                    label="Reading Guide" desc="Horizontal line follows cursor to guide reading"
                    right={<Toggle on={a11y.readingGuide} onToggle={() => updateSetting('readingGuide', !a11y.readingGuide)} color="#059669" />} />
                  <Row icon={Type} iconColor="#c2410c" iconBg="#fff7ed"
                    label="Dyslexia-Friendly Font" desc="Rounded spaced font to aid reading with dyslexia"
                    border={false}
                    right={<Toggle on={a11y.dyslexiaFont} onToggle={() => updateSetting('dyslexiaFont', !a11y.dyslexiaFont)} color="#c2410c" />} />
                </Section>

                {/* Text Spacing */}
                <Section title="Text Spacing">
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500 mb-3">Extra space between lines and letters to improve readability.</p>
                    <div className="flex gap-2">
                      {[['normal','Normal'],['relaxed','Relaxed'],['wide','Wide']].map(([v, lbl]) => (
                        <button key={v} onClick={() => updateSetting('textSpacing', v)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                            a11y.textSpacing === v
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <button onClick={() => { resetSettings(); toast.success('Accessibility settings reset to defaults'); }}
                  data-tip="Reset all accessibility settings to their defaults"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all">
                  <RotateCcw size={14} /> Reset Accessibility Defaults
                </button>
              </>
            )}

            {/* -- FAMILY SHARING — patient-only consent management ------- */}
            {tab === 'privacy' && (
              <FamilyConsentSettings />
            )}

            {/* -- AI TOOLS - now merged into 'ai' tab above -------------- */}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
