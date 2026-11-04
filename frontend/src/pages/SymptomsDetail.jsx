import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 AlertCircle, Activity, TrendingUp, Brain, ArrowLeft, Zap,
 Plus, X, Loader2, CheckCircle, Heart, Wind,
} from 'lucide-react';
import apiClient, { symptomsAPI } from '../api/client';
import { offlineSymptomsAPI } from '../api/offlineClient';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import PageHeader from '../components/PageHeader';
import PageTransition from '../components/PageTransition';
import FocusedAIExplanation from '../components/FocusedAIExplanation';
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';

function getPainSeverity(level) {
 if (level >= 8) return { color: '#ef4444', label: 'Severe',   bg: '#fef2f2', border: '#fca5a5' };
 if (level >= 5) return { color: '#f97316', label: 'Moderate', bg: '#fff7ed', border: '#fed7aa' };
 if (level >= 3) return { color: '#f59e0b', label: 'Mild',     bg: '#fffbeb', border: '#fde68a' };
 return              { color: '#10b981', label: 'Minimal',  bg: '#f0fdf4', border: '#bbf7d0' };
}

export default function SymptomsDetail() {
 const { patientId } = useParams();
 const navigate = useNavigate();
 const { user } = useAuth();
 const qc = useQueryClient();
 const [showAI, setShowAI] = useState(false);
 const [aiData, setAiData] = useState(null);
 const [loadingAI, setLoadingAI] = useState(false);
 const [showRecord, setShowRecord] = useState(false);
 const [sf, setSf] = useState({
   pain_level: 5, nausea: false, fatigue: false,
   anxiety: false, dyspnea: false, notes: '',
 });
 const canRecord = user?.role && ['admin','clinician','caregiver','patient'].includes(user.role);

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

 const last7 = symptoms.filter(s => (Date.now() - new Date(s.recorded_at)) < 7*86400000).length;

 const topSymptoms = [
   { label: 'Nausea',  count: symptoms.filter(s => s.nausea).length },
   { label: 'Fatigue', count: symptoms.filter(s => s.fatigue).length },
   { label: 'Anxiety', count: symptoms.filter(s => s.anxiety).length },
   { label: 'Dyspnea', count: symptoms.filter(s => s.dyspnea).length },
 ].sort((a, b) => b.count - a.count);

 const chartData = symptoms.slice(0, 20).reverse().map(s => ({
   date: new Date(s.recorded_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
   Pain: s.pain_level,
   Nausea: s.nausea ? 1 : 0,
   Fatigue: s.fatigue ? 1 : 0,
   Anxiety: s.anxiety ? 1 : 0,
 }));

 const recordMut = useMutation({
   mutationFn: (data) => symptomsAPI.log({ patient_id: parseInt(patientId), ...data }),
   onSuccess: () => {
     toast.success('Symptoms recorded');
     setShowRecord(false);
     setSf({ pain_level:5, nausea:false, fatigue:false, anxiety:false, dyspnea:false, notes:'' });
     qc.invalidateQueries({ queryKey: ['patient-symptoms-detail', patientId] });
   },
   onError: e => toast.error(e?.response?.data?.detail || 'Could not record symptoms'),
 });

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
         className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-600)] hover:text-teal-700 transition-colors mt-4 mb-2 group">
         <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back
       </button>

       <PageHeader
         image="/resources/cards/card-symptoms.jpg"
         title={patient ? `${patient.full_name} - Symptoms` : 'Symptoms'}
         subtitle="Patient-reported symptom log and pain management tracking"
         icon={AlertCircle}
         stats={symptoms.length > 0 ? [
           { label: 'Total Reports',   value: symptoms.length,          color: '#2dd4bf' },
           { label: 'Avg Pain',        value: `${avgPainLevel}/10`,     color: avgPainLevel >= 7 ? '#f87171' : avgPainLevel >= 4 ? '#fbbf24' : '#4ade80' },
           { label: 'Most Frequent',   value: topSymptoms[0]?.label || '—', color: '#a78bfa' },
           { label: 'Last 7 Days',     value: last7,                    color: last7 > 0 ? '#fbbf24' : '#4ade80', pulse: last7 > 5 },
         ] : undefined}
       >
         {canRecord && (
           <button onClick={() => setShowRecord(true)}
             style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,#e11d48,#dc2626)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 2px 10px rgba(225,29,72,0.3)', whiteSpace:'nowrap' }}>
             <Plus size={14}/> Record Symptoms
           </button>
         )}
       </PageHeader>

       {isLoading ? (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 animate-pulse">
           {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
         </div>
       ) : (
         <>
           {/* Charts */}
           {chartData.length > 1 && (
             <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
               className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
               <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden">
                 <div style={{ height:3, background:'linear-gradient(90deg,#e11d48,#f97316)' }} />
                 <div className="px-5 py-3 border-b border-[var(--card-border)]">
                   <h2 className="text-sm font-bold text-[var(--text-900)]">Pain Level Trend</h2>
                 </div>
                 <div className="p-4">
                   <ResponsiveContainer width="100%" height={200}>
                     <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                       <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--text-400)' }} />
                       <YAxis domain={[0,10]} tick={{ fontSize:11, fill:'var(--text-400)' }} />
                       <Tooltip contentStyle={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:8, fontSize:12 }} />
                       <Line type="monotone" dataKey="Pain" stroke="#e11d48" strokeWidth={2.5} dot={{ r:3 }} name="Pain Level" />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               </div>
               <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--card-border)] overflow-hidden">
                 <div style={{ height:3, background:'linear-gradient(90deg,#7c3aed,#0891b2)' }} />
                 <div className="px-5 py-3 border-b border-[var(--card-border)]">
                   <h2 className="text-sm font-bold text-[var(--text-900)]">Symptom Frequency</h2>
                 </div>
                 <div className="p-4">
                   <ResponsiveContainer width="100%" height={200}>
                     <BarChart data={topSymptoms} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                       <XAxis type="number" tick={{ fontSize:11, fill:'var(--text-400)' }} />
                       <YAxis dataKey="label" type="category" tick={{ fontSize:11, fill:'var(--text-400)' }} width={56} />
                       <Tooltip contentStyle={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:8, fontSize:12 }} />
                       <Bar dataKey="count" fill="#7c3aed" radius={[0,4,4,0]} name="Reports" />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>
             </motion.div>
           )}

           {/* History — card rows, not a table */}
           <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
             style={{ background:'var(--card-bg)', borderRadius:16, border:'1px solid var(--card-border)', overflow:'hidden', marginTop:24 }}>
             <div style={{ height:3, background:'linear-gradient(90deg,#e11d48,#7c3aed,#0891b2)' }} />
             <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
               <div>
                 <h2 style={{ fontSize:14, fontWeight:700, color:'var(--text-900)', margin:0 }}>Symptom History</h2>
                 <p style={{ fontSize:12, color:'var(--text-400)', margin:0 }}>{symptoms.length} reports · patient-reported</p>
               </div>
             </div>

             {symptoms.length === 0 ? (
               <div style={{ padding:'48px 0', textAlign:'center' }}>
                 <AlertCircle size={32} style={{ color:'var(--card-border)', margin:'0 auto 10px' }} />
                 <p style={{ fontWeight:600, fontSize:13, color:'var(--text-500)', margin:0 }}>No symptoms recorded</p>
                 <p style={{ fontSize:12, color:'var(--text-400)', margin:'4px 0 0' }}>Use "Record Symptoms" to start tracking</p>
               </div>
             ) : (
               <div style={{ display:'flex', flexDirection:'column' }}>
                 {symptoms.map((s, idx) => {
                   const sev = getPainSeverity(s.pain_level ?? 0);
                   const flags = [s.nausea&&'Nausea', s.fatigue&&'Fatigue', s.anxiety&&'Anxiety', s.dyspnea&&'Dyspnea'].filter(Boolean);
                   return (
                     <div key={s.id} style={{
                       display:'flex', alignItems:'center', gap:14, padding:'12px 20px',
                       borderBottom: idx < symptoms.length-1 ? '1px solid var(--card-border)' : 'none',
                       background: idx%2===0 ? 'transparent' : `${sev.bg}40`,
                       transition:'background 0.12s',
                     }}
                     onMouseEnter={e=>e.currentTarget.style.background='var(--page-bg)'}
                     onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?'transparent':`${sev.bg}40`}>
                       {/* Date */}
                       <div style={{ minWidth:130, flexShrink:0 }}>
                         <p style={{ fontSize:12, fontWeight:600, color:'var(--text-700)', margin:0 }}>
                           {new Date(s.recorded_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                         </p>
                         <p style={{ fontSize:11, color:'var(--text-400)', margin:0 }}>
                           {new Date(s.recorded_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                         </p>
                       </div>
                       {/* Pain score */}
                       <div style={{ minWidth:70, flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                         <div style={{ width:36, height:36, borderRadius:10, background:sev.bg, border:`1px solid ${sev.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                           <span style={{ fontSize:13, fontWeight:900, color:sev.color, lineHeight:1 }}>{s.pain_level??'—'}</span>
                         </div>
                         <span style={{ fontSize:10, color:sev.color, fontWeight:700 }}>/10</span>
                       </div>
                       {/* Severity badge */}
                       <div style={{ minWidth:72, flexShrink:0 }}>
                         <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:sev.bg, color:sev.color, border:`1px solid ${sev.border}` }}>
                           {sev.label}
                         </span>
                       </div>
                       {/* Symptom tags */}
                       <div style={{ flex:1, display:'flex', flexWrap:'wrap', gap:4, minWidth:0 }}>
                         {flags.length > 0 ? flags.map(f => (
                           <span key={f} style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99, background:'#f3e8ff', color:'#7c3aed', border:'1px solid #e9d5ff' }}>{f}</span>
                         )) : <span style={{ fontSize:11, color:'var(--text-300)', fontStyle:'italic' }}>None reported</span>}
                       </div>
                       {/* Notes */}
                       {s.notes && (
                         <div style={{ maxWidth:160, flexShrink:0 }}>
                           <p style={{ fontSize:11, color:'var(--text-500)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.notes}</p>
                         </div>
                       )}
                       {/* AI Explain — available for all rows */}
                       <div style={{ flexShrink:0 }}>
                         <button onClick={() => explainSymptom('pain', s.pain_level)} disabled={loadingAI}
                           title="Explain with AI"
                           style={{ width:32, height:32, borderRadius:8, background:'#f5f3ff', border:'1px solid #e9d5ff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity:loadingAI?0.5:1, transition:'all 0.12s' }}
                           onMouseEnter={e=>e.currentTarget.style.background='#ede9fe'}
                           onMouseLeave={e=>e.currentTarget.style.background='#f5f3ff'}>
                           <Brain size={14} style={{ color:'#7c3aed' }} />
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </motion.div>
         </>
       )}

       {/* AI Explanation modal */}
       {showAI && aiData && (
         <FocusedAIExplanation data={aiData} onClose={() => { setShowAI(false); setAiData(null); }} />
       )}

       {/* Record Symptoms Modal */}
       <AnimatePresence>
         {showRecord && (
           <>
             <motion.div key="sb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
               onClick={() => setShowRecord(false)}
               style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(15,23,42,0.55)',backdropFilter:'blur(4px)'}} />
             <div style={{position:'fixed',inset:0,zIndex:9001,display:'flex',alignItems:'center',justifyContent:'center',padding:16,pointerEvents:'none'}}>
               <motion.div key="sm" initial={{opacity:0,scale:0.96,y:14}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
                 transition={{type:'spring',damping:30,stiffness:360}} onClick={e=>e.stopPropagation()}
                 style={{pointerEvents:'all',background:'var(--card-bg)',borderRadius:16,width:'100%',maxWidth:440,overflow:'hidden',boxShadow:'0 12px 60px rgba(15,23,42,0.22)'}}>
                 <div style={{height:3,background:'linear-gradient(90deg,#e11d48,#dc2626)'}} />
                 <div style={{padding:'16px 20px',borderBottom:'1px solid var(--card-border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                   <div>
                     <p style={{fontWeight:800,fontSize:15,color:'var(--text-900)',margin:0}}>Record Symptoms</p>
                     <p style={{fontSize:11,color:'var(--text-400)',margin:0}}>{patient?.full_name}</p>
                   </div>
                   <button onClick={()=>setShowRecord(false)} style={{width:28,height:28,borderRadius:'50%',background:'var(--page-bg)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-500)'}}>
                     <X size={13}/>
                   </button>
                 </div>
                 <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>
                   {/* Pain slider */}
                   <div>
                     <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                       <label style={{fontSize:12,fontWeight:700,color:'var(--text-700)'}}>Pain Level</label>
                       <span style={{fontSize:13,fontWeight:900,color: sf.pain_level>=7?'#ef4444':sf.pain_level>=4?'#f97316':'#10b981'}}>{sf.pain_level}/10</span>
                     </div>
                     <input type="range" min={0} max={10} value={sf.pain_level}
                       onChange={e=>setSf(p=>({...p,pain_level:parseInt(e.target.value)}))}
                       style={{width:'100%',accentColor:'#e11d48'}} />
                     <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text-400)',marginTop:2}}>
                       <span>No pain</span><span>Worst possible</span>
                     </div>
                   </div>
                   {/* Symptom checkboxes */}
                   <div>
                     <label style={{fontSize:12,fontWeight:700,color:'var(--text-700)',display:'block',marginBottom:8}}>Symptoms present</label>
                     <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                       {[
                         {k:'nausea',  label:'Nausea',   icon:'🤢'},
                         {k:'fatigue', label:'Fatigue',  icon:'😴'},
                         {k:'anxiety', label:'Anxiety',  icon:'😰'},
                         {k:'dyspnea', label:'Dyspnea',  icon:'🫁'},
                       ].map(sym=>(
                         <button key={sym.k} type="button"
                           onClick={()=>setSf(p=>({...p,[sym.k]:!p[sym.k]}))}
                           style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:10,
                             background:sf[sym.k]?'#fef2f2':'var(--page-bg)',
                             border:`1.5px solid ${sf[sym.k]?'#fca5a5':'var(--card-border)'}`,
                             cursor:'pointer',transition:'all 0.12s',textAlign:'left'}}>
                           <span style={{fontSize:16}}>{sym.icon}</span>
                           <span style={{fontSize:12,fontWeight:600,color:sf[sym.k]?'#dc2626':'var(--text-700)'}}>{sym.label}</span>
                           {sf[sym.k] && <CheckCircle size={12} style={{color:'#dc2626',marginLeft:'auto'}}/>}
                         </button>
                       ))}
                     </div>
                   </div>
                   {/* Notes */}
                   <div>
                     <label style={{fontSize:12,fontWeight:700,color:'var(--text-700)',display:'block',marginBottom:4}}>Notes (optional)</label>
                     <textarea value={sf.notes} onChange={e=>setSf(p=>({...p,notes:e.target.value}))} rows={2}
                       placeholder="Any additional observations…"
                       style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--card-border)',background:'var(--page-bg)',color:'var(--text-800)',fontSize:13,outline:'none',resize:'none',boxSizing:'border-box',fontFamily:'inherit'}}
                       onFocus={e=>e.target.style.borderColor='#e11d48'}
                       onBlur={e=>e.target.style.borderColor='var(--card-border)'} />
                   </div>
                   <button onClick={()=>recordMut.mutate(sf)} disabled={recordMut.isPending}
                     style={{width:'100%',padding:'11px 0',borderRadius:10,background:'linear-gradient(135deg,#e11d48,#dc2626)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:recordMut.isPending?0.7:1}}>
                     {recordMut.isPending ? <><Loader2 size={14} className="animate-spin"/> Saving…</> : <><CheckCircle size={14}/> Save Symptoms</>}
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
