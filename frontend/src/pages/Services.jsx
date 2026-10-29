/**
 * Services — Professional provider marketplace
 * Route: /services
 * Tabs: Browse | My Bookings | Provider Hub
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Star, MapPin, Shield, Award, BadgeCheck,
  Calendar, Clock, MessageCircle, ChevronRight, X,
  Loader2, CheckCircle, Briefcase, Sparkles,
  Stethoscope, Activity, Heart, Brain, Users, Hand,
  FileText, AlertCircle, TrendingUp, Filter,
} from 'lucide-react';
import { servicesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Switch from '../components/ui/Switch';
import { toast } from 'sonner';
import AvatarDisplay from '../components/avatar/AvatarDisplay';

/* ── constants ────────────────────────────────────────────────────────────── */
const ICON_MAP = { Stethoscope, Activity, Heart, Brain, Users, Hand, FileText };
const TYPE_COLORS = {
  nurse:'#0d9488', doctor:'#0891b2', physiotherapist:'#059669',
  counsellor:'#7c3aed', nanny:'#d97706', masseur:'#ea580c',
  social_worker:'#db2777', chaplain:'#0369a1',
};

/* ── Stars ────────────────────────────────────────────────────────────────── */
function Stars({ value, count }) {
  if (value == null)
    return <span className="text-[11px] text-slate-400 italic">No reviews yet</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={11} strokeWidth={1.5}
          className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-700">{value.toFixed(1)}</span>
      {count > 0 && <span className="text-[10px] text-slate-400">({count})</span>}
    </span>
  );
}

