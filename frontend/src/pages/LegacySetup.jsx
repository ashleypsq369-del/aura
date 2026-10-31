/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, FileText, Users, AlertCircle, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import useConfirmDialog from '../hooks/useConfirmDialog';

export default function LegacySetup() {
  const { user } = useAuth();
  const { confirm: confirmAction, ConfirmDialog } = useConfirmDialog();
  const [patientId, setPatientId] = useState(null);
  const queryClient = useQueryClient();

  // Form state
  const [consentGiven, setConsentGiven] = useState(false);
  const [shareMemories, setShareMemories] = useState(true);
  const [shareJournal, setShareJournal] = useState(false);
  const [shareMessages, setShareMessages] = useState(false);
  const [sharePhotos, setSharePhotos] = useState(true);
  const [shareMedical, setShareMedical] = useState(false);
  const [witnessId, setWitnessId] = useState(null);

  // Fetch linked patient
  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => {
      const response = await apiClient.get('/api/bereavement/my-patient');
      return response.data;
    },
  });

  useEffect(() => {
    // Our endpoint returns flat: { patient_id, patient_name, ... }
    if (patientData?.patient_id) {
      setPatientId(patientData.patient_id);
    }
    // Also handle nested shape for backwards compat
    else if (patientData?.patient?.id) {
      setPatientId(patientData.patient.id);
    }
  }, [patientData]);

  // Fetch existing consent
  const { data: consentData, isLoading } = useQuery({
    queryKey: ['legacy-consent', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const response = await apiClient.get(`/api/legacy/consent/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
  });

  // Update form when consent data loads
  useEffect(() => {
    if (consentData && consentData.consent_given) {
      setConsentGiven(true);
      const perms = consentData.permissions || {};
      setShareMemories(perms.share_memories ?? true);
      setShareJournal(perms.share_journal ?? false);
      setShareMessages(perms.share_messages ?? false);
      setSharePhotos(perms.share_photos ?? true);
      setShareMedical(perms.share_medical_records ?? false);
    }
  }, [consentData]);

  // Fetch available clinicians for witness
  const { data: cliniciansData } = useQuery({
    queryKey: ['clinicians'],
    queryFn: async () => {
      const response = await apiClient.get('/api/auth/users?role=clinician');
      return response.data;
    },
  });

  // Save consent mutation
  const saveConsentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/api/legacy/consent', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legacy-consent', patientId]);
      toast.success('Legacy consent saved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to save consent');
    },
  });

  // Revoke consent mutation
  const revokeConsentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put(`/api/legacy/consent/${patientId}/revoke`, {
        reason: 'Patient revoked consent'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legacy-consent', patientId]);
      setConsentGiven(false);
      toast.success('Consent revoked successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to revoke consent');
    },
  });

  const handleSaveConsent = () => {
    if (!patientId) {
      toast.error('No patient linked');
      return;
    }

    if (consentGiven && !witnessId) {
      toast.error('Please select a witness (clinician)');
      return;
    }

    saveConsentMutation.mutate({
      patient_id: patientId,
      consent_given: consentGiven,
      share_medical_records: shareMedical,
      share_memories: shareMemories,
      share_journal: shareJournal,
      share_messages: shareMessages,
      share_photos: sharePhotos,
      witnessed_by_user_id: witnessId
    });
  };

  const handleRevoke = async () => {
    if (await confirmAction({ title: 'Are you sure you want to revoke your digital legacy consent? This will prevent heirs from accessing your content.', confirmLabel: "Confirm", variant: "danger" })) {
      revokeConsentMutation.mutate();
    }
  };

  // const patient = patientData?.patient;  // Removed unused variable

  if (!patientId && !patientLoading && !isLoading) {
    // Admin/clinician: show patient picker
    if (user?.role === 'admin' || user?.role === 'clinician') {
      return <AdminLegacyPicker onPatientSelected={setPatientId} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center" className="bg-purple-50">
        <div className="bg-[var(--card-bg)] rounded-lg p-8 max-w-sm text-center border border-slate-200">
          <Shield className="w-16 h-16 mx-auto mb-6" style={{ color: '#6B4F7A', opacity: 0.5 }} />
          <h2 className="text-base font-semibold mb-4" className="text-purple-700">No Patient Linked</h2>
          <p className="text-[var(--text-600)] mb-4">
            Your account is not linked to a patient record. Digital legacy setup is available to patients and their family members.
          </p>
          <p className="text-sm text-[var(--text-500)]">
            Please contact your care team to link your account to a patient record.
          </p>
        </div>
      </div>
    );
  }

  const clinicians = cliniciansData?.users || [];
  const hasConsent = consentData?.consent_given;

  return (
    <div className="min-h-screen" className="bg-purple-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto px-6 py-8 space-y-8"
      >
        {/* Header with image */}
        <PageHeader
          image="/resources/african/african-memory.jpg"
          title="Digital Legacy Setup"
          subtitle="Plan your digital legacy and control who can access your memories"
          icon={Shield}
        />

        {/* Status Banner */}
        {hasConsent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center space-x-3"
          >
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Legacy Plan Active</p>
              <p className="text-sm text-green-700">
                Consented on {new Date(consentData.consent_date).toLocaleDateString()}
                {consentData.witnessed_by && ` - Witnessed by ${consentData.witnessed_by.name}`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Information Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-teal-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">What is Digital Legacy?</h3>
              <p className="text-sm text-blue-800 mb-3">
                Your digital legacy allows you to designate people (heirs) who can access your memories, messages, and other content after you pass away. This is like a digital will for your life stories.
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Choose who can access your content (family, friends, anyone you trust)</li>
                <li>Control what they can see (memories, journal, messages, photos)</li>
                <li>Leave final messages and notes</li>
                <li>Legally witnessed by healthcare provider</li>
                <li>You can change or revoke this at any time</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Consent Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-8 shadow-lg space-y-6"
        >
          <h2 className="text-base font-semibold" className="text-purple-700">
            Consent & Permissions
          </h2>

          {/* Main Consent Toggle */}
          <div className="bg-purple-50 rounded-xl p-6">
            <label className="flex items-start space-x-4 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-6 h-6 mt-1 rounded"
                style={{ accentColor: '#6B4F7A' }}
              />
              <div className="flex-1">
                <p className="font-medium text-[var(--text-900)] mb-2">
                  I consent to creating a digital legacy plan
                </p>
                <p className="text-sm text-[var(--text-600)]">
                  I understand that people I designate as heirs will be able to access the content I choose to share after I pass away. This consent is witnessed by a healthcare provider and follows legal protocols. I can revoke this at any time.
                </p>
              </div>
            </label>
          </div>

          {consentGiven && (
            <>
              {/* Sharing Permissions */}
              <div className="space-y-4">
                <h3 className="font-medium text-[var(--text-900)]">What can your heirs access?</h3>
                <p className="text-sm text-[var(--text-600)] -mt-2">
                  Choose what content your designated heirs can see after you're gone
                </p>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg cursor-pointer hover:bg-[var(--card-border)]/30">
                    <div>
                      <p className="font-medium text-[var(--text-900)]">Memory Vault</p>
                      <p className="text-sm text-[var(--text-600)]">Stories, photos, and memories you've preserved</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareMemories}
                      onChange={(e) => setShareMemories(e.target.checked)}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#6B4F7A' }}
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg cursor-pointer hover:bg-[var(--card-border)]/30">
                    <div>
                      <p className="font-medium text-[var(--text-900)]">Photos & Media</p>
                      <p className="text-sm text-[var(--text-600)]">Photo collections and media files</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={sharePhotos}
                      onChange={(e) => setSharePhotos(e.target.checked)}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#6B4F7A' }}
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg cursor-pointer hover:bg-[var(--card-border)]/30">
                    <div>
                      <p className="font-medium text-[var(--text-900)]">Messages</p>
                      <p className="text-sm text-[var(--text-600)]">Message history and communications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareMessages}
                      onChange={(e) => setShareMessages(e.target.checked)}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#6B4F7A' }}
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg cursor-pointer hover:bg-[var(--card-border)]/30">
                    <div>
                      <p className="font-medium text-[var(--text-900)]">Grief Journal</p>
                      <p className="text-sm text-[var(--text-600)]">Your private journal entries</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareJournal}
                      onChange={(e) => setShareJournal(e.target.checked)}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#6B4F7A' }}
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg cursor-pointer hover:bg-[var(--card-border)]/30">
                    <div>
                      <p className="font-medium text-[var(--text-900)]">Medical Records</p>
                      <p className="text-sm text-[var(--text-600)]">Healthcare information and records</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareMedical}
                      onChange={(e) => setShareMedical(e.target.checked)}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#6B4F7A' }}
                    />
                  </label>
                </div>
              </div>

              {/* Witness Selection */}
              <div className="space-y-4">
                <h3 className="font-medium text-[var(--text-900)]">Witness (Required)</h3>
                <p className="text-sm text-[var(--text-600)] -mt-2">
                  A healthcare provider must witness your consent for legal compliance
                </p>

                <select
                  value={witnessId || ''}
                  onChange={(e) => setWitnessId(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none"
                  style={{ borderColor: '#6B4F7A40' }}
                  required
                >
                  <option value="">Search a clinician to witness...</option>
                  {clinicians.map((clinician) => (
                    <option key={clinician.id} value={clinician.id}>
                      {clinician.full_name} - {clinician.role}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              onClick={handleSaveConsent}
              disabled={saveConsentMutation.isPending || (consentGiven && !witnessId)}
              className="flex-1 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50"
              className="bg-purple-700 text-white"
            >
              {saveConsentMutation.isPending ? 'Saving...' : 'Save Consent'}
            </button>

            {hasConsent && (
              <button
                onClick={handleRevoke}
                disabled={revokeConsentMutation.isPending}
                className="px-6 py-3 rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              >
                {revokeConsentMutation.isPending ? 'Revoking...' : 'Revoke Consent'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Next Steps */}
        {hasConsent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] p-8 shadow-lg"
          >
            <h2 className="text-base font-semibold mb-6" className="text-purple-700">
              Next Steps
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/heir-management"
                className="p-6 bg-purple-50 rounded-xl hover:shadow-md transition text-center"
              >
                <Users className="w-12 h-12 mx-auto mb-3" className="text-purple-700" />
                <h3 className="font-medium text-[var(--text-900)] mb-2">Designate Heirs</h3>
                <p className="text-sm text-[var(--text-600)]">Choose who can access your legacy</p>
              </Link>

              <Link
                to="/legacy-content"
                className="p-6 bg-purple-50 rounded-xl hover:shadow-md transition text-center"
              >
                <FileText className="w-12 h-12 mx-auto mb-3" className="text-purple-700" />
                <h3 className="font-medium text-[var(--text-900)] mb-2">Create Messages</h3>
                <p className="text-sm text-[var(--text-600)]">Leave final messages and notes</p>
              </Link>

              <Link
                to="/memory-vault"
                className="p-6 bg-purple-50 rounded-xl hover:shadow-md transition text-center"
              >
                <Shield className="w-12 h-12 mx-auto mb-3" className="text-purple-700" />
                <h3 className="font-medium text-[var(--text-900)] mb-2">Add Memories</h3>
                <p className="text-sm text-[var(--text-600)]">Preserve your life stories</p>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Legal Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-6"
        >
          <p className="text-sm text-[var(--text-500)] italic">
            This digital legacy plan follows HIPAA, GDPR, and local data protection laws. Your consent is legally witnessed and can be revoked at any time.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Admin/Clinician patient picker for Legacy Setup
function AdminLegacyPicker({ onPatientSelected }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/patients')
      .then(r => { setPatients(r.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      className="bg-purple-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full shadow-xl">
        <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
          <UserPlus size={32} className="text-amber-600" />
          <div>
            <h2 className="text-xl font-bold text-amber-900">Admin/Clinician View</h2>
            <p className="text-[var(--text-600)] text-sm">Search a patient to manage their digital legacy</p>
          </div>
        </div>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 outline-none text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-[var(--text-400)]">Loading patients...</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.map(p => (
              <button key={p.id} onClick={() => onPatientSelected(p.id)}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-purple-100 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 transition">
                <p className="font-semibold text-[var(--text-900)]">{p.full_name}</p>
                <p className="text-xs text-[var(--text-500)]">{p.patient_code} · {p.primary_diagnosis} · {p.status}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-[var(--text-400)] py-6 text-sm">No patients found</p>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
}

