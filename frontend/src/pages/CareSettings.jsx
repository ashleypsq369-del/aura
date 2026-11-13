/**
 * CareSettings.jsx - Palliative Care Delivery Models
 * Fixed: dead ProStatCard import removed, dynamic border-${color}-500 → inline styles,
 * ChangeRequestsPanel filtered API, SettingCard keyboard accessible, img-heading removed
 * from modal headings, filterRole resets on tab change, empty state ternary fixed,
 * duplicate stat strip removed, matrix header compact, assign panel structured card,
 * change requests compact empty state, setting cards min-h reduced, 2-col distribution.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Heart, Home, Stethoscope, BedDouble,
  Users, ChevronRight, ChevronDown, Info, CheckCircle2,
  Clock, UserCheck, ArrowRight, BookOpen, X,
  ClipboardList, BarChart3, AlertCircle,
  Calendar, Pill, Bell, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import apiClient, { careSettingsAPI, patientsAPI } from '../api/client';
import Modal, { ModalFooter } from '../components/Modal';
import PageHeader from '../components/PageHeader';
import SearchableSelect from '../components/ui/SearchableSelect';

/* ── Background images ─────────────────────────────────────────────────────── */
const SETTING_IMAGES = {
  hospital_based:      '/resources/african/african-hospital-ward.jpg',
  hospice:             '/resources/african/african-elder-comfort.jpg',
  home_based:          '/resources/african/african-caregiver.jpg',
  outpatient_clinic:   '/resources/african/african-appointment.jpg',
  long_term_residential: '/resources/african/african-elder-care.jpg',
};

/* ── Icon map ──────────────────────────────────────────────────────────────── */
const ICON_MAP = { Building2, Heart, Home, Stethoscope, BedDouble };

/* ── Color config ──────────────────────────────────────────────────────────── */
const COLOR = {
  blue:   { bg:'bg-blue-50',   border:'border-blue-200',   text:'text-teal-700',   badge:'bg-blue-100 text-teal-700',   dot:'bg-teal-500',  header:'from-blue-600 to-blue-700',   fallback:'#1d4ed8' },
  rose:   { bg:'bg-rose-50',   border:'border-rose-200',   text:'text-rose-700',   badge:'bg-rose-100 text-rose-700',   dot:'bg-rose-500',  header:'from-rose-600 to-rose-700',   fallback:'#e11d48' },
  green:  { bg:'bg-green-50',  border:'border-green-200',  text:'text-green-700',  badge:'bg-green-100 text-green-700', dot:'bg-green-500', header:'from-green-600 to-green-700', fallback:'#059669' },
  teal:   { bg:'bg-teal-50',   border:'border-teal-200',   text:'text-teal-700',   badge:'bg-teal-100 text-teal-700',   dot:'bg-teal-500',  header:'from-teal-600 to-teal-700',   fallback:'#0d9488' },
  purple: { bg:'bg-purple-50', border:'border-purple-200', text:'text-purple-700', badge:'bg-purple-100 text-purple-700',dot:'bg-purple-500',header:'from-purple-600 to-purple-700',fallback:'#7c3aed' },
  gray:   { bg:'bg-slate-50',  border:'border-slate-200',  text:'text-slate-700',  badge:'bg-slate-100 text-slate-700', dot:'bg-slate-400', header:'from-slate-600 to-slate-700', fallback:'#475569' },
};

