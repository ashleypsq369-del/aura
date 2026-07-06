/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, X, Calendar, Trash2, Lock, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';

const compassionatePrompts = [
  "What do you want to remember about today?",
  "What are you feeling right now?",
  "What would you like to say but haven't?",
  "What brings you comfort today?",
  "What memory made you smile?",
  "What do you wish others understood?",
  "How are you taking care of yourself?",
  "What small joy did you notice today?",
  "What are you grateful for in this moment?",
  "What do you need to let go of?",
];

export default function Journal() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const scope = searchParams.get('scope') || 'family';
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(compassionatePrompts[0]);
  const [patientId, setPatientId] = useState(null);
  const [contextName, setContextName] = useState(null);
  const queryClient = useQueryClient();

  const { data: patientData } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => {
      const response = await apiClient.get('/api/bereavement/my-patient');
      return response.data;
    },
    enabled: !paramPatientId,
  });

  const { data: legacyData } = useQuery({
    queryKey: ['my-legacy-access'],
    queryFn: async () => {
      const response = await apiClient.get('/api/legacy/my-legacy-access');
      return response.data;
    },
    enabled: !!paramPatientId && scope === 'legacy',
  });

  useEffect(() => {
    if (paramPatientId) {
      const id = parseInt(paramPatientId, 10);
      setPatientId(id);
      if (scope === 'legacy') {
        const match = legacyData?.legacy_access?.find((a) => a.patient_id === id);
        setContextName(match?.patient_name || 'Legacy Patient');
      }
      return;
    }
    if (patientData?.patient_id) {
      setPatientId(patientData.patient_id);
      setContextName(patientData.patient_name);
    } else if (patientData?.patient?.id) {
      setPatientId(patientData.patient.id);
      setContextName(patientData.patient.full_name);
    }
  }, [patientData, paramPatientId, scope, legacyData]);

  // Fetch journal entries (include_private=true to see own private entries)
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['journal', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      const response = await apiClient.get(
        `/api/bereavement/entries/${patientId}?entry_type=journal&include_private=true`
      );
      return response.data;
    },
    enabled: !!patientId,
  });

  // Create journal entry mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/api/bereavement/entry', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journal', patientId]);
      setShowModal(false);
      setNewEntry('');
      toast.success('Journal entry saved');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to save entry');
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId) => {
      const response = await apiClient.delete(`/api/bereavement/entry/${entryId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['journal', patientId]);
      toast.success('Entry deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete entry');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newEntry.trim() && patientId) {
      createMutation.mutate({
        patient_id: patientId,
        entry_type: 'journal',
        content: newEntry,
        prompt_used: selectedPrompt,
        is_private: true, // Journal entries are always private
      });
    }
  };

  const handleDelete = (entryId) => {
    if (window.confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
      deleteMutation.mutate(entryId);
    }
  };

  const entries = entriesData?.entries || [];
  const scopeLabel = scope === 'legacy'
    ? `Legacy Journal${contextName ? ` - ${contextName}` : ''}`
    : 'Grief Journal';

  // Show message if no patient linked
  if (!patientId && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" >
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 max-w-sm text-center border border-slate-200">
          <BookOpen className="w-16 h-16 mx-auto mb-6" className="text-purple-400" />
          <h2 className="text-base font-semibold mb-4" style={{ color: '#6B4F7A' }}>
            No Patient Linked
          </h2>
          <p className="text-gray-600">
            The Grief Journal is available to family members and caregivers. Please contact your care team if you should have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto px-6 py-8 space-y-8"
      >
        {paramPatientId && (
          <Link to="/continuity-bridge" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeft size={16} /> Back to Continuity Bridge
          </Link>
        )}

        {/* Header */}
        <PageHeader
          image="/resources/cards/card-journal.jpg"
          title={scopeLabel}
          subtitle="A private space for your thoughts and feelings"
          icon={BookOpen}
        >
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all"
          >
            <Plus size={16} /> New Entry
          </button>
        </PageHeader>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-sm rounded-xl p-4 flex items-center space-x-3"
        >
          <Lock className="w-5 h-5" style={{ color: '#6B4F7A' }} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">
              Your journal entries are completely private
            </p>
            <p className="text-xs text-gray-500">
              Only you can see what you write here. Write freely, without judgment.
            </p>
          </div>
        </motion.div>

        {/* Compassionate Prompt */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-slate-200 p-8 shadow-md text-center"
        >
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: '#6B4F7A', opacity: 0.7 }} />
          <p className="text-xl italic text-gray-700">
            "{selectedPrompt}"
          </p>
          <button
            onClick={() => {
              const randomPrompt = compassionatePrompts[Math.floor(Math.random() * compassionatePrompts.length)];
              setSelectedPrompt(randomPrompt);
            }}
            className="mt-4 text-sm hover:underline"
            style={{ color: '#6B4F7A' }}
          >
            Get another prompt
          </button>
        </motion.div>

        {/* Journal Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6B4F7A' }}></div>
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-6">
            {entries.map((entry, index) => (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all relative group overflow-hidden border"
                style={{ borderColor: ['#e9d5ff','#dbeafe','#d1fae5','#fce7f3','#fef3c7','#cffafe'][index % 6] }}
              >
                {/* Top accent */}
                <div className="h-1 w-full" style={{
                  background: [
                    'linear-gradient(to right,#7c3aed,#9d174d)',
                    'linear-gradient(to right,#1d4ed8,#0891b2)',
                    'linear-gradient(to right,#059669,#0d9488)',
                    'linear-gradient(to right,#db2777,#e11d48)',
                    'linear-gradient(to right,#d97706,#ea580c)',
                    'linear-gradient(to right,#0891b2,#0d9488)',
                  ][index % 6]
                }} />
                {/* Delete Button */}
                {entry.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="absolute top-4 right-4 p-2 bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}

                <div className="p-5">
                <div className="flex items-center space-x-3 mb-4 pb-4 border-b-2" style={{ borderColor: '#6B4F7A20' }}>
                  <Calendar className="w-5 h-5" style={{ color: '#6B4F7A' }} />
                  <time className="text-sm font-medium text-gray-600">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>

                {/* Show prompt if available */}
                {entry.prompt_used && (
                  <div className="mb-4 p-3 rounded-lg bg-purple-50">
                    <p className="text-sm italic text-gray-600">
                      "{entry.prompt_used}"
                    </p>
                  </div>
                )}

                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                </div>
                </div> {/* close p-5 wrapper */}
              </motion.article>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 backdrop-blur-sm rounded-lg p-8 text-center border border-slate-200"
          >
            <BookOpen className="w-20 h-20 mx-auto mb-6" style={{ color: '#6B4F7A', opacity: 0.3 }} />
            <h3 className="text-base font-semibold mb-3" style={{ color: '#6B4F7A' }}>
              Your Journal Awaits
            </h3>
            <p className="text-gray-600 mb-2">
              This is your private, sacred space for reflection.
            </p>
            <p className="text-gray-500 italic mb-6">
              "{selectedPrompt}"
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl shadow-lg"
              style={{ backgroundColor: '#6B4F7A', color: 'white' }}
            >
              Write Your First Entry
            </button>
          </motion.div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: '#6B4F7A' }}>
                      New Journal Entry
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Prompt */}
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#6B4F7A10' }}>
                  <p className="text-sm italic text-gray-700">
                    "{selectedPrompt}"
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Reflection
                    </label>
                    <textarea
                      value={newEntry}
                      onChange={(e) => setNewEntry(e.target.value)}
                      rows={12}
                      placeholder="Let your thoughts flow... This is your private space."
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-opacity-50 resize-none"
                      style={{ borderColor: '#6B4F7A20', focusBorderColor: '#6B4F7A' }}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Privacy Notice */}
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-gray-600" />
                    <p className="text-sm text-gray-600">
                      This entry will be kept completely private. Only you can see it.
                    </p>
                  </div>

                  <FormFileUpload
                    category="memories"
                    label="Journal Attachments"
                    description="Attach photos or documents to your journal entry"
                    accept="image/*,video/*,.pdf"
                    multiple={true}
                    maxSizeMB={50}
                  />

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setNewEntry('');
                      }}
                      className="flex-1 px-6 py-3 border-2 rounded-xl hover:bg-gray-50 transition"
                      style={{ borderColor: '#6B4F7A40', color: '#6B4F7A' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50"
                      style={{ backgroundColor: '#6B4F7A', color: 'white' }}
                    >
                      {createMutation.isPending ? 'Saving...' : 'Save Entry'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <p className="text-sm text-gray-500 italic">
            Your entries are private and for your eyes only. Write freely, without judgment.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

