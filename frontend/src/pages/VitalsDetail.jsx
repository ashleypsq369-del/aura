import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
 Activity, Heart, Thermometer, Droplets, Wind,
 Plus, Brain, ArrowLeft
} from 'lucide-react';
import apiClient, { mlAPI } from '../api/client';
import { offlineVitalsAPI } from '../api/offlineClient';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import { API_URL } from '../api/client';

function VitalCard({ label, value, unit, icon: Icon, color, status }) {
 const statusCls = status === 'warning'
 ? 'border-amber-300 bg-amber-50'
 : status === 'critical'
 ? 'border-red-300 bg-red-50 animate-pulse'
 : 'border-slate-200 bg-slate-50';

 return (
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 className={`rounded-xl border-2 p-4 shadow-sm ${statusCls}`}
 >
 <div className="flex items-center gap-2 mb-2">
 <div className={`w-7 h-7 rounded-lg flex items-center justify-center`}
 style={{ backgroundColor: `${color}20` }}>
 <Icon size={15} style={{ color }} />
 </div>
 <p className="text-xs font-bold text-slate-500 truncate">{label}</p>
 </div>
 <p className="text-2xl font-bold text-slate-900 tabular-nums">{value ?? '--'}</p>
 <p className="text-xs text-slate-400">{unit}</p>
 </motion.div>
 );
}

