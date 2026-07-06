/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Edit2, UserCheck, UserX,
  RefreshCw, X, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getRoleBadgeColor(role) {
  return {
    admin:     'badge-critical',
    clinician: 'badge-stable',
    caregiver: 'badge-low',
    patient:   'badge-moderate',
    family:    'chip-pink',
  }[role] || 'badge-info';
}

function CreateUserModal({ onClose, onSubmit, pending }) {
  const [form, setForm] = useState({ username: '', email: '', full_name: '', role: 'clinician', password: '' });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200"
            style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
            <div className="flex items-center gap-3">
              <Users size={18} className="text-white" />
              <h3 className="font-bold text-white">Create New User</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-red-500 rounded-lg flex items-center justify-center transition">
              <X size={16} className="text-white" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text', ph: 'Dr. Kofi Mensah' },
              { label: 'Username', key: 'username', type: 'text', ph: 'kmensah' },
              { label: 'Email', key: 'email', type: 'email', ph: 'k.mensah@hospital.gh' },
              { label: 'Password', key: 'password', type: 'password', ph: 'Min 8 characters' },
            ].map(({ label, key, type, ph }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
                <input type={type} value={form[key]} onChange={f(key)} placeholder={ph}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Role</label>
              <select value={form.role} onChange={f('role')}
                className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none">
                {['admin','clinician','caregiver','patient','family'].map(r => (
                  <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={pending || !form.username || !form.email || !form.password}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1e293b' }}>
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create User
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter === 'active') params.append('is_active', 'true');
      if (statusFilter === 'inactive') params.append('is_active', 'false');
      if (searchQuery) params.append('search', searchQuery);
      const r = await axios.get(`${API_URL}/api/admin/users?${params}`, { headers });
      return r.data;
    },
  });

  const users = usersData?.users || [];

  const toggleMutation = useMutation({
    mutationFn: (id) => axios.put(`${API_URL}/api/admin/users/${id}/deactivate`, {}, { headers }),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('User status updated'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to update user'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => axios.put(`${API_URL}/api/admin/users/${id}/reset-password`, {}, { headers }),
    onSuccess: (r) => toast.success(`Temp password: ${r.data.temp_password}`, { duration: 10000 }),
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to reset password'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => axios.post(`${API_URL}/api/admin/users`, data, { headers }),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); setShowCreateModal(false); toast.success('User created'); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create user'),
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">User Management</h1>
            <p className="text-xs text-white/70">Manage system users and roles</p>
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold border border-white/30 transition">
            <Plus size={15} /> Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="search-wrap">
              <span className="search-icon"><Search size={15} /></span>
              <input type="text" placeholder="Search users..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none">
              <option value="all">All Roles</option>
              {['admin','clinician','caregiver','patient','family'].map(r => (
                <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center">
              <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No users found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['User','Role','Care Setting','Status','Last Login','Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors border-l-4 border-transparent hover:border-l-teal-500">
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-slate-900">{u.full_name}</p>
                            {u.is_professional && <span className="badge-stable">Verified</span>}
                          </div>
                          <p className="text-sm text-slate-600">{u.email}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={getRoleBadgeColor(u.role)}>{u.role}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {u.care_setting
                          ? <span className="chip-teal">
                              {({ hospital_based:'Hospital', hospice:'Hospice', home_based:'Home', outpatient_clinic:'Clinic', long_term_residential:'Residential' })[u.care_setting] || u.care_setting}
                            </span>
                          : <span className="text-slate-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-2.5">
                        {u.is_active
                          ? <span className="badge-low flex items-center gap-1 w-fit"><CheckCircle size={12} /> Active</span>
                          : <span className="badge-critical flex items-center gap-1 w-fit"><AlertCircle size={12} /> Inactive</span>
                        }
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleMutation.mutate(u.id)} disabled={toggleMutation.isPending}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition ${u.is_active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`}>
                            {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button onClick={() => resetPasswordMutation.mutate(u.id)} disabled={resetPasswordMutation.isPending}
                            title="Reset Password"
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition">
                            <RefreshCw size={15} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={createMutation.mutate}
            pending={createMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
