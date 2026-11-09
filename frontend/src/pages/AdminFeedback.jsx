/**
 * AdminFeedback - Feedback & bug report inbox
 * Route: /admin/feedback
 * Built on: AdminPageShell + DataTable + Dialog (Radix)
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  MessageSquare, Bug, ThumbsUp, Star, X,
  Clock, User, Globe, Smile, Meh, Frown,
  AlertTriangle, Trash2, Download, RefreshCw, Mail,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import axios from 'axios';
import toast from '../utils/toast';
import AdminPageShell from '../components/admin/AdminPageShell';
import DataTable from '../components/admin/DataTable';
import { API_URL } from '../api/client';

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });
const col   = createColumnHelper();

/* ─── Config ──────────────────────────────────────────────────────── */
const TYPE = {
  rating:      { label: 'Rating',      Icon: Star,     color: '#f59e0b', bg: '#fffbeb' },
  ux_feedback: { label: 'UX Feedback', Icon: ThumbsUp, color: '#0d9488', bg: '#f0fdfa' },
  bug_report:  { label: 'Bug',         Icon: Bug,      color: '#e11d48', bg: '#fef2f2' },
};
const BUG_COLOR    = { ui_ux:'#7c3aed', broken:'#e11d48', slow:'#d97706', data:'#0891b2', crash:'#dc2626', other:'#64748b' };
const RATING_FACE  = { 1:Frown, 2:Frown, 3:Meh, 4:Smile, 5:Smile };
const RATING_COLOR = { 1:'#ef4444', 2:'#f97316', 3:'#d97706', 4:'#22c55e', 5:'#0d9488' };

