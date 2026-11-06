/**
 * MemoryVault - Preserve cherished memories and life stories
 * Redesigned: portal modal, cleaner cards, theme clustering, health-connected
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Plus, Users, Lock, Globe, Trash2, ArrowLeft,
  X, Camera, Mic, Video, Edit3, Star, Quote, RefreshCw,
  Image, ChevronDown, ChevronUp,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import useConfirmDialog from '../hooks/useConfirmDialog';
import FormFileUpload from '../components/FormFileUpload';

/* ── Theme clustering ─────────────────────────────────────────────────── */
const THEMES = {
  joy:        { words:['laugh','happy','fun','smile','joy','celebrate','wonderful','amazing','beautiful','loved','bright','sunshine'], label:'Joy', color:'#f59e0b', bg:'rgba(245,158,11,0.08)' },
  family:     { words:['family','mother','father','son','daughter','sister','brother','children','grandchild','together','home','husband','wife'], label:'Family', color:'#e11d48', bg:'rgba(225,29,72,0.08)' },
  gratitude:  { words:['thank','grateful','gratitude','blessed','appreciate','gift','kindness','generous','care'], label:'Gratitude', color:'#0d9488', bg:'rgba(13,148,136,0.08)' },
  adventure:  { words:['travel','trip','journey','adventure','explore','holiday','vacation','visit','place','city','country'], label:'Adventures', color:'#0891b2', bg:'rgba(8,145,178,0.08)' },
  reflection: { words:['remember','memory','think','feel','thought','wonder','dream','hope','believe','heart','soul','spirit'], label:'Reflections', color:'#7c3aed', bg:'rgba(124,58,237,0.08)' },
};

function detectTheme(content) {
  const lower = (content || '').toLowerCase();
  for (const [key, cfg] of Object.entries(THEMES)) {
    if (cfg.words.some(w => lower.includes(w))) return { key, ...cfg };
  }
  return { key:'other', label:'Memory', color:'#64748b', bg:'rgba(100,116,139,0.08)' };
}

const GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#9d174d)',
  'linear-gradient(135deg,#0d9488,#0891b2)',
  'linear-gradient(135deg,#e11d48,#7c3aed)',
  'linear-gradient(135deg,#d97706,#ea580c)',
  'linear-gradient(135deg,#1d4ed8,#0d9488)',
  'linear-gradient(135deg,#059669,#0d9488)',
];

const MEMORY_PROMPTS = [
  "Tell a story about a moment you'll never forget...",
  "What memory of this person makes you smile?",
  "Describe a place that holds special meaning...",
  "What would you want them to be remembered for?",
  "Share a lesson they taught you...",
  "Describe their laugh, their voice, or their smile...",
];

