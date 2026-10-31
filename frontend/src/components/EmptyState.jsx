/**
 * EmptyState — premium empty state component
 * Used when a list/table/section has no data.
 * 
 * Design: centered icon + title + description + optional CTA
 * Follows ui-ux-pro-max healthcare "Soft/Calm" style.
 */
import { motion } from 'framer-motion';
import {
  Users, MessageCircle, Bell, Calendar, Pill,
  FileText, Heart, Activity, BookOpen, Search,
  Inbox, ClipboardList, Star,
} from 'lucide-react';

const ICON_MAP = {
  patients:      Users,
  messages:      MessageCircle,
  notifications: Bell,
  appointments:  Calendar,
  medications:   Pill,
  documents:     FileText,
  memories:      Heart,
  vitals:        Activity,
  resources:     BookOpen,
  search:        Search,
  default:       Inbox,
  tasks:         ClipboardList,
  reviews:       Star,
};

export function EmptyState({
  icon,           // string key from ICON_MAP or a Lucide component
  title,
  description,
  action,         // { label, onClick, icon: ActionIcon }
  compact = false,
  color = '#0d9488',
}) {
  const Icon = typeof icon === 'string' ? (ICON_MAP[icon] || ICON_MAP.default) : (icon || ICON_MAP.default);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: compact ? '32px 24px' : '56px 32px',
      }}
    >
      {/* Icon bubble */}
      <div style={{
        width: compact ? 52 : 68, height: compact ? 52 : 68,
        borderRadius: compact ? 16 : 22,
        background: `${color}12`,
        border: `1.5px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: compact ? 14 : 20,
      }}>
        <Icon size={compact ? 22 : 28} style={{ color }} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <p style={{
        fontSize: compact ? 14 : 16, fontWeight: 700,
        color: 'var(--text-900)', marginBottom: 6, lineHeight: 1.3,
      }}>
        {title}
      </p>

      {/* Description */}
      {description && (
        <p style={{
          fontSize: compact ? 12 : 13, color: 'var(--text-500)',
          lineHeight: 1.6, maxWidth: 320, marginBottom: action ? 20 : 0,
        }}>
          {description}
        </p>
      )}

      {/* CTA button */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: color, color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 14px ${color}35`, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {action.icon && <action.icon size={14} />}
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// Legacy named exports used across the codebase
export function EmptyPatients({ onAdd }) {
  return (
    <EmptyState
      icon="patients"
      title="No patients found"
      description="No patients match your current filters. Try adjusting your search or add a new patient."
      action={onAdd ? { label: 'Add Patient', onClick: onAdd, icon: Users } : undefined}
      color="#0d9488"
    />
  );
}

export function EmptyAlerts() {
  return (
    <EmptyState
      icon="notifications"
      title="No alerts"
      description="All patients are stable. You'll be notified immediately if anything requires attention."
      color="#059669"
    />
  );
}

export function EmptyMessages({ onNew }) {
  return (
    <EmptyState
      icon="messages"
      title="No conversations yet"
      description="Start a conversation with your care team or a patient."
      action={onNew ? { label: 'New Message', onClick: onNew, icon: MessageCircle } : undefined}
      color="#0891b2"
    />
  );
}

export default EmptyState;