/* ── ProviderCard ─────────────────────────────────────────────────────────── */
function ProviderCard({ p, onBook, onMessage, onViewProfile }) {
  const color = TYPE_COLORS[p.service_type] || '#0d9488';
  return (
    <motion.div layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col border border-slate-200">
      <div className="h-1.5" style={{ background: `linear-gradient(to right,${color},${color}88)` }} />
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2"
              style={{ borderColor:`${color}40` }}>
              <AvatarDisplay size={56} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight truncate">{p.full_name}</p>
            {p.professional_title && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                style={{ background:`${color}15`, color }}>
                {p.professional_title}
              </span>
            )}
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 flex-wrap">
              {p.region && <><MapPin size={10}/><span>{p.region}</span></>}
              {p.region && p.specialisation && <span className="text-slate-300">·</span>}
              {p.specialisation && <span className="capitalize">{p.specialisation}</span>}
            </div>
          </div>
        </div>

        <Stars value={p.average_rating} count={p.total_reviews} />

        {/* Verification */}
        <div className="flex flex-wrap gap-1">
          {p.nmc_pin && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background:'#0d948815', color:'#0d9488' }}>
              <Award size={9}/> NMC
            </span>
          )}
          {p.is_verified && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background:'#0891b215', color:'#0891b2' }}>
              <Shield size={9}/> Verified
            </span>
          )}
          {p.is_professional && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background:'#05966915', color:'#059669' }}>
              <BadgeCheck size={9}/> Aura
            </span>
          )}
        </div>

        {p.bio && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{p.bio}</p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {p.years_experience > 0 && <span>{p.years_experience}y exp</span>}
          {p.total_bookings > 0 && <span>{p.total_bookings} bookings</span>}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1.5 mt-auto pt-2 border-t border-slate-100">
          <button onClick={() => onViewProfile(p)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all"
            style={{ background:`${color}10`, color }}>
            <FileText size={14}/> Profile
          </button>
          <button onClick={() => onBook(p)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold text-white"
            style={{ background:color }}>
            <Calendar size={14}/> Book
          </button>
          <button onClick={() => onMessage(p)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold"
            style={{ background:'#0d948810', color:'#0d9488' }}>
            <MessageCircle size={14}/> Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Booking Modal ────────────────────────────────────────────────────────── */
function BookingModal({ provider, onClose }) {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const color = TYPE_COLORS[provider.service_type] || '#0d9488';

  const slotsQ = useQuery({
    queryKey: ['slots', provider.id, selectedDate],
    queryFn: () => servicesAPI.getProviderSlots(provider.id, selectedDate).then(r => r.data),
    enabled: !!selectedDate,
  });

  const mut = useMutation({
    mutationFn: d => servicesAPI.createBooking(d),
    onSuccess: () => {
      toast.success('Booking request sent!');
      qc.invalidateQueries({ queryKey:['my-bookings'] });
      onClose();
    },
    onError: e => toast.error(e?.response?.data?.detail || 'Booking failed'),
  });

  const today   = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now()+90*24*3600000).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ background:color }} />
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 text-sm">Book a Session</p>
            <p className="text-[11px] text-slate-500">with {provider.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={15}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Date</label>
            <input type="date" value={selectedDate} min={today} max={maxDate}
              onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Available Times</label>
              {slotsQ.isLoading
                ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-teal-500"/></div>
                : (slotsQ.data?.slots?.length === 0
                  ? <p className="text-xs text-slate-500 italic py-2">No slots on this date. Try another day.</p>
                  : <div className="flex flex-wrap gap-1.5">
                      {(slotsQ.data?.slots || []).map(slot => (
                        <button key={slot} type="button" onClick={() => setSelectedTime(slot)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
                          style={{
                            borderColor: selectedTime===slot ? color : '#e2e8f0',
                            background: selectedTime===slot ? `${color}12` : 'white',
                            color: selectedTime===slot ? color : '#64748b',
                          }}>
                          {slot}
                        </button>
                      ))}
                    </div>
                )
              }
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Describe what you need..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>

          <button
            onClick={() => mut.mutate({ provider_id:provider.id, service_type:provider.service_type, requested_date:selectedDate, start_time:selectedTime||undefined, notes })}
            disabled={!selectedDate || mut.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background:color }}>
            {mut.isPending
              ? <><Loader2 size={14} className="animate-spin"/>Sending...</>
              : <><Calendar size={14}/>Send Booking Request</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Profile Modal ────────────────────────────────────────────────────────── */
function ProfileModal({ provider, onClose, onBook }) {
  const color = TYPE_COLORS[provider.service_type] || '#0d9488';
  const { data: full } = useQuery({
    queryKey: ['provider-full', provider.id],
    queryFn: () => servicesAPI.getProvider(provider.id).then(r => r.data),
    enabled: !!provider.id,
  });
  const p = full || provider;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}>
      <motion.div initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }}
        exit={{ opacity:0, y:60 }} transition={{ duration:0.22 }}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ background:color }} />
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            <AvatarDisplay size={56} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">{p.full_name}</p>
            {p.professional_title && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background:`${color}15`, color }}>{p.professional_title}</span>
            )}
            <div className="mt-1"><Stars value={p.average_rating} count={p.total_reviews} /></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"><X size={15}/></button>
        </div>

        <div className="p-5 space-y-5">
          {p.bio && (
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">About</p>
              <p className="text-sm text-slate-700 leading-relaxed">{p.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[
              {l:'Experience', v:p.years_experience ? `${p.years_experience} years` : null},
              {l:'Region', v:p.region}, {l:'Location', v:p.location},
              {l:'Facility', v:p.facility_name}, {l:'Specialisation', v:p.specialisation},
              {l:'Total Bookings', v:p.total_bookings},
            ].filter(r=>r.v).map(r => (
              <div key={r.l} className="bg-slate-50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-slate-400 font-medium">{r.l}</p>
                <p className="text-xs font-semibold text-slate-700 capitalize">{r.v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 mb-2">Verification</p>
            <div className="flex flex-wrap gap-2">
              {p.nmc_pin && <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ background:'#0d948815', color:'#0d9488' }}><Award size={12}/>NMC: {p.nmc_pin}</span>}
              {p.is_verified && <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ background:'#0891b215', color:'#0891b2' }}><Shield size={12}/>Ghana Card Verified</span>}
              {p.is_professional && <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg" style={{ background:'#05966915', color:'#059669' }}><BadgeCheck size={12}/>Aura Verified</span>}
            </div>
          </div>

          {p.qualifications?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">Qualifications</p>
              <div className="space-y-1.5">
                {p.qualifications.map((q,i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle size={12} className="text-teal-500 flex-shrink-0 mt-0.5"/>
                    <span className="text-slate-700 font-medium">{q.title}</span>
                    {q.institution && <span className="text-slate-400">- {q.institution}</span>}
                    {q.year && <span className="text-slate-400">({q.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.ratings?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">Recent Reviews</p>
              <div className="space-y-2">
                {p.ratings.slice(0,3).map((r,i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={10} className={n<=r.rating?'text-amber-400 fill-amber-400':'text-slate-200'}/>
                      ))}
                      <span className="text-[10px] text-slate-400 ml-1">
                        {new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                      </span>
                    </div>
                    {r.comment && <p className="text-xs text-slate-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => { onClose(); onBook(p); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background:color }}>
            <Calendar size={15}/> Book a Session
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── My Bookings ──────────────────────────────────────────────────────────── */
function MyBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => servicesAPI.getMyBookings().then(r => r.data),
  });
  const bookings = data?.bookings || [];

  const SM = {
    pending:   { color:'#d97706', bg:'#fef3c7', label:'Pending'   },
    confirmed: { color:'#0d9488', bg:'#f0fdfa', label:'Confirmed' },
    completed: { color:'#059669', bg:'#f0fdf4', label:'Completed' },
    cancelled: { color:'#ef4444', bg:'#fef2f2', label:'Cancelled' },
  };

  const cancelMut = useMutation({
    mutationFn: id => servicesAPI.cancelBooking(id),
    onSuccess: () => { toast.success('Booking cancelled'); qc.invalidateQueries({ queryKey:['my-bookings'] }); },
    onError: () => toast.error('Cancel failed'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-teal-500"/></div>;
  if (bookings.length === 0) return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 text-center">
      <Calendar size={36} className="text-slate-300 mx-auto mb-3"/>
      <p className="font-semibold text-slate-500 text-sm">No bookings yet</p>
      <p className="text-xs text-slate-400 mt-1">Browse providers and book a session</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {bookings.map(b => {
        const sm = SM[b.status] || SM.pending;
        const color = TYPE_COLORS[b.service_type] || '#0d9488';
        return (
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-1" style={{ background:color }} />
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                <AvatarDisplay size={40} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm text-slate-800 truncate">{b.provider_name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background:sm.bg, color:sm.color }}>{sm.label}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{b.service_type} service</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={10}/>
                    {new Date(b.requested_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
                  </span>
                  {b.start_time && <span className="flex items-center gap-1"><Clock size={10}/>{b.start_time}</span>}
                </div>
                {b.status === 'pending' && (
                  <button onClick={() => cancelMut.mutate(b.id)}
                    disabled={cancelMut.isPending}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Provider Hub ─────────────────────────────────────────────────────────── */
function ProviderHub({ user }) {
  const navigate = useNavigate();
  const { data: appData } = useQuery({
    queryKey: ['my-application'],
    queryFn: () => servicesAPI.getMyApplication().then(r => r.data),
    retry: false,
  });
  const { data: bookingsData } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => servicesAPI.getMyBookings().then(r => r.data),
    enabled: user.role === 'provider',
  });

  const bookings = bookingsData?.bookings || [];
  const upcoming = bookings.filter(b => ['pending','confirmed'].includes(b.status));

  if (!appData) return (
    <div className="flex flex-col items-center py-16 gap-4">
      <Briefcase size={36} className="text-slate-300"/>
      <p className="font-semibold text-slate-500 text-sm">No provider application found</p>
      <button onClick={() => navigate('/provider-register')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ background:'#0d9488' }}>
        <Briefcase size={14}/> Apply as a Provider
      </button>
    </div>
  );

  if (appData.approval_status === 'pending') return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 border border-amber-200" style={{ background:'#fffbeb' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-amber-800"/>
          </div>
          <div>
            <p className="font-bold" style={{color:'#78350f'}}>Application Under Review</p>
            <p className="text-sm mt-1" style={{color:'#92400e'}}>
              Your <strong>{appData.service_label}</strong> application is being reviewed by our team.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${appData.passed ? 'bg-teal-100 text-teal-700' : 'bg-amber-200 text-amber-800'}`}>
                Assessment: {appData.assessment_score}% {appData.passed ? '- PASS' : `(min ${appData.min_pass_score}%)`}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-400 mb-3">What happens next</p>
        {['Admin reviews your application and credentials','You receive a notification on approval','Log in to access your Provider Hub'].map((s,i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <div className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
              style={{ background:'#0d9488' }}>{i+1}</div>
            <p className="text-xs text-slate-600">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (appData.approval_status === 'rejected') return (
    <div className="rounded-2xl p-5 border border-red-200 bg-red-50">
      <AlertCircle size={24} className="text-red-500 mb-2"/>
      <p className="font-bold text-red-900">Application Not Approved</p>
      {appData.admin_notes && <p className="text-sm text-red-700 mt-2">{appData.admin_notes}</p>}
      <button onClick={() => navigate('/provider-register')} className="mt-4 text-sm font-semibold text-red-600 hover:underline">
        Re-apply
      </button>
    </div>
  );

  // Approved provider hub
  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="rounded-2xl p-4 text-white"
        style={{ background:'linear-gradient(135deg,#0d9488,#0891b2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <BadgeCheck size={20} className="text-white"/>
          </div>
          <div>
            <p className="font-bold">Welcome, {user.full_name?.split(' ')[0]}</p>
            <p className="text-white/80 text-xs">{appData.service_label} - Verified Provider</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Upcoming', value:upcoming.length, color:'#0d9488' },
          { label:'Total', value:bookings.length, color:'#0891b2' },
          { label:'Score', value:`${appData.assessment_score}%`, color:'#059669' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
            <p className="text-xl font-black" style={{ color:s.color }}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">Upcoming Sessions</p>
          <div className="space-y-2">
            {upcoming.slice(0,5).map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={14} className="text-teal-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate capitalize">{b.service_type} session</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(b.requested_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
                    {b.start_time && ` at ${b.start_time}`}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: b.status==='confirmed'?'#f0fdfa':'#fef3c7', color: b.status==='confirmed'?'#0d9488':'#d97706' }}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/profile')}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-600 transition-all">
        Edit My Profile
      </button>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab]               = useState('browse');
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [profileProvider, setProfileProvider] = useState(null);
  const [page, setPage]             = useState(1);

  const { data: typesData } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => servicesAPI.getTypes().then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
  const types = typesData || [];

  const { data: providersData, isLoading } = useQuery({
    queryKey: ['providers', filterType, filterRegion, search, page],
    queryFn: () => servicesAPI.getProviders({
      service_type: filterType || undefined,
      region: filterRegion || undefined,
      search: search || undefined,
      page,
      per_page: 12,
    }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });

  const providers = providersData?.providers || [];
  const total     = providersData?.total || 0;
  const isProvider = user?.role === 'provider';
  const hasProviderAccess = isProvider || ['patient','family','caregiver','clinician','admin'].includes(user?.role);

  const TABS = [
    { id:'browse',   label:'Browse',       count: total },
    { id:'bookings', label:'My Bookings',  count: null  },
    ...(hasProviderAccess ? [{ id:'hub', label: isProvider ? 'Provider Hub' : 'Provider Hub', count:null }] : []),
  ];

  const handleMessage = (p) => {
    navigate('/messages');
    toast.info(`Open Messages to chat with ${p.full_name}`);
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="min-h-screen pb-10 space-y-5">
      <PageHeader
        image="/resources/african/african-clinical-team.jpg"
        title="Services"
        subtitle="Browse verified palliative care professionals - book, rate, and communicate directly"
        icon={Briefcase}
      >
        <button onClick={() => navigate('/provider-register')}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 text-xs font-semibold">
          <Sparkles size={13}/> Join as Provider
        </button>
      </PageHeader>

      {/* Tab bar */}
      <div className="px-6">
        <div className="flex border-b border-slate-200 gap-0 overflow-x-auto">
          {TABS.map(({ id, label, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0
                ${tab===id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
              {count !== null && count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums ${tab===id?'bg-teal-100 text-teal-700':'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {/* ── BROWSE ── */}
        {tab === 'browse' && (
          <div className="space-y-4">
            {/* Search + filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by name, specialisation, location..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Service type pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[{key:'',label:'All'},...types].map(t => (
                  <button key={t.key||'all'} onClick={() => { setFilterType(t.key||''); setPage(1); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 border-2 transition-all"
                    style={{
                      borderColor: filterType===(t.key||'') ? (t.color||'#0d9488') : '#e2e8f0',
                      background:  filterType===(t.key||'') ? `${t.color||'#0d9488'}12` : 'white',
                      color:       filterType===(t.key||'') ? (t.color||'#0d9488') : '#64748b',
                    }}>
                    {t.key && (() => { const Icon=ICON_MAP[t.icon_name]||Heart; return <Icon size={11}/>; })()}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPage(1); }}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">All Regions</option>
                  {['Greater Accra','Ashanti','Western','Eastern','Central','Northern',
                    'Upper East','Upper West','Volta','Brong-Ahafo'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} color="#0d9488" />
                  <span className="text-xs text-slate-600 font-medium">Available today</span>
                </div>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 size={26} className="animate-spin text-teal-400"/>
                <p className="text-sm text-slate-500">Loading providers...</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center">
                <Briefcase size={36} className="text-slate-300 mx-auto mb-3"/>
                <p className="font-bold text-slate-500 text-sm">No providers found</p>
                <p className="text-xs text-slate-400 mt-1">Try different filters or be the first to join!</p>
                <button onClick={() => navigate('/provider-register')}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white mx-auto"
                  style={{ background:'#0d9488' }}>
                  <Sparkles size={12}/> Register as a Provider
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {providers.map(p => (
                      <ProviderCard key={p.id} p={p}
                        onBook={setBookingProvider}
                        onMessage={handleMessage}
                        onViewProfile={setProfileProvider}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {total > 12 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:border-teal-400 transition-all">
                      Previous
                    </button>
                    <span className="text-xs text-slate-500">Page {page} of {Math.ceil(total/12)}</span>
                    <button onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/12)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:border-teal-400 transition-all">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'bookings' && <MyBookings />}
        {tab === 'hub' && <ProviderHub user={user} />}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {bookingProvider && <BookingModal provider={bookingProvider} onClose={() => setBookingProvider(null)} />}
        {profileProvider && <ProfileModal provider={profileProvider} onClose={() => setProfileProvider(null)} onBook={setBookingProvider} />}
      </AnimatePresence>
    </motion.div>
  );
}
