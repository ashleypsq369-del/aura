import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, AlertTriangle, CheckCircle, TrendingUp,
  Users, Filter, RefreshCw, Info, Shield, Activity,
  Eye, Brain, ChevronDown, ChevronUp
} from 'lucide-react';
import { ethicsAPI } from '../api/client';

const CATEGORY_LABELS = {
  age:       { label: 'Age Group',  icon: Users,    color: 'blue' },
  gender:    { label: 'Gender',     icon: Users,    color: 'purple' },
  region:    { label: 'Region',     icon: Filter,   color: 'teal' },
  diagnosis: { label: 'Diagnosis',  icon: Brain,    color: 'rose' },
};

function DisparityBar({ value, threshold }) {
  const pct  = Math.min(Math.abs(value) * 100, 50); // cap at 50% width
  const side = value >= 0 ? 'right' : 'left';
  const color = Math.abs(value) > threshold ? 'bg-red-500' :
                Math.abs(value) > threshold / 2 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="flex items-center gap-2 h-4">
      <div className="w-24 h-2 bg-slate-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400" />
        <div
          className={`absolute inset-y-0 ${color} rounded-full`}
          style={{
            width: `${pct}%`,
            left:  side === 'right' ? '50%' : undefined,
            right: side === 'left'  ? '50%' : undefined,
          }}
        />
      </div>
      <span className={`text-xs font-bold ${
        Math.abs(value) > threshold     ? 'text-red-600' :
        Math.abs(value) > threshold / 2 ? 'text-amber-600' : 'text-green-600'
      }`}>
        {value >= 0 ? '+' : ''}{(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function GroupCard({ group, data, threshold }) {
  const [expanded, setExpanded] = useState(false);
  const disp    = data.disparity_from_mean ?? 0;
  const isHigh  = Math.abs(disp) > threshold;
  const isMed   = !isHigh && Math.abs(disp) > threshold / 2;

  const borderColor = isHigh ? 'border-red-400' : isMed ? 'border-amber-400' : 'border-green-400';
  const bgColor     = isHigh ? 'bg-red-50'      : isMed ? 'bg-amber-50'      : 'bg-green-50';
  const StatusIcon  = isHigh ? AlertTriangle     : isMed ? TrendingUp         : CheckCircle;
  const statusColor = isHigh ? 'text-red-600'   : isMed ? 'text-amber-600'   : 'text-green-600';
  const statusLabel = isHigh ? 'High Disparity' : isMed ? 'Moderate Disparity' : 'Fair';

  const barWidth = Math.min(data.mean_risk_score * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 rounded-xl ${borderColor} ${bgColor} overflow-hidden`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <StatusIcon size={20} className={statusColor} />
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 truncate">{group}</h4>
              <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <div className="text-right hidden sm:block">
              <p className="text-xl font-bold text-slate-900">{data.mean_risk_score.toFixed(3)}</p>
              <p className="text-[10px] text-slate-500">avg risk</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700">{data.count}</p>
              <p className="text-[10px] text-slate-500">samples</p>
            </div>
            {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </div>
        </div>

        {/* Risk bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Risk Score</span>
            <span>{(data.mean_risk_score * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* Disparity bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Disparity from mean</span>
            <DisparityBar value={disp} threshold={threshold} />
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 border-t-2 border-white/50 pt-3"
          >
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">Sample Size</p>
                <p className="font-bold text-slate-900 text-lg">{data.count}</p>
                {data.count < 20 && (
                  <p className="text-[10px] text-amber-600 mt-1">⚠ï¸ Small sample - results unreliable</p>
                )}
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">Std Deviation</p>
                <p className="font-bold text-slate-900 text-lg">{data.std_risk_score.toFixed(3)}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">vs Overall Mean</p>
                <p className={`font-bold text-lg ${disp > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {disp > 0 ? '-' : '-¼'} {Math.abs(disp * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {isHigh && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-xs font-bold text-red-800 mb-1">⚠ï¸ Action Required</p>
                <p className="text-xs text-red-700">
                  This group has a {(Math.abs(disp) * 100).toFixed(1)}% deviation from the population mean.
                  {data.count < 30
                    ? ' However, the small sample size may be the cause - collect more data before acting.'
                    : ' Investigate with clinical experts to determine if this reflects real health differences or model bias.'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ModelBiasReportPage() {
  const [selectedCategory, setSelectedCategory] = useState('age');
  const [threshold, setThreshold] = useState(0.15);
  const [showInfo, setShowInfo] = useState(false);

  const { data: biasData, isLoading, refetch } = useQuery({
    queryKey: ['model-bias-report'],
    queryFn: async () => {
      const r = await ethicsAPI.getBiasReport();
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: overrideStats } = useQuery({
    queryKey: ['override-stats'],
    queryFn: async () => {
      const r = await ethicsAPI.getOverrideStatistics(30);
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: impactData } = useQuery({
    queryKey: ['ai-impact'],
    queryFn: async () => {
      const r = await ethicsAPI.getAIImpactReport();
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Analysing model fairness...</p>
        </div>
      </div>
    );
  }

  const categoryData = biasData?.by_category?.[selectedCategory] ?? {};
  const overall      = biasData?.overall ?? {};
  const catEntries   = Object.entries(categoryData);

  const flaggedGroups = catEntries.filter(([, d]) =>
    Math.abs(d.disparity_from_mean ?? 0) > threshold
  ).length;

  const overallFairness =
    flaggedGroups === 0 ? { label: 'Fair', color: 'green', score: 'A' } :
    flaggedGroups <= 2  ? { label: 'Moderate Concern', color: 'amber', score: 'B' } :
                          { label: 'Needs Review', color: 'red', score: 'C' };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-6">
{/* € Header €€€€€€€€€€€€€€€€€€€€€€€€€€ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-700 to-pink-600 rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Model Bias & Fairness Report</h1>
              <p className="text-purple-100 mt-1">
                Ensuring equitable AI predictions across all patient demographics
              </p>
              <p className="text-purple-200 text-xs mt-1 font-semibold">
                Based on Tilala et al. (2024) - Biomedical Ethics: Justice Principle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(v => !v)}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
              title="About this report"
            >
              <Info size={20} />
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
              title="Refresh data"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5 text-sm text-purple-900"
          >
            <h3 className="font-bold text-base mb-2">About This Report</h3>
            <p className="mb-2">
              This report analyses whether the AI risk prediction model produces systematically different
              outcomes for different patient groups. High disparity may indicate model bias or genuine
              clinical differences.
            </p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li><strong>Disparity:</strong> How much a group's mean risk score differs from the overall mean</li>
              <li><strong>High Disparity (&gt; threshold):</strong> Requires clinical review</li>
              <li><strong>Small samples (&lt;20):</strong> Statistics unreliable - collect more data</li>
              <li><strong>Cause:</strong> Disparity may be real health differences, not bias - always validate clinically</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* € Summary Cards €€€€€€€€€€€€€€€€€€€€ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Predictions',  value: overall.total_predictions ?? 0,                     color: 'blue',   icon: Brain    },
          { label: 'Avg Risk Score',     value: (overall.mean_risk_score ?? 0).toFixed(3),           color: 'purple', icon: Activity },
          { label: 'High-Risk Patients', value: overall.high_risk_count ?? 0,                        color: 'red',    icon: AlertTriangle },
          { label: 'Fairness Grade',     value: overallFairness.score,                               color: overallFairness.color, icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white border-2 border-${color}-300 rounded-xl p-5 shadow-sm`}
          >
            <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-1">{label}</p>
            <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* € Override Statistics €€€€€€€€€€€€€€ */}
      {overrideStats && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Eye size={18} className="text-indigo-600" />
            Clinical Override Analysis (Last 30 Days)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs font-semibold">Total Overrides</p>
              <p className="text-2xl font-bold text-slate-900">{overrideStats.total_overrides}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Avg Score Difference</p>
              <p className={`text-2xl font-bold ${overrideStats.average_difference < 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {overrideStats.average_difference > 0 ? '+' : ''}{(overrideStats.average_difference * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">AI Bias Direction</p>
              <p className="text-sm font-bold text-slate-700">{overrideStats.direction || 'Neutral'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Recommendation</p>
              <p className="text-sm font-bold text-green-700">{overrideStats.recommendation || '-'}</p>
            </div>
          </div>

          {overrideStats.by_reason && Object.keys(overrideStats.by_reason).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-600 mb-2">Override Reasons</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(overrideStats.by_reason).map(([reason, count]) => (
                  <span
                    key={reason}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full border border-indigo-300"
                  >
                    {reason.replace(/_/g, ' ')}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* € AI Impact (Beneficence) €€€€€€€€€€ */}
      {impactData && (
        <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            AI Impact (Beneficence Principle)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs font-semibold">Clinician Agreement</p>
              <p className="text-2xl font-bold text-emerald-600">{impactData.clinician_agreement_rate}%</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">High-Risk Alerts</p>
              <p className="text-2xl font-bold text-slate-900">{impactData.high_risk_alerts}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Clinician Engagement</p>
              <p className="text-sm font-bold text-slate-700">
                {impactData.ai_benefit_indicators?.clinician_engagement || '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold">Model Reliability</p>
              <p className={`text-sm font-bold ${
                impactData.ai_benefit_indicators?.model_reliability === 'High' ? 'text-green-600' : 'text-amber-600'
              }`}>
                {impactData.ai_benefit_indicators?.model_reliability || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* € Threshold Slider €€€€€€€€€€€€€€€€€€ */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={20} className="text-amber-600" />
          <h3 className="font-bold text-amber-900">Disparity Alert Threshold</h3>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range" min="0.05" max="0.30" step="0.05"
            value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            className="flex-1 accent-amber-600"
          />
          <span className="font-bold text-amber-900 text-xl w-12 text-center">
            {(threshold * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-amber-700 mt-1">
          Groups with risk score deviation &gt;{(threshold * 100).toFixed(0)}% from the mean are flagged.
          Currently: <strong>{flaggedGroups} group{flaggedGroups !== 1 ? 's' : ''}</strong> flagged
          in the "{CATEGORY_LABELS[selectedCategory]?.label}" view.
        </p>
      </div>

      {/* € Category Tabs €€€€€€€€€€€€€€€€€€€€€€ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon: Icon, color }]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
              selectedCategory === key
                ? `bg-${color}-600 text-white border-${color}-600 shadow-lg`
                : `bg-white text-slate-700 border-slate-300 hover:border-${color}-400 hover:bg-${color}-50`
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* € Group Analysis €€€€€€€€€€€€€€€€€€€€€€ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {CATEGORY_LABELS[selectedCategory]?.label} Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {catEntries.length} groups · {flaggedGroups} flagged above threshold
            </p>
          </div>
          {flaggedGroups > 0 && (
            <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
              {flaggedGroups} High Disparity
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {catEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 size={48} className="mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No data available</p>
              <p className="text-xs mt-1">Add more predictions to generate bias analysis</p>
            </div>
          ) : (
            catEntries.map(([group, data]) => (
              <GroupCard
                key={group}
                group={group}
                data={data}
                threshold={threshold}
                overallMean={overall.mean_risk_score}
              />
            ))
          )}
        </div>
      </div>

      {/* € Recommendations €€€€€€€€€€€€€€€€€€ */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={22} className="text-blue-600" />
          Fairness Improvement Recommendations
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: AlertTriangle, color: 'red',
              title: 'High Disparity Groups',
              text: 'Investigate with clinical experts to determine if deviations reflect true health differences or model bias. Document findings.'
            },
            {
              icon: Users, color: 'amber',
              title: 'Small Sample Sizes',
              text: 'Groups with <20 predictions produce statistically unreliable results. Prioritise data collection for underrepresented groups.'
            },
            {
              icon: Brain, color: 'purple',
              title: 'Model Retraining',
              text: 'If persistent disparities are found, retrain with balanced sampling across demographic groups using SMOTE or stratified splitting.'
            },
            {
              icon: Shield, color: 'green',
              title: 'Clinical Validation',
              text: 'Never attribute disparity to model bias alone without clinical review. Work with palliative care specialists to interpret findings.'
            },
          ].map(({ icon: Icon, color, title, text }) => (
            <div key={title} className={`bg-white border-2 border-${color}-200 rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className={`text-${color}-600`} />
                <h4 className={`font-bold text-${color}-900 text-sm`}>{title}</h4>
              </div>
              <p className="text-xs text-slate-700">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* € Citation €€€€€€€€€€€€€€€€€€€€€€€€€ */}
      <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 text-xs text-slate-600">
        <p><strong>Academic Basis:</strong> Tilala et al. (2024). Biomedical Ethics in AI: Justice Principle -
        ensuring fair and equitable distribution of AI benefits and risks across all patient demographics.
        Disparity threshold methodology adapted from Verma &amp; Rubin (2018) fairness definitions.</p>
      </div>
    </div>
  );
}


