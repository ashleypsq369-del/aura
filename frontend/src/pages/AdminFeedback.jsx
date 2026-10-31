/**
 * AdminFeedback — Dedicated feedback & bug report management page
 * Route: /admin/feedback
 * Shows all submissions with stats, filters, full detail view, status management.
 * Admin-only.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquarePlus, Bug, ThumbsUp, Star, Search, Filter,
  X, ChevronRight, Clock, User, Globe, Smile, Meh, Frown,
  CheckCircle, AlertTriangle, Trash2, Download, RefreshCw,
  BarChart2, Loader2, Mail, Monitor,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

/* ── Type config ── */
const TYPE_CFG = {
  rating:      { icon:Star,        color:'#f59e0b', bg:'#fffbeb', label:'Rating'      },
  ux_feedback: { icon:ThumbsUp,    color:'#0d9488', bg:'#f0fdfa', label:'UX Feedback'  },
  bug_report:  { icon:Bug,         color:'#e11d48', bg:'#fef2f2', label:'Bug Report'   },
};

const BUG_COLORS = {
  ui_ux:'#7c3aed', broken:'#e11d48', slow:'#d97706',
  data:'#0891b2', crash:'#dc2626', other:'#64748b',
};

const RATING_ICONS = { 1:Frown, 2:Frown, 3:Meh, 4:Smile, 5:Smile };
const RATING_COLORS = { 1:'#ef4444', 2:'#f97316', 3:'#d97706', 4:'#22c55e', 5:'#0d9488' };

function relTime(ts) {
  if (!ts) return '—';
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  if (d < 604800) return `${Math.floor(d/86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' });
}

/* ── Stat card ── */
function StatCard({ icon:Icon, label, value, color, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl border-2 px-4 py-3 text-left w-full transition-all bg-[var(--card-bg)] ${
        active ? 'shadow-md' : 'border-[var(--card-border)] hover:border-slate-300'
      }`}
      style={{ borderColor: active ? color : undefined }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background:`${color}20` }}>
          <Icon size={13} style={{ color }}/>
        </div>
        <span className="text-[11px] font-semibold" style={{ color:'var(--text-500)' }}>{label}</span>
      </div>
      <p className="text-2xl font-black" style={{ color: active ? color : 'var(--text-900)' }}>{value}</p>
    </button>
  );
}