export default function VitalsDetail() {
 const { patientId } = useParams();
 const navigate = useNavigate();
 const token = localStorage.getItem('auth_token');
 const [showAI, setShowAI] = useState(false);
 const [aiData, setAiData] = useState(null);
 const [loadingAI, setLoadingAI] = useState(false);

 const { data: patient } = useQuery({
 queryKey: ['patient', patientId],
 queryFn: () => apiClient.get(`/api/patients/${patientId}`).then(r => r.data),
 enabled: !!patientId,
 });

 const { data: vitalsData, isLoading } = useQuery({
 queryKey: ['patient-vitals-detail', patientId],
 queryFn: () => offlineVitalsAPI.getPatientVitals(patientId).then(r => r.data),
 enabled: !!patientId,
 });

 const vitals = Array.isArray(vitalsData) ? vitalsData
 : Array.isArray(vitalsData?.vitals) ? vitalsData.vitals : [];
 const latest = vitals[0];

 const { data: mlRisk, isLoading: mlLoading } = useQuery({
 queryKey: ['vitals-ml-risk', patientId],
 queryFn: () => mlAPI.getTaskPrediction(patientId, 'vital_risk').then(r => r.data),
 enabled: !!patientId && vitals.length > 0,
 staleTime: 5 * 60 * 1000,
 retry: false,
 });

 const getStatus = (type, value) => {
 if (!value) return 'normal';
 if (type === 'bp_sys' && (value > 140 || value < 90)) return 'warning';
 if (type === 'hr' && (value > 100 || value < 60)) return 'warning';
 if (type === 'o2' && value < 95) return value < 90 ? 'critical' : 'warning';
 if (type === 'temp' && (value > 38 || value < 36)) return 'warning';
 return 'normal';
 };

 const chartData = vitals.slice(0, 20).reverse().map(v => ({
 time: new Date(v.recorded_at).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
 HR: v.heart_rate,
 'BP Sys': v.blood_pressure_sys ?? v.blood_pressure_systolic,
 'BP Dia': v.blood_pressure_dia ?? v.blood_pressure_diastolic,
 'O2 %': v.oxygen_saturation,
 'Temp °C': v.temperature,
 }));

 const explainVital = async (type, value) => {
 setLoadingAI(true);
 try {
 const res = await apiClient.post('/api/comprehensive-ai/focused-explanation', {
 patient_id: parseInt(patientId),
 focus_type: 'vital',
 focus_data: { vital_type: type, value },
 });
 setAiData(res.data);
 setShowAI(true);
 } catch {
 // non-fatal
 } finally {
 setLoadingAI(false);
 }
 };

 const actions = [{ label: 'Patient Monitor', icon: Plus, primary: true, onClick: () => navigate(`/patient/${patientId}`) }];

 return (
 <PageTransition>
 <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-0">
 <button onClick={() => navigate(-1)}
 className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors mt-4 mb-2 group">
 <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
 </button>

 <PageHeader
 image="/resources/african/african-vitals.jpg"
 title={patient ? `${patient.full_name} - Vitals` : 'Vitals'}
 subtitle="Complete vital sign history and trends"
 icon={Activity}
 actions={actions}
 />

 {isLoading ? (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 animate-pulse">
 {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
 </div>
 ) : (
 <>
 {/* Latest readings */}
 {latest && (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
 <VitalCard label="Blood Pressure" icon={Heart} color="#e11d48"
 value={latest.blood_pressure_sys ? `${Math.round(latest.blood_pressure_sys)}/${Math.round(latest.blood_pressure_dia ?? 0)}` : null}
 unit="mmHg" status={getStatus('bp_sys', latest.blood_pressure_sys)} />
 <VitalCard label="Heart Rate" icon={Activity} color="#0d9488"
 value={latest.heart_rate ? Math.round(latest.heart_rate) : null}
 unit="bpm" status={getStatus('hr', latest.heart_rate)} />
 <VitalCard label="O₂ Saturation" icon={Wind} color="#1d4ed8"
 value={latest.oxygen_saturation?.toFixed(1)}
 unit="%" status={getStatus('o2', latest.oxygen_saturation)} />
 <VitalCard label="Temperature" icon={Thermometer} color="#ea580c"
 value={latest.temperature?.toFixed(1)}
 unit="°C" status={getStatus('temp', latest.temperature)} />
 <VitalCard label="Resp. Rate" icon={Droplets} color="#7c3aed"
 value={latest.respiratory_rate ? Math.round(latest.respiratory_rate) : null}
 unit="breaths/min" status="normal" />
 </div>
 )}

 {/* ML Vital Risk Anomaly card */}
 {mlRisk && (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
 className={`border-l-4 rounded-r-xl p-4 flex items-start gap-3 mt-6 ${
 mlRisk.risk_level === 'critical' ? 'border-red-500 bg-red-50' :
 mlRisk.risk_level === 'high' ? 'border-orange-500 bg-orange-50' :
 mlRisk.risk_level === 'warning' ? 'border-amber-500 bg-amber-50' :
 'border-teal-500 bg-teal-50'
 }`}>
 <Brain size={16} className="flex-shrink-0 mt-0.5 text-teal-600" />
 <div className="flex-1 min-w-0">
 <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
 ML Vital Risk Assessment
 <span className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize border ${
 mlRisk.risk_level === 'critical' ? 'text-red-700 bg-red-50 border-red-200' :
 mlRisk.risk_level === 'high' ? 'text-orange-700 bg-orange-50 border-orange-200' :
 mlRisk.risk_level === 'warning' ? 'text-amber-700 bg-amber-50 border-amber-200' :
 'text-teal-700 bg-teal-50 border-teal-200'
 }`}>{mlRisk.risk_level} · {Math.round((mlRisk.probability ?? 0) * 100)}%</span>
 </p>
 {mlRisk.top_features?.slice(0, 3).map((f, i) => (
 <div key={i} className="mt-1.5">
 <p className="text-xs text-slate-600">{f.display_name}</p>
 <div className="w-full h-1.5 bg-slate-100 rounded-full mt-0.5">
 <div className="h-full rounded-full" style={{ width: `${Math.min(f.pct, 100)}%`, backgroundColor: f.impact === 'increases_risk' ? '#e11d48' : '#16a34a' }} />
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 )}

 {/* Chart */}
 {chartData.length > 1 && (
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
 className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
 <div className="px-6 py-4 border-b border-slate-200">
 <h2 className="text-base font-bold text-slate-900">Vital Signs Trend</h2>
 </div>
 <div className="p-4">
 <ResponsiveContainer width="100%" height={260}>
 <LineChart data={chartData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
 <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
 <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
 <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12 }} />
 <Legend wrapperStyle={{ fontSize: 12 }} />
 <Line type="monotone" dataKey="HR" stroke="#e11d48" strokeWidth={2} dot={false} name="Heart Rate" />
 <Line type="monotone" dataKey="BP Sys" stroke="#0d9488" strokeWidth={2} dot={false} name="BP Systolic" />
 <Line type="monotone" dataKey="O2 %" stroke="#1d4ed8" strokeWidth={2} dot={false} name="O₂ Sat" />
 <Line type="monotone" dataKey="Temp °C" stroke="#ea580c" strokeWidth={2} dot={false} name="Temp" />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </motion.div>
 )}

 {/* History table */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
 className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
 <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
 <h2 className="text-base font-bold text-slate-900">Vitals History</h2>
 <p className="text-slate-500 text-sm">Complete record of all vital sign measurements</p>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
 {['Date & Time','BP (mmHg)','HR (bpm)','Temp (°C)','O₂ Sat (%)','Resp. Rate','Recorded By'].map(h => (
 <th key={h} className="text-left py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{h}</th>
 ))}
 <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wide">AI</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
 {vitals.map((v) => (
 <tr key={v.id} className="hover:bg-slate-50 transition-colors h-[52px]">
 <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
 {new Date(v.recorded_at).toLocaleString('en-GB', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </td>
 <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
 {v.blood_pressure_sys ? `${Math.round(v.blood_pressure_sys)}/${Math.round(v.blood_pressure_dia ?? 0)}` : '--'}
 </td>
 <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{v.heart_rate ? Math.round(v.heart_rate) : '--'}</td>
 <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{v.temperature?.toFixed(1) ?? '--'}</td>
 <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{v.oxygen_saturation?.toFixed(1) ?? '--'}</td>
 <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{v.respiratory_rate ? Math.round(v.respiratory_rate) : '--'}</td>
 <td className="py-3 px-4 text-sm text-slate-500">{v.recorded_by || 'System'}</td>
 <td className="py-3 px-4 text-right">
 {v.heart_rate >= 100 || v.oxygen_saturation < 95 ? (
 <button onClick={() => explainVital('vitals', v)} disabled={loadingAI}
 className="p-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50" data-tip="Explain with AI">
 <Brain size={14} className="text-purple-600" />
 </button>
 ) : null}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {vitals.length === 0 && (
 <div className="py-12 text-center">
 <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
 <p className="text-slate-500 font-medium">No vitals recorded</p>
 <p className="text-sm text-slate-400 mt-1">Start recording vital signs to track patient health</p>
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
