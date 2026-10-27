/**
 * AvatarBuilder.jsx — Guardian customiser
 *
 * Design principles:
 *  • Full-bleed gradient preview panel with frosted-glass name plate
 *  • Icon + label tab bar (no emojis) with a smooth sliding active indicator
 *  • Large, spaced color swatches with visible labels on hover
 *  • Section headings that read as product copy, not debug labels
 *  • Accessible: focus rings, aria-pressed, aria-label on every swatch
 *  • Footer: tonal secondary "Reset" + bold primary "Save" — no grey gradient
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Save,
  Layers, Palette, Zap, Sparkles, Image,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AvatarRenderer from './AvatarRenderer';
import {
  TORSO_COLORS, ACCENT_COLORS, GLOW_COLORS,
  GUARDIAN_ACCESSORIES, BACKGROUNDS, ROLE_PRESETS,
} from './avatarParts';

/* ─── Tab definition ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'torso',     label: 'Body',      Icon: Layers   },
  { id: 'accent',    label: 'Accent',    Icon: Palette  },
  { id: 'glow',      label: 'Glow',      Icon: Zap      },
  { id: 'accessory', label: 'Accessory', Icon: Sparkles },
  { id: 'backdrop',  label: 'Backdrop',  Icon: Image    },
];

/* ─── Color swatch ─────────────────────────────────────────────────────────
   Larger hit area, label shown below on hover, clean ring active state.      */
