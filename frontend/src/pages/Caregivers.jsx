/**
 * Caregivers — HomeCare Ghana–inspired redesign
 * Professional worker profile cards: NMC badge · Ghana Card · star rating
 * AI burnout analysis · workload bar · quick navigation actions
 * New: "What's New" features showcase tab
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, HeartHandshake, AlertTriangle, Search, X,
  UserPlus, Phone, Mail, Zap, Heart, Star,
  Loader2, Brain, ChevronLeft, ChevronRight,
  TrendingUp, BarChart2, ListChecks, CheckCircle,
  Shield, Award, MapPin, MessageCircle, Calendar,
  Activity, Navigation, Stethoscope, Sparkles,
  Camera, FileText, Globe, ChevronRight as CRight,
  BadgeCheck, Clock, Info,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  caregiversAPI, caregiverIntelligenceAPI, advancedMlAPI,
  patientsAPI, trustProfileAPI,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import SearchableSelect from '../components/ui/SearchableSelect';

/* ─── constants ──────────────────────────────────────────────────────────── */
const TEAL_GRADS = [
  ['#0d9488','#0891b2'], ['#0891b2','#1d4ed8'], ['#059669','#0d9488'],
  ['#0d9488','#059669'], ['#0891b2','#0d9488'], ['#1d4ed8','#0891b2'],
  ['#065f46','#0d9488'], ['#1e40af','#0891b2'],
];
const PAGE_SIZE = 9;
const getInitials = n => n ? n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '??';

/* ─── helpers ────────────────────────────────────────────────────────────── */
const capColor = s => ({
  available:   { dot:'#10b981', label:'Available',   bg:'#10b98115', text:'#065f46' },
  at_capacity: { dot:'#f59e0b', label:'At Capacity', bg:'#f59e0b15', text:'#92400e' },
  overloaded:  { dot:'#ef4444', label:'Overloaded',  bg:'#ef444415', text:'#991b1b' },
})[s] || { dot:'#10b981', label:'Available', bg:'#10b98115', text:'#065f46' };

function Stars({ value, count }) {
  if (value == null) return <span className="text-[11px] text-slate-400 italic">No reviews</span>;
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

function VerifyBadge({ icon: Icon, label, color = '#0d9488' }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: `${color}15`, color }}>
      <Icon size={9} strokeWidth={2.5} />{label}
    </span>
  );
}

function BurnoutDot({ level }) {
  const l = String(level || 'low').toLowerCase();
  if (l === 'critical') return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Critical burnout</span>;
  if (l === 'high')     return <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"/>High risk</span>;
  if (l === 'moderate') return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>Moderate</span>;
  return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Healthy</span>;
}

