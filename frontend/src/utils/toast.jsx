/**
 * toast.jsx — Unified toast API wrapping Sonner
 *
 * Sonner (used by shadcn/ui) is the best modern toast library:
 * - Beautiful floating cards, no vertical bar
 * - Adaptive light / dark mode automatically
 * - Smooth spring animations
 * - Stacks and collapses elegantly
 * - Built-in types: success, error, warning, info, loading, promise
 *
 * This wrapper gives the whole app a single consistent API:
 *   toast.success('Saved!')
 *   toast.error('Failed')
 *   toast.info('FYI')
 *   toast.warning('Check this')
 *   toast.loading('Saving...')
 *   toast.promise(promise, { loading, success, error })
 */

import { toast as sonnerToast } from 'sonner';

// ── Normalise message — handles FastAPI 422 error arrays ──────────────────
function normalise(msg) {
  if (typeof msg === 'string') return msg;
  if (Array.isArray(msg)) {
    return msg.map(e => {
      const field = Array.isArray(e.loc) ? e.loc.filter(l => l !== 'body').join('.') : '';
      return field ? `${field}: ${e.msg}` : e.msg;
    }).join(' · ');
  }
  if (msg && typeof msg === 'object') {
    return msg.message || msg.detail || msg.msg || JSON.stringify(msg);
  }
  return String(msg ?? 'An error occurred');
}

// ── Build options from our opts format into Sonner format ─────────────────
function buildOpts(opts = {}) {
  const sonnerOpts = {};
  if (opts.duration)     sonnerOpts.duration     = opts.duration;
  if (opts.id)           sonnerOpts.id            = opts.id;
  if (opts.title)        sonnerOpts.description   = undefined; // title IS the message in sonner
  if (opts.description)  sonnerOpts.description   = opts.description;
  if (opts.action)       sonnerOpts.action        = opts.action;
  if (opts.cancel)       sonnerOpts.cancel        = opts.cancel;
  if (opts.onDismiss)    sonnerOpts.onDismiss     = opts.onDismiss;
  if (opts.onAutoClose)  sonnerOpts.onAutoClose   = opts.onAutoClose;
  return sonnerOpts;
}

// ── Public API ────────────────────────────────────────────────────────────
const toast = {
  /**
   * Success toast — green checkmark
   * @param {string|object} msg
   * @param {object} opts — { duration, id, description, action }
   */
  success: (msg, opts = {}) => {
    const text = normalise(msg);
    const extra = opts.title ? { description: text } : {};
    return sonnerToast.success(opts.title || text, {
      duration: opts.duration ?? 3500,
      id: opts.id,
      ...extra,
      ...buildOpts(opts),
    });
  },

  /**
   * Error toast — red × 
   */
  error: (msg, opts = {}) => {
    const text = normalise(msg);
    const extra = opts.title ? { description: text } : {};
    return sonnerToast.error(opts.title || text, {
      duration: opts.duration ?? 6000,
      id: opts.id,
      ...extra,
      ...buildOpts(opts),
    });
  },

  /**
   * Info toast — blue i
   */
  info: (msg, opts = {}) => {
    const text = normalise(msg);
    const extra = opts.title ? { description: text } : {};
    return sonnerToast.info(opts.title || text, {
      duration: opts.duration ?? 4000,
      id: opts.id,
      ...extra,
      ...buildOpts(opts),
    });
  },

  /**
   * Warning toast — amber ⚠
   */
  warning: (msg, opts = {}) => {
    const text = normalise(msg);
    const extra = opts.title ? { description: text } : {};
    return sonnerToast.warning(opts.title || text, {
      duration: opts.duration ?? 5000,
      id: opts.id,
      ...extra,
      ...buildOpts(opts),
    });
  },

  /**
   * Default / neutral toast
   */
  show: (msg, opts = {}) => {
    const text = normalise(msg);
    return sonnerToast(text, {
      duration: opts.duration ?? 4000,
      id: opts.id,
      ...buildOpts(opts),
    });
  },

  /**
   * Loading toast — spinner, stays until dismissed or updated
   */
  loading: (msg, opts = {}) => {
    const text = normalise(msg);
    return sonnerToast.loading(text, {
      id: opts.id,
      ...buildOpts(opts),
    });
  },

  /**
   * Promise toast — loading → success/error automatically
   * @param {Promise} promise
   * @param {{ loading, success, error }} msgs
   */
  promise: (promise, msgs, opts = {}) =>
    sonnerToast.promise(promise, {
      loading: msgs.loading || 'Loading...',
      success: msgs.success || 'Done!',
      error:   (err) => typeof msgs.error === 'function'
        ? msgs.error(err)
        : (msgs.error || normalise(err)),
      ...buildOpts(opts),
    }),

  /**
   * Dismiss a toast by id, or all if no id given
   */
  dismiss:    (id) => sonnerToast.dismiss(id),
  dismissAll: ()   => sonnerToast.dismiss(),
};

export default toast;
