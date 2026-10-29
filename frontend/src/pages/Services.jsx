/**
 * Services — Professional healthcare provider marketplace
 * Designed like AgedCare Ghana / Zocdoc — real cards, clickable profiles,
 * search+filter, hero banner, category sections.
 * Route: /services
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Star, MapPin, Shield, Award, BadgeCheck, Clock,
  Calendar, MessageCircle, ChevronRight, X, Loader2,
  CheckCircle, Briefcase, Stethoscope, Activity, Heart,
  Brain, Users, Hand, FileText, ArrowRight, Filter,
  Phone, Mail, Globe, Sparkles, TrendingUp,
} from 'lucide-react';
import { servicesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ICON_MAP = { Stethoscope, Activity, Heart, Brain, Users, Hand, FileText };
const TYPE_META = {
  nurse:           { color:'#0d9488', label:'Palliative Nurse',          icon:Stethoscope },
  doctor:          { color:'#0891b2', label:'Palliative Physician',       icon:Activity    },
  physiotherapist: { color:'#059669', label:'Physiotherapist',            icon:Heart       },
  counsellor:      { color:'#7c3aed', label:'Counsellor',                 icon:Brain       },
  nanny:           { color:'#d97706', label:'Specialist Nanny',           icon:Users       },
  masseur:         { color:'#ea580c', label:'Therapeutic Masseur',        icon:Hand        },
  social_worker:   { color:'#db2777', label:'Social Worker',              icon:Users       },
  chaplain:        { color:'#0369a1', label:'Chaplain',                   icon:Heart       },
};

/* ─── Stars ─────────────────────────────────────────────────────────────── */
function Stars({ value, count, size = 13 }) {
  if (value == null) return <span className="text-[11px] text-slate-400 italic">No reviews</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size} strokeWidth={1.5}
          className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
      ))}
      <span className="ml-1 text-xs font-bold text-slate-700">{value.toFixed(1)}</span>
      {count > 0 && <span className="text-[11px] text-slate-400 ml-0.5">({count})</span>}
    </span>
  );
}

