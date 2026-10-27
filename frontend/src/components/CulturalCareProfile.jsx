/**
 * CulturalCareProfile
 * Embeddable component — displays and edits a patient's cultural preferences.
 * Feature 6: Cultural Care Profile
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Globe, Heart, Edit3, Check, X } from 'lucide-react';
import { culturalProfileAPI } from '../api/client';
import { toast } from 'sonner';

const LANGUAGES = [
  { value: 'en',  label: 'English'  },
  { value: 'tw',  label: 'Twi'      },
  { value: 'ga',  label: 'Ga'       },
  { value: 'ee',  label: 'Ewe'      },
  { value: 'ha',  label: 'Hausa'    },
  { value: 'dag', label: 'Dagbani'  },
  { value: 'ff',  label: 'Frafra'   },
];

const RELIGIONS = [
  'Christianity', 'Islam', 'Traditional', 'Atheist / None', 'Other',
];

export default function CulturalCareProfile({ patientId, editable = false }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cultural-profile', patientId],
    queryFn: () => culturalProfileAPI.get(patientId).then(r => r.data),
    enabled: !!patientId,
    onSuccess: d => setForm(d),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (payload) => culturalProfileAPI.update(patientId, payload),
    onSuccess: () => {
      toast.success('Cultural profile saved');
      qc.invalidateQueries({ queryKey: ['cultural-profile', patientId] });
      setEditing(false);
    },
    onError: () => toast.error('Could not save cultural profile'),
  });

  if (isLoading) return (
    <div className="animate-pulse space-y-2 p-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-2/3" />
      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
    </div>
  );

  const profile = data || {};
  const langLabel = LANGUAGES.find(l => l.value === profile.preferred_language)?.label || profile.preferred_language || '—';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#f0f6fa] dark:bg-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between"
        style={{ background: 'linear-gradient(to right, #0d948808, transparent)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
            <Globe size={14} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-slate-800 dark:text-white text-sm">Cultural Care Profile</span>
        </div>
        {editable && !editing && (
          <button
            onClick={() => { setForm({ ...profile }); setEditing(true); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 font-medium"
          >
            <Edit3 size={12} /> Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-1">
            <button onClick={() => mutate(form)} disabled={isPending}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-teal-600 hover:bg-teal-50 font-medium">
              <Check size={12} /> {isPending ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {editing ? (
          <EditForm form={form} setForm={setForm} />
        ) : (
          <ViewMode profile={profile} langLabel={langLabel} />
        )}
      </div>
    </div>
  );
}

function ViewMode({ profile, langLabel }) {
  const rows = [
    { label: 'Preferred Language', value: langLabel },
    { label: 'Religious Preference', value: profile.religious_preference || '—' },
    { label: 'Cultural Practices', value: profile.cultural_practices || '—' },
    { label: 'Spiritual Care', value: profile.wants_spiritual_care ? 'Yes, requested' : 'Not requested' },
    { label: 'Cultural Notes', value: profile.cultural_notes || '—' },
  ];

  return (
    <dl className="space-y-2">
      {rows.map(r => (
        <div key={r.label} className="flex gap-2 text-sm">
          <dt className="text-slate-500 dark:text-slate-400 min-w-[130px] text-xs">{r.label}</dt>
          <dd className="text-slate-700 dark:text-slate-200 text-xs font-medium">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EditForm({ form, setForm }) {
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Preferred Language</label>
        <select
          value={form.preferred_language || 'en'}
          onChange={e => set('preferred_language', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-[#f0f6fa] dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Religious Preference</label>
        <select
          value={form.religious_preference || ''}
          onChange={e => set('religious_preference', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-[#f0f6fa] dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select…</option>
          {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cultural Practices</label>
        <input
          type="text"
          value={form.cultural_practices || ''}
          onChange={e => set('cultural_practices', e.target.value)}
          placeholder="e.g. Libation, Prayer at meals, Family elder involvement"
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-[#f0f6fa] dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="spiritual-care"
          checked={!!form.wants_spiritual_care}
          onChange={e => set('wants_spiritual_care', e.target.checked)}
          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        <label htmlFor="spiritual-care" className="text-xs text-slate-600 dark:text-slate-300">
          Patient requests spiritual / faith care
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cultural Notes</label>
        <textarea
          value={form.cultural_notes || ''}
          onChange={e => set('cultural_notes', e.target.value)}
          rows={2}
          placeholder="Any additional cultural or personal context for care…"
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-[#f0f6fa] dark:bg-slate-700 text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
    </div>
  );
}
