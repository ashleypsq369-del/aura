/**
 * MLRiskSummaryCard — compact single-row card with gauge + domain chips
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ChevronRight, Loader2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { mlAPI } from '../api/client';

const RISK = {
  critical: { label:'Critical',  stroke:'#dc2626', text:'#dc2626', badge:'#dc2626' },
  high:     { label:'High Risk', stroke:'#ea580c', text:'#ea580c', badge:'#ea580c' },
  moderate: { label:'Moderate',  stroke:'#d97706', text:'#d97706', badge:'#d97706' },
  low:      { label:'Stable',    stroke:'#0d9488', text:'#0d9488', badge:'#0d9488' },
  normal:   { label:'Normal',    stroke:'#0d9488', text:'#0d9488', badge:'#0d9488' },
  unknown:  { label:'No data',   stroke:'#94a3b8', text:'#94a3b8', badge:'#94a3b8' },
};
const cfg = l => RISK[(l||'').toLowerCase()] || RISK.unknown;

const domainCol = p => p>70?'#dc2626':p>40?'#ea580c':p>15?'#d97706':'#0d9488';

const DOMAIN_LABELS = {
  vital_risk:'Vital Signs', symptom_burden:'Symptoms',
  functional_decline:'Function', cognitive_impairment:'Cognition',
  mental_health_risk:'Mental Health', medication_risk:'Medication',
  caregiver_burden:'Caregiver', admission_risk:'Admission Risk',
};

/* SVG arc gauge — size 64, thickness 5 */
function Arc({ pct, stroke, size=64, t=5 }) {
  const r = (size-t)/2, c = 2*Math.PI*r;
  const arc = c*0.75, fill = arc*(pct/100), off = c*0.25/2;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(135deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--card-border)" strokeWidth={t}
        strokeDasharray={`${arc} ${c}`} strokeDashoffset={-off} strokeLinecap="round"/>
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={stroke} strokeWidth={t}
        strokeDasharray={`${arc} ${c}`} strokeDashoffset={-off} strokeLinecap="round"
        initial={{ strokeDasharray:`0 ${c}` }}
        animate={{ strokeDasharray:`${fill} ${c-fill}` }}
        transition={{ duration:0.7, ease:'easeOut' }}
        style={{ filter:`drop-shadow(0 0 3px ${stroke}60)` }}/>
    </svg>
  );
}

export default function MLRiskSummaryCard({ patientId }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['ml-risk', patientId],
    queryFn: () => mlAPI.getPatientRisk(patientId).then(r => r.data),
    enabled: !!patientId, staleTime: 5*60*1000, retry:1,
  });

  const level   = data?.overall_level || 'unknown';
  const c       = cfg(level);
  const pct     = Math.round((data?.overall_risk ?? 0) * 100);
  const concern = data?.key_concerns?.[0];

  const domains = Object.entries(data?.tasks || {})
    .map(([k,t]) => ({ key:k, pct:Math.round((t.probability||0)*100) }))
    .filter(d => d.pct > 5)
    .sort((a,b) => b.pct-a.pct)
    .slice(0,6);

  if (isLoading) return (
    <div style={{ padding:'10px 14px', borderRadius:12, border:'1px solid var(--card-border)',
      background:'var(--card-bg)', display:'flex', alignItems:'center', gap:10 }}>
      <Loader2 size={14} style={{ color:'#0d9488', animation:'spin 1s linear infinite' }}/>
      <p style={{ margin:0, fontSize:12, color:'var(--text-500)' }}>Calculating risk score…</p>
    </div>
  );

  return (
    <motion.button
      whileHover={{ y:-1 }} whileTap={{ scale:0.99 }}
      onClick={() => navigate(`/patients/${patientId}/ml-risk`)}
      style={{
        width:'100%', textAlign:'left', display:'block', padding:0,
        borderRadius:12, border:'1px solid var(--card-border)',
        borderLeft:`3px solid ${c.stroke}`, background:'var(--card-bg)',
        cursor:'pointer', outline:'none', fontFamily:'inherit', overflow:'hidden',
        boxShadow:'0 1px 3px rgba(0,0,0,0.05)', transition:'box-shadow 0.15s',
      }}
    >
      {/* ── Single header row ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px' }}>

        {/* Gauge */}
        <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
          <Arc pct={pct} stroke={c.stroke}/>
          <div style={{ position:'absolute', inset:0, display:'flex',
            flexDirection:'column', alignItems:'center', justifyContent:'center',
            pointerEvents:'none' }}>
            <span style={{ fontSize:14, fontWeight:900, color:c.text, lineHeight:1 }}>{pct}%</span>
            <span style={{ fontSize:8, fontWeight:700, color:'var(--text-400)',
              letterSpacing:'0.05em', textTransform:'uppercase' }}>risk</span>
          </div>
        </div>

        {/* Title block */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text-900)' }}>Clinical Risk Score</span>
            <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:99,
              background:c.badge, color:'#fff', textTransform:'uppercase', letterSpacing:'0.04em' }}>
              {c.label}
            </span>
          </div>
          <p style={{ margin:'0 0 4px', fontSize:10, color:'var(--text-400)' }}>Powered by Aura AI</p>

          {/* Concern inline */}
          {concern && (
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <AlertTriangle size={10} style={{ color:'#d97706', flexShrink:0 }}/>
              <p style={{ margin:0, fontSize:11, color:'var(--text-600)', fontWeight:500,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {concern}
              </p>
            </div>
          )}
        </div>

        <ChevronRight size={13} style={{ color:'var(--text-300)', flexShrink:0 }}/>
      </div>

      {/* ── Domain chips — inline wrap, compact ── */}
      {domains.length > 0 && (
        <div style={{ padding:'0 12px 10px', display:'flex', flexWrap:'wrap', gap:5 }}>
          {domains.map(d => {
            const col = domainCol(d.pct);
            return (
              <div key={d.key} style={{
                display:'inline-flex', alignItems:'center', gap:5,
                padding:'3px 8px 3px 4px', borderRadius:99,
                border:`1px solid ${col}30`, background:`${col}0d`,
              }}>
                {/* tiny arc */}
                <div style={{ position:'relative', width:22, height:22, flexShrink:0 }}>
                  <Arc pct={d.pct} stroke={col} size={22} t={2.5}/>
                  <div style={{ position:'absolute', inset:0, display:'flex',
                    alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                    <span style={{ fontSize:6, fontWeight:800, color:col }}/>
                  </div>
                </div>
                <span style={{ fontSize:10, color:'var(--text-600)', whiteSpace:'nowrap' }}>
                  {DOMAIN_LABELS[d.key]||d.key}
                </span>
                <span style={{ fontSize:10, fontWeight:800, color:col }}>{d.pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && data && domains.length === 0 && (
        <div style={{ padding:'0 12px 10px', display:'flex', alignItems:'center', gap:5 }}>
          <CheckCircle size={11} style={{ color:'#0d9488' }}/>
          <span style={{ fontSize:11, color:'#0d9488', fontWeight:500 }}>No elevated risk domains</span>
        </div>
      )}
    </motion.button>
  );
}
