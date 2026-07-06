/**
 * CareSettings.jsx - Palliative Care Delivery Models
 * ====================================================
 * Displays and manages the 5 palliative care settings:
 *   1. Hospital-Based Palliative Care
 *   2. Hospice Care
 *   3. Home-Based Palliative Care
 *   4. Outpatient (Clinic) Palliative Care
 *   5. Long-Term / Residential Palliative Care
 *
 * Role-specific views:
 *   admin/clinician  → Dashboard + per-patient assignment + interaction matrix
 *   patient          → My current setting + what to expect
 *   family           → Loved one's setting + how to interact
 *   caregiver        → Settings of assigned patients + their role interactions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Heart, Home, Stethoscope, BedDouble,
  Users, ChevronRight, ChevronDown, Info, CheckCircle2,
  Clock, UserCheck, ArrowRight, BookOpen,
  ClipboardList, BarChart3, AlertCircle, Plus, Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { careSettingsAPI, patientsAPI } from '../api/client';
import { ProStatCard } from '../components/ModernCard';
import Modal, { ModalFooter } from '../components/Modal';
import PageHeader from '../components/PageHeader';

// -- Care setting background images -------------------------------------------
const SETTING_IMAGES = {
  hospital_based:        '/resources/cards/care-hospital.jpg',
  hospice:               '/resources/cards/care-hospice.jpg',
  home_based:            '/resources/cards/care-home.jpg',
  outpatient_clinic:     '/resources/cards/care-outpatient.jpg',
  long_term_residential: '/resources/cards/care-residential.jpg',
};

// -- Icon map (string key → Lucide component) --------------------------------
const ICON_MAP = {
  Building2, Heart, Home, Stethoscope, BedDouble,
};

// -- Color config -------------------------------------------------------------
const COLOR = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',   header: 'from-blue-600 to-blue-700',   fallback: '#1d4ed8' },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700',   dot: 'bg-rose-500',   header: 'from-rose-600 to-rose-700',   fallback: '#e11d48' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500',  header: 'from-green-600 to-green-700',  fallback: '#059669' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-500',   header: 'from-teal-600 to-teal-700',   fallback: '#0d9488' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', header: 'from-purple-600 to-purple-700', fallback: '#7c3aed' },
  gray:   { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400',  header: 'from-slate-600 to-slate-700',  fallback: '#475569' },
};

const ROLE_COLORS = {
  admin:     'bg-purple-100 text-purple-700',
  clinician: 'bg-blue-100 text-blue-700',
  nurse:     'bg-teal-100 text-teal-700',
  caregiver: 'bg-green-100 text-green-700',
  patient:   'bg-orange-100 text-orange-700',
  family:    'bg-pink-100 text-pink-700',
};

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-amber-100 text-amber-700 border-amber-200',
  low:      'bg-slate-100 text-slate-600 border-slate-200',
};

const ROLE_LABELS = {
  admin: 'Admin', clinician: 'Clinician', nurse: 'Nurse',
  caregiver: 'Caregiver', patient: 'Patient', family: 'Family',
};

// -- Main Component ------------------------------------------------------------
export default function CareSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');      // overview | matrix | assign | my-setting
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignPatientId, setAssignPatientId] = useState('');
  const [assignForm, setAssignForm] = useState({
    setting_key: '', facility_name: '', visit_frequency: '',
    primary_contact: '', transition_reason: '', notes: '',
  });
  const [filterRole, setFilterRole] = useState('all');

  // Request change state (patient/family)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestedSetting, setRequestedSetting] = useState('');
  const [requestReason, setRequestReason] = useState('');

  const requestChangeMutation = useMutation({
    mutationFn: ({ setting, reason }) => careSettingsAPI.requestChange({ care_setting: setting, reason }),
    onSuccess: () => {
      toast.success('Change request submitted - an admin will review it shortly');
      setShowRequestModal(false);
      setRequestedSetting('');
      setRequestReason('');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Request failed'),
  });

  const isStaff = ['admin', 'clinician'].includes(user?.role);
  const isPatient = user?.role === 'patient';
  const isFamily = user?.role === 'family';

  // -- Queries -----------------------------------------------------------------
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

  // -- Assign mutation ----------------------------------------------------------
  const assignMutation = useMutation({
    mutationFn: ({ patientId, data }) => careSettingsAPI.assignPatient(patientId, data),
    onSuccess: () => {
      toast.success('Patient assigned to care setting');
      qc.invalidateQueries(['care-settings-dashboard']);
      setShowAssignModal(false);
      setAssignPatientId('');
      setAssignForm({ setting_key: '', facility_name: '', visit_frequency: '', primary_contact: '', transition_reason: '', notes: '' });
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Assignment failed'),
  });

  const templates = templatesData?.templates || [];
  const distribution = dashboardData?.distribution || [];

  // -- Tabs config --------------------------------------------------------------
  const tabs = isStaff
    ? [
        { id: 'overview',   label: 'Overview',        icon: BarChart3 },
        { id: 'settings',   label: 'Care Settings',   icon: BookOpen },
        { id: 'matrix',     label: 'User Interactions', icon: Users },
        { id: 'assign',     label: 'Assign Patient',  icon: UserCheck },
      ]
    : isPatient || isFamily
    ? [
        { id: 'my-setting', label: 'My Care Setting', icon: Heart },
        { id: 'settings',   label: 'All Settings',    icon: BookOpen },
      ]
    : [
        { id: 'settings',   label: 'Care Settings',   icon: BookOpen },
        { id: 'matrix',     label: 'My Interactions', icon: ClipboardList },
      ];

  // Default tab
  if (!tabs.find(t => t.id === activeTab)) setActiveTab(tabs[0].id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <Toaster position="top-right" />

      {/* -- Page Header -------------------------------------------------------- */}
      <PageHeader
        image="/resources/cards/care-settings-header.jpg"
        title="Palliative Care Settings"
        subtitle="5 evidence-based care delivery models - hospital, hospice, home, clinic & residential"
        icon={Stethoscope}
      >
        {isStaff && (
          <button
            onClick={() => { setShowAssignModal(true); setActiveTab('assign'); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all"
          >
            <Plus size={16} /> Assign Patient
          </button>
        )}
      </PageHeader>

      {/* -- Tab Bar ------------------------------------------------------------ */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-teal-700 shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------------
          TAB: OVERVIEW (admin/clinician)
      ---------------------------------------------------------------------- */}
      {activeTab === 'overview' && isStaff && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ProStatCard label="Total Patients"      value={dashboardData?.total_patients ?? '-'} icon={Users}        iconColor="#0d9488" accent="#0d9488" index={0} />
            <ProStatCard label="Assigned to Setting" value={dashboardData?.total_assigned ?? '-'} icon={CheckCircle2} iconColor="#059669" accent="#059669" index={1} />
            <ProStatCard label="Unassigned"          value={dashboardData?.unassigned ?? '-'}     icon={AlertCircle}  iconColor="#f59e0b" accent="#f59e0b" index={2} />
            <ProStatCard label="Care Settings"       value={5}                                     icon={Stethoscope}  iconColor="#7c3aed" accent="#7c3aed" index={3} />
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-teal-600" />
              Patient Distribution Across Settings
            </h2>
            <div className="space-y-3">
              {distribution.map(item => {
                const c = COLOR[item.color] || COLOR.gray;
                const Icon = ICON_MAP[item.icon] || Stethoscope;
                const pct = dashboardData?.total_patients
                  ? Math.round((item.patient_count / dashboardData.total_patients) * 100)
                  : 0;
                return (
                  <div key={item.setting_key} className={`p-4 rounded-xl border-2 ${c.bg} ${c.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Icon size={18} className={c.text} />
                        <span className={`font-bold text-sm ${c.text}`}>{item.label}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${c.badge}`}>
                        {item.patient_count} patients
                      </span>
                    </div>
                    <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className={`h-full rounded-full ${c.dot}`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">{item.focus}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          TAB: CARE SETTINGS (all roles)
      ---------------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {loadingTemplates ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {templates.map((t, i) => (
                <SettingCard
                  key={t.setting_key}
                  template={t}
                  index={i}
                  isSelected={selectedTemplate === t.setting_key}
                  onSelect={() => setSelectedTemplate(
                    selectedTemplate === t.setting_key ? null : t.setting_key
                  )}
                />
              ))}
            </div>
          )}

          {/* Detail Modal - opens on card click */}
          <Modal
            isOpen={!!(selectedTemplate && detailData)}
            onClose={() => setSelectedTemplate(null)}
            title={detailData?.label || 'Care Setting Details'}
            size="xl"
            footerContent={
              <ModalFooter>
                {/* Reminder button for appointment/medication-relevant settings */}
                {detailData && ['hospital_based','outpatient_clinic'].includes(detailData.setting_key) && (
                  <button
                    type="button"
                    onClick={() => { setSelectedTemplate(null); toast.success('Reminder set for next appointment check-in'); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl border-2 border-amber-500 transition"
                  >
                    <Clock size={15} /> Set Appointment Reminder
                  </button>
                )}
                {detailData && ['home_based','hospice','long_term_residential'].includes(detailData.setting_key) && (
                  <button
                    type="button"
                    onClick={() => { setSelectedTemplate(null); toast.success('Medication reminder set for today'); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl border-2 border-teal-600 transition"
                  >
                    <Clock size={15} /> Set Medication Reminder
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </ModalFooter>
            }
          >
            {detailData && (
              <SettingDetailPanel
                detail={detailData}
                userRole={user?.role}
                onClose={() => setSelectedTemplate(null)}
              />
            )}
          </Modal>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          TAB: INTERACTION MATRIX
      ---------------------------------------------------------------------- */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-teal-600" />
                How Every User Interacts with Each Care Setting
              </h2>
              {/* Role filter */}
              <div className="flex flex-wrap gap-1.5">
                {['all', 'clinician', 'nurse', 'caregiver', 'patient', 'family', 'admin'].map(r => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                      filterRole === r
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'border-slate-300 text-slate-600 hover:border-teal-400 hover:text-teal-700'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {templates.map(t => {
              const c = COLOR[t.color] || COLOR.gray;
              const Icon = ICON_MAP[t.icon] || Stethoscope;
              const settingMatrix = matrixData?.matrix?.[t.setting_key] || {};
              const roles = filterRole === 'all'
                ? Object.keys(settingMatrix)
                : Object.keys(settingMatrix).filter(r => r === filterRole);

              if (roles.length === 0 && filterRole !== 'all') return null;

              return (
                <div key={t.setting_key} className={`mb-5 rounded-xl border-2 ${c.border} overflow-hidden`}>
                  {/* Setting header */}
                  <div className={`flex items-center gap-3 px-5 py-3 bg-gradient-to-r ${c.header}`}>
                    <Icon size={20} className="text-white" />
                    <h3 className="font-bold text-white">{t.label}</h3>
                  </div>

                  {/* Role rows */}
                  <div className={`divide-y divide-slate-100 ${c.bg}`}>
                    {roles.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-slate-500">No interactions data for this filter.</p>
                    ) : roles.map(role => (
                      <div key={role} className="px-5 py-4">
                        <button
                          onClick={() => setExpandedRole(expandedRole === `${t.setting_key}_${role}` ? null : `${t.setting_key}_${role}`)}
                          className="flex items-center justify-between w-full"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'}`}>
                              {ROLE_LABELS[role] || role}
                            </span>
                            <span className="text-sm text-slate-600">
                              {settingMatrix[role]?.length || 0} interaction{settingMatrix[role]?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {expandedRole === `${t.setting_key}_${role}`
                            ? <ChevronDown size={16} className="text-slate-400" />
                            : <ChevronRight size={16} className="text-slate-400" />}
                        </button>

                        <AnimatePresence>
                          {expandedRole === `${t.setting_key}_${role}` && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-2.5">
                                {settingMatrix[role]?.map((ix, idx) => (
                                  <InteractionRow key={idx} ix={ix} />
                                ))}
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
      )}

      {/* ----------------------------------------------------------------------
          TAB: MY CARE SETTING (patient / family)
      ---------------------------------------------------------------------- */}
      {activeTab === 'my-setting' && (isPatient || isFamily) && (
        <div className="space-y-5">
          {mySettingData?.current_setting ? (
            <>
              <CurrentSettingBanner setting={mySettingData.current_setting} />

              {/* Request change button */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-900">Need a different care setting?</p>
                  <p className="text-xs text-amber-700 mt-0.5">If your care needs have changed, you can request a change. An admin will review and approve it.</p>
                </div>
                <button onClick={() => setShowRequestModal(true)}
                  className="flex-shrink-0 ml-4 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition">
                  Request Change
                </button>
              </div>

              {mySettingData.history?.length > 1 && (
                <SettingHistory history={mySettingData.history} />
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-10 border-2 border-slate-200 text-center">
              <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Care Setting Assigned Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
                Your clinical team will assign you to the most appropriate care setting based on your needs.
                You can browse all 5 settings below or contact your care team.
              </p>
              <button onClick={() => setActiveTab('settings')}
                className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition text-sm">
                Browse All Settings →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Request Change Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Care Setting Change"
        size="md"
        closeOnBackdrop={false}
        footerContent={
          <ModalFooter>
            <button type="button" onClick={() => setShowRequestModal(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="button"
              disabled={!requestedSetting || requestChangeMutation.isPending}
              onClick={() => requestChangeMutation.mutate({ setting: requestedSetting, reason: requestReason })}
              className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl border-2 border-amber-600 transition disabled:opacity-50">
              {requestChangeMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Select the care setting that best describes your current situation. An admin will review your request and update your setting.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Requested Care Setting *</label>
            <div className="space-y-2">
              {[
                { key: 'hospital_based',       Icon: Building2,   label: 'Hospital-Based Palliative Care' },
                { key: 'hospice',              Icon: Heart,       label: 'Hospice Care' },
                { key: 'home_based',           Icon: Home,        label: 'Home-Based Care' },
                { key: 'outpatient_clinic',    Icon: Stethoscope, label: 'Outpatient Clinic' },
                { key: 'long_term_residential',Icon: BedDouble,   label: 'Long-Term Residential' },
              ].map(s => (
                <button key={s.key} type="button" onClick={() => setRequestedSetting(s.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${requestedSetting === s.key ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300'}`}>
                  <s.Icon size={18} className="flex-shrink-0 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800">{s.label}</span>
                  {requestedSetting === s.key && <CheckCircle2 size={16} className="text-amber-600 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Change (optional)</label>
            <textarea value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={3}
              placeholder="e.g., My condition has changed and I am now receiving care at home..."
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-sm resize-none" />
          </div>
        </div>
      </Modal>

      {/* ----------------------------------------------------------------------
          TAB: ASSIGN PATIENT (admin/clinician)
      ---------------------------------------------------------------------- */}
      {activeTab === 'assign' && isStaff && (
        <AssignPatientPanel
          patients={patientsData || []}
          templates={templates}
          assignForm={assignForm}
          setAssignForm={setAssignForm}
          assignPatientId={assignPatientId}
          setAssignPatientId={setAssignPatientId}
          onSubmit={() => {
            if (!assignPatientId || !assignForm.setting_key) {
              toast.error('Select a patient and a care setting');
              return;
            }
            assignMutation.mutate({ patientId: assignPatientId, data: assignForm });
          }}
          isPending={assignMutation.isPending}
        />
      )}

      {/* -- Assign Modal (triggered from header button) ---------------------- */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Patient to Care Setting"
        size="lg"
        footerContent={
          <ModalFooter>
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!assignPatientId || !assignForm.setting_key) {
                  toast.error('Select a patient and a care setting');
                  return;
                }
                assignMutation.mutate({ patientId: assignPatientId, data: assignForm });
              }}
              disabled={assignMutation.isPending}
              className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl border-2 border-teal-600 transition disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Patient'}
            </button>
          </ModalFooter>
        }
      >
        <AssignFormFields
          patients={patientsData || []}
          templates={templates}
          assignForm={assignForm}
          setAssignForm={setAssignForm}
          assignPatientId={assignPatientId}
          setAssignPatientId={setAssignPatientId}
        />
      </Modal>
    </motion.div>
  );
}

// -- Sub-components ------------------------------------------------------------

function SettingCard({ template: t, index, isSelected, onSelect }) {
  const c = COLOR[t.color] || COLOR.gray;
  const Icon = ICON_MAP[t.icon] || Stethoscope;
  const img = SETTING_IMAGES[t.setting_key];

  const bgStyle = img ? {} : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onSelect}
      style={{ '--img-card-color': c.fallback || '#0f766e' }}
      className={`cursor-pointer rounded-2xl border-2 overflow-hidden relative transition-all hover:shadow-xl min-h-[180px] ${
        isSelected ? `ring-2 ring-offset-2 ring-teal-400 shadow-xl border-teal-400` : `${c.border} hover:shadow-lg`
      }`}
    >
      {/* Fallback bg  --  transparent in dark so img shows */}
      <div
        className="img-card-bg absolute inset-0"
        style={{ backgroundColor: c.fallback || '#0f766e', zIndex: 0 }}
      />
      {/* Real <img>  --  always shows regardless of dark mode CSS */}
      {img && (
        <img
          src={img}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 1 }}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      {/* Dark overlay above photo */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(0,0,0,0.68), rgba(0,0,0,0.42), rgba(0,0,0,0.22))',
          zIndex: 2, pointerEvents: 'none',
        }}
      />
      {/* Teal border inset */}
      <div className="absolute inset-0 rounded-2xl border-2 border-teal-400/50 pointer-events-none" style={{ zIndex: 3 }} />

      {/* Content */}
      <div className="relative p-5 h-full flex flex-col justify-between" style={{ zIndex: 4 }}>
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.header} flex items-center justify-center shadow-md border-2 border-white/20`}>
              <Icon size={20} className="text-white" />
            </div>
            <ChevronRight size={18} className={`text-white/80 mt-1 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
          </div>

          <h3 className="font-bold text-base leading-tight mb-1.5"
            style={{ color: '#fef08a !important', textShadow: '0 2px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.9)', WebkitTextFillColor: '#fef08a' }}>
            {t.label}
          </h3>
          <p className="text-xs text-white/85 leading-relaxed line-clamp-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            {t.focus}
          </p>
        </div>

        {t.patient_count !== undefined && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/25">
              <Users size={11} /> {t.patient_count} patients
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SettingDetailPanel({ detail: t, userRole }) {
  const c = COLOR[t.color] || COLOR.gray;
  const Icon = ICON_MAP[t.icon] || Stethoscope;
  const [activeSection, setActiveSection] = useState('overview');

  const roleInteractions = t.interactions_by_role?.[userRole] || [];

  return (
    <div>
      {/* Coloured header strip inside modal */}
      <div className={`bg-gradient-to-r ${c.header} px-6 py-5 flex items-center gap-4`}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Icon size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold text-white">{t.label}</h2>
          <p className="text-white/80 text-sm mt-0.5">{t.focus}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 px-5 pt-4 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'overview',      label: 'Overview',       icon: Info },
          { id: 'interventions', label: 'Interventions',  icon: ClipboardList },
          { id: 'team',          label: 'Care Team',      icon: Users },
          { id: 'my-role',       label: 'My Role',        icon: UserCheck },
        ].map(sec => {
          const SecIcon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 px-3 pb-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                activeSection === sec.id
                  ? `border-${t.color}-500 ${c.text}`
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <SecIcon size={14} />
              {sec.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {/* Overview */}
        {activeSection === 'overview' && (
          <div className="space-y-5">
            <p className="text-slate-700 leading-relaxed">{t.description}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <InfoBlock title="Who It Serves" icon={Users} color={c}>
                <ul className="space-y-1.5">
                  {t.who_it_serves?.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 size={14} className={`${c.text} mt-0.5 flex-shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </InfoBlock>

              <InfoBlock title="Expected Duration" icon={Clock} color={c}>
                <p className="text-sm text-slate-700">{t.typical_duration}</p>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Outcome Focus</p>
                  <p className="text-sm text-slate-700">{t.outcome_focus}</p>
                </div>
              </InfoBlock>
            </div>
          </div>
        )}

        {/* Interventions */}
        {activeSection === 'interventions' && (
          <div className="space-y-3">
            {t.key_interventions?.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border ${c.bg} ${c.border}`}>
                <div className={`w-7 h-7 rounded-full ${c.dot} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        )}

        {/* Care Team */}
        {activeSection === 'team' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {t.care_team_roles?.map(role => (
              <div key={role} className={`p-4 rounded-xl border-2 ${c.bg} ${c.border} text-center`}>
                <UserCheck size={22} className={`${c.text} mx-auto mb-2`} />
                <p className={`font-bold text-sm ${c.text}`}>{role}</p>
              </div>
            ))}
          </div>
        )}

        {/* My Role */}
        {activeSection === 'my-role' && (
          <div className="space-y-3">
            {roleInteractions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No specific interactions defined for your role in this setting.
              </p>
            ) : roleInteractions.map((ix, i) => (
              <InteractionRow key={i} ix={ix} expanded />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ title, icon: Icon, color, children }) {
  const c = color || COLOR.teal;
  return (
    <div className={`p-4 rounded-xl border-2 ${c.bg} ${c.border}`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${c.text} mb-3 flex items-center gap-1.5`}>
        <Icon size={14} />
        {title}
      </p>
      {children}
    </div>
  );
}

function InteractionRow({ ix }) {
  const pCls = PRIORITY_COLORS[ix.priority] || PRIORITY_COLORS.medium;
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-semibold text-sm text-slate-900">{ix.interaction_type}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pCls}`}>
            {ix.priority}
          </span>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
            {ix.frequency}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{ix.description}</p>
      {ix.system_features_used?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {ix.system_features_used.map(f => (
            <span key={f} className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[10px] font-bold">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CurrentSettingBanner({ setting }) {
  const c = COLOR[setting.setting_color] || COLOR.gray;
  const Icon = ICON_MAP[setting.setting_icon] || Stethoscope;
  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.header} flex items-center justify-center shadow-md`}>
          <Icon size={28} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Your Current Care Setting</p>
          <h2 className={`text-xl font-serif font-bold ${c.text}`}>{setting.setting_label}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {setting.facility_name && (
          <Detail label="Facility" value={setting.facility_name} />
        )}
        {setting.visit_frequency && (
          <Detail label="Visit Frequency" value={setting.visit_frequency} />
        )}
        {setting.primary_contact && (
          <Detail label="Contact" value={setting.primary_contact} />
        )}
        {setting.assigned_at && (
          <Detail label="Assigned" value={new Date(setting.assigned_at).toLocaleDateString()} />
        )}
      </div>

      {setting.notes && (
        <p className="mt-4 text-sm text-slate-600 bg-white/70 rounded-xl p-3 border border-white/50">
          {setting.notes}
        </p>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-white/70 rounded-xl p-3 border border-white/50">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-slate-900 text-sm mt-0.5">{value}</p>
    </div>
  );
}

function SettingHistory({ history }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-5">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Clock size={18} className="text-teal-600" />
        Care Setting History
      </h3>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-4">
          {history.map((item) => {
            const c = COLOR[item.setting_color] || COLOR.gray;
            return (
              <div key={item.id} className="flex items-start gap-4 relative">
                <div className={`w-10 h-10 rounded-full border-2 ${item.is_current ? `${c.dot} border-white shadow-md` : 'bg-slate-200 border-white'} flex items-center justify-center z-10 flex-shrink-0`}>
                  {item.is_current ? (
                    <CheckCircle2 size={16} className="text-white" />
                  ) : (
                    <div className="w-3 h-3 bg-slate-400 rounded-full" />
                  )}
                </div>
                <div className={`flex-1 p-3.5 rounded-xl border-2 ${item.is_current ? `${c.bg} ${c.border}` : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-bold text-sm ${item.is_current ? c.text : 'text-slate-600'}`}>
                      {item.setting_label}
                    </p>
                    {item.is_current && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${c.badge}`}>Current</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(item.assigned_at).toLocaleDateString()}
                    {item.ended_at && ` → ${new Date(item.ended_at).toLocaleDateString()}`}
                  </p>
                  {item.transition_reason && (
                    <p className="text-xs text-slate-600 mt-1 italic">"{item.transition_reason}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AssignPatientPanel({ patients, templates, assignForm, setAssignForm, assignPatientId, setAssignPatientId, onSubmit, isPending }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
        <UserCheck size={20} className="text-teal-600" />
        Assign Patient to Care Setting
      </h2>
      <AssignFormFields
        patients={patients}
        templates={templates}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        assignPatientId={assignPatientId}
        setAssignPatientId={setAssignPatientId}
      />
      <div className="flex justify-end mt-5">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending || !assignPatientId || !assignForm.setting_key}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl border-2 border-teal-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowRight size={16} />
          {isPending ? 'Assigning...' : 'Assign to Setting'}
        </button>
      </div>
    </div>
  );
}

function AssignFormFields({ patients, templates, assignForm, setAssignForm, assignPatientId, setAssignPatientId }) {
  const f = assignForm;
  const set = (k, v) => setAssignForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Patient *</label>
          <div className="search-wrap">
            <span className="search-icon"><Search size={15} /></span>
            <input
              type="text"
              placeholder="Search patient name..."
              className="w-full py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
              onChange={e => {
                const q = e.target.value.toLowerCase();
                const match = patients.find(p => p.full_name.toLowerCase().includes(q) || p.primary_diagnosis?.toLowerCase().includes(q));
                if (match) setAssignPatientId(String(match.id));
                if (!q) setAssignPatientId('');
              }}
              list="care-settings-patient-list"
            />
            <datalist id="care-settings-patient-list">
              {patients.map(p => <option key={p.id} value={`${p.full_name} - ${p.primary_diagnosis}`} />)}
            </datalist>
          </div>
          {assignPatientId && patients.length > 0 && (
            <p className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1">
              ✓ {patients.find(p => String(p.id) === String(assignPatientId))?.full_name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Care Setting *</label>
          <select
            value={f.setting_key}
            onChange={e => set('setting_key', e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
          >
            <option value="">Select setting...</option>
            {templates.map(t => (
              <option key={t.setting_key} value={t.setting_key}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Facility Name</label>
          <input
            type="text"
            value={f.facility_name}
            onChange={e => set('facility_name', e.target.value)}
            placeholder="e.g., Korle Bu Teaching Hospital"
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Visit Frequency</label>
          <input
            type="text"
            value={f.visit_frequency}
            onChange={e => set('visit_frequency', e.target.value)}
            placeholder="e.g., Twice weekly"
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary Care Contact</label>
        <input
          type="text"
          value={f.primary_contact}
          onChange={e => set('primary_contact', e.target.value)}
          placeholder="e.g., Nurse Adwoa - 0244 123 456"
          className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Transition</label>
        <input
          type="text"
          value={f.transition_reason}
          onChange={e => set('transition_reason', e.target.value)}
          placeholder="e.g., Symptoms stabilised - moving to home-based care"
          className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Clinical Notes</label>
        <textarea
          value={f.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          placeholder="Any additional context or care instructions..."
          className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition resize-none"
        />
      </div>
    </div>
  );
}