/* ── Add Memory Modal ─────────────────────────────────────────────────── */
function AddMemoryModal({ onClose, onSubmit, isPending, patientId }) {
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [prompt, setPrompt] = useState(MEMORY_PROMPTS[0]);
  const textareaRef = useRef(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const theme = detectTheme(content);
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit({ patient_id: patientId, entry_type: 'memory', content, is_private: isPrivate });
  };

  return createPortal(
    <>
      <motion.div key="mv-bg" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.45)' }} />
      <div style={{ position:'fixed', inset:0, zIndex:9501, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}>
        <motion.div key="mv-card" initial={{ opacity:0, y:18, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:10 }} transition={{ type:'spring', damping:28, stiffness:340 }}
          onClick={e => e.stopPropagation()}
          style={{ pointerEvents:'all', background:'var(--card-bg)', borderRadius:14, width:'100%', maxWidth:540, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', border:'1px solid var(--card-border)' }}>

          <div style={{ height:3, background:'linear-gradient(90deg,#7c3aed,#e11d48,#0d9488)', flexShrink:0 }} />

          {/* Header */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(225,29,72,0.1)', border:'1px solid rgba(225,29,72,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Heart size={15} style={{ color:'#e11d48' }} />
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--text-900)', margin:0 }}>Preserve a Memory</p>
                <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 0' }}>Captured and kept forever</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'transparent', border:'1px solid var(--card-border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:12 }}>

            {/* Prompt */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'rgba(225,29,72,0.06)', borderRadius:10, border:'1px solid rgba(225,29,72,0.15)' }}>
              <Quote size={12} style={{ color:'#e11d48', flexShrink:0 }} />
              <p style={{ fontSize:12, color:'#e11d48', fontStyle:'italic', flex:1, margin:0 }}>{prompt}</p>
              <button onClick={() => setPrompt(MEMORY_PROMPTS[Math.floor(Math.random() * MEMORY_PROMPTS.length)])}
                style={{ width:22, height:22, borderRadius:6, background:'rgba(225,29,72,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <RefreshCw size={10} style={{ color:'#e11d48' }} />
              </button>
            </div>

            {/* Content textarea */}
            <div>
              <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)} rows={7}
                placeholder="Write your memory here..."
                style={{ width:'100%', padding:'12px', fontSize:14, lineHeight:1.7, border:'1.5px solid var(--card-border)', borderRadius:10, background:'var(--page-bg)', color:'var(--text-800)', outline:'none', resize:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#e11d48'}
                onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
              />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:5 }}>
                <span style={{ fontSize:11, color:'var(--text-400)' }}>{words} word{words !== 1 ? 's' : ''}</span>
                {content.length > 20 && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 8px', borderRadius:99, background:theme.bg, border:`1px solid ${theme.color}30` }}>
                    <span style={{ fontSize:10, fontWeight:700, color:theme.color }}>{theme.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy toggle */}
            <label style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:`1px solid var(--card-border)`, background:'var(--page-bg)', cursor:'pointer' }}>
              <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ width:14, height:14, accentColor:'#7c3aed' }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12, fontWeight:700, color:'var(--text-800)', margin:0 }}>Keep private</p>
                <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 0' }}>Only you can see this memory</p>
              </div>
              {isPrivate ? <Lock size={13} style={{ color:'#7c3aed' }} /> : <Globe size={13} style={{ color:'var(--text-400)' }} />}
            </label>

            {/* File attach */}
            <FormFileUpload category="memories" label="Attach a photo or file (optional)"
              description="Add a photo, audio or document to this memory"
              accept="image/*,audio/*,.pdf" multiple maxSizeMB={20} />
          </div>

          {/* Footer */}
          <div style={{ padding:'12px 18px', background:'var(--page-bg)', borderTop:'1px solid var(--card-border)', display:'flex', gap:10, flexShrink:0 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--card-border)', background:'transparent', color:'var(--text-600)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isPending || !content.trim()}
              style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background: !content.trim() ? '#e2e8f0' : 'linear-gradient(135deg,#7c3aed,#e11d48)', color: !content.trim() ? '#94a3b8' : '#fff', fontSize:13, fontWeight:700, cursor: !content.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {isPending ? 'Saving...' : <><Heart size={13} /> Save Memory</>}
            </button>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}

