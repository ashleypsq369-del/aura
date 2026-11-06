import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Activity, Heart, Thermometer, Droplets, Wind,
 Plus, Brain, ArrowLeft, X, Loader2, CheckCircle,
} from 'lucide-react';
import apiClient, { mlAPI, vitalsAPI } from '../api/client';
import { offlineVitalsAPI } from '../api/offlineClient';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
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
 : 'border-[var(--card-border)] bg-slate-50';

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
 <p className="text-xs font-bold text-[var(--text-500)] truncate">{label}</p>
 </div>
 <p className="text-2xl font-bold text-[var(--text-900)] tabular-nums">{value ?? '--'}</p>
 <p className="text-xs text-slate-400">{unit}</p>
 </motion.div>
 );
}

export default function VitalsDetail() {
 const { patientId } = useParams();
 const navigate = useNavigate();
 const { user } = useAuth();
 const qc = useQueryClient();
 const token = localStorage.getItem('auth_token');
 const [showAI, setShowAI] = useState(false);
 const [aiData, setAiData] = useState(null);
 const [loadingAI, setLoadingAI] = useState(false);
 const [showRecord, setShowRecord] = useState(false);
 const [vf, setVf] = useState({ heart_rate:'', blood_pressure_sys:'', blood_pressure_dia:'', oxygen_saturation:'', temperature:'', respiratory_rate:'', notes:'' });
 const canRecord = user?.role && ['admin','clinician','caregiver'].includes(user.role);

 const recordMut = useMutation({
 mutationFn: (data) => vitalsAPI.log({ patient_id: parseInt(patientId), ...data }),
 onSuccess: () => {
 toast.success('Vitals recorded');
 setShowRecord(false);
 setVf({ heart_rate:'', blood_pressure_sys:'', blood_pressure_dia:'', oxygen_saturation:'', temperature:'', respiratory_rate:'', notes:'' });
 qc.invalidateQueries({ queryKey: ['patient-vitals-detail', patientId] });
 },
 onError: e => toast.error(e?.response?.data?.detail || 'Could not record vitals'),
 });

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

 return (
 <PageTransition>
 <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-0">
 <button onClick={() => navigate(-1)}
 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-600)] hover:text-teal-700 transition-colors mt-4 mb-2 group">
 <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
 </button>

 <PageHeader
 image="/resources/african/african-vitals.jpg"
 title={patient ? `${patient.full_name} - Vitals` : 'Vitals'}
 subtitle="Complete vital sign history and trends"
 icon={Activity}
 stats={latest ? [
 { label:'BP', value: latest.blood_pressure_sys ? `${Math.round(latest.blood_pressure_sys)}/${Math.round(latest.blood_pressure_dia??0)}` : '-', color: getStatus('bp_sys',latest.blood_pressure_sys)==='warning'?'#f87171':'#2dd4bf' },
 { label:'Heart Rate', value: latest.heart_rate ? `${Math.round(latest.heart_rate)} bpm` : '-', color: getStatus('hr',latest.heart_rate)==='warning'?'#f87171':'#4ade80' },
 { label:'O₂ Sat', value: latest.oxygen_saturation ? `${latest.oxygen_saturation.toFixed(1)}%` : '-', color: getStatus('o2',latest.oxygen_saturation)==='critical'?'#ef4444':getStatus('o2',latest.oxygen_saturation)==='warning'?'#fbbf24':'#60a5fa' },
 { label:'Temp °C', value: latest.temperature ? `${latest.temperature.toFixed(1)}°C` : '-', color: getStatus('temp',latest.temperature)==='warning'?'#fbbf24':'#a78bfa' },
 ] : undefined}
 >
 {canRecord && (
 <button onClick={() => setShowRecord(true)}
 style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 2px 10px rgba(13,148,136,0.3)', whiteSpace:'nowrap' }}>
 <Plus size={14}/> Record Vitals
 </button>
 )}
 </PageHeader>

 {isLoading ? (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 animate-pulse">
 {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
 </div>
 ) : null}

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
 <p className="font-bold text-[var(--text-900)] text-sm flex items-center gap-2">
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
 className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden mt-6">
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

 {/* History - same DNA as PatientDataTable */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
 style={{ background:'var(--card-bg)', borderRadius:16, border:'1px solid var(--card-border)', overflow:'hidden', marginTop:24 }}>
 <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2,#1d4ed8)' }} />
 <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <div>
 <h2 style={{ fontSize:14, fontWeight:700, color:'var(--text-900)', margin:0 }}>Vitals History</h2>
 <p style={{ fontSize:12, color:'var(--text-400)', margin:0 }}>{vitals.length} readings recorded</p>
 </div>
 </div>

 {/* Header row - matches PatientDataTable th style */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 80px 80px 70px 70px 100px 90px', padding:'8px 16px', borderBottom:'1px solid var(--card-border)', background:'var(--page-bg)' }}>
 {['Date & Time','BP','HR (bpm)','SpO₂ (%)','Temp °C','RR','Status','AI Explain'].map(h=>(
 <span key={h} style={{ fontSize:11, fontWeight:700, color:'var(--text-500)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</span>
 ))}
 </div>

 {vitals.length === 0 ? (
 <div style={{ padding:'48px 0', textAlign:'center' }}>
 <Activity size={32} style={{ color:'var(--card-border)', margin:'0 auto 10px' }} />
 <p style={{ fontWeight:600, fontSize:13, color:'var(--text-500)', margin:0 }}>No vitals recorded</p>
 <p style={{ fontSize:12, color:'var(--text-400)', margin:'4px 0 0' }}>Use the Record Vitals button to start tracking</p>
 </div>
 ) : vitals.map((v, idx) => {
 const hrOk  = !v.heart_rate        || (v.heart_rate >= 60  && v.heart_rate <= 100);
 const o2Ok  = !v.oxygen_saturation  || v.oxygen_saturation >= 95;
 const bpOk  = !v.blood_pressure_sys || (v.blood_pressure_sys >= 90 && v.blood_pressure_sys <= 140);
 const tmpOk = !v.temperature        || (v.temperature >= 36  && v.temperature <= 38.5);
 const criticals = [!hrOk, !o2Ok, !bpOk, !tmpOk].filter(Boolean).length;
 const badgeClass = criticals >= 2 ? 'badge-critical' : criticals === 1 ? 'badge-high' : 'badge-low';
 const badgeLabel = criticals >= 2 ? 'Critical' : criticals === 1 ? 'Abnormal' : 'Normal';

 /* gradient avatar by row index - same palette as PatientDataTable */
 const GRADS = ['linear-gradient(135deg,#0d9488,#0891b2)','linear-gradient(135deg,#0891b2,#1d4ed8)','linear-gradient(135deg,#059669,#0d9488)','linear-gradient(135deg,#7c3aed,#0891b2)','linear-gradient(135deg,#d97706,#ea580c)','linear-gradient(135deg,#e11d48,#d97706)'];
 const grad = GRADS[idx % GRADS.length];
 const initials = String(idx + 1).padStart(2,'0');

 /* risk score bar - same as PatientDataTable risk_score column */
 const abnormPct = Math.round((criticals / 4) * 100);
 const barColor  = criticals >= 2 ? '#e11d48' : criticals === 1 ? '#f97316' : '#10b981';

 return (
 <div key={v.id}
 style={{ display:'grid', gridTemplateColumns:'1fr 90px 80px 80px 70px 70px 100px 90px', padding:'12px 16px', borderBottom: idx < vitals.length-1 ? '1px solid var(--card-border)' : 'none', alignItems:'center', transition:'background 0.1s', cursor:'default' }}
 onMouseEnter={e=>e.currentTarget.style.background='var(--page-bg)'}
 onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

 {/* Date - gradient avatar + text, same as PatientDataTable Patient column */}
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <div style={{ width:36, height:36, borderRadius:'50%', background:grad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, boxShadow:'0 2px 6px rgba(0,0,0,0.15)' }}>
 {initials}
 </div>
 <div>
 <p style={{ fontSize:13, fontWeight:600, color:'var(--text-900)', margin:0 }}>
 {new Date(v.recorded_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
 </p>
 <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>
 {new Date(v.recorded_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
 </p>
 </div>
 </div>

 {/* BP */}
 <span style={{ fontSize:13, fontWeight:600, color:bpOk?'var(--text-700)':'#dc2626' }}>
 {v.blood_pressure_sys ? `${Math.round(v.blood_pressure_sys)}/${Math.round(v.blood_pressure_dia??0)}` : '-'}
 </span>

 {/* HR with risk bar - same as PatientDataTable risk_score */}
 <div style={{ display:'flex', alignItems:'center', gap:4 }}>
 <span style={{ fontSize:13, fontWeight:600, color:hrOk?'var(--text-700)':'#dc2626', minWidth:28 }}>
 {v.heart_rate ? Math.round(v.heart_rate) : '-'}
 </span>
 {!hrOk && <div style={{ width:6, height:6, borderRadius:'50%', background:'#ef4444', flexShrink:0, animation:'pulse 2s infinite' }}/>}
 </div>

 {/* SpO2 */}
 <span style={{ fontSize:13, fontWeight:600, color:o2Ok?'var(--text-700)':'#dc2626' }}>
 {v.oxygen_saturation ? `${v.oxygen_saturation.toFixed(1)}%` : '-'}
 </span>

 {/* Temp */}
 <span style={{ fontSize:13, fontWeight:600, color:tmpOk?'var(--text-700)':'#f97316' }}>
 {v.temperature ? `${v.temperature.toFixed(1)}°` : '-'}
 </span>

 {/* RR */}
 <span style={{ fontSize:13, color:'var(--text-600)' }}>
 {v.respiratory_rate ? Math.round(v.respiratory_rate) : '-'}
 </span>

 {/* Status badge - same badge-* classes as PatientDataTable */}
 <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
 <span className={badgeClass} style={{ display:'inline-block', width:'fit-content' }}>{badgeLabel}</span>
 <div style={{ display:'flex', alignItems:'center', gap:4 }}>
 <div style={{ width:48, height:4, background:'var(--card-border)', borderRadius:99, overflow:'hidden' }}>
 <div style={{ height:'100%', width:`${100-abnormPct}%`, background:barColor, borderRadius:99, transition:'width 0.4s' }}/>
 </div>
 </div>
 </div>

 {/* AI Explain */}
 <button onClick={() => explainVital('vitals', v)} disabled={loadingAI}
 style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, background:'#f5f3ff', border:'1px solid #e9d5ff', cursor:'pointer', fontSize:11, fontWeight:700, color:'#7c3aed', opacity:loadingAI?0.5:1, whiteSpace:'nowrap', transition:'all 0.12s' }}
 onMouseEnter={e=>{e.currentTarget.style.background='#ede9fe';}}
 onMouseLeave={e=>{e.currentTarget.style.background='#f5f3ff';}}>
 <Brain size={12}/> AI Explain
 </button>
 </div>
 );
 })}
 </motion.div>

 {showAI && aiData && (
 <FocusedAIExplanation data={aiData} onClose={() => { setShowAI(false); setAiData(null); }} />
 )}

 {/* ── Record Vitals Modal ── */}
 <AnimatePresence>
 {showRecord && (
 <>
 <motion.div key="rv-bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
 onClick={() => setShowRecord(false)}
 style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(15,23,42,0.55)',backdropFilter:'blur(4px)'}} />
 <div style={{position:'fixed',inset:0,zIndex:9001,display:'flex',alignItems:'center',justifyContent:'center',padding:16,pointerEvents:'none'}}>
 <motion.div key="rv-card" initial={{opacity:0,scale:0.96,y:14}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
 transition={{type:'spring',damping:30,stiffness:360}} onClick={e=>e.stopPropagation()}
 style={{pointerEvents:'all',background:'var(--card-bg)',borderRadius:16,width:'100%',maxWidth:440,overflow:'hidden',boxShadow:'0 12px 60px rgba(15,23,42,0.22)'}}>
 <div style={{height:3,background:'linear-gradient(90deg,#0d9488,#0891b2)'}} />
 <div style={{padding:'18px 20px',borderBottom:'1px solid var(--card-border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
 <div>
 <p style={{fontWeight:800,fontSize:15,color:'var(--text-900)',margin:0}}>Record Vitals</p>
 <p style={{fontSize:11,color:'var(--text-400)',margin:'2px 0 0'}}>{patient?.full_name}</p>
 </div>
 <button onClick={() => setShowRecord(false)} style={{width:28,height:28,borderRadius:'50%',background:'var(--page-bg)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-500)'}}>
 <X size={13}/>
 </button>
 </div>
 <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
 <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
 {[
 {k:'heart_rate', l:'Heart Rate (bpm)', p:'e.g. 72'},
 {k:'oxygen_saturation', l:'O₂ Saturation (%)', p:'e.g. 98'},
 {k:'temperature', l:'Temperature (°C)', p:'e.g. 37.0'},
 {k:'respiratory_rate', l:'Respiratory Rate', p:'e.g. 16'},
 ].map(f => (
 <div key={f.k}>
 <label style={{fontSize:11,fontWeight:700,color:'var(--text-500)',display:'block',marginBottom:4}}>{f.l}</label>
 <input type="number" value={vf[f.k]} onChange={e=>setVf(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}
 style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--card-border)',background:'var(--page-bg)',color:'var(--text-800)',fontSize:13,outline:'none',boxSizing:'border-box'}}
 onFocus={e=>e.target.style.borderColor='var(--c-teal)'} onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
 </div>
 ))}
 </div>
 <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
 {[
 {k:'blood_pressure_sys', l:'BP Systolic (mmHg)', p:'e.g. 120'},
 {k:'blood_pressure_dia', l:'BP Diastolic (mmHg)', p:'e.g. 80'},
 ].map(f => (
 <div key={f.k}>
 <label style={{fontSize:11,fontWeight:700,color:'var(--text-500)',display:'block',marginBottom:4}}>{f.l}</label>
 <input type="number" value={vf[f.k]} onChange={e=>setVf(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}
 style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--card-border)',background:'var(--page-bg)',color:'var(--text-800)',fontSize:13,outline:'none',boxSizing:'border-box'}}
 onFocus={e=>e.target.style.borderColor='var(--c-teal)'} onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
 </div>
 ))}
 </div>
 <div>
 <label style={{fontSize:11,fontWeight:700,color:'var(--text-500)',display:'block',marginBottom:4}}>Notes (optional)</label>
 <textarea value={vf.notes} onChange={e=>setVf(p=>({...p,notes:e.target.value}))} rows={2}
 placeholder="Clinical observations…"
 style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--card-border)',background:'var(--page-bg)',color:'var(--text-800)',fontSize:13,outline:'none',resize:'none',boxSizing:'border-box',fontFamily:'inherit'}}
 onFocus={e=>e.target.style.borderColor='var(--c-teal)'} onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
 </div>
 <button onClick={() => recordMut.mutate(vf)} disabled={recordMut.isPending || !vf.heart_rate}
 style={{width:'100%',padding:'11px 0',borderRadius:10,background:'linear-gradient(135deg,#0d9488,#0891b2)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:recordMut.isPending||!vf.heart_rate?0.6:1}}>
 {recordMut.isPending ? <><Loader2 size={14} className="animate-spin"/> Saving…</> : <><CheckCircle size={14}/> Save Vitals</>}
 </button>
 </div>
 </motion.div>
 </div>
 </>
 )}
 </AnimatePresence>

 </div>
 </PageTransition>
 );
}
