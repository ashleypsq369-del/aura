/**
 * VisitReportCard
 * Shows the auto-generated post-visit summary for a completed appointment.
 * Feature 1: Post-Visit Care Report
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Heart, Pill, AlertCircle, ChevronDown, ChevronUp,
  CheckCircle, TrendingUp, TrendingDown, Minus, Clock, User,
} from 'lucide-react';
import { visitReportAPI } from '../api/client';

const CONDITION_META = {
  improving: { label: 'Improving', icon: TrendingUp,   color: '#10b981', bg: '#10b98118' },
  stable:    { label: 'Stable',    icon: Minus,         color: '#0d9488', bg: '#0d948818' },
  worsening: { label: 'Worsening', icon: TrendingDown,  color: '#ef4444', bg: '#ef444418' },
};

function VitalsGrid({ vitals }) {
  if (!vitals || !Object.keys(vitals).length) return null;
  const rows = [
    { label: 'Blood Pressure', value: vitals.blood_pressure, unit: 'mmHg' },
    { label: 'Heart Rate',     value: vitals.heart_rate,     unit: 'bpm'  },
    { label: 'Temperature',    value: vitals.temperature,    unit: '°C'   },
    { label: 'SpO₂',           value: vitals.oxygen_saturation, unit: '%' },
  ].filter(r => r.value != null);

  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map(r => (
        <div key={r.label} className="bg-slate-50 dark:bg-slate-700/40 rounded-lg px-3 py-2">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{r.label}</div>
          <div className="font-semibold text-slate-800 dark:text-white text-sm">
            {r.value} <span className="text-xs font-normal text-slate-400">{r.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VisitReportCard({ appointmentId, nurseName, visitDate }) {
  const [expanded, setExpanded] = useState(false);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['visit-report', appointmentId],
    queryFn: () => visitReportAPI.getReport(appointmentId).then(r => r.data),
    enabled: !!appointmentId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#e8fafa] dark:bg-slate-800 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-2/3 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
      </div>
    );
  }

  if (isError || !report) return null;

  const meta = CONDITION_META[report.overall_condition] || CONDITION_META.stable;
  const CondIcon = meta.icon;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#e8fafa] dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ background: `${meta.color}10` }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: meta.bg, color: meta.color }}
          >
            <FileText size={15} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Visit Report</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {visitDate ? new Date(visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Completed'}
              {report.nurse_name ? ` · ${report.nurse_name}` : nurseName ? ` · ${nurseName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: meta.bg, color: meta.color }}
          >
            <CondIcon size={11} strokeWidth={2.5} />
            {meta.label}
          </span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-700">
              {/* Pain score */}
              {report.pain_score != null && (
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-rose-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Pain score: <strong>{report.pain_score}/10</strong>
                  </span>
                </div>
              )}

              {/* Vitals */}
              {report.vitals_summary && Object.keys(report.vitals_summary).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Vitals</p>
                  <VitalsGrid vitals={report.vitals_summary} />
                </div>
              )}

              {/* Medications given */}
              {report.medications_given?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Pill size={12} /> Medications Given
                  </p>
                  <ul className="space-y-1">
                    {report.medications_given.map((m, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-1">
                        <span className="text-teal-600 font-medium">{m.name}</span>
                        {m.dose && <span>— {m.dose}</span>}
                        {m.route && <span className="text-slate-400">({m.route})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nurse notes */}
              {report.nurse_notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Nurse Notes</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{report.nurse_notes}</p>
                </div>
              )}

              {/* Wound observations */}
              {report.wound_observations && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Wound Observations</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{report.wound_observations}</p>
                </div>
              )}

              {/* Next visit recommendations */}
              {report.next_visit_recommendations && (
                <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-3">
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Next Steps
                  </p>
                  <p className="text-xs text-teal-600 dark:text-teal-200">{report.next_visit_recommendations}</p>
                </div>
              )}

              {report.sent_to_family && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CheckCircle size={10} className="text-teal-500" />
                  Report sent to family
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
