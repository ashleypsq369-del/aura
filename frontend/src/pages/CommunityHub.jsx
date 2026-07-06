/**
 * CommunityHub - Group listing page
 * Each group card shows: avatar, name, description, member count,
 * recent post preview, tags, join/leave + "Open Chat" button.
 * Clicking Open Chat navigates to /community/:groupId
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageCircle, Heart, Search, Bell, Plus,
  UserPlus, MessagesSquare, Star, Globe, Loader2, X, Check
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { offlineCommunityAPI } from '../api/offlineClient';
import PageHeader from '../components/PageHeader';
import usePersonalisation from '../hooks/usePersonalisation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
  const [activeTab,   setActiveTab]   = useState('all');
  const [search,      setSearch]      = useState('');
  const [showCreate,  setShowCreate]  = useState(false);

  const { data: allGroups = [], isLoading } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => offlineCommunityAPI.getGroups().then(r => r.data),
  });

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
        image="/resources/cards/card-community.jpg"
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

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map(tab => {
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
                  background: ['linear-gradient(135deg,#0d9488,#0891b2)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#7c3aed,#4338ca)','linear-gradient(135deg,#db2777,#e11d48)','linear-gradient(135deg,#059669,#0d9488)'][TABS.findIndex(t=>t.id===tab.id) % 5]
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
      className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col">

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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 -mt-8 border-4 border-white shadow-md"
            style={{ backgroundColor: color }}>
            {groupInitials(group.name)}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{group.name}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Users size={10} /> {group.member_count ?? 0} members
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3 flex-1">{group.description || 'A supportive community group.'}</p>

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
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}dd, ${color}99)` }}>
            <div className="flex items-center gap-3">
              {form.name
                ? <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center text-white font-bold text-sm">{groupInitials(form.name)}</div>
                : <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><Users size={18} className="text-white" /></div>
              }
              <h3 className="font-bold text-white">Create Support Group</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-transparent hover:bg-rose-500 border border-white/30 rounded-lg flex items-center justify-center transition" data-tip="Close this dialog">
              <X size={16} className="text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    data-tip={`Toggle ${t.label} category`}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                      form.tags.includes(t.value) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition" data-tip="Cancel group creation">Cancel</button>
            <button
              onClick={() => { if (!form.name.trim()) { toast.error('Name is required'); return; } onSubmit({ name: form.name.trim(), description: form.description.trim(), condition_tags: form.tags }); }}
              disabled={pending || !form.name.trim()}
              data-tip={!form.name.trim() ? 'Enter a group name first' : 'Post to this group'}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: color }}>
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Group
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
