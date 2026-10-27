import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, AlertTriangle, CheckCircle, TrendingUp,
  Users, Filter, RefreshCw, Info, Shield, Activity,
  Eye, Brain, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ethicsAPI } from '../api/client';
import PageHeader from '../components/PageHeader';

const CATS = {
  age:       { label: 'Age Group',  icon: Users,   color: '#1d4ed8' },
  gender:    { label: 'Gender',     icon: Users,   color: '#7c3aed' },
  region:    { label: 'Region',     icon: Filter,  color: '#0d9488' },
  diagnosis: { label: 'Diagnosis',  icon: Brain,   color: '#e11d48' },
};

function DisparityBar({ value, threshold }) {
  const pct   = Math.min(Math.abs(value) * 100, 50);
  const side  = value >= 0 ? 'right' : 'left';
  const color = Math.abs(value) > threshold ? 'bg-red-500' : Math.abs(value) > threshold / 2 ? 'bg-amber-500' : 'bg-emerald-500';
  const textCls = Math.abs(value) > threshold ? 'text-red-600' : Math.abs(value) > threshold / 2 ? 'text-amber-600' : 'text-emerald-600';
  return (
    <div className="flex items-center gap-2 h-4">
      <div className="w-24 h-2 bg-slate-200 rounded-full relative overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400"/>
        <div className={`absolute inset-y-0 ${color} rounded-full`} style={{ width:`${pct}%`, [side === 'right' ? 'left' : 'right']: '50%' }}/>
      </div>
      <span className={`text-xs font-bold ${textCls}`}>{value >= 0 ? '+' : ''}{(value * 100).toFixed(1)}%</span>
    </div>
  );
}

