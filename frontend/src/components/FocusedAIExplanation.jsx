/**
 * FocusedAIExplanation
 * ====================
 * Matches the clinical reference design:
 * White card · CRITICAL badge · title · info row · summary · confidence ·
 * why it matters · review tags · numbered actions · feedback row ·
 * follow-up input · Copy/Acknowledge footer
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, Activity, Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api/client';

/* ── helpers ─────────────────────────────────────────────── */
function fmtValue(v) {
  if (v == null) return null;
  if (typeof v === 'object' && v.systolic) return `${v.systolic}/${v.diastolic} mmHg`;
  if (typeof v === 'object') {
    const fields = [
      ['heart_rate', 'HR', ' bpm'],
      ['oxygen_saturation', 'SpO₂', '%'],
      ['temperature', 'Temp', '°C'],
      ['blood_pressure_sys', 'BP sys', ' mmHg'],
      ['pain_level', 'Pain', '/10'],
    ];
    const parts = fields.filter(([k]) => v[k] != null)
      .map(([k, label, unit]) => `${label}: ${Number(v[k]).toFixed(1)}${unit}`);
    return parts.length ? parts.join(' · ') : null;
  }
  return String(v);
}

function riskCfg(level) {
  if (level === 'critical') return { label: 'CRITICAL', color: '#dc2626', bg: '#fef2f2' };
  if (level === 'warning')  return { label: 'WARNING',  color: '#d97706', bg: '#fffbeb' };
  return                           { label: 'NORMAL',   color: '#16a34a', bg: '#f0fdf4' };
}

