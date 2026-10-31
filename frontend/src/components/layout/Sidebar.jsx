import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
 LayoutDashboard, Users, Brain, Bell, Pill, Calendar, 
 HeartHandshake, FileText, Infinity as InfinityIcon,
 BookOpen, MessagesSquare, Map, User, Shield, UserCog, X, MessageCircle, Mail, Heart, Target,
 Sparkles, ClipboardList, Home, Activity, ChevronLeft, ChevronRight, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { alertsAPI } from '../../api/client';
import { useCareSettingContext } from '../../context/CareSettingContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import useAppStore from '../../store/useAppStore';
import usePersonalisation from '../../hooks/usePersonalisation';
import { usePersonalisationFlags } from '../../context/PersonalisationContext';
import { useUIProfile } from '../../context/UIProfileContext';

// Icon map for dynamic nav additions from CareSettingContext
const ICON_MAP = {
 'My Care Plan': FileText, 'Care Team': MessageCircle, 'Memory Vault': HeartHandshake,
 'Digital Legacy': Shield, 'My Final Wishes': Mail, 'Daily Symptom Log': Activity,
 'My Medications': Pill, 'Appointments': Calendar, 'Pre-Clinic Check': ClipboardList,
 'Wellbeing Check': Heart, 'Community': MessagesSquare, 'Shift Handover': ClipboardList,
 'Daily Care Log': Home, 'Residential Log': ClipboardList, 'Caregiver Support': HeartHandshake,
 'Family Updates': Mail, 'Bereavement Support': Heart, 'Care Team Chat': MessageCircle,
};

