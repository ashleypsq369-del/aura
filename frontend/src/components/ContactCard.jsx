/**
 * ContactCard — Rich contact card for the Contacts tab
 * =====================================================
 * Shows: avatar, online status, role badge, last seen, phone,
 * unread count, favourite toggle, message/remove/block actions.
 *
 * All actions are functional:
 *  - Message  → calls onMessage(contact) which opens the conversation
 *  - Favourite → toggles star (optimistic)
 *  - Remove   → removes contact with confirmation
 *  - Block    → blocks contact
 *  - Phone    → opens tel: link if phone number present
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MessageCircle, MoreVertical, Trash2,
  ShieldOff, Phone, CheckCircle, Clock,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';
import { API_URL } from '../api/client';

const ROLE_COLORS = {
  clinician: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  caregiver: { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' },
  patient:   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  family:    { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  admin:     { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
  nurse:     { bg: '#ecfeff', text: '#0891b2', border: '#a5f3fc' },
};

const AVATAR_GRADIENTS = [
  ['#0d9488', '#0891b2'], // teal-cyan
  ['#7c3aed', '#db2777'], // purple-pink
  ['#1d4ed8', '#0891b2'], // blue-cyan
  ['#be123c', '#f97316'], // rose-orange
  ['#d97706', '#f59e0b'], // amber
  ['#059669', '#0d9488'], // green-teal
];

function getGradient(name) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  const [a, b] = AVATAR_GRADIENTS[idx];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function lastSeenText(contact) {
  if (contact.is_online) return null;
  if (!contact.last_seen) return 'Offline';
  const diff = Math.floor((Date.now() - new Date(contact.last_seen)) / 60000);
  if (diff < 2)    return 'Just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
  return 'Long time ago';
}

export default function ContactCard({ contact, onMessage, onFavorite, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const qc = useQueryClient();
  const token = localStorage.getItem('auth_token');

  const roleStyle = ROLE_COLORS[contact.role] || ROLE_COLORS.admin;
  const lastSeen  = lastSeenText(contact);
  const displayName = contact.nickname || contact.name;
  const initials = contact.avatar_initials || displayName?.slice(0, 2).toUpperCase() || '?';

  const blockMutation = useMutation({
    mutationFn: () => axios.put(`${API_URL}/api/contacts/${contact.id}`,
      { is_blocked: true },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`${displayName} blocked`);
      setMenuOpen(false);
    },
    onError: () => toast.error('Could not block contact'),
  });

  const removeMutation = useMutation({
    mutationFn: () => axios.delete(`${API_URL}/api/contacts/${contact.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['frequent-contacts'] });
      toast.success(`${displayName} removed`);
      onRemove?.(contact);
      setMenuOpen(false);
      setConfirmRemove(false);
    },
    onError: () => toast.error('Could not remove contact'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3.5 p-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
            style={{ background: getGradient(contact.name) }}
          >
            {initials}
          </div>
          {/* Online indicator */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
            contact.is_online ? 'bg-green-500' : 'bg-slate-300'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-semibold text-slate-900 text-sm truncate">{displayName}</p>
            {contact.nickname && (
              <span className="text-[9px] text-slate-400 font-medium truncate hidden sm:inline">
                ({contact.name})
              </span>
            )}
            {contact.is_favorite && (
              <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Role badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}` }}>
              {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
            </span>
            {/* Online / last seen */}
            {contact.is_online ? (
              <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-semibold">
                <CheckCircle size={9}/> Online
              </span>
            ) : lastSeen && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <Clock size={9}/> {lastSeen}
              </span>
            )}
          </div>

          {/* Phone number if available */}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-800 font-medium mt-1 w-fit">
              <Phone size={9}/> {contact.phone}
            </a>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Unread badge */}
          {contact.unread_count > 0 && (
            <span className="min-w-[20px] h-5 px-1 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {contact.unread_count > 9 ? '9+' : contact.unread_count}
            </span>
          )}

          {/* Favourite toggle */}
          <button
            onClick={e => { e.stopPropagation(); onFavorite?.(contact); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title={contact.is_favorite ? 'Remove favourite' : 'Add to favourites'}
          >
            <Star size={14} className={contact.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-400'} />
          </button>

          {/* Message button */}
          <button
            onClick={e => { e.stopPropagation(); onMessage?.(contact); }}
            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-800 transition-colors"
            title="Send message"
          >
            <MessageCircle size={14}/>
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); setConfirmRemove(false); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="More actions"
            >
              <MoreVertical size={14}/>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => { setMenuOpen(false); setConfirmRemove(false); }}/>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-8 z-50 w-44 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { onMessage?.(contact); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      <MessageCircle size={14}/> Message
                    </button>

                    <button
                      onClick={() => { onFavorite?.(contact); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                    >
                      <Star size={14} className={contact.is_favorite ? 'fill-amber-400 text-amber-400' : ''} />
                      {contact.is_favorite ? 'Remove favourite' : 'Add to favourites'}
                    </button>

                    {contact.phone && (
                      <a href={`tel:${contact.phone}`}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Phone size={14}/> Call {contact.phone}
                      </a>
                    )}

                    <div className="border-t border-slate-100"/>

                    <button
                      onClick={() => { blockMutation.mutate(); }}
                      disabled={blockMutation.isPending}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                    >
                      <ShieldOff size={14}/> Block contact
                    </button>

                    {!confirmRemove ? (
                      <button
                        onClick={() => setConfirmRemove(true)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14}/> Remove contact
                      </button>
                    ) : (
                      <div className="px-3.5 py-2.5 bg-red-50">
                        <p className="text-[11px] text-red-700 font-semibold mb-2">Remove {displayName}?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => removeMutation.mutate()}
                            disabled={removeMutation.isPending}
                            className="flex-1 py-1 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            {removeMutation.isPending ? '...' : 'Remove'}
                          </button>
                          <button
                            onClick={() => setConfirmRemove(false)}
                            className="flex-1 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Message count footer */}
      {contact.message_count > 0 && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-[10px] text-slate-400">
            {contact.message_count} message{contact.message_count !== 1 ? 's' : ''} exchanged
          </p>
        </div>
      )}
    </motion.div>
  );
}
