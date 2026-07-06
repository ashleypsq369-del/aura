import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, User, Calendar, FileText, Mail, Eye,
  Clock, ArrowLeft, Lock, Unlock, ChevronRight,
  BookOpen, HeartHandshake, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const PURPLE = '#6B4F7A';
const PURPLE_DARK = '#c084fc';  // readable in dark

function fmt(d, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  return d ? new Date(d).toLocaleDateString('en-US', opts) : null;
}
function fmtShort(d) {
  return fmt(d, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Dark-mode aware purple color helper
function usePurple() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    ? PURPLE_DARK : PURPLE;
}

export default function MyLegacyAccess() {
  const [selected, setSelected] = useState(null);

  const { data: legacyData, isLoading } = useQuery({
    queryKey: ['my-legacy-access'],
    queryFn: () => apiClient.get('/api/legacy/my-legacy-access').then(r => r.data),
  });
  const { data: contentData } = useQuery({
    queryKey: ['legacy-content', selected],
    queryFn: () => selected
      ? apiClient.get(`/api/legacy/content/${selected}`).then(r => r.data)
      : { content: [] },
    enabled: !!selected,
  });
  const { data: memoriesData } = useQuery({
    queryKey: ['legacy-memories', selected],
    queryFn: () => selected
      ? apiClient.get(`/api/bereavement/entries/${selected}?entry_type=memory`).then(r => r.data)
      : { entries: [] },
    enabled: !!selected,
  });

  const legacyAccess = legacyData?.legacy_access || [];
  const contentItems = contentData?.content       || [];
  const memories     = memoriesData?.entries       || [];
  // Page background: light purple in light mode, dark card in dark mode
  

  // € Loading €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  // € Empty €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
  if (!legacyAccess.length) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 max-w-lg text-center shadow-lg border-2 border-purple-200">
          <Heart className="w-20 h-20 mx-auto mb-6 text-purple-400" />
          <h2 className="text-xl font-semibold mb-4 text-purple-700">No Legacy Access Yet</h2>
          <p className="text-gray-600 mb-3">You haven't been designated as an heir for any patient's digital legacy yet.</p>
          <p className="text-sm text-gray-500">When someone designates you, their memories, messages, and legacy content will appear here.</p>
        </div>
      </div>
    );
  }

  const info = legacyAccess.find(a => a.patient_id === selected);

  // € Selected - pending €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
  if (selected && info && !info.is_activated) {
    return (
      <div className="min-h-full" >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition">
            <ArrowLeft size={18} /> Back to Legacy Access
          </button>
          <div className="bg-white rounded-2xl p-10 shadow-lg border-2 border-amber-300 text-center">
            <Clock className="w-16 h-16 mx-auto mb-6 text-amber-500" />
            <h1 className="text-xl font-semibold mb-3" className="text-purple-700">
              {info.patient_name}'s Legacy
            </h1>
            <p className="text-gray-600 mb-2">
              You have been designated as their <span className="font-semibold">{info.relationship}</span>.
            </p>
            <p className="text-gray-500 mb-6">Legacy content will become available once activated.</p>
            {info.notes_from_patient && (
              <div className="bg-purple-50 rounded-xl p-6 text-left border border-purple-200">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Personal message for you</p>
                <p className="text-gray-800 italic leading-relaxed">"{info.notes_from_patient}"</p>
              </div>
            )}
            {info.designated_at && (
              <p className="text-xs text-gray-400 mt-6">Designated on {fmt(info.designated_at)}</p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // € Selected - activated €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
  if (selected && info?.is_activated) {
    return (
      <div className="min-h-full" >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto px-6 py-8 space-y-6">

          <button onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition">
            <ArrowLeft size={18} /> Back to Legacy Access
          </button>

          {/* Hero card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-full" className="bg-purple-100">
                  <Heart className="w-8 h-8" className="text-purple-700" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold mb-2" className="text-purple-700">
                    {info.patient_name}'s Legacy
                  </h1>
                  <p className="text-gray-600 mb-1">Your relationship: <span className="font-semibold">{info.relationship}</span></p>
                  {info.deceased_at && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar size={14} /> Passed away on {fmt(info.deceased_at)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 border border-green-200 text-xs font-bold rounded-full">
                  <Unlock size={12} /> Active Access
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-600 border border-purple-200 text-xs font-semibold rounded-full">
                  {info.access_level === 'full' ? 'Full Access' : info.access_level === 'memories_only' ? 'Memories Only' : 'Messages Only'}
                </span>
                {info.can_access_private && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-600 border border-purple-200 text-xs font-semibold rounded-full">
                    <Lock size={12} /> Including Private
                  </span>
                )}
              </div>
            </div>
            {info.notes_from_patient && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Personal message for you</p>
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <p className="text-gray-800 italic leading-relaxed">"{info.notes_from_patient}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Permissions */}
          {info.permissions && (
            <div className="bg-white rounded-2xl p-5 shadow border-2 border-purple-100">
              <h3 className="font-bold text-purple-700 mb-3 text-sm uppercase tracking-wider">What you can access</h3>
              <div className="flex flex-wrap gap-3">
                {info.permissions.can_access_memories  && <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200 text-sm font-semibold text-purple-600"><Heart size={16} className="text-purple-700" /> Memories</div>}
                {info.permissions.can_access_journal   && <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200 text-sm font-semibold text-purple-600"><BookOpen size={16} className="text-purple-700" /> Journal</div>}
                {info.permissions.can_access_messages  && <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200 text-sm font-semibold text-purple-600"><Mail size={16} className="text-purple-700" /> Messages</div>}
                {info.permissions.can_access_photos    && <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200 text-sm font-semibold text-purple-600"><Eye size={16} className="text-purple-700" /> Photos</div>}
              </div>
            </div>
          )}

          {/* Letters */}
          {contentItems.length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 space-y-5">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6" className="text-purple-700" />
                <h2 className="text-base font-semibold" className="text-purple-700">Messages & Letters</h2>
              </div>
              <div className="space-y-4">
                {contentItems.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.content_type?.replace('_', ' ')} · {fmtShort(item.delivered_at)}</p>
                      </div>
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memories */}
          {info.permissions?.can_access_memories && memories.length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 space-y-5">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6" className="text-purple-700" />
                <h2 className="text-base font-semibold" className="text-purple-700">Memories</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memories.slice(0, 6).map(mem => (
                  <div key={mem.id} className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
                    <p className="text-xs text-gray-500 mb-2">{fmtShort(mem.created_at)}</p>
                    <p className="text-gray-800 line-clamp-4 text-sm leading-relaxed">{mem.content}</p>
                  </div>
                ))}
              </div>
              {memories.length > 6 && (
                <Link to="/memory-vault" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" className="text-purple-700">
                  View All Memories ({memories.length}) <ChevronRight size={14} />
                </Link>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-400 italic py-2">
            This is a sacred trust. These memories and messages were left specifically for you.
          </p>
        </motion.div>
      </div>
    );
  }

  // € Default: list view €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
  return (
    <div className="min-h-full">

      {/* Page hero */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 mb-5">
          <HeartHandshake size={26} className="text-purple-700" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Legacy Access</h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
          You have been designated as an heir for the {legacyAccess.length === 1 ? 'person' : 'people'} below.
          Their <strong className="text-slate-700">memories, messages, and legacy content</strong> are preserved here for you.
        </p>
      </div>

      {/* Cards - full-width, one per row */}
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-5">
        {legacyAccess.map((item, i) => {
          const isPending = !item.is_activated;
          const accentColor = isPending ? '#b45309' : PURPLE;
          const initials = item.patient_name
            ? item.patient_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
            : '?';

          return (
            <motion.div
              key={item.patient_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelected(item.patient_id)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-200 cursor-pointer overflow-hidden group"
            >
              {/* Top colour banner */}
              <div
                className="h-2 w-full"
                style={{ background: `linear-gradient(to right, ${accentColor}, ${isPending ? '#f59e0b' : '#9b59b6'})` }}
              />

              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6">

                  {/* Avatar */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}88)` }}
                  >
                    {initials}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">{item.patient_name}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Your <span className="font-medium text-slate-700">{item.relationship}</span></p>
                        {item.deceased_at && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Calendar size={11} /> Passed away {fmtShort(item.deceased_at)}
                          </p>
                        )}
                      </div>

                      {/* Status + access level */}
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                          isPending
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {isPending ? <Clock size={11} /> : <Unlock size={11} />}
                          {isPending ? 'Pending Activation' : 'Active'}
                        </span>
                        <span
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border"
                          style={{ background: `${accentColor}12`, color: accentColor, borderColor: `${accentColor}30` }}
                        >
                          {item.access_level === 'full' ? 'Full Access' : item.access_level === 'memories_only' ? 'Memories Only' : 'Messages Only'}
                        </span>
                      </div>
                    </div>

                    {/* Permission chips */}
                    {item.permissions && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.permissions.can_access_memories && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <Heart size={12} className="text-purple-700" /> Memories
                          </span>
                        )}
                        {item.permissions.can_access_journal && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <BookOpen size={12} className="text-purple-700" /> Journal
                          </span>
                        )}
                        {item.permissions.can_access_messages && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <Mail size={12} className="text-purple-700" /> Messages
                          </span>
                        )}
                        {item.permissions.can_access_photos && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <Eye size={12} className="text-purple-700" /> Photos
                          </span>
                        )}
                      </div>
                    )}

                    {/* Personal note */}
                    {item.notes_from_patient && (
                      <div
                        className="rounded-xl px-4 py-3 mb-4 border-l-4 text-sm text-slate-600 italic leading-relaxed"
                        style={{ background: `${accentColor}08`, borderLeftColor: accentColor }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 not-italic" style={{ color: accentColor }}>
                          Personal message for you
                        </p>
                        "{item.notes_from_patient}"
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-400">
                        {item.designated_at ? `Designated ${fmtShort(item.designated_at)}` : ''}
                      </span>
                      <button
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-sm group-hover:shadow-md group-hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        {isPending ? 'View Details' : 'Open Legacy'}
                        <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 italic pb-10">
        This is a sacred trust. These memories and messages were left specifically for you.
      </p>
    </div>
  );
}


