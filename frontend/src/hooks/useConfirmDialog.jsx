/**
 * useConfirmDialog — replaces all window.confirm() calls with a proper modal
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirmDialog();
 *   // In JSX: <ConfirmDialog />
 *   // To trigger: await confirm({ title, body, confirmLabel, variant })
 */
import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function useConfirmDialog() {
  const [state, setState] = useState(null); // { title, body, confirmLabel, variant, resolve }
  const resolveRef = useRef(null);

  const confirm = useCallback(({ title, body, confirmLabel = 'Confirm', variant = 'danger' }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ title, body, confirmLabel, variant });
    });
  }, []);

  const handleConfirm = () => {
    setState(null);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState(null);
    resolveRef.current?.(false);
  };

  const variantCfg = {
    danger:  { icon: Trash2,         iconBg: '#fef2f2', iconColor: '#dc2626', btnBg: '#dc2626', btnHover: '#b91c1c' },
    warning: { icon: AlertTriangle,   iconBg: '#fffbeb', iconColor: '#d97706', btnBg: '#d97706', btnHover: '#b45309' },
    info:    { icon: AlertTriangle,   iconBg: '#eff6ff', iconColor: '#1d4ed8', btnBg: '#1d4ed8', btnHover: '#1e40af' },
  };

  const ConfirmDialog = () => {
    if (!state) return null;
    const cfg = variantCfg[state.variant] || variantCfg.danger;
    const Icon = cfg.icon;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={handleCancel}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--card-bg)', borderRadius: 18,
              border: '1px solid var(--card-border)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              width: '100%', maxWidth: 380, padding: '28px 24px 20px',
            }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: cfg.iconBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 16,
            }}>
              <Icon size={24} style={{ color: cfg.iconColor }}/>
            </div>
            {/* Title */}
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-900)', marginBottom: 8 }}>
              {state.title}
            </p>
            {/* Body */}
            {state.body && (
              <p style={{ fontSize: 13, color: 'var(--text-500)', lineHeight: 1.6, marginBottom: 20 }}>
                {state.body}
              </p>
            )}
            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCancel}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: 'var(--page-bg)', color: 'var(--text-700)',
                  border: '1.5px solid var(--card-border)', cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button onClick={handleConfirm}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 800,
                  background: cfg.btnBg, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  boxShadow: `0 4px 14px ${cfg.btnBg}44`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = cfg.btnHover}
                onMouseLeave={e => e.currentTarget.style.background = cfg.btnBg}
              >
                {state.confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  return { confirm, ConfirmDialog };
}
