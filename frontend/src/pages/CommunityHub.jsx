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
  UserPlus, MessagesSquare, Star, Globe, Loader2, Check, Brain, Sparkles,
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
  { id: 'all',         label: 'All Groups',     icon: Globe },
  { id: 'support',     label: 'Support',        icon: Users },
  { id: 'counselling', label: 'Counselling',    icon: MessageCircle },
  { id: 'spiritual',   label: 'Spiritual Care', icon: Heart },
  { id: 'joined',      label: 'My Groups',      icon: Check },
];

const TAB_FILTER = {
  all:         () => true,
  support:     g => !['spiritual','christian','islamic','african','interfaith','secular','humanist','prayer',
                      'mental_health','anxiety','depression','mindfulness','meditation','acceptance','burnout'].some(t => (g.condition_tags||[]).includes(t)),
  counselling: g => ['mental_health','anxiety','fear','depression','grief','mindfulness','meditation',
                     'acceptance','peace','hope','meaning','burnout','self_care'].some(t => (g.condition_tags||[]).includes(t)),
  spiritual:   g => ['spiritual','christian','islamic','african','interfaith','secular','humanist','prayer'].some(t => (g.condition_tags||[]).includes(t)),
  joined:      g => g.joined,
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
  const [activeTab,   setActiveTab]   = useState('all');
  const [search,      setSearch]      = useState('');
  const [showCreate,  setShowCreate]  = useState(false);

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
      ...(signals?.communityTags  || []),
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
  const others      = filtered.filter(g => !g.is_recommended);

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
        image="/resources/african/african-community.jpg"
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
            className="w-full py-3 pr-4 border-2 border-slate-300 rounded-2xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition bg-white shadow-sm" />
        </div>

        {/* Tabs — filtered by personalisation (spiritual hidden if opted out) */}
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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border-2 transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                }`}
                style={activeTab === tab.id ? {
                  background: ['linear-gradient(135deg,#0d9488,#0891b2)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#7c3aed,#4338ca)','linear-gradient(135deg,#db2777,#e11d48)','linear-gradient(135deg,#059669,#0d9488)'][tabIdx % 5]
                } : {}}>
                <Icon size={14} />
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
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
                className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-violet-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <Brain size={14} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-violet-900 flex-1">Smart Group Recommendations</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-200 text-violet-700">
                    {mlRecommendedGroups.length} for you
                  </span>
                </div>
                {(signals?.communityTags?.length > 0 || signals?.condition) && (
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-[11px] text-violet-700 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-violet-500" />
                      Matched to your profile:
                      {signals.condition && <span className="font-semibold"> {signals.condition}</span>}
                      {signals.communityTags?.slice(0,3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-bold">{t}</span>
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
                        className="text-left flex items-start gap-3 p-3 bg-white/70 hover:bg-white rounded-xl border border-violet-100 hover:border-violet-300 transition-all group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: color }}>
                          {groupInitials(g.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-violet-700 truncate">{g.name}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{g.description || 'Supportive community group'}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Users size={9} /> {g.member_count ?? 0}
                            </span>
                            {g.condition_tags?.slice(0,2).map(t => (
                              <span key={t} className="text-[9px] font-bold px-1 py-0.5 rounded bg-violet-50 text-violet-600">{t}</span>
                            ))}
                          </div>
                        </div>
                        <MessagesSquare size={13} className="text-violet-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Personalised banner */}
            {signals?.needsCommunity && activeTab === 'all' && (
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                <h3 className="text-sm font-bold text-indigo-800 mb-1 flex items-center gap-2">
                  <Users size={14} className="text-indigo-600" />
                  Groups Matched to Your Profile
                </h3>
                <p className="text-xs text-indigo-700">
                  Based on your preferences: {signals.communityTags?.join(', ')}
                  {signals.needsEmotionalSupport && <span className="block mt-1 text-indigo-600">✨ Emotional support groups highlighted</span>}
                  {signals.needsSpiritualSupport && <span className="block mt-1 text-indigo-600">🙏 Spiritual care groups available</span>}
                </p>
              </div>
            )}

            {recommended.length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Star size={12} className="fill-amber-400 text-amber-400" /> Recommended for you
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recommended.map(g => <GroupCard key={g.id} group={g} onToggle={() => toggleMutation.mutate(g.id)} pending={toggleMutation.isPending} onOpen={() => navigate(`/community/${g.id}`)} />)}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                {recommended.length > 0 && <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-5">All Groups</p>}
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
  const color = groupColor(group.name);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden flex flex-col">

      {/* Banner */}
      <div className="h-24 flex-shrink-0 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}88)` }}>
        {group.image_url && (
          <img src={group.image_url} alt={group.name}
            className="w-full h-full object-cover absolute inset-0"
            style={{ zIndex: 1 }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" style={{ zIndex: 2 }} />
        {group.is_recommended && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-400/90 rounded-full text-[10px] font-bold text-white">
            <Star size={9} className="fill-white" /> Recommended
          </span>
        )}
        {group.joined && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-teal-600/90 rounded-full text-[10px] font-bold text-white">✓ Joined</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar - color circle, no image (image already in banner) */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 -mt-8 border-4 border-white dark:border-slate-800 shadow-md"
            style={{ backgroundColor: color }}>
            {groupInitials(group.name)}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1">{group.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Users size={10} /> {group.member_count ?? 0} members
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-3 flex-1">{group.description || 'A supportive community group.'}</p>

        {/* Tags */}
        {group.condition_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {group.condition_tags.slice(0, 3).map((t, i) => {
              const chipCls = ['chip-teal','chip-violet','chip-blue','chip-emerald','chip-pink','chip-amber','chip-cyan','chip-indigo','chip-orange','chip-rose'];
              return <span key={t} className={chipCls[i % chipCls.length]}>{t}</span>;
            })}
            {group.condition_tags.length > 3 && (
              <span className="chip-teal">+{group.condition_tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={e => { e.stopPropagation(); onToggle(); }}
            disabled={pending}
            data-tip={group.joined ? 'Leave this group' : 'Join this community group'}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border-2 transition flex-shrink-0 ${
              group.joined
                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'bg-white text-teal-700 border-teal-300 hover:bg-teal-50'
            }`}>
            {group.joined ? 'Leave' : <><UserPlus size={11} /> Join</>}
          </button>
          <button onClick={onOpen}
            data-tip="Open this group chat"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-white rounded-xl transition hover:opacity-90"
            style={{ backgroundColor: color }}>
            <MessagesSquare size={12} /> Open Chat
          </button>
        </div>
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
                  form.tags.includes(t.value) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
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
