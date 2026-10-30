import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Star, Users, Loader2, MessageCircle } from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import ContactCard from './ContactCard';
import AddContactModal from './AddContactModal';

import { API_URL } from '../api/client';

export default function ContactsTab({ onContactMessage }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favOnly,     setFavOnly]     = useState(false);
  const [showAddModal,setShowAddModal]= useState(false);
  const qc    = useQueryClient();
  const token = localStorage.getItem('auth_token');

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', favOnly, searchQuery],
    queryFn: () => axios.get(`${API_URL}/api/contacts`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { favorites_only: favOnly, search: searchQuery || undefined }
    }).then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: frequentData } = useQuery({
    queryKey: ['frequent-contacts'],
    queryFn: () => axios.get(`${API_URL}/api/contacts/frequent`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.data),
  });

  const toggleFavMutation = useMutation({
    mutationFn: ({ contactId, isFavorite }) =>
      axios.put(`${API_URL}/api/contacts/${contactId}`, { is_favorite: !isFavorite }, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['frequent-contacts'] });
    },
    onError: e => toast.error(e.response?.data?.detail || 'Failed to update'),
  });

  const contacts  = contactsData?.contacts || [];
  const frequent  = frequentData?.contacts || [];
  const favorites = contacts.filter(c => c.is_favorite);
  const others    = contacts.filter(c => !c.is_favorite);
  const onlineCount = contacts.filter(c => c.is_online).length;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <Loader2 size={32} className="animate-spin text-teal-500" />
      <p className="text-sm font-medium">Loading contacts...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--card-border)]/50 bg-[var(--card-bg)] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-[var(--text-900)] text-sm flex items-center gap-2">
              <Users size={16} className="text-teal-600" /> Contacts
            </h2>
            <p className="text-[10px] text-[var(--text-400)] mt-0.5">
              {contacts.length} total &middot; {onlineCount} online
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <UserPlus size={13} /> Add
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-400)] pointer-events-none"/>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 outline-none transition"
          />
        </div>

        {/* Favourites toggle */}
        <button
          onClick={() => setFavOnly(!favOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
            favOnly
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-[var(--card-bg)] text-[var(--text-500)] border-[var(--card-border)] hover:border-slate-300'
          }`}
        >
          <Star size={11} className={favOnly ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
          Favourites only
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {contacts.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-slate-300" />
            </div>
            <p className="font-semibold text-[var(--text-600)] text-sm">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </p>
            <p className="text-xs mt-1 mb-5">
              {searchQuery ? 'Try a different search term' : 'Add people from your care team'}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition">
                <UserPlus size={13} /> Add First Contact
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Frequently messaged */}
            {!searchQuery && !favOnly && frequent.length > 0 && (
              <Section icon={MessageCircle} label="Frequently Messaged">
                {frequent.slice(0, 3).map(fc => {
                  const full = contacts.find(c => c.contact_user_id === fc.contact_user_id);
                  if (!full) return null;
                  return (
                    <ContactCard key={fc.id} contact={full}
                      onMessage={c => onContactMessage?.(c.contact_user_id)}
                      onFavorite={c => toggleFavMutation.mutate({ contactId: c.id, isFavorite: c.is_favorite })}
                    />
                  );
                })}
              </Section>
            )}

            {/* Favourites */}
            {!searchQuery && favorites.length > 0 && (
              <Section icon={Star} label="Favourites" iconClass="fill-amber-400 text-amber-500">
                {favorites.map(c => (
                  <ContactCard key={c.id} contact={c}
                    onMessage={c => onContactMessage?.(c.contact_user_id)}
                    onFavorite={c => toggleFavMutation.mutate({ contactId: c.id, isFavorite: c.is_favorite })}
                  />
                ))}
              </Section>
            )}

            {/* All contacts */}
            {!favOnly && others.length > 0 && (
              <Section icon={Users} label={searchQuery ? 'Results' : 'All Contacts'}>
                {others.map(c => (
                  <ContactCard key={c.id} contact={c}
                    onMessage={c => onContactMessage?.(c.contact_user_id)}
                    onFavorite={c => toggleFavMutation.mutate({ contactId: c.id, isFavorite: c.is_favorite })}
                  />
                ))}
              </Section>
            )}

            {favOnly && favorites.length === 0 && (
              <div className="text-center py-14 text-slate-400">
                <Star size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-sm text-slate-600">No favourites yet</p>
                <button onClick={() => setFavOnly(false)} className="mt-3 text-xs text-teal-600 font-semibold hover:underline">
                  View all contacts
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onContactAdded={c => { if (c) onContactMessage?.(c.contact_user_id); }}
      />
    </div>
  );
}

function Section({ icon: Icon, label, iconClass = 'text-slate-400', children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-[var(--text-400)]  mb-2 flex items-center gap-1.5">
        <Icon size={11} className={iconClass} /> {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
