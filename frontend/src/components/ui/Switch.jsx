/**
 * Switch.jsx - Clean CSS pill toggle
 * Always renders correctly in light and dark mode.
 * White thumb on teal (on) or slate-300 (off) track.
 */
import { useId } from 'react';

export default function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  color = '#0d9488',
  id,
}) {
  const autoId = useId();
  const switchId = id || autoId;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <label htmlFor={switchId} className="text-sm text-[var(--text-700)] cursor-pointer select-none">
          {label}
        </label>
      )}

      <button
        id={switchId}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: 44,
          height: 24,
          borderRadius: 12,
          padding: '2px',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: checked ? color : '#cbd5e1',
          transition: 'background-color 0.2s ease',
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
        }}
        onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${color}40`}
        onBlur={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <span
          style={{
            display: 'block',
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transform: checked ? 'translateX(20px)' : 'translateX(0px)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>
    </div>
  );
}
