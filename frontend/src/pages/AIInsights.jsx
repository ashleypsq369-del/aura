/**
 * AIInsights - Clinical Intelligence Hub
 * Purpose-built AI risk table. Click row → portal overlay matching FocusedAIExplanation quality.
 */
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, AlertTriangle, CheckCircle, TrendingDown, Search,
  RefreshCw, Zap, Pill, TrendingUp, ExternalLink,
  Loader2, BarChart2, X, ChevronRight, Copy,
  ThumbsUp, ThumbsDown, Activity,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { aiAPI, advancedMlAPI, mlAPI, patientsAPI } from '../api/client';
import PageHeader from '../components/PageHeader';
import toast from '../utils/toast';

/* ── Risk config ─────────────────────────────────────────────────────────── */
const RISK_CFG = {
  critical: { label:'Critical', color:'#dc2626', bg:'#fef2f2', border:'#fca5a5', pill:'#dc2626', text:'#fff', avatarBg:'linear-gradient(135deg,#dc2626,#b91c1c)' },
  high:     { label:'High',     color:'#ea580c', bg:'#fff7ed', border:'#fed7aa', pill:'#ea580c', text:'#fff', avatarBg:'linear-gradient(135deg,#ea580c,#c2410c)' },
  moderate: { label:'Moderate', color:'#d97706', bg:'#fffbeb', border:'#fde68a', pill:'#d97706', text:'#fff', avatarBg:'linear-gradient(135deg,#d97706,#b45309)' },
  low:      { label:'Stable',   color:'#0d9488', bg:'#f0fdfa', border:'#99f6e4', pill:'#0d9488', text:'#fff', avatarBg:'linear-gradient(135deg,#0d9488,#0891b2)' },
  unknown:  { label:'Unknown',  color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', pill:'#64748b', text:'#fff', avatarBg:'linear-gradient(135deg,#64748b,#475569)' },
};
function riskCfg(level) {
  const l = (level||'').toLowerCase();
  if (l==='critical'||l==='crisis') return RISK_CFG.critical;
  if (l==='high')                   return RISK_CFG.high;
  if (l==='moderate'||l==='medium') return RISK_CFG.moderate;
  if (l==='low'||l==='stable'||l==='normal') return RISK_CFG.low;
  return RISK_CFG.unknown;
}

const DOMAIN_LABELS = {
  vital_risk:'Vital Signs', symptom_burden:'Symptom Burden',
  functional_decline:'Function', cognitive_impairment:'Cognition',
  mental_health_risk:'Mental Health', medication_risk:'Medication',
  caregiver_burden:'Caregiver', admission_risk:'Admission Risk',
};

function initials(name='') {
  return name.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?';
}

function drugPair(it) {
  const d1 = it.drug1||it.medication_1||it.drug_name_1||it.med1||it.medication1||'';
  const d2 = it.drug2||it.medication_2||it.drug_name_2||it.med2||it.medication2||'';
  return { d1, d2 };
}

/* ── Score bar ───────────────────────────────────────────────────────────── */
function ScoreBar({ pct, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:90 }}>
      <div style={{ flex:1, height:6, borderRadius:99, background:'var(--page-bg)', overflow:'hidden', minWidth:48 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width 0.4s ease' }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:800, tabularNums:true, color, minWidth:34, textAlign:'right' }}>{pct}%</span>
    </div>
  );
}

/* ── Detail overlay — portal, matches FocusedAIExplanation quality ───────── */
function DetailOverlay({ patient, onClose }) {
  const pid      = String(patient.id||patient.patient_id);
  const cfg      = riskCfg(patient.risk_level);
  const navigate = useNavigate();
  const [tab,      setTab]      = useState('summary');
  const [view,     setView]     = useState('focused');   // focused | comprehensive
  const [feedback, setFeedback] = useState(null);
  const [fbSent,   setFbSent]   = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [acked,    setAcked]    = useState(false);
  const [followUp, setFollowUp] = useState('');

  const { data:mlRisk, isLoading } = useQuery({
    queryKey: ['ml-risk', pid],
    queryFn: ()=>mlAPI.getPatientRisk(pid).then(r=>r.data),
    enabled:!!pid, staleTime:5*60*1000, retry:false,
  });
  const { data:drugData } = useQuery({
    queryKey: ['drug-ints', pid],
    queryFn: ()=>advancedMlAPI.getDrugInteractions(pid).then(r=>r.data),
    enabled:!!pid, staleTime:5*60*1000, retry:false,
  });

  const riskPct    = Math.round((mlRisk?.overall_risk??patient.overall_risk??0)*100);
  const interactions = drugData?.interactions||[];
  const severeInts   = interactions.filter(i=>['severe','SEVERE','major'].includes(i.severity));
  const confidence   = mlRisk?.confidence ?? mlRisk?.model_confidence ?? null;

  const shapFeatures = useMemo(()=>{
    if (!mlRisk?.tasks) return null;
    const map={};
    Object.values(mlRisk.tasks).forEach(t=>{
      (t.top_features||[]).forEach(f=>{
        const k=f.display_name||f.feature;
        if (!map[k]||(f.pct||0)>(map[k].pct||0)) map[k]=f;
      });
    });
    const arr=Object.values(map).filter(f=>(f.pct||0)>0).sort((a,b)=>(b.pct||0)-(a.pct||0)).slice(0,8);
    if (!arr.length) return null;
    return arr.map(f=>({
      name:f.display_name||f.feature,
      shap_value:f.shap_value||0, pct:f.pct||0,
      impact:f.impact, value:f.value,
    }));
  }, [mlRisk]);

  const domains = Object.entries(mlRisk?.tasks||{})
    .filter(([,t])=>(t.probability||0)>0)
    .sort(([,a],[,b])=>(b.probability||0)-(a.probability||0));

  const name = patient.full_name||patient.patient_name||'Patient';

  const copyToNote = () => {
    const concerns = (mlRisk?.key_concerns||[]).map((c,i)=>`${i+1}. ${c}`).join('\n');
    const actions  = (mlRisk?.recommended_actions||[]).map((a,i)=>`${i+1}. ${a}`).join('\n');
    const text     = `AI Clinical Intelligence — ${name}\nRisk: ${cfg.label} (${riskPct}%)\n\nClinical Concerns:\n${concerns||'None'}\n\nRecommended Actions:\n${actions||'None'}`;
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  const TABS = [
    { id:'summary', label:'Summary'      },
    { id:'ai',      label:'AI Explanation'},
    { id:'domains', label:'Risk Domains'  },
  ];

  const modal = (
    <>
      {/* Backdrop */}
      <motion.div key="ai-bg"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.45)' }}/>

      {/* Card */}
      <div style={{ position:'fixed', inset:0, zIndex:9501, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}>
        <motion.div key="ai-card"
          initial={{ opacity:0, y:16, scale:0.97 }}
          animate={{ opacity:1, y:0,  scale:1    }}
          exit   ={{ opacity:0, y:8,  scale:0.97 }}
          transition={{ type:'spring', damping:30, stiffness:360 }}
          onClick={e=>e.stopPropagation()}
          style={{
            pointerEvents:'all',
            background:'#ffffff',
            borderRadius:14,
            width:'100%', maxWidth:580,
            maxHeight:'92vh',
            display:'flex', flexDirection:'column',
            boxShadow:'0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            fontFamily:"'Inter','system-ui',sans-serif",
            overflow:'hidden',
          }}
        >
          {/* ── Modal header ── */}
          <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              {/* Patient identity */}
              <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                <div style={{ width:42, height:42, borderRadius:10, flexShrink:0,
                  background:cfg.avatarBg, display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:800, fontSize:14 }}>
                  {initials(name)}
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ margin:'0 0 2px', fontSize:15, fontWeight:700, color:'#0f172a' }}>{name}</p>
                  <p style={{ margin:0, fontSize:12, color:'#64748b' }}>
                    {[patient.patient_code, patient.primary_diagnosis?.split('(')[0]?.trim()].filter(Boolean).join(' · ')}
                  </p>
                  <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>
                    {[patient.age&&`${patient.age}y`, patient.gender, patient.care_setting].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              {/* Risk + controls */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, flexShrink:0 }}>
                <div style={{ textAlign:'right' }}>
                  <p style={{ margin:'0 0 2px', fontSize:20, fontWeight:900, color:cfg.color, lineHeight:1 }}>{riskPct}%</p>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
                    background:cfg.pill, color:cfg.text, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                    {cfg.label}
                  </span>
                </div>
                {/* Focused / Comprehensive toggle */}
                <div style={{ display:'flex', borderRadius:7, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                  {['focused','comprehensive'].map(v=>(
                    <button key={v} onClick={()=>setView(v)} style={{
                      padding:'4px 10px', fontSize:11, fontWeight:600, border:'none', cursor:'pointer',
                      background:view===v?'#0d9488':'transparent',
                      color:view===v?'#fff':'#64748b', transition:'all 0.15s',
                    }}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={onClose}
                  style={{ width:28, height:28, borderRadius:'50%', background:'#f1f5f9',
                    border:'none', cursor:'pointer', display:'flex', alignItems:'center',
                    justifyContent:'center', color:'#64748b', flexShrink:0 }}>
                  <X size={14}/>
                </button>
              </div>
            </div>

            {/* Info row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:'1px solid #f1f5f9',
              borderBottom:'1px solid #f1f5f9', margin:'10px -18px 0', padding:'8px 18px', gap:4 }}>
              {[
                { label:'RISK LEVEL', value:cfg.label, color:cfg.color },
                { label:'AI SCORE',   value:`${riskPct}%`, color:cfg.color },
                { label:'DRUG FLAGS', value:interactions.length,
                  color:severeInts.length>0?'#dc2626':'#0d9488' },
                { label:'DOMAINS',    value:domains.length, color:'#0d9488' },
              ].map(it=>(
                <div key={it.label}>
                  <p style={{ margin:'0 0 1px', fontSize:10, fontWeight:600, color:'#94a3b8', letterSpacing:'0.06em' }}>{it.label}</p>
                  <p style={{ margin:0, fontSize:14, fontWeight:700, color:it.color||'#0f172a' }}>{it.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                flex:1, padding:'9px 4px', fontSize:12, fontWeight:tab===t.id?700:500,
                color:tab===t.id?'#0d9488':'#64748b', background:'transparent', border:'none',
                borderBottom:tab===t.id?'2px solid #0d9488':'2px solid transparent',
                cursor:'pointer', transition:'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── Scrollable body ── */}
          <div style={{ flex:1, overflowY:'auto', padding:18, display:'flex', flexDirection:'column', gap:14 }}>
            {isLoading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 0', gap:10 }}>
                <Loader2 size={22} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
                <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>Running AI analysis…</p>
              </div>
            ) : (
              <>
                {/* ── SUMMARY tab ── */}
                {tab==='summary' && (
                  <>
                    {/* Severe drug alert */}
                    {severeInts.length>0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                        background:'#fef2f2', borderRadius:8, border:'1px solid #fca5a5' }}>
                        <AlertTriangle size={13} style={{ color:'#dc2626', flexShrink:0 }}/>
                        <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#dc2626' }}>
                          {severeInts.length} severe drug interaction{severeInts.length>1?'s':''} — review before administering
                        </p>
                      </div>
                    )}

                    {/* AI confidence */}
                    {confidence!=null && (
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>AI confidence</span>
                        <div style={{ flex:1, height:5, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                          <motion.div initial={{ width:0 }} animate={{ width:`${Math.round(confidence*100)}%` }}
                            transition={{ duration:0.8, ease:'easeOut' }}
                            style={{ height:'100%', background:'#0d9488', borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:13, fontWeight:700, color:'#0f172a', flexShrink:0 }}>
                          {Math.round(confidence*100)}%
                        </span>
                      </div>
                    )}

                    {/* Clinical concerns */}
                    {mlRisk?.key_concerns?.length>0 && (
                      <div>
                        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em' }}>CLINICAL CONCERNS</p>
                        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                          {mlRisk.key_concerns.slice(0,5).map((c,i)=>(
                            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'7px 0',
                              borderBottom:i<Math.min(mlRisk.key_concerns.length,5)-1?'1px solid #f8fafc':'none' }}>
                              <span style={{ fontSize:12, fontWeight:600, color:'#f59e0b', flexShrink:0, minWidth:16 }}>{i+1}.</span>
                              <p style={{ margin:0, fontSize:13, color:'#1e293b', lineHeight:1.55 }}>{c}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended actions */}
                    {mlRisk?.recommended_actions?.length>0 && (
                      <div>
                        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em' }}>RECOMMENDED ACTIONS</p>
                        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                          {mlRisk.recommended_actions.slice(0,5).map((a,i)=>{
                            const urgent = /urgent|immediate|critical/i.test(a);
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'7px 0',
                                borderBottom:i<Math.min(mlRisk.recommended_actions.length,5)-1?'1px solid #f8fafc':'none' }}>
                                <span style={{ fontSize:12, fontWeight:600, color:'#94a3b8', flexShrink:0, minWidth:16 }}>{i+1}</span>
                                <p style={{ margin:0, fontSize:13, color:'#1e293b', lineHeight:1.55, flex:1, fontWeight:urgent?700:400 }}>{a}</p>
                                {urgent && <span style={{ fontSize:11, fontWeight:700, color:'#dc2626', flexShrink:0 }}>URGENT</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Drug interactions */}
                    {interactions.length>0 && (
                      <div>
                        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em' }}>
                          MEDICATION INTERACTIONS
                          <span style={{ marginLeft:8, fontSize:11, fontWeight:700, padding:'1px 7px',
                            borderRadius:99, background:'#fee2e2', color:'#dc2626' }}>
                            {interactions.length}
                          </span>
                        </p>
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {interactions.slice(0,5).map((it,i)=>{
                            const sev=['severe','SEVERE','major'].includes(it.severity);
                            const { d1, d2 } = drugPair(it);
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10,
                                padding:'8px 12px', borderRadius:8,
                                background:sev?'#fef2f2':'#fffbeb',
                                border:`1px solid ${sev?'#fca5a5':'#fde68a'}` }}>
                                <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99,
                                  background:sev?'#dc2626':'#f59e0b', color:'#fff', flexShrink:0, alignSelf:'flex-start' }}>
                                  {it.severity?.toUpperCase()}
                                </span>
                                <div style={{ minWidth:0 }}>
                                  {d1&&d2
                                    ? <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:600, color:'#1e293b' }}>{d1} + {d2}</p>
                                    : d1
                                      ? <p style={{ margin:'0 0 2px', fontSize:12, fontWeight:600, color:'#1e293b' }}>{d1}</p>
                                      : <p style={{ margin:'0 0 2px', fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Drug details pending</p>
                                  }
                                  {it.description && (
                                    <p style={{ margin:0, fontSize:11, color:'#64748b', lineHeight:1.5 }}>{it.description}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* No concerns fallback */}
                    {!mlRisk?.key_concerns?.length && !mlRisk?.recommended_actions?.length && (
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                        padding:'32px 24px', gap:8, textAlign:'center',
                        background:'linear-gradient(135deg,#f0fdf490,#dcfce790)', borderRadius:10, border:'1px solid #bbf7d0' }}>
                        <CheckCircle size={28} style={{ color:'#16a34a', opacity:0.7 }}/>
                        <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#15803d' }}>No critical concerns</p>
                        <p style={{ margin:0, fontSize:12, color:'#16a34a' }}>Patient indicators are within acceptable ranges.</p>
                      </div>
                    )}
                  </>
                )}

                {/* ── AI EXPLANATION tab ── */}
                {tab==='ai' && (
                  <>
                    {view==='focused' ? (
                      /* Focused: top concerns driving the score */
                      <>
                        {shapFeatures?.length>0 ? (
                          <div>
                            <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em' }}>
                              {mlRisk?.tasks?.[Object.keys(mlRisk.tasks)[0]]?.shap_available
                                ? 'SHAP — FACTORS DRIVING THIS RISK SCORE'
                                : 'CLINICAL FEATURE IMPORTANCE'}
                            </p>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {shapFeatures.slice(0,5).map((f,i)=>{
                                const isRisk = f.impact==='increases_risk'||f.shap_value>0;
                                const col    = isRisk?'#dc2626':'#0d9488';
                                return (
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                                    <span style={{ fontSize:11, color:'#94a3b8', width:16, flexShrink:0, fontWeight:700 }}>#{i+1}</span>
                                    <span style={{ fontSize:12, color:'#334155', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                                    <div style={{ width:80, height:5, background:'#e2e8f0', borderRadius:99, flexShrink:0, overflow:'hidden' }}>
                                      <div style={{ height:'100%', width:`${Math.round((f.pct/Math.max(...shapFeatures.map(x=>x.pct),1))*100)}%`, background:col, borderRadius:99 }}/>
                                    </div>
                                    <span style={{ fontSize:11, fontWeight:700, color:col, width:60, textAlign:'right', flexShrink:0 }}>
                                      {isRisk?'Raises':'Lowers'} risk
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign:'center', padding:'32px 24px' }}>
                            <CheckCircle size={28} style={{ color:'#0d9488', opacity:0.5, margin:'0 auto 8px' }}/>
                            <p style={{ fontWeight:600, color:'#475569', margin:'0 0 4px' }}>No significant risk drivers</p>
                            <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>This patient's clinical indicators are within normal ranges.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Comprehensive: all 8 features with value + impact bar */
                      <>
                        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em' }}>CONTRIBUTING FACTORS (ALL)</p>
                        {shapFeatures?.length>0 ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {shapFeatures.map((f,i)=>{
                              const isRisk = f.impact==='increases_risk'||f.shap_value>0;
                              const col    = isRisk?'#dc2626':'#0d9488';
                              const valStr = f.value!=null&&f.value!==0
                                ? (typeof f.value==='number'
                                    ? f.value%1===0?String(f.value):f.value.toFixed(1)
                                    : String(f.value))
                                : null;
                              return (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                                  <span style={{ fontSize:11, color:'#94a3b8', width:16, flexShrink:0, fontWeight:700 }}>#{i+1}</span>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <p style={{ margin:'0 0 1px', fontSize:12, color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</p>
                                    {valStr && <p style={{ margin:0, fontSize:10, color:'#94a3b8' }}>Value: <strong style={{ color:'#475569' }}>{valStr}</strong></p>}
                                  </div>
                                  <div style={{ width:100, height:5, background:'#e2e8f0', borderRadius:99, flexShrink:0, overflow:'hidden' }}>
                                    <div style={{ height:'100%', width:`${Math.round((f.pct/Math.max(...shapFeatures.map(x=>x.pct),1))*100)}%`, background:col, borderRadius:99 }}/>
                                  </div>
                                  <span style={{ fontSize:11, fontWeight:700, color:col, width:56, textAlign:'right', flexShrink:0 }}>
                                    {isRisk?<TrendingUp size={10}/>:<TrendingDown size={10}/>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>No feature data available.</p>
                        )}
                      </>
                    )}

                    {/* Legend */}
                    <div style={{ display:'flex', gap:16, paddingTop:4 }}>
                      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#94a3b8' }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:'#dc2626', flexShrink:0 }}/>Raises risk
                      </span>
                      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#94a3b8' }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:'#0d9488', flexShrink:0 }}/>Lowers risk
                      </span>
                    </div>
                  </>
                )}

                {/* ── DOMAINS tab ── */}
                {tab==='domains' && (
                  <>
                    <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em' }}>RISK PROBABILITY ACROSS 8 CLINICAL DOMAINS</p>
                    {domains.length===0 ? (
                      <p style={{ fontSize:12, color:'#94a3b8', textAlign:'center', padding:'32px 0' }}>No domain data available yet.</p>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {domains.slice(0,8).map(([key,task])=>{
                          const pct = Math.round((task.probability||0)*100);
                          const col = pct>70?'#dc2626':pct>40?'#ea580c':pct>15?'#d97706':'#0d9488';
                          return (
                            <div key={key} style={{ padding:'10px 12px', borderRadius:8,
                              background:'var(--card-bg)', border:'1px solid var(--card-border)' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                                <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#1e293b' }}>{DOMAIN_LABELS[key]||key}</p>
                                <span style={{ fontSize:12, fontWeight:700, color:col }}>{pct}%</span>
                              </div>
                              <div style={{ height:5, borderRadius:99, background:'#e2e8f0', overflow:'hidden' }}>
                                <motion.div style={{ height:'100%', background:col, borderRadius:99 }}
                                  initial={{ width:0 }} animate={{ width:`${pct}%` }}
                                  transition={{ duration:0.4, ease:'easeOut' }}/>
                              </div>
                              {task.top_features?.[0] && (
                                <p style={{ margin:'4px 0 0', fontSize:11, color:'#94a3b8' }}>
                                  Main factor: {task.top_features[0].display_name||task.top_features[0].feature}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Feedback */}
                <div style={{ paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                  {!fbSent ? (
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, color:'#64748b' }}>Was this helpful?</span>
                      {[
                        { type:'helpful',    label:'Helpful',      Icon:ThumbsUp    },
                        { type:'partial',    label:'Partial',      Icon:Activity    },
                        { type:'not_helpful',label:'Not helpful',  Icon:ThumbsDown  },
                      ].map(({ type, label, Icon })=>(
                        <button key={type} onClick={()=>{ setFeedback(type); setFbSent(true); }} style={{
                          display:'flex', alignItems:'center', gap:5,
                          padding:'5px 12px', borderRadius:6, border:'1px solid #e2e8f0',
                          background:feedback===type?'#f0fdf4':'transparent',
                          color:feedback===type?'#16a34a':'#475569',
                          fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.12s',
                        }}>
                          <Icon size={13}/>{label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <CheckCircle size={14} style={{ color:'#16a34a' }}/>
                      <span style={{ fontSize:12, color:'#475569' }}>Thank you for your feedback.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding:'10px 18px', borderTop:'1px solid #f1f5f9', display:'flex',
            alignItems:'center', gap:8, flexShrink:0, background:'#fafafa' }}>
            <input value={followUp} onChange={e=>setFollowUp(e.target.value)}
              placeholder="Ask a follow-up question…"
              style={{ flex:1, padding:'7px 12px', border:'1px solid #e2e8f0', borderRadius:7,
                fontSize:12, color:'#334155', background:'#fff', outline:'none' }}
              onFocus={e=>(e.target.style.borderColor='#0d9488')}
              onBlur={e=>(e.target.style.borderColor='#e2e8f0')}/>
            <button onClick={copyToNote} style={{
              display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:7,
              border:'1px solid #e2e8f0', background:'#fff', color:'#475569',
              fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
            }}>
              <Copy size={12}/>{copied?'Copied!':'Copy note'}
            </button>
            <button onClick={()=>navigate(`/patients/${pid}`)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:7,
              background:acked?'#059669':'#0d9488', color:'#fff', border:'none',
              fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'background 0.2s',
            }}>
              <ExternalLink size={12}/>Open record
            </button>
          </div>

          {/* Disclaimer */}
          <p style={{ textAlign:'center', fontSize:10, color:'#94a3b8',
            padding:'5px 20px 8px', margin:0, background:'#fafafa',
            borderTop:'1px solid #f1f5f9', flexShrink:0 }}>
            AI-generated decision support. Does not replace clinical judgment.
          </p>
        </motion.div>
      </div>
    </>
  );

  if (typeof document==='undefined') return null;
  return createPortal(<AnimatePresence>{modal}</AnimatePresence>, document.body);
}

/* ── Drug interactions tab ───────────────────────────────────────────────── */
function DrugInteractionsTab() {
  const { data:drugAll, isLoading } = useQuery({
    queryKey: ['drug-interactions-all'],
    queryFn: ()=>advancedMlAPI.getAllDrugInteractions?.().then(r=>r.data).catch(()=>({ patients:[] })),
    staleTime: 10*60*1000, retry:false,
  });
  const withInts = (drugAll?.patients||[]).filter(p=>p.interactions?.length>0);
  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'64px 0' }}>
      <Loader2 size={20} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
    </div>
  );
  if (!withInts.length) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'64px 24px', gap:10, textAlign:'center' }}>
      <CheckCircle size={32} style={{ color:'#0d9488', opacity:0.5 }}/>
      <p style={{ fontWeight:600, color:'#475569', margin:0 }}>No drug interactions detected</p>
      <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>All patient medication profiles are clear.</p>
    </div>
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {withInts.map(p=>(
        <div key={p.patient_id} style={{ borderRadius:12, border:'1px solid var(--card-border)',
          overflow:'hidden', background:'var(--card-bg)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
            borderBottom:'1px solid var(--card-border)', background:'var(--page-bg)' }}>
            <div style={{ width:28, height:28, borderRadius:7, flexShrink:0,
              background:'linear-gradient(135deg,#0d9488,#0891b2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:11, fontWeight:700 }}>
              {initials(p.patient_name||'')}
            </div>
            <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--text-800)', flex:1 }}>{p.patient_name}</p>
            {p.severe_count>0 && (
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                background:'#dc2626', color:'#fff' }}>
                {p.severe_count} severe
              </span>
            )}
          </div>
          <div>
            {p.interactions.slice(0,3).map((it,i)=>{
              const sev=['severe','SEVERE','major'].includes(it.severity);
              const { d1, d2 } = drugPair(it);
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                  borderBottom:i<Math.min(p.interactions.length,3)-1?'1px solid var(--card-border)':'none' }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, flexShrink:0,
                    background:sev?'#dc2626':'#f59e0b', color:'#fff' }}>
                    {it.severity?.toUpperCase()}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    {d1&&d2
                      ? <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:600, color:'var(--text-800)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d1} + {d2}</p>
                      : <p style={{ margin:0, fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Drug details pending</p>
                    }
                    {it.description && (
                      <p style={{ margin:0, fontSize:11, color:'var(--text-400)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── System overview tab ─────────────────────────────────────────────────── */
function SystemOverviewTab({ batchRisk, sysData, onScan, scanning }) {
  const models = Object.entries(batchRisk?.model_performance||{});
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ borderRadius:12, border:'1px solid var(--card-border)', overflow:'hidden', background:'var(--card-bg)' }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--card-border)', background:'var(--page-bg)' }}>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--text-700)' }}>AI System Status</p>
        </div>
        <div style={{ padding:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { label:'ML Models',       value:batchRisk?.ml_available!==false?'8 Active':'Offline', ok:batchRisk?.ml_available!==false },
            { label:'Last Scan',       value:batchRisk?.generated_at?new Date(batchRisk.generated_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'Never', ok:true },
            { label:'Patients Scanned',value:batchRisk?.total_patients??0, ok:true },
            { label:'Explainability',  value:'XGBoost SHAP', ok:true },
          ].map(s=>(
            <div key={s.label} style={{ borderRadius:8, border:'1px solid var(--card-border)', padding:10 }}>
              <p style={{ margin:'0 0 1px', fontSize:12, fontWeight:700, color:'var(--text-800)' }}>{s.value}</p>
              <p style={{ margin:'0 0 2px', fontSize:11, color:'var(--text-400)' }}>{s.label}</p>
              <span style={{ fontSize:10, fontWeight:700, color:s.ok?'#0d9488':'#dc2626' }}>
                {s.ok?'● Active':'● Offline'}
              </span>
            </div>
          ))}
        </div>
      </div>
      {models.length>0 && (
        <div style={{ borderRadius:12, border:'1px solid var(--card-border)', overflow:'hidden', background:'var(--card-bg)' }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--card-border)', background:'var(--page-bg)' }}>
            <p style={{ margin:0, fontSize:12, fontWeight:700, color:'var(--text-700)' }}>Model AUC Scores</p>
          </div>
          <div style={{ padding:14, display:'flex', flexDirection:'column', gap:8 }}>
            {models.map(([key,m])=>{
              const auc=m.auc_roc||m.auc||0;
              return (
                <div key={key} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <p style={{ margin:0, fontSize:12, color:'var(--text-700)', width:120, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {DOMAIN_LABELS[key]||key}
                  </p>
                  <div style={{ flex:1, height:5, borderRadius:99, background:'var(--page-bg)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${auc*100}%`, background:'#0d9488', borderRadius:99 }}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text-700)', width:40, textAlign:'right' }}>
                    {(auc*100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <button onClick={onScan} disabled={scanning} style={{
        width:'100%', padding:'10px 0', borderRadius:10, fontSize:13, fontWeight:700,
        color:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center',
        justifyContent:'center', gap:6, opacity:scanning?0.6:1,
        background:'linear-gradient(135deg,#0d9488,#0891b2)',
      }}>
        {scanning?<Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>:<Zap size={14}/>}
        {scanning?'Scanning all patients…':'Run Proactive AI Scan'}
      </button>
    </div>
  );
}

/* ── Purpose-built AI Risk Table ─────────────────────────────────────────── */
function RiskTable({ patients, deepDiveId, onSelect }) {
  if (!patients.length) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'64px 24px', gap:10, textAlign:'center' }}>
      <Brain size={36} style={{ color:'#0d9488', opacity:0.4 }}/>
      <p style={{ fontWeight:600, color:'var(--text-600)', margin:'0 0 4px' }}>No patients found</p>
      <p style={{ fontSize:12, color:'var(--text-400)', margin:0 }}>Try adjusting the risk filter or search term.</p>
    </div>
  );
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'2px solid var(--card-border)' }}>
            {['Patient','Risk Level','AI Score','Top Concern',''].map((h,i)=>(
              <th key={i} style={{
                padding:'9px 12px', textAlign:'left',
                fontSize:11, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
                color:'var(--text-400)', background:'var(--page-bg)', whiteSpace:'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patients.map((p,i)=>{
            const cfg  = riskCfg(p.risk_level);
            const pct  = Math.round((p.overall_risk||0)*100);
            const name = p.full_name||p.patient_name||'Unknown';
            const diag = p.primary_diagnosis||null;
            const concern = p.top_concern||(p.key_concerns?.[0])||diag||null;
            const isSelected = deepDiveId===p.id;
            const isCrit = ['critical','crisis'].includes((p.risk_level||'').toLowerCase());

            return (
              <tr key={p.id}
                onClick={()=>onSelect(p.id)}
                style={{
                  borderBottom:'1px solid var(--card-border)',
                  background: isSelected
                    ? 'color-mix(in srgb,#0d9488 7%,var(--card-bg))'
                    : i%2===0 ? 'var(--card-bg)' : 'var(--page-bg)',
                  cursor:'pointer', transition:'background 0.1s',
                  outline: isSelected?'2px solid #0d9488':'none',
                  outlineOffset:'-2px',
                }}
                onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background='color-mix(in srgb,#0d9488 4%,var(--card-bg))'; }}
                onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background=i%2===0?'var(--card-bg)':'var(--page-bg)'; }}
              >
                {/* Patient */}
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {isCrit && <span style={{ width:3, height:28, borderRadius:99, background:'#dc2626', flexShrink:0 }}/>}
                    <div style={{ width:32, height:32, borderRadius:8, flexShrink:0,
                      background:cfg.avatarBg, display:'flex', alignItems:'center',
                      justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>
                      {initials(name)}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ margin:'0 0 1px', fontWeight:600, fontSize:13, color:'var(--text-900)',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 }}>{name}</p>
                      {diag && (
                        <p style={{ margin:0, fontSize:11, color:'var(--text-400)',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:150 }}>{diag}</p>
                      )}
                    </div>
                  </div>
                </td>
                {/* Risk level */}
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99,
                    background:cfg.pill, color:cfg.text }}>
                    {cfg.label}
                  </span>
                </td>
                {/* AI Score */}
                <td style={{ padding:'10px 12px' }}>
                  <ScoreBar pct={pct} color={cfg.color}/>
                </td>
                {/* Top Concern */}
                <td style={{ padding:'10px 12px', maxWidth:200 }}>
                  <p style={{ margin:0, fontSize:12, color:'var(--text-700)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                    title={concern||''}>
                    {concern || <span style={{ color:'var(--text-300)', fontStyle:'italic' }}>None flagged</span>}
                  </p>
                </td>
                {/* View button */}
                <td style={{ padding:'10px 12px' }}>
                  <button onClick={e=>{ e.stopPropagation(); onSelect(p.id); }}
                    style={{
                      display:'inline-flex', alignItems:'center', gap:4,
                      padding:'5px 12px', borderRadius:7, fontSize:12, fontWeight:600,
                      background:isSelected?'#0d9488':'var(--page-bg)',
                      color:isSelected?'#fff':'var(--text-600)',
                      border:`1px solid ${isSelected?'#0d9488':'var(--card-border)'}`,
                      cursor:'pointer', transition:'all 0.15s',
                    }}>
                    <ChevronRight size={11} style={{ transform:isSelected?'rotate(90deg)':'none', transition:'transform 0.15s' }}/>
                    {isSelected?'Viewing':'View'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AIInsights() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const [activeTab,  setActiveTab]  = useState('risk');
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deepDiveId, setDeepDiveId] = useState(null);

  const { data:sysData,  isLoading:sysLoad,  refetch:refetchSys } = useQuery({
    queryKey: ['ai-insights-sys'],
    queryFn: ()=>aiAPI.getSystemOverview().then(r=>r.data),
    staleTime: 5*60*1000, retry:false,
  });
  const { data:batchRisk, isLoading:batchLoad } = useQuery({
    queryKey: ['batch-risk'],
    queryFn: ()=>mlAPI.getAllPatientsRisk().then(r=>r.data),
    staleTime: 5*60*1000, retry:false,
  });
  const { data:patientsBase } = useQuery({
    queryKey: ['patients-ai'],
    queryFn: ()=>patientsAPI.getAll().then(r=>Array.isArray(r.data)?r.data:r.data?.patients||[]),
    staleTime: 5*60*1000, retry:false,
  });
  const scanMutation = useMutation({
    mutationFn: ()=>mlAPI.triggerProactiveScan(),
    onSuccess: ()=>{ queryClient.invalidateQueries(['batch-risk']); toast.success('AI scan complete'); },
    onError: ()=>toast.error('Scan failed'),
  });

  const allPatients = useMemo(()=>{
    const riskMap={};
    (batchRisk?.patients||[]).forEach(p=>{ const pid=p.id||p.patient_id; if(pid) riskMap[pid]=p; });
    (sysData?.high_risk_patients||[]).forEach(p=>{ const pid=p.id||p.patient_id; if(pid&&!riskMap[pid]) riskMap[pid]=p; });
    const base=Array.isArray(patientsBase)?patientsBase:[];
    const merged={};
    base.forEach(p=>{
      const pid=p.id; if(!pid) return;
      const risk=riskMap[pid]||{};
      merged[pid]={
        ...p,
        risk_level:   risk.risk_level||risk.overall_level||p.risk_level||'unknown',
        overall_risk: risk.overall_risk??risk.risk_score??p.risk_score??0,
        top_concern:  risk.top_concern||p.top_concern||null,
        key_concerns: risk.key_concerns||[],
        tasks:        risk.tasks||null,
      };
    });
    Object.values(riskMap).forEach(p=>{
      const pid=p.id||p.patient_id;
      if(!pid||merged[pid]) return;
      merged[pid]={ ...p, id:pid, full_name:p.full_name||p.patient_name||'Unknown',
        risk_level:p.risk_level||p.overall_level||'unknown',
        overall_risk:p.overall_risk??p.risk_score??0 };
    });
    return Object.values(merged).sort((a,b)=>(b.overall_risk||0)-(a.overall_risk||0));
  }, [patientsBase, batchRisk, sysData]);

  const visiblePatients = useMemo(()=>{
    let base=allPatients;
    if (filterRisk!=='all') {
      base=base.filter(p=>{
        const l=(p.risk_level||'').toLowerCase();
        if (filterRisk==='critical') return l==='critical'||l==='crisis';
        if (filterRisk==='high')     return l==='high';
        if (filterRisk==='moderate') return l==='moderate'||l==='medium';
        if (filterRisk==='stable')   return l==='low'||l==='stable'||l==='normal';
        return true;
      });
    }
    if (searchTerm) {
      const q=searchTerm.toLowerCase();
      base=base.filter(p=>
        p.full_name?.toLowerCase().includes(q)||
        p.patient_code?.toLowerCase().includes(q)||
        p.primary_diagnosis?.toLowerCase().includes(q)||
        p.top_concern?.toLowerCase().includes(q)
      );
    }
    return base;
  }, [allPatients, filterRisk, searchTerm]);

  const kpi = useMemo(()=>({
    total:    allPatients.length,
    critical: allPatients.filter(p=>['critical','crisis'].includes((p.risk_level||'').toLowerCase())).length,
    high:     allPatients.filter(p=>(p.risk_level||'').toLowerCase()==='high').length,
    stable:   allPatients.filter(p=>['low','stable','normal'].includes((p.risk_level||'').toLowerCase())).length,
  }), [allPatients]);

  const deepDivePatient = useMemo(()=>
    deepDiveId ? (visiblePatients.find(p=>p.id===deepDiveId)||allPatients.find(p=>p.id===deepDiveId)||null) : null
  , [deepDiveId, visiblePatients, allPatients]);

  const isLoading = sysLoad && batchLoad && !patientsBase?.length;

  return (
    <div style={{ minHeight:'100vh', paddingBottom:32, background:'var(--page-bg)' }}>

      <PageHeader
        image="/resources/headers/header-ai-insights.jpg"
        title="AI Clinical Intelligence"
        subtitle="Real-time risk stratification across all patients"
        icon={Brain}
        stats={[
          { label:'Patients',  value:kpi.total,    color:'#2dd4bf', onClick:()=>setFilterRisk('all') },
          { label:'Critical',  value:kpi.critical, color:'#f87171', pulse:kpi.critical>0, onClick:()=>setFilterRisk('critical') },
          { label:'High Risk', value:kpi.high,     color:'#fbbf24', onClick:()=>setFilterRisk('high') },
          { label:'Stable',    value:kpi.stable,   color:'#4ade80', onClick:()=>setFilterRisk('stable') },
        ]}
      >
        {activeTab==='risk' && (
          <>
            <div style={{ position:'relative', flex:1, minWidth:160, maxWidth:280 }}>
              <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-400)', pointerEvents:'none' }}/>
              <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                placeholder="Search patients…"
                style={{ width:'100%', height:34, paddingLeft:32, paddingRight:12, fontSize:12, borderRadius:20,
                  border:'1px solid var(--card-border)', background:'var(--page-bg)', color:'var(--text-800)',
                  outline:'none', boxSizing:'border-box' }}
                onFocus={e=>(e.target.style.borderColor='var(--c-teal)')}
                onBlur={e=>(e.target.style.borderColor='var(--card-border)')}/>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {[
                {v:'all',      l:'All',      c:'#334155'},
                {v:'critical', l:'Critical', c:'#dc2626'},
                {v:'high',     l:'High',     c:'#ea580c'},
                {v:'moderate', l:'Moderate', c:'#d97706'},
                {v:'stable',   l:'Stable',   c:'#0d9488'},
              ].map(({v,l,c})=>{
                const active=filterRisk===v;
                return (
                  <button key={v} onClick={()=>setFilterRisk(v)} style={{
                    padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600,
                    cursor:'pointer', transition:'all 0.15s',
                    border:active?`1.5px solid ${c}`:'1px solid var(--card-border)',
                    background:active?`${c}12`:'var(--card-bg)',
                    color:active?c:'var(--text-500)',
                  }}>{l}</button>
                );
              })}
            </div>
          </>
        )}
        <div style={{ display:'flex', gap:6, marginLeft:'auto', flexShrink:0 }}>
          <button onClick={()=>{ refetchSys(); queryClient.invalidateQueries(['batch-risk']); toast.success('Refreshed'); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              fontSize:11, fontWeight:600, border:'1px solid var(--card-border)', background:'var(--card-bg)',
              color:'var(--text-600)', cursor:'pointer' }}>
            <RefreshCw size={12}/> Refresh
          </button>
          <button onClick={()=>scanMutation.mutate()} disabled={scanMutation.isPending}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20,
              fontSize:11, fontWeight:700, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#0d9488,#0891b2)', color:'#fff',
              opacity:scanMutation.isPending?0.6:1 }}>
            {scanMutation.isPending?<Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/>:<Zap size={11}/>}
            {scanMutation.isPending?'Scanning…':'Run AI Scan'}
          </button>
        </div>
      </PageHeader>

      <div style={{ maxWidth:1300, margin:'16px auto 0', padding:'0 20px 40px' }}>
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, overflow:'hidden' }}>

          {/* Tab bar */}
          <div style={{ borderBottom:'1px solid var(--card-border)', padding:'0 20px' }}>
            <div style={{ display:'flex', gap:2, padding:'10px 0', overflowX:'auto', scrollbarWidth:'none' }}>
              {[
                { id:'risk',   label:'Risk Stratification', Icon:Brain     },
                { id:'drugs',  label:'Drug Interactions',   Icon:Pill      },
                { id:'system', label:'System Overview',     Icon:BarChart2 },
              ].map(({ id, label, Icon:Ico })=>{
                const active=activeTab===id;
                return (
                  <button key={id} onClick={()=>{ setActiveTab(id); if(id!=='risk') setDeepDiveId(null); }}
                    style={{
                      display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                      fontSize:12, fontWeight:active?700:500,
                      color:active?'#fff':'var(--text-500)',
                      background:active?'linear-gradient(135deg,#0d9488,#0891b2)':'transparent',
                      border:'none', borderRadius:8, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                    }}
                    onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background='var(--page-bg)'; e.currentTarget.style.color='var(--text-700)'; }}}
                    onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-500)'; }}}
                  >
                    <Ico size={12} style={{ opacity:active?1:0.7 }}/>{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding:20 }}>
            {activeTab==='risk' && (
              isLoading ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  padding:'64px 0', gap:10 }}>
                  <Loader2 size={28} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
                  <p style={{ fontSize:13, color:'var(--text-500)', margin:0 }}>Loading patients…</p>
                </div>
              ) : (
                <>
                  {batchRisk?.ml_available===false && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 12px',
                      borderRadius:8, background:'#fffbeb', border:'1px solid #fde68a' }}>
                      <AlertTriangle size={13} style={{ color:'#d97706', flexShrink:0 }}/>
                      <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#92400e' }}>
                        ML models offline — showing base patient data
                      </p>
                    </div>
                  )}
                  <RiskTable
                    patients={visiblePatients}
                    deepDiveId={deepDiveId}
                    onSelect={id=>setDeepDiveId(prev=>prev===id?null:id)}
                  />
                </>
              )
            )}
            {activeTab==='drugs'  && <DrugInteractionsTab/>}
            {activeTab==='system' && (
              <SystemOverviewTab
                batchRisk={batchRisk} sysData={sysData}
                onScan={()=>scanMutation.mutate()} scanning={scanMutation.isPending}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail overlay — portal, opens on row click */}
      <AnimatePresence>
        {deepDivePatient && (
          <DetailOverlay
            patient={deepDivePatient}
            onClose={()=>setDeepDiveId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
