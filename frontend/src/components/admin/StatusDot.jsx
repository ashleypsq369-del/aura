/**
 * StatusDot — semantic status indicator
 *
 * Services design DNA:
 *  - Same pulse animation as AvailBadge in Services
 *  - Pill variant for "active/available" states (matches AvailBadge)
 *  - Dot sizes: sm (6px) | md (8px) | lg (10px)
 *
 * <StatusDot color="#10b981" label="Active" pulse />
 * <StatusDot color="#ef4444" label="Locked" size="sm" />
 * <StatusDot color="#f59e0b" label="Pending" pill />
 */
export default function StatusDot({
  color,
  label,
  size  = 'md',
  pulse = false,
  pill  = false,
  className = '',
}) {
  const dotPx = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const fontSize = size === 'sm' ? 10 : 12;

  if (pill) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 10, fontWeight: 700,
        padding: '2px 8px', borderRadius: 999,
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }} className={className}>
        <span style={{
          width: dotPx, height: dotPx, borderRadius: '50%',
          background: color, flexShrink: 0,
          boxShadow: pulse ? `0 0 0 2px ${color}30` : 'none',
          animation: pulse ? 'pulse 2s infinite' : 'none',
        }} />
        {label}
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? 5 : 6,
      fontSize,
      fontWeight: 500,
      color: 'var(--text-600)',
    }} className={className}>
      <span style={{
        width: dotPx, height: dotPx, borderRadius: '50%',
        background: color, flexShrink: 0,
        boxShadow: pulse ? `0 0 0 3px ${color}25` : 'none',
        animation: pulse ? 'pulse 2s infinite' : 'none',
      }} />
      {label}
    </span>
  );
}
