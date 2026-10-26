import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserPlus, Loader2, CheckCircle, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';
import ModalShell from './ui/ModalShell';

import { API_URL } from '../api/client';

const ROLE_COLORS = {
  clinician: 'bg-teal-100 text-teal-700',
  caregiver: 'bg-purple-100 text-purple-700',
  patient:   'bg-blue-100 text-blue-700',
  family:    'bg-rose-100 text-rose-700',
  admin:     'bg-slate-100 text-slate-600',
  nurse:     'bg-cyan-100 text-cyan-700',
};

const AVATAR_GRADIENTS = [
  'from-teal-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-blue-500 to-indigo-500',
  'from-rose-500 to-orange-400',
  'from-amber-400 to-yellow-400',
  'from-green-500 to-emerald-500',
];

export default function AddContactModal({ isOpen, onClose, onContactAdded }) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const token = localStorage.getItem('auth_token');

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: () => axios.get(`${API_URL}/api/contacts/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query: searchQuery }
    }).then(r => r.data),
    enabled: searchQuery.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: (userId) => axios.post(`${API_URL}/api/contacts`,
      { contact_user_id: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['contacts']);
      toast.success('Contact added');
      onContactAdded?.(res.data.contact);
      handleClose();
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to add contact'),
  });

  const handleClose = () => { setSearchQuery(''); onClose(); };

  const users = searchResults?.users || [];

  if (!isOpen) return null;

  return (
    <ModalShell
      open={isOpen}
      onClose={handleClose}
      title="Add Contact"
      description="Search by name, username, or email"
      icon={UserPlus}
      accent="teal"
      size="md"
    >

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="search-wrap">
            <span className="search-icon"><Search size={16} /></span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for someone..."
              autoFocus
              className="w-full py-2.5 border border-slate-300 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 outline-none transition"
            />
            {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 animate-spin pointer-events-none" />}
          </div>
          {searchQuery.length === 1 && (
            <p className="text-xs text-slate-400 mt-1.5 ml-1">Type at least 2 characters</p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {searchQuery.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <Users size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Start typing to find people</p>
              <p className="text-xs mt-1">Doctors, caregivers, patients and more</p>
            </div>
          ) : searching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-teal-500 mb-3" />
              <p className="text-sm text-slate-500">Searching...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search size={28} className="text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No users found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400  mb-3">
                {users.length} result{users.length !== 1 ? 's' : ''}
              </p>
              {users.map((user, i) => {
                const gradient = AVATAR_GRADIENTS[(user.id || i) % AVATAR_GRADIENTS.length];
                const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.admin;
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all ${
                      user.is_contact
                        ? 'bg-slate-50 border-slate-200 opacity-70'
                        : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                      {user.avatar_initials || user.name?.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleColor}`}>
                          {user.role}
                        </span>
                        <span className="text-[10px] text-slate-400">@{user.username}</span>
                      </div>
                    </div>

                    {/* Action */}
                    {user.is_contact ? (
                      <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold flex-shrink-0">
                        <CheckCircle size={14} /> Added
                      </div>
                    ) : (
                      <button
                        onClick={() => addMutation.mutate(user.id)}
                        disabled={addMutation.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex-shrink-0 shadow-sm"
                      >
                        {addMutation.isPending
                          ? <Loader2 size={13} className="animate-spin" />
                          : <UserPlus size={13} />
                        }
                        Add
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-400">Added contacts appear in your Messages tab</p>
          <button onClick={handleClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
            Close
          </button>
        </div>
      </ModalShell>
  );
}