function relTime(ts) {
  if (!ts) return '-';
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60)     return 'just now';
  if (d < 3600)   return `${Math.floor(d/60)}m ago`;
  if (d < 86400)  return `${Math.floor(d/3600)}h ago`;
  if (d < 604800) return `${Math.floor(d/86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' });
}

/* ─── Type badge ───────────────────────────────────────────────────── */
function TypeBadge({ type, rating }) {
  const cfg  = TYPE[type] || TYPE.ux_feedback;
  const Icon = cfg.Icon;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:22, height:22, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:cfg.bg, flexShrink:0 }}>
        <Icon size={11} style={{ color:cfg.color }} />
      </div>
      <span style={{ fontSize:10, fontWeight:600, color:cfg.color }}>{cfg.label}</span>
      {type==='rating' && rating && (
        <span style={{ fontSize:10, fontWeight:700, color:RATING_COLOR[rating] }}>{'★'.repeat(rating)}</span>
      )}
    </div>
  );
}

/* ─── Detail panel ─────────────────────────────────────────────────── */
function DetailPanel({ item, onClose, onDelete }) {
  const cfg  = TYPE[item.type] || TYPE.ux_feedback;
  const Icon = cfg.Icon;
  const RF   = item.rating ? RATING_FACE[item.rating] : null;
  const meta = [
    { Icon:Globe, label:'Page',  value:item.page },
    { Icon:User,  label:'Name',  value:item.user_name || (item.user_id ? `User #${item.user_id}` : 'Anonymous') },
    { Icon:User,  label:'Role',  value:item.user_role || '-' },
    { Icon:Mail,  label:'Email', value:item.email || '-' },
    { Icon:Clock, label:'Time',  value:item.created_at ? new Date(item.created_at).toLocaleString('en-GB') : '-' },
  ].filter(r => r.value && r.value !== '-');

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--card-bg)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--card-border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:cfg.bg }}>
            <Icon size={14} style={{ color:cfg.color }} />
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--text-900)', margin:0 }}>{cfg.label}</p>
            <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>{item.page} · {relTime(item.created_at)}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={() => onDelete(item.id)} style={{ width:30, height:30, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--c-danger)' }}
            onMouseEnter={e=>(e.currentTarget.style.background='#fef2f2')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <Trash2 size={13} />
          </button>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-400)' }}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--page-bg)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        {item.type==='rating' && item.rating && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, borderRadius:10, background:cfg.bg }}>
            {RF && <RF size={32} style={{ color:RATING_COLOR[item.rating], fill:RATING_COLOR[item.rating] }} />}
            <div>
              <p style={{ fontSize:22, fontWeight:900, color:RATING_COLOR[item.rating], margin:0 }}>{item.rating}/5</p>
              <p style={{ fontSize:11, fontWeight:600, color:'var(--text-600)', margin:0 }}>
                {['','Very poor','Poor','OK','Good','Excellent'][item.rating]}
              </p>
            </div>
          </div>
        )}
        {item.type==='ux_feedback' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {item.what_works && (
              <div style={{ padding:10, borderRadius:10, background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#16a34a', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                  <ThumbsUp size={10} /> What works
                </p>
                <p style={{ fontSize:12, color:'var(--text-700)', margin:0 }}>{item.what_works}</p>
              </div>
            )}
            {item.what_doesnt && (
              <div style={{ padding:10, borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#dc2626', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                  <AlertTriangle size={10} /> Needs improvement
                </p>
                <p style={{ fontSize:12, color:'var(--text-700)', margin:0 }}>{item.what_doesnt}</p>
              </div>
            )}
          </div>
        )}
        {item.type==='bug_report' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {item.bug_type && (
              <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:6, background:`${BUG_COLOR[item.bug_type]||'#64748b'}15`, color:BUG_COLOR[item.bug_type]||'#64748b' }}>
                {item.bug_type.replace(/_/g,' ')}
              </span>
            )}
            {item.description && (
              <div style={{ padding:12, borderRadius:10, background:'var(--page-bg)', border:'1px solid var(--card-border)', fontSize:12, color:'var(--text-700)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {item.description}
              </div>
            )}
          </div>
        )}
        {item.type==='rating' && item.what_works && (
          <div style={{ padding:10, borderRadius:10, background:'var(--page-bg)', border:'1px solid var(--card-border)' }}>
            <p style={{ fontSize:10, fontWeight:600, color:'var(--text-400)', marginBottom:4 }}>Comment</p>
            <p style={{ fontSize:12, color:'var(--text-700)', margin:0 }}>{item.what_works}</p>
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-400)', margin:'0 0 6px' }}>Details</p>
          {meta.map(({ Icon:I, label, value }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:'var(--page-bg)' }}>
              <I size={11} style={{ color:'var(--text-400)', flexShrink:0 }} />
              <span style={{ fontSize:11, fontWeight:500, color:'var(--text-500)', width:46, flexShrink:0 }}>{label}</span>
              <span style={{ fontSize:11, color:'var(--text-700)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</span>
            </div>
          ))}
          {item.browser && (
            <div style={{ padding:'6px 10px', borderRadius:8, background:'var(--page-bg)', fontSize:10, color:'var(--text-400)', wordBreak:'break-all', lineHeight:1.5 }}>
              {item.browser}
            </div>
          )}
        </div>
      </div>

      {item.email && (
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--card-border)', flexShrink:0 }}>
          <a href={`mailto:${item.email}?subject=Re: Your Project Aura Feedback`}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', padding:'9px 0', borderRadius:10, background:'var(--c-teal)', color:'#fff', fontSize:12, fontWeight:700, textDecoration:'none' }}>
            <Mail size={12} /> Reply to {item.email}
          </a>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════ */
export default function AdminFeedback() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected,   setSelected]   = useState(null);

  const { data: raw=[], isLoading, refetch } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn:  () => axios.get(`${API_URL}/api/feedback/submissions`, { headers:authH() }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: id => axios.delete(`${API_URL}/api/feedback/${id}`, { headers:authH() }),
    onSuccess:  () => { toast.success('Deleted'); qc.invalidateQueries(['admin-feedback']); setSelected(null); },
    onError:    () => toast.error('Delete failed'),
  });

  const stats = useMemo(() => {
    const ratings = raw.filter(r => r.rating);
    return {
      total: raw.length,
      bugs:  raw.filter(r => r.type==='bug_report').length,
      ux:    raw.filter(r => r.type==='ux_feedback').length,
      avg:   ratings.length ? (ratings.reduce((s,r)=>s+r.rating,0)/ratings.length).toFixed(1) : null,
    };
  }, [raw]);

  const items = useMemo(() => {
    const list = typeFilter==='all' ? raw : raw.filter(r => r.type===typeFilter);
    return [...list].sort((a,b) => new Date(b.created_at||0)-new Date(a.created_at||0));
  }, [raw, typeFilter]);

  const exportCSV = () => {
    const header = ['ID','Type','Page','User ID','Role','Email','Bug Type','Description','Rating','Time'];
    const rows   = items.map(r => [r.id,r.type,r.page,r.user_id||'',r.user_role||'',r.email||'',r.bug_type||'',(r.description||'').replace(/,/g,' '),r.rating||'',r.created_at||'']);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[header,...rows].map(r=>r.join(',')).join('\n')],{type:'text/csv'}));
    a.download = `aura-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  /* Columns */
  const columns = useMemo(() => [
    col.accessor('type', {
      header: 'Type',
      cell: info => <TypeBadge type={info.getValue()} rating={info.row.original.rating} />,
      meta: { thStyle: { width:120 } },
    }),
    col.display({
      id: 'summary', header: 'Summary',
      cell: info => {
        const item = info.row.original;
        const txt  = item.description || item.what_doesnt || item.what_works || (item.rating ? `${item.rating}/5 stars` : '-');
        return (
          <div>
            <p style={{ fontSize:12, color:'var(--text-700)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:260 }}>{txt}</p>
            {item.bug_type && <span style={{ fontSize:10, fontWeight:600, color:BUG_COLOR[item.bug_type]||'#64748b' }}>{item.bug_type.replace(/_/g,' ')}</span>}
          </div>
        );
      },
      meta: { tdStyle:{ whiteSpace:'normal', minWidth:160 } },
    }),
    col.accessor('page', {
      header: 'Page',
      cell: info => <span style={{ fontSize:11, color:'var(--text-500)' }}>{info.getValue()||'-'}</span>,
    }),
    col.accessor('user_name', {
      header: 'Submitted By',
      cell: info => {
        const name = info.getValue();
        const row = info.row.original;
        const display = name || (row.user_id ? `User #${row.user_id}` : 'Anonymous');
        return <span style={{ fontSize:11, fontWeight:600, color:'var(--text-700)' }}>{display}</span>;
      },
      meta: { thStyle:{ width:140 } },
    }),
    col.accessor('user_role', {
      header: 'Role',
      cell: info => <span style={{ fontSize:10, fontWeight:600, textTransform:'capitalize', color:'var(--text-400)' }}>{info.getValue()||'anon'}</span>,
      meta: { thStyle:{ width:80 } },
    }),
    col.accessor('created_at', {
      header: 'When',
      cell: info => <span style={{ fontSize:11, color:'var(--text-400)' }}>{relTime(info.getValue())}</span>,
      meta: { thStyle:{ width:90, textAlign:'right' }, tdStyle:{ textAlign:'right' } },
    }),
  ], []);

  const typeFilterPills = (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      {[
        { key:'all',         label:'All',     color:'var(--c-teal)' },
        { key:'bug_report',  label:'Bugs',    color:'#e11d48'       },
        { key:'ux_feedback', label:'UX',      color:'var(--c-teal)' },
        { key:'rating',      label:'Ratings', color:'#f59e0b'       },
      ].map(({ key, label, color }) => {
        const active = typeFilter===key;
        return (
          <button key={key} onClick={() => setTypeFilter(key)}
            style={{
              padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:600, cursor:'pointer',
              border: active ? `1px solid ${color}` : '1px solid var(--card-border)',
              background: active ? `${color}15` : 'var(--card-bg)',
              color: active ? color : 'var(--text-500)',
              transition:'all 0.15s',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <AdminPageShell
      icon={MessageSquare}
      title="Feedback"
      meta={[
        { label:'total', value:stats.total },
        { label:'bugs',  value:stats.bugs,  color:'#e11d48' },
        { label:'UX',    value:stats.ux,    color:'var(--c-teal)' },
        ...(stats.avg ? [{ label:'avg', value:`★ ${stats.avg}`, color:'#f59e0b' }] : []),
      ]}
      toolbar={typeFilterPills}
      actions={
        <>
          <button onClick={() => refetch()}
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--card-border)',
              background: 'var(--card-bg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-500)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-teal)'; e.currentTarget.style.color = 'var(--c-teal)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-500)'; }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={exportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: 'none',
              background: 'linear-gradient(135deg,#0d9488,#0891b2)',
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(13,148,136,0.30)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Download size={13} /> Export CSV
          </button>
        </>
      }
      maxWidth="1300px"
    >
      {/* Charts row */}
      {!isLoading && raw.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginBottom:20 }}>
          {/* Trend */}
          <div style={{ borderRadius:12, border:'1px solid var(--card-border)', padding:'12px 14px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-400)', marginBottom:10 }}>Submissions over time</p>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={(() => {
                const map = {};
                raw.forEach(r => { const d = (r.created_at||'').slice(0,10); if(d) map[d] = (map[d]||0)+1; });
                return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).slice(-14).map(([date,count]) => ({ date:date.slice(5), count }));
              })()} margin={{ top:4, right:4, left:-22, bottom:0 }}>
                <defs>
                  <linearGradient id="feedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'var(--text-400)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize:9, fill:'var(--text-400)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:8, fontSize:11 }} />
                <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} fill="url(#feedGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Type donut */}
          <div style={{ borderRadius:12, border:'1px solid var(--card-border)', padding:'12px 14px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text-400)', marginBottom:4 }}>By type</p>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie
                  data={[
                    { name:'Bugs',    value:stats.bugs,                        fill:'#e11d48' },
                    { name:'UX',      value:stats.ux,                          fill:'#0d9488' },
                    { name:'Ratings', value:stats.total-stats.bugs-stats.ux,   fill:'#f59e0b' },
                  ].filter(d=>d.value>0)}
                  cx="50%" cy="55%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value">
                  {[0,1,2].map(i => <Cell key={i} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:8, fontSize:11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize:10, color:'var(--text-500)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Master / Detail */}
      <div className="admin-feedback-master-detail" style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
        {/* Table - hides on mobile when detail is open */}
        <div style={{ flex:1, minWidth:0, display: selected ? undefined : undefined }}>
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            searchColumnId="summary"
            searchPlaceholder="Search by page, type, content…"
            emptyTitle="No submissions yet"
            emptyBody="Feedback from the floating widget will appear here."
            noResultsTitle="No results"
            noResultsBody="Try adjusting your search."
            onRowClick={row => setSelected(selected?.id===row.id ? null : row)}
            pageSize={25}
          />
        </div>

        {/* Desktop inline detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="detail"
              className="detail-panel-desktop"
              initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }}
              transition={{ type:'spring', damping:28, stiffness:320 }}
              style={{
                width:380, flexShrink:0, borderRadius:12,
                border:'1px solid var(--card-border)', overflow:'hidden',
                maxHeight:'calc(100vh - 160px)', position:'sticky', top:80,
              }}
            >
              <DetailPanel
                item={selected}
                onClose={() => setSelected(null)}
                onDelete={id => deleteMut.mutate(id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile full-screen sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div key="mob-bg"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.45)' }}
              onClick={() => setSelected(null)}
            />
            <motion.div key="mob-sheet"
              initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', damping:30, stiffness:350 }}
              style={{ position:'fixed', right:0, top:0, bottom:0, zIndex:50, width:'min(400px,100vw)', borderLeft:'1px solid var(--card-border)' }}
            >
              <DetailPanel
                item={selected}
                onClose={() => setSelected(null)}
                onDelete={id => deleteMut.mutate(id)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminPageShell>
  );
}
