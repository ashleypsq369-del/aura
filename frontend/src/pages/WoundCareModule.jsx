/**
 * WoundCareModule
 * Per-wound photographic + descriptive healing progress log.
 * Feature 5: Wound Care Module
 * Route: /patients/:patientId/wound-care
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronLeft, TrendingUp, TrendingDown, Minus,
  Camera, FileText, CheckCircle, X,
} from 'lucide-react';
import { woundCareAPI } from '../api/client';
import { toast } from 'sonner';
import PageHeader from '../components/PageHeader';

const HEALING = {
  improving: { label: 'Improving', icon: TrendingUp,  color: '#10b981', bg: '#10b98115' },
  stable:    { label: 'Stable',    icon: Minus,        color: '#0d9488', bg: '#0d948815' },
  worsening: { label: 'Worsening', icon: TrendingDown, color: '#ef4444', bg: '#ef444415' },
};

const WOUND_TYPES = ['pressure_ulcer','surgical','diabetic','burn','laceration','ulcer','other'];
const DEPTHS     = ['superficial','partial','full','bone'];
const EXUDATES   = ['none','minimal','moderate','heavy'];

const EMPTY_FORM = {
  wound_site: '', description: '', healing_stage: 'stable',
  wound_type: 'other', size_cm: '', depth: 'superficial',
  exudate: 'none', odour: false, treatment_applied: '',
};

function WoundCard({ log, idx }) {
  const meta = HEALING[log.healing_stage] || HEALING.stable;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="bg-[#e8fafa] dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between"
        style={{ background: `${meta.color}08` }}>
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{log.wound_site}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {log.wound_type?.replace('_', ' ')} · Recorded by {log.recorded_by}
          </p>
        </div>
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: meta.bg, color: meta.color }}
        >
          <Icon size={11} strokeWidth={2.5} /> {meta.label}
        </span>
      </div>
      <div className="p-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {log.description && <p>{log.description}</p>}
        <div className="flex flex-wrap gap-3 text-[11px]">
          {log.size_cm   && <span className="text-slate-500">Size: <b>{log.size_cm} cm</b></span>}
          {log.depth     && <span className="text-slate-500">Depth: <b>{log.depth}</b></span>}
          {log.exudate   && <span className="text-slate-500">Exudate: <b>{log.exudate}</b></span>}
          {log.odour     && <span className="text-amber-600">⚠ Odour present</span>}
        </div>
        {log.treatment_applied && (
          <div className="text-xs bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg px-3 py-2">
            <span className="font-medium text-teal-700 dark:text-teal-300">Treatment: </span>
            <span className="text-teal-600 dark:text-teal-200">{log.treatment_applied}</span>
          </div>
        )}
        <p className="text-[10px] text-slate-400">
          {new Date(log.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function AddWoundForm({ patientId, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => woundCareAPI.create(patientId, data),
    onSuccess: () => {
      toast.success('Wound log recorded');
      qc.invalidateQueries({ queryKey: ['wound-care', patientId] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to save'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-[#e8fafa] dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm">New Wound Log</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Wound Site *">
          <input
            type="text"
            value={form.wound_site}
            onChange={e => set('wound_site', e.target.value)}
            placeholder="e.g. Left heel, Sacrum, Right knee"
            className={inputCls}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={2}
            placeholder="Appearance, colour, edges…"
            className={inputCls + ' resize-none'}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Wound Type">
            <select value={form.wound_type} onChange={e => set('wound_type', e.target.value)} className={inputCls}>
              {WOUND_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <Field label="Healing Stage">
            <select value={form.healing_stage} onChange={e => set('healing_stage', e.target.value)} className={inputCls}>
              {Object.keys(HEALING).map(k => <option key={k} value={k}>{HEALING[k].label}</option>)}
            </select>
          </Field>
          <Field label="Size (cm)">
            <input type="text" value={form.size_cm} onChange={e => set('size_cm', e.target.value)} placeholder="3x2" className={inputCls} />
          </Field>
          <Field label="Depth">
            <select value={form.depth} onChange={e => set('depth', e.target.value)} className={inputCls}>
              {DEPTHS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Exudate">
            <select value={form.exudate} onChange={e => set('exudate', e.target.value)} className={inputCls}>
              {EXUDATES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="odour"
            checked={form.odour}
            onChange={e => set('odour', e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="odour" className="text-xs text-slate-600 dark:text-slate-300">Odour present</label>
        </div>

        <Field label="Treatment Applied">
          <textarea
            value={form.treatment_applied}
            onChange={e => set('treatment_applied', e.target.value)}
            rows={2}
            placeholder="Dressing applied, irrigation, debridement…"
            className={inputCls + ' resize-none'}
          />
        </Field>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => mutate(form)}
            disabled={isPending || !form.wound_site.trim()}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#0d9488' }}
          >
            {isPending ? 'Saving…' : 'Save Wound Log'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-[#e8fafa] dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function WoundCareModule() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['wound-care', patientId],
    queryFn: () => woundCareAPI.list(patientId).then(r => r.data),
    enabled: !!patientId,
  });

  // Group by wound site
  const sites = [...new Set(logs.map(l => l.wound_site))];

  return (
    <div className="min-h-screen" style={{ background: '#c2dde8' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <PageHeader
          title="Wound Care"
          subtitle="Track wound healing progress and treatment logs"
          icon={<Camera size={18} />}
          backAction={() => navigate(-1)}
        />

        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#0d9488' }}
          >
            <Plus size={15} /> New Log
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AddWoundForm patientId={patientId} onClose={() => setShowForm(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="bg-[#e8fafa] dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-[#e8fafa] dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
            <Camera size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">No wound logs recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map(site => {
              const siteLogs = logs.filter(l => l.wound_site === site);
              const latest = siteLogs[0];
              const meta = HEALING[latest?.healing_stage] || HEALING.stable;
              return (
                <div key={site}>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: meta.color }}
                    />
                    {site} — {siteLogs.length} log{siteLogs.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {siteLogs.map((log, idx) => (
                      <WoundCard key={log.id} log={log} idx={idx} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