/* ── Main ─────────────────────────────────────────────────── */
export default function FocusedAIExplanation({ data, onClose }) {
  const [feedback,   setFeedback]   = useState(null);      // 'helpful' | 'partial' | 'not_helpful'
  const [note,       setNote]       = useState('');
  const [followUp,   setFollowUp]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [acked,      setAcked]      = useState(false);
  const [view,       setView]       = useState('focused'); // 'focused' | 'comprehensive'

  const rc = riskCfg(data?.risk_level);

  const findingLabel = (() => {
    const raw =
      data?.vital_type ||
      data?.symptom_type ||
      data?.medication_name ||
      data?.focus_type ||
      'finding';
    return raw.replace(/_/g, ' ');
  })();

  const titleLabel = (() => {
    if (data?.drug1 && data?.drug2) return `${data.drug1} + ${data.drug2}`;
    if (data?.vital_type) return data.vital_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) + ' Reading';
    if (data?.symptom_type) return data.symptom_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) + ' Assessment';
    if (data?.medication_name) return data.medication_name;
    return data?.patient_name ? `${data.patient_name} — ${findingLabel}` : 'Clinical Finding';
  })();

  const currentValue = fmtValue(
    data?.current_value ?? data?.current_severity ??
    data?.triggered_value ?? data?.total_score
  );

  const reviewTags = data?.review_factors ||
    (data?.relevant_factors?.map(f => f.feature_name?.replace(/_/g,' ')) || []).slice(0, 6);

  const copyToNote = () => {
    const text = `Clinical AI Explanation\n${titleLabel}\n\nSummary: ${data?.explanation}\n\nRecommendations:\n${(data?.recommendations||[]).map((r,i)=>`${i+1}. ${r}`).join('\n')}`;
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitFeedback = async () => {
    if (!feedback) return;
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/comprehensive-ai/focused-explanation-feedback`, {
        patient_id:        data?.patient_id,
        focus_type:        data?.focus_type,
        focus_identifier:  data?.vital_type || data?.symptom_type || data?.medication_name || 'unknown',
        focus_value:       currentValue,
        feedback_type:     feedback,
        feedback_note:     note,
        risk_level_shown:  data?.risk_level,
        explanation_shown: data?.explanation,
      });
      setSubmitted(true);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const modal = (
    <>
      {/* Backdrop */}
      <motion.div key="fae-bg"
        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        onClick={onClose}
        style={{position:'fixed',inset:0,zIndex:9500,background:'rgba(0,0,0,0.45)'}} />

      {/* Card */}
      <div style={{position:'fixed',inset:0,zIndex:9501,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',pointerEvents:'none'}}>
        <motion.div key="fae-card"
          initial={{opacity:0,y:16,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:0.97}}
          transition={{type:'spring',damping:30,stiffness:360}}
          onClick={e=>e.stopPropagation()}
          style={{
            pointerEvents:'all',
            background:'#ffffff',
            borderRadius:12,
            width:'100%', maxWidth:560,
            maxHeight:'90vh',
            display:'flex', flexDirection:'column',
            boxShadow:'0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
            fontFamily:"'Inter','system-ui',sans-serif",
            overflow:'hidden',
          }}>

          {/* ── Header ── */}
          <div style={{padding:'16px 20px 12px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexShrink:0}}>
            <div>
              <p style={{fontSize:15,fontWeight:700,color:'#0f172a',margin:'0 0 2px'}}>Clinical AI explanation</p>
              <p style={{fontSize:12,color:'#64748b',margin:0}}>Context-aware analysis of this finding</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {/* Focused / Comprehensive toggle */}
              <div style={{display:'flex',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
                {['focused','comprehensive'].map(v=>(
                  <button key={v} onClick={()=>setView(v)}
                    style={{
                      padding:'5px 12px',fontSize:12,fontWeight:600,border:'none',cursor:'pointer',
                      background:view===v?'#0d9488':'transparent',
                      color:view===v?'#fff':'#64748b',
                      transition:'all 0.15s',
                    }}>
                    {v.charAt(0).toUpperCase()+v.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={onClose}
                style={{width:28,height:28,borderRadius:'50%',background:'#f1f5f9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b'}}>
                <X size={14} strokeWidth={2.5}/>
              </button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:14}}>

            {/* Risk badge + title */}
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 8px',borderRadius:4,background:rc.bg,marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:800,color:rc.color,letterSpacing:'0.05em'}}>{rc.label}</span>
                {data?.interaction_type && (
                  <span style={{fontSize:11,color:'#475569'}}>{data.interaction_type.replace(/_/g,' ')}</span>
                )}
                {data?.risk_level === 'critical' && !data?.interaction_type && (
                  <span style={{fontSize:11,color:'#475569'}}>Requires immediate attention</span>
                )}
              </div>
              <h2 style={{fontSize:18,fontWeight:700,color:'#0f172a',margin:0,lineHeight:1.3}}>{titleLabel}</h2>
            </div>

            {/* Info row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:1,borderTop:'1px solid #f1f5f9',borderBottom:'1px solid #f1f5f9',padding:'10px 0'}}>
              {[
                {label:'PATIENT', value:data?.patient_name||'—'},
                {label:'FINDING', value:findingLabel.replace(/\b\w/g,c=>c.toUpperCase())},
                currentValue ? {label:'VALUE', value:currentValue} : null,
                {label:'RISK', value:rc.label, color:rc.color},
              ].filter(Boolean).map(item=>(
                <div key={item.label} style={{padding:'0 12px'}}>
                  <p style={{fontSize:10,fontWeight:600,color:'#94a3b8',margin:'0 0 2px',letterSpacing:'0.06em'}}>{item.label}</p>
                  <p style={{fontSize:13,fontWeight:600,color:item.color||'#0f172a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.08em',margin:'0 0 6px'}}>SUMMARY</p>
              <p style={{fontSize:13,color:'#334155',lineHeight:1.7,margin:'0 0 10px'}}>{data?.explanation||'No explanation available.'}</p>
              {data?.confidence && (
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,color:'#64748b'}}>AI confidence</span>
                  <div style={{flex:1,maxWidth:120,height:5,background:'#e2e8f0',borderRadius:99,overflow:'hidden'}}>
                    <motion.div initial={{width:0}} animate={{width:`${Math.round(data.confidence*100)}%`}} transition={{duration:0.8,ease:'easeOut'}}
                      style={{height:'100%',background:'#0d9488',borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{Math.round(data.confidence*100)}%</span>
                </div>
              )}
            </div>

            {/* Contributing factors / Why it matters */}
            {view === 'focused' ? (
              /* Focused: just the explanation + confidence */
              <div>
                <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.08em',margin:'0 0 6px'}}>WHY IT MATTERS</p>
                <p style={{fontSize:13,color:'#334155',lineHeight:1.65,margin:0}}>
                  {data?.explanation
                    ? data.explanation.split('.').slice(0,2).join('.')+('.')
                    : 'No explanation available.'}
                </p>
              </div>
            ) : (
              /* Comprehensive: full explanation */
              <div>
                <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.08em',margin:'0 0 6px'}}>FULL ANALYSIS</p>
                <p style={{fontSize:13,color:'#334155',lineHeight:1.7,margin:0}}>{data?.explanation||'No explanation available.'}</p>
              </div>
            )}

            {/* Review tags */}
            {reviewTags?.length > 0 && (
              <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6}}>
                <span style={{fontSize:12,color:'#64748b'}}>Review:</span>
                {reviewTags.map((t,i)=>(
                  <span key={i} style={{fontSize:11,padding:'3px 10px',borderRadius:4,background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0'}}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Comprehensive-only: SHAP contributing factors */}
            {view === 'comprehensive' && data?.relevant_factors?.length > 0 && (
              <div>
                <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.08em',margin:'0 0 10px'}}>CONTRIBUTING FACTORS</p>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {data.relevant_factors.map((f,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:11,color:'#94a3b8',width:16,flexShrink:0,fontWeight:700}}>#{i+1}</span>
                      <span style={{fontSize:12,color:'#334155',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.feature_name?.replace(/_/g,' ')||'—'}</span>
                      <div style={{width:100,height:5,background:'#e2e8f0',borderRadius:99,flexShrink:0,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.min(Math.round((f.importance||0.5)*100),100)}%`,background:f.impact==='increases_risk'?'#ef4444':'#10b981',borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:f.impact==='increases_risk'?'#ef4444':'#10b981',width:56,textAlign:'right',flexShrink:0}}>{f.display_value||'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehensive-only: trend + history detail */}
            {view === 'comprehensive' && (data?.trend || data?.history_count != null) && (
              <div style={{padding:'10px 14px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.08em',margin:'0 0 6px'}}>TREND ANALYSIS</p>
                <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                  {data.trend && (
                    <div>
                      <p style={{fontSize:11,color:'#94a3b8',margin:'0 0 2px'}}>Direction</p>
                      <p style={{fontSize:13,fontWeight:700,color:['worsening','increasing'].includes(data.trend)?'#dc2626':['improving','decreasing'].includes(data.trend)?'#16a34a':'#475569',margin:0,textTransform:'capitalize'}}>{data.trend}</p>
                    </div>
                  )}
                  {data.history_count != null && (
                    <div>
                      <p style={{fontSize:11,color:'#94a3b8',margin:'0 0 2px'}}>Based on</p>
                      <p style={{fontSize:13,fontWeight:700,color:'#334155',margin:0}}>{data.history_count} readings</p>
                    </div>
                  )}
                  {data.baseline_value && (
                    <div>
                      <p style={{fontSize:11,color:'#94a3b8',margin:'0 0 2px'}}>Baseline</p>
                      <p style={{fontSize:13,fontWeight:700,color:'#334155',margin:0}}>{typeof data.baseline_value === 'object' ? JSON.stringify(data.baseline_value) : data.baseline_value}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommended actions */}
            {data?.recommendations?.length > 0 && (
              <div>
                <p style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.08em',margin:'0 0 10px'}}>RECOMMENDED ACTIONS</p>
                <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  {data.recommendations.map((r,i)=>{
                    const urgent = r.toLowerCase().includes('urgent')||r.toLowerCase().includes('immediate')||r.toLowerCase().includes('critical');
                    return (
                      <div key={i} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'8px 0',borderBottom:i<data.recommendations.length-1?'1px solid #f8fafc':'none'}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#94a3b8',flexShrink:0,minWidth:16,marginTop:1}}>{i+1}</span>
                        <p style={{fontSize:13,color:'#1e293b',margin:0,lineHeight:1.55,flex:1,fontWeight:urgent?700:400}}>{r}</p>
                        {urgent && <span style={{fontSize:11,fontWeight:700,color:'#dc2626',flexShrink:0,marginTop:2}}>URGENT</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Was this helpful */}
            <div style={{paddingTop:8,borderTop:'1px solid #f1f5f9'}}>
              {!submitted ? (
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  <span style={{fontSize:12,color:'#64748b'}}>Was this helpful?</span>
                  {[
                    {type:'helpful',    label:'Helpful',     Icon:ThumbsUp},
                    {type:'partial',    label:'Partial',     Icon:Activity},
                    {type:'not_helpful',label:'Not helpful', Icon:ThumbsDown},
                  ].map(({type,label,Icon})=>(
                    <button key={type} onClick={()=>{setFeedback(type);submitFeedback();}}
                      style={{
                        display:'flex',alignItems:'center',gap:5,
                        padding:'5px 12px',borderRadius:6,border:'1px solid #e2e8f0',
                        background:feedback===type?'#f0fdf4':'transparent',
                        color:feedback===type?'#16a34a':'#475569',
                        fontSize:12,fontWeight:500,cursor:'pointer',transition:'all 0.12s',
                      }}>
                      <Icon size={13}/>{label}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <CheckCircle size={14} style={{color:'#16a34a'}}/>
                  <span style={{fontSize:12,color:'#475569'}}>Thank you for your feedback.</span>
                </div>
              )}
            </div>

          </div>

          {/* ── Footer ── */}
          <div style={{padding:'12px 20px',borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:8,flexShrink:0,background:'#fafafa'}}>
            <input value={followUp} onChange={e=>setFollowUp(e.target.value)}
              placeholder="Ask a follow-up…"
              style={{flex:1,padding:'7px 12px',border:'1px solid #e2e8f0',borderRadius:6,fontSize:12,color:'#334155',background:'#fff',outline:'none'}}
              onFocus={e=>e.target.style.borderColor='#0d9488'}
              onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            <button onClick={copyToNote}
              style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#475569',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
              <Copy size={12}/> {copied ? 'Copied!' : 'Copy to note'}
            </button>
            <button onClick={()=>{setAcked(true);setTimeout(onClose,600);}}
              style={{padding:'7px 16px',borderRadius:6,background:acked?'#059669':'#0d9488',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:700,whiteSpace:'nowrap',transition:'background 0.2s'}}>
              {acked ? 'Acknowledged ✓' : 'Acknowledge'}
            </button>
          </div>

          {/* Disclaimer */}
          <p style={{textAlign:'center',fontSize:10,color:'#94a3b8',padding:'6px 20px 10px',margin:0,background:'#fafafa',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
            AI-generated decision support. It does not replace clinical judgment.
          </p>

        </motion.div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(<AnimatePresence>{modal}</AnimatePresence>, document.body);
}