const ROLE_COLORS = {
  admin:'bg-purple-100 text-purple-700', clinician:'bg-blue-100 text-teal-700',
  nurse:'bg-teal-100 text-teal-700', caregiver:'bg-green-100 text-green-700',
  patient:'bg-orange-100 text-orange-700', family:'bg-pink-100 text-pink-700',
};
const PRIORITY_COLORS = {
  critical:'bg-red-100 text-red-700 border-red-200', high:'bg-orange-100 text-orange-700 border-orange-200',
  medium:'bg-amber-100 text-amber-700 border-amber-200', low:'bg-slate-100 text-[var(--text-600)] border-slate-200',
};
const ROLE_LABELS = {
  admin:'Admin', clinician:'Clinician', nurse:'Nurse',
  caregiver:'Caregiver', patient:'Patient', family:'Family',
};
const ROLE_PILL_COLORS = {
  admin:'#7c3aed', clinician:'#0891b2', nurse:'#0d9488',
  caregiver:'#059669', patient:'#f59e0b', family:'#db2777',
};

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════ */
export default function CareSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);
  const [assignPatientId, setAssignPatientId] = useState('');
  const [assignForm, setAssignForm] = useState({
    setting_key:'', facility_name:'', visit_frequency:'',
    primary_contact:'', transition_reason:'', notes:'',
  });
  const [filterRole, setFilterRole] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestedSetting, setRequestedSetting] = useState('');
  const [requestReason, setRequestReason] = useState('');

  const requestChangeMutation = useMutation({
    mutationFn: ({ setting, reason }) => careSettingsAPI.requestChange({ care_setting: setting, reason }),
    onSuccess: () => {
      toast.success('Change request submitted - an admin will review it shortly');
      setShowRequestModal(false); setRequestedSetting(''); setRequestReason('');
    },
    onError: e => toast.error(e.response?.data?.detail || 'Request failed'),
  });

  const isStaff   = ['admin','clinician'].includes(user?.role);
  const isPatient = user?.role === 'patient';
  const isFamily  = user?.role === 'family';

  /* ── Queries ── */
  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['care-setting-templates'],
    queryFn: () => careSettingsAPI.getTemplates().then(r => r.data),
  });
  const { data: dashboardData } = useQuery({
    queryKey: ['care-settings-dashboard'],
    queryFn: () => careSettingsAPI.getDashboard().then(r => r.data),
    enabled: isStaff,
  });
  const { data: matrixData } = useQuery({
    queryKey: ['care-settings-matrix'],
    queryFn: () => careSettingsAPI.getInteractions().then(r => r.data),
    enabled: activeTab === 'matrix',
  });
  const { data: mySettingData } = useQuery({
    queryKey: ['my-care-setting'],
    queryFn: () => careSettingsAPI.getMySetting().then(r => r.data),
    enabled: isPatient || isFamily,
  });
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsAPI.getAll().then(r => r.data),
    enabled: isStaff,
  });
  const { data: detailData } = useQuery({
    queryKey: ['care-setting-detail', selectedTemplate],
    queryFn: () => careSettingsAPI.getTemplate(selectedTemplate).then(r => r.data),
    enabled: !!selectedTemplate,
  });

  /* ── Assign mutation ── */
  const assignMutation = useMutation({
    mutationFn: ({ patientId, data }) => careSettingsAPI.assignPatient(patientId, data),
    onSuccess: () => {
      toast.success('Patient assigned to care setting');
      qc.invalidateQueries(['care-settings-dashboard']);
      setAssignPatientId('');
      setAssignForm({ setting_key:'', facility_name:'', visit_frequency:'', primary_contact:'', transition_reason:'', notes:'' });
    },
    onError: e => toast.error(e.response?.data?.detail || 'Assignment failed'),
  });

  const templates            = templatesData?.templates || [];
  const distribution         = dashboardData?.distribution || [];
  const templatesWithCounts  = templates.map(t => {
    const dist = distribution.find(d => d.setting_key === t.setting_key);
    return { ...t, patient_count: dist?.patient_count ?? undefined };
  });

  /* ── Tabs ── */
  const tabs = isStaff
    ? [
        { id:'overview',   label:'Overview',      icon: BarChart3  },
        { id:'settings',   label:'Settings',      icon: BookOpen   },
        { id:'matrix',     label:'Users',         icon: Users      },
        { id:'assign',     label:'Assign',        icon: UserCheck  },
        { id:'requests',   label:'Requests',      icon: Bell       },
      ]
    : isPatient || isFamily
    ? [
        { id:'my-setting', label: isFamily ? "Loved One's Setting" : 'My Care Setting', icon: Heart    },
        { id:'settings',   label:'All Settings',      icon: BookOpen   },
      ]
    : [
        { id:'settings',   label:'Care Settings',     icon: BookOpen   },
        { id:'matrix',     label:'My Interactions',   icon: ClipboardList },
      ];

  useEffect(() => {
    if (!tabs.find(t => t.id === activeTab)) setActiveTab(tabs[0]?.id || 'overview');
  }, [user?.role]);

  const switchTab = id => { setActiveTab(id); setFilterRole('all'); };

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      style={{ minHeight:'100vh', paddingBottom:40, background:'var(--page-bg)' }}>

      <PageHeader
        image="/resources/african/african-hospital-ward.jpg"
        title="Palliative Care Settings"
        subtitle="5 evidence-based care delivery models · hospital, hospice, home, clinic & residential"
        icon={Stethoscope}
        stats={isStaff ? [
          { label:'Total patients', value: dashboardData?.total_patients ?? '-', color:'#2dd4bf' },
          { label:'Assigned',       value: dashboardData?.total_assigned  ?? '-', color:'#4ade80' },
          { label:'Unassigned',     value: dashboardData?.unassigned      ?? '-', color: (dashboardData?.unassigned ?? 0) > 0 ? '#fbbf24' : 'rgba(255,255,255,0.5)' },
          { label:'Settings',       value: 5,                                      color:'#a78bfa' },
        ] : undefined}
      >
        {/* Role filter pills - only shown on matrix tab */}
        {activeTab === 'matrix' && (
          <>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--text-400)', whiteSpace:'nowrap' }}>Role</span>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {['all','clinician','nurse','caregiver','patient','family','admin'].map(r => {
                const active = filterRole === r;
                const c = ROLE_PILL_COLORS[r] || '#475569';
                return (
                  <button key={r} onClick={() => setFilterRole(r)} style={{
                    padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600,
                    cursor:'pointer', transition:'all 0.15s',
                    border: active ? `1.5px solid ${c}` : '1px solid var(--card-border)',
                    background: active ? `${c}12` : 'var(--card-bg)',
                    color: active ? c : 'var(--text-500)',
                  }}>
                    {r === 'all' ? 'All roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PageHeader>

      {/* ── Unified tab container ── */}
      <div style={{ maxWidth:1200, margin:'16px auto 0', padding:'0 20px 40px' }}>
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Tab bar - pill segment control */}
          <div style={{ borderBottom:'1px solid var(--card-border)', padding:'0 20px' }}>
            <div style={{ display:'flex', overflowX:'auto', scrollbarWidth:'none', gap:2, padding:'10px 0' }}>
              {tabs.map(tab => {
                const TabIcon = tab.icon;
                const active  = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'7px 14px',
                    fontSize:12, fontWeight: active ? 700 : 500,
                    color: active ? '#fff' : 'var(--text-500)',
                    background: active
                      ? 'linear-gradient(135deg,#0d9488,#0891b2)'
                      : 'transparent',
                    border: active ? 'none' : '1px solid transparent',
                    borderRadius:8,
                    cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                    transition:'all 0.15s',
                    boxShadow: active ? '0 2px 8px rgba(13,148,136,0.25)' : 'none',
                  }}
                  onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background='var(--page-bg)'; e.currentTarget.style.color='var(--text-700)'; }}}
                  onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-500)'; }}}
                  >
                    <TabIcon size={12} style={{ opacity: active ? 1 : 0.7 }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding:'20px' }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && isStaff && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Distribution card - stats already in PageHeader, no duplicate strip */}
            <div style={{ borderRadius:16, border:'1px solid var(--card-border)', background:'var(--card-bg)', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2,#059669)' }} />
              <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:8 }}>
                <BarChart3 size={15} style={{ color:'var(--c-teal)' }} />
                <h2 style={{ fontSize:13, fontWeight:700, color:'var(--text-900)', margin:0 }}>Patient Distribution Across Settings</h2>
              </div>
              <div style={{ padding:'12px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:8 }}>
                {distribution.map(item => {
                  const c   = COLOR[item.color] || COLOR.gray;
                  const Icon = ICON_MAP[item.icon] || Stethoscope;
                  const pct = dashboardData?.total_patients
                    ? Math.round((item.patient_count / dashboardData.total_patients) * 100)
                    : 0;
                  return (
                    <div key={item.setting_key} style={{ padding:'10px 14px', borderRadius:12, border:`1px solid ${c.fallback}20`, background:`${c.fallback}08` }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${c.fallback},${c.fallback}aa)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Icon size={13} style={{ color:'#fff' }} />
                          </div>
                          <span style={{ fontWeight:700, fontSize:12, color:c.fallback }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, background:`${c.fallback}15`, color:c.fallback }}>
                          {item.patient_count} patients
                        </span>
                      </div>
                      <div style={{ width:'100%', height:5, background:'var(--card-border)', borderRadius:99, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8, delay:0.1 }}
                          style={{ height:'100%', borderRadius:99, background:c.fallback }} />
                      </div>
                      <p style={{ fontSize:11, color:'var(--text-500)', marginTop:4 }}>{item.focus}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── CARE SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {loadingTemplates ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5].map(i => <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templatesWithCounts.map((t, i) => (
                  <SettingCard
                    key={t.setting_key} template={t} index={i}
                    isSelected={selectedTemplate === t.setting_key}
                    onSelect={() => setSelectedTemplate(selectedTemplate === t.setting_key ? null : t.setting_key)}
                  />
                ))}
              </div>
            )}

            {/* Portal modal - follows FocusedAIExplanation pattern */}
            {selectedTemplate && detailData && (
              <SettingDetailPanel
                detail={detailData}
                userRole={user?.role}
                onClose={() => setSelectedTemplate(null)}
              />
            )}
          </div>
        )}

        {/* ── INTERACTION MATRIX ── */}
        {activeTab === 'matrix' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--card-bg)', borderRadius:16, border:'1px solid var(--card-border)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', overflow:'hidden' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2)' }} />
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', gap:8 }}>
                <Users size={14} style={{ color:'var(--c-teal)' }} />
                <h2 style={{ fontSize:13, fontWeight:700, color:'var(--text-900)', margin:0 }}>How Every User Interacts with Each Care Setting</h2>
              </div>
              <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                {templates.map(t => {
                  const c    = COLOR[t.color] || COLOR.gray;
                  const Icon = ICON_MAP[t.icon] || Stethoscope;
                  const settingMatrix = matrixData?.matrix?.[t.setting_key] || {};
                  const roles = filterRole === 'all'
                    ? Object.keys(settingMatrix)
                    : Object.keys(settingMatrix).filter(r => r === filterRole);

                  if (roles.length === 0 && filterRole !== 'all') return null;

                  return (
                    <div key={t.setting_key} style={{ borderRadius:12, border:`1px solid ${c.fallback}25`, overflow:'hidden' }}>
                      {/* Compact setting header */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:`${c.fallback}10`, borderBottom:`1px solid ${c.fallback}20` }}>
                        <div style={{ width:26, height:26, borderRadius:7, background:`linear-gradient(135deg,${c.fallback},${c.fallback}bb)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon size={13} style={{ color:'#fff' }} />
                        </div>
                        <h3 style={{ fontSize:12, fontWeight:700, color:c.fallback, margin:0 }}>{t.label}</h3>
                      </div>

                      {/* Role rows */}
                      <div style={{ background:'var(--card-bg)' }}>
                        {roles.length === 0 ? (
                          <p style={{ padding:'10px 14px', fontSize:12, color:'var(--text-400)' }}>No interactions data for this filter.</p>
                        ) : roles.map((role, ri) => (
                          <div key={role} style={{ padding:'10px 14px', borderTop: ri > 0 ? '1px solid var(--card-border)' : undefined }}>
                            <button
                              onClick={() => setExpandedRole(expandedRole === `${t.setting_key}_${role}` ? null : `${t.setting_key}_${role}`)}
                              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }}
                            >
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'}`}>
                                  {ROLE_LABELS[role] || role}
                                </span>
                                <span style={{ fontSize:12, color:'var(--text-500)' }}>
                                  {settingMatrix[role]?.length || 0} interaction{settingMatrix[role]?.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {expandedRole === `${t.setting_key}_${role}`
                                ? <ChevronDown size={14} style={{ color:'var(--text-400)' }} />
                                : <ChevronRight size={14} style={{ color:'var(--text-400)' }} />}
                            </button>

                            <AnimatePresence>
                              {expandedRole === `${t.setting_key}_${role}` && (
                                <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:'hidden' }}>
                                  <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
                                    {settingMatrix[role]?.map((ix, idx) => <InteractionRow key={idx} ix={ix} />)}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── MY CARE SETTING ── */}
        {activeTab === 'my-setting' && (isPatient || isFamily) && (
          <div className="space-y-5">
            {isFamily && (
              <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Users size={15} className="text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Your loved one's care context</p>
                  <p className="text-xs text-teal-700 mt-0.5">This shows the care setting your loved one is currently assigned to. Changes are managed by their clinical team.</p>
                </div>
              </div>
            )}

            {mySettingData?.current_setting ? (
              <>
                <CurrentSettingBanner setting={mySettingData.current_setting} onRequestChange={isPatient ? () => setShowRequestModal(true) : null} navigate={navigate} isFamily={isFamily} />
                {isPatient && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900">Need a different care setting?</p>
                      <p className="text-xs text-amber-700 mt-0.5">If your care needs have changed, submit a request - an admin will review and approve it.</p>
                    </div>
                    <button onClick={() => setShowRequestModal(true)}
                      className="flex-shrink-0 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition">
                      Request Change
                    </button>
                  </div>
                )}
                {mySettingData.history?.length > 1 && <SettingHistory history={mySettingData.history} />}
              </>
            ) : (
              <div className="bg-[var(--card-bg)] rounded-2xl p-10 border border-[var(--card-border)] text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope size={24} className="text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-700)] mb-2">
                  {isFamily ? 'Loved One Not Yet Assigned' : 'No Care Setting Assigned Yet'}
                </h3>
                <p className="text-[var(--text-500)] text-sm max-w-sm mx-auto mb-5 leading-relaxed">
                  {isFamily
                    ? 'Your loved one has not yet been assigned to a care setting. Their clinical team will do this shortly.'
                    : 'Your clinical team will assign you to the most appropriate care setting.'}
                </p>
                <button onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition text-sm">
                  Browse All Settings <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CHANGE REQUESTS ── */}
        {activeTab === 'requests' && isStaff && (
          <ChangeRequestsPanel templates={templatesWithCounts} />
        )}

        {/* ── ASSIGN PATIENT ── */}
        {activeTab === 'assign' && isStaff && (
          <AssignPatientPanel
            patients={patientsData || []}
            templates={templates}
            assignForm={assignForm}
            setAssignForm={setAssignForm}
            assignPatientId={assignPatientId}
            setAssignPatientId={setAssignPatientId}
            onSubmit={() => {
              if (!assignPatientId || !assignForm.setting_key) { toast.error('Select a patient and a care setting'); return; }
              assignMutation.mutate({ patientId: assignPatientId, data: assignForm });
            }}
            isPending={assignMutation.isPending}
          />
        )}

        </div>
        </div>
      </div>

      {/* ── Request Change Modal ── */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)}
        title="Request Care Setting Change" size="md" closeOnBackdrop={false}
        footerContent={
          <ModalFooter>
            <button type="button" onClick={() => setShowRequestModal(false)}
              className="px-4 py-2 text-sm font-semibold text-[var(--text-700)] border-2 border-slate-300 rounded-xl hover:bg-[var(--card-bg)] transition">
              Cancel
            </button>
            <button type="button" disabled={!requestedSetting || requestChangeMutation.isPending}
              onClick={() => requestChangeMutation.mutate({ setting: requestedSetting, reason: requestReason })}
              className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl border-2 border-amber-600 transition disabled:opacity-50">
              {requestChangeMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-600)] leading-relaxed">
            Select the care setting that best describes your current situation.
          </p>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-2">Requested Care Setting *</label>
            <div className="space-y-2">
              {[
                { key:'hospital_based',       Icon: Building2,    label:'Hospital-Based Palliative Care' },
                { key:'hospice',              Icon: Heart,        label:'Hospice Care' },
                { key:'home_based',           Icon: Home,         label:'Home-Based Care' },
                { key:'outpatient_clinic',    Icon: Stethoscope,  label:'Outpatient Clinic' },
                { key:'long_term_residential',Icon: BedDouble,    label:'Long-Term Residential' },
              ].map(s => (
                <button key={s.key} type="button" onClick={() => setRequestedSetting(s.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition ${requestedSetting === s.key ? 'border-amber-500 bg-amber-50' : 'border-[var(--card-border)] hover:border-amber-300'}`}>
                  <s.Icon size={16} className="flex-shrink-0 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800">{s.label}</span>
                  {requestedSetting === s.key && <CheckCircle2 size={14} className="text-amber-600 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">Reason for Change (optional)</label>
            <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={3}
              placeholder="e.g., My condition has changed and I am now receiving care at home…"
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-sm resize-none" />
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}

/* ── SettingCard ─────────────────────────────────────────────────────────────── */
function SettingCard({ template: t, index, isSelected, onSelect }) {
  const c   = COLOR[t.color] || COLOR.gray;
  const Icon = ICON_MAP[t.icon] || Stethoscope;
  const img  = SETTING_IMAGES[t.setting_key];

  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      role="button" tabIndex={0}
      style={{ outline:'none' }}
      className={`cursor-pointer rounded-2xl border overflow-hidden transition-all flex flex-col ${
        isSelected ? 'ring-2 ring-offset-2 ring-teal-400 shadow-lg border-teal-400' : 'border-[var(--card-border)] hover:shadow-lg hover:border-teal-300'
      }`}
    >
      {/* Image top half — fixed height, no text on top of it */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 90, background: c.fallback }}>
        {img && (
          <img src={img} alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        )}
        {/* Icon + chevron float over image with strong bg */}
        <div className="absolute inset-0 flex items-start justify-between p-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.header} flex items-center justify-center shadow-lg border-2 border-white/40 flex-shrink-0`}>
            <Icon size={14} className="text-white" />
          </div>
          <div className="w-6 h-6 rounded-lg bg-black/50 flex items-center justify-center flex-shrink-0">
            <ChevronRight size={12} className="text-white" />
          </div>
        </div>
      </div>

      {/* Text area — solid opaque background, guaranteed readable */}
      <div className="px-3 py-2.5 bg-[var(--card-bg)] flex-1">
        <h3 className="font-bold text-sm leading-tight mb-0.5 text-[var(--text-900)]">
          {t.label}
        </h3>
        <p className="text-xs text-[var(--text-500)] leading-relaxed line-clamp-2">
          {t.focus}
        </p>
        {t.patient_count !== undefined && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-[var(--text-400)]">
            <Users size={9}/> {t.patient_count} patients
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ── SettingDetailPanel - portal modal matching FocusedAIExplanation DNA ─── */
function SettingDetailPanel({ detail: t, userRole, onClose }) {
  const c    = COLOR[t.color] || COLOR.gray;
  const Icon = ICON_MAP[t.icon] || Stethoscope;
  const [activeSection, setActiveSection] = useState('overview');
  const roleInteractions = t.interactions_by_role?.[userRole] || [];

  return createPortal(
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div key="sdp-bg"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          onClick={onClose}
          style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.45)' }} />

        {/* Card */}
        <div style={{ position:'fixed', inset:0, zIndex:9501, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}>
          <motion.div key="sdp-card"
            initial={{ opacity:0, y:18, scale:0.97 }}
            animate={{ opacity:1, y:0,  scale:1   }}
            exit={{    opacity:0, y:10, scale:0.97 }}
            transition={{ type:'spring', damping:30, stiffness:360 }}
            onClick={e => e.stopPropagation()}
            style={{
              pointerEvents:'all',
              background:'#ffffff',
              borderRadius:12,
              width:'100%', maxWidth:620,
              maxHeight:'90vh',
              display:'flex', flexDirection:'column',
              boxShadow:'0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
              fontFamily:"'Inter','system-ui',sans-serif",
              overflow:'hidden',
            }}>

            {/* ── Fixed header ── */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px 12px', borderBottom:'1px solid #f1f5f9', flexShrink:0,
              background:`linear-gradient(135deg, ${c.fallback}, ${c.fallback}cc)` }}>
              <div style={{ width:40, height:40, background:'rgba(255,255,255,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} style={{ color:'#fff' }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:15, fontWeight:700, color:'#fff', margin:0, lineHeight:1.3 }}>{t.label}</p>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.75)', margin:'2px 0 0' }}>{t.focus}</p>
              </div>
              <button onClick={onClose}
                style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <X size={14} style={{ color:'#fff' }} strokeWidth={2.5} />
              </button>
            </div>

            {/* ── Section tabs ── */}
            <div style={{ display:'flex', gap:0, padding:'0 18px', borderBottom:'1px solid #f1f5f9', overflowX:'auto', flexShrink:0, background:'#fff' }}>
              {[
                { id:'overview',      label:'Overview',      icon: Info          },
                { id:'interventions', label:'Interventions', icon: ClipboardList },
                { id:'team',          label:'Care Team',     icon: Users         },
                { id:'my-role',       label:'My Role',       icon: UserCheck     },
              ].map(sec => {
                const SecIcon = sec.icon;
                const active  = activeSection === sec.id;
                return (
                  <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                    style={{
                      display:'flex', alignItems:'center', gap:5,
                      padding:'10px 14px 10px', fontSize:12, fontWeight: active ? 700 : 500,
                      border:'none', borderBottom: active ? `2px solid ${c.fallback}` : '2px solid transparent',
                      background:'transparent',
                      color: active ? c.fallback : '#64748b',
                      cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.12s',
                    }}>
                    <SecIcon size={13} />
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:14 }}>

              {activeSection === 'overview' && (
                <>
                  <p style={{ fontSize:13, color:'#334155', lineHeight:1.7, margin:0 }}>{t.description}</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {/* Who it serves */}
                    <div style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${c.fallback}30`, background:`${c.fallback}08` }}>
                      <p style={{ fontSize:11, fontWeight:700, color:c.fallback, margin:'0 0 8px', display:'flex', alignItems:'center', gap:5 }}>
                        <Users size={12} /> Who It Serves
                      </p>
                      {t.who_it_serves?.map((item, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6, marginBottom:5 }}>
                          <CheckCircle2 size={12} style={{ color:c.fallback, flexShrink:0, marginTop:2 }} />
                          <span style={{ fontSize:12, color:'#334155', lineHeight:1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    {/* Duration + outcome */}
                    <div style={{ padding:'12px 14px', borderRadius:10, border:`1px solid ${c.fallback}30`, background:`${c.fallback}08` }}>
                      <p style={{ fontSize:11, fontWeight:700, color:c.fallback, margin:'0 0 8px', display:'flex', alignItems:'center', gap:5 }}>
                        <Clock size={12} /> Expected Duration
                      </p>
                      <p style={{ fontSize:13, color:'#334155', margin:'0 0 8px' }}>{t.typical_duration}</p>
                      <div style={{ borderTop:`1px solid ${c.fallback}20`, paddingTop:8 }}>
                        <p style={{ fontSize:11, fontWeight:600, color:'#94a3b8', margin:'0 0 3px' }}>Outcome Focus</p>
                        <p style={{ fontSize:12, color:'#334155', lineHeight:1.5, margin:0 }}>{t.outcome_focus}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'interventions' && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {t.key_interventions?.map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, border:`1px solid ${c.fallback}25`, background:`${c.fallback}06` }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:c.fallback, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{i+1}</span>
                      </div>
                      <p style={{ fontSize:13, color:'#334155', margin:0, lineHeight:1.5 }}>{item}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'team' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
                  {t.care_team_roles?.map(role => (
                    <div key={role} style={{ padding:'12px', borderRadius:10, border:`2px solid ${c.fallback}30`, background:`${c.fallback}08`, textAlign:'center' }}>
                      <UserCheck size={18} style={{ color:c.fallback, margin:'0 auto 6px' }} />
                      <p style={{ fontSize:12, fontWeight:700, color:c.fallback, margin:0 }}>{role}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'my-role' && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {roleInteractions.length === 0 ? (
                    <p style={{ fontSize:13, color:'#94a3b8', textAlign:'center', padding:'24px 0' }}>No interactions defined for your role in this setting.</p>
                  ) : roleInteractions.map((ix, i) => (
                    <InteractionRow key={i} ix={ix} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Fixed footer ── */}
            <div style={{ padding:'12px 18px', background:'#fafafa', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
              {t && ['hospital_based','outpatient_clinic'].includes(t.setting_key) && (
                <button onClick={() => { onClose(); window.location.href='/appointments'; }}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, color:'#fff', background:'#d97706', border:'none', cursor:'pointer' }}>
                  <Calendar size={13} /> View Appointments
                </button>
              )}
              {t && ['home_based','hospice','long_term_residential'].includes(t.setting_key) && (
                <button onClick={() => { onClose(); window.location.href='/medications'; }}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700, color:'#fff', background:c.fallback, border:'none', cursor:'pointer' }}>
                  <Pill size={13} /> View Medications
                </button>
              )}
              <button onClick={onClose}
                style={{ padding:'8px 18px', borderRadius:8, fontSize:12, fontWeight:600, color:'#475569', background:'transparent', border:'1px solid #e2e8f0', cursor:'pointer' }}>
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>,
    document.body
  );
}

/* ── InfoBlock ───────────────────────────────────────────────────────────────── */
function InfoBlock({ title, icon: Icon, color, children }) {
  const c = color || COLOR.teal;
  return (
    <div className={`p-3.5 rounded-xl border-2 ${c.bg} ${c.border}`}>
      <p className={`text-xs font-bold ${c.text} mb-2.5 flex items-center gap-1.5`}>
        <Icon size={13} />{title}
      </p>
      {children}
    </div>
  );
}

/* ── InteractionRow ──────────────────────────────────────────────────────────── */
function InteractionRow({ ix }) {
  const pCls = PRIORITY_COLORS[ix.priority] || PRIORITY_COLORS.medium;
  return (
    <div className="p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-sm text-[var(--text-900)]">{ix.interaction_type}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${pCls}`}>{ix.priority}</span>
          <span className="px-2 py-0.5 bg-slate-200 text-[var(--text-600)] rounded-full text-[11px] font-bold">{ix.frequency}</span>
        </div>
      </div>
      <p className="text-xs text-[var(--text-600)] leading-relaxed">{ix.description}</p>
      {ix.system_features_used?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {ix.system_features_used.map(f => (
            <span key={f} className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[11px] font-bold">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── CurrentSettingBanner ────────────────────────────────────────────────────── */
function CurrentSettingBanner({ setting, onRequestChange, navigate, isFamily = false }) {
  const c    = COLOR[setting.setting_color] || COLOR.gray;
  const Icon = ICON_MAP[setting.setting_icon] || Stethoscope;
  const img  = SETTING_IMAGES[setting.setting_key];
  const assignedDate = setting.assigned_at
    ? new Date(setting.assigned_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
    : null;

  const EXPECT = {
    hospital_based:       ['Daily clinical rounds by your care team','Specialist consultations available on-site','24/7 nursing support and vital monitoring','Family meetings to discuss your goals of care'],
    hospice:              ['Comfort-focused care - no curative treatment','Spiritual and emotional support available','Family caregivers supported and trained','Bereavement support for loved ones after you pass'],
    home_based:           ['Regular home visits from nurse or clinician','You manage daily care in your own environment','Remote symptom monitoring via this portal','Community caregiver provides daily assistance'],
    outpatient_clinic:    ['Scheduled clinic appointments (not admitted)','Assessments and medication reviews each visit','Between visits: submit symptoms via My Journey','Contact your care team via Messages anytime'],
    long_term_residential:['24/7 personal care and nursing support on-site','Monthly care plan reviews with your team','Social activities and community engagement','Family visits encouraged and supported'],
  };
  const bullets = EXPECT[setting.setting_key] || [];

  const PATIENT_ACTIONS = {
    hospital_based:       [{ label:'Appointments', icon:Calendar,     path:'/appointments' },{ label:'Medications', icon:Pill,         path:'/medications' }],
    hospice:              [{ label:'My Journey',   icon:Heart,        path:'/my-journey'   },{ label:'Memory Vault',icon:BookOpen,     path:'/memory-vault' }],
    home_based:           [{ label:'Log Symptoms', icon:ClipboardList,path:'/wellness-checkin' },{ label:'Medications',icon:Pill,      path:'/medications' }],
    outpatient_clinic:    [{ label:'Appointments', icon:Calendar,     path:'/appointments' },{ label:'Assessments', icon:ClipboardList,path:'/my-space' }],
    long_term_residential:[{ label:'Wellbeing',    icon:Heart,        path:'/my-space'     },{ label:'Community',   icon:Users,        path:'/community' }],
  };
  const FAMILY_ACTIONS = {
    hospital_based:       [{ label:'Messages',     icon:BookOpen,     path:'/messages'     },{ label:'Appointments',icon:Calendar,     path:'/appointments' }],
    hospice:              [{ label:'Memory Vault', icon:Heart,        path:'/memory-vault' },{ label:'Messages',    icon:BookOpen,     path:'/messages' }],
    home_based:           [{ label:'Messages',     icon:BookOpen,     path:'/messages'     },{ label:'Resources',   icon:ClipboardList,path:'/resources' }],
    outpatient_clinic:    [{ label:'Appointments', icon:Calendar,     path:'/appointments' },{ label:'Messages',    icon:BookOpen,     path:'/messages' }],
    long_term_residential:[{ label:'Messages',     icon:BookOpen,     path:'/messages'     },{ label:'Community',   icon:Users,        path:'/community' }],
  };
  const actions = (isFamily ? FAMILY_ACTIONS : PATIENT_ACTIONS)[setting.setting_key] || [];

  return (
    <div className="grid md:grid-cols-2 gap-4 items-start">
      {/* Hero image card */}
      <div className="relative rounded-2xl overflow-hidden shadow-md" style={{ minHeight:180 }}>
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }} />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/10" />
        <div className="relative p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 border border-white/30">
              <Icon size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-semibold mb-0.5">{isFamily ? "Loved One's Care Setting" : 'Your Care Setting'}</p>
              <h2 className="text-lg font-bold text-white leading-tight">{setting.setting_label}</h2>
              {assignedDate && <p className="text-white/60 text-xs mt-1 flex items-center gap-1"><Clock size={10} /> Assigned {assignedDate}</p>}
            </div>
            <span className="flex-shrink-0 bg-white/20 backdrop-blur border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <CheckCircle2 size={11} /> Active
            </span>
          </div>

          {(setting.facility_name || setting.visit_frequency || setting.primary_contact) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/20">
              {setting.facility_name && (
                <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-2 border border-white/20">
                  <p className="text-white/60 text-[10px]">Facility</p>
                  <p className="text-white font-semibold text-sm">{setting.facility_name}</p>
                </div>
              )}
              {setting.visit_frequency && (
                <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-2 border border-white/20">
                  <p className="text-white/60 text-[10px]">Visit Frequency</p>
                  <p className="text-white font-semibold text-sm">{setting.visit_frequency}</p>
                </div>
              )}
              {setting.primary_contact && (
                <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-2 border border-white/20">
                  <p className="text-white/60 text-[10px]">Care Contact</p>
                  <p className="text-white font-semibold text-sm">{setting.primary_contact}</p>
                </div>
              )}
            </div>
          )}

          {setting.notes && (
            <div className="mt-3 bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
              <p className="text-white/80 text-sm leading-relaxed">{setting.notes}</p>
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex gap-2 mt-4">
              {actions.map(({ label, icon: AIcon, path }) => (
                <button key={path} onClick={() => navigate(path)}
                  className="flex items-center gap-1.5 bg-[var(--card-bg)] text-[var(--text-800)] font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors hover:opacity-90">
                  <AIcon size={12} />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* What to expect - right column */}
      {bullets.length > 0 && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 h-full">
          <h3 className="text-sm font-semibold text-[var(--text-700)] mb-3 flex items-center gap-2">
            <Info size={14} className="text-teal-500" /> What to expect
          </h3>
          <div className="space-y-2.5">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${c.header} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <CheckCircle2 size={10} className="text-white" />
                </div>
                <p className="text-sm text-[var(--text-700)] leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SettingHistory ──────────────────────────────────────────────────────────── */
function SettingHistory({ history }) {
  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-4">
      <h3 className="font-bold text-sm text-[var(--text-900)] mb-4 flex items-center gap-2">
        <Clock size={15} className="text-teal-600" /> Care Setting History
      </h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-3">
          {history.map(item => {
            const c = COLOR[item.setting_color] || COLOR.gray;
            return (
              <div key={item.id} className="flex items-start gap-3 relative">
                <div className={`w-8 h-8 rounded-full border-2 ${item.is_current ? `${c.dot} border-white shadow-md` : 'bg-slate-200 border-white'} flex items-center justify-center z-10 flex-shrink-0`}>
                  {item.is_current
                    ? <CheckCircle2 size={13} className="text-white" />
                    : <div className="w-2.5 h-2.5 bg-slate-400 rounded-full" />}
                </div>
                <div className={`flex-1 p-3 rounded-xl border-2 ${item.is_current ? `${c.bg} ${c.border}` : 'bg-[var(--card-bg)] border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`font-bold text-sm ${item.is_current ? c.text : 'text-slate-600'}`}>{item.setting_label}</p>
                    {item.is_current && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${c.badge}`}>Current</span>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(item.assigned_at).toLocaleDateString()}
                    {item.ended_at && ` → ${new Date(item.ended_at).toLocaleDateString()}`}
                  </p>
                  {item.transition_reason && <p className="text-xs text-[var(--text-600)] mt-1 italic">"{item.transition_reason}"</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── AssignPatientPanel ──────────────────────────────────────────────────────── */
function AssignPatientPanel({ patients, templates, assignForm, setAssignForm, assignPatientId, setAssignPatientId, onSubmit, isPending }) {
  return (
    <div style={{ background:'var(--card-bg)', borderRadius:16, border:'1px solid var(--card-border)', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#0891b2)' }} />
      <div style={{ padding:'16px 20px' }}>
        <h2 style={{ fontSize:13, fontWeight:700, color:'var(--text-900)', margin:'0 0 16px', display:'flex', alignItems:'center', gap:8 }}>
          <UserCheck size={14} style={{ color:'var(--c-teal)' }} />
          Assign Patient to Care Setting
        </h2>
        <AssignFormFields
          patients={patients} templates={templates}
          assignForm={assignForm} setAssignForm={setAssignForm}
          assignPatientId={assignPatientId} setAssignPatientId={setAssignPatientId}
        />
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <button type="button" onClick={onSubmit}
            disabled={isPending || !assignPatientId || !assignForm.setting_key}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:10, fontSize:13, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#0d9488,#0891b2)', border:'none', cursor:'pointer', opacity: isPending||!assignPatientId||!assignForm.setting_key ? 0.5 : 1, transition:'opacity 0.15s' }}>
            <ArrowRight size={14} />
            {isPending ? 'Assigning…' : 'Assign to Setting'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignFormFields({ patients, templates, assignForm, setAssignForm, assignPatientId, setAssignPatientId }) {
  const f   = assignForm;
  const set = (k, v) => setAssignForm(prev => ({ ...prev, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <SearchableSelect label="Patient *" accent="teal"
          value={assignPatientId ? String(assignPatientId) : null}
          onChange={v => setAssignPatientId(v || '')}
          placeholder="Search patient…"
          options={patients.map(p => ({ value:String(p.id), label:p.full_name, sublabel:`${p.patient_code||'#'+p.id}${p.primary_diagnosis?' · '+p.primary_diagnosis.slice(0,20):''}`, avatar:'linear-gradient(135deg,#0d9488,#0891b2)' }))} />
        <SearchableSelect label="Care Setting *" accent="teal"
          value={f.setting_key || null} onChange={v => set('setting_key', v||'')}
          placeholder="Select setting…" allowClear={false}
          options={templates.map(t => ({ value:t.setting_key, label:t.label, sublabel:t.focus?.slice(0,35) }))} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-600)] mb-1.5">Facility Name</label>
          <input type="text" value={f.facility_name} onChange={e => set('facility_name', e.target.value)}
            placeholder="e.g., Korle Bu Teaching Hospital"
            className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-100 focus:outline-none transition text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-600)] mb-1.5">Visit Frequency</label>
          <input type="text" value={f.visit_frequency} onChange={e => set('visit_frequency', e.target.value)}
            placeholder="e.g., Twice weekly"
            className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-100 focus:outline-none transition text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--text-600)] mb-1.5">Primary Care Contact</label>
        <input type="text" value={f.primary_contact} onChange={e => set('primary_contact', e.target.value)}
          placeholder="e.g., Nurse Adwoa - 0244 123 456"
          className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-100 focus:outline-none transition text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--text-600)] mb-1.5">Reason for Transition</label>
        <input type="text" value={f.transition_reason} onChange={e => set('transition_reason', e.target.value)}
          placeholder="e.g., Symptoms stabilised - moving to home-based care"
          className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-100 focus:outline-none transition text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--text-600)] mb-1.5">Clinical Notes</label>
        <textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={3}
          placeholder="Any additional context or care instructions…"
          className="w-full px-3 py-2 border border-[var(--card-border)] rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-100 focus:outline-none transition resize-none text-sm" />
      </div>
    </div>
  );
}

/* ── ChangeRequestsPanel ─────────────────────────────────────────────────────── */
function ChangeRequestsPanel({ templates }) {
  const qc = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users-with-change-requests'],
    queryFn: () => apiClient.get('/api/admin/users?has_change_request=true&per_page=50').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, settingKey }) => Promise.all([
      apiClient.put(`/api/admin/users/${userId}`, { care_setting: settingKey, care_setting_change_request: null }),
    ]),
    onSuccess: () => { toast.success('Request approved'); qc.invalidateQueries(['users-with-change-requests']); qc.invalidateQueries(['care-settings-dashboard']); },
    onError: e => toast.error(e.response?.data?.detail || 'Approval failed'),
  });
  const dismissMutation = useMutation({
    mutationFn: userId => apiClient.put(`/api/admin/users/${userId}`, { care_setting_change_request: null, care_setting_change_reason: null }),
    onSuccess: () => { toast.success('Request dismissed'); qc.invalidateQueries(['users-with-change-requests']); },
    onError: () => toast.error('Failed to dismiss'),
  });

  const pending      = (usersData?.users || []).filter(u => u.care_setting_change_request);
  const settingLabel = key => templates.find(t => t.setting_key === key)?.label || key;

  return (
    <div style={{ background:'var(--card-bg)', borderRadius:16, border:'1px solid var(--card-border)', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ height:3, background:'linear-gradient(90deg,#f59e0b,#f97316)' }} />
      <div style={{ padding:'14px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <Bell size={14} style={{ color:'#f59e0b' }} />
          <h2 style={{ fontSize:13, fontWeight:700, color:'var(--text-900)', margin:0 }}>Care Setting Change Requests</h2>
          {pending.length > 0 && (
            <span style={{ marginLeft:'auto', background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99, border:'1px solid #fde68a' }}>
              {pending.length} pending
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}>
            <Loader2 size={20} className="animate-spin" style={{ color:'var(--text-400)' }} />
          </div>
        ) : pending.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'24px 0', color:'var(--text-400)' }}>
            <CheckCircle size={16} style={{ opacity:0.4 }} />
            <p style={{ fontSize:13 }}>No pending change requests</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pending.map(u => (
              <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, border:'1px solid #fde68a', background:'#fffbeb' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#fde68a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#92400e', flexShrink:0 }}>
                  {(u.full_name||'U')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:13, color:'var(--text-800)', margin:0 }}>{u.full_name}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                    <span style={{ fontSize:11, color:'var(--text-400)' }}>Requesting:</span>
                    <span style={{ fontSize:11, fontWeight:600, color:'#92400e', background:'var(--card-bg)', border:'1px solid #fde68a', padding:'1px 8px', borderRadius:6 }}>
                      {settingLabel(u.care_setting_change_request)}
                    </span>
                  </div>
                  {u.care_setting_change_reason && <p style={{ fontSize:11, color:'var(--text-500)', fontStyle:'italic', margin:'2px 0 0' }}>"{u.care_setting_change_reason}"</p>}
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => approveMutation.mutate({ userId:u.id, settingKey:u.care_setting_change_request })}
                    disabled={approveMutation.isPending || dismissMutation.isPending}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, color:'#fff', background:'#16a34a', border:'none', cursor:'pointer', opacity: approveMutation.isPending||dismissMutation.isPending ? 0.5 : 1 }}>
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => dismissMutation.mutate(u.id)}
                    disabled={approveMutation.isPending || dismissMutation.isPending}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, color:'var(--text-700)', background:'var(--page-bg)', border:'1px solid var(--card-border)', cursor:'pointer', opacity: approveMutation.isPending||dismissMutation.isPending ? 0.5 : 1 }}>
                    <XCircle size={12} /> Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
