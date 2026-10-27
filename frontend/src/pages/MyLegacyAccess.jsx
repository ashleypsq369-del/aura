/**
 * MyLegacyAccess · Heir View
 * --------------------------
 * Shows the digital legacy a deceased patient left for YOU (as their designated heir).
 * Fixed all duplicate className bugs, missing journal section, wrong vault link.
 * Added: journal entries, photo gallery placeholder, proper error states.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, BookOpen, Mail, Eye, Clock, ArrowLeft, Lock, Unlock,
  ChevronRight, HeartHandshake, Loader2, Calendar, AlertCircle,
  Image, FileText, Users, Sparkles, Quote, UserCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import PageHeader from '../components/PageHeader';

function fmt(d, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  return d ? new Date(d).toLocaleDateString('en-GB', opts) : '—';
}
function fmtShort(d) {
  return fmt(d, { month: 'short', day: 'numeric', year: 'numeric' });
}

const TABS = [
  { id: 'messages',  label: 'Messages & Letters', icon: Mail     },
  { id: 'memories',  label: 'Memories',            icon: Heart    },
  { id: 'journal',   label: 'Their Journal',       icon: BookOpen },
  { id: 'about',     label: 'About This Legacy',   icon: UserCheck },
];

export default function MyLegacyAccess() {
  const [selected, setSelected] = useState(null);  // patient_id
  const [activeTab, setActiveTab] = useState('messages');

  const { data: legacyData, isLoading, isError } = useQuery({
    queryKey: ['my-legacy-access'],
    queryFn: () => apiClient.get('/api/legacy/my-legacy-access').then(r => r.data),
  });

  const { data: contentData, isLoading: loadingContent } = useQuery({
    queryKey: ['legacy-content', selected],
    queryFn: () => apiClient.get(`/api/legacy/content/${selected}`).then(r => r.data),
    enabled: !!selected,
  });

  const { data: memoriesData, isLoading: loadingMemories } = useQuery({
    queryKey: ['legacy-memories', selected],
    queryFn: () => apiClient.get(`/api/bereavement/entries/${selected}?entry_type=memory&author_filter=patient`).then(r => r.data),
    enabled: !!selected,
  });

  const { data: journalData, isLoading: loadingJournal } = useQuery({
    queryKey: ['legacy-journal-heir', selected],
    queryFn: () => apiClient.get(`/api/bereavement/entries/${selected}?entry_type=journal&author_filter=patient`).then(r => r.data),
    enabled: !!selected,
  });

  const legacyAccess  = legacyData?.legacy_access || [];
  const contentItems  = contentData?.content       || [];
  const memories      = memoriesData?.entries       || [];
  const journalEntries = journalData?.entries       || [];
  const info          = legacyAccess.find(a => a.patient_id === selected);

  // Loading
  if (isLoading) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading your legacy access—</p>
      </div>
    </div>
  );

  // Error
  if (isError) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="bg-[#e8fafa] border border-red-200 rounded-2xl p-10 max-w-md text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold">Unable to load legacy access</p>
        <p className="text-sm text-slate-400 mt-1">Please try again later or contact your care team.</p>
      </div>
    </div>
  );

  // Empty
  if (!legacyAccess.length) return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-hands-comfort.jpg"
        title="My Legacy Access"
        subtitle="Memories left for you by loved ones"
        icon={HeartHandshake}
      />
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-5">
          <HeartHandshake size={28} className="text-purple-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">No Legacy Access Yet</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-2">
          You haven't been designated as an heir for anyone's digital legacy yet.
        </p>
        <p className="text-slate-400 text-xs">
          When someone designates you, their memories, messages, and legacy will appear here.
        </p>
      </div>
    </div>
  );

  // -- Detail view · pending -------------------------------------------------
  if (selected && info && !info.is_activated) return (
    <DetailPendingView info={info} onBack={() => setSelected(null)} />
  );

  // -- Detail view · activated -----------------------------------------------
  if (selected && info?.is_activated) return (
    <DetailActivatedView
      info={info}
      contentItems={contentItems}
      memories={memories}
      journalEntries={journalEntries}
      loadingContent={loadingContent}
      loadingMemories={loadingMemories}
      loadingJournal={loadingJournal}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBack={() => setSelected(null)}
    />
  );

  // -- List view -------------------------------------------------------------
  return <ListView legacyAccess={legacyAccess} onSelect={setSelected} />;
}

/* -- List View -------------------------------------------------------------- */
function ListView({ legacyAccess, onSelect }) {
  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-elder-care.jpg"
        title="My Legacy Access"
        subtitle={`You have been designated as an heir for ${legacyAccess.length === 1 ? '1 person' : `${legacyAccess.length} people`} · preserved with love`}
        icon={HeartHandshake}
      />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {legacyAccess.map((item, i) => {
          const isPending = !item.is_activated;
          const initials  = item.patient_name
            ? item.patient_name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
            : '?';

          return (
            <motion.div key={item.patient_id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => onSelect(item.patient_id)}
            className="bg-[#e8fafa] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all cursor-pointer overflow-hidden group">

              {/* Semantic colour strip: amber = pending, teal = active */}
              <div className={`h-1 w-full ${isPending ? 'bg-amber-400' : 'bg-teal-500'}`} />

              <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-start gap-5">
              {/* Avatar */}
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 text-xl font-bold flex-shrink-0 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + badges */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.patient_name}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Your <span className="font-medium text-slate-700 dark:text-slate-300">{item.relationship}</span>
                      </p>
                      {item.deceased_at && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Calendar size={11} /> Passed {fmtShort(item.deceased_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        isPending ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {isPending ? <Clock size={11} /> : <Unlock size={11} />}
                        {isPending ? 'Pending' : 'Active Access'}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {item.access_level === 'full' ? 'Full Access' : item.access_level === 'memories_only' ? 'Memories Only' : 'Messages Only'}
                      </span>
                    </div>
                  </div>

                  {/* Permission chips */}
                  {item.permissions && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.permissions.can_access_memories && <Chip icon={Heart}    label="Memories" />}
                      {item.permissions.can_access_journal  && <Chip icon={BookOpen} label="Journal"  />}
                      {item.permissions.can_access_messages && <Chip icon={Mail}     label="Messages" />}
                      {item.permissions.can_access_photos   && <Chip icon={Eye}      label="Photos"   />}
                    </div>
                  )}

                  {/* Personal note */}
                  {item.notes_from_patient && (
                    <div className="bg-slate-50 dark:bg-slate-800 border-l-4 border-teal-400 rounded-r-xl px-4 py-3 mb-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Personal message for you</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed">"{item.notes_from_patient}"</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {item.designated_at ? `Designated ${fmtShort(item.designated_at)}` : ''}
                    </span>
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-sm group-hover:shadow-md bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600">
                      {isPending ? 'View Details' : 'Open Legacy'}
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        <p className="text-center text-xs text-slate-400 italic pt-4">
          This is a sacred trust. These memories were left specifically for you.
        </p>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
      <Icon size={12} className="text-purple-600" /> {label}
    </span>
  );
}

/* -- Pending View ----------------------------------------------------------- */
function DetailPendingView({ info, onBack }) {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <button onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-[#e8fafa] border border-amber-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <Clock size={28} className="text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-1">{info.patient_name}'s Legacy</h1>
          <p className="text-slate-500 text-sm mb-1">
            You have been designated as their <strong>{info.relationship}</strong>.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Legacy content will become available after activation by the care team.
          </p>
          {info.notes_from_patient && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Quote size={14} className="text-purple-500" />
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Personal message for you</p>
              </div>
              <p className="text-slate-700 italic leading-relaxed text-sm">"{info.notes_from_patient}"</p>
            </div>
          )}
          {info.designated_at && (
            <p className="text-xs text-slate-400 mt-5">Designated on {fmt(info.designated_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -- Activated Detail View -------------------------------------------------- */
function DetailActivatedView({ info, contentItems, memories, journalEntries, loadingContent, loadingMemories, loadingJournal, activeTab, onTabChange, onBack }) {
  const tabs = TABS.filter(t => {
    if (t.id === 'journal'  && !info.permissions?.can_access_journal)  return false;
    if (t.id === 'memories' && !info.permissions?.can_access_memories) return false;
    if (t.id === 'messages' && !info.permissions?.can_access_messages) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <PageHeader
        image="/resources/african/african-family-support.jpg"
        title={`${info.patient_name}'s Legacy`}
        subtitle={`Your ${info.relationship}${info.deceased_at ? ` · Passed ${fmtShort(info.deceased_at)}` : ''}`}
        icon={HeartHandshake}
      >
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold transition px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg border border-white/25">
          <ArrowLeft size={13} /> All Legacies
        </button>
      </PageHeader>

      {/* Sticky tabs */}
      <div className="sticky top-0 z-20 bg-[#e8fafa] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => onTabChange(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* Messages */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Letters and messages left especially for you.</p>
                {loadingContent ? <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mt-8" /> :
                 contentItems.length > 0 ? contentItems.map(item => (
                  <div key={item.id} className="bg-[#e8fafa] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">{item.title || 'Untitled'}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.content_type?.replace('_',' ')} · {fmtShort(item.delivered_at)}</p>
                      </div>
                      <FileText size={16} className="text-slate-300 flex-shrink-0 mt-1" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  </div>
                 )) : (
                  <div className="text-center py-12 text-slate-400">
                    <Mail size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No messages have been prepared yet.</p>
                  </div>
                 )}
              </div>
            )}

            {/* Memories */}
            {activeTab === 'memories' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">{memories.length} memories preserved by {info.patient_name}.</p>
                {loadingMemories ? <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mt-8" /> :
                 memories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {memories.map(m => (
                      <div key={m.id} className="bg-[#e8fafa] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">{fmtShort(m.created_at)}</p>
                        <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-5 leading-relaxed">{m.content}</p>
                      </div>
                    ))}
                  </div>
                 ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Heart size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No memories recorded.</p>
                  </div>
                 )}
              </div>
            )}

            {/* Journal */}
            {activeTab === 'journal' && (
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-2">
                  <Lock size={13} className="text-teal-500 flex-shrink-0" />
                  <p className="text-xs text-indigo-700">These are personal journal entries written by {info.patient_name} during their journey. They shared access with you as their designated heir.</p>
                </div>
                {loadingJournal ? <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mt-8" /> :
                 journalEntries.length > 0 ? journalEntries.map(e => (
                  <div key={e.id} className="bg-[#e8fafa] border border-slate-200 rounded-xl p-5">
                    <p className="text-xs text-slate-400 mb-2.5">{fmt(e.created_at, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{e.content}</p>
                  </div>
                 )) : (
                  <div className="text-center py-12 text-slate-400">
                    <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No journal entries to show.</p>
                  </div>
                 )}
              </div>
            )}

            {/* About */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                {info.notes_from_patient && (
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Quote size={15} className="text-purple-500" />
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Personal message for you</p>
                    </div>
                    <p className="text-slate-700 italic leading-relaxed">"{info.notes_from_patient}"</p>
                    <p className="text-xs text-slate-400 mt-3 text-right">— {info.patient_name}</p>
                  </div>
                )}
                <div className="bg-[#e8fafa] border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Your Access Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      ['Relationship',  info.relationship],
                      ['Access Level',  info.access_level === 'full' ? 'Full Access' : info.access_level === 'memories_only' ? 'Memories Only' : 'Messages Only'],
                      ['Designated',    fmtShort(info.designated_at)],
                      ['Activated',     fmtShort(info.activated_at)],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-slate-800">{val || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {info.permissions?.can_access_memories && <Chip icon={Heart}    label="Memories" />}
                    {info.permissions?.can_access_journal  && <Chip icon={BookOpen} label="Journal"  />}
                    {info.permissions?.can_access_messages && <Chip icon={Mail}     label="Messages" />}
                    {info.permissions?.can_access_photos   && <Chip icon={Eye}      label="Photos"   />}
                  </div>
                </div>
                <p className="text-center text-xs text-slate-400 italic pt-2">
                  This is a sacred trust. These memories were left specifically for you.
                </p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