function ColorSwatch({ items, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(item => {
        const isActive = item.hex === selected || item.id === selected;
        return (
          <div key={item.id} className="flex flex-col items-center gap-1 group">
            <button
              onClick={() => onSelect(item.hex || item.id)}
              aria-label={item.label}
              aria-pressed={isActive}
              title={item.label}
              className={`
                relative w-11 h-11 rounded-2xl transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500
                ${isActive
                  ? 'scale-110 shadow-lg ring-2 ring-offset-2 ring-teal-500'
                  : 'hover:scale-105 hover:shadow-md ring-2 ring-transparent'
                }
              `}
              style={{ backgroundColor: item.hex || item.from }}
            >
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="w-3 h-3 rounded-full bg-slate-50 shadow-sm opacity-90" />
                </motion.span>
              )}
            </button>
            {/* Label fades in on hover */}
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors leading-none max-w-[44px] text-center truncate">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Accessory card ──────────────────────────────────────────────────────── */
function AccessoryCard({ item, selected, onSelect, accentColor }) {
  const active = selected === item.id;
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onSelect(item.id)}
      aria-pressed={active}
      className={`
        flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
        ${active
          ? 'border-teal-500 bg-teal-50 shadow-sm'
          : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:shadow-sm'
        }
      `}
    >
      <AvatarRenderer
        config={{ accentColor, torsoColor: '#7096b8', accessory: item.id, glowColor: '#ffffff' }}
        size={54}
      />
      <span className={`text-[11px] font-semibold leading-none ${active ? 'text-teal-700' : 'text-slate-500'}`}>
        {item.label}
      </span>
    </motion.button>
  );
}

/* ─── Backdrop card ───────────────────────────────────────────────────────── */
function BackdropCard({ item, selected, onSelect }) {
  const active = selected === item.id;
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onSelect(item.id)}
      aria-label={item.label}
      aria-pressed={active}
      title={item.label}
      className={`
        relative w-full aspect-[4/3] rounded-2xl border-2 overflow-hidden transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-teal-500
        ${active ? 'border-teal-500 shadow-md' : 'border-transparent hover:border-slate-200 hover:shadow-sm'}
      `}
      style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
    >
      {active && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="w-5 h-5 rounded-full bg-white/90 shadow flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          </span>
        </motion.span>
      )}
      {/* label */}
      <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white/80 drop-shadow leading-none">
        {item.label}
      </span>
    </motion.button>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1 leading-snug">{subtitle}</p>}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function AvatarBuilder({ initialConfig, onSave, onCancel }) {
  const { user } = useAuth();
  const rolePreset = ROLE_PRESETS[user?.role] || ROLE_PRESETS.patient;
  const tabBarRef = useRef(null);

  const [config, setConfig] = useState(() => ({
    torsoColor:  rolePreset.torsoColor  || '#7096b8',
    accentColor: rolePreset.accentColor || '#b86830',
    glowColor:   rolePreset.glowColor   || '#ffffff',
    accessory:   rolePreset.accessory   || 'none',
    background:  rolePreset.background  || 'teal',
    ...initialConfig,
  }));

  const [tab, setTab] = useState('torso');
  const [saved, setSaved] = useState(false);

  const update = useCallback((key, val) => {
    setConfig(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }, []);

  const reset = () => {
    setConfig({
      torsoColor:  rolePreset.torsoColor  || '#7096b8',
      accentColor: rolePreset.accentColor || '#b86830',
      glowColor:   rolePreset.glowColor   || '#ffffff',
      accessory:   rolePreset.accessory   || 'none',
      background:  rolePreset.background  || 'teal',
    });
    setSaved(false);
  };

  const handleSave = () => {
    onSave?.(config);
    setSaved(true);
  };

  const bg = BACKGROUNDS.find(b => b.id === config.background) || BACKGROUNDS[0];
  const displayName = user?.full_name?.split(' ')[0] || user?.username || 'Your';

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden shadow-xl">

      {/* ── Preview panel ────────────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 flex flex-col items-center justify-center py-10 px-6 overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${bg.from}, ${bg.to})` }}
      >
        {/* Decorative soft circles */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-10 translate-x-10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-black/10 translate-y-8 -translate-x-8 blur-2xl pointer-events-none" />

        {/* Avatar */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.25))' }}
        >
          <AvatarRenderer config={config} size={148} />
        </motion.div>

        {/* Name plate */}
        <div className="mt-4 px-5 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/20">
          <p className="text-white text-sm font-semibold tracking-wide">
            {displayName}'s Guardian
          </p>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div
        ref={tabBarRef}
        className="relative flex border-b border-slate-100 bg-slate-50 overflow-x-auto flex-shrink-0 scrollbar-none"
        role="tablist"
        aria-label="Customise category"
      >
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`
                relative flex flex-col items-center gap-1 px-5 pt-3 pb-2.5 text-[11px] font-semibold
                whitespace-nowrap transition-colors flex-1 min-w-0
                focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-teal-500
                ${active ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              <t.Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
              <span className="leading-none">{t.label}</span>
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-teal-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Controls area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >

            {tab === 'torso' && (
              <div>
                <SectionTitle
                  title="Body colour"
                  subtitle="Sets the main colour for the head and torso."
                />
                <ColorSwatch
                  items={TORSO_COLORS}
                  selected={config.torsoColor}
                  onSelect={v => update('torsoColor', v)}
                />
              </div>
            )}

            {tab === 'accent' && (
              <div>
                <SectionTitle
                  title="Accent colour"
                  subtitle="Applied to the arms and lower body for contrast."
                />
                <ColorSwatch
                  items={ACCENT_COLORS}
                  selected={config.accentColor}
                  onSelect={v => update('accentColor', v)}
                />
              </div>
            )}

            {tab === 'glow' && (
              <div>
                <SectionTitle
                  title="Core glow"
                  subtitle="The pulsing orb on your guardian's chest."
                />
                <ColorSwatch
                  items={GLOW_COLORS}
                  selected={config.glowColor}
                  onSelect={v => update('glowColor', v)}
                />
              </div>
            )}

            {tab === 'accessory' && (
              <div>
                <SectionTitle
                  title="Accessory"
                  subtitle="Give your guardian something to hold."
                />
                <div className="grid grid-cols-3 gap-2.5">
                  {GUARDIAN_ACCESSORIES.map(item => (
                    <AccessoryCard
                      key={item.id}
                      item={item}
                      selected={config.accessory}
                      onSelect={v => update('accessory', v)}
                      accentColor={config.accentColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === 'backdrop' && (
              <div>
                <SectionTitle
                  title="Backdrop"
                  subtitle="The gradient shown behind your guardian."
                />
                <div className="grid grid-cols-4 gap-2.5">
                  {BACKGROUNDS.map(b => (
                    <BackdropCard
                      key={b.id}
                      item={b}
                      selected={config.background}
                      onSelect={v => update('background', v)}
                    />
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer actions ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">

        {/* Reset — subtle tonal */}
        <button
          onClick={reset}
          aria-label="Reset to default"
          title="Reset to default"
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <RefreshCw size={13} />
          Reset
        </button>

        {/* Cancel */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
        )}

        {/* Save — teal CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="flex-[2] flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1"
          style={{
            background: saved
              ? 'linear-gradient(135deg, #059669, #10b981)'
              : 'linear-gradient(135deg, #0d9488, #0891b2)',
            boxShadow: '0 2px 12px rgba(13,148,136,0.35)',
          }}
        >
          <Save size={13} strokeWidth={2.5} />
          {saved ? 'Saved!' : 'Save Guardian'}
        </motion.button>

      </div>
    </div>
  );
}
