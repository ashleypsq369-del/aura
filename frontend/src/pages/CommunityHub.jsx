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
 className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold border border-white/30 transition">
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
 className="w-full py-3 pr-4 border-2 border-slate-300 rounded-2xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition bg-slate-50 shadow-sm" />
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
 : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-700 dark:hover:text-teal-400'
 }`}>
 <Icon size={14} />
 {tab.label}
 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{count}</span>
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
 {/* ML/signal-driven smart recommendations */}
 {mlRecommendedGroups.length > 0 && activeTab === 'all' && !search && (
 <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
 className="bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
 <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
 <Brain size={14} className="text-teal-600" />
 </div>
 <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1">Smart Group Recommendations</h3>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700">
 {mlRecommendedGroups.length} for you
 </span>
 </div>
 {(signals?.communityTags?.length > 0 || signals?.condition) && (
 <div className="px-4 pt-2 pb-1">
 <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
 <Sparkles size={11} className="text-teal-500" />
 Matched to your profile:
 {signals.condition && <span className="font-semibold text-slate-700"> {signals.condition}</span>}
 {signals.communityTags?.slice(0,3).map(t => (
 <span key={t} className="px-1.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-[10px] font-semibold">{t}</span>
 ))}
 </p>
 </div>
 )}
 <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
 {mlRecommendedGroups.map(g => {
 const color = groupColor(g.name);
 return (
 <button key={g.id}
 onClick={() => navigate(`/community/${g.id}`)}
 className="text-left flex items-start gap-3 p-3 bg-slate-50 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 hover:border-teal-300 dark:border-slate-600 transition-all group shadow-sm">
 <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
 {groupInitials(g.name)}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-violet-300 truncate">{g.name}</p>
 <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{g.description || 'Supportive community group'}</p>
 <div className="flex items-center gap-1.5 mt-1">
 <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
 <Users size={9} /> {g.member_count ?? 0}
 </span>
 {g.condition_tags?.slice(0,2).map(t => (
 <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 border border-teal-400 text-teal-700 dark:bg-violet-900/40 dark:border-violet-600 dark:text-violet-300">{t}</span>
 ))}
 </div>
 </div>
 <MessagesSquare size={13} className="text-teal-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
 </button>
 );
 })}
 </div>
 </motion.div>
 )}

 {/* Personalised banner */}
 {signals?.needsCommunity && activeTab === 'all' && (
 <div className="px-4 py-3 bg-indigo-50 border border-indigo-300 rounded-xl">
 <h3 className="text-sm font-bold text-indigo-900 mb-1 flex items-center gap-2">
 <Users size={14} className="text-teal-700" />
 Groups Matched to Your Profile
 </h3>
 <p className="text-xs text-indigo-800">
 Based on your preferences: {signals.communityTags?.join(', ')}
 {signals.needsEmotionalSupport && <span className="block mt-1 text-teal-700 font-medium">✨ Emotional support groups highlighted</span>}
 {signals.needsSpiritualSupport && <span className="block mt-1 text-teal-700 font-medium">🙏 Spiritual care groups available</span>}
 </p>
 </div>
 )}

 {recommended.length > 0 && (
 <div>
 <p className="text-xs font-bold text-amber-800 mb-3 flex items-center gap-1.5">
 <Star size={12} className="fill-amber-500 text-amber-500" /> Recommended for you
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
 {recommended.map(g => <GroupCard key={g.id} group={g} onToggle={() => toggleMutation.mutate(g.id)} pending={toggleMutation.isPending} onOpen={() => navigate(`/community/${g.id}`)} />)}
 </div>
 </div>
 )}
 {others.length > 0 && (
 <div>
 {recommended.length > 0 && <p className="text-xs font-bold text-slate-400 mb-3 mt-5">All Groups</p>}
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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

  // Pick a cover image based on group tags
  const COVER_IMGS = {
    cancer:       'https://images.pexels.com/photos/6823568/pexels-photo-6823568.jpeg?auto=compress&cs=tinysrgb&w=400&h=220&fit=crop',
    grief:        'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=400&h=220&fit=crop',
    spiritual:    'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=400&h=220&fit=crop',
    mental_health:'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=400&h=220&fit=crop',
    caregiver:    'https://images.pexels.com/photos/7578806/pexels-photo-7578806.jpeg?auto=compress&cs=tinysrgb&w=400&h=220&fit=crop',
    palliative:   'https://images.pexels.com/photos/7578806/pexels-photo-7578806.jpeg?auto=compress&cs=tinysrgb&w=400&h=220&fit=crop',
  };
  const tags = group.condition_tags || [];
  const coverImg = COVER_IMGS[tags.find(t => COVER_IMGS[t])] || null;

  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-5, boxShadow:'0 18px 50px rgba(0,0,0,0.3)' }}
      onClick={onOpen}
      style={{
        background:'var(--card-bg)', borderRadius:20, overflow:'hidden',
        border:'1.5px solid var(--card-border)', cursor:'pointer',
        display:'flex', flexDirection:'column',
        boxShadow:'0 2px 16px rgba(0,0,0,0.2)',
        transition:'box-shadow 0.2s',
      }}
    >
      {/* ── Cover image / colour block ── */}
      <div style={{ height:130, position:'relative', overflow:'hidden', background:`linear-gradient(135deg,${color}cc,${color}66)`, flexShrink:0 }}>
        {coverImg && (
          <img src={coverImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.3 }}/>
        )}
        {/* Dark gradient bottom */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 60%)' }}/>

        {/* Member count badge top-right */}
        <div style={{
          position:'absolute', top:10, right:10,
          display:'flex', alignItems:'center', gap:4,
          background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)',
          borderRadius:8, padding:'3px 9px', border:'1px solid rgba(255,255,255,0.1)',
        }}>
          <Users size={10} style={{ color:'#94a3b8' }}/>
          <span style={{ fontSize:11, fontWeight:700, color:'#e2e8f0' }}>{group.member_count ?? 0}</span>
        </div>

        {/* Joined badge top-left */}
        {group.joined && (
          <div style={{
            position:'absolute', top:10, left:10,
            display:'flex', alignItems:'center', gap:4,
            background:color, borderRadius:8, padding:'3px 9px',
            boxShadow:`0 2px 8px ${color}55`,
          }}>
            <Check size={9} style={{ color:'#fff' }}/>
            <span style={{ fontSize:10, fontWeight:800, color:'#fff' }}>Joined</span>
          </div>
        )}

        {/* Avatar circle at bottom overlapping */}
        <div style={{ position:'absolute', bottom:-20, left:16 }}>
          <div style={{
            width:44, height:44, borderRadius:14,
            background:`linear-gradient(135deg,${color},${color}bb)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2.5px solid var(--card-bg)', boxShadow:`0 4px 14px ${color}44`,
            fontSize:14, fontWeight:900, color:'#fff',
            fontFamily:'"Inter",-apple-system,sans-serif',
          }}>
            {initials}
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div style={{ padding:'28px 16px 0', flex:1, display:'flex', flexDirection:'column' }}>
        {/* Name */}
        <p style={{ fontWeight:800, color:'var(--text-900)', fontSize:14, lineHeight:1.25, margin:'0 0 4px' }}>
          {group.name}
        </p>

        {/* Description */}
        <p style={{
          fontSize:11, color:'var(--text-500)', lineHeight:1.55, margin:'0 0 10px',
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
        }}>
          {group.description || 'A supportive community group for patients and caregivers.'}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
            {tags.slice(0,3).map(t => (
              <span key={t} style={{
                fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6,
                background:'var(--card-border)33', color:'var(--text-500)', border:'1px solid var(--card-border)',
                textTransform:'capitalize',
              }}>{t.replace('_',' ')}</span>
            ))}
            {tags.length > 3 && (
              <span style={{ fontSize:9, color:'#475569', padding:'2px 6px' }}>+{tags.length-3}</span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display:'flex', borderTop:'1px solid var(--card-border)', paddingTop:10, marginBottom:12 }}>
          {[
            { v: group.member_count ?? 0, l:'Members' },
            { v: group.is_recommended ? 'Yes' : 'No', l:'Recommended' },
            { v: group.joined ? 'Yes' : 'No', l:'Joined' },
          ].map((s, i) => (
            <div key={s.l} style={{ flex:1, textAlign:'center', borderRight: i<2?'1px solid var(--card-border)':'none' }}>
              <p style={{ fontSize:13, fontWeight:800, color:'var(--text-900)', margin:0, lineHeight:1 }}>{s.v}</p>
              <p style={{ fontSize:9, color:'var(--text-500)', margin:'2px 0 0', fontWeight:600 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:7 }}>
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          style={{
            width:'100%', padding:'11px 0', borderRadius:12, fontSize:13, fontWeight:800,
            background:color, color:'#fff', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            boxShadow:`0 4px 14px ${color}44`, transition:'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
        >
          <MessagesSquare size={14}/> Open Group
        </button>
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          disabled={pending}
          style={{
            width:'100%', padding:'9px 0', borderRadius:12, fontSize:12, fontWeight:700,
            background:'var(--card-border)22', color: group.joined?'#ef4444':'var(--text-600)',
            border:`1.5px solid ${group.joined?'#ef444444':'var(--card-border)'}`,

            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'all 0.15s',
          }}
        >
          {group.joined
            ? <><X size={12}/> Leave</>
            : <><UserPlus size={12}/> Join Group</>
          }
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
 <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition">Cancel</button>
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
 <label className="block text-sm font-bold text-slate-700 mb-1.5">Group Name <span className="text-red-500">*</span></label>
 <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
 placeholder="e.g. Chronic Pain Warriors Ghana"
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition" />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
 <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
 rows={3} placeholder="What is this group about? Who is it for?"
 className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition resize-none" />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Categories</label>
 <div className="flex flex-wrap gap-2">
 {CATEGORY_TAGS.map(t => (
 <button key={t.value} type="button" onClick={() => toggleTag(t.value)}
 className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
 form.tags.includes(t.value) ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-300 hover:border-teal-400'
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
