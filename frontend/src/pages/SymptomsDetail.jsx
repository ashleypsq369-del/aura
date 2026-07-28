import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle, Activity, TrendingUp, Brain, ArrowLeft, Zap
} from 'lucide-react';
import apiClient from '../api/client';
import { offlineSymptomsAPI } from '../api/offlineClient';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';

function getPainSeverity(level) {
  if (level >= 8) return { color: '#ef4444', label: 'Severe', cls: 'badge-critical' };
  if (level >= 5) return { color: '#f97316', label: 'Moderate', cls: 'badge-high' };
  if (level >= 3) return { color: '#f59e0b', label: 'Mild', cls: 'badge-moderate' };
  return { color: '#10b981', label: 'Minimal', cls: 'badge-low' };
}

export default function SymptomsDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => apiClient.get(`/api/patients/${patientId}`).then(r => r.data),
    enabled: !!patientId,
  });

  const { data: symptomsData, isLoading } = useQuery({
    queryKey: ['patient-symptoms-detail', patientId],
    queryFn: () => offlineSymptomsAPI.getPatientSymptoms(patientId).then(r => r.data),
    enabled: !!patientId,
  });

  const symptoms = Array.isArray(symptomsData) ? symptomsData
    : Array.isArray(symptomsData?.symptoms) ? symptomsData.symptoms : [];

  const avgPainLevel = symptoms.length
    ? (symptoms.reduce((s, x) => s + (x.pain_level ?? 0), 0) / symptoms.length).toFixed(1)
    : 0;

  const chartData = symptoms.slice(0, 20).reverse().map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    Pain: s.pain_level,
    Nausea: s.nausea ? 1 : 0,
    Fatigue: s.fatigue ? 1 : 0,
    Anxiety: s.anxiety ? 1 : 0,
  }));

  const topSymptoms = [
    { label: 'Nausea',   count: symptoms.filter(s => s.nausea).length },
    { label: 'Fatigue',  count: symptoms.filter(s => s.fatigue).length },
    { label: 'Anxiety',  count: symptoms.filter(s => s.anxiety).length },
    { label: 'Dyspnea',  count: symptoms.filter(s => s.dyspnea).length },
  ].sort((a, b) => b.count - a.count);

  const explainSymptom = async (symptomType, severity) => {
    setLoadingAI(true);
    try {
      const res = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
        patient_id: parseInt(patientId),
        focus_type: 'symptom',
        focus_data: { symptom_type: symptomType, severity },
      });
      setAiData(res.data);
      setShowAI(true);
    } catch { /* non-fatal */ }
    finally { setLoadingAI(false); }
  };

  return (
    <PageTransition>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-0">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mt-4 mb-2 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>

        <PageHeader
          image="/resources/cards/card-symptoms.jpg"
          title={patient ? `${patient.full_name} — Symptoms` : 'Symptoms'}
          subtitle="Patient-reported symptom log and pain management tracking"
          icon={AlertCircle}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Total Reports',   value: symptoms.length,           icon: AlertCircle, color: '#0d9488' },
                { label: 'Avg Pain Level',  value: `${avgPainLevel}/10`,       icon: Zap,         color: '#e11d48' },
                { label: 'Most Frequent',   value: topSymptoms[0]?.label || '--', icon: TrendingUp, color: '#7c3aed' },
                { label: 'Last 7 Days',     value: symptoms.filter(s => (Date.now() - new Date(s.recorded_at)) < 7*86400000).length, icon: Activity, color: '#1d4ed8' },
              ].map(({ label, value, icon: Icon, color }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
                </motion.div>
              ))}
            </div>

            {/* Pain trend chart */}
            {chartData.length > 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900">Pain Level Trend</h2>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12 }} />
                        <Line type="monotone" dataKey="Pain" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} name="Pain Level" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900">Symptom Frequency</h2>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topSymptoms} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={60} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Reports" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {/* History table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
                <h2 className="text-base font-bold text-slate-900">Symptom History</h2>
                <p className="text-slate-500 text-sm">Complete log of patient-reported symptoms</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                      {['Date & Time','Pain Level','Symptoms','Severity','Notes','AI Explain'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {symptoms.map((s) => {
                      const sev = getPainSeverity(s.pain_level ?? 0);
                      const flags = [
                        s.nausea && 'Nausea',
                        s.fatigue && 'Fatigue',
                        s.anxiety && 'Anxiety',
                        s.dyspnea && 'Dyspnea',
                      ].filter(Boolean);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors h-[52px]">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                            {new Date(s.recorded_at).toLocaleString('en-GB', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xl font-bold tabular-nums" style={{ color: sev.color }}>
                              {s.pain_level ?? '--'}/10
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {flags.map(f => (
                                <span key={f} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">{f}</span>
                              ))}
                              {flags.length === 0 && <span className="text-xs text-slate-400">None reported</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={sev.cls}>{sev.label}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 max-w-[160px] truncate">{s.notes || '--'}</td>
                          <td className="py-3 px-4">
                            {(s.pain_level ?? 0) >= 7 && (
                              <button onClick={() => explainSymptom('pain', s.pain_level)} disabled={loadingAI}
                                className="p-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50" data-tip="Explain with AI">
                                <Brain size={14} className="text-purple-600" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {symptoms.length === 0 && (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-medium">No symptoms recorded</p>
                    <p className="text-sm text-slate-400 mt-1">Symptom tracking helps monitor patient wellbeing</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {showAI && aiData && (
          <FocusedAIExplanation data={aiData} onClose={() => { setShowAI(false); setAiData(null); }} />
        )}
      </div>
    </PageTransition>
  );
}
