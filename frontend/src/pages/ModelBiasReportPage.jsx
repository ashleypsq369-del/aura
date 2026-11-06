/**
 * ModelBiasReportPage - AI fairness & demographic bias analysis
 * Route: /admin/model-bias-report
 *
 * Built with: AdminPageShell + DataTable (TanStack) + StatusDot
 * Layout: category pivot → expandable group table → accordion detail
 * Reference: Arize AI / Fiddler fairness dashboard + Linear data table
 */
import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  BarChart3, AlertTriangle, CheckCircle, TrendingUp,
  RefreshCw, Brain, ChevronDown, Shield,
  Eye, SlidersHorizontal, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { ethicsAPI } from '../api/client';
import AdminPageShell from '../components/admin/AdminPageShell';
import DataTable from '../components/admin/DataTable';
import StatusDot from '../components/admin/StatusDot';

const col = createColumnHelper();

/* ─── Config ──────────────────────────────────────────────────────── */
const CATS = {
  age:       { label: 'Age group', color: '#3b82f6' },
  gender:    { label: 'Gender',    color: '#8b5cf6' },
  region:    { label: 'Region',    color: '#0d9488' },
  diagnosis: { label: 'Diagnosis', color: '#e11d48' },
};

/* ─── Inline disparity bar ─────────────────────────────────────────── */
function DisparityBar({ value, threshold }) {
  const pct   = Math.min(Math.abs(value) * 100, 50);
  const side  = value >= 0 ? 'left' : 'right';
  const color = Math.abs(value) > threshold ? '#ef4444' : Math.abs(value) > threshold / 2 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: 'var(--text-400)', opacity: 0.3 }} />
        <div className="absolute inset-y-0 rounded-full"
          style={{ width: `${pct}%`, [side === 'left' ? 'left' : 'right']: '50%', background: color }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
        {value >= 0 ? '+' : ''}{(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

/* ─── Expanded group sub-row ───────────────────────────────────────── */
function GroupSubRow({ row, threshold, overall }) {
  const data = row.original.data;
  const disp = data.disparity_from_mean ?? 0;
  const isHigh = Math.abs(disp) > threshold;

  return (
    <div className="px-5 pb-4 pt-2 ml-8 space-y-3 border-l-2"
      style={{ borderColor: isHigh ? '#ef4444' : Math.abs(disp) > threshold / 2 ? '#f59e0b' : '#10b981' }}>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Avg risk score', value: (data.mean_risk_score || 0).toFixed(3) },
          { label: 'Std deviation',  value: (data.std_risk_score  || 0).toFixed(3) },
          { label: 'Sample size',    value: data.count, warn: data.count < 20       },
        ].map(({ label, value, warn }) => (
          <div key={label} className="rounded-xl p-3"
            style={{ background: 'var(--page-bg)', border: '1px solid var(--card-border)' }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-400)' }}>{label}</p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-800)' }}>{value}</p>
            {warn && <p className="text-[10px] mt-1 font-medium" style={{ color: '#d97706' }}>Small sample</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-600)' }}>
        {disp > 0
          ? <ArrowUp   size={12} style={{ color: '#ef4444' }} />
          : <ArrowDown size={12} style={{ color: '#10b981' }} />}
        <span>
          Risk is <span className="font-semibold" style={{ color: disp > 0 ? '#ef4444' : '#10b981' }}>
            {Math.abs(disp * 100).toFixed(1)}% {disp > 0 ? 'above' : 'below'}
          </span> population mean of <span className="font-semibold" style={{ color: 'var(--text-800)' }}>
            {((overall.mean_risk_score || 0) * 100).toFixed(1)}%
          </span>
        </span>
      </div>

      {isHigh && (
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={13} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs leading-relaxed" style={{ color: '#991b1b' }}>
            <strong>Action required.</strong>{' '}
            {(Math.abs(disp) * 100).toFixed(1)}% deviation from population mean.{' '}
            {data.count < 30 ? 'Small sample - collect more data before acting.' : 'Investigate with clinical experts and document findings.'}
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════════════ */
export default function ModelBiasReportPage() {
  const [tab,       setTab]       = useState('fairness');
  const [cat,       setCat]       = useState('age');
  const [threshold, setThreshold] = useState(0.15);

  const { data: biasData, isLoading, refetch } = useQuery({
    queryKey: ['model-bias-report'],
    queryFn:  () => ethicsAPI.getBiasReport().then(r => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: overrideStats } = useQuery({
    queryKey: ['override-stats'],
    queryFn:  () => ethicsAPI.getOverrideStatistics(30).then(r => r.data),
    staleTime: 5 * 60_000,
  });
  const { data: impactData } = useQuery({
    queryKey: ['ai-impact'],
    queryFn:  () => ethicsAPI.getAIImpactReport().then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const overall = biasData?.overall ?? {};
  const catData = biasData?.by_category?.[cat] ?? {};
  const entries = Object.entries(catData);
  const flagged = entries.filter(([, d]) => Math.abs(d.disparity_from_mean ?? 0) > threshold).length;

  const grade = flagged === 0
    ? { label: 'A · Fair',     color: '#10b981' }
    : flagged <= 2
    ? { label: 'B · Moderate', color: '#f59e0b' }
    : { label: 'C · Review',   color: '#ef4444' };

  /* ── Fairness table columns ── */
  const fairnessCols = [
    col.display({
      id: 'status',
      header: '',
      cell: info => {
        const d     = info.row.original.data;
        const disp  = d.disparity_from_mean ?? 0;
        const isH   = Math.abs(disp) > threshold;
        const isM   = !isH && Math.abs(disp) > threshold / 2;
        const Icon  = isH ? AlertTriangle : isM ? TrendingUp : CheckCircle;
        const color = isH ? '#ef4444' : isM ? '#f59e0b' : '#10b981';
        return <Icon size={14} style={{ color }} />;
      },
      meta: { thStyle: { width: 32 } },
    }),
    col.accessor('group', {
      header: 'Group',
      cell: info => {
        const d    = info.row.original.data;
        const disp = d.disparity_from_mean ?? 0;
        const isH  = Math.abs(disp) > threshold;
        const isM  = !isH && Math.abs(disp) > threshold / 2;
        const color = isH ? '#ef4444' : isM ? '#f59e0b' : '#10b981';
        return (
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-800)' }}>{info.getValue()}</p>
            <p className="text-[10px] font-semibold" style={{ color }}>
              {isH ? 'High disparity' : isM ? 'Moderate' : 'Fair'}
            </p>
          </div>
        );
      },
      meta: { thStyle: { minWidth: 140 } },
    }),
    col.display({
      id: 'risk_bar',
      header: 'Risk score',
      cell: info => {
        const d    = info.row.original.data;
        const pct  = Math.min((d.mean_risk_score || 0) * 100, 100);
        const disp = d.disparity_from_mean ?? 0;
        const color = Math.abs(disp) > threshold ? '#ef4444' : Math.abs(disp) > threshold / 2 ? '#f59e0b' : '#10b981';
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs tabular-nums font-semibold w-10 text-right" style={{ color: 'var(--text-700)' }}>
              {pct.toFixed(1)}%
            </span>
          </div>
        );
      },
      meta: { thStyle: { minWidth: 160 } },
    }),
    col.display({
      id: 'disparity',
      header: 'vs mean',
      cell: info => <DisparityBar value={info.row.original.data.disparity_from_mean ?? 0} threshold={threshold} />,
      meta: { thStyle: { minWidth: 160 } },
    }),
    col.display({
      id: 'samples',
      header: 'Samples',
      cell: info => (
        <span className="text-xs font-bold" style={{ color: 'var(--text-700)' }}>
          {info.row.original.data.count}
        </span>
      ),
      meta: { thStyle: { width: 80, textAlign: 'right' }, tdStyle: { textAlign: 'right' } },
    }),
    col.display({
      id: 'expand',
      header: '',
      cell: info => (
        <ChevronDown size={13} style={{ color: 'var(--text-400)', transition: 'transform 0.18s', transform: info.row.getIsExpanded() ? 'rotate(180deg)' : 'rotate(0)' }} />
      ),
      meta: { thStyle: { width: 32 } },
    }),
  ];

  const tableData = entries.map(([group, data]) => ({ group, data }));

  const TABS = [
    { id: 'fairness',        label: 'Fairness',    Icon: BarChart3  },
    { id: 'overrides',       label: 'Overrides',   Icon: Eye        },
    { id: 'impact',          label: 'AI Impact',   Icon: TrendingUp },
    { id: 'recommendations', label: 'Actions',     Icon: Shield     },
  ];

  return (
    <AdminPageShell
      icon={Brain}
      title="AI Fairness Report"
      meta={!isLoading ? [
        { label: 'predictions', value: overall.total_predictions ?? 0 },
        { label: 'grade',       value: grade.label, color: grade.color },
        ...(flagged > 0 ? [{ label: 'flagged', value: flagged, color: '#ef4444' }] : []),
      ] : []}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      toolbar={tab === 'fairness' ? (
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {/* Category pivot */}
          <div style={{ display:'flex', gap:6 }}>
            {Object.entries(CATS).map(([key, { label, color }]) => (
              <button key={key} onClick={() => setCat(key)}
                style={{
                  padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700,
                  cursor:'pointer', transition:'all 0.15s',
                  border: cat===key ? `1px solid ${color}` : '1px solid var(--card-border)',
                  background: cat===key ? `${color}15` : 'var(--card-bg)',
                  color: cat===key ? color : 'var(--text-500)',
                }}>
                {label}
              </button>
            ))}
          </div>
          {/* Threshold */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <span style={{ fontSize:11, color:'var(--text-500)', whiteSpace:'nowrap' }}>
              Alert threshold:
            </span>
            <input type="range" min={0.05} max={0.30} step={0.05} value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              style={{ width:80, accentColor:'#f59e0b' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'#d97706', whiteSpace:'nowrap', minWidth:28 }}>
              {(threshold*100).toFixed(0)}%
            </span>
          </div>
        </div>
      ) : undefined}
      actions={
        <button onClick={() => refetch()}
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--card-border)',
            background: 'var(--card-bg)', cursor: 'pointer',
            color: 'var(--text-500)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-teal)'; e.currentTarget.style.color = 'var(--c-teal)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-500)'; }}
        >
          <RefreshCw size={14} />
        </button>
      }
    >

      {/* ── FAIRNESS ── */}
      {tab === 'fairness' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {!isLoading && tableData.length > 0 && (
            <div
              style={{
                borderRadius: 16, border: '1px solid var(--card-border)',
                background: 'var(--card-bg)', padding: '16px 20px 8px',
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-400)', marginBottom: 12 }}>
                Disparity from population mean - {CATS[cat]?.label}
              </p>
              <ResponsiveContainer width="100%" height={Math.max(120, tableData.length * 36)}>
                <BarChart
                  data={tableData.map(({ group, data: d }) => ({
                    name: group,
                    disparity: parseFloat(((d.disparity_from_mean ?? 0) * 100).toFixed(2)),
                    risk: parseFloat(((d.mean_risk_score ?? 0) * 100).toFixed(2)),
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 80, bottom: 0 }}
                  barSize={12}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="var(--card-border)"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
                    tick={{ fontSize: 10, fill: 'var(--text-400)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--text-600)' }}
                    axisLine={false}
                    tickLine={false}
                    width={76}
                  />
                  <Tooltip
                    formatter={(val) => [`${val > 0 ? '+' : ''}${val}%`, 'Disparity']}
                    contentStyle={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 10,
                      fontSize: 11,
                      color: 'var(--text-800)',
                    }}
                    cursor={{ fill: 'color-mix(in srgb, var(--c-teal) 5%, transparent)' }}
                  />
                  <ReferenceLine x={0} stroke="var(--text-400)" strokeWidth={1} />
                  <ReferenceLine x={threshold * 100}  stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                  <ReferenceLine x={-threshold * 100} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} />
                  <Bar dataKey="disparity" radius={[0, 4, 4, 0]}>
                    {tableData.map(({ data: d }, i) => {
                      const disp = d.disparity_from_mean ?? 0;
                      const clr  = Math.abs(disp) > threshold ? '#ef4444'
                                 : Math.abs(disp) > threshold / 2 ? '#f59e0b'
                                 : '#10b981';
                      return <Cell key={i} fill={clr} fillOpacity={0.85} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 10, color: 'var(--text-400)', marginTop: 8, textAlign: 'right' }}>
                Red dashed lines = ±{(threshold * 100).toFixed(0)}% alert threshold
              </p>
            </div>
          )}

          {/* Groups table */}
          <DataTable
            columns={fairnessCols}
            data={tableData}
            isLoading={isLoading}
            emptyTitle={`No data for ${CATS[cat]?.label}`}
            emptyBody="Run predictions for this demographic category first."
            renderSubRow={row => (
              <GroupSubRow row={row} threshold={threshold} overall={overall} />
            )}
          />

          {!isLoading && tableData.length > 0 && (
            <p className="text-xs text-right" style={{ color: 'var(--text-400)' }}>
              {flagged} of {tableData.length} group{tableData.length !== 1 ? 's' : ''} exceed{flagged !== 1 ? '' : 's'} threshold
            </p>
          )}
        </div>
      )}

      {/* ── OVERRIDES ── */}
      {tab === 'overrides' && (
        <div className="space-y-4">
          {overrideStats ? (
            <>
              <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-400)' }}>
                  Clinical override summary · last 30 days
                </p>
                {[
                  ['Total overrides',   overrideStats.total_overrides,  'var(--text-800)'],
                  ['Avg AI difference', `${overrideStats.average_difference > 0 ? '+' : ''}${((overrideStats.average_difference || 0) * 100).toFixed(1)}%`,
                                        overrideStats.average_difference > 0 ? '#ef4444' : '#10b981'],
                  ['AI bias direction', overrideStats.direction || 'Neutral', 'var(--text-700)'],
                  ['Recommendation',    overrideStats.recommendation || '-',  '#10b981'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-600)' }}>{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{val}</span>
                  </div>
                ))}
              </div>

              {overrideStats.by_reason && Object.keys(overrideStats.by_reason).length > 0 && (
                <div style={{ borderRadius: 16, border: '1px solid var(--card-border)', background: 'var(--card-bg)', padding: '16px 20px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-400)', marginBottom: 14 }}>
                    Override reasons breakdown
                  </p>
                  <ResponsiveContainer width="100%" height={Math.max(120, Object.keys(overrideStats.by_reason).length * 38)}>
                    <BarChart
                      data={Object.entries(overrideStats.by_reason)
                        .sort(([, a], [, b]) => b - a)
                        .map(([reason, count]) => ({
                          name: reason.replace(/_/g, ' '),
                          count,
                        }))}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                      barSize={14}
                    >
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--card-border)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-400)' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-600)' }} axisLine={false} tickLine={false} width={76} />
                      <Tooltip
                        contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, fontSize: 11, color: 'var(--text-800)' }}
                        cursor={{ fill: 'color-mix(in srgb, var(--c-teal) 6%, transparent)' }}
                      />
                      <Bar dataKey="count" fill="var(--c-teal)" fillOpacity={0.85} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border p-12 text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <Eye size={28} className="mx-auto mb-3" style={{ color: 'var(--card-border)' }} />
              <p className="text-sm" style={{ color: 'var(--text-500)' }}>No override data available</p>
            </div>
          )}
        </div>
      )}

      {/* ── IMPACT ── */}
      {tab === 'impact' && (
        <div className="space-y-4">
          {impactData ? (
            <>
              <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-400)' }}>AI impact metrics</p>
                {[
                  ['Clinician agreement',  `${impactData.clinician_agreement_rate || 0}%`, '#10b981'],
                  ['High-risk alerts',     impactData.high_risk_alerts || 0, '#ef4444'],
                  ['Clinician engagement', impactData.ai_benefit_indicators?.clinician_engagement || '-', 'var(--c-teal)'],
                  ['Model reliability',    impactData.ai_benefit_indicators?.model_reliability || '-',
                                           impactData.ai_benefit_indicators?.model_reliability === 'High' ? '#10b981' : '#f59e0b'],
                ].map(([label, val, color]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-600)' }}>{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{val}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4 text-xs" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                <strong>Academic basis:</strong> Tilala et al. (2024). Biomedical Ethics in AI: Justice Principle - ensuring fair and equitable distribution of AI benefits and risks across all patient demographics.
              </div>
            </>
          ) : (
            <div className="rounded-2xl border p-12 text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <TrendingUp size={28} className="mx-auto mb-3" style={{ color: 'var(--card-border)' }} />
              <p className="text-sm" style={{ color: 'var(--text-500)' }}>No impact data available</p>
            </div>
          )}
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {tab === 'recommendations' && (
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { Icon: AlertTriangle, borderColor: '#fca5a5', title: 'High disparity groups',
              body: 'Investigate with clinical experts to determine whether deviations reflect true health differences or model bias. Document all findings and actions taken.' },
            { Icon: Brain, borderColor: '#ddd6fe', title: 'Model retraining',
              body: 'If persistent disparities are confirmed, retrain with balanced sampling using SMOTE or stratified splitting across demographic groups.' },
            { Icon: Shield, borderColor: 'var(--card-border)', title: 'Clinical validation',
              body: 'Never attribute disparity to model bias alone without clinical review. Work with palliative care specialists to interpret all findings before acting.' },
            { Icon: TrendingUp, borderColor: '#bbf7d0', title: 'Small sample sizes',
              body: 'Groups with fewer than 20 predictions produce unreliable results. Prioritise data collection for underrepresented demographics before drawing conclusions.' },
          ].map(({ Icon, borderColor, title, body }) => (
            <div key={title} className="rounded-2xl border-2 p-5 space-y-2"
              style={{ background: 'var(--card-bg)', borderColor }}>
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color: 'var(--text-500)', flexShrink: 0 }} />
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-800)' }}>{title}</h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-600)' }}>{body}</p>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
