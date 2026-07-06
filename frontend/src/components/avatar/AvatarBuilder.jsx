/**
 * AvatarBuilder.jsx - Guardian-style avatar customizer
 * Choose torso color, accent color, glow orb, and accessory
 */
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AvatarRenderer from './AvatarRenderer';
import {
  TORSO_COLORS, ACCENT_COLORS, GLOW_COLORS,
  GUARDIAN_ACCESSORIES, BACKGROUNDS, ROLE_PRESETS,
} from './avatarParts';

const TABS = [
  { id: 'torso',     label: 'Body',       icon: '🔵' },
  { id: 'accent',    label: 'Accent',     icon: '🟠' },
  { id: 'glow',      label: 'Glow',       icon: '✨' },
  { id: 'accessory', label: 'Accessory',  icon: '🎓' },
  { id: 'backdrop',  label: 'Backdrop',   icon: '🌈' },
];

// -- Color swatch ----------------------------------------------------------
function ColorSwatch({ items, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.hex || item.id)}
          title={item.label}
          aria-label={item.label}
          className="relative w-10 h-10 rounded-full border-4 transition-all hover:scale-110"
          style={{
            backgroundColor: item.hex || item.from,
            borderColor: (item.hex === selected || item.id === selected) ? '#0d9488' : 'transparent',
            boxShadow: (item.hex === selected || item.id === selected)
              ? '0 0 0 2px #0d9488, 0 2px 8px rgba(0,0,0,0.2)'
              : '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          {(item.hex === selected || item.id === selected) && (
            <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" />
          )}
        </button>
      ))}
    </div>
  );
}

// -- Accessory option ------------------------------------------------------
function AccessoryOption({ item, selected, onSelect, accentColor }) {
  const active = selected === item.id;
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
        active
          ? 'border-teal-500 bg-teal-50 text-teal-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
      }`}
    >
      <AvatarRenderer
        config={{ accentColor, torsoColor: '#7096b8', accessory: item.id, glowColor: '#ffffff' }}
        size={52}
      />
      <span>{item.label}</span>
    </button>
  );
}

export default function AvatarBuilder({ initialConfig, onSave, onCancel }) {
  const { user } = useAuth();
  const rolePreset = ROLE_PRESETS[user?.role] || ROLE_PRESETS.patient;

  const [config, setConfig] = useState(() => ({
    torsoColor:  rolePreset.torsoColor  || '#7096b8',
    accentColor: rolePreset.accentColor || '#b86830',
    glowColor:   rolePreset.glowColor   || '#ffffff',
    accessory:   rolePreset.accessory   || 'none',
    background:  rolePreset.background  || 'teal',
    ...initialConfig,
  }));

  const [tab, setTab] = useState('torso');

  const update = useCallback((key, val) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  }, []);

  const reset = () => setConfig({
    torsoColor:  rolePreset.torsoColor  || '#7096b8',
    accentColor: rolePreset.accentColor || '#b86830',
    glowColor:   rolePreset.glowColor   || '#ffffff',
    accessory:   rolePreset.accessory   || 'none',
    background:  rolePreset.background  || 'teal',
  });

  const bg = BACKGROUNDS.find(b => b.id === config.background) || BACKGROUNDS[0];
  const bgStyle = { background: `linear-gradient(135deg, ${bg.from}, ${bg.to})` };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden">

      {/* Preview */}
      <div className="flex-shrink-0 flex flex-col items-center py-8 px-4" style={bgStyle}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }}
        >
          <AvatarRenderer config={config} size={140} />
        </motion.div>
        <p className="text-white/80 text-xs mt-3 font-semibold uppercase tracking-wider">
          {user?.full_name?.split(' ')[0] || 'Your'} Guardian
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 overflow-x-auto flex-shrink-0 bg-slate-50">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
              tab === t.id
                ? 'border-teal-500 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto p-4">

        {tab === 'torso' && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Body & Head Color
            </p>
            <ColorSwatch
              items={TORSO_COLORS}
              selected={config.torsoColor}
              onSelect={v => update('torsoColor', v)}
            />
          </div>
        )}

        {tab === 'accent' && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Accent Color - Left Arm & Lower Body
            </p>
            <ColorSwatch
              items={ACCENT_COLORS}
              selected={config.accentColor}
              onSelect={v => update('accentColor', v)}
            />
          </div>
        )}

        {tab === 'glow' && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Chest Orb Glow Color
            </p>
            <ColorSwatch
              items={GLOW_COLORS}
              selected={config.glowColor}
              onSelect={v => update('glowColor', v)}
            />
          </div>
        )}

        {tab === 'accessory' && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Accessory
            </p>
            <div className="grid grid-cols-3 gap-2">
              {GUARDIAN_ACCESSORIES.map(item => (
                <AccessoryOption
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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Background
            </p>
            <div className="grid grid-cols-5 gap-2">
              {BACKGROUNDS.map(b => (
                <button
                  key={b.id}
                  onClick={() => update('background', b.id)}
                  title={b.label}
                  className="relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${b.from}, ${b.to})`,
                    borderColor: config.background === b.id ? '#0d9488' : 'transparent',
                    boxShadow: config.background === b.id ? '0 0 0 2px #0d9488' : 'none',
                  }}
                >
                  {config.background === b.id && (
                    <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-100 bg-white flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw size={13} /> Reset
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={() => onSave?.(config)}
          className="flex-1 py-2 text-xs font-bold text-white rounded-lg transition-colors"
          style={{ background: 'linear-gradient(135deg, #4a6a88, #5a7d9e)' }}
        >
          Save Guardian
        </button>
      </div>
    </div>
  );
}
