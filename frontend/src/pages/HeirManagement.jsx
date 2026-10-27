/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Trash2, Heart, Shield, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ModalShell from '../components/ui/ModalShell';

export default function HeirManagement() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [accessLevel, setAccessLevel] = useState('full');
  const [canAccessPrivate, setCanAccessPrivate] = useState(true);
  const [personalNote, setPersonalNote] = useState('');

  // Fetch linked patient
  const { data: patientData } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => {
      const response = await apiClient.get('/api/bereavement/my-patient');
      return response.data;
    },
  });

  useEffect(() => {
    if (patientData?.patient_id) {
      setPatientId(patientData.patient_id);
    } else if (patientData?.patient?.id) {
      setPatientId(patientData.patient.id);
    }
  }, [patientData]);

  // Check consent
  const { data: consentData } = useQuery({
    queryKey: ['legacy-consent', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const response = await apiClient.get(`/api/legacy/consent/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
  });

  // Fetch heirs
  const { data: heirsData, isLoading } = useQuery({
    queryKey: ['legacy-heirs', patientId],
    queryFn: async () => {
      if (!patientId) return { heirs: [] };
      const response = await apiClient.get(`/api/legacy/heirs/${patientId}`);
      return response.data;
    },
    enabled: !!patientId,
  });

  // Fetch all users for heir selection
  const { data: usersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await apiClient.get('/api/auth/users');
      return response.data;
    },
    enabled: showModal,
  });

  // Designate heir mutation
  const designateHeirMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/api/legacy/heirs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legacy-heirs', patientId]);
      setShowModal(false);
      resetForm();
      toast.success('Heir designated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to designate heir');
    },
  });

  // Remove heir mutation
  const removeHeirMutation = useMutation({
    mutationFn: async (heirId) => {
      const response = await apiClient.delete(`/api/legacy/heirs/${heirId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legacy-heirs', patientId]);
      toast.success('Heir removed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to remove heir');
    },
  });

  const resetForm = () => {
    setSelectedUserId('');
    setRelationship('');
    setAccessLevel('full');
    setCanAccessPrivate(true);
    setPersonalNote('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedUserId || !relationship) {
      toast.error('Please fill in all required fields');
      return;
    }

    designateHeirMutation.mutate({
      patient_id: patientId,
      heir_user_id: parseInt(selectedUserId),
      relationship: relationship,
      access_level: accessLevel,
      can_access_private: canAccessPrivate,
      notes_from_patient: personalNote || null
    });
  };

  const handleRemoveHeir = (heirId, heirName) => {
    if (window.confirm(`Are you sure you want to remove ${heirName} as an heir? They will lose access to your legacy.`)) {
      removeHeirMutation.mutate(heirId);
    }
  };

  const heirs = heirsData?.heirs || [];
  const hasConsent = consentData?.consent_given;
  const users = usersData?.users || [];
  const availableUsers = users.filter(u => 
    u.id !== user?.id && // Not current user
    !heirs.some(h => h.heir_user_id === u.id) // Not already an heir
  );

  if (!patientId && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" className="bg-purple-50">
        <div className="bg-white rounded-lg p-8 max-w-sm text-center border border-slate-200">
          <Users className="w-16 h-16 mx-auto mb-6" className="text-purple-400" />
          <h2 className="text-base font-semibold mb-4" className="text-purple-700">
            No Patient Linked
          </h2>
          <p className="text-gray-600">
            Heir management is available to patients. Please contact your care team.
          </p>
        </div>
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <div className="min-h-screen flex items-center justify-center" className="bg-purple-50">
        <div className="bg-white rounded-lg p-8 max-w-sm text-center border border-slate-200">
          <Shield className="w-16 h-16 mx-auto mb-6" className="text-purple-400" />
          <h2 className="text-base font-semibold mb-4" className="text-purple-700">
            Consent Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to give consent for your digital legacy before designating heirs.
          </p>
          <Link
            to="/legacy-setup"
            className="inline-block px-6 py-3 rounded-xl shadow-lg"
            className="bg-purple-700 text-white"
          >
            Set Up Digital Legacy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" className="bg-purple-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto px-6 py-8 space-y-8"
      >
        {/* Header */}
        <PageHeader
          image="/resources/african/african-family-support.jpg"
          title="Heir Management"
          subtitle="Designate who can access your digital legacy"
          icon={Users}
        >
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all"
          >
            <Plus size={16} /> Add Heir
          </button>
        </PageHeader>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 flex items-start space-x-3"
        >
          <AlertCircle className="w-6 h-6 text-teal-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">What are Heirs?</h3>
            <p className="text-sm text-blue-800">
              Heirs are people you designate to access your memories, messages, and other content after you pass away. You can choose anyone - family members, friends, or anyone you trust. Each heir can have different access levels and permissions.
            </p>
          </div>
        </motion.div>

        {/* Heirs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" ></div>
          </div>
        ) : heirs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {heirs.map((heir, index) => (
              <motion.div
                key={heir.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-white rounded-lg border border-slate-200 p-6 shadow-md hover:shadow-lg transition relative group"
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleRemoveHeir(heir.id, heir.heir_name)}
                  className="absolute top-4 right-4 p-2 bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  title="Remove heir"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="w-6 h-6" className="text-purple-700" />
                  </div>
                  <div className="flex-1 pr-8">
                    <h3 className="text-lg font-medium text-gray-900">{heir.heir_name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{heir.relationship}</p>

                    {/* Access Level Badge */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
                        {heir.access_level === 'full' && 'Full Access'}
                        {heir.access_level === 'memories_only' && 'Memories Only'}
                        {heir.access_level === 'messages_only' && 'Messages Only'}
                      </span>
                      {heir.can_access_private && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          Can View Private
                        </span>
                      )}
                    </div>

                    {/* Personal Note */}
                    {heir.notes_from_patient && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Your note to them:</p>
                        <p className="text-sm text-gray-700 italic">"{heir.notes_from_patient}"</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                      <span>Designated {new Date(heir.designated_at).toLocaleDateString()}</span>
                      {heir.activated_at && (
                        <span className="text-green-600">
                          " Activated {new Date(heir.activated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 backdrop-blur-sm rounded-lg p-8 text-center border border-slate-200"
          >
            <Heart className="w-20 h-20 mx-auto mb-6" style={{ color: '#6B4F7A', opacity: 0.3 }} />
            <h3 className="text-base font-semibold mb-3" className="text-purple-700">
              No Heirs Designated Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start designating people who will be able to access your memories and messages after you're gone.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl shadow-lg"
              className="bg-purple-700 text-white"
            >
              Designate Your First Heir
            </button>
          </motion.div>
        )}

        {/* Add Heir Modal */}
        <ModalShell
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Designate an Heir"
          icon={Users}
          accent="violet"
          size="lg"
          footer={
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 px-6 py-3 border-2 rounded-xl hover:bg-gray-50 transition"
                style={{ borderColor: '#6B4F7A40', color: '#6B4F7A' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={designateHeirMutation.isPending}
                className="flex-1 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50"
                style={{ backgroundColor: '#6B4F7A', color: 'white' }}
              >
                {designateHeirMutation.isPending ? 'Designating...' : 'Designate Heir'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search User */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Search Person *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                style={{ borderColor: '#6B4F7A40' }}
                required
              >
                <option value="">Choose someone from the system...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Relationship */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Relationship *
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g., daughter, son, spouse, best friend, sister..."
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                style={{ borderColor: '#6B4F7A40' }}
                required
              />
            </div>

            {/* Access Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                style={{ borderColor: '#6B4F7A40' }}
              >
                <option value="full">Full Access - All content and memories</option>
                <option value="memories_only">Memories Only - Just Memory Vault</option>
                <option value="messages_only">Messages Only - Just messages and notes</option>
              </select>
            </div>

            {/* Can Access Private */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canAccessPrivate}
                  onChange={(e) => setCanAccessPrivate(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded"
                  style={{ accentColor: '#6B4F7A' }}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Allow access to private content</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    They can see entries you marked as "private". Uncheck to only show shared content.
                  </p>
                </div>
              </label>
            </div>

            {/* Personal Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                rows={4}
                placeholder="A personal message for this person that they'll see when they access your legacy..."
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                style={{ borderColor: '#6B4F7A40' }}
              />
            </div>
          </form>
        </ModalShell>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <p className="text-sm text-gray-500 italic">
            You can change or remove heirs at any time. Heirs will only get access after you pass away and a clinician activates the legacy system.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

