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
import { useQuery } from '@tanstack/react-query';
import {
  TrendingDown, Clock, AlertTriangle, Pill, Activity,
  ChevronDown, ChevronUp, RefreshCw, Calendar,
} from 'lucide-react';
import { advancedMlAPI } from '../api/client';

// ── Severity left-border colour map ──────────────────────────────────────
const SEV_LEFT = {
  SEVERE:   '#e11d48',
  MODERATE: '#f97316',
  LOW:      '#d97706',
};

const DETR_LEFT = {
  rapid:    '#e11d48',
  moderate: '#f97316',
  mild:     '#d97706',
  stable:   '#16a34a',
};

const DETR_TEXT = {
  rapid:    '#991b1b',
  moderate: '#9a3412',
  mild:     '#92400e',
  stable:   '#166534',
};

const DETR_BAR = {
  rapid:    '#e11d48',
  moderate: '#f97316',
  mild:     '#d97706',
  stable:   '#16a34a',
};

// ── Deterioration section ─────────────────────────────────────────────────
function DeteriorationCard({ data }) {
  const lbColor  = DETR_LEFT[data.level]  || DETR_LEFT.stable;
  const textColor = DETR_TEXT[data.level] || DETR_TEXT.stable;
  const barColor  = DETR_BAR[data.level]  || DETR_BAR.stable;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: lbColor }}
    >
      {/* Header — px-4 py-3 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <TrendingDown size={14} style={{ color: barColor }} />
          <h4 className="text-xs font-semibold text-gray-800">
            Deterioration: <span style={{ color: barColor }}>{data.level?.toUpperCase()}</span>
          </h4>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>
          {(data.deterioration_score * 100).toFixed(0)}%
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {data.days_to_threshold !== null && data.days_to_threshold !== undefined && (
          <p className="text-[10px] font-semibold" style={{ color: textColor }}>
            Estimated {data.days_to_threshold} days to critical threshold
          </p>
        )}

        {/* Velocity by dimension */}
        {Object.keys(data.velocity_by_dim || {}).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 ">Velocity (+ = worsening)</p>
            {Object.entries(data.velocity_by_dim).slice(0, 5).map(([dim, vel]) => (
              <div key={dim} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 capitalize">{dim.replace(/_/g, ' ')}</span>
                <span className={`text-[10px] font-bold tabular-nums ${vel > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {vel > 0 ? '+' : ''}{vel.toFixed(2)}/assessment
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Top drivers */}
        {data.top_drivers?.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 ">Key drivers</p>
            {data.top_drivers.map((d, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle size={9} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-700">{d.reason}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-400">{data.data_points} assessment points analysed</p>
      </div>
    </div>
  );
}

// ── Prognosis card ────────────────────────────────────────────────────────
function PrognosisCard({ data }) {
  if (!data.median_weeks) return null;

  const catColor = {
    days:   '#e11d48',
    weeks:  '#f97316',
    months: '#d97706',
    years:  '#16a34a',
  }[data.risk_category] || '#64748b';

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: catColor }}
    >
      {/* Header — px-4 py-3 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: catColor }} />
          <h4 className="text-xs font-semibold text-gray-800">Prognosis Estimate</h4>
        </div>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: catColor }}>
          {data.risk_category?.toUpperCase()}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="text-center py-1">
          {/* text-2xl per spec (not text-3xl) */}
          <p className="text-2xl font-bold tabular-nums" style={{ color: catColor }}>
            {data.months_display}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">median estimated survival</p>
          {data.range_weeks && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              Range: {data.range_weeks[0]} – {data.range_weeks[1]} weeks
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${data.confidence === 'moderate' ? 'bg-amber-400' : 'bg-gray-300'}`} />
          <p className="text-[10px] text-gray-500 capitalize">
            {data.confidence} confidence · {data.data_sources_used?.join(', ')}
          </p>
        </div>

        {data.key_factors?.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 ">Modifying factors</p>
            {data.key_factors.map((f, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">{f.factor}</span>
                <span className={`text-[10px] font-bold ${f.impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {f.impact > 0 ? '+' : ''}{Math.round(f.impact * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-400 italic">
          Based on PPS score + ESAS burden + diagnosis factors.
          Not a clinical prognosis — discuss with care team.
        </p>
      </div>
    </div>
  );
}

// ── Drug interactions card ────────────────────────────────────────────────
function DrugInteractionsCard({ interactions, medCount }) {
  const [expanded, setExpanded] = useState(false);

  if (!interactions?.length) {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex items-center gap-3 px-4 py-3"
        style={{ borderLeftWidth: 4, borderLeftColor: '#16a34a' }}
      >
        <Pill size={14} className="text-green-600" />
        <div>
          <p className="text-xs font-semibold text-gray-800">No interactions detected</p>
          <p className="text-[10px] text-gray-500">{medCount} medications screened</p>
        </div>
      </div>
    );
  }

  const severe   = interactions.filter(i => i.severity === 'SEVERE');
  const lbColor  = severe.length ? '#e11d48' : '#f97316';

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: lbColor }}
    >
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}>
        <Pill size={14} style={{ color: lbColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800">
            {severe.length > 0 ? `${severe.length} SEVERE` : `${interactions.length}`} Drug Interaction{interactions.length > 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-gray-500">{medCount} medications screened</p>
        </div>
        {expanded ? <ChevronUp size={13} className="text-gray-400"/> : <ChevronDown size={13} className="text-gray-400"/>}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
            exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 space-y-2 border-t border-gray-100">
              {interactions.map((ix, i) => {
                const sevColor = SEV_LEFT[ix.severity] || SEV_LEFT.LOW;
                return (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl border border-gray-200 p-2.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: sevColor }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">
                          {ix.drug_a}{ix.drug_b ? ` + ${ix.drug_b}` : ''}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{ix.effect}</p>
                        <p className="text-[10px] font-bold mt-0.5" style={{ color: sevColor }}>
                          {ix.severity} — {ix.action}
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
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['advanced-ml', patientId],
    queryFn: () => advancedMlAPI.getFullAnalysis(patientId).then(r => r.data),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
        <Activity size={14} className="text-teal-500 animate-pulse" />
        <p className="text-xs text-gray-600">Running advanced analysis (deterioration, prognosis, drug interactions)...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
        <p className="text-xs text-amber-700">Advanced analysis unavailable — check backend connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-teal-600" />
          <h3 className="text-xs font-semibold text-gray-800">Advanced Clinical Analysis</h3>
        </div>
        <button onClick={() => refetch()} disabled={isFetching}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw size={12} className={`text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
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

      {/* Wellness check-in trends */}
      {data.checkin_trends && Object.keys(data.checkin_trends).length > 0 && (
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          style={{ borderLeftWidth: 4, borderLeftColor: '#0d9488' }}
        >
          {/* Header — px-4 py-3 */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Clock size={13} className="text-teal-600" />
            <h4 className="text-xs font-semibold text-gray-800">Daily Wellness Trends (14 days)</h4>
          </div>

          {/* Grid — p-2 cells, text-[10px] labels, text-xs font-bold values */}
          <div className="p-3 grid grid-cols-2 gap-2">
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
                const cellBorder = isWorse ? '#fca5a5' : '#86efac';
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-gray-200 p-2"
                    style={{ borderLeftWidth: 3, borderLeftColor: cellBorder }}
                  >
                    {/* text-[10px] label */}
                    <p className="text-[10px] text-gray-500">{label}</p>
                    {/* text-xs font-bold value */}
                    <p className={`text-xs font-bold tabular-nums ${isWorse ? 'text-red-600' : 'text-green-600'}`}>
                      {v > 0 ? '+' : ''}{v.toFixed(2)}/day
                    </p>
                  </div>
                );
              })}
          </div>

          <p className="text-[10px] text-gray-400 px-4 pb-3">
            {data.checkin_trends.checkin_count_14d ?? 0} check-in{data.checkin_trends.checkin_count_14d !== 1 ? 's' : ''} recorded
          </p>
        </div>
      )}
    </div>
  );
}