/* ─── Worker Profile Card (HomeCare Ghana style) ─────────────────────────── */
function WorkerCard({ cg, workload, burnoutLevel, gradPair, onBurnoutClick, onMessage, onViewProfile }) {
  const wl = workload || {};
  const capInfo = capColor(wl.capacity_status);
  const activePatients = wl.active_patients ?? 0;
  const workloadPct = Math.min(wl.workload_score ?? 0, 100);
  const [g1, g2] = gradPair;

  const { data: trust } = useQuery({
    queryKey: ['trust-profile', cg.id],
    queryFn: () => trustProfileAPI.get(cg.id).then(r => r.data),
    enabled: !!cg.id,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Coloured top band */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${g1}, ${g2})` }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
          >
            {getInitials(cg.full_name)}
          </div>

          {/* Name + role + availability */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight truncate">{cg.full_name}</p>
            <p className="text-[11px] text-slate-500 capitalize">{cg.role || 'Caregiver'}</p>
            {trust?.specialisation && (
              <p className="text-[10px] text-teal-600 font-medium truncate">{trust.specialisation}</p>
            )}
          </div>

          {/* Availability dot */}
          <span
            className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: capInfo.bg, color: capInfo.text }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: capInfo.dot }} />
            {capInfo.label}
          </span>
        </div>

        {/* Verification badges row */}
        <div className="flex flex-wrap gap-1">
          {trust?.nmc_pin && <VerifyBadge icon={Award} label={`NMC ${trust.nmc_pin}`} color="#0d9488" />}
          {trust?.ghana_card_verified && <VerifyBadge icon={Shield} label="Ghana Card" color="#0891b2" />}
          {trust?.is_professional && <VerifyBadge icon={BadgeCheck} label="Verified Pro" color="#059669" />}
          {!trust?.nmc_pin && !trust?.ghana_card_verified && (
            <span className="text-[10px] text-slate-400 italic">Badges loading…</span>
          )}
        </div>

        {/* Star rating */}
        <Stars value={trust?.average_rating} count={trust?.total_reviews ?? 0} />

        {/* Workload bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-slate-400 font-semibold">Workload</span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: workloadPct > 75 ? '#ef4444' : workloadPct >= 50 ? '#f59e0b' : '#10b981' }}>
              {activePatients} patients · {workloadPct}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${workloadPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                background: workloadPct > 75
                  ? 'linear-gradient(to right, #ef4444, #dc2626)'
                  : workloadPct >= 50
                    ? 'linear-gradient(to right, #f59e0b, #d97706)'
                    : `linear-gradient(to right, ${g1}, ${g2})`,
              }}
            />
          </div>
        </div>

        {/* Burnout + location row */}
        <div className="flex items-center justify-between">
          <BurnoutDot level={burnoutLevel} />
          {trust?.region && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <MapPin size={9} /> {trust.region}
            </span>
          )}
        </div>

        {/* Contact row */}
        <div className="space-y-0.5">
          {cg.email && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
              <Mail size={10} className="text-slate-400 flex-shrink-0" /> {cg.email}
            </p>
          )}
          {cg.phone && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Phone size={10} className="text-slate-400 flex-shrink-0" /> {cg.phone}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={onMessage}
            className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all"
            style={{ background: '#0d948812', color: '#0d9488' }}
          >
            <MessageCircle size={14} />
            Message
          </button>
          <button
            onClick={onViewProfile}
            className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all"
            style={{ background: '#0891b212', color: '#0891b2' }}
          >
            <Shield size={14} />
            Trust Profile
          </button>
          <button
            onClick={onBurnoutClick}
            className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all"
            style={{ background: '#7c3aed12', color: '#7c3aed' }}
          >
            <Brain size={14} />
            AI Burnout
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Trust Profile Modal ─────────────────────────────────────────────────── */
function TrustProfileModal({ cg, onClose }) {
  const { data: trust, isLoading } = useQuery({
    queryKey: ['trust-profile', cg?.id],
    queryFn: () => trustProfileAPI.get(cg.id).then(r => r.data),
    enabled: !!cg?.id,
  });

  if (!cg) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header band */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm">
              {getInitials(cg.full_name)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{cg.full_name}</p>
              <p className="text-[11px] text-slate-500">{cg.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 size={22} className="animate-spin text-teal-500" />
            </div>
          ) : trust ? (
            <>
              {/* Verification badges */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-2">Verification</p>
                <div className="flex flex-wrap gap-2">
                  {trust.nmc_pin
                    ? <VerifyBadge icon={Award} label={`NMC PIN: ${trust.nmc_pin}`} color="#0d9488" />
                    : <span className="text-[11px] text-slate-400 italic">NMC PIN not on file</span>
                  }
                  {trust.ghana_card_verified
                    ? <VerifyBadge icon={Shield} label="Ghana Card Verified" color="#0891b2" />
                    : <span className="text-[11px] text-slate-400 italic">Ghana Card not verified</span>
                  }
                  {trust.is_professional && <VerifyBadge icon={BadgeCheck} label={trust.professional_title || 'Verified Pro'} color="#059669" />}
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1">Service Rating</p>
                <Stars value={trust.average_rating} count={trust.total_reviews} />
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {trust.specialisation && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-slate-400 font-medium">Specialisation</p>
                    <p className="font-semibold text-slate-700">{trust.specialisation}</p>
                  </div>
                )}
                {trust.facility_name && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-slate-400 font-medium">Facility</p>
                    <p className="font-semibold text-slate-700 truncate">{trust.facility_name}</p>
                  </div>
                )}
                {trust.region && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-slate-400 font-medium">Region</p>
                    <p className="font-semibold text-slate-700">{trust.region}</p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-slate-400 font-medium">Active Patients</p>
                  <p className="font-semibold text-slate-700">{trust.active_patients ?? 0}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No trust profile data available</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Burnout Modal ───────────────────────────────────────────────────────── */
function BurnoutModal({ cg, data, loading, onClose }) {
  if (!cg) return null;
  const pct   = data ? Math.round((data.burnout_score ?? 0) * 100) : 0;
  const level = data?.burnout_level || 'low';
  const ringBg = level === 'critical' ? '#ef4444' : level === 'high' ? '#f97316' : level === 'moderate' ? '#f59e0b' : '#10b981';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5" style={{ background: `linear-gradient(to right, ${ringBg}, ${ringBg}88)` }} />
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: ringBg }}>
              {getInitials(cg.full_name)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{cg.full_name}</p>
              <p className="text-[11px] text-slate-500">AI Burnout Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 size={24} className="animate-spin text-teal-500" />
              <p className="text-sm text-slate-500">Analysing burnout risk…</p>
            </div>
          )}
          {!loading && !data && (
            <div className="flex flex-col items-center py-12 gap-2 text-slate-400">
              <Brain size={32} className="text-slate-300" />
              <p className="text-sm">No burnout data available</p>
            </div>
          )}
          {!loading && data && (
            <>
              <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0"
                  style={{ background: ringBg }}>
                  {pct}%
                </div>
                <div>
                  <p className="font-bold text-slate-900 capitalize">{level} Risk</p>
                  <p className="text-xs text-slate-500">ML burnout probability</p>
                  <BurnoutDot level={level} />
                </div>
              </div>

              {data.signals?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-2">Risk Signals</p>
                  <div className="space-y-1.5">
                    {data.signals.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1" />
                        <span className="font-semibold text-slate-700">{s.signal}</span>
                        {s.value && <span className="text-slate-500 ml-auto">{s.value}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!data.signals || data.signals.length === 0) && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800">No burnout signals detected</p>
                </div>
              )}

              {data.recommendations?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-2">Recommendations</p>
                  <div className="space-y-1.5">
                    {data.recommendations.filter(Boolean).map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-teal-50 border border-teal-100 rounded-lg text-xs text-teal-800">
                        <TrendingUp size={12} className="flex-shrink-0 mt-0.5 text-teal-500" /> {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── New Features Showcase Tab ───────────────────────────────────────────── */
const FEATURES = [
  {
    num: '01',
    title: 'Post-Visit Care Report',
    desc: 'After every completed appointment, a full care report is auto-generated — vitals, medications given, nurse notes — and sent instantly to the patient\'s family.',
    icon: FileText,
    color: '#0d9488',
    where: 'Appointments page → completed appointment card → "View Report"',
    route: '/appointments',
  },
  {
    num: '02',
    title: 'Enhanced Status Flow',
    desc: 'Appointments now follow a 6-step visual journey: Scheduled → Nurse Assigned → En Route → Visit Active → Report Ready → Completed.',
    icon: Navigation,
    color: '#0891b2',
    where: 'Appointments page → any appointment card → status badge stepper',
    route: '/appointments',
  },
  {
    num: '03',
    title: 'Caregiver Trust Profile',
    desc: 'Every nurse and caregiver shows their NMC PIN badge, Ghana Card verification, star rating from patients, and specialisation area.',
    icon: Shield,
    color: '#059669',
    where: 'This page → any worker card → "Trust Profile" button',
    route: '/caregivers',
  },
  {
    num: '04',
    title: 'Family Dashboard Hero',
    desc: '"Last visit was 2 days ago with Nurse Abena — Vitals: Stable." A hero card greets family members with the most recent visit summary.',
    icon: Heart,
    color: '#e11d48',
    where: 'Dashboard → Family view → top hero card',
    route: '/dashboard',
  },
  {
    num: '05',
    title: 'Wound Care Module',
    desc: 'Track wound healing with per-site logs: size, depth, exudate, healing stage (improving / stable / worsening), and treatment applied.',
    icon: Camera,
    color: '#7c3aed',
    where: 'Patient Detail → "Wound Care" quick action card',
    route: '/patients',
  },
  {
    num: '06',
    title: 'Cultural Care Profile',
    desc: 'Record each patient\'s preferred language (Twi, Ga, Ewe, Hausa…), religious preference, cultural practices, and spiritual care requests.',
    icon: Globe,
    color: '#0369a1',
    where: 'Patient Detail page → bottom section "Cultural Care Profile"',
    route: '/patients',
  },
  {
    num: '07',
    title: 'Care Pathway Selector',
    desc: 'A guided 4-step wizard helps families choose the right care type: Nursing Care, Clinical Support, Family Support, Medical Escort, or Respite Care.',
    icon: Stethoscope,
    color: '#b45309',
    where: 'My Space → "Care Pathway" quick action card',
    route: '/care-pathway-selector',
  },
  {
    num: '08',
    title: 'Service Quality Ratings',
    desc: '5-star ratings with punctuality, communication, care quality and cleanliness breakdown after every completed visit.',
    icon: Star,
    color: '#d97706',
    where: 'Appointments page → completed visit → "Rate This Visit" button',
    route: '/appointments',
  },
];

function FeatureShowcase({ navigate }) {
  return (
    <div className="px-6 space-y-4">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-start gap-3">
        <Sparkles size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-teal-800 text-sm">8 New Ghana Homecare Features</p>
          <p className="text-xs text-teal-600 mt-0.5">
            Inspired by AgedCare Ghana, HomeCare GH, GNA Healthcare, JASBEK, Nurse 24/7, and CareEdge.
            Each feature is fully live — tap a card to navigate there.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FEATURES.map((f, idx) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(f.route)}
            >
              <div className="h-1" style={{ background: f.color }} />
              <div className="p-4 flex gap-3">
                {/* Number + icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${f.color}15`, color: f.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-400">{f.num}</span>
                    <p className="font-bold text-slate-800 text-sm">{f.title}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{f.desc}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                    <Info size={9} />
                    <span className="truncate">{f.where}</span>
                    <CRight size={10} className="ml-auto text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */
export default function Caregivers() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const isStaff     = user?.role === 'clinician' || user?.role === 'admin';
  const isCaregiver = user?.role === 'caregiver';

  const [tab,            setTab]            = useState('team');
  const [search,         setSearch]         = useState('');
  const [filter,         setFilter]         = useState('all');
  const [page,           setPage]           = useState(0);
  const [burnoutCg,      setBurnoutCg]      = useState(null);
  const [trustCg,        setTrustCg]        = useState(null);
  const [burnoutMap,     setBurnoutMap]     = useState({});
  const [burnoutLoading, setBurnoutLoading] = useState(false);
  const [optPid,         setOptPid]         = useState('');
  const [manualCg,       setManualCg]       = useState('');
  const [manualPt,       setManualPt]       = useState('');

  useEffect(() => { setPage(0); }, [search, filter]);

  /* queries */
  const { data: cgRaw,   isLoading } = useQuery({ queryKey: ['caregivers-all'], queryFn: () => caregiversAPI.getAll().then(r => r.data), staleTime: 5*60*1000, retry: false });
  const { data: assnRaw }            = useQuery({ queryKey: ['cg-assignments'], queryFn: () => caregiversAPI.getAssignments().then(r => r.data), enabled: isStaff, staleTime: 3*60*1000, retry: false });
  const { data: myPtsRaw }           = useQuery({ queryKey: ['cg-my-patients'], queryFn: () => caregiverIntelligenceAPI.getMyPatients().then(r => r.data), enabled: isCaregiver, staleTime: 3*60*1000, retry: false });
  const { data: teamRaw }            = useQuery({ queryKey: ['cg-team'],        queryFn: () => caregiverIntelligenceAPI.getTeamOverview().then(r => r.data), staleTime: 5*60*1000, retry: false });
  const { data: burnoutRaw }         = useQuery({ queryKey: ['cg-burnout'],     queryFn: () => advancedMlAPI.getAllCaregiverBurnout().then(r => r.data), staleTime: 10*60*1000, retry: false });
  const { data: patientsRaw }        = useQuery({ queryKey: ['patients-list'],  queryFn: () => patientsAPI.getAll().then(r => r.data), enabled: isStaff, staleTime: 5*60*1000 });

  /* normalise */
  const caregivers  = Array.isArray(cgRaw)             ? cgRaw             : cgRaw?.caregivers   || [];
  const assignments = Array.isArray(assnRaw)            ? assnRaw           : assnRaw?.assignments || [];
  const myPatients  = Array.isArray(myPtsRaw?.patients) ? myPtsRaw.patients : [];
  const burnoutList = Array.isArray(burnoutRaw)          ? burnoutRaw        : burnoutRaw?.caregivers || [];
  const patientList = Array.isArray(patientsRaw)         ? patientsRaw       : patientsRaw?.patients  || [];

  /* derived maps */
  const workloadMap = useMemo(() => {
    const m = {};
    (teamRaw?.team_metrics || []).forEach(tm => { m[tm.caregiver_id] = tm.workload; });
    return m;
  }, [teamRaw]);

  const burnoutLevelMap = useMemo(() => {
    const m = {};
    burnoutList.forEach(b => {
      const id = b.caregiver_id || b.user_id;
      if (id) m[id] = String(b.burnout_level || b.risk_level || 'low').toLowerCase();
    });
    return m;
  }, [burnoutList]);

  const burnoutAlerts = Object.values(burnoutLevelMap).filter(l => l === 'critical' || l === 'high').length;
  const overloaded    = Object.values(workloadMap).filter(w => w?.capacity_status === 'overloaded').length;

  const FILTERS = [
    { id: 'all',       label: 'All',       count: caregivers.length },
    { id: 'available', label: 'Available', count: caregivers.length - overloaded },
    { id: 'burnout',   label: 'At Risk',   count: burnoutAlerts },
    { id: 'overloaded',label: 'Overloaded',count: overloaded },
  ];

  const filtered = useMemo(() => caregivers.filter(cg => {
    if (search) {
      const s = search.toLowerCase();
      if (!(cg.full_name || '').toLowerCase().includes(s) &&
          !(cg.role || '').toLowerCase().includes(s) &&
          !(cg.email || '').toLowerCase().includes(s)) return false;
    }
    const wl = workloadMap[cg.id] || {};
    const bl = burnoutLevelMap[cg.id] || 'low';
    if (filter === 'burnout')    return ['critical','high','moderate'].includes(bl);
    if (filter === 'overloaded') return wl.capacity_status === 'overloaded';
    if (filter === 'available')  return wl.capacity_status !== 'overloaded';
    return true;
  }), [caregivers, search, filter, workloadMap, burnoutLevelMap]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* mutations */
  const assignMutation = useMutation({
    mutationFn: d => caregiversAPI.assign(d),
    onSuccess: () => { toast.success('Patient assigned'); setManualCg(''); setManualPt(''); qc.invalidateQueries(['cg-assignments']); qc.invalidateQueries(['cg-team']); },
    onError: e => toast.error(e?.response?.data?.detail || 'Assignment failed'),
  });
  const removeMutation = useMutation({
    mutationFn: id => caregiversAPI.removeAssignment(id),
    onSuccess: () => { toast.success('Assignment removed'); qc.invalidateQueries(['cg-assignments']); },
    onError: () => toast.error('Failed to remove'),
  });
  const optimalMutation = useMutation({
    mutationFn: pid => caregiverIntelligenceAPI.assignOptimal(pid),
    onSuccess: d => { toast.success(`AI assigned ${d?.data?.caregiver_name || 'caregiver'}`); setOptPid(''); qc.invalidateQueries(['cg-assignments']); qc.invalidateQueries(['cg-team']); },
    onError: e => toast.error(e?.response?.data?.detail || 'Auto-assign failed'),
  });

  const openBurnout = useCallback((cg) => {
    setBurnoutCg(cg);
    if (!burnoutMap[cg.id]) {
      setBurnoutLoading(true);
      advancedMlAPI.getCaregiverBurnout(cg.id)
        .then(r => { setBurnoutMap(m => ({ ...m, [cg.id]: r.data })); setBurnoutLoading(false); })
        .catch(() => setBurnoutLoading(false));
    }
  }, [burnoutMap]);

  const TABS = [
    { id: 'team',        label: 'Team',         Icon: Users       },
    { id: 'analytics',   label: 'Analytics',    Icon: BarChart2   },
    { id: 'assignments', label: 'Assignments',  Icon: ListChecks  },
    { id: 'whats-new',   label: "What's New",   Icon: Sparkles    },
    ...(isCaregiver ? [{ id: 'mypatients', label: 'My Patients', Icon: Heart }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="min-h-screen pb-10 space-y-5">

      <PageHeader
        image="/resources/african/african-caregiver.jpg"
        title="Care Team"
        subtitle="Verified nurses · caregivers · clinicians · Ghana Card & NMC trust profiles"
        icon={HeartHandshake}
      />

      {/* Burnout alert banner */}
      {burnoutAlerts > 0 && (
        <div className="px-6">
          <div className="border-l-4 border-l-red-500 bg-red-50 border border-red-200 rounded-r-xl p-3.5 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">{burnoutAlerts} team member{burnoutAlerts > 1 ? 's' : ''} at burnout risk</p>
              {burnoutList.filter(b => ['critical','high'].includes(String(b.burnout_level || b.risk_level || '').toLowerCase()))
                .map((b, i) => (
                  <p key={i} className="text-xs text-red-700 mt-0.5"><strong>{b.caregiver_name || b.name}</strong> — {b.burnout_level || b.risk_level} risk</p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="px-6">
        <div className="flex border-b border-slate-200 gap-0 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0
                ${tab === id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              <Icon size={14} />
              {label}
              {id === 'team' && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full tabular-nums ${tab === id ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                  {caregivers.length}
                </span>
              )}
              {id === 'whats-new' && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-teal-500 text-white">8</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: TEAM ══ */}
      {tab === 'team' && (
        <div className="px-6 space-y-4">
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, role or email…"
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none text-sm shadow-sm" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded bg-slate-100 hover:bg-red-100 flex items-center justify-center">
                  <X size={11} className="text-slate-500" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1.5 py-1 shadow-sm flex-shrink-0">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${filter === f.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'}`}>
                  {f.label}
                  <span className={`text-[10px] font-black px-1 rounded-full tabular-nums
                    ${filter === f.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Worker cards grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64 gap-3">
              <Loader2 size={26} className="animate-spin text-teal-400" />
              <p className="text-sm text-slate-500">Loading care team…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 h-64 gap-3">
              <Users size={36} className="text-slate-300" />
              <p className="font-bold text-slate-500">No caregivers match</p>
              <button onClick={() => { setSearch(''); setFilter('all'); }} className="text-xs text-teal-600 hover:underline font-semibold">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {paginated.map((cg, i) => (
                    <WorkerCard
                      key={cg.id || i}
                      cg={cg}
                      workload={workloadMap[cg.id]}
                      burnoutLevel={burnoutLevelMap[cg.id]}
                      gradPair={TEAL_GRADS[(page * PAGE_SIZE + i) % TEAL_GRADS.length]}
                      onBurnoutClick={() => openBurnout(cg)}
                      onMessage={() => navigate('/messages')}
                      onViewProfile={() => setTrustCg(cg)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pageCount > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-400">{filtered.length} workers · page {page + 1} of {pageCount}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:border-teal-400 disabled:opacity-40 flex items-center justify-center text-slate-500 shadow-sm transition-all">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: pageCount }, (_, idx) => (
                      <button key={idx} onClick={() => setPage(idx)}
                        className={`h-2 rounded-full transition-all duration-200 ${idx === page ? 'w-6 bg-teal-600' : 'w-2 bg-slate-300 hover:bg-teal-400'}`} />
                    ))}
                    <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page === pageCount - 1}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:border-teal-400 disabled:opacity-40 flex items-center justify-center text-slate-500 shadow-sm transition-all">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ TAB: ANALYTICS ══ */}
      {tab === 'analytics' && (
        <div className="px-6 space-y-5">
          {!teamRaw ? (
            <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
              <BarChart2 size={40} className="text-slate-300" />
              <p className="font-medium">Team analytics unavailable</p>
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div className="flex flex-wrap gap-2">
                {[
                  { l: 'Team Size',         v: teamRaw.team_size ?? caregivers.length,        icon: Users,         c: '#0d9488' },
                  { l: 'Assigned Patients', v: teamRaw.total_patients_assigned ?? '—',        icon: Heart,         c: '#0891b2' },
                  { l: 'Avg per Carer',     v: teamRaw.average_patients_per_caregiver ?? '—', icon: TrendingUp,    c: '#059669' },
                  { l: 'Overloaded',        v: teamRaw.overloaded_caregivers ?? 0,             icon: AlertTriangle, c: '#ef4444' },
                ].map(({ l, v, icon: Icon, c }) => (
                  <div key={l}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-white shadow-sm"
                    style={{ borderColor: `${c}30` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${c}15`, color: c }}>
                      <Icon size={14} />
                    </div>
                    <span className="text-xl font-black tabular-nums leading-none" style={{ color: c }}>{v}</span>
                    <span className="text-xs font-semibold text-slate-500">{l}</span>
                  </div>
                ))}
              </div>

              {/* Workload table */}
              {teamRaw.team_metrics?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">Workload Distribution</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Current patient load per caregiver</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {teamRaw.team_metrics.map((m, i) => {
                      const pct = Math.min(m.workload?.workload_score ?? 0, 100);
                      const pts = m.workload?.active_patients ?? 0;
                      const cap = m.workload?.capacity_status || 'available';
                      const ci = capColor(cap);
                      const [g1, g2] = TEAL_GRADS[i % TEAL_GRADS.length];
                      return (
                        <div key={m.caregiver_id} className="flex items-center gap-3 px-5 py-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
                            style={{ background: `linear-gradient(135deg,${g1},${g2})` }}>
                            {(m.caregiver_name || '?')[0]}
                          </div>
                          <div className="w-36 min-w-0 flex-shrink-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{m.caregiver_name}</p>
                            <p className="text-xs text-slate-400">{pts} patient{pts !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
                                style={{ background: pct > 75 ? '#ef4444' : pct >= 50 ? '#f59e0b' : `linear-gradient(to right,${g1},${g2})` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-black tabular-nums w-9 text-right flex-shrink-0"
                            style={{ color: pct > 75 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981' }}>{pct}%</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                            style={{ background: ci.bg, color: ci.text }}>{cap.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {teamRaw.recommendations?.filter(Boolean).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400">AI Recommendations</p>
                  {teamRaw.recommendations.filter(Boolean).map((rec, i) => (
                    <div key={i} className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm
                      ${rec.includes('⚠') || rec.includes('❌') ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-teal-50 border-teal-200 text-teal-800'}`}>
                      <TrendingUp size={13} className="flex-shrink-0 mt-0.5" />{rec}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ TAB: ASSIGNMENTS ══ */}
      {tab === 'assignments' && (
        <div className="px-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Manual assign */}
            {isStaff && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <UserPlus size={15} className="text-teal-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Manual Assignment</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Caregiver</label>
                    <SearchableSelect accent="teal"
                      value={manualCg ? String(manualCg) : null}
                      onChange={v => setManualCg(v || '')}
                      placeholder="Select caregiver…"
                      options={caregivers.map(cg => ({ value: String(cg.id), label: cg.full_name, sublabel: cg.role || 'Caregiver' }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Patient</label>
                    <SearchableSelect accent="teal"
                      value={manualPt ? String(manualPt) : null}
                      onChange={v => setManualPt(v || '')}
                      placeholder="Search patient…"
                      options={patientList.map(p => ({ value: String(p.id), label: p.full_name, sublabel: `${p.patient_code || '#' + p.id} · ${p.age}y` }))}
                    />
                  </div>
                  <button
                    onClick={() => { if (manualCg && manualPt) assignMutation.mutate({ caregiver_id: parseInt(manualCg), patient_id: parseInt(manualPt), notes: '' }); }}
                    disabled={!manualCg || !manualPt || assignMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                    style={{ background: '#0d9488' }}>
                    {assignMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    {assignMutation.isPending ? 'Assigning…' : 'Assign Patient'}
                  </button>
                </div>

                {/* AI Auto-Assign */}
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-teal-500" />
                    <h4 className="font-bold text-slate-700 text-sm">AI Auto-Assign</h4>
                    <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">ML</span>
                  </div>
                  <p className="text-xs text-slate-500">ML selects the best available caregiver based on workload and patient complexity.</p>
                  <SearchableSelect accent="teal"
                    value={optPid ? String(optPid) : null}
                    onChange={v => setOptPid(v || '')}
                    placeholder="Select patient to auto-assign…"
                    options={patientList.map(p => ({ value: String(p.id), label: p.full_name, sublabel: `${p.patient_code || '#' + p.id}` }))}
                  />
                  <button onClick={() => { if (optPid) optimalMutation.mutate(parseInt(optPid)); }}
                    disabled={!optPid || optimalMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                    style={{ background: '#0891b2' }}>
                    {optimalMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {optimalMutation.isPending ? 'Assigning…' : 'Auto-Assign Best Caregiver'}
                  </button>
                </div>
              </div>
            )}

            {/* Current assignments list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks size={15} className="text-teal-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Current Assignments</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{assignments.length}</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {assignments.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
                    <ListChecks size={28} className="text-slate-300" />
                    <p className="text-sm">No active assignments</p>
                  </div>
                ) : assignments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-[10px] flex-shrink-0">
                      {getInitials(a.caregiver_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-xs truncate">{a.caregiver_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">→ {a.patient_name}</p>
                    </div>
                    {isStaff && (
                      <button onClick={() => removeMutation.mutate(a.id)}
                        className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 flex-shrink-0">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: WHAT'S NEW ══ */}
      {tab === 'whats-new' && <FeatureShowcase navigate={navigate} />}

      {/* ══ TAB: MY PATIENTS (caregiver only) ══ */}
      {tab === 'mypatients' && (
        <div className="px-6 space-y-3">
          {myPatients.length === 0 ? (
            <div className="flex flex-col items-center bg-white rounded-2xl border border-dashed border-slate-300 py-16 gap-3">
              <Heart size={32} className="text-slate-300" />
              <p className="font-bold text-slate-500">No patients assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myPatients.map(p => {
                const pid = p.patient_id || p.id;
                return (
                  <motion.div key={pid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/patients/${pid}`)}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {getInitials(p.patient_name || p.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{p.patient_name || p.full_name}</p>
                      <p className="text-[11px] text-slate-500">{p.primary_diagnosis || 'Patient'}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {burnoutCg && (
          <BurnoutModal
            cg={burnoutCg}
            data={burnoutMap[burnoutCg.id]}
            loading={burnoutLoading}
            onClose={() => setBurnoutCg(null)}
          />
        )}
        {trustCg && (
          <TrustProfileModal
            cg={trustCg}
            onClose={() => setTrustCg(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
