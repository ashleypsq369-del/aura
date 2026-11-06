/**
 * LegacySetup - Digital Legacy consent and permissions
 * Redesigned: clean card sections, no hardcoded purple, proper toggle rows
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, FileText, Users, AlertCircle,
  UserPlus, Heart, BookOpen, Image, MessageSquare, Stethoscope,
  Lock, ChevronRight, Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import useConfirmDialog from '../hooks/useConfirmDialog';

function ToggleRow({ icon: Icon, iconColor, label, description, checked, onChange }) {
  return (
    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
      checked ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' : 'border-[var(--card-border)] bg-[var(--page-bg)] hover:border-[var(--text-400)]'
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
        checked ? 'bg-teal-100 border-teal-300' : 'bg-[var(--card-bg)] border-[var(--card-border)]'
      }`}>
        <Icon size={16} style={{ color: checked ? '#0d9488' : iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--text-900)]">{label}</p>
        <p className="text-xs text-[var(--text-400)] mt-0.5">{description}</p>
      </div>
      <div className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${
        checked ? 'bg-teal-500' : 'bg-[var(--card-border)]'
      }`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
          checked ? 'left-6' : 'left-1'
        }`} />
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

export default function LegacySetup() {
  const { user } = useAuth();
  const { confirm: confirmAction, ConfirmDialog } = useConfirmDialog();
  const [patientId, setPatientId] = useState(null);
  const queryClient = useQueryClient();

  const [consentGiven, setConsentGiven]     = useState(false);
  const [shareMemories, setShareMemories]   = useState(true);
  const [shareJournal, setShareJournal]     = useState(false);
  const [shareMessages, setShareMessages]   = useState(false);
  const [sharePhotos, setSharePhotos]       = useState(true);
  const [shareMedical, setShareMedical]     = useState(false);
  const [witnessId, setWitnessId]           = useState(null);

  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => (await apiClient.get('/api/bereavement/my-patient')).data,
  });

  useEffect(() => {
    if (patientData?.patient_id) setPatientId(patientData.patient_id);
    else if (patientData?.patient?.id) setPatientId(patientData.patient.id);
  }, [patientData]);

  const { data: consentData, isLoading } = useQuery({
    queryKey: ['legacy-consent', patientId],
    queryFn: async () => (await apiClient.get(`/api/legacy/consent/${patientId}`)).data,
    enabled: !!patientId,
  });

  useEffect(() => {
    if (consentData?.consent_given) {
      setConsentGiven(true);
      const p = consentData.permissions || {};
      setShareMemories(p.share_memories ?? true);
      setShareJournal(p.share_journal ?? false);
      setShareMessages(p.share_messages ?? false);
      setSharePhotos(p.share_photos ?? true);
      setShareMedical(p.share_medical_records ?? false);
    }
  }, [consentData]);

  const { data: cliniciansData } = useQuery({
    queryKey: ['clinicians'],
    queryFn: async () => (await apiClient.get('/api/auth/users?role=clinician')).data,
  });

  const saveConsentMutation = useMutation({
    mutationFn: async (data) => (await apiClient.post('/api/legacy/consent', data)).data,
    onSuccess: () => { queryClient.invalidateQueries(['legacy-consent', patientId]); toast.success('Legacy plan saved'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to save'),
  });

  const revokeConsentMutation = useMutation({
    mutationFn: async () => (await apiClient.put(`/api/legacy/consent/${patientId}/revoke`, { reason: 'Patient revoked consent' })).data,
    onSuccess: () => { queryClient.invalidateQueries(['legacy-consent', patientId]); setConsentGiven(false); toast.success('Consent revoked'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to revoke'),
  });

  const handleSaveConsent = () => {
    if (!patientId) { toast.error('No patient linked'); return; }
    if (consentGiven && !witnessId) { toast.error('Please select a clinician witness'); return; }
    saveConsentMutation.mutate({
      patient_id: patientId,
      consent_given: consentGiven,
      share_medical_records: shareMedical,
      share_memories: shareMemories,
      share_journal: shareJournal,
      share_messages: shareMessages,
      share_photos: sharePhotos,
      witnessed_by_user_id: witnessId,
    });
  };

  const handleRevoke = async () => {
    if (await confirmAction({ title: 'Revoke digital legacy consent?', body: 'Heirs will lose access to your content. You can re-enable this at any time.', confirmLabel: 'Revoke', variant: 'danger' })) {
      revokeConsentMutation.mutate();
    }
  };

  if (!patientId && !patientLoading && !isLoading) {
    if (user?.role === 'admin' || user?.role === 'clinician') return <AdminLegacyPicker onPatientSelected={setPatientId} />;
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-8 max-w-sm text-center">
          <Shield size={40} className="mx-auto mb-4 text-[var(--text-300)]" />
          <p className="text-sm font-bold text-[var(--text-800)] mb-2">No Patient Linked</p>
          <p className="text-xs text-[var(--text-500)]">Contact your care team to link your account to a patient record.</p>
        </div>
      </div>
    );
  }

  const clinicians = cliniciansData?.users || [];
  const hasConsent = consentData?.consent_given;

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-elder-care.jpg"
        title="Digital Legacy Setup"
        subtitle="Plan who can access your memories, messages, and stories after you're gone"
        icon={Shield}
      />

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Active badge */}
        {hasConsent && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Legacy Plan Active</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Consented {new Date(consentData.consent_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
                {consentData.witnessed_by && ` · Witnessed by ${consentData.witnessed_by.name}`}
              </p>
            </div>
          </div>
        )}

        {/* What is this */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">What is a Digital Legacy?</p>
          </div>
          <div className="p-4">
            <p className="text-sm text-[var(--text-700)] leading-relaxed mb-3">
              A digital legacy lets you choose who can access your memories, messages, and stories after you pass away - like a digital will for your life.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: Users, text: 'Designate family, friends or anyone you trust as heirs' },
                { icon: Lock, text: 'Control exactly what each person can see' },
                { icon: MessageSquare, text: 'Leave final messages that are only delivered after you pass' },
                { icon: Shield, text: 'Witnessed by your healthcare provider for legal compliance' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={12} className="text-teal-600" />
                  </div>
                  <p className="text-xs text-[var(--text-600)] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Consent + permissions */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">Consent & Permissions</p>
          </div>
          <div className="p-4 space-y-4">

            {/* Main consent toggle */}
            <ToggleRow
              icon={Shield}
              iconColor="#94a3b8"
              label="I consent to creating a digital legacy plan"
              description="People I designate as heirs will access chosen content after I pass. I can revoke this any time."
              checked={consentGiven}
              onChange={e => setConsentGiven(e.target.checked)}
            />

            {/* Sharing permissions */}
            <AnimatePresence>
              {consentGiven && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider mb-3">What can heirs access?</p>
                    <ToggleRow icon={Heart}        iconColor="#f43f5e" label="Memory Vault"     description="Stories, memories and cherished moments you've saved"  checked={shareMemories}  onChange={e => setShareMemories(e.target.checked)} />
                    <ToggleRow icon={Image}        iconColor="#0891b2" label="Photos & Media"   description="Photo collections and media files"                     checked={sharePhotos}    onChange={e => setSharePhotos(e.target.checked)} />
                    <ToggleRow icon={MessageSquare}iconColor="#7c3aed" label="Messages"         description="Message history and communications"                    checked={shareMessages}  onChange={e => setShareMessages(e.target.checked)} />
                    <ToggleRow icon={BookOpen}     iconColor="#d97706" label="Grief Journal"    description="Your private journal entries"                          checked={shareJournal}   onChange={e => setShareJournal(e.target.checked)} />
                    <ToggleRow icon={Stethoscope}  iconColor="#dc2626" label="Medical Records"  description="Healthcare information (sensitive — off by default)"   checked={shareMedical}   onChange={e => setShareMedical(e.target.checked)} />

                    {/* Witness */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-[var(--text-600)] mb-2">
                        Clinician Witness <span className="text-red-500">*</span>
                        <span className="font-normal text-[var(--text-400)] ml-1">— required for legal compliance</span>
                      </label>
                      <select
                        value={witnessId || ''}
                        onChange={e => setWitnessId(parseInt(e.target.value))}
                        required
                        className="w-full px-3 py-2.5 text-sm border border-[var(--card-border)] rounded-xl bg-[var(--page-bg)] text-[var(--text-800)] focus:border-teal-500 focus:outline-none"
                      >
                        <option value="">Select a clinician to witness...</option>
                        {clinicians.map(c => <option key={c.id} value={c.id}>{c.full_name} - {c.role}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveConsent}
                disabled={saveConsentMutation.isPending || (consentGiven && !witnessId)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                {saveConsentMutation.isPending ? 'Saving...' : <><CheckCircle2 size={14} /> Save Legacy Plan</>}
              </button>
              {hasConsent && (
                <button
                  onClick={handleRevoke}
                  disabled={revokeConsentMutation.isPending}
                  className="px-4 py-3 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Next steps — only after consent */}
        {hasConsent && (
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--card-border)]">
              <p className="text-xs font-bold text-[var(--text-500)] uppercase tracking-wider">Next Steps</p>
            </div>
            <div className="divide-y divide-[var(--card-border)]">
              {[
                { to:'/heir-management',  icon:Users,     label:'Designate Heirs',   desc:'Choose who will receive your legacy' },
                { to:'/legacy-content',   icon:FileText,  label:'Create Messages',   desc:'Leave final letters and notes' },
                { to:'/memory-vault',     icon:Heart,     label:'Add Memories',      desc:'Preserve your life stories' },
              ].map(({ to, icon: Icon, label, desc }) => (
                <Link key={to} to={to} className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--page-bg)] transition group">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-800)] group-hover:text-teal-700 transition">{label}</p>
                    <p className="text-xs text-[var(--text-400)]">{desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-[var(--text-300)] group-hover:text-teal-500 transition flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[var(--text-400)] pb-2">
          This digital legacy plan follows HIPAA, GDPR, and local data protection laws. Your consent is legally witnessed and can be revoked at any time.
        </p>
      </div>
      <ConfirmDialog />
    </div>
  );
}

function AdminLegacyPicker({ onPatientSelected }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/patients').then(r => { setPatients(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.patient_code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 max-w-xl w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
            <UserPlus size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-900)]">Select Patient</p>
            <p className="text-xs text-[var(--text-400)]">Choose a patient to manage their digital legacy</p>
          </div>
        </div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-400)]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-[var(--card-border)] rounded-xl bg-[var(--page-bg)] text-[var(--text-800)] focus:border-teal-500 focus:outline-none" />
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {loading ? <p className="text-xs text-center text-[var(--text-400)] py-4">Loading...</p> :
          filtered.map(p => (
            <button key={p.id} onClick={() => onPatientSelected(p.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--page-bg)] border border-transparent hover:border-[var(--card-border)] transition text-left">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {p.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-800)] truncate">{p.full_name}</p>
                <p className="text-xs text-[var(--text-400)]">{p.patient_code} · {p.primary_diagnosis}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