function GroupCard({ group, data, threshold }) {
  const [open, setOpen] = useState(false);
  const disp   = data.disparity_from_mean ?? 0;
  const isHigh = Math.abs(disp) > threshold;
  const isMed  = !isHigh && Math.abs(disp) > threshold / 2;
  const border = isHigh ? 'border-red-400' : isMed ? 'border-amber-400' : 'border-emerald-400';
  const bg     = isHigh ? 'bg-red-50'     : isMed ? 'bg-amber-50'     : 'bg-emerald-50';
  const label  = isHigh ? 'High Disparity': isMed ? 'Moderate'       : 'Fair';
  const cls    = isHigh ? 'text-red-600'  : isMed ? 'text-amber-600'  : 'text-emerald-600';
  const StatusIcon = isHigh ? AlertTriangle : isMed ? TrendingUp : CheckCircle;

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className={`border-2 rounded-xl ${border} ${bg} overflow-hidden`}>
      <div className="p-4 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <StatusIcon size={18} className={cls}/>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 truncate">{group}</h4>
              <span className={`text-xs font-semibold ${cls}`}>{label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="text-right hidden sm:block">
              <p className="text-lg font-bold text-slate-900">{data.mean_risk_score?.toFixed(3)}</p>
              <p className="text-[10px] text-slate-500">avg risk</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700">{data.count}</p>
              <p className="text-[10px] text-slate-500">samples</p>
            </div>
            {open ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Risk Score</span><span>{((data.mean_risk_score||0)*100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isHigh?'bg-red-500':isMed?'bg-amber-500':'bg-emerald-500'}`} style={{ width:`${Math.min((data.mean_risk_score||0)*100,100)}%` }}/>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Disparity from mean</span>
          <DisparityBar value={disp} threshold={threshold}/>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            className="px-4 pb-4 border-t-2 border-white/50 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">Sample Size</p>
                <p className="font-bold text-slate-900 text-lg">{data.count}</p>
                {data.count < 20 && <p className="text-[10px] text-amber-600 mt-1">Small sample · results may be unreliable</p>}
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">Std Deviation</p>
                <p className="font-bold text-slate-900 text-lg">{data.std_risk_score?.toFixed(3)}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">vs Mean</p>
                <p className={`font-bold text-lg ${disp > 0 ? 'text-red-600' : 'text-teal-600'}`}>
                  {disp >= 0 ? '+' : ''}{(disp * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            {isHigh && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1.5"><AlertTriangle size={12}/> Action Required</p>
                <p className="text-xs text-red-700">
                  This group has a {(Math.abs(disp)*100).toFixed(1)}% deviation from the population mean.
                  {data.count < 30 ? ' Small sample · collect more data before acting.' : ' Investigate with clinical experts.'}
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
  const [tab, setTab] = useState('fairness');
  const [cat, setCat] = useState('age');
  const [threshold, setThreshold] = useState(0.15);

  const { data: biasData, isLoading, refetch } = useQuery({
    queryKey: ['model-bias-report'],
    queryFn: () => ethicsAPI.getBiasReport().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const { data: overrideStats } = useQuery({
    queryKey: ['override-stats'],
    queryFn: () => ethicsAPI.getOverrideStatistics(30).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const { data: impactData } = useQuery({
    queryKey: ['ai-impact'],
    queryFn: () => ethicsAPI.getAIImpactReport().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-teal-600"/>
    </div>
  );

  const overall = biasData?.overall ?? {};
  const catData = biasData?.by_category?.[cat] ?? {};
  const entries = Object.entries(catData);
  const flagged = entries.filter(([,d]) => Math.abs(d.disparity_from_mean??0) > threshold).length;
  const grade = flagged === 0 ? { label:'A · Fair', color:'text-emerald-600', bg:'bg-emerald-50 border-emerald-200' }
              : flagged <= 2  ? { label:'B · Moderate', color:'text-amber-600', bg:'bg-amber-50 border-amber-200' }
              :                  { label:'C · Review', color:'text-red-600', bg:'bg-red-50 border-red-200' };

  const TABS = [
    { id:'fairness',    label:'Fairness Analysis', icon:BarChart3 },
    { id:'overrides',   label:'Clinical Overrides', icon:Eye },
    { id:'impact',      label:'AI Impact',          icon:TrendingUp },
    { id:'recommendations', label:'Recommendations', icon:Shield },
  ];

  return (
    <div className="min-h-screen pb-12">
      <PageHeader image="/resources/african/african-health-tech.jpg" title="AI Fairness & Bias Report" icon={Brain}
        subtitle="Ensuring equitable AI predictions across all patient demographics · Justice Principle">
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold border border-white/30 transition">
          <RefreshCw size={15}/> Refresh
        </button>
      </PageHeader>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${tab===id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>

        {/* FAIRNESS TAB */}
        {tab === 'fairness' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Total Predictions', value: overall.total_predictions ?? 0, color:'text-teal-600', icon:Brain },
                { label:'Avg Risk Score',    value: (overall.mean_risk_score??0).toFixed(3), color:'text-teal-600', icon:Activity },
                { label:'High-Risk Count',   value: overall.high_risk_count ?? 0,  color:'text-red-500',  icon:AlertTriangle },
                { label:'Fairness Grade',    value: grade.label.split(' · ')[0],   color: grade.color,    icon:Shield },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-[#e8fafa] rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
                  <Icon size={18} className={color}/>
                  <div><p className="text-xs text-slate-500">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p></div>
                </div>
              ))}
            </div>

            {/* Threshold */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-600"/>
                <span className="font-bold text-amber-900 text-sm">Disparity Alert Threshold: {(threshold*100).toFixed(0)}%</span>
                <span className="ml-auto text-xs text-amber-700">{flagged} group{flagged!==1?'s':''} flagged in "{CATS[cat]?.label}" view</span>
              </div>
              <input type="range" min={0.05} max={0.30} step={0.05} value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-600"/>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(CATS).map(([key, { label, icon: Icon, color }]) => (
                <button key={key} onClick={() => setCat(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${cat===key ? 'text-white border-transparent shadow-sm' : 'bg-[#e8fafa] text-slate-700 border-slate-200 hover:border-slate-300'}`}
                  style={cat===key ? { backgroundColor: color } : {}}>
                  <Icon size={14}/>{label}
                </button>
              ))}
            </div>

            {/* Group cards */}
            <div className="space-y-3">
              {entries.length === 0 ? (
                <div className="bg-[#e8fafa] rounded-2xl border border-slate-200 p-12 text-center">
                  <BarChart3 size={36} className="mx-auto text-slate-300 mb-3"/>
                  <p className="text-slate-500">No data available for this category</p>
                </div>
              ) : entries.map(([group, data]) => (
                <GroupCard key={group} group={group} data={data} threshold={threshold}/>
              ))}
            </div>
          </div>
        )}

        {/* OVERRIDES TAB */}
        {tab === 'overrides' && (
          <div className="space-y-4">
            {overrideStats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Total Overrides', overrideStats.total_overrides, 'text-slate-800'],
                    ['Avg Difference',  `${overrideStats.average_difference > 0 ? '+' : ''}${((overrideStats.average_difference||0)*100).toFixed(1)}%`, overrideStats.average_difference > 0 ? 'text-red-600' : 'text-teal-600'],
                    ['AI Bias Direction', overrideStats.direction||'Neutral', 'text-slate-700'],
                    ['Recommendation', overrideStats.recommendation||'—', 'text-emerald-600'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="bg-[#e8fafa] rounded-xl border border-slate-200 shadow-sm p-4">
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <p className={`text-lg font-bold ${color}`}>{val}</p>
                    </div>
                  ))}
                </div>
                {overrideStats.by_reason && Object.keys(overrideStats.by_reason).length > 0 && (
                  <div className="bg-[#e8fafa] rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Override Reasons Breakdown</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(overrideStats.by_reason).map(([reason, count]) => (
                        <span key={reason} className="chip-indigo">{reason.replace(/_/g,' ')}: {count}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <p className="text-slate-400 text-center py-12">No override data available</p>}
          </div>
        )}

        {/* IMPACT TAB */}
        {tab === 'impact' && (
          <div className="space-y-4">
            {impactData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Clinician Agreement', `${impactData.clinician_agreement_rate||0}%`, 'text-emerald-600'],
                    ['High-Risk Alerts', impactData.high_risk_alerts||0, 'text-red-500'],
                    ['Engagement Level', impactData.ai_benefit_indicators?.clinician_engagement||'—', 'text-teal-600'],
                    ['Model Reliability', impactData.ai_benefit_indicators?.model_reliability||'—', impactData.ai_benefit_indicators?.model_reliability === 'High' ? 'text-emerald-600' : 'text-amber-600'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="bg-[#e8fafa] rounded-xl border border-slate-200 shadow-sm px-4 py-3">
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <p className={`text-xl font-bold ${color}`}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                  <strong>Academic Basis:</strong> Tilala et al. (2024). Biomedical Ethics in AI: Justice Principle · ensuring fair and equitable distribution of AI benefits and risks across all patient demographics.
                </div>
              </>
            ) : <p className="text-slate-400 text-center py-12">No impact data available</p>}
          </div>
        )}

        {/* RECOMMENDATIONS TAB */}
        {tab === 'recommendations' && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon:AlertTriangle, color:'red',    title:'High Disparity Groups',   text:'Investigate with clinical experts to determine if deviations reflect true health differences or model bias. Document all findings and actions taken.' },
              { icon:Users,         color:'amber',  title:'Small Sample Sizes',       text:'Groups with fewer than 20 predictions produce statistically unreliable results. Prioritise data collection for underrepresented demographics.' },
              { icon:Brain,         color:'violet', title:'Model Retraining',          text:'If persistent disparities are confirmed, retrain with balanced sampling using SMOTE or stratified splitting across demographic groups.' },
              { icon:Shield,        color:'teal',   title:'Clinical Validation',       text:'Never attribute disparity to model bias alone without clinical review. Work with palliative care specialists to interpret all findings.' },
            ].map(({ icon: Icon, color, title, text }) => (
              <div key={title} className={`bg-[#e8fafa] border-2 rounded-2xl p-5 border-${color}-200`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className={`text-${color}-600`}/>
                  <h4 className={`font-bold text-${color}-900 text-sm`}>{title}</h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
