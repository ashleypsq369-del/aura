/**
 * clinicalToast.js - HIPAA-safe Sonner toasts for clinical views
 * ==============================================================
 * HIPAA Rule: Never show PHI in toast bodies.
 * Design: Matches toast.jsx - clean pill, left accent, inline icon.
 */

import { toast } from 'sonner';

const PHI_PATTERNS = [
  /\b(\d+)\s*mg\b/gi,
  /\b(morphine|tramadol|codeine|fentanyl|oxycodone|methadone|paracetamol|diazepam|ondansetron)\b/gi,
  /\b(cancer|tumou?r|carcinoma|metastasi[sc]|cirrhosis|failure)\b/gi,
];

function sanitise(message) {
  if (typeof message !== 'string') return message;
  let safe = message;
  for (const p of PHI_PATTERNS) safe = safe.replace(p, '[clinical data]');
  return safe;
}

export const clinicalToast = {
  success: (msg, opts) => toast.success(sanitise(msg), { duration: 3500, ...opts }),
  warning: (msg, opts) => toast.warning(sanitise(msg), { duration: 5000, ...opts }),
  error:   (msg, opts) => toast.error(sanitise(msg),   { duration: 6000, ...opts }),
  info:    (msg, opts) => toast.info(sanitise(msg),    { duration: 4000, ...opts }),
  alert:   (msg, opts) => toast(sanitise(msg),         { duration: Infinity, closeButton: true, ...opts }),
  loading: (msg, opts) => toast.loading(sanitise(msg), opts),
  dismiss: (id)        => toast.dismiss(id),
};

export default clinicalToast;
