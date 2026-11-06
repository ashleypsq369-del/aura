/**
 * HeirManagement - Designate who receives your digital legacy
 * Redesigned: no hardcoded purple, proper cards, portal modal
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, X, Trash2, Heart, Shield, AlertCircle,
  CheckCircle2, Lock, Eye, ChevronRight, UserPlus,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from '../utils/toast';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import useConfirmDialog from '../hooks/useConfirmDialog';

const ACCESS_LEVELS = [
  { value: 'full',           label: 'Full Access',     desc: 'All memories, messages and journal' },
  { value: 'memories_only',  label: 'Memories Only',   desc: 'Just the Memory Vault' },
  { value: 'messages_only',  label: 'Messages Only',   desc: 'Just messages and notes' },
];

const GRADIENTS = [
  'from-teal-500 to-cyan-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
];

function HeirCard({ heir, onRemove, idx }) {
  const grad = GRADIENTS[idx % GRADIENTS.length];
  const level = ACCESS_LEVELS.find(l => l.value === heir.access_level) || ACCESS_LEVELS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden group"
    >
      {/* Header strip */}
      <div className={`bg-gradient-to-r ${grad} px-4 py-3 flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white text-base flex-shrink-0">
          {(heir.heir_name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{heir.heir_name}</p>
          <p className="text-xs text-white/70">{heir.relationship}</p>
        </div>
        <button
          onClick={() => onRemove(heir.id, heir.heir_name)}
          className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          title="Remove heir"
        >
          <Trash2 size={13} className="text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Access badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-700 dark:text-teal-300">
            <Eye size={11} /> {level.label}
          </span>
          {heir.can_access_private && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--page-bg)] border border-[var(--card-border)] text-xs font-semibold text-[var(--text-600)]">
              <Lock size={10} /> Incl. private
            </span>
          )}
          {heir.activated_at && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={10} /> Active
            </span>
          )}
        </div>

        {/* Personal note */}
        {heir.notes_from_patient && (
          <div className="px-3 py-2.5 bg-[var(--page-bg)] rounded-lg border border-[var(--card-border)]">
            <p className="text-[10px] font-bold text-[var(--text-400)] uppercase tracking-wider mb-1">Your note to them</p>
            <p className="text-xs text-[var(--text-700)] italic leading-relaxed">"{heir.notes_from_patient}"</p>
          </div>
        )}

        <p className="text-[11px] text-[var(--text-400)]">
          Designated {new Date(heir.designated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </motion.div>
  );
}

function AddHeirModal({ onClose, patientId, availableUsers, onSubmit, isPending }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [accessLevel, setAccessLevel] = useState('full');
  const [canAccessPrivate, setCanAccessPrivate] = useState(true);
  const [personalNote, setPersonalNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserId || !relationship.trim()) { toast.error('Please fill in all required fields'); return; }
    onSubmit({ patient_id: patientId, heir_user_id: parseInt(selectedUserId), relationship, access_level: accessLevel, can_access_private: canAccessPrivate, notes_from_patient: personalNote || null });
  };

  return createPortal(
    <>
      <motion.div key="him-bg" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9500, background:'rgba(0,0,0,0.45)' }} />
      <div style={{ position:'fixed', inset:0, zIndex:9501, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}>
        <motion.div key="him-card" initial={{ opacity:0, y:18, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:10 }} transition={{ type:'spring', damping:28, stiffness:340 }}
          onClick={e => e.stopPropagation()}
          style={{ pointerEvents:'all', background:'var(--card-bg)', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.18)', border:'1px solid var(--card-border)' }}>

          {/* Header */}
          <div style={{ height:3, background:'linear-gradient(90deg,#0d9488,#7c3aed)', flexShrink:0 }} />
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#f0fdf4', border:'1px solid #d1fae5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <UserPlus size={16} style={{ color:'#0d9488' }} />
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--text-900)', margin:0 }}>Designate an Heir</p>
                <p style={{ fontSize:12, color:'var(--text-400)', margin:'2px 0 0' }}>Choose who receives your legacy</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'transparent', border:'1px solid var(--card-border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-500)' }}>
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>

            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-600)', marginBottom:6 }}>Person <span style={{ color:'#dc2626' }}>*</span></label>
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required
                style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1px solid var(--card-border)', borderRadius:10, background:'var(--page-bg)', color:'var(--text-800)', outline:'none' }}>
                <option value="">Choose someone...</option>
                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
              </select>
            </div>

            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-600)', marginBottom:6 }}>Relationship <span style={{ color:'#dc2626' }}>*</span></label>
              <input type="text" value={relationship} onChange={e => setRelationship(e.target.value)} required
                placeholder="e.g. daughter, spouse, best friend..."
                style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1px solid var(--card-border)', borderRadius:10, background:'var(--page-bg)', color:'var(--text-800)', outline:'none' }} />
            </div>

            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-600)', marginBottom:8 }}>Access Level</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {ACCESS_LEVELS.map(lvl => (
                  <label key={lvl.value} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:`2px solid ${accessLevel === lvl.value ? '#0d9488' : 'var(--card-border)'}`, background: accessLevel === lvl.value ? '#f0fdf4' : 'var(--page-bg)', cursor:'pointer', transition:'all 0.12s' }}>
                    <input type="radio" name="accessLevel" value={lvl.value} checked={accessLevel === lvl.value} onChange={() => setAccessLevel(lvl.value)} style={{ accentColor:'#0d9488' }} />
                    <div>
                      <p style={{ fontSize:12, fontWeight:700, color:'var(--text-800)', margin:0 }}>{lvl.label}</p>
                      <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 0' }}>{lvl.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:10, padding:'12px', borderRadius:10, border:`1px solid var(--card-border)`, background:'var(--page-bg)', cursor:'pointer' }}>
              <input type="checkbox" checked={canAccessPrivate} onChange={e => setCanAccessPrivate(e.target.checked)} style={{ width:15, height:15, accentColor:'#0d9488' }} />
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:'var(--text-800)', margin:0 }}>Allow access to private content</p>
                <p style={{ fontSize:11, color:'var(--text-400)', margin:'2px 0 0' }}>They can see entries you marked as private</p>
              </div>
            </label>

            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-600)', marginBottom:6 }}>
                Personal message <span style={{ fontWeight:400, color:'var(--text-400)' }}>(optional)</span>
              </label>
              <textarea value={personalNote} onChange={e => setPersonalNote(e.target.value)} rows={3}
                placeholder="A personal message for this person that they'll see when they access your legacy..."
                style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1px solid var(--card-border)', borderRadius:10, background:'var(--page-bg)', color:'var(--text-800)', outline:'none', resize:'none' }} />
            </div>
          </form>

          {/* Footer */}
          <div style={{ padding:'12px 20px', background:'var(--page-bg)', borderTop:'1px solid var(--card-border)', display:'flex', gap:10, flexShrink:0 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--card-border)', background:'transparent', color:'var(--text-600)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isPending || !selectedUserId || !relationship.trim()}
              style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background: isPending || !selectedUserId || !relationship.trim() ? '#e2e8f0' : '#0d9488', color: isPending || !selectedUserId || !relationship.trim() ? '#94a3b8' : '#fff', fontSize:13, fontWeight:700, cursor: isPending || !selectedUserId || !relationship.trim() ? 'not-allowed' : 'pointer', transition:'all 0.15s' }}>
              {isPending ? 'Designating...' : 'Designate Heir'}
            </button>
          </div>
        </motion.div>
      </div>
    </>,
    document.body
  );
}

export default function HeirManagement() {
  const { user } = useAuth();
  const { confirm: confirmAction, ConfirmDialog } = useConfirmDialog();
  const [patientId, setPatientId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: patientData } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => (await apiClient.get('/api/bereavement/my-patient')).data,
  });

  useEffect(() => {
    if (patientData?.patient_id) setPatientId(patientData.patient_id);
    else if (patientData?.patient?.id) setPatientId(patientData.patient.id);
  }, [patientData]);

  const { data: consentData } = useQuery({
    queryKey: ['legacy-consent', patientId],
    queryFn: async () => (await apiClient.get(`/api/legacy/consent/${patientId}`)).data,
    enabled: !!patientId,
  });

  const { data: heirsData, isLoading } = useQuery({
    queryKey: ['legacy-heirs', patientId],
    queryFn: async () => { if (!patientId) return { heirs: [] }; return (await apiClient.get(`/api/legacy/heirs/${patientId}`)).data; },
    enabled: !!patientId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => (await apiClient.get('/api/auth/users')).data,
    enabled: showModal,
  });

  const designateHeirMutation = useMutation({
    mutationFn: async (data) => (await apiClient.post('/api/legacy/heirs', data)).data,
    onSuccess: () => { queryClient.invalidateQueries(['legacy-heirs', patientId]); setShowModal(false); toast.success('Heir designated'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to designate heir'),
  });

  const removeHeirMutation = useMutation({
    mutationFn: async (id) => (await apiClient.delete(`/api/legacy/heirs/${id}`)).data,
    onSuccess: () => { queryClient.invalidateQueries(['legacy-heirs', patientId]); toast.success('Heir removed'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to remove heir'),
  });

  const handleRemoveHeir = async (heirId, heirName) => {
    if (await confirmAction({ title: `Remove ${heirName} as heir?`, body: 'They will lose access to your legacy. You can re-add them at any time.', confirmLabel: 'Remove', variant: 'danger' })) {
      removeHeirMutation.mutate(heirId);
    }
  };

  const heirs = heirsData?.heirs || [];
  const hasConsent = consentData?.consent_given;
  const users = usersData?.users || [];
  const availableUsers = users.filter(u => u.id !== user?.id && !heirs.some(h => h.heir_user_id === u.id));

  // No consent — gate page
  if (!hasConsent && !isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-8 max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-teal-600" />
          </div>
          <p className="text-sm font-bold text-[var(--text-900)] mb-2">Consent Required</p>
          <p className="text-xs text-[var(--text-500)] mb-5 leading-relaxed">
            You need to set up your digital legacy plan before designating heirs.
          </p>
          <Link to="/legacy-setup"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition">
            Set Up Digital Legacy <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <PageHeader
        image="/resources/african/african-family-support.jpg"
        title="Manage Heirs"
        subtitle="Designate who receives access to your digital legacy"
        icon={Users}
      >
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition">
          <Plus size={13} /> Add Heir
        </button>
      </PageHeader>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* Info strip */}
        <div className="flex items-start gap-3 px-4 py-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
          <AlertCircle size={15} className="text-teal-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-600)] leading-relaxed">
            Heirs can only access your content <strong>after you pass away</strong> and a clinician activates the legacy system. You can add, change or remove heirs at any time.
          </p>
        </div>

        {/* Heirs grid */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : heirs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {heirs.map((heir, idx) => (
              <HeirCard key={heir.id} heir={heir} onRemove={handleRemoveHeir} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--card-bg)] rounded-xl border border-dashed border-[var(--card-border)] p-10 text-center">
            <Heart size={32} className="text-[var(--text-300)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[var(--text-600)] mb-1">No heirs designated yet</p>
            <p className="text-xs text-[var(--text-400)] mb-5">Choose the people who will receive your legacy</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition">
              <UserPlus size={14} /> Designate First Heir
            </button>
          </div>
        )}

        <p className="text-center text-xs text-[var(--text-400)] pb-2">
          Heirs are only activated after you pass away and a clinician confirms the legacy. Changes take effect immediately.
        </p>
      </div>

      <AnimatePresence>
        {showModal && (
          <AddHeirModal
            onClose={() => setShowModal(false)}
            patientId={patientId}
            availableUsers={availableUsers}
            onSubmit={designateHeirMutation.mutate}
            isPending={designateHeirMutation.isPending}
          />
        )}
      </AnimatePresence>
      <ConfirmDialog />
    </div>
  );
}