/* ── Memory Card ──────────────────────────────────────────────────────── */
function MemoryCard({ memory, onDelete, userId, idx }) {
  const [expanded, setExpanded] = useState(false);
  const theme = detectTheme(memory.content);
  const isLong = memory.content?.length > 280;
  const display = expanded || !isLong ? memory.content : memory.content.slice(0, 260) + '...';

  return (
    <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} transition={{ delay:idx * 0.04 }}
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden group hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      {/* Top accent */}
      <div className="h-0.5" style={{ background: GRADIENTS[idx % GRADIENTS.length] }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: theme.bg }}>
              <Heart size={12} style={{ color: theme.color }} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: theme.color }}>{theme.label}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="p-1 rounded" title={memory.is_private ? 'Private' : 'Shared'}>
              {memory.is_private ? <Lock size={11} className="text-[var(--text-400)]" /> : <Globe size={11} className="text-[var(--text-400)]" />}
            </div>
            {memory.user_id === userId && (
              <button onClick={() => onDelete(memory.id)}
                className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-[var(--text-400)] hover:text-red-500">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-[var(--text-700)] leading-relaxed whitespace-pre-wrap">{display}</p>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} className="mt-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1">
            {expanded ? <><ChevronUp size={11} /> Less</> : <><ChevronDown size={11} /> More</>}
          </button>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-400)]">{memory.author_name}</span>
          <span className="text-[11px] text-[var(--text-400)]">
            {new Date(memory.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function MemoryVault() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const scope = searchParams.get('scope') || 'family';
  const [showModal, setShowModal] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const [contextName, setContextName] = useState(null);
  const [showClustered, setShowClustered] = useState(false);
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();

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

  const { data: memoriesData, isLoading } = useQuery({
    queryKey: ['memories', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      return (await apiClient.get(`/api/bereavement/entries/${patientId}?entry_type=memory`)).data;
    },
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => (await apiClient.post('/api/bereavement/entry', data)).data,
    onSuccess: () => { queryClient.invalidateQueries(['memories', patientId]); setShowModal(false); toast.success('Memory saved'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save memory'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await apiClient.delete(`/api/bereavement/entry/${id}`)).data,
    onSuccess: () => { queryClient.invalidateQueries(['memories', patientId]); toast.success('Memory deleted'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to delete memory'),
  });

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete this memory?', body: 'This memory will be permanently removed. This cannot be undone.', confirmLabel: 'Delete Memory', variant: 'danger' })) {
      deleteMutation.mutate(id);
    }
  };

  const memories = memoriesData?.entries || [];

  // Theme clustering
  const clustered = useMemo(() => {
    const groups = { joy:[], family:[], gratitude:[], adventure:[], reflection:[], other:[] };
    memories.forEach(m => {
      const theme = detectTheme(m.content);
      if (theme.key === 'other') groups.other.push(m);
      else (groups[theme.key] = groups[theme.key] || []).push(m);
    });
    return groups;
  }, [memories]);
  const hasThemes = Object.entries(clustered).some(([k, v]) => k !== 'other' && v.length > 0);

  const patientName = contextName ?? patientData?.patient_name ?? patientData?.patient?.full_name;
  const scopeLabel = scope === 'legacy' ? 'Legacy Memory Vault' : 'Memory Vault';

  if (!patientId && !isLoading) return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-8 max-w-sm text-center">
        <Heart size={36} className="mx-auto mb-4 text-[var(--text-300)]" />
        <p className="text-sm font-bold text-[var(--text-800)] mb-2">No Patient Linked</p>
        <p className="text-xs text-[var(--text-500)]">The Memory Vault is available to patients and their families. Contact your care team.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/headers/header-memory.jpg"
        title={scopeLabel}
        subtitle={patientName ? `Preserving cherished moments ${patientName ? `for ${patientName}` : ''}` : 'Preserve cherished memories and life stories'}
        icon={Heart}
        stats={memories.length > 0 ? [
          { label: 'Memories', value: memories.length, color: '#e11d48' },
          { label: 'Private', value: memories.filter(m => m.is_private).length, color: '#7c3aed' },
        ] : undefined}
      >
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-lg border border-[var(--card-border)] text-xs font-semibold transition">
          <Plus size={13} /> Add Memory
        </button>
      </PageHeader>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        {paramPatientId && (
          <Link to="/continuity-bridge" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-500)] hover:text-teal-600 transition">
            <ArrowLeft size={13} /> Back to Continuity Bridge
          </Link>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : memories.length > 0 ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--text-400)]">{memories.length} memories preserved</p>
              {hasThemes && memories.length > 3 && (
                <button onClick={() => setShowClustered(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    showClustered ? 'bg-rose-600 text-white border-rose-600' : 'bg-[var(--card-bg)] text-[var(--text-600)] border-[var(--card-border)] hover:border-rose-300'
                  }`}>
                  {showClustered ? 'Grid View' : 'Group by Theme'}
                </button>
              )}
            </div>

            {showClustered && hasThemes ? (
              <div className="space-y-6">
                {Object.entries(THEMES).map(([key, theme]) => {
                  const group = clustered[key] || [];
                  if (!group.length) return null;
                  return (
                    <section key={key}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.color }}>{theme.label}</span>
                        <span className="text-[11px] text-[var(--text-400)]">({group.length})</span>
                        <div className="h-px flex-1 bg-[var(--card-border)]" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.map((m, i) => <MemoryCard key={m.id} memory={m} onDelete={handleDelete} userId={user?.id} idx={i} />)}
                      </div>
                    </section>
                  );
                })}
                {clustered.other?.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--text-300)] flex-shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-400)]">Other Memories</span>
                      <span className="text-[11px] text-[var(--text-400)]">({clustered.other.length})</span>
                      <div className="h-px flex-1 bg-[var(--card-border)]" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {clustered.other.map((m, i) => <MemoryCard key={m.id} memory={m} onDelete={handleDelete} userId={user?.id} idx={i} />)}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {memories.map((m, i) => <MemoryCard key={m.id} memory={m} onDelete={handleDelete} userId={user?.id} idx={i} />)}
              </div>
            )}
          </>
        ) : (
          <div className="bg-[var(--card-bg)] rounded-xl border border-dashed border-[var(--card-border)] p-10 text-center">
            <Heart size={36} className="mx-auto mb-3 text-[var(--text-300)]" />
            <p className="text-sm font-bold text-[var(--text-700)] mb-1">Your Memory Vault is empty</p>
            <p className="text-xs text-[var(--text-400)] mb-5">Start preserving the precious moments, stories, and reflections you want to keep forever.</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold transition"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#e11d48)' }}>
              <Heart size={14} /> Add First Memory
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <AddMemoryModal
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
