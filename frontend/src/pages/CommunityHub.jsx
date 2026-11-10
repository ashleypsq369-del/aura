/**
 * CommunityHub - Group listing page
 * Each group card shows: avatar, name, description, member count,
 * recent post preview, tags, join/leave + "Open Chat" button.
 * Clicking Open Chat navigates to /community/:groupId
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Users, MessageCircle, Heart, Search, Plus,
 UserPlus, MessagesSquare, Star, Globe, Loader2, Check, Brain, Sparkles, X,
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { offlineCommunityAPI } from '../api/offlineClient';
import PageHeader from '../components/PageHeader';
import usePersonalisation from '../hooks/usePersonalisation';
import ModalShell from '../components/ui/ModalShell';
import { usePersonalisationFlags } from '../context/PersonalisationContext';

import { API_URL } from '../api/client';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

// Tabs
const TABS = [
 { id: 'all', label: 'All Groups', icon: Globe },
 { id: 'support', label: 'Support', icon: Users },
 { id: 'counselling', label: 'Counselling', icon: MessageCircle },
 { id: 'spiritual', label: 'Spiritual Care', icon: Heart },
 { id: 'joined', label: 'My Groups', icon: Check },
];

const TAB_FILTER = {
 all: () => true,
 support: g => !['spiritual','christian','islamic','african','interfaith','secular','humanist','prayer',
 'mental_health','anxiety','depression','mindfulness','meditation','acceptance','burnout'].some(t => (g.condition_tags||[]).includes(t)),
 counselling: g => ['mental_health','anxiety','fear','depression','grief','mindfulness','meditation',
 'acceptance','peace','hope','meaning','burnout','self_care'].some(t => (g.condition_tags||[]).includes(t)),
 spiritual: g => ['spiritual','christian','islamic','african','interfaith','secular','humanist','prayer'].some(t => (g.condition_tags||[]).includes(t)),
 joined: g => g.joined,
};

// Consistent color from name
const COLORS = ['#0d9488','#0284c7','#7c3aed','#059669','#e11d48','#ea580c','#ca8a04','#0891b2','#6d28d9','#be185d'];
function groupColor(name = '') {
 let h = 0;
 for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
 return COLORS[Math.abs(h) % COLORS.length];
}
function groupInitials(name = '') {
 return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const CATEGORY_TAGS = [
 { label: 'General', value: 'general' }, { label: 'Cancer', value: 'cancer' },
 { label: 'Heart', value: 'heart' }, { label: 'Kidney', value: 'kidney' },
 { label: 'Mental Health', value: 'mental_health' }, { label: 'Anxiety', value: 'anxiety' },
 { label: 'Depression', value: 'depression' }, { label: 'Spiritual', value: 'spiritual' },
 { label: 'Grief', value: 'grief' }, { label: 'Caregivers', value: 'caregiver' },
 { label: 'Ghana', value: 'ghana' }, { label: 'Palliative', value: 'palliative' },
];

export default function CommunityHub() {
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const { signals, prefs } = usePersonalisation();
 const { uiFlags } = usePersonalisationFlags();
 const [activeTab, setActiveTab] = useState('all');
 const [search, setSearch] = useState('');
 const [showCreate, setShowCreate] = useState(false);

 // Filter the spiritual tab if user said spiritual care is not important
 const visibleTabs = TABS.filter(t =>
 t.id !== 'spiritual' || uiFlags.showSpiritualItems !== false
 );

 const { data: allGroups = [], isLoading } = useQuery({
 queryKey: ['community-groups'],
 queryFn: () => offlineCommunityAPI.getGroups().then(r => r.data),
 });

 // ── ML/signal-driven group recommendation engine ────────────────────────
 // Score each group against user's personalisation signals + condition tags
 const mlRecommendedGroups = useMemo(() => {
 if (!allGroups.length || allGroups.every(g => !g.condition_tags?.length)) return [];

 const userTags = [
 ...(signals?.communityTags || []),
 ...(signals?.emotionalNeeds || []),
 signals?.condition ? [signals.condition.toLowerCase()] : [],
 signals?.needsSpiritualSupport ? ['spiritual','prayer','interfaith'] : [],
 signals?.needsEmotionalSupport ? ['grief','mental_health','anxiety','depression'] : [],
 prefs?.care_priorities
 ? (Array.isArray(prefs.care_priorities)
 ? prefs.care_priorities
 : String(prefs.care_priorities).split(',')
 ).map(p => p.trim().toLowerCase().replace(/\s+/g,'_')).filter(Boolean)
 : [],
 ].flat().filter(Boolean);

 if (!userTags.length) return allGroups.filter(g => g.is_recommended).slice(0, 4);

 return allGroups
 .filter(g => !g.joined) // don't recommend groups already joined
 .map(g => {
 const tags = (g.condition_tags || []).map(t => t.toLowerCase());
 const score = userTags.reduce((acc, ut) => {
 if (tags.some(t => t.includes(ut) || ut.includes(t))) acc += 2;
 return acc;
 }, g.is_recommended ? 1 : 0);
 return { ...g, _score: score };
 })
 .filter(g => g._score > 0)
 .sort((a, b) => b._score - a._score)
 .slice(0, 4);
 }, [allGroups, signals, prefs]);

 // Filter
 const filtered = allGroups
 .filter(TAB_FILTER[activeTab] || (() => true))
 .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase()));

 const recommended = filtered.filter(g => g.is_recommended);
 const others = filtered.filter(g => !g.is_recommended);

 // Join / Leave - no stale closure issue since we pass `group` directly
 const toggleMutation = useMutation({
 mutationFn: (gid) => axios.post(`${API_URL}/api/community/groups/${gid}/join`, {}, { headers: authHeader() }),
 onSuccess: (res, gid) => {
 queryClient.setQueryData(['community-groups'], (old = []) =>
 old.map(g => g.id === gid
 ? { ...g, joined: res.data.joined, member_count: res.data.member_count }
 : g)
 );
 toast.success(res.data.joined ? '✓ Joined group' : 'Left group');
 },
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
 });

 // Create group
 const createGroupMutation = useMutation({
 mutationFn: (data) => axios.post(`${API_URL}/api/community/groups`, data, { headers: authHeader() }),
 onSuccess: (res) => {
 queryClient.invalidateQueries(['community-groups']);
 setShowCreate(false);
 toast.success('Group created!');
 navigate(`/community/${res.data.id}`);
 },
 onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create group'),
 });

 return (
 <div className="min-h-full">
 <PageHeader
 image="/resources/african/african-community-group.jpg"
 title="Community Hub"
 subtitle="Find your people - support groups, counselling & spiritual care"
 icon={Globe}
 >
 <button onClick={() => setShowCreate(true)}
 data-tip="Create a new community group"
 data-tip-below=""
 className="flex items-center gap-2 px-4 py-2 bg-[var(--page-bg)] hover:bg-[var(--card-border)] text-[var(--text-700)] rounded-xl text-sm font-bold border border-[var(--card-border)] transition">
 <Plus size={15} /> New Group
 </button>
 </PageHeader>

 <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

 {/* Search - uses search-wrap pattern so icon never overlaps text */}
 <div className="search-wrap">
 <span className="search-icon"><Search size={16} /></span>
 <input type="text" value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Search groups by name or topic..."
 data-tip="Search community groups"
 className="w-full py-3 pr-4 border-2 border-slate-300 rounded-2xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition bg-[var(--card-bg)] shadow-sm" />
 </div>

 {/* Tabs - filtered by personalisation (spiritual hidden if opted out) */}
 <div className="flex gap-1.5 overflow-x-auto pb-0.5">
 {visibleTabs.map((tab, tabIdx) => {
 const Icon = tab.icon;
 const count = tab.id === 'joined'
 ? allGroups.filter(g => g.joined).length
 : tab.id === 'all' ? allGroups.length
 : allGroups.filter(TAB_FILTER[tab.id]).length;
 return (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)}
 data-tip={`Filter by ${tab.label}`}
 className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
 activeTab === tab.id
 ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
 : 'bg-[var(--card-bg)] text-[var(--text-600)] dark:text-[var(--text-400)] border-[var(--card-border)] hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-700 dark:hover:text-teal-400'
 }`}>
 <Icon size={14} />
 {tab.label}
 <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-[var(--text-500)] dark:text-slate-400'}`}>{count}</span>
 </button>
 );
 })}
 </div>

 {/* Group grid */}
 {isLoading ? (
 <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
 ) : filtered.length === 0 ? (
 <div className="text-center py-16 text-slate-400">
 <Search size={32} className="mx-auto mb-3 opacity-30" />
 <p className="font-semibold text-slate-500">No groups found</p>
 <p className="text-sm mt-1">{search ? 'Try a different search term' : 'Be the first to create one!'}</p>
 </div>
 ) : (
 <>
 {/* Suggested groups — no AI-banner, just a clean section header */}
 {mlRecommendedGroups.length > 0 && activeTab === 'all' && !search && (
 <div>
 <p className="text-xs font-semibold text-[var(--text-400)] uppercase tracking-wider mb-3">Suggested for you</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
 {mlRecommendedGroups.map(g => <GroupCard key={g.id} group={g} onToggle={() => toggleMutation.mutate(g.id)} pending={toggleMutation.isPending} onOpen={() => navigate(`/community/${g.id}`)} />)}
 </div>
 </div>
 )}

 {/* Personalised banner */}
 {signals?.needsCommunity && activeTab === 'all' && !search && (
 <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
 <Users size={13} className="text-teal-600 flex-shrink-0" />
 <p className="text-xs text-teal-800 dark:text-teal-300 font-semibold">Groups matched to your health profile</p>
 </div>
 )}

 {recommended.length > 0 && (
 <div>
 <p className="text-xs font-semibold text-[var(--text-400)] uppercase tracking-wider mb-3">
 Recommended
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
 {recommended.map(g => <GroupCard key={g.id} group={g} onToggle={() => toggleMutation.mutate(g.id)} pending={toggleMutation.isPending} onOpen={() => navigate(`/community/${g.id}`)} />)}
 </div>
 </div>
 )}
 {others.length > 0 && (
 <div>
 {recommended.length > 0 && <p className="text-xs font-semibold text-[var(--text-400)] uppercase tracking-wider mb-3 mt-5">All Groups</p>}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
 {others.map(g => <GroupCard key={g.id} group={g} onToggle={() => toggleMutation.mutate(g.id)} pending={toggleMutation.isPending} onOpen={() => navigate(`/community/${g.id}`)} />)}
 </div>
 </div>
 )}
 </>
 )}
 </div>

 {/* Create Group Modal */}
 <AnimatePresence>
 {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onSubmit={createGroupMutation.mutate} pending={createGroupMutation.isPending} />}
 </AnimatePresence>
 </div>
 );
}

