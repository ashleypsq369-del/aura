/**
 * FamilyDashboardHero - Care Status card with quick actions
 * Feature 4: Family Dashboard Hero
 * Redesigned: clear typography, 4 quick-action buttons, upcoming visit banner
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
 Heart, Calendar, TrendingUp, TrendingDown, Minus,
 ChevronRight, Phone, MessageCircle, FileText, Clock,
 CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI } from '../api/client';
import { useCareTeamChat } from '../hooks/useCareTeamChat';

const CONDITION_META = {
 improving: { label: 'Improving', icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.25)' },
 stable: { label: 'Stable', icon: Minus, color: '#ffffff', bg: 'rgba(255,255,255,0.20)' },
 worsening: { label: 'Worsening', icon: TrendingDown, color: '#fca5a5', bg: 'rgba(239,68,68,0.25)' },
};

function timeAgo(dateStr) {
 if (!dateStr) return null;
 const diff = Date.now() - new Date(dateStr).getTime();
 const days = Math.floor(diff / 86400000);
 if (days === 0) return 'Today';
 if (days === 1) return 'Yesterday';
 if (days < 7) return `${days} days ago`;
 if (days < 14) return '1 week ago';
 return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function QuickAction({ icon: Icon, label, onClick, accent = 'rgba(255,255,255,0.15)' }) {
 return (
 <button
 onClick={onClick}
 className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
 style={{ background: accent, border: '1px solid rgba(255,255,255,0.2)' }}
 >
 <Icon size={16} className="text-white" />
 <span className="text-[10px] font-semibold text-white/90 whitespace-nowrap">{label}</span>
 </button>
 );
}

export default function FamilyDashboardHero({ patientId, patientName }) {
 const navigate = useNavigate();
 const { chatWithCareTeam } = useCareTeamChat();

 const { data: appointments = [] } = useQuery({
 queryKey: ['appointments', patientId],
 queryFn: () => appointmentsAPI.getPatientAppointments(patientId).then(r => r.data),
 enabled: !!patientId,
 });

 const completed = appointments
 .filter(a => a.status === 'completed' && a.scheduled_at)
 .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

 const lastVisit = completed[0];

 const upcoming = appointments
 .filter(a =>
 ['scheduled', 'nurse_assigned', 'en_route', 'visit_active'].includes(a.status) &&
 new Date(a.scheduled_at) > new Date()
 )
 .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

 const condition = CONDITION_META.stable;
 const CondIcon = condition.icon;
 const lastVisitDate = lastVisit ? timeAgo(lastVisit.scheduled_at) : null;
 const displayName = patientName || 'Your loved one';

 return (
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 className="rounded-2xl overflow-hidden"
 style={{
 background: 'linear-gradient(135deg, #0b7a70 0%, #0d9488 40%, #0891b2 100%)',
 boxShadow: '0 4px 20px rgba(13,148,136,0.30)',
 }}
 >
 {/* Subtle glow overlay */}
 <div
 className="absolute inset-0 pointer-events-none"
 style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
 />

 <div className="relative p-4 sm:p-5 space-y-4">

 {/* ── Header row ── */}
 <div className="flex items-start justify-between">
 <div>
 <p className="text-white/60 text-[11px] font-semibold tracking-wide mb-0.5">CARE STATUS</p>
 <h2 className="text-white font-bold text-lg leading-tight">{displayName}</h2>
 </div>
 {/* Condition badge */}
 <div
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
 style={{ background: condition.bg, color: condition.color }}
 >
 <CondIcon size={12} strokeWidth={2.5} />
 {condition.label}
 </div>
 </div>

 {/* ── Last visit info ── */}
 <div
 className="rounded-xl p-3 flex items-center gap-3"
 style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.12)' }}
 >
 {lastVisitDate ? (
 <>
 <div
 className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
 style={{ background: 'rgba(255,255,255,0.15)' }}
 >
 <CheckCircle2 size={18} className="text-white" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-white/60 text-[10px] font-semibold">Last visit</p>
 <p className="text-white font-bold text-sm">{lastVisitDate}</p>
 {lastVisit?.appointment_type && (
 <p className="text-white/60 text-[11px] truncate">{lastVisit.appointment_type}</p>
 )}
 </div>
 </>
 ) : (
 <>
 <div
 className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
 style={{ background: 'rgba(255,255,255,0.10)' }}
 >
 <AlertCircle size={18} className="text-white/60" />
 </div>
 <div>
 <p className="text-white/60 text-[10px] font-semibold">Last visit</p>
 <p className="text-white/80 text-sm">No visits recorded yet</p>
 </div>
 </>
 )}

 {/* Next visit chip */}
 {upcoming && (
 <div
 className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
 style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
 >
 <Clock size={11} />
 <span>
 Next:{' '}
 {new Date(upcoming.scheduled_at).toLocaleDateString('en-GB', {
 weekday: 'short', day: 'numeric', month: 'short',
 })}
 </span>
 </div>
 )}
 </div>

 {/* ── Quick actions ── */}
 <div className="grid grid-cols-4 gap-2">
 <QuickAction
 icon={MessageCircle}
 label="Message"
 onClick={() => chatWithCareTeam()}
 accent="rgba(255,255,255,0.12)"
 />
 <QuickAction
 icon={Calendar}
 label="Appointments"
 onClick={() => navigate('/appointments')}
 accent="rgba(255,255,255,0.12)"
 />
 <QuickAction
 icon={FileText}
 label="Visit Report"
 onClick={() => lastVisit
 ? navigate(`/patients/${patientId}/appointments`)
 : navigate('/appointments')
 }
 accent="rgba(255,255,255,0.12)"
 />
 <QuickAction
 icon={Heart}
 label="Wellness"
 onClick={() => navigate('/wellness-checkin')}
 accent="rgba(255,255,255,0.12)"
 />
 </div>

 {/* ── View all link ── */}
 <button
 onClick={() => navigate(patientId ? `/patients/${patientId}/appointments` : '/appointments')}
 className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all"
 style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
 >
 View full care timeline <ChevronRight size={13} />
 </button>
 </div>
 </motion.div>
 );
}
