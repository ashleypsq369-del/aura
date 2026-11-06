/**
 * Journal.jsx - Private grief/care journal
 * Redesigned: portal modal, health mood tracking, writing prompts,
 * word count, tone detection, care-connected features
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, X, Calendar, Trash2, Lock,
  ArrowLeft, RefreshCw, Heart, Brain, Feather,
  TrendingUp, Smile, Frown, Meh, Wind, Flame,
  ChevronRight, Quote,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';
import useConfirmDialog from '../hooks/useConfirmDialog';

/* ── Emotional tone classifier ────────────────────────────────────────── */
const TONE_WORDS = {
  grief:      ['miss','lost','gone','grief','grieve','death','died','passed','mourning','empty','void'],
  hope:       ['hope','better','healing','peace','grateful','thankful','strength','joy','happy','bright'],
  fear:       ['afraid','scared','fear','worry','anxious','anxiety','dread','uncertain','panic'],
  anger:      ['angry','anger','frustrated','unfair','bitter','rage','furious','resentment'],
  love:       ['love','cherish','care','dear','precious','beautiful','heart','family','together'],
  sadness:    ['sad','cry','tears','hurt','pain','lonely','alone','broken','difficult','heavy'],
  acceptance: ['accept','peace','okay','understand','letting go','release','journey','ready'],
};

const TONES = {
  grief:      { label:'Grief',      icon:Frown,      color:'#64748b', bg:'rgba(100,116,139,0.1)', border:'rgba(100,116,139,0.25)' },
  hope:       { label:'Hope',       icon:TrendingUp,  color:'#059669', bg:'rgba(5,150,105,0.1)',  border:'rgba(5,150,105,0.25)'   },
  fear:       { label:'Anxiety',    icon:Wind,        color:'#d97706', bg:'rgba(217,119,6,0.1)',  border:'rgba(217,119,6,0.25)'   },
  anger:      { label:'Frustration',icon:Flame,       color:'#ea580c', bg:'rgba(234,88,12,0.1)', border:'rgba(234,88,12,0.25)'   },
  love:       { label:'Love',       icon:Heart,       color:'#e11d48', bg:'rgba(225,29,72,0.1)', border:'rgba(225,29,72,0.25)'   },
  sadness:    { label:'Sadness',    icon:Meh,         color:'#0891b2', bg:'rgba(8,145,178,0.1)', border:'rgba(8,145,178,0.25)'   },
  acceptance: { label:'Acceptance', icon:Smile,       color:'#0d9488', bg:'rgba(13,148,136,0.1)','border':'rgba(13,148,136,0.25)'},
  neutral:    { label:'Reflection', icon:Feather,     color:'#7c3aed', bg:'rgba(124,58,237,0.1)','border':'rgba(124,58,237,0.25)'},
};

function detectTone(text) {
  if (!text || text.length < 10) return 'neutral';
  const lower = text.toLowerCase();
  const scores = {};
  for (const [t, words] of Object.entries(TONE_WORDS)) {
    scores[t] = words.filter(w => lower.includes(w)).length;
  }
  const top = Object.entries(scores).sort(([,a],[,b]) => b-a)[0];
  return top && top[1] > 0 ? top[0] : 'neutral';
}

const PROMPTS = [
  "What do you want to remember about today?",
  "What are you feeling right now?",
  "What would you like to say but haven't?",
  "What brings you comfort today?",
  "What memory made you smile recently?",
  "What do you wish others understood?",
  "How are you taking care of yourself?",
  "What small joy did you notice today?",
  "What are you grateful for in this moment?",
  "What do you need to let go of?",
  "What feels heavy that you're carrying?",
  "What would you say to yourself a year from now?",
];

const HEALTH_TAGS = [
  { label:'Pain today',       color:'#ef4444' },
  { label:'Low energy',       color:'#f97316' },
  { label:'Feeling anxious',  color:'#eab308' },
  { label:'Hard day',         color:'#8b5cf6' },
  { label:'Grateful',         color:'#10b981' },
  { label:'Family time',      color:'#0891b2' },
  { label:'Good sleep',       color:'#059669' },
  { label:'Medication notes', color:'#6366f1' },
];