// -- Group card -------------------------------------------------------------
function GroupCard({ group, onToggle, pending, onOpen }) {
  const initials = groupInitials(group.name);
  const color    = groupColor(group.name);
  const tags     = group.condition_tags || [];

  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      onClick={onOpen}
      style={{
        background:'var(--card-bg)',
        borderRadius:12,
        border:'1px solid var(--card-border)',
        borderLeft:`3px solid ${color}`,
        cursor:'pointer',
        display:'flex',
        flexDirection:'column',
        transition:'border-color 0.15s, box-shadow 0.15s',
        overflow:'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Card body */}
      <div style={{ padding:'14px 16px', flex:1 }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:11, marginBottom:8 }}>
          {/* Avatar */}
          <div style={{
            width:38, height:38, borderRadius:10, flexShrink:0,
            background:`${color}18`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:800, color,
          }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:700, color:'var(--text-900)', fontSize:13, lineHeight:1.3, margin:'0 0 2px',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {group.name}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:11, color:'var(--text-500)', display:'flex', alignItems:'center', gap:3 }}>
                <Users size={10}/> {group.member_count ?? 0} members
              </span>
              {group.joined && (
                <span style={{ fontSize:10, fontWeight:700, color, background:`${color}15`, padding:'1px 7px', borderRadius:99 }}>
                  Joined
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize:12, color:'var(--text-500)', lineHeight:1.5, margin:'0 0 10px',
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
        }}>
          {group.description || 'A supportive community group for patients and caregivers.'}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {tags.slice(0,3).map(t => (
              <span key={t} style={{
                fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99,
                background:'var(--page-bg)', color:'var(--text-600)',
                border:'1px solid var(--card-border)',
              }}>{t.replace(/_/g,' ')}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding:'10px 16px 12px', display:'flex', gap:7, borderTop:'1px solid var(--card-border)' }}
           onClick={e => e.stopPropagation()}>
        <button
          onClick={onOpen}
          style={{
            flex:1, padding:'7px 0', borderRadius:8, fontSize:12, fontWeight:700,
            background:color, color:'#fff', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:5,
          }}>
          <MessagesSquare size={12}/> Open
        </button>
        <button
          onClick={onToggle}
          disabled={pending}
          style={{
            padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:600,
            background:'var(--page-bg)',
            color: group.joined ? '#dc2626' : 'var(--text-700)',
            border:`1px solid ${group.joined ? '#fca5a5' : 'var(--card-border)'}`,
            cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
            transition:'all 0.12s',
          }}>
          {group.joined ? <><X size={11}/> Leave</> : <><UserPlus size={11}/> Join</>}
        </button>
      </div>
    </motion.div>
  );
}

