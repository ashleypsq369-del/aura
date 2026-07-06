/**
 * MedicalKnowledge.jsx
 * =====================
 * Layout:
 *   - Page = clean searchable grid of condition cards (no inline content)
 *   - Click a card → full-screen modal opens with tabbed clinical detail
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Heart, AlertTriangle, Brain, Users, Shield,
  Activity, Pill, List, RefreshCw, Stethoscope,
  Tag, ArrowRight, FileText, Microscope,
} from 'lucide-react';
import { medicalKnowledgeAPI } from '../api/client';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';

// -- Category colours (cycling) --------------------------------------------
const CARD_PALETTES = [
  { border: 'border-teal-400',   bg: 'bg-teal-50',   text: 'text-teal-700',   icon: 'bg-teal-500',   tag: 'bg-teal-100 text-teal-700 border-teal-200'   },
  { border: 'border-blue-400',   bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-500',   tag: 'bg-blue-100 text-blue-700 border-blue-200'   },
  { border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-500', tag: 'bg-purple-100 text-purple-700 border-purple-200' },
  { border: 'border-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'bg-amber-500',  tag: 'bg-amber-100 text-amber-700 border-amber-200'  },
  { border: 'border-rose-400',   bg: 'bg-rose-50',   text: 'text-rose-700',   icon: 'bg-rose-500',   tag: 'bg-rose-100 text-rose-700 border-rose-200'   },
  { border: 'border-green-400',  bg: 'bg-green-50',  text: 'text-green-700',  icon: 'bg-green-500',  tag: 'bg-green-100 text-green-700 border-green-200'  },
  { border: 'border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bg-indigo-500', tag: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

// -- Section icons ---------------------------------------------------------
const SECTION_META = {
  'Goals':         { icon: Activity,      color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  'Pain':          { icon: Heart,         color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200'  },
  'Psychological': { icon: Brain,         color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  'Spiritual':     { icon: Shield,        color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'Family':        { icon: Users,         color: 'text-pink-600',   bg: 'bg-pink-50',   border: 'border-pink-200' },
  'Management':    { icon: Stethoscope,   color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  'Medications':   { icon: Pill,          color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  'Symptoms':      { icon: List,          color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200' },
};

function getSectionMeta(title) {
  return Object.entries(SECTION_META).find(([k]) => title.includes(k))?.[1]
    || { icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
}

// -- Rich text renderer ----------------------------------------------------
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

function RichText({ content }) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table
    if (line.trim().startsWith('|') && line.includes('|')) {
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        if (!lines[i].match(/^\s*\|[\s\-|]+\|\s*$/)) rows.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`t${i}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200">
          <table className="min-w-full text-xs">
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.split('|').filter(c => c.trim());
                return (
                  <tr key={ri} className={ri === 0 ? 'bg-slate-100' : 'odd:bg-white even:bg-slate-50'}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className={`px-3 py-2 border-b border-slate-100 ${ri === 0 ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.trim() === '') { elements.push(<div key={i} className="h-2" />); i++; continue; }

    if (line.trim().startsWith('-')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 text-sm">
          <span className="text-teal-500 font-bold flex-shrink-0 mt-0.5 leading-none">-</span>
          <span className="text-slate-700 leading-relaxed">{renderInline(line.trim().slice(1).trim())}</span>
        </div>
      );
      i++; continue;
    }

    const num = line.match(/^(\d+)\.\s+(.+)/);
    if (num) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 text-sm">
          <span className="text-teal-600 font-bold flex-shrink-0 min-w-[1.2rem] leading-none mt-0.5">{num[1]}.</span>
          <span className="text-slate-700 leading-relaxed">{renderInline(num[2])}</span>
        </div>
      );
      i++; continue;
    }

    elements.push(
      <div key={i} className="py-0.5 text-sm text-slate-700 leading-relaxed">{renderInline(line)}</div>
    );
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

// -- Tabs ------------------------------------------------------------------
const TABS = [
  { id: 'overview',      label: 'Overview',           icon: FileText,    fields: ['goals_of_care'] },
  { id: 'management',   label: 'Pain & Symptoms',    icon: Heart,       fields: ['pain_management_plan'] },
  { id: 'psychological', label: 'Psychological',      icon: Brain,       fields: ['psychological_support'] },
  { id: 'family',        label: 'Family & Spiritual', icon: Users,       fields: ['spiritual_care', 'family_support_plan'] },
];

const FIELD_LABELS = {
  goals_of_care:         'Goals of Care',
  pain_management_plan:  'Pain & Symptom Management',
  psychological_support: 'Psychological Support',
  spiritual_care:        'Spiritual & Cultural Care',
  family_support_plan:   'Family & Caregiver Support',
};

// -- Condition Detail Modal content ----------------------------------------
function ConditionModalContent({ condition }) {
  const [activeTab, setActiveTab] = useState('overview');
  const tab = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-5">
      {/* Keyword tags */}
      {condition.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {condition.keywords.slice(0, 8).map((kw, i) => (
            <span key={kw} className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${CARD_PALETTES[i % CARD_PALETTES.length].tag}`}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Plain language summary */}
      {condition.plain_language_summary && (
        <div className="flex gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-4">
          <BookOpen size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Plain Language Summary</p>
            <p className="text-sm text-teal-900 leading-relaxed">{condition.plain_language_summary}</p>
          </div>
        </div>
      )}

      {/* Red flags - always visible, prominent */}
      {condition.red_flag_symptoms?.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <p className="font-bold text-red-800 text-sm">Red Flags - Seek Urgent Help Immediately</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {condition.red_flag_symptoms.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 border border-red-200 text-red-800 text-xs font-medium rounded-lg">
                <span className="text-red-500 text-[10px]">⚠</span> {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key symptoms */}
      {condition.key_symptoms_to_monitor?.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <Tag size={13} className="text-slate-500" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Symptoms to Monitor</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {condition.key_symptoms_to_monitor.map(s => (
              <span key={s} className="px-2.5 py-1 bg-white border border-slate-300 text-slate-600 text-xs rounded-full">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === t.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="space-y-4"
        >
          {tab?.fields.map(field => {
            if (!condition[field]) return null;
            const meta = getSectionMeta(FIELD_LABELS[field]);
            const SectionIcon = meta.icon;
            return (
              <div key={field} className={`rounded-xl border ${meta.border} overflow-hidden`}>
                <div className={`flex items-center gap-2.5 px-4 py-3 ${meta.bg} border-b ${meta.border}`}>
                  <SectionIcon size={15} className={meta.color} />
                  <h4 className={`font-semibold text-sm ${meta.color}`}>{FIELD_LABELS[field]}</h4>
                </div>
                <div className="px-4 py-4 bg-white">
                  <RichText content={condition[field]} />
                </div>
              </div>
            );
          })}
          {tab?.fields.every(f => !condition[f]) && (
            <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No clinical content available for this section.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sources footer */}
      <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
        Sources: WHO Cancer Pain Guidelines · IAHPC Handbook · Oxford Handbook of Palliative Medicine · NHS Clinical Guidelines · Ghana National Treatment Protocols
      </p>
    </div>
  );
}

// -- Main page -------------------------------------------------------------
export default function MedicalKnowledge() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);       // condition name to fetch detail for
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['medical-conditions-list'],
    queryFn: () => medicalKnowledgeAPI.listConditions().then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: detail, isFetching: loadingDetail } = useQuery({
    queryKey: ['medical-condition-detail', selected],
    queryFn: () => medicalKnowledgeAPI.getCondition(selected).then(r => r.data),
    enabled: !!selected,
    staleTime: 10 * 60 * 1000,
  });

  const conditions = data?.conditions || [];
  const filtered = search
    ? conditions.filter(c =>
        c.condition_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.keywords || []).some(k => k.toLowerCase().includes(search.toLowerCase()))
      )
    : conditions;

  const handleOpen = (name) => {
    setSelected(name);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setTimeout(() => setSelected(null), 300);
  };

  return (
    <div className="min-h-screen">

      {/* -- Page header with image -- */}
      <PageHeader
        image="/resources/headers/header-medical-kb.jpg"
        title="Medical Knowledge Base"
        subtitle={`${data?.total || 0} palliative care conditions · Evidence-based · 🇬🇭 Ghana context`}
        icon={Microscope}
      >
        <button onClick={() => refetch()} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </PageHeader>

      {/* Search bar below header */}
      <div className="max-w-[1400px] mx-auto px-6 pt-5 pb-2">
        <div className="search-wrap max-w-2xl">
          <span className="search-icon"><Search size={18} /></span>
          <input
            type="text"
            placeholder="Search conditions, keywords, symptoms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-3 pr-4 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* -- Condition grid ---------------------------------------------- */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <RefreshCw size={36} className="animate-spin mb-4 text-teal-500" />
            <p className="font-medium">Loading conditions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No conditions found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-5 font-medium">
              Showing <span className="font-bold text-slate-700">{filtered.length}</span> condition{filtered.length !== 1 ? 's' : ''}.
              Click any card to view full clinical detail.
            </p>
            <div className="space-y-2">
              {filtered.map((c, idx) => {
                const pal = CARD_PALETTES[idx % CARD_PALETTES.length];
                return (
                  <motion.button
                    key={c.id || c.condition_name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                    onClick={() => handleOpen(c.condition_name)}
                    className={`group w-full text-left bg-white rounded-xl border-2 ${pal.border} shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-150 flex items-center gap-4 px-5 py-4`}
                  >
                    {/* Coloured icon */}
                    <div className={`w-10 h-10 rounded-lg ${pal.icon} flex items-center justify-center flex-shrink-0`}>
                      <BookOpen size={18} className="text-white" />
                    </div>

                    {/* Condition name */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base ${pal.text} truncate`}>
                        {c.condition_name}
                      </p>
                      {/* Keyword pills */}
                      {(c.keywords || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(c.keywords || []).slice(0, 4).map((kw) => (
                            <span key={kw} className={`px-2 py-0.5 text-xs font-medium rounded-full border ${pal.tag}`}>
                              {kw}
                            </span>
                          ))}
                          {c.keywords.length > 4 && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${pal.tag}`}>
                              +{c.keywords.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowRight size={18} className={`flex-shrink-0 ${pal.text} opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* -- Condition detail modal -------------------------------------- */}
      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={detail?.condition_name || selected || 'Loading...'}
        size="xl"
        footerContent={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400">
              🏥 Clinical Grade · 🇬🇭 Ghana Palliative Care Context
            </span>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        }
      >
        {loadingDetail || !detail ? (
          <div className="flex flex-col items-center justify-center py-20 text-teal-500">
            <RefreshCw size={32} className="animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading clinical data...</p>
          </div>
        ) : (
          <ConditionModalContent condition={detail} />
        )}
      </Modal>
    </div>
  );
}
