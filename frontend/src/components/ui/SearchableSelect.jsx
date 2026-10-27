/**
 * SearchableSelect — universal searchable dropdown
 * =================================================
 * Replaces every plain <select> and hand-rolled PatientSearch/UserPicker
 * across the app with one consistent, accessible component.
 *
 * Props:
 *   options       — array of { value, label, sublabel?, avatar? }
 *   value         — currently selected value (string | null)
 *   onChange      — (value) => void
 *   placeholder   — placeholder text when nothing selected
 *   label         — optional label shown above the trigger
 *   allowClear    — show X to clear selection (default true)
 *   className     — wrapper class
 *   accent        — Tailwind color keyword: 'teal'|'blue'|'violet'|'rose'|'amber' (default 'teal')
 *   disabled      — disable the control
 *   maxItems      — max items to show in dropdown (default 30)
 *   emptyText     — text when no matches (default 'No results found')
 *   nullLabel     — optional "all / none" label for the null option
 *   size          — 'sm' | 'md' (default 'md')
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, Check } from 'lucide-react';

const ACCENT = {
  teal:   { ring: 'ring-teal-500/20',   border: 'border-teal-500',   hover: 'hover:bg-teal-50',   check: 'text-teal-600',   badge: 'bg-teal-500' },
  blue:   { ring: 'ring-blue-500/20',   border: 'border-teal-500',   hover: 'hover:bg-blue-50',   check: 'text-teal-600',   badge: 'bg-teal-500' },
  violet: { ring: 'ring-violet-500/20', border: 'border-teal-500', hover: 'hover:bg-violet-50', check: 'text-teal-600', badge: 'bg-teal-500' },
  rose:   { ring: 'ring-rose-500/20',   border: 'border-rose-500',   hover: 'hover:bg-rose-50',   check: 'text-rose-600',   badge: 'bg-rose-500' },
  amber:  { ring: 'ring-amber-500/20',  border: 'border-amber-500',  hover: 'hover:bg-amber-50',  check: 'text-amber-600',  badge: 'bg-amber-500' },
};

export default function SearchableSelect({
  options = [],
  value = null,
  onChange,
  placeholder = 'Select…',
  label,
  allowClear = true,
  className = '',
  accent = 'teal',
  disabled = false,
  maxItems = 30,
  emptyText = 'No results found',
  nullLabel = null,
  size = 'md',
}) {
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const a = ACCENT[accent] || ACCENT.teal;
  const sel = options.find(o => String(o.value) === String(value ?? ''));

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQ('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // Keyboard: Escape closes
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { setOpen(false); setQ(''); }
  }, []);

  const filtered = options.filter(o => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      String(o.label  || '').toLowerCase().includes(s) ||
      String(o.sublabel || '').toLowerCase().includes(s) ||
      String(o.value  || '').toLowerCase().includes(s)
    );
  }).slice(0, maxItems);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQ('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQ('');
  };

  const py = size === 'sm' ? 'py-1.5' : 'py-2.5';
  const textSz = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div ref={wrapRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setQ(''); setOpen(!open); } }}
        className={`w-full flex items-center gap-2 border-2 rounded-xl px-3 ${py} text-left transition-all
          bg-slate-50 dark:bg-slate-800
          ${open
            ? `${a.border} ring-2 ${a.ring} shadow-sm`
            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Avatar dot */}
        {sel?.avatar && (
          <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: sel.avatar }}>
            {String(sel.label || '?')[0]}
          </div>
        )}

        {/* Label */}
        <span className={`flex-1 truncate ${textSz} font-medium ${
          sel ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {sel ? sel.label : placeholder}
        </span>

        {/* Sublabel pill */}
        {sel?.sublabel && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 truncate max-w-[80px]">
            {sel.sublabel}
          </span>
        )}

        {/* Clear button */}
        {allowClear && sel && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={e => e.key === 'Enter' && handleClear(e)}
            className="flex-shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X size={13} />
          </span>
        )}

        {/* Chevron */}
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className="absolute z-[200] top-full left-0 right-0 mt-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '16rem' }}
          >
            {/* Search input */}
            <div className="sticky top-0 p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                <Search size={13} className="text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Type to search…"
                  className="flex-1 text-xs text-slate-700 dark:text-slate-200 bg-transparent outline-none placeholder-slate-400"
                />
                {q && (
                  <button onClick={() => setQ('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto" style={{ maxHeight: '11rem' }}>
              {/* Null / "all" option */}
              {nullLabel && (
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-400 dark:text-slate-500 ${a.hover} dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700 transition-colors`}
                >
                  <span className="flex-1 text-left">— {nullLabel}</span>
                  {value === null && <Check size={13} className={a.check} />}
                </button>
              )}

              {filtered.length === 0 ? (
                <div className="px-4 py-5 text-xs text-slate-400 text-center">{emptyText}</div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = String(opt.value) === String(value ?? '');
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 ${a.hover} dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors text-left
                        ${isSelected ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`}
                    >
                      {/* Avatar */}
                      {opt.avatar && (
                        <div
                          className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                          style={{ background: opt.avatar }}
                        >
                          {String(opt.label || '?')[0]}
                        </div>
                      )}

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`${textSz} font-semibold text-slate-800 dark:text-slate-100 truncate`}>
                          {opt.label}
                        </p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>

                      {/* Check */}
                      {isSelected && <Check size={14} className={`${a.check} flex-shrink-0`} />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Count footer when filtered */}
            {q && filtered.length > 0 && (
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
