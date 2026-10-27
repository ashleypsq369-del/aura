/**
 * MedicalKnowledge.jsx — Clinical Reference Library
 * ====================================================
 * Layout: Two-column (sidebar index + main reading pane)
 * Add/Edit for admin and clinician roles.
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Search, Heart, AlertTriangle, Brain, Users,
  List, RefreshCw, FileText, Microscope, Plus, Edit2,
  Trash2, Save, X, ChevronRight, Tag,
} from 'lucide-react';
import { medicalKnowledgeAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';
import { usePersonalisationFlags } from '../context/PersonalisationContext';

// ── FIELD_LABELS ─────────────────────────────────────────────────────────
const FIELD_LABELS = {
  goals_of_care:         'Goals of Care',
  pain_management_plan:  'Pain & Symptom Management',
  psychological_support: 'Psychological Support',
  spiritual_care:        'Spiritual & Cultural Care',
  family_support_plan:   'Family & Caregiver Support',
};

const FIELD_KEYS = Object.keys(FIELD_LABELS);

// ── Rich text renderer ────────────────────────────────────────────────────
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-semibold text-slate-900">{p.slice(2,-2)}</strong>
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
    if (line.trim().startsWith('|') && line.includes('|')) {
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        if (!lines[i].match(/^\s*\|[\s\-|]+\|\s*$/)) rows.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`t${i}`} className="overflow-x-auto my-3 rounded-lg border border-slate-200">
          <table className="min-w-full text-xs"><tbody>
            {rows.map((row, ri) => {
              const cells = row.split('|').filter(c => c.trim());
              return (
                <tr key={ri} className={ri === 0 ? 'bg-slate-100' : 'odd:bg-[#f0f6fa] even:bg-slate-50'}>
                  {cells.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-2 border-b border-slate-100 ${ri===0?'font-semibold text-slate-800':'text-slate-700'}`}>{cell.trim()}</td>
                  ))}
                </tr>
              );
            })}
          </tbody></table>
        </div>
      );
      continue;
    }
    if (line.trim() === '') { elements.push(<div key={i} className="h-2"/>); i++; continue; }
    if (line.trim().startsWith('-')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 text-sm">
          <span className="text-teal-500 font-bold flex-shrink-0 mt-0.5">•</span>
          <span className="text-slate-700 leading-relaxed">{renderInline(line.trim().slice(1).trim())}</span>
        </div>
      );
      i++; continue;
    }
    const num = line.match(/^(\d+)\.\s+(.+)/);
    if (num) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 text-sm">
          <span className="text-teal-600 font-bold flex-shrink-0 min-w-[1.2rem] mt-0.5">{num[1]}.</span>
          <span className="text-slate-700 leading-relaxed">{renderInline(num[2])}</span>
        </div>
      );
      i++; continue;
    }
    elements.push(<div key={i} className="py-0.5 text-sm text-slate-700 leading-relaxed">{renderInline(line)}</div>);
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

// ── BookSection wrapper ───────────────────────────────────────────────────
function BookSection({ icon: Icon, label, accent = 'slate', children }) {
  const A = {
    slate: { bar:'bg-slate-50 border-slate-200', left:'bg-slate-400', lbl:'text-slate-600', border:'border-slate-200' },
    red:   { bar:'bg-red-50 border-red-200',     left:'bg-red-500',   lbl:'text-red-700',   border:'border-red-200'   },
    teal:  { bar:'bg-teal-50 border-teal-200',   left:'bg-teal-500',  lbl:'text-teal-700',  border:'border-teal-200'  },
    amber: { bar:'bg-amber-50 border-amber-200', left:'bg-amber-500', lbl:'text-amber-700', border:'border-amber-200' },
  }[accent] || { bar:'bg-slate-50 border-slate-200', left:'bg-slate-400', lbl:'text-slate-600', border:'border-slate-200' };
  return (
    <div className={`rounded-lg border ${A.border} overflow-hidden`}>
      <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${A.bar}`}>
        <span className={`w-1 h-4 rounded-full flex-shrink-0 ${A.left}`}/>
        <Icon size={13} className={`flex-shrink-0 ${A.lbl}`}/>
        <span className={`text-[11px] font-bold  select-none ${A.lbl}`}>{label}</span>
      </div>
      <div className="px-5 py-4 bg-[#f0f6fa]">{children}</div>
    </div>
  );
}

// ── Detail reading pane ───────────────────────────────────────────────────
function ConditionDetail({ condition, canEdit, onEdit }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { uiFlags } = usePersonalisationFlags();

  // Build tabs dynamically — hide spiritual tab if user opted out
  const TABS = [
    { id: 'overview',      label: 'Overview',        icon: FileText, fields: ['goals_of_care'] },
    { id: 'management',    label: 'Pain & Symptoms',  icon: Heart,    fields: ['pain_management_plan'] },
    { id: 'psychological', label: 'Psychological',    icon: Brain,    fields: ['psychological_support'] },
    ...(uiFlags.showSpiritualItems !== false ? [
      { id: 'family', label: 'Family & Spirit', icon: Users, fields: ['spiritual_care', 'family_support_plan'] },
    ] : [
      { id: 'family', label: 'Family Support',  icon: Users, fields: ['family_support_plan'] },
    ]),
  ];

  const tab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{condition.condition_name}</h2>
          {condition.keywords?.length > 0 && (
            <p className="text-[12px] text-slate-400 italic mt-0.5">
              Also known as: {condition.keywords.slice(0,8).join(', ')}
            </p>
          )}
        </div>
        {canEdit && (
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition flex-shrink-0">
            <Edit2 size={12}/> Edit
          </button>
        )}
      </div>

      {condition.plain_language_summary && (
        <BookSection icon={BookOpen} label="In Plain Language" accent="teal">
          <p className="text-sm text-slate-700 leading-relaxed">{condition.plain_language_summary}</p>
        </BookSection>
      )}

      {condition.red_flag_symptoms?.length > 0 && (
        <BookSection icon={AlertTriangle} label="⚠ Red Flags — Seek Urgent Help" accent="red">
          <ul className="space-y-2">
            {condition.red_flag_symptoms.map((f,i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"/>
                <span className="text-sm text-slate-800 leading-snug">{f}</span>
              </li>
            ))}
          </ul>
        </BookSection>
      )}

      {condition.key_symptoms_to_monitor?.length > 0 && (
        <BookSection icon={List} label="Symptoms to Monitor" accent="amber">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {condition.key_symptoms_to_monitor.map((s,i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm text-slate-700">
                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0"/>
                {s.replace(/_/g,' ')}
              </span>
            ))}
          </div>
        </BookSection>
      )}

      {/* Tabs */}
      <div className="pt-1">
        <div className="flex border border-slate-200 rounded-t-lg overflow-hidden bg-slate-50">
          {TABS.map((t, idx) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold transition-all border-r border-slate-200 last:border-r-0 ${
                  active ? 'bg-[#f0f6fa] text-slate-900 shadow-[inset_0_-2px_0_0_#0d9488]' : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
                }`}>
                <Icon size={12} className={active?'text-teal-600':''}/>
                <span className="hidden sm:inline">{t.label}</span>
                <span className={`ml-auto hidden md:inline text-[10px] font-normal ${active?'text-slate-400':'text-slate-300'}`}>§{idx+4}</span>
              </button>
            );
          })}
        </div>
        <div className="border border-t-0 border-slate-200 rounded-b-lg bg-[#f0f6fa] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.14}} className="p-5 space-y-5">
              {tab?.fields.map((field, fi) => {
                if (!condition[field]) return null;
                return (
                  <div key={field}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-500 flex-shrink-0">{fi+1}</span>
                      <h4 className="text-[11px] font-bold text-slate-500  select-none">{FIELD_LABELS[field]}</h4>
                      <div className="flex-1 h-px bg-slate-100"/>
                    </div>
                    <div className="pl-7 text-sm text-slate-700 leading-relaxed"><RichText content={condition[field]}/></div>
                  </div>
                );
              })}
              {tab?.fields.every(f => !condition[f]) && (
                <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
                  <BookOpen size={22} className="opacity-30"/>
                  <p className="text-sm italic">No clinical content available for this section.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-start gap-2 px-1 pt-2 border-t border-slate-100">
        <span className="text-slate-300 text-base leading-none select-none mt-0.5">§</span>
        <p className="text-[10.5px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-500">Clinical Grade · 🇬🇭 Ghana Palliative Care Context</span><br/>
          Sources: WHO Cancer Pain Guidelines · IAHPC Handbook · Oxford Handbook of Palliative Medicine · NHS Clinical Guidelines · Ghana National Treatment Protocols
        </p>
      </div>
    </div>
  );
}

// ── Add / Edit form ───────────────────────────────────────────────────────
function ConditionForm({ initial, onSave, onCancel, isSaving }) {
  const empty = { condition_name:'', keywords:[], plain_language_summary:'',
    goals_of_care:'', pain_management_plan:'', psychological_support:'',
    spiritual_care:'', family_support_plan:'', key_symptoms_to_monitor:[], red_flag_symptoms:[] };
  const [form, setForm] = useState(initial || empty);
  const [kwInput, setKwInput] = useState('');
  const [symInput, setSymInput] = useState('');
  const [rfInput, setRfInput] = useState('');

  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const addTag = (field, input, setInput) => {
    const val = input.trim();
    if (!val) return;
    set(field, [...(form[field]||[]), val]);
    setInput('');
  };
  const removeTag = (field, idx) => set(field, form[field].filter((_,i)=>i!==idx));

  const TagInput = ({ field, input, setInput, placeholder }) => (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {(form[field]||[]).map((t,i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-700">
            {t}
            <button type="button" onClick={()=>removeTag(field,i)} className="text-slate-400 hover:text-red-500"><X size={9}/></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTag(field,input,setInput);}}}
          placeholder={placeholder} className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:border-teal-500 outline-none"/>
        <button type="button" onClick={()=>addTag(field,input,setInput)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition">Add</button>
      </div>
    </div>
  );

  const textarea = (field, label, rows=3) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500  mb-1 select-none">{label}</label>
      <textarea value={form[field]||''} onChange={e=>set(field,e.target.value)} rows={rows} placeholder={`Enter ${label.toLowerCase()}...`}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-teal-500 outline-none resize-none leading-relaxed"/>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-slate-500  mb-1 select-none">Condition Name *</label>
        <input value={form.condition_name} onChange={e=>set('condition_name',e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold focus:border-teal-500 outline-none" placeholder="e.g. Advanced Heart Failure"/>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500  mb-1 select-none">Keywords / Synonyms</label>
        <TagInput field="keywords" input={kwInput} setInput={setKwInput} placeholder="Add a keyword, press Enter"/>
      </div>

      {textarea('plain_language_summary', 'Plain Language Summary', 3)}

      <div className="border-t border-slate-100 pt-4">
        <p className="text-[11px] font-bold text-slate-400  mb-3 select-none">Clinical Sections</p>
        <div className="space-y-4">
          {textarea('goals_of_care', 'Goals of Care', 4)}
          {textarea('pain_management_plan', 'Pain & Symptom Management', 5)}
          {textarea('psychological_support', 'Psychological Support', 4)}
          {textarea('spiritual_care', 'Spiritual & Cultural Care', 3)}
          {textarea('family_support_plan', 'Family & Caregiver Support', 3)}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500  mb-1 select-none">Key Symptoms to Monitor</label>
          <TagInput field="key_symptoms_to_monitor" input={symInput} setInput={setSymInput} placeholder="Add symptom, press Enter"/>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-amber-600  mb-1 select-none">⚠ Red Flag Symptoms</label>
          <TagInput field="red_flag_symptoms" input={rfInput} setInput={setRfInput} placeholder="Add red flag, press Enter"/>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button onClick={()=>onSave(form)} disabled={isSaving||!form.condition_name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition">
          <Save size={13}/>{isSaving?'Saving…':'Save Condition'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition">Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function MedicalKnowledge() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role === 'admin' || user?.role === 'clinician';

  const [search, setSearch]       = useState('');
  const [activeId, setActiveId]   = useState(null);   // selected condition name
  const [mode, setMode]           = useState('read'); // 'read' | 'add' | 'edit'

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: listData, isLoading, refetch } = useQuery({
    queryKey: ['medical-conditions-list'],
    queryFn: () => medicalKnowledgeAPI.listConditions().then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: detail, isFetching: loadingDetail } = useQuery({
    queryKey: ['medical-condition-detail', activeId],
    queryFn: () => medicalKnowledgeAPI.getCondition(activeId).then(r => r.data),
    enabled: !!activeId && mode === 'read',
    staleTime: 5 * 60 * 1000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: data => medicalKnowledgeAPI.createCondition(data),
    onSuccess: (res) => {
      qc.invalidateQueries(['medical-conditions-list']);
      setActiveId(res.data.condition_name);
      setMode('read');
      toast.success('Condition added');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, data }) => medicalKnowledgeAPI.updateCondition(name, data),
    onSuccess: (res) => {
      qc.invalidateQueries(['medical-conditions-list']);
      qc.invalidateQueries(['medical-condition-detail', activeId]);
      setMode('read');
      toast.success('Condition updated');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: name => medicalKnowledgeAPI.deleteCondition(name),
    onSuccess: () => {
      qc.invalidateQueries(['medical-conditions-list']);
      setActiveId(null);
      setMode('read');
      toast.success('Condition deleted');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to delete'),
  });

  // ── Filtered list ─────────────────────────────────────────────────────
  const conditions = listData?.conditions || [];
  const filtered = useMemo(() => {
    if (!search.trim()) return conditions;
    const q = search.toLowerCase();
    return conditions.filter(c =>
      c.condition_name.toLowerCase().includes(q) ||
      (c.keywords || []).some(k => k.toLowerCase().includes(q))
    );
  }, [conditions, search]);

  // ── Colour palette per index ──────────────────────────────────────────
  const PALETTES = [
    { dot:'bg-teal-400',   text:'text-teal-700',   active:'bg-teal-50 border-teal-300'   },
    { dot:'bg-teal-400',   text:'text-teal-700',   active:'bg-blue-50 border-blue-300'   },
    { dot:'bg-purple-400', text:'text-purple-700', active:'bg-purple-50 border-purple-300'},
    { dot:'bg-amber-400',  text:'text-amber-700',  active:'bg-amber-50 border-amber-300' },
    { dot:'bg-rose-400',   text:'text-rose-700',   active:'bg-rose-50 border-rose-300'   },
    { dot:'bg-green-400',  text:'text-green-700',  active:'bg-green-50 border-green-300' },
    { dot:'bg-indigo-400', text:'text-teal-700', active:'bg-indigo-50 border-indigo-300'},
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        image="/resources/african/african-medical-reading.jpg"
        title="Medical Knowledge Base"
        subtitle={`${listData?.total || 0} palliative care conditions · Evidence-based · 🇬🇭 Ghana`}
        icon={Microscope}
      >
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={() => { setActiveId(null); setMode('add'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg border border-white/30 text-xs font-bold transition">
              <Plus size={13}/> Add Condition
            </button>
          )}
          <button onClick={() => refetch()} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition" title="Refresh">
            <RefreshCw size={15}/>
          </button>
        </div>
      </PageHeader>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex flex-col lg:flex-row gap-5 items-start">

        {/* ── LEFT: Index sidebar ──────────────────────────────────────── */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conditions…"
              className="w-full pl-9 pr-3 py-2.5 bg-[#f0f6fa] border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none shadow-sm"/>
          </div>

          {/* Index list */}
          <div className="bg-[#f0f6fa] rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            {/* Index header */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={13} className="text-slate-400"/>
                <span className="text-[11px] font-bold text-slate-500  select-none">Index</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{filtered.length} entries</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={20} className="animate-spin text-teal-500"/>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[60vh]">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <p className="text-sm italic">No conditions found</p>
                  </div>
                ) : (
                  filtered.map((c, idx) => {
                    const pal = PALETTES[idx % PALETTES.length];
                    const isActive = activeId === c.condition_name && mode === 'read';
                    return (
                      <button key={c.id || c.condition_name}
                        onClick={() => { setActiveId(c.condition_name); setMode('read'); }}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${
                          isActive ? `${pal.active} border-l-2` : 'hover:bg-slate-50'
                        }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pal.dot}`}/>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isActive ? pal.text : 'text-slate-700'}`}>
                            {c.condition_name}
                          </p>
                          {(c.keywords||[]).length > 0 && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {c.keywords.slice(0,3).join(', ')}
                            </p>
                          )}
                        </div>
                        {isActive && <ChevronRight size={13} className={pal.text}/>}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Add button at bottom of index */}
            {canEdit && (
              <div className="border-t border-slate-200 p-2">
                <button onClick={() => { setActiveId(null); setMode('add'); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition border border-teal-200">
                  <Plus size={12}/> Add New Condition
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Main reading / editing pane ──────────────────────── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {mode === 'add' && (
              <motion.div key="add" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.15}}
                className="bg-[#f0f6fa] rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-teal-50 border-b border-teal-200">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                    <Plus size={16} className="text-white"/>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Add New Condition</h2>
                    <p className="text-[11px] text-slate-500">Clinician-authored entry for the knowledge base</p>
                  </div>
                </div>
                <div className="p-5">
                  <ConditionForm
                    onSave={data => createMutation.mutate(data)}
                    onCancel={() => setMode('read')}
                    isSaving={createMutation.isPending}
                  />
                </div>
              </motion.div>
            )}

            {mode === 'edit' && detail && (
              <motion.div key="edit" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.15}}
                className="bg-[#f0f6fa] rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border-b border-amber-200">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Edit2 size={15} className="text-white"/>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-slate-900 text-sm">Editing: {detail.condition_name}</h2>
                    <p className="text-[11px] text-slate-500">Changes are saved to the knowledge base</p>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => { if(window.confirm(`Delete "${detail.condition_name}"?`)) deleteMutation.mutate(activeId); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200 transition">
                      <Trash2 size={11}/> Delete
                    </button>
                  )}
                </div>
                <div className="p-5">
                  <ConditionForm
                    initial={{
                      condition_name: detail.condition_name,
                      keywords: detail.keywords || [],
                      plain_language_summary: detail.plain_language_summary || '',
                      goals_of_care: detail.goals_of_care || '',
                      pain_management_plan: detail.pain_management_plan || '',
                      psychological_support: detail.psychological_support || '',
                      spiritual_care: detail.spiritual_care || '',
                      family_support_plan: detail.family_support_plan || '',
                      key_symptoms_to_monitor: detail.key_symptoms_to_monitor || [],
                      red_flag_symptoms: detail.red_flag_symptoms || [],
                    }}
                    onSave={data => updateMutation.mutate({ name: activeId, data })}
                    onCancel={() => setMode('read')}
                    isSaving={updateMutation.isPending}
                  />
                </div>
              </motion.div>
            )}

            {mode === 'read' && !activeId && (
              <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="h-full flex flex-col items-center justify-center py-24 text-slate-400 bg-[#f0f6fa] rounded-xl border border-slate-200 border-dashed">
                <BookOpen size={40} className="opacity-20 mb-3"/>
                <p className="font-semibold text-slate-500">Select a condition from the index</p>
                <p className="text-sm mt-1">Click any entry on the left to read its clinical reference</p>
                {canEdit && (
                  <button onClick={() => setMode('add')}
                    className="mt-5 flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold transition">
                    <Plus size={14}/> Add First Condition
                  </button>
                )}
              </motion.div>
            )}

            {mode === 'read' && activeId && (
              <motion.div key={activeId} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.15}}
                className="bg-[#f0f6fa] rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loadingDetail || !detail ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <RefreshCw size={28} className="animate-spin text-teal-500 mb-3"/>
                    <p className="text-sm text-slate-400">Loading clinical data…</p>
                  </div>
                ) : (
                  <div className="p-5">
                    <ConditionDetail
                      condition={detail}
                      canEdit={canEdit}
                      onEdit={() => setMode('edit')}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