// -- Create Group Modal -----------------------------------------------------
function CreateGroupModal({ onClose, onSubmit, pending }) {
 const [form, setForm] = useState({ name: '', description: '', tags: [] });

 const toggleTag = (tag) => setForm(f => ({
 ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
 }));

 const color = form.name ? groupColor(form.name) : '#0d9488';

 return (
 <ModalShell
 open={true}
 onClose={onClose}
 title="Create Support Group"
 icon={Users}
 accent="teal"
 size="md"
 footer={
 <div className="flex gap-3">
 <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border-2 border-slate-300 rounded-xl hover:bg-[var(--card-bg)] transition">Cancel</button>
 <button
 onClick={() => { if (!form.name.trim()) { toast.error('Name is required'); return; } onSubmit({ name: form.name.trim(), description: form.description.trim(), condition_tags: form.tags }); }}
 disabled={pending || !form.name.trim()}
 className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
 style={{ backgroundColor: color }}>
 {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Create Group
 </button>
 </div>
 }
 >
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-[var(--text-700)] mb-1.5">Group Name <span className="text-red-500">*</span></label>
 <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
 placeholder="e.g. Chronic Pain Warriors Ghana"
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition" />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-700)] mb-1.5">Description</label>
 <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
 rows={3} placeholder="What is this group about? Who is it for?"
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition resize-none" />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-700)] mb-2">Categories</label>
 <div className="flex flex-wrap gap-2">
 {CATEGORY_TAGS.map(t => (
 <button key={t.value} type="button" onClick={() => toggleTag(t.value)}
 className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
 form.tags.includes(t.value) ? 'bg-teal-600 text-white border-teal-600' : 'bg-[var(--card-bg)] text-[var(--text-600)] border-slate-300 hover:border-teal-400'
 }`}>
 {t.label}
 </button>
 ))}
 </div>
 </div>
 </div>
 </ModalShell>
 );
}