/* ── Detail panel ── */
function DetailPanel({ item, onClose, onDelete }) {
  const cfg  = TYPE_CFG[item.type] || TYPE_CFG.ux_feedback;
  const Icon = cfg.icon;
  const RIcon = item.rating ? RATING_ICONS[item.rating] : null;

  return (
    <motion.div
      initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:40 }}
      transition={{ type:'spring', damping:28, stiffness:300 }}
      className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden shadow-2xl"
      style={{ width:'min(460px,100vw)', background:'var(--card-bg)', borderLeft:'1px solid var(--card-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)] flex-shrink-0"
        style={{ background:`linear-gradient(135deg,${cfg.color}10,transparent)` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:cfg.bg }}>
            <Icon size={16} style={{ color:cfg.color }}/>
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color:'var(--text-900)' }}>{cfg.label}</p>
            <p className="text-[11px]" style={{ color:'var(--text-500)' }}>{item.page} · {relTime(item.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onDelete(item.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
            style={{ color:'#ef4444' }}>
            <Trash2 size={14}/>
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--page-bg)] transition-colors"
            style={{ color:'var(--text-500)' }}>
            <X size={15}/>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Rating */}
        {item.type === 'rating' && item.rating && (
          <div className="rounded-xl p-4 text-center" style={{ background:cfg.bg }}>
            {RIcon && <RIcon size={36} style={{ color:RATING_COLORS[item.rating], margin:'0 auto 8px', display:'block', fill:RATING_COLORS[item.rating] }}/>}
            <p className="text-3xl font-black" style={{ color:RATING_COLORS[item.rating] }}>{item.rating}/5</p>
            <p className="text-sm font-semibold mt-1" style={{ color:'var(--text-700)' }}>{item.label}</p>
          </div>
        )}

        {/* UX Feedback */}
        {item.type === 'ux_feedback' && (
          <>
            {item.what_works && (
              <div className="rounded-xl p-3" style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                <p className="text-[11px] font-bold text-green-700 mb-1 flex items-center gap-1.5">
                  <ThumbsUp size={11}/> What works well
                </p>
                <p className="text-sm" style={{ color:'var(--text-700)' }}>{item.what_works}</p>
              </div>
            )}
            {item.what_doesnt && (
              <div className="rounded-xl p-3" style={{ background:'#fef2f2', border:'1px solid #fecaca' }}>
                <p className="text-[11px] font-bold text-red-700 mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={11}/> Needs improvement
                </p>
                <p className="text-sm" style={{ color:'var(--text-700)' }}>{item.what_doesnt}</p>
              </div>
            )}
          </>
        )}

        {/* Bug Report */}
        {item.type === 'bug_report' && (
          <>
            {item.bug_type && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background:`${BUG_COLORS[item.bug_type] || '#64748b'}15`, color:BUG_COLORS[item.bug_type]||'#64748b' }}>
                  {item.bug_type?.replace('_',' ')}
                </span>
              </div>
            )}
            {item.description && (
              <div className="rounded-xl p-4" style={{ background:'var(--page-bg)', border:'1px solid var(--card-border)' }}>
                <p className="text-[11px] font-bold mb-2" style={{ color:'var(--text-500)' }}>Description</p>
                <p className="text-sm leading-relaxed" style={{ color:'var(--text-700)', whiteSpace:'pre-wrap' }}>{item.description}</p>
              </div>
            )}
          </>
        )}

        {/* Comment (for ratings) */}
        {item.what_works && item.type === 'rating' && (
          <div className="rounded-xl p-3" style={{ background:'var(--page-bg)', border:'1px solid var(--card-border)' }}>
            <p className="text-[11px] font-bold mb-1" style={{ color:'var(--text-500)' }}>Comment</p>
            <p className="text-sm" style={{ color:'var(--text-700)' }}>{item.what_works}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color:'var(--text-400)' }}>Details</p>
          {[
            { icon:Globe,   label:'Page',    value:item.page },
            { icon:Globe,   label:'URL',     value:item.url  },
            { icon:User,    label:'User ID', value:item.user_id ? `#${item.user_id}` : 'Anonymous' },
            { icon:User,    label:'Role',    value:item.user_role || '—' },
            { icon:Mail,    label:'Email',   value:item.email || '—' },
            { icon:Clock,   label:'Time',    value:item.created_at ? new Date(item.created_at).toLocaleString('en-GB') : '—' },
          ].map(row => (
            <div key={row.label} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background:'var(--page-bg)' }}>
              <row.icon size={12} style={{ color:'var(--text-400)', marginTop:2, flexShrink:0 }}/>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold" style={{ color:'var(--text-400)' }}>{row.label}</p>
                <p className="text-xs font-medium truncate" style={{ color:'var(--text-700)' }}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Browser */}
        {item.browser && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--text-400)' }}>Browser</p>
            <p className="text-[11px] leading-relaxed px-3 py-2 rounded-lg" style={{ background:'var(--page-bg)', color:'var(--text-500)', wordBreak:'break-all' }}>
              {item.browser}
            </p>
          </div>
        )}
      </div>

      {/* Reply via email CTA */}
      {item.email && item.email !== '—' && (
        <div className="p-4 border-t border-[var(--card-border)] flex-shrink-0">
          <a href={`mailto:${item.email}?subject=Re: Your Project Aura Feedback`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#0d9488,#0891b2)' }}>
            <Mail size={14}/> Reply to {item.email}
          </a>
        </div>
      )}
    </motion.div>
  );
}

