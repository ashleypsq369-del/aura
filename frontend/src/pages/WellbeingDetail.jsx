import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Activity, Brain, Moon, Zap, Wind, Smile, AlertCircle, ArrowLeft } from 'lucide-react';
import apiClient from '../api/client';
import { clinicalAssessmentsAPI } from '../api/client';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const ESAS_FIELDS = [
  { key: 'pain',               label: 'Pain',           icon: Zap,       color: '#e11d48' },
  { key: 'tiredness',          label: 'Tiredness',      icon: Moon,      color: '#6366f1' },
  { key: 'drowsiness',         label: 'Drowsiness',     icon: Moon,      color: '#8b5cf6' },
  { key: 'nausea',             label: 'Nausea',         icon: AlertCircle, color: '#f59e0b' },
  { key: 'lack_of_appetite',   label: 'Appetite',       icon: Heart,     color: '#f97316' },
  { key: 'depression',         label: 'Depression',     icon: Brain,     color: '#3b82f6' },
  { key: 'anxiety',            label: 'Anxiety',        icon: Activity,  color: '#0d9488' },
  { key: 'shortness_of_breath',label: 'Breathlessness', icon: Wind,      color: '#0891b2' },
  { key: 'wellbeing',          label: 'Wellbeing',      icon: Smile,     color: '#10b981' },
];

export default function WellbeingDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => apiClient.get(`/api/patients/${patientId}`).then(r => r.data),
    enabled: !!patientId,
  });

  const { data: esasData, isLoading } = useQuery({
    queryKey: ['esas-detail', patientId],
    queryFn: () => clinicalAssessmentsAPI.getESASHistory(patientId).then(r => r.data),
    enabled: !!patientId,
    retry: 1,
  });

  const assessments = Array.isArray(esasData) ? esasData
    : Array.isArray(esasData?.assessments) ? esasData.assessments : [];

  const latest = assessments[0];

  const radarData = latest ? ESAS_FIELDS.map(f => ({
    subject: f.label,
    value: latest[f.key] ?? 0,
  })) : [];

  const trendData = assessments.slice(0, 14).reverse().map(a => ({
    date: new Date(a.assessed_at || a.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    Pain: a.pain,
    Anxiety: a.anxiety,
    Wellbeing: a.wellbeing,
  }));

  return (
    <PageTransition>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-0">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mt-4 mb-2 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>

        <PageHeader
          image="/resources/african/african-wellbeing.jpg"
          title={patient ? `${patient.full_name} — Wellbeing` : 'Wellbeing'}
          subtitle="ESAS assessments and symptom burden tracking"
          icon={Heart}
        />

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 mt-6 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Latest ESAS scores */}
            {latest && (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 mt-6">
                {ESAS_FIELDS.map(({ key, label, icon: Icon, color }, i) => {
                  const val = latest[key] ?? 0;
                  return (
                    <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-[#f0f6fa] rounded-xl border border-slate-200 shadow-sm p-3 text-center">
                      <div className="w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
                      <p className="text-xl font-bold tabular-nums mt-1" style={{ color: val >= 7 ? '#ef4444' : val >= 4 ? '#f59e0b' : '#10b981' }}>
                        {val}
                      </p>
                      <p className="text-[9px] text-slate-400">/10</p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Charts */}
            {assessments.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Radar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-[#f0f6fa] rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900">Symptom Profile</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Latest assessment overview</p>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Radar name="Score" dataKey="value" stroke="#0d9488" fill="#0d9488" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Trend */}
                {trendData.length > 1 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-[#f0f6fa] rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200">
                      <h2 className="text-sm font-bold text-slate-900">Key Trends</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pain, anxiety & wellbeing over time</p>
                    </div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="Pain" stroke="#e11d48" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Anxiety" stroke="#0d9488" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="Wellbeing" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* History table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-[#f0f6fa] rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6 mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
                <h2 className="text-base font-bold text-slate-900">Assessment History</h2>
                <p className="text-slate-500 text-sm">Complete record of wellbeing assessments</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                      {['Date', 'Overall', 'Pain', 'Tiredness', 'Anxiety', 'Depression', 'Wellbeing', 'Total'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {assessments.map((a) => {
                      const total = ESAS_FIELDS.reduce((s, f) => s + (a[f.key] ?? 0), 0);
                      return (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors h-[48px]">
                          <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
                            {new Date(a.assessed_at || a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={total >= 60 ? 'badge-critical' : total >= 30 ? 'badge-high' : 'badge-low'}>
                              {total >= 60 ? 'Severe' : total >= 30 ? 'Moderate' : 'Mild'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold" style={{ color: (a.pain ?? 0) >= 7 ? '#ef4444' : '#475569' }}>{a.pain ?? '--'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{a.tiredness ?? '--'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{a.anxiety ?? '--'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{a.depression ?? '--'}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{a.wellbeing ?? '--'}</td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-900">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {assessments.length === 0 && (
                  <div className="py-12 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 font-medium">No assessments recorded</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
