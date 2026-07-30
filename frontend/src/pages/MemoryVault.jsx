/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, Users, Lock, Globe, Trash2, ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import FormFileUpload from '../components/FormFileUpload';
import Modal, { ModalFooter } from '../components/Modal';

/* ── Memory theme clustering ─────────────────────────────────────────── */
const THEME_PATTERNS = {
  joy:         { words: ['laugh', 'happy', 'fun', 'smile', 'joy', 'celebrate', 'wonderful', 'amazing', 'beautiful', 'loved', 'bright', 'sunshine'], label: 'Moments of Joy',   emoji: '✨', color: 'from-amber-50 to-yellow-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  family:      { words: ['family', 'mother', 'father', 'son', 'daughter', 'sister', 'brother', 'children', 'grandchild', 'together', 'home', 'husband', 'wife'], label: 'Family',  emoji: '👨‍👩‍👧', color: 'from-rose-50 to-pink-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' },
  gratitude:   { words: ['thank', 'grateful', 'gratitude', 'blessed', 'appreciate', 'gift', 'kindness', 'generous', 'care'], label: 'Gratitude',  emoji: '🙏', color: 'from-teal-50 to-cyan-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800' },
  adventure:   { words: ['travel', 'trip', 'journey', 'adventure', 'explore', 'holiday', 'vacation', 'visit', 'place', 'city', 'country'], label: 'Adventures', emoji: '🌍', color: 'from-blue-50 to-indigo-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  reflection:  { words: ['remember', 'memory', 'think', 'feel', 'thought', 'wonder', 'dream', 'hope', 'believe', 'heart', 'soul', 'spirit'], label: 'Reflections', emoji: '💭', color: 'from-violet-50 to-purple-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-800' },
};

function clusterMemories(memories) {
  const themed = { joy: [], family: [], gratitude: [], adventure: [], reflection: [], other: [] };
  memories.forEach(m => {
    const lower = (m.content || '').toLowerCase();
    let matched = false;
    for (const [theme, config] of Object.entries(THEME_PATTERNS)) {
      if (config.words.some(w => lower.includes(w))) {
        themed[theme].push(m);
        matched = true;
        break;
      }
    }
    if (!matched) themed.other.push(m);
  });
  return themed;
}

export default function MemoryVault() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const scope = searchParams.get('scope') || 'family';
  const [showModal, setShowModal] = useState(false);
  const [newMemory, setNewMemory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
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

  // Fetch memories
  const { data: memoriesData, isLoading } = useQuery({
    queryKey: ['memories', patientId],
    queryFn: async () => {
      if (!patientId) return { entries: [] };
      const response = await apiClient.get(`/api/bereavement/entries/${patientId}?entry_type=memory`);
      return response.data;
    },
    enabled: !!patientId,
  });

  // Create memory mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/api/bereavement/entry', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memories', patientId]);
      setShowModal(false);
      setNewMemory('');
      setIsPrivate(false);
      toast.success('Memory saved to the vault');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to save memory');
    },
  });

  // Delete memory mutation
  const deleteMutation = useMutation({
    mutationFn: async (entryId) => {
      const response = await apiClient.delete(`/api/bereavement/entry/${entryId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memories', patientId]);
      toast.success('Memory deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete memory');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMemory.trim() && patientId) {
      createMutation.mutate({
        patient_id: patientId,
        entry_type: 'memory',
        content: newMemory,
        is_private: isPrivate,
      });
    }
  };

  const handleDelete = (entryId) => {
    if (window.confirm('Are you sure you want to delete this memory? This cannot be undone.')) {
      deleteMutation.mutate(entryId);
    }
  };

  const memories = memoriesData?.entries || [];
  const [showClustered, setShowClustered] = useState(false);
  const clustered = useMemo(() => clusterMemories(memories), [memories]);
  const hasThemes = Object.entries(clustered).some(([k, v]) => k !== 'other' && v.length > 0);
  const legacyMatch = legacyData?.legacy_access?.find((a) => a.patient_id === patientId);
  const patientName = contextName ?? patientData?.patient_name ?? patientData?.patient?.full_name ?? legacyMatch?.patient_name;
  const patientStatus = scope === 'legacy' ? 'deceased' : (patientData?.status ?? patientData?.patient?.status);
  const patientDeceasedAt = patientData?.deceased_at ?? patientData?.patient?.deceased_at ?? legacyMatch?.deceased_at;
  const scopeLabel = scope === 'legacy' ? 'Legacy Memory Vault' : 'Family Memory Vault';

  // Show message if no patient linked
  if (!patientId && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 max-w-md text-center shadow-lg">
          <Heart className="w-16 h-16 mx-auto mb-6 text-purple-400" />
          <h2 className="text-lg font-semibold mb-4 text-purple-700">
            No Patient Linked
          </h2>
          <p className="text-gray-600">
            The Memory Vault is available to patients and their families. Please contact your care team if you should have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page header with photo */}
      <PageHeader
        image="/resources/headers/header-memory.jpg"
        title={scopeLabel}
        subtitle="Preserve cherished moments and memories"
        icon={Heart}
      >
        <button
          onClick={() => setShowModal(true)}
          data-tip="Add a new memory"
          data-tip-below=""
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all"
        >
          <Plus size={16} /> Add Memory
        </button>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6"
      >
        {paramPatientId && (
          <Link to="/continuity-bridge" data-tip="Go back to Continuity Bridge" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeft size={16} /> Back to Continuity Bridge
          </Link>
        )}

        {/* Patient Status Banner */}
        {patientName && (
          <div className="bg-white border border-purple-100 rounded-lg px-4 py-3 flex items-center gap-3">
            <Users className="w-4 h-4 flex-shrink-0 text-purple-700" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                {patientStatus === 'deceased' ? 'In loving memory of' : 'Memories about'} <strong>{patientName}</strong>
              </p>
              {patientDeceasedAt && (
                <p className="text-xs text-slate-400">
                  {new Date(patientDeceasedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Memories Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6B4F7A' }}></div>
          </div>
        ) : memories && memories.length > 0 ? (
          <>
            {/* Theme clustering toggle */}
            {memories.length > 3 && hasThemes && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400 font-semibold">{memories.length} memories</p>
                <button
                  onClick={() => setShowClustered(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    showClustered
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {showClustered ? '📋 Grid View' : '🗂️ Group by Theme'}
                </button>
              </div>
            )}

            {showClustered && hasThemes ? (
              <div className="space-y-8">
                {Object.entries(THEME_PATTERNS).map(([themeKey, themeConfig]) => {
                  const group = clustered[themeKey] || [];
                  if (!group.length) return null;
                  return (
                    <div key={themeKey}>
                      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-3 bg-gradient-to-r ${themeConfig.color} ${themeConfig.border}`}>
                        <span className="text-lg">{themeConfig.emoji}</span>
                        <h3 className="font-bold text-slate-800 text-sm">{themeConfig.label}</h3>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${themeConfig.badge}`}>{group.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.map((memory, index) => (
                          <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.04, duration: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative group overflow-hidden"
                            style={{ borderColor: ['#e9d5ff','#fce7f3','#dbeafe','#d1fae5','#fef3c7','#ffe4e6'][index % 6] }}
                          >
                            <div className="h-1 w-full" style={{
                              background: [
                                'linear-gradient(to right,#7c3aed,#9d174d)',
                                'linear-gradient(to right,#db2777,#7c3aed)',
                                'linear-gradient(to right,#1d4ed8,#7c3aed)',
                                'linear-gradient(to right,#059669,#0d9488)',
                                'linear-gradient(to right,#d97706,#ea580c)',
                                'linear-gradient(to right,#e11d48,#db2777)',
                              ][index % 6]
                            }} />
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <Heart className="w-4 h-4 flex-shrink-0 text-purple-700" />
                                <div className="flex items-center gap-1">
                                  {memory.is_private ? (
                                    <div className="p-1 bg-slate-100 rounded-md"><Lock className="w-3 h-3 text-slate-500" /></div>
                                  ) : (
                                    <div className="p-1 bg-purple-50 rounded-md"><Globe className="w-3 h-3 text-purple-700" /></div>
                                  )}
                                  {memory.user_id === user?.id && (
                                    <button onClick={() => handleDelete(memory.id)} className="p-1 bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100">
                                      <Trash2 className="w-3 h-3 text-red-500" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed mb-3">{memory.content}</p>
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                <span>{memory.author_name}</span>
                                <span>{new Date(memory.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {(clustered.other || []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-3 bg-slate-50 border-slate-200">
                      <span className="text-lg">📦</span>
                      <h3 className="font-bold text-slate-700 text-sm">Other Memories</h3>
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{clustered.other.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clustered.other.map((memory, index) => (
                        <motion.div key={memory.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}
                          className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all relative group overflow-hidden"
                          style={{ borderColor: '#e9d5ff' }}>
                          <div className="h-1 w-full" style={{ background: 'linear-gradient(to right,#7c3aed,#9d174d)' }} />
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <Heart className="w-4 h-4 text-purple-700" />
                              <div className="flex items-center gap-1">
                                {memory.is_private ? <div className="p-1 bg-slate-100 rounded-md"><Lock className="w-3 h-3 text-slate-500" /></div> : <div className="p-1 bg-purple-50 rounded-md"><Globe className="w-3 h-3 text-purple-700" /></div>}
                                {memory.user_id === user?.id && <button onClick={() => handleDelete(memory.id)} className="p-1 bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"><Trash2 className="w-3 h-3 text-red-500" /></button>}
                              </div>
                            </div>
                            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed mb-3">{memory.content}</p>
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                              <span>{memory.author_name}</span>
                              <span>{new Date(memory.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memories.map((memory, index) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative group overflow-hidden"
                    style={{ borderColor: ['#e9d5ff','#fce7f3','#dbeafe','#d1fae5','#fef3c7','#ffe4e6'][index % 6] }}
                  >
                    {/* Top accent - cycles through memory colors */}
                    <div className="h-1 w-full" style={{
                      background: [
                        'linear-gradient(to right,#7c3aed,#9d174d)',
                        'linear-gradient(to right,#db2777,#7c3aed)',
                        'linear-gradient(to right,#1d4ed8,#7c3aed)',
                        'linear-gradient(to right,#059669,#0d9488)',
                        'linear-gradient(to right,#d97706,#ea580c)',
                        'linear-gradient(to right,#e11d48,#db2777)',
                      ][index % 6]
                    }} />

                    <div className="p-4">
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-3">
                        <Heart className="w-4 h-4 flex-shrink-0 text-purple-700" />
                        <div className="flex items-center gap-1">
                          {memory.is_private ? (
                            <div className="p-1 bg-slate-100 rounded-md" title="Private">
                              <Lock className="w-3 h-3 text-slate-500" />
                            </div>
                          ) : (
                            <div className="p-1 bg-purple-50 rounded-md" title="Shared">
                              <Globe className="w-3 h-3 text-purple-700" />
                            </div>
                          )}
                          {memory.user_id === user?.id && (
                            <button
                              onClick={() => handleDelete(memory.id)}
                              data-tip="Delete this memory"
                              className="p-1 bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed mb-3">{memory.content}</p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>{memory.author_name}</span>
                        <span>{new Date(memory.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-slate-700 p-10 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4" style={{ color: '#6B4F7A', opacity: 0.3 }} />
            <h3 className="text-lg font-semibold mb-2 text-purple-700">Your Memory Vault is Empty</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Start preserving the precious moments, stories, and reflections you want to keep forever.</p>
            <button onClick={() => setShowModal(true)} data-tip="Add your first memory"
              className="px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: '#6B4F7A', color: 'white' }}>
              Add Your First Memory
            </button>
          </motion.div>
        )}

        {/* Add Memory Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setNewMemory(''); setIsPrivate(false); }}
          title="Preserve a Memory"
          size="lg"
          footerContent={
            <ModalFooter>
              <button
                type="button"
                onClick={() => { setShowModal(false); setNewMemory(''); setIsPrivate(false); }}
                className="px-4 py-2 text-sm font-semibold border-2 rounded-xl hover:bg-gray-50 transition-all duration-150"
                style={{ borderColor: '#6B4F7A40', color: '#6B4F7A' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="memory-form"
                disabled={createMutation.isPending}
                data-tip="Save this memory to the vault"
                className="px-5 py-2 text-sm font-bold rounded-xl transition-all duration-150 disabled:opacity-50"
                style={{ backgroundColor: '#6B4F7A', color: 'white' }}
              >
                {createMutation.isPending ? 'Saving...' : 'Save to Vault'}
              </button>
            </ModalFooter>
          }
        >
          {patientName && (
            <div className="mb-4 p-4 rounded-xl bg-purple-50">
              <p className="text-sm text-gray-700">
                This memory will be saved about <span className="font-medium">{patientName}</span>
              </p>
            </div>
          )}

          <form id="memory-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                What would you like to remember?
              </label>
              <textarea
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                rows={8}
                placeholder="A moment, a feeling, a story, a smile..."
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none resize-none"
                style={{ borderColor: '#6B4F7A20' }}
                required
                autoFocus
              />
            </div>

            {/* Privacy Toggle */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  {isPrivate ? (
                    <Lock className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Globe className="w-5 h-5 text-purple-700" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isPrivate ? 'Private Memory' : 'Shared Memory'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isPrivate
                        ? 'Only you can see this memory'
                        : 'Family members and care team can see this memory'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#6B4F7A' }}
                />
              </label>
            </div>

            <FormFileUpload
              category="memories"
              label="Photos & Videos"
              description="Upload cherished photos and videos"
              accept="image/*,video/*"
              multiple={true}
              maxSizeMB={50}
            />
          </form>
        </Modal>
      </motion.div>
    </div>
  );
}