/* ── Row ── */
function FeedbackRow({ item, active, onClick }) {
  const cfg  = TYPE_CFG[item.type] || TYPE_CFG.ux_feedback;
  const Icon = cfg.icon;
  const RIcon = item.rating ? RATING_ICONS[item.rating] : null;

  const summary = item.description || item.what_doesnt || item.what_works ||
    (item.rating ? `${item.rating}/5 stars` : 'No content');

  return (
    <motion.div layout initial={{ opacity:0 }} animate={{ opacity:1 }}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 border-b border-[var(--card-border)]/50 cursor-pointer transition-colors ${
        active ? 'bg-teal-50' : 'hover:bg-[var(--page-bg)]'
      }`}>
      {/* Type icon */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background:cfg.bg }}>
        {item.type==='rating' && RIcon
          ? <RIcon size={15} style={{ color:RATING_COLORS[item.rating], fill:RATING_COLORS[item.rating] }}/>
          : <Icon size={14} style={{ color:cfg.color }}/>
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
          {item.bug_type && (
            <span className="text-[10px] font-semibold" style={{ color:BUG_COLORS[item.bug_type]||'#64748b' }}>
              [{item.bug_type?.replace('_',' ')}]
            </span>
          )}
          <span className="text-[10px]" style={{ color:'var(--text-400)' }}>{item.page}</span>
        </div>
        <p className="text-xs truncate" style={{ color:'var(--text-600)', fontWeight:item.type==='bug_report'?600:400 }}>
          {summary}
        </p>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px]" style={{ color:'var(--text-400)' }}>{relTime(item.created_at)}</span>
        {item.user_role && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-[var(--text-500)]">
            {item.user_role}
          </span>
        )}
      </div>
      <ChevronRight size={12} style={{ color:'var(--text-400)', flexShrink:0 }} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
    </motion.div>
  );
}

/* ── Main page ── */
export default function AdminFeedback() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const { data: raw = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn:  () => axios.get(`${API_URL}/api/feedback/submissions`, { headers:authH() }).then(r => r.data),
    refetchInterval: 30000,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => axios.delete(`${API_URL}/api/feedback/${id}`, { headers:authH() }),
    onSuccess:  () => { toast.success('Submission deleted'); qc.invalidateQueries(['admin-feedback']); setSelected(null); },
    onError:    () => toast.error('Delete failed'),
  });

  /* Stats */
  const stats = useMemo(() => ({
    total:   raw.length,
    bugs:    raw.filter(r => r.type==='bug_report').length,
    ux:      raw.filter(r => r.type==='ux_feedback').length,
    ratings: raw.filter(r => r.type==='rating'),
    avgRating: raw.filter(r=>r.rating).length
      ? (raw.filter(r=>r.rating).reduce((s,r)=>s+r.rating,0) / raw.filter(r=>r.rating).length).toFixed(1)
      : '—',
  }), [raw]);

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = raw;
    if (typeFilter !== 'all') list = list.filter(r => r.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.page||'').toLowerCase().includes(q) ||
        (r.description||'').toLowerCase().includes(q) ||
        (r.what_works||'').toLowerCase().includes(q) ||
        (r.what_doesnt||'').toLowerCase().includes(q) ||
        (r.email||'').toLowerCase().includes(q) ||
        (r.bug_type||'').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
  }, [raw, typeFilter, search]);

  /* CSV export */
  const exportCSV = () => {
    const header = ['ID','Type','Page','URL','User ID','Role','Email','Bug Type','Description','What Works','What Doesnt','Rating','Time'];
    const rows = filtered.map(r => [
      r.id, r.type, r.page, r.url, r.user_id||'', r.user_role||'', r.email||'',
      r.bug_type||'', (r.description||'').replace(/,/g,' '), (r.what_works||'').replace(/,/g,' '),
      (r.what_doesnt||'').replace(/,/g,' '), r.rating||'', r.created_at||'',
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `aura-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen pb-10" style={{ background:'var(--page-bg)' }}>
      <PageHeader title="Feedback & Bug Reports" subtitle="All user submissions — ratings, UX feedback, and bug reports" icon={MessageSquarePlus}/>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={MessageSquarePlus} label="Total" value={stats.total} color="#0d9488"
            active={typeFilter==='all'} onClick={() => setTypeFilter('all')}/>
          <StatCard icon={Bug}       label="Bug Reports"  value={stats.bugs}    color="#e11d48"
            active={typeFilter==='bug_report'} onClick={() => setTypeFilter('bug_report')}/>
          <StatCard icon={ThumbsUp}  label="UX Feedback"  value={stats.ux}      color="#0891b2"
            active={typeFilter==='ux_feedback'} onClick={() => setTypeFilter('ux_feedback')}/>
          <StatCard icon={Star}      label="Avg Rating"   value={stats.avgRating} color="#f59e0b"
            active={typeFilter==='rating'} onClick={() => setTypeFilter('rating')}/>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-400)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by page, description, email..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border border-[var(--card-border)]"
              style={{ background:'var(--card-bg)', color:'var(--text-900)' }}/>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-[var(--card-border)] transition-colors hover:bg-[var(--card-bg)]"
            style={{ color:'var(--text-600)' }}>
            <RefreshCw size={13}/> Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#0d9488,#0891b2)' }}>
            <Download size={13}/> Export CSV
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-4">

          {/* List */}
          <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-[var(--card-border)]"
            style={{ background:'var(--card-bg)' }}>

            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--card-border)]"
              style={{ background:'color-mix(in srgb,var(--card-bg) 50%,var(--page-bg))' }}>
              <p className="text-xs font-bold" style={{ color:'var(--text-500)' }}>
                {filtered.length} submission{filtered.length!==1?'s':''}
                {typeFilter!=='all' && ` · ${TYPE_CFG[typeFilter]?.label}`}
              </p>
              {search && (
                <button onClick={()=>setSearch('')}
                  className="text-[10px] font-semibold flex items-center gap-1"
                  style={{ color:'var(--text-400)' }}>
                  <X size={10}/> Clear
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={22} className="animate-spin" style={{ color:'#0d9488' }}/>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquarePlus size={32} className="mx-auto mb-3" style={{ color:'var(--card-border)' }}/>
                <p className="font-semibold text-sm" style={{ color:'var(--text-500)' }}>No submissions yet</p>
                <p className="text-xs mt-1" style={{ color:'var(--text-400)' }}>
                  Feedback from the floating widget will appear here
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map(item => (
                  <FeedbackRow key={item.id} item={item}
                    active={selected?.id === item.id}
                    onClick={() => setSelected(selected?.id===item.id ? null : item)}/>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Detail panel on large screens */}
          {selected && (
            <div className="hidden lg:block w-[420px] flex-shrink-0 relative">
              <div className="sticky top-4 rounded-2xl overflow-hidden border border-[var(--card-border)]"
                style={{ maxHeight:'80vh', overflowY:'auto', background:'var(--card-bg)' }}>
                <DetailPanel item={selected}
                  onClose={() => setSelected(null)}
                  onDelete={(id) => deleteMut.mutate(id)}/>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setSelected(null)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40"/>
            <div className="lg:hidden">
              <DetailPanel item={selected}
                onClose={() => setSelected(null)}
                onDelete={(id) => deleteMut.mutate(id)}/>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