/* ── New Entry Modal ──────────────────────────────────────────────────── */
function NewEntryModal({ onClose, onSubmit, isPending, patientId }) {
  const [text, setText] = useState('');
  const [prompt, setPrompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [tags, setTags] = useState([]);
  const textareaRef = useRef(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tone = detectTone(text);
  const toneConfig = TONES[tone];
  const ToneIcon = toneConfig.icon;

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const toggleTag = (label) => setTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({
      patient_id: patientId,
      entry_type: 'journal',
      content: text,
      prompt_used: prompt,
      is_private: true,
      health_tags: tags,
    });
  };

  return createPortal(
    <>
      <motion.div key="je-bg" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.45)' }} />
      <div style={{ position:'fixed', inset:0, zIndex:9501, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}>
        <motion.div key="je-card" initial={{ opacity:0, y:18, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:10 }} transition={{ type:'spring', damping:28, stiffness:340 }}
          onClick={e => e.stopPropagation()}
          style={{ pointerEvents:'all', background:'var(--card-bg)', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', border:'1px solid var(--card-border)' }}>

          {/* Accent bar */}
          <div style={{ height:3, background:'linear-gradient(90deg,#7c3aed,#0d9488)', flexShrink:0 }} />

          {/* Header */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Feather size={15} style={{ color:'#7c3aed' }} />
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--text-900)', margin:0 }}>New Journal Entry</p>
                <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 0' }}>
                  {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'transparent', border:'1px solid var(--card-border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:12 }}>

            {/* Prompt */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'rgba(124,58,237,0.06)', borderRadius:10, border:'1px solid rgba(124,58,237,0.15)' }}>
              <Quote size={13} style={{ color:'#7c3aed', flexShrink:0 }} />
              <p style={{ fontSize:12, color:'#7c3aed', fontStyle:'italic', flex:1, margin:0 }}>{prompt}</p>
              <button onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
                style={{ width:24, height:24, borderRadius:6, background:'rgba(124,58,237,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <RefreshCw size={11} style={{ color:'#7c3aed' }} />
              </button>
            </div>

            {/* Textarea */}
            <div style={{ position:'relative' }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                placeholder="Let your thoughts flow... this is your private space."
                style={{ width:'100%', padding:'12px', fontSize:14, lineHeight:1.7, border:'1.5px solid var(--card-border)', borderRadius:10, background:'var(--page-bg)', color:'var(--text-800)', outline:'none', resize:'none', fontFamily:'inherit', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
              />
              {/* Word count + tone */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:11, color:'var(--text-400)' }}>{words} word{words !== 1 ? 's' : ''}</span>
                {text.length > 20 && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:99, background:toneConfig.bg, border:`1px solid ${toneConfig.border}` }}>
                    <ToneIcon size={11} style={{ color:toneConfig.color }} />
                    <span style={{ fontSize:10, fontWeight:700, color:toneConfig.color }}>{toneConfig.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Health tags */}
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-400)', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 8px' }}>How does this connect to your health today?</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {HEALTH_TAGS.map(({ label, color }) => {
                  const active = tags.includes(label);
                  return (
                    <button key={label} type="button" onClick={() => toggleTag(label)}
                      style={{ padding:'4px 11px', borderRadius:99, fontSize:11, fontWeight:600, border:`1.5px solid ${active ? color : 'var(--card-border)'}`, background: active ? color + '18' : 'transparent', color: active ? color : 'var(--text-500)', cursor:'pointer', transition:'all 0.12s' }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy note */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Lock size={11} style={{ color:'var(--text-400)', flexShrink:0 }} />
              <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>This entry is completely private. Only you can see it.</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding:'12px 18px', background:'var(--page-bg)', borderTop:'1px solid var(--card-border)', display:'flex', gap:10, flexShrink:0 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--card-border)', background:'transparent', color:'var(--text-600)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isPending || !text.trim()}
              style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background: !text.trim() ? '#e2e8f0' : '#7c3aed', color: !text.trim() ? '#94a3b8' : '#fff', fontSize:13, fontWeight:700, cursor: !text.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {isPending ? 'Saving...' : <><Feather size={13} /> Save Entry</>}
            </button>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}

/* ── Entry Card ───────────────────────────────────────────────────────── */
function EntryCard({ entry, onDelete, userId, idx }) {
  const [expanded, setExpanded] = useState(false);
  const tone = detectTone(entry.content);
  const toneConfig = TONES[tone];
  const ToneIcon = toneConfig.icon;
  const words = entry.content?.trim().split(/\s+/).length || 0;
  const isLong = entry.content?.length > 300;
  const displayContent = expanded || !isLong ? entry.content : entry.content.slice(0, 280) + '...';
  const tags = entry.health_tags || [];

  return (
    <motion.article
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: idx * 0.04 }}
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden group hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
    >
      {/* Top accent */}
      <div className="h-0.5 w-full" style={{
        background: ['linear-gradient(to right,#7c3aed,#0d9488)','linear-gradient(to right,#0d9488,#0891b2)','linear-gradient(to right,#e11d48,#7c3aed)','linear-gradient(to right,#d97706,#e11d48)'][idx % 4]
      }} />

      <div className="p-4">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-[var(--text-400)]" />
            <time className="text-xs font-semibold text-[var(--text-500)]">
              {new Date(entry.created_at).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </time>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-400)]">{words}w</span>
            {entry.user_id === userId && (
              <button onClick={() => onDelete(entry.id)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-400)] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Prompt used */}
        {entry.prompt_used && (
          <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg bg-[var(--page-bg)] border border-[var(--card-border)]">
            <Quote size={11} className="text-[var(--text-400)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-500)] italic">{entry.prompt_used}</p>
          </div>
        )}

        {/* Content */}
        <p className="text-sm text-[var(--text-800)] leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </p>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Footer — tone + tags */}
        <div className="mt-3 pt-3 border-t border-[var(--card-border)] flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
            style={{ background: toneConfig.bg, border:`1px solid ${toneConfig.border}`, color: toneConfig.color }}>
            <ToneIcon size={10} /> {toneConfig.label}
          </div>
          {tags.map(tag => (
            <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--page-bg)] border border-[var(--card-border)] text-[var(--text-500)]">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function Journal() {
  const { user } = useAuth();
  const { confirm: confirmAction, ConfirmDialog } = useConfirmDialog();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const scope = searchParams.get('scope') || 'family';
  const [showModal, setShowModal] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const [contextName, setContextName] = useState(null);
  const queryClient = useQueryClient();

  const { data: patientData } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => (await apiClient.get('/api/bereavement/my-patient')).data,
    enabled: !paramPatientId,
  });

  const { data: legacyData } = useQuery({
    queryKey: ['my-legacy-access'],
    queryFn: async () => (await apiClient.get('/api/legacy/my-legacy-access')).data,
    enabled: !!paramPatientId && scope === 'legacy',
  });

  useEffect(() => {
    if (paramPatientId) {
      setPatientId(parseInt(paramPatientId, 10));
      if (scope === 'legacy') {
        const match = legacyData?.legacy_access?.find(a => a.patient_id === parseInt(paramPatientId, 10));
        setContextName(match?.patient_name || 'Legacy Patient');
      }
      return;
    }
    if (patientData?.patient_id) { setPatientId(patientData.patient_id); setContextName(patientData.patient_name); }
    else if (patientData?.patient?.id) { setPatientId(patientData.patient.id); setContextName(patientData.patient.full_name); }
  }, [patientData, paramPatientId, scope, legacyData]);

  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['journal', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      return (await apiClient.get(`/api/bereavement/entries/${patientId}?entry_type=journal&include_private=true`)).data;
    },
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => (await apiClient.post('/api/bereavement/entry', data)).data,
    onSuccess: () => { queryClient.invalidateQueries(['journal', patientId]); setShowModal(false); toast.success('Entry saved'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await apiClient.delete(`/api/bereavement/entry/${id}`)).data,
    onSuccess: () => { queryClient.invalidateQueries(['journal', patientId]); toast.success('Entry deleted'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete entry'),
  });

  const handleDelete = async (id) => {
    if (await confirmAction({ title: 'Delete this journal entry?', body: 'This cannot be undone.', confirmLabel: 'Delete', variant: 'danger' })) {
      deleteMutation.mutate(id);
    }
  };

  const entries = entriesData?.entries || [];
  const scopeLabel = scope === 'legacy' ? `Legacy Journal${contextName ? ` - ${contextName}` : ''}` : 'My Journal';

  if (!patientId && !isLoading) return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-8 max-w-sm text-center">
        <BookOpen size={36} className="mx-auto mb-4 text-[var(--text-300)]" />
        <p className="text-sm font-bold text-[var(--text-800)] mb-2">No Patient Linked</p>
        <p className="text-xs text-[var(--text-500)]">The journal is available to family members and caregivers. Contact your care team.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/journal-writing.jpg"
        title={scopeLabel}
        subtitle="A private space for your thoughts, feelings, and reflections"
        icon={BookOpen}
        stats={entries.length > 0 ? [
          { label: 'Entries', value: entries.length, color: '#7c3aed' },
          { label: 'This month', value: entries.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).length, color: '#0d9488' },
        ] : undefined}
      >
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <Plus size={13} /> New Entry
        </button>
      </PageHeader>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {paramPatientId && (
          <Link to="/continuity-bridge" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-500)] hover:text-teal-600 transition">
            <ArrowLeft size={13} /> Back to Continuity Bridge
          </Link>
        )}

        {/* Privacy + lock strip */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
          <Lock size={14} className="text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-[var(--text-800)]">Completely private</p>
            <p className="text-[11px] text-[var(--text-400)]">Only you can read what you write here. Write freely, without judgment.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry, idx) => (
              <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} userId={user?.id} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--card-bg)] rounded-xl border border-dashed border-[var(--card-border)] p-10 text-center">
            <Feather size={32} className="text-[var(--text-300)] mx-auto mb-3" />
            <p className="text-sm font-bold text-[var(--text-700)] mb-1">Your journal awaits</p>
            <p className="text-xs text-[var(--text-400)] mb-5 italic">
              "{PROMPTS[Math.floor(Math.random() * PROMPTS.length)]}"
            </p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition">
              <Feather size={14} /> Write First Entry
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <NewEntryModal
            onClose={() => setShowModal(false)}
            onSubmit={createMutation.mutate}
            isPending={createMutation.isPending}
            patientId={patientId}
          />
        )}
      </AnimatePresence>
      <ConfirmDialog />
    </div>
  );
}
