/**
 * Continuity Bridge
 * ------------------
 * WHO: The PATIENT (while alive) and their designated Heirs (after death).
 * PURPOSE: Build a living legacy · memories, messages, final wishes.
 *          Personal grief journal (patient's own reflections during illness).
 *          Bridge between life and legacy · NOT a grief-counseling page.
 * DISTINCT FROM BereavedFamilyDashboard (which is for bereaved family healing).
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, BookOpen, HeartHandshake, Infinity as InfinityIcon,
  Plus, Loader2, ChevronRight, ArrowRight, Link2,
  Lock, Feather, Quote, Star, Sparkles, Users,
  Gift, MessageSquareHeart, Video, Music, Image,
  Key, UserCheck, Clock, CheckCircle, Edit3, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient, { bereavementAPI } from '../api/client';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';

const TABS = [
  { id: 'overview',    label: 'Overview',        icon: Heart            },
  { id: 'legacy',      label: 'Memory Vault',    icon: HeartHandshake   },
  { id: 'messages',    label: 'Final Messages',  icon: MessageSquareHeart },
  { id: 'my-journal',  label: 'My Journal',      icon: BookOpen         },
  { id: 'heirs',       label: 'My Heirs',        icon: UserCheck        },
];

export default function ContinuityBridge() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const selectedTab = TABS.some(t => t.id === tabParam) ? tabParam : 'overview';
  const setTab = (id) => setSearchParams({ tab: id }, { replace: true });

  const { data: patientData, isLoading } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => { try { return (await apiClient.get('/api/bereavement/my-patient')).data; } catch { return null; } },
  });
  const { data: screeningData } = useQuery({
    queryKey: ['grief-screening-status'],
    queryFn: async () => { try { return (await bereavementAPI.getScreeningStatus()).data; } catch { return {}; } },
    retry: false,
  });

  const patientId  = patientData?.patient_id ?? null;
  const isDeceased = patientData?.deceased || patientData?.status === 'deceased';
  const isHeir     = patientData?.is_heir;
  const name       = patientData?.patient_name;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* -- Header ---------------------------------------------------- */}
      <PageHeader
        image="/resources/african/african-elder-care.jpg"
        title={name ? `${isDeceased ? 'In Memory of' : isHeir ? 'Legacy of' : 'Your Legacy'}: ${name}` : 'The Continuity Bridge'}
        subtitle="Preserve memories, write final messages and designate heirs · so your legacy lives on exactly as you intend"
        icon={InfinityIcon}
      />

      {/* -- Sticky tabs --------------------------------------------- */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedTab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -- Content ------------------------------------------------- */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={selectedTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            {selectedTab === 'overview'   && <OverviewTab patientData={patientData} onTab={setTab} isDeceased={isDeceased} isHeir={isHeir} />}
            {selectedTab === 'legacy'     && <LegacyTab patientId={patientId} name={name} isHeir={isHeir} />}
            {selectedTab === 'messages'   && <FinalMessagesTab patientId={patientId} isHeir={isHeir} isDeceased={isDeceased} />}
            {selectedTab === 'my-journal' && <MyJournalTab patientId={patientId} />}
            {selectedTab === 'heirs'      && <HeirsTab patientId={patientId} isHeir={isHeir} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -- Overview ------------------------------------------------------------ */
function OverviewTab({ patientData, onTab, isDeceased, isHeir }) {
  const stats = [
    { label: 'Memories saved',    value: patientData?.memory_count   ?? '—' },
    { label: 'Messages prepared', value: patientData?.message_count  ?? '—' },
    { label: 'Heirs designated',  value: patientData?.heir_count     ?? '—' },
  ];
  const actions = [
    { icon: HeartHandshake,    label: 'Memory Vault',    sub: 'Preserve cherished moments',   tab: 'legacy',      color: 'from-purple-700 to-violet-800', img: '/resources/african/african-hands-comfort.jpg' },
    { icon: MessageSquareHeart,label: 'Final Messages',  sub: 'Words for those you love',      tab: 'messages',    color: 'from-rose-600 to-pink-700',     img: '/resources/african/african-prayer-peace.jpg' },
    { icon: BookOpen,          label: 'My Journal',     sub: 'Private · only you can see',    tab: 'my-journal',  color: 'from-indigo-700 to-blue-800',   img: '/resources/african/journal-writing.jpg' },
    { icon: UserCheck,         label: 'My Heirs',       sub: 'Who receives your legacy',      tab: 'heirs',       color: 'from-teal-600 to-emerald-700',  img: '/resources/african/african-family-support.jpg' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Inspirational quote */}
      <div className="relative bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-3 right-5 opacity-10"><Quote size={52} className="text-white" /></div>
        <p className="text-purple-100 text-sm italic leading-relaxed max-w-lg">
          "What we have once enjoyed we can never lose. All that we love deeply becomes a part of us."
        </p>
        <p className="text-purple-400 text-xs mt-3 font-medium">— Helen Keller</p>
      </div>

      {/* Action cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Your Legacy Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map(({ icon: Icon, label, sub, tab, color, img }) => (
            <motion.div key={tab} whileHover={{ y: -3 }} onClick={() => onTab(tab)}
              className="relative rounded-xl overflow-hidden cursor-pointer h-36 shadow-sm group">
              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center mb-2">
                  <Icon size={14} className="text-white" />
                </div>
                <p className="text-white font-semibold text-sm leading-tight">{label}</p>
                <p className="text-white/65 text-xs mt-0.5 line-clamp-1">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><Clock size={14} className="text-purple-500" /> How the Continuity Bridge Works</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'While you are alive', desc: 'Create memories, write final messages, and designate heirs who will receive your legacy.', color: 'bg-purple-100 text-purple-700' },
            { step: '2', title: 'Your legacy is secured', desc: 'All content is privately stored. Heirs cannot access it yet · only you can edit or delete entries.', color: 'bg-indigo-100 text-indigo-700' },
            { step: '3', title: 'After you pass', desc: 'Designated heirs receive access to the memories and messages you left for them · exactly as you intended.', color: 'bg-teal-100 text-teal-700' },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>{step}</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -- Memory Vault -------------------------------------------------------- */
function LegacyTab({ patientId, name, isHeir }) {
  const { data, isLoading } = useQuery({
    queryKey: ['legacy-memories', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      return (await apiClient.get(`/api/bereavement/entries/${patientId}?entry_type=memory&author_filter=patient`)).data;
    },
    enabled: !!patientId,
  });
  const entries = data?.entries || [];
  const mediaTypes = [
    { icon: Image,  label: 'Photo Memory',  type: 'photo' },
    { icon: Video,  label: 'Video Message', type: 'video' },
    { icon: Music,  label: 'Voice Note',    type: 'audio' },
    { icon: Edit3,  label: 'Written Story', type: 'story' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{name ? `${name}'s Memory Vault` : 'Memory Vault'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{entries.length} memories preserved</p>
        </div>
        <Link to="/memory-vault" className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800">
          Full vault <ChevronRight size={13} />
        </Link>
      </div>

      {/* Add memory types */}
      {!isHeir && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {mediaTypes.map(({ icon: Icon, label, type }) => (
            <Link key={type} to="/memory-vault"
              className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Icon size={16} className="text-purple-600" />
              </div>
              <p className="text-xs font-medium text-slate-700 text-center leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Memories grid */}
      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto" /> :
       entries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {entries.slice(0, 9).map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1.5">{new Date(m.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</p>
              <p className="text-slate-700 text-sm line-clamp-4 leading-relaxed">{m.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <Star size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600 mb-1">No memories yet</p>
          <p className="text-xs text-slate-400">Start preserving moments that matter</p>
          <Link to="/memory-vault" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-purple-600 hover:text-purple-800">
            <Plus size={14} /> Add first memory
          </Link>
        </div>
      )}
    </div>
  );
}

/* -- Final Messages ------------------------------------------------------ */
function FinalMessagesTab({ patientId, isHeir, isDeceased }) {
  const { data: legacyData } = useQuery({
    queryKey: ['legacy-content', patientId],
    queryFn: async () => {
      if (!patientId) return { content: [] };
      try { return (await apiClient.get(`/api/legacy/content/${patientId}`)).data; }
      catch { return { content: [] }; }
    },
    enabled: !!patientId,
  });
  const messages = legacyData?.content || [];

  const messageTypes = [
    { icon: Heart,            label: 'To My Family',    sub: 'A letter to those closest to you' },
    { icon: Gift,             label: 'A Gift of Words', sub: 'Something special for one person' },
    { icon: MessageSquareHeart, label: 'For the Future', sub: "For when you're not there" },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <Key size={15} className="text-indigo-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 leading-relaxed">
          {isHeir || isDeceased
            ? 'These are the messages your loved one prepared for you. They are delivered exactly as intended.'
            : 'These messages are sealed and private. Your heirs will only receive them after you pass. You can edit or delete them any time.'}
        </p>
      </div>

      {!isHeir && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {messageTypes.map(({ icon: Icon, label, sub }) => (
            <Link key={label} to="/legacy-content"
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:border-purple-300 hover:bg-purple-50 transition-all group">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Icon size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-purple-600 font-semibold">
                Create <ArrowRight size={11} />
              </span>
            </Link>
          ))}
        </div>
      )}

      {messages.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">
            {isHeir ? 'Messages left for you' : 'Your prepared messages'}
          </h3>
          {messages.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.title || 'Untitled message'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {m.recipient_type === 'all_heirs' ? 'To all heirs' : 'To specific person'} —{' '}
                    {new Date(m.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
                {!isHeir && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Link to="/legacy-content" className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
                      <Edit3 size={13} className="text-slate-500" />
                    </Link>
                  </div>
                )}
              </div>
              {isHeir || isDeceased ? (
                <p className="text-slate-700 text-sm leading-relaxed">{m.content}</p>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Lock size={12} /><span>Sealed · visible to heirs after you pass</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !isHeir ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <MessageSquareHeart size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600 mb-1">No messages yet</p>
          <p className="text-xs text-slate-400 mb-4">The words you leave behind are the greatest gift of all</p>
          <Link to="/legacy-content"
            className="inline-flex items-center gap-1.5 bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-800 transition-colors">
            <Plus size={14} /> Write your first message
          </Link>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <MessageSquareHeart size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No messages have been prepared yet.</p>
        </div>
      )}
    </div>
  );
}

/* -- My Journal ---------------------------------------------------------- */
function MyJournalTab({ patientId }) {
  const [newEntry, setNewEntry] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['my-grief-journal'],
    queryFn: async () => { try { return (await bereavementAPI.getJournalEntries()).data; } catch { return { entries: [] }; } },
  });
  const saveMutation = useMutation({
    mutationFn: (content) => bereavementAPI.saveJournalEntry(content),
    onSuccess: () => { queryClient.invalidateQueries(['my-grief-journal']); setNewEntry(''); toast.success('Entry saved'); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to save'),
  });

  const entries = data?.entries || [];
  const words = newEntry.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
        <Lock size={13} className="text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700"><strong>Completely private.</strong> These entries are yours alone · separate from your legacy vault and not visible to heirs.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <Feather size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">New Entry</span>
        </div>
        <div className="p-5">
          <textarea value={newEntry} onChange={(e) => setNewEntry(e.target.value)}
            placeholder="What are you feeling today? Write freely—"
            className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-800 min-h-[110px] focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none resize-none leading-relaxed transition-all" />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">{words} word{words !== 1 ? 's' : ''}</span>
            <button onClick={() => newEntry.trim() && saveMutation.mutate(newEntry.trim())}
              disabled={!newEntry.trim() || saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-purple-800 transition-colors">
              {saveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Save
            </button>
          </div>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your entries</h3>
          {entries.map((e) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <p className="text-xs text-slate-400">
                  {new Date(e.created_at).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{e.content}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <Quote size={26} className="mx-auto mb-3 opacity-35" />
          <p className="text-sm italic">"What do you want to remember about today?"</p>
          <p className="text-xs mt-1 text-slate-300">Your entries appear here</p>
        </div>
      )}
    </div>
  );
}

/* -- Heirs --------------------------------------------------------------- */
function HeirsTab({ patientId, isHeir }) {
  const { data } = useQuery({
    queryKey: ['legacy-heirs', patientId],
    queryFn: async () => {
      if (!patientId) return { heirs: [] };
      try { return (await apiClient.get(`/api/legacy/heirs/${patientId}`)).data; }
      catch { return { heirs: [] }; }
    },
    enabled: !!patientId,
  });
  const heirs = data?.heirs || [];

  if (isHeir) return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <Key size={28} className="mx-auto mb-3 text-purple-400" />
      <p className="text-sm font-semibold text-slate-700 mb-1">You are a designated heir</p>
      <p className="text-xs text-slate-500">You have been granted access to this legacy by the patient or their care team.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Users size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Heirs</strong> are the people you designate to receive access to your memories and messages after you pass. They cannot see anything until that time.
        </p>
      </div>

      {heirs.length > 0 ? (
        <div className="space-y-3">
          {heirs.map((h) => (
            <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-purple-700">{(h.heir_name || 'H')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{h.heir_name || 'Unnamed heir'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{h.relationship} · {h.access_level === 'full' ? 'Full access' : 'Limited access'}</p>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {h.is_active ? <CheckCircle size={11} /> : <Lock size={11} />}
                  {h.is_active ? 'Active' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <UserCheck size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-600 mb-1">No heirs designated yet</p>
          <p className="text-xs text-slate-400 mb-4">Choose who will receive your legacy</p>
        </div>
      )}

      <Link to="/heir-management"
        className="flex items-center justify-center gap-2 w-full py-3 bg-purple-700 text-white rounded-xl text-sm font-semibold hover:bg-purple-800 transition-colors">
        <UserCheck size={15} /> Manage Heirs <ArrowRight size={13} />
      </Link>
    </div>
  );
}