/* ─── Provider Card ─────────────────────────────────────────────────────── */
function ProviderCard({ p, onView, onBook, onMessage }) {
  const meta = TYPE_META[p.service_type] || { color:'#0d9488', label:p.service_type, icon:Briefcase };
  const Icon = meta.icon;
  const initials = p.full_name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

  return (
    <motion.div
      layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-4, boxShadow:'0 12px 40px rgba(0,0,0,0.12)' }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group"
      style={{ boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}
      onClick={() => onView(p)}
    >
      {/* Top colour bar */}
      <div className="h-1" style={{ background:`linear-gradient(to right,${meta.color},${meta.color}88)` }}/>

      <div className="p-5">
        {/* Avatar + name + badge */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
              style={{ background:`linear-gradient(135deg,${meta.color},${meta.color}bb)` }}>
              {initials}
            </div>
            {p.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center border-2 border-white">
                <BadgeCheck size={11} className="text-white" strokeWidth={2.5}/>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight truncate">{p.full_name}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
              style={{ background:`${meta.color}15`, color:meta.color }}>
              <Icon size={9} strokeWidth={2.5}/> {meta.label}
            </span>
            {p.region && (
              <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin size={10}/> {p.region}
              </p>
            )}
          </div>
        </div>

        {/* Specialisation */}
        {p.specialisation && (
          <p className="text-[11px] font-semibold text-slate-600 mb-2 truncate">{p.specialisation}</p>
        )}

        {/* Bio */}
        {p.bio && (
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{p.bio}</p>
        )}

        {/* Rating + experience */}
        <div className="flex items-center justify-between mb-3">
          <Stars value={p.average_rating} count={p.total_reviews} size={12}/>
          {p.years_experience > 0 && (
            <span className="text-[10px] text-slate-400 font-medium">{p.years_experience}y exp</span>
          )}
        </div>

        {/* Verification badges */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {p.nmc_pin && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              <Award size={9}/> NMC
            </span>
          )}
          {p.is_verified && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Shield size={9}/> Verified
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1.5">
          <button onClick={e => { e.stopPropagation(); onView(p); }}
            className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all hover:brightness-95"
            style={{ background:`${meta.color}12`, color:meta.color }}>
            <FileText size={13}/> Profile
          </button>
          <button onClick={e => { e.stopPropagation(); onBook(p); }}
            className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold text-white transition-all hover:brightness-90"
            style={{ background:meta.color }}>
            <Calendar size={13}/> Book
          </button>
          <button onClick={e => { e.stopPropagation(); onMessage(p); }}
            className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-all hover:brightness-95"
            style={{ background:'#0d948812', color:'#0d9488' }}>
            <MessageCircle size={13}/> Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Profile Sheet ─────────────────────────────────────────────────────── */
function ProfileSheet({ provider, onClose, onBook, onMessage }) {
  const meta = TYPE_META[provider.service_type] || { color:'#0d9488', label:provider.service_type };
  const { data: full } = useQuery({
    queryKey: ['provider-full', provider.id],
    queryFn: () => servicesAPI.getProvider(provider.id).then(r => r.data),
    enabled: !!provider.id,
  });
  const p = full || provider;
  const initials = p.full_name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose}/>
      <motion.div
        initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
        transition={{ type:'spring', damping:30, stiffness:300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="h-2" style={{ background:`linear-gradient(to right,${meta.color},${meta.color}88)` }}/>
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0"
              style={{ background:`linear-gradient(135deg,${meta.color},${meta.color}bb)` }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-lg leading-tight">{p.full_name}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background:`${meta.color}15`, color:meta.color }}>
                {meta.label}
              </span>
              {p.average_rating != null && (
                <div className="mt-1"><Stars value={p.average_rating} count={p.total_reviews}/></div>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 flex-shrink-0">
              <X size={18}/>
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
          {/* About */}
          {p.bio && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{p.bio}</p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {l:'Experience', v:p.years_experience ? `${p.years_experience} years` : null},
              {l:'Region', v:p.region},
              {l:'Specialisation', v:p.specialisation},
              {l:'Facility', v:p.facility_name},
              {l:'Total bookings', v:p.total_bookings||0},
            ].filter(r=>r.v).map(r=>(
              <div key={r.l} className="bg-slate-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-slate-400 font-semibold">{r.l}</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">{r.v}</p>
              </div>
            ))}
          </div>

          {/* Verification */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verification</h3>
            <div className="flex flex-wrap gap-2">
              {p.nmc_pin && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200"><Award size={13}/>NMC PIN: {p.nmc_pin}</span>}
              {p.is_verified && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><Shield size={13}/>Ghana Card Verified</span>}
              {p.is_professional && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-teal-700 border border-teal-200"><BadgeCheck size={13}/>Aura Verified</span>}
            </div>
          </div>

          {/* Qualifications */}
          {p.qualifications?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qualifications</h3>
              <div className="space-y-1.5">
                {p.qualifications.map((q,i)=>(
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle size={13} className="text-teal-500 flex-shrink-0 mt-0.5"/>
                    <span className="text-slate-700 font-medium">{q.title}</span>
                    {q.institution && <span className="text-slate-400">- {q.institution}</span>}
                    {q.year && <span className="text-slate-400">({q.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {p.ratings?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reviews</h3>
              <div className="space-y-2">
                {p.ratings.slice(0,5).map((r,i)=>(
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(n=>(
                        <Star key={n} size={11} className={n<=r.rating?'text-amber-400 fill-amber-400':'text-slate-200'}/>
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
        </div>

        {/* Fixed bottom CTA */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex gap-3">
          <button onClick={()=>onMessage(p)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-teal-500 text-teal-600 hover:bg-teal-50 transition-all">
            <MessageCircle size={15}/> Message
          </button>
          <button onClick={()=>onBook(p)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-90"
            style={{ background:meta.color }}>
            <Calendar size={15}/> Book Session
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Booking Modal ─────────────────────────────────────────────────────── */
function BookingModal({ provider, onClose }) {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const meta = TYPE_META[provider.service_type] || { color:'#0d9488' };

  const slotsQ = useQuery({
    queryKey: ['slots', provider.id, date],
    queryFn: () => servicesAPI.getProviderSlots(provider.id, date).then(r=>r.data),
    enabled: !!date,
  });

  const mut = useMutation({
    mutationFn: d => servicesAPI.createBooking(d),
    onSuccess: () => {
      toast.success('Booking request sent to provider!');
      qc.invalidateQueries({ queryKey:['my-bookings'] });
      onClose();
    },
    onError: e => toast.error(e?.response?.data?.detail || 'Booking failed'),
  });

  const today   = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now()+90*24*3600000).toISOString().split('T')[0];
  const initials = provider.full_name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,scale:0.95,y:16}} animate={{opacity:1,scale:1,y:0}}
        exit={{opacity:0,scale:0.95}} transition={{duration:0.2}}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e=>e.stopPropagation()}>
        <div className="h-1.5" style={{background:meta.color}}/>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{background:meta.color}}>{initials}</div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">{provider.full_name}</p>
            <p className="text-[11px] text-slate-500">{TYPE_META[provider.service_type]?.label}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={15}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Date *</label>
            <input type="date" value={date} min={today} max={maxDate}
              onChange={e=>{setDate(e.target.value);setTime('');}}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"/>
          </div>
          {date && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Time</label>
              {slotsQ.isLoading
                ? <div className="flex justify-center py-3"><Loader2 size={18} className="animate-spin text-teal-500"/></div>
                : slotsQ.data?.slots?.length === 0
                  ? <p className="text-xs text-slate-500 italic">No available slots on this date. Try another day.</p>
                  : <div className="flex flex-wrap gap-1.5">
                      {(slotsQ.data?.slots||[]).map(s=>(
                        <button key={s} type="button" onClick={()=>setTime(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
                          style={{
                            borderColor:time===s?meta.color:'#e2e8f0',
                            background:time===s?`${meta.color}12`:'white',
                            color:time===s?meta.color:'#64748b',
                          }}>{s}</button>
                      ))}
                    </div>
              }
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
              placeholder="Describe what you need..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"/>
          </div>
          <button
            onClick={()=>mut.mutate({provider_id:provider.id,service_type:provider.service_type,requested_date:date,start_time:time||undefined,notes})}
            disabled={!date||mut.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{background:meta.color}}>
            {mut.isPending?<><Loader2 size={14} className="animate-spin"/>Sending...</>:<><Calendar size={14}/>Send Booking Request</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── My Bookings ────────────────────────────────────────────────────────── */
function MyBookings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => servicesAPI.getMyBookings().then(r=>r.data),
  });
  const bookings = data?.bookings || [];
  const SM = {
    pending:   {color:'#d97706',bg:'#fef3c7',label:'Pending'},
    confirmed: {color:'#0d9488',bg:'#f0fdfa',label:'Confirmed'},
    completed: {color:'#059669',bg:'#f0fdf4',label:'Completed'},
    cancelled: {color:'#ef4444',bg:'#fef2f2',label:'Cancelled'},
  };
  const cancelMut = useMutation({
    mutationFn: id=>servicesAPI.cancelBooking(id),
    onSuccess: ()=>{toast.success('Booking cancelled');qc.invalidateQueries({queryKey:['my-bookings']});},
    onError: ()=>toast.error('Cancel failed'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-teal-500"/></div>;
  if (!bookings.length) return (
    <div className="text-center py-20">
      <Calendar size={40} className="text-slate-300 mx-auto mb-3"/>
      <p className="font-semibold text-slate-500">No bookings yet</p>
      <p className="text-xs text-slate-400 mt-1">Browse providers and book a session</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {bookings.map(b=>{
        const sm = SM[b.status]||SM.pending;
        const meta = TYPE_META[b.service_type]||{color:'#0d9488'};
        const initials = b.provider_name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
        return (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="h-1" style={{background:meta.color}}/>
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{background:meta.color}}>{initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm text-slate-800 truncate">{b.provider_name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{background:sm.bg,color:sm.color}}>{sm.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{b.service_type?.replace('_',' ')} session</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={10}/>{new Date(b.requested_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</span>
                  {b.start_time && <span className="flex items-center gap-1"><Clock size={10}/>{b.start_time}</span>}
                </div>
                {b.status==='pending' && (
                  <button onClick={()=>cancelMut.mutate(b.id)} disabled={cancelMut.isPending}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold">
                    Cancel booking
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

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [page, setPage]                 = useState(1);
  const [viewProvider, setViewProvider] = useState(null);
  const [bookProvider, setBookProvider] = useState(null);
  const [tab, setTab]                   = useState('browse');

  const { data: typesData } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => servicesAPI.getTypes().then(r=>r.data),
    staleTime: 10*60*1000,
  });
  const types = typesData || [];

  const { data: providersData, isLoading } = useQuery({
    queryKey: ['providers', filterType, filterRegion, search, page],
    queryFn: () => servicesAPI.getProviders({
      service_type: filterType||undefined,
      region: filterRegion||undefined,
      search: search||undefined,
      page, per_page: 12,
    }).then(r=>r.data),
    staleTime: 2*60*1000,
    keepPreviousData: true,
  });
  const providers = providersData?.providers || [];
  const total     = providersData?.total || 0;

  const handleMessage = (p) => {
    navigate('/messages');
    toast.info(`Open Messages to chat with ${p.full_name}`);
  };

  const REGIONS = ['Greater Accra','Ashanti','Western','Eastern','Central','Northern','Upper East','Upper West','Volta','Brong-Ahafo'];

  return (
    <div className="min-h-screen pb-12" style={{background:'var(--page-bg)'}}>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden mb-8"
        style={{background:'linear-gradient(135deg,#0b3028 0%,#0d6b5e 40%,#0891b2 100%)'}}>
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage:'radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)'}}/>
        <div className="relative max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-teal-300"/>
            <span className="text-teal-300 text-xs font-bold uppercase tracking-widest">Ghana Healthcare Services</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2 leading-tight">
            Find a verified care professional
          </h1>
          <p className="text-white/70 text-sm mb-6 max-w-lg">
            Browse NMC-verified nurses, palliative doctors, physiotherapists, counsellors and more.
            Every provider is Ghana Card verified and rated by patients.
          </p>

          {/* Hero search */}
          <div className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input
                value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Search by name, specialisation, or region..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-lg"
              />
            </div>
            <button className="px-4 py-3 rounded-xl text-sm font-bold text-white bg-white/15 hover:bg-white/25 border border-white/25 transition-all flex-shrink-0">
              <Filter size={16}/>
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            {[
              {v: total || '16+', l:'Verified providers'},
              {v:'8', l:'Service categories'},
              {v:'100%', l:'Ghana Card verified'},
            ].map(s=>(
              <div key={s.l}>
                <p className="text-xl font-black text-white">{s.v}</p>
                <p className="text-white/60 text-[11px]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Category chips ── */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={()=>{setFilterType('');setPage(1);}}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 whitespace-nowrap flex-shrink-0 transition-all ${
                filterType==='' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}>
              All professionals
            </button>
            {types.map(t=>{
              const Icon = ICON_MAP[t.icon_name]||Heart;
              const sel = filterType===t.key;
              return (
                <button key={t.key} onClick={()=>{setFilterType(sel?'':t.key);setPage(1);}}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 whitespace-nowrap flex-shrink-0 transition-all"
                  style={{
                    borderColor: sel?t.color:'#e2e8f0',
                    background: sel?t.color:'white',
                    color: sel?'white':'#475569',
                  }}>
                  <Icon size={13}/> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-200 mb-6 gap-0">
          {[
            {id:'browse', label:'Browse Providers'},
            {id:'bookings', label:'My Bookings'},
          ].map(({id,label})=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                tab===id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>{label}</button>
          ))}
        </div>

        {/* ── Browse tab ── */}
        {tab==='browse' && (
          <div className="space-y-5">
            {/* Region filter + count */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-slate-600">
                <strong className="text-slate-900">{total}</strong> provider{total!==1?'s':''} found
                {filterType && <> in <strong>{TYPE_META[filterType]?.label}</strong></>}
              </p>
              <select value={filterRegion} onChange={e=>{setFilterRegion(e.target.value);setPage(1);}}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">All Regions</option>
                {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48 gap-3">
                <Loader2 size={26} className="animate-spin text-teal-400"/>
                <p className="text-sm text-slate-500">Loading providers...</p>
              </div>
            ) : providers.length===0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center">
                <Briefcase size={40} className="text-slate-300 mx-auto mb-3"/>
                <p className="font-semibold text-slate-500">No providers found</p>
                <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching by a different term</p>
                <button onClick={()=>{setSearch('');setFilterType('');setFilterRegion('');}}
                  className="mt-4 text-teal-600 text-sm font-semibold hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {providers.map(p=>(
                      <ProviderCard key={p.id} p={p}
                        onView={setViewProvider}
                        onBook={setBookProvider}
                        onMessage={handleMessage}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {total>12 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:border-teal-400 transition-all bg-white">
                      Previous
                    </button>
                    <span className="text-xs text-slate-500 px-2">Page {page} of {Math.ceil(total/12)}</span>
                    <button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/12)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:border-teal-400 transition-all bg-white">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab==='bookings' && <MyBookings/>}

        {/* Join as provider CTA */}
        {tab==='browse' && (
          <div className="mt-10 rounded-2xl p-6 flex items-center gap-4"
            style={{background:'linear-gradient(135deg,#0d9488,#0891b2)'}}>
            <div className="flex-1">
              <p className="font-bold text-white text-base">Are you a healthcare professional?</p>
              <p className="text-white/70 text-sm mt-0.5">Join our verified network and connect with patients who need your expertise.</p>
            </div>
            <button onClick={()=>navigate('/provider-register')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-700 text-sm font-bold hover:bg-teal-50 transition-all flex-shrink-0">
              Apply Now <ArrowRight size={14}/>
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {viewProvider && (
          <ProfileSheet
            provider={viewProvider}
            onClose={()=>setViewProvider(null)}
            onBook={p=>{setViewProvider(null);setBookProvider(p);}}
            onMessage={handleMessage}
          />
        )}
        {bookProvider && (
          <BookingModal provider={bookProvider} onClose={()=>setBookProvider(null)}/>
        )}
      </AnimatePresence>
    </div>
  );
}