export default function Sidebar({ isOpen, setIsOpen, onOpenAura }) {
 const { user } = useAuth();
 const { signals } = usePersonalisation();
 const { hiddenNavPaths, uiFlags } = usePersonalisationFlags();
 const location = useLocation();
 const [expanded, setExpanded] = useState(false);
 const { careSetting, meta, navAdditions, isHidden, emphasis } = useCareSettingContext();
 const { sidebarSettings, updateSidebarSetting } = useAppSettings();
 const { profileKey, profile: uiProfile } = useUIProfile();

 // Use Zustand for unread count - shared with NotificationCenter
 const unreadCount = useAppStore(s => s.unreadAlerts);
 const setUnreadAlerts = useAppStore(s => s.setUnreadAlerts);

 // On mount, apply the defaultState setting
 useEffect(() => {
 if (sidebarSettings.defaultState === 'expanded') {
 setExpanded(true);
 }
 }, [sidebarSettings.defaultState]);

 // Poll alerts count every 30s - store in Zustand so any component can read it
 useEffect(() => {
 if (!user) return;
 const fetchUnreadCount = async () => {
 try {
 const response = await alertsAPI.getUnreadCount();
 setUnreadAlerts(response.data.count);
 } catch (err) {
 console.warn('Failed to poll alert counts', err);
 }
 };
 fetchUnreadCount();
 const interval = setInterval(fetchUnreadCount, 30000);
 return () => clearInterval(interval);
 }, [user, setUnreadAlerts]);

 const navigation = {
 admin: [
 { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
 { name: 'Patients', path: '/patients', icon: Users },
 { name: 'Messages', path: '/messages', icon: MessageCircle },
 { name: 'AI Insights', path: '/ai-insights', icon: Brain },
 { name: 'Alerts', path: '/alerts', icon: Bell, badge: true },
 { name: 'Resources', path: '/resources', icon: BookOpen },
 { name: 'Medical KB', path: '/medical-knowledge', icon: BookOpen },
 { name: 'Care Settings', path: '/care-settings', icon: Map },
 { name: 'Caregivers', path: '/caregivers', icon: HeartHandshake },
 { name: 'User Management', path: '/admin/users', icon: UserCog },
 { name: 'Feature Control', path: '/admin/features', icon: Shield },
 { name: 'Feedback & Bugs', path: '/admin/feedback', icon: MessageCircle },
 { name: 'HIPAA Compliance', path: '/admin/hipaa-compliance', icon: Shield },
 { name: 'Model Bias Report',path: '/admin/model-bias-report', icon: Brain },
 { name: 'Audit Log', path: '/admin/audit', icon: Shield },
 { name: 'Reports', path: '/reports', icon: FileText },
 { name: 'My Profile', path: '/profile', icon: User },
 ],
 clinician: [
 { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
 { name: 'Patients', path: '/patients', icon: Users },
 { name: 'Messages', path: '/messages', icon: MessageCircle },
 { name: 'AI Insights', path: '/ai-insights', icon: Brain },
 { name: 'Alerts', path: '/alerts', icon: Bell, badge: true },
 { name: 'Medications', path: '/medications', icon: Pill },
 { name: 'Appointments', path: '/appointments', icon: Calendar },
 { name: 'Caregivers', path: '/caregivers', icon: HeartHandshake },
 { name: 'Services', path: '/services', icon: Briefcase },
 { name: 'Resources', path: '/resources', icon: BookOpen },
 { name: 'Care Guide', path: '/care-guide', icon: FileText },
 { name: 'Care Settings', path: '/care-settings', icon: Map },
 { name: 'Shift Handover', path: '/shift-handover', icon: ClipboardList },
 { name: 'Pre-Clinic', path: '/pre-clinic', icon: ClipboardList },
 { name: 'Medical KB', path: '/medical-knowledge', icon: BookOpen },
 { name: 'Reports', path: '/reports', icon: FileText },
 { name: 'My Profile', path: '/profile', icon: User },
 ],
 patient: [
 { name: 'My Space', path: '/my-space', icon: LayoutDashboard },
 { name: 'Wellness Check', path: '/wellness-checkin', icon: Activity },
 { name: 'My Medications', path: '/medications', icon: Pill },
 { name: 'Appointments', path: '/appointments', icon: Calendar },
 { name: 'Messages', path: '/messages', icon: MessageCircle },
 { name: 'My Journey', path: '/my-journey', icon: Map },
 { name: 'Care Setting', path: '/care-settings', icon: Target },
 { name: 'Resources', path: '/resources', icon: BookOpen },
 { name: 'Community', path: '/community', icon: MessagesSquare },
 { name: 'Services', path: '/services', icon: Briefcase },
 { name: 'Memory Vault', path: '/memory-vault', icon: HeartHandshake },
 { name: 'My Journal', path: '/journal', icon: FileText },
 { name: 'Digital Legacy', path: '/legacy-setup', icon: Shield },
 { name: 'Manage Heirs', path: '/heir-management', icon: Users },
 { name: 'Legacy Content', path: '/legacy-content', icon: Mail },
 { name: 'My Profile', path: '/profile', icon: User },
 ],
 family: [
 { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
 { name: 'Messages', path: '/messages', icon: MessageCircle },
 { name: 'Appointments', path: '/appointments', icon: Calendar },
 { name: 'Medications', path: '/medications', icon: Pill },
 { name: 'Services', path: '/services', icon: Briefcase },
 { name: 'Continuity Bridge', path: '/continuity-bridge', icon: InfinityIcon },
 { name: 'Bereavement Support',path: '/bereavement-support', icon: Heart },
 { name: 'Care Setting', path: '/care-settings', icon: Target },
 { name: 'Community', path: '/community', icon: MessagesSquare },
 { name: 'Resources', path: '/resources', icon: BookOpen },
 { name: 'Legacy Access', path: '/my-legacy-access', icon: Heart },
 { name: 'My Profile', path: '/profile', icon: User },
 ],
 caregiver: [
 { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
 { name: 'Patients', path: '/patients', icon: Users },
 { name: 'Messages', path: '/messages', icon: MessageCircle },
 { name: 'Medications', path: '/medications', icon: Pill },
 { name: 'Appointments', path: '/appointments', icon: Calendar },
 { name: 'Services', path: '/services', icon: Briefcase },
 { name: 'Shift Handover', path: '/shift-handover', icon: ClipboardList },
 { name: 'Daily Care Log', path: '/daily-care-log', icon: Home },
 { name: 'Residential Log',path: '/residential-log', icon: ClipboardList },
 { name: 'Care Settings', path: '/care-settings', icon: Map },
 { name: 'Resources', path: '/resources', icon: BookOpen },
 { name: 'Community', path: '/community', icon: MessagesSquare },
 { name: 'My Profile', path: '/profile', icon: User },
 ],
 provider: [
 { name: 'Services Hub', path: '/services', icon: Briefcase },
 { name: 'Messages', path: '/messages', icon: MessageCircle },
 { name: 'Appointments', path: '/appointments', icon: Calendar },
 { name: 'Resources', path: '/resources', icon: BookOpen },
 { name: 'Community', path: '/community', icon: MessagesSquare },
 { name: 'My Profile', path: '/profile', icon: User },
 ],
};

 // Build personalised "suggested" item paths for patients
 const suggestedPaths = user?.role === 'patient' && signals ? (() => {
 const s = new Set();
 if (signals.painLevel >= 5) s.add('/wellness-checkin');
 if (signals.needsEmotionalSupport) s.add('/messages');
 if (signals.needsCommunity) s.add('/community');
 if (signals.needsSpiritualSupport) s.add('/community');
 if (signals.carePriorities?.includes('Preparing for the future')) s.add('/legacy-setup');
 if (signals.carePriorities?.includes('Spending time with family')) s.add('/memory-vault');
 return s;
 })() : new Set();

 const navItems = (() => {
 const base = (navigation[user?.role] || []).filter(item => {
 if (hiddenNavPaths.has(item.path)) return false;
 if (isHidden(item.path)) return false;
 return true;
 });

 // Score each item: lower = higher in list
 // 0 = suggested by questionnaire signals (most relevant right now)
 // 1 = emphasised by care setting
 // 2 = normal
 // 3 = reduced by care setting (still shown, just lower)
 const score = (item) => {
 if (suggestedPaths.has(item.path)) return 0;
 const e = emphasis(item.path);
 if (e === 'high') return 1;
 if (e === 'reduced') return 3;
 return 2;
 };

 return [...base].sort((a, b) => score(a) - score(b));
 })();
 const activeItemRef = useRef(null);

 // Match exact path OR sub-routes (e.g. /care-guide/123 → /care-guide)
 const isActive = (path) =>
 location.pathname === path ||
 (path !== '/' && path !== '/dashboard' && path !== '/my-space' &&
 location.pathname.startsWith(path + '/'));

 // Auto-scroll active nav item into view whenever route changes
 useEffect(() => {
 if (activeItemRef.current) {
 activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
 }
 }, [location.pathname]);

 // Hover expand only when defaultState is 'icons' and showLabels is true
 const handleMouseEnter = () => {
 if (sidebarSettings.defaultState !== 'expanded') setExpanded(true);
 };
 const handleMouseLeave = () => {
 if (sidebarSettings.defaultState !== 'expanded') setExpanded(false);
 };

 // Desktop width based on state
 const desktopWidth = expanded ? 'md:w-[200px]' : 'md:w-[60px]';
 // Desktop visibility
 const desktopVisible = sidebarSettings.desktopVisible;
 // Show labels: always on mobile drawer, or when desktop is expanded
 const showLabels = isOpen || expanded;

 return (
 <>
 {/* Mobile Drawer Overlay Backdrop */}
 {isOpen && (
 <div 
 onClick={() => setIsOpen(false)}
 className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity" 
 />
 )}

 {/* Sidebar Container */}
 <aside 
 className={`
 fixed inset-y-0 left-0 z-40 text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden
 ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-0'}
 ${desktopVisible
 ? `md:translate-x-0 md:sticky md:top-0 md:h-screen md:self-start ${desktopWidth}`
 : 'md:-translate-x-full md:w-0'
 }
 `}
 style={{
 height: isOpen ? '100dvh' : undefined,
 maxHeight: '100vh',
 background: 'linear-gradient(180deg, #0b2d26 0%, #0d3b2e 25%, #0c3347 55%, #0d1f3c 85%, #0a1628 100%)',
 }}
 onMouseEnter={handleMouseEnter}
 onMouseLeave={handleMouseLeave}
 >
 {/* Logo/Brand Header */}
 <div className="p-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
 <div className="flex items-center gap-2 flex-1 min-w-0">
 <img
 src="/logo.png"
 alt="Project Aura"
 className="flex-shrink-0 rounded-lg bg-white/10 object-contain"
 style={{ width: 30, height: 30, padding: 2 }}
 />
 {showLabels && (
 <div className="min-w-0">
 <p className="text-sm font-bold text-white leading-tight truncate">Project Aura</p>
 <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#D4A017' }}>Healthcare</p>
 </div>
 )}
 </div>

 {/* Desktop collapse/pin button */}
 <button
 onClick={() => updateSidebarSetting('defaultState', sidebarSettings.defaultState === 'expanded' ? 'icons' : 'expanded')}
 className="hidden md:flex items-center justify-center w-6 h-6 rounded-lg hover:bg-white/20 text-white/60 hover:text-white transition-all flex-shrink-0"
 data-tip={sidebarSettings.defaultState === 'expanded' ? 'Collapse to icons' : 'Pin sidebar open'}
 >
 {sidebarSettings.defaultState === 'expanded'
 ? <ChevronLeft size={14} strokeWidth={2.5} />
 : <ChevronRight size={14} strokeWidth={2.5} />
 }
 </button>

 {/* Close button for Mobile */}
 <button 
 onClick={() => setIsOpen(false)}
 className="md:hidden text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
 >
 <X size={20} strokeWidth={2.5} />
 </button>
 </div>

 {/* Navigation Items */}
 {/* overflow-y: auto on the nav for scrolling; tooltips use position:fixed via sidebar-tip class */}
 <nav className="flex-1 min-h-0 px-2 py-3 space-y-1 overflow-y-auto sidebar-nav sidebar-scroll-container">
 {/* Care Setting badge - shown when showLabels */}
 {careSetting && showLabels && meta && (
 <div className="mb-2 px-2 py-2 bg-white/10 rounded-lg border border-white/20">
 <p className="text-[11px] text-white/50 uppercase tracking-wider font-bold mb-0.5">Care Setting</p>
 <p className="text-[11px] text-teal-200 font-semibold leading-tight flex items-center gap-1">
 {meta.icon && <meta.icon size={11} className="flex-shrink-0" />}
 {meta.shortLabel}
 </p>
 </div>
 )}
 {careSetting && !showLabels && meta && (
 <div className="mb-1 flex justify-center" title={meta.label}>
 {meta.icon && <meta.icon size={16} className="text-teal-300" />}
 </div>
 )}

 {/* Navigation items - ordered by care setting emphasis + questionnaire signals */}
 {navItems.map((item) => {
 const Icon = item.icon;
 const active = isActive(item.path);
 const isSuggested = suggestedPaths.has(item.path);
 const itemEmphasis = emphasis(item.path);
 return (
 <Link
 key={item.path}
 to={item.path}
 onClick={() => setIsOpen(false)}
 ref={active ? activeItemRef : null}
 data-tip={!showLabels && sidebarSettings.showLabels ? item.name + (item.badge && unreadCount > 0 ? ` (${unreadCount})` : '') : undefined}
 className={`
 sidebar-tip flex items-center px-2 py-2 rounded-lg transition-all duration-150 relative group
 ${showLabels ? 'justify-start' : 'justify-center'} h-[36px]
 ${active
 ? 'bg-white/20 text-white font-bold shadow-lg border-l-3 border-teal-300'
 : itemEmphasis === 'reduced'
 ? 'text-white/45 hover:bg-white/10 hover:text-white/75 border-l-3 border-transparent'
 : 'text-white/75 hover:bg-white/10 hover:text-white border-l-3 border-transparent'
 }
 `}
 >
 <Icon size={18} className={`${active ? 'scale-110 text-white' : 'text-white/70 group-hover:text-white'} transition-all flex-shrink-0`} strokeWidth={active ? 2.5 : 2} />

 {showLabels && (
 <span className={`text-sm ml-2 truncate ${active ? 'font-bold' : 'font-medium'}`}>
 {item.name}
 </span>
 )}

 {/* Suggested indicator - small teal dot in label mode */}
 {!active && isSuggested && showLabels && (
 <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
 )}

 {item.badge && unreadCount > 0 && (
 <span className={`
 bg-red-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shadow-lg min-w-[16px] text-center
 ${showLabels ? 'ml-auto' : 'absolute -top-0.5 -right-0.5'}
 `}>
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}

 {/* Suggested dot in icon-only mode */}
 {!active && !item.badge && isSuggested && !showLabels && (
 <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
 )}
 </Link>
 );
 })}
 </nav>

 {/* -- UI Profile badge (shown when expanded) -- */}
 {showLabels && profileKey && profileKey !== 'standard' && (
 <div className="px-3 pb-2 flex-shrink-0">
 <Link to="/settings" onClick={() => setIsOpen(false)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
 <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
 <span className="text-[11px] text-teal-200 font-medium truncate">
 {uiProfile?.label || profileKey} mode
 </span>
 </Link>
 </div>
 )}

 {/* -- Aura AI button -- */}
 <div className="px-2 py-3 border-t border-white/10 flex-shrink-0">
 <button
 onClick={() => { setIsOpen(false); onOpenAura?.(); }}
 data-tip={!showLabels && sidebarSettings.showLabels ? 'Open Aura AI Companion ✨' : undefined}
 className={`
 sidebar-tip w-full flex items-center px-2 py-2.5 rounded-lg transition-all duration-150 relative group
 ${showLabels ? 'justify-start' : 'justify-center'}
 bg-gradient-to-r from-teal-500/30 to-cyan-500/30 hover:from-teal-500/50 hover:to-cyan-500/50
 border border-teal-400/40 hover:border-teal-300/70
 `}
 >
 <Sparkles size={18} className="text-teal-300 group-hover:text-white transition-all flex-shrink-0" strokeWidth={2} />
 {showLabels && (
 <span className="text-sm ml-2 font-bold text-teal-200 group-hover:text-white truncate">
 Aura AI
 </span>
 )}
 </button>
 </div>
 </aside>
 </>
 );
}
