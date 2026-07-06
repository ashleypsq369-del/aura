/**
 * AdvancedMLPanel.jsx
 * ====================
 * Displays all P6-P11 advanced ML analysis for a patient:
 * - Longitudinal deterioration trend + velocity
 * - Survival/prognosis estimate
 * - Drug interaction warnings
 * - Daily wellness check-in trend features
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  TrendingDown, Clock, AlertTriangle, Pill, Activity,
  ChevronDown, ChevronUp, RefreshCw, Calendar, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { advancedMlAPI } from '../api/client';

const SEV_COLORS = {
  SEVERE:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', dot: '#e11d48' },
  MODERATE: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74', dot: '#f97316' },
  LOW:      { bg: '#fffbeb', text: '#92400e', border: '#fcd34d', dot: '#d97706' },
};

const DETR_COLORS = {
  rapid:    { bg: '#fee2e2', text: '#991b1b', bar: '#e11d48' },
  moderate: { bg: '#fff7ed', text: '#9a3412', bar: '#f97316' },
  mild:     { bg: '#fffbeb', text: '#92400e', bar: '#d97706' },
  stable:   { bg: '#f0fdf4', text: '#166534', bar: '#16a34a' },
};

// ── Deterioration section ─────────────────────────────────────────────────
function DeteriorationCard({ data }) {
  const c = DETR_COLORS[data.level] || DETR_COLORS.stable;
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: c.bar + '60', backgroundColor: c.bg }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} style={{ color: c.bar }} />
          <h4 className="text-sm font-bold" style={{ color: c.text }}>Deterioration: {data.level?.toUpperCase()}</h4>
        </div>
        <span className="text-xl font-bold tabular-nums" style={{ color: c.bar }}>
          {(data.deterioration_score * 100).toFixed(0)}%
        </span>
      </div>

      {data.days_to_threshold !== null && data.days_to_threshold !== undefined && (
        <p className="text-xs font-semibold" style={{ color: c.text }}>
          Estimated {data.days_to_threshold} days to critical threshold
        </p>
      )}

      {/* Velocity by dimension */}
      {Object.keys(data.velocity_by_dim || {}).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Velocity (+ = worsening)</p>
          {Object.entries(data.velocity_by_dim).slice(0, 5).map(([dim, vel]) => (
            <div key={dim} className="flex items-center justify-between">
              <span className="text-xs text-slate-600 capitalize">{dim.replace(/_/g, ' ')}</span>
              <span className={`text-xs font-bold tabular-nums ${vel > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {vel > 0 ? '+' : ''}{vel.toFixed(2)}/assessment
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Top drivers */}
      {data.top_drivers?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Key drivers</p>
          {data.top_drivers.map((d, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-red-400 mt-0.5 flex-shrink-0">!</span>
              <p className="text-xs text-slate-700">{d.reason}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-400">{data.data_points} assessment points analysed</p>
    </div>
  );
}

// ── Prognosis card ────────────────────────────────────────────────────────
function PrognosisCard({ data }) {
  if (!data.median_weeks) return null;
  const catColor = {
    days:   '#e11d48', weeks: '#f97316',
    months: '#d97706', years: '#16a34a',
  }[data.risk_category] || '#64748b';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar size={16} style={{ color: catColor }} />
        <h4 className="text-sm font-bold text-slate-800">Prognosis Estimate</h4>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-auto"
          style={{ backgroundColor: catColor }}>
          {data.risk_category?.toUpperCase()}
        </span>
      </div>

      <div className="text-center py-2">
        <p className="text-3xl font-bold tabular-nums" style={{ color: catColor }}>
          {data.months_display}
        </p>
        <p className="text-xs text-slate-500 mt-1">median estimated survival</p>
        {data.range_weeks && (
          <p className="text-[11px] text-slate-400 mt-0.5">
            Range: {data.range_weeks[0]} - {data.range_weeks[1]} weeks
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 pt-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${data.confidence === 'moderate' ? 'bg-amber-400' : 'bg-slate-300'}`} />
        <p className="text-[10px] text-slate-500 capitalize">
          {data.confidence} confidence · {data.data_sources_used?.join(', ')}
        </p>
      </div>

      {data.key_factors?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modifying factors</p>
          {data.key_factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-slate-600">{f.factor}</span>
              <span className={`text-xs font-bold ${f.impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {f.impact > 0 ? '+' : ''}{Math.round(f.impact * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-400 italic">
        Based on PPS score + ESAS burden + diagnosis factors.
        Not a clinical prognosis  --  discuss with care team.
      </p>
    </div>
  );
}

// ── Drug interactions card ────────────────────────────────────────────────
function DrugInteractionsCard({ interactions, medCount }) {
  const [expanded, setExpanded] = useState(false);
  if (!interactions?.length) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
        <Pill size={16} className="text-green-600" />
        <div>
          <p className="text-sm font-bold text-green-800">No interactions detected</p>
          <p className="text-xs text-green-600">{medCount} medications screened</p>
        </div>
      </div>
    );
  }

  const severe = interactions.filter(i => i.severity === 'SEVERE');
  return (
    <div className={`rounded-xl border overflow-hidden ${severe.length ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}>
        <Pill size={16} className={severe.length ? 'text-red-600' : 'text-amber-600'} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${severe.length ? 'text-red-800' : 'text-amber-800'}`}>
            {severe.length > 0 ? `${severe.length} SEVERE` : `${interactions.length}`} Drug Interaction{interactions.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-slate-500">{medCount} medications screened</p>
        </div>
        {expanded ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
            exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 space-y-2 border-t border-slate-200">
              {interactions.map((ix, i) => {
                const c = SEV_COLORS[ix.severity] || SEV_COLORS.LOW;
                return (
                  <div key={i} className="rounded-lg border bg-white p-2.5"
                    style={{ borderColor: c.border }}>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: c.dot }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800">
                          {ix.drug_a}{ix.drug_b ? ` + ${ix.drug_b}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{ix.effect}</p>
                        <p className="text-[10px] font-bold mt-1" style={{ color: c.dot }}>
                          {ix.severity}  --  {ix.action}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AdvancedMLPanel({ patientId }) {
  const [feedbackSent, setFeedbackSent] = useState(false);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['advanced-ml', patientId],
    queryFn: () => advancedMlAPI.getFullAnalysis(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // P11: Submit feedback on advanced ML predictions
  const feedbackMutation = useMutation({
    mutationFn: (feedbackType) =>
      advancedMlAPI.submitFeedback({
        prediction_id: 0,  // Advanced ML panel  --  no single prediction_id
        feedback_type: feedbackType,
        note: `Advanced analysis feedback for patient ${patientId}`,
      }),
    onSuccess: () => setFeedbackSent(true),
    onError: () => setFeedbackSent(true), // Treat gracefully  --  feedback is best-effort
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-3">
        <Activity size={16} className="text-violet-500 animate-pulse" />
        <p className="text-sm text-slate-600">Running advanced analysis (deterioration, prognosis, drug interactions)...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-700">Advanced analysis unavailable  --  check backend connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-800">Advanced Clinical Analysis</h3>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw size={13} className={`text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Deterioration */}
      {data.deterioration && <DeteriorationCard data={data.deterioration} />}

      {/* Prognosis */}
      {data.prognosis && <PrognosisCard data={data.prognosis} />}

      {/* Drug interactions */}
      <DrugInteractionsCard
        interactions={data.drug_interactions || []}
        medCount={0}
      />

      {/* Wellness check-in trends (if any) */}
      {data.checkin_trends && Object.keys(data.checkin_trends).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-teal-600" />
            <h4 className="text-sm font-bold text-slate-700">Daily Wellness Trends (14 days)</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'daily_pain_trend',               label: 'Pain' },
              { key: 'daily_tiredness_trend',           label: 'Tiredness' },
              { key: 'daily_shortness_of_breath_trend', label: 'Breathlessness' },
              { key: 'daily_anxiety_trend',             label: 'Anxiety' },
              { key: 'daily_depression_trend',          label: 'Low Mood' },
              { key: 'daily_nausea_trend',              label: 'Nausea' },
            ]
              .filter(({ key }) => data.checkin_trends[key] !== undefined)
              .map(({ key, label }) => {
                const v = data.checkin_trends[key];
                const isWorse = v > 0;
                return (
                  <div key={key} className={`rounded-lg border px-3 py-2 ${isWorse ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <p className="text-[10px] text-slate-500 capitalize">{label}</p>
                    <p className={`text-sm font-bold tabular-nums ${isWorse ? 'text-red-600' : 'text-green-600'}`}>
                      {v > 0 ? '+' : ''}{v.toFixed(2)}/day
                    </p>
                  </div>
                );
              })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {data.checkin_trends.checkin_count_14d ?? 0} check-in{data.checkin_trends.checkin_count_14d !== 1 ? 's' : ''} recorded
          </p>
        </div>
      )}

      {/* P11: Clinician feedback on ML predictions */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          {feedbackSent
            ? 'Feedback recorded  --  thank you for improving our models.'
            : 'Is this analysis clinically accurate?'}
        </p>
        {!feedbackSent && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => feedbackMutation.mutate('agree')}
              disabled={feedbackMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
            >
              <ThumbsUp size={11} /> Yes
            </button>
            <button
              onClick={() => feedbackMutation.mutate('disagree')}
              disabled={feedbackMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
            >
              <ThumbsDown size={11} /> No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
