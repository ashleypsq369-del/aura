import { motion } from 'framer-motion';
import { Star, MessageCircle } from 'lucide-react';

const ROLE_COLORS = {
  clinician: 'bg-teal-100 text-teal-700',
  caregiver: 'bg-purple-100 text-purple-700',
  patient:   'bg-blue-100 text-blue-700',
  family:    'bg-rose-100 text-rose-700',
  admin:     'bg-slate-100 text-slate-600',
  nurse:     'bg-cyan-100 text-cyan-700',
};

const AVATAR_COLORS = [
  'from-teal-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-blue-500 to-indigo-500',
  'from-rose-500 to-orange-400',
  'from-amber-400 to-yellow-500',
  'from-green-500 to-emerald-500',
];

function avatarColor(name) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getLastSeenText(contact) {
  if (contact.is_online) return null;
  if (!contact.last_seen) return 'Offline';
  const diff = Math.floor((Date.now() - new Date(contact.last_seen)) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function ContactCard({ contact, onClick, onFavorite }) {
  const lastSeen  = getLastSeenText(contact);
  const roleColor = ROLE_COLORS[contact.role] || ROLE_COLORS.admin;
  const gradient  = avatarColor(contact.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-md cursor-pointer transition-all group"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
          {contact.avatar_initials || contact.name?.charAt(0)?.toUpperCase()}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
          contact.is_online ? 'bg-green-500' : 'bg-slate-300'
        }`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {contact.nickname || contact.name}
          </p>
          {contact.is_favorite && (
            <Star size={11} className="text-amber-500 fill-amber-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleColor}`}>
            {contact.role}
          </span>
          {contact.is_online ? (
            <span className="text-[10px] text-green-600 font-semibold">● Online</span>
          ) : lastSeen ? (
            <span className="text-[10px] text-slate-400">{lastSeen}</span>
          ) : null}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {contact.unread_count > 0 && (
          <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
            {contact.unread_count > 9 ? '9+' : contact.unread_count}
          </span>
        )}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageCircle size={16} className="text-teal-500" />
        </span>
        <button
          onClick={e => { e.stopPropagation(); onFavorite?.(contact); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title={contact.is_favorite ? 'Remove favourite' : 'Add to favourites'}
        >
          <Star size={14} className={contact.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
        </button>
      </div>
    </motion.div>
  );
}
